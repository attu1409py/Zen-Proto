/**
 * games/flappy-bird/game.js
 * Core Flappy Bird game engine.
 *
 * ATTRIBUTION:
 *   Based on the open-source "Floppy Bird" clone by Nebez Briefkani.
 *   Source: https://github.com/nebez/floppybird
 *   License: Apache 2.0
 *
 * This implementation adapts the original game mechanics (physics,
 * pipe spawning, collision detection, scoring) for canvas-based
 * rendering inside an arbitrary DOM container. It drops the jQuery
 * dependency and exposes a clean module interface for lifecycle
 * management and future AI-agent integration.
 *
 * Modifications from the original:
 *   - Rewritten in vanilla ES modules (no jQuery, no global scope).
 *   - Canvas rendering instead of CSS-animated DOM elements.
 *   - Exposes init/start/restart/getScore/onGameOver/destroy API.
 *   - Includes getState() and issueFlap() hooks for future LAYA agent.
 *   - Score is tracked internally and reported via callback.
 *   - Supports responsive resizing via ResizeObserver.
 *   - Audio is optional (missing files do not crash the game).
 *
 * Team ZENITH · PS 02: Beat the Bot · VESIT × Quest IT
 */

'use strict';

/* ── Game constants (mirroring original floppybird values) ── */
const GRAVITY         = 0.25;   // px/frame² acceleration
const JUMP_VELOCITY   = -4.6;   // upward impulse on flap
const PIPE_WIDTH      = 52;     // px (original sprite width)
const PIPE_GAP        = 90;     // vertical gap between pipes
const PIPE_INTERVAL   = 1400;   // ms between pipe spawns
const GAME_FPS        = 60;     // target frame rate
const FRAME_MS        = 1000 / GAME_FPS;
const LAND_HEIGHT_PCT = 0.20;   // ground takes 20% of height
const BIRD_W          = 34;
const BIRD_H          = 24;

/* ── State enum ─────────────────────────────────────────── */
const STATE = Object.freeze({
  SPLASH:   0,   // splash / waiting to start
  PLAYING:  1,   // active gameplay
  GAMEOVER: 2,   // dead, showing score
});

/**
 * Load an image asset and return a Promise<HTMLImageElement>.
 * Resolves even if the image fails to load (returns placeholder).
 * @param {string} src
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => {
      // Return a tiny 1px placeholder so the game still runs
      const ph = new Image(1, 1);
      resolve(ph);
    };
    img.src = src;
  });
}

/**
 * Attempt to load an audio file.
 * Returns null (silently) if Audio is unavailable or file missing.
 * @param {string} src
 * @returns {HTMLAudioElement|null}
 */
function loadAudio(src) {
  try {
    const audio = new Audio();
    audio.src = src;
    audio.preload = 'auto';
    return audio;
  } catch {
    return null;
  }
}

/**
 * Try to play an Audio element.
 * Rewinds to start first for rapid replay.
 * @param {HTMLAudioElement|null} audio
 */
function playSound(audio) {
  if (!audio) return;
  try {
    audio.currentTime = 0;
    audio.play().catch(() => {}); // Ignore autoplay policy errors
  } catch {
    // Ignore
  }
}

/**
 * Main game class.
 */
class FlappyBirdGame {
  /**
   * @param {HTMLElement} container — DOM element to mount into
   * @param {string}      assetsBase — path prefix for assets
   */
  constructor(container, assetsBase) {
    this.container  = container;
    this.assetsBase = assetsBase.endsWith('/') ? assetsBase : assetsBase + '/';

    /* Canvas */
    this.canvas  = null;
    this.ctx     = null;

    /* Game state */
    this.state    = STATE.SPLASH;
    this.score    = 0;
    this.velocity = 0;
    this.position = 0;   // bird Y from top (canvas units)
    this.rotation = 0;   // bird rotation degrees

    /* Pipes */
    this.pipes = [];

    /* Timers */
    this._rafId       = null;
    this._pipeTimer   = null;
    this._lastTime    = 0;
    this._accumulator = 0;

    /* Assets */
    this.images = {};
    this.sounds = {};

    /* Callbacks */
    this._gameOverCallbacks = [];

    /* Input guard — prevent double-fire per physical key event */
    this._inputCooldown = false;

    /* ResizeObserver */
    this._resizeObserver = null;

    /* Device pixel ratio */
    this._dpr = window.devicePixelRatio || 1;

    /* Bound handlers (stored for removal) */
    this._onFlapEvent     = this._handleFlapEvent.bind(this);
    this._onClickFlap     = this._handleClickFlap.bind(this);
    this._onTouchFlap     = this._handleTouchFlap.bind(this);

    /* LAYA extension: latest state snapshot for agent reads */
    this._latestStateSnapshot = null;

    /* Whether this instance is still alive (not destroyed) */
    this._alive = true;
  }

  /* ─────────────────────────────────────────────────────── */
  /*  Public API                                             */
  /* ─────────────────────────────────────────────────────── */

  /**
   * Load all assets and set up the canvas.
   * Resolves when the game is ready to start().
   * @returns {Promise<void>}
   */
  async setup() {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'display:block;width:100%;height:100%;';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.container.appendChild(this.canvas);

    this._resizeCanvas();

    // ResizeObserver for responsive sizing
    this._resizeObserver = new ResizeObserver(() => {
      if (this._alive) this._resizeCanvas();
    });
    this._resizeObserver.observe(this.container);

    // Load images
    const a = this.assetsBase;
    const [sky, land, ceiling, bird, pipeUp, pipeDown, splash, scoreboard] =
      await Promise.all([
        loadImage(a + 'sky.png'),
        loadImage(a + 'land.png'),
        loadImage(a + 'ceiling.png'),
        loadImage(a + 'bird.png'),
        loadImage(a + 'pipe-up.png'),
        loadImage(a + 'pipe-down.png'),
        loadImage(a + 'splash.png'),
        loadImage(a + 'scoreboard.png'),
      ]);

    this.images = { sky, land, ceiling, bird, pipeUp, pipeDown, splash, scoreboard };

    // Load digit images for score display
    this.images.digits = [];
    for (let i = 0; i <= 9; i++) {
      this.images.digits[i] = await loadImage(a + `font_big_${i}.png`);
    }

    // Load sounds (non-blocking, failures are silenced)
    this.sounds.wing  = loadAudio(a + 'sounds/sfx_wing.ogg');
    this.sounds.score = loadAudio(a + 'sounds/sfx_point.ogg');
    this.sounds.hit   = loadAudio(a + 'sounds/sfx_hit.ogg');
    this.sounds.die   = loadAudio(a + 'sounds/sfx_die.ogg');

    // Attach input handlers
    document.addEventListener('game:flap',  this._onFlapEvent);
    this.canvas.addEventListener('click',   this._onClickFlap);
    this.canvas.addEventListener('touchend', this._onTouchFlap, { passive: false });

    // Set initial bird position
    this._resetPhysics();
  }

  /**
   * Start the game loop and show splash screen.
   * Safe to call only once after setup().
   */
  start() {
    this.state = STATE.SPLASH;
    this._startLoop();
  }

  /**
   * Restart: reset physics, score, pipes, and return to splash.
   * Can be called at any time.
   */
  restart() {
    this.state = STATE.SPLASH;
    this.score = 0;
    this.pipes = [];
    this._resetPhysics();
    this._stopPipeTimer();
    // Score is reset — don't erase localStorage best (handled by game-screen.js)
  }

  /**
   * Return the current numeric score synchronously.
   * @returns {number}
   */
  getScore() {
    return this.score;
  }

  /**
   * Register a callback for game-over.
   * Callback receives (finalScore: number, stateSnapshot: object).
   * Only one callback is supported per instance.
   * @param {Function} fn
   */
  onGameOver(fn) {
    // Replace rather than accumulate to prevent duplicate calls
    this._gameOverCallbacks = [fn];
  }

  /**
   * Cleanly destroy this game instance.
   * Cancels animation loops, removes event listeners, clears DOM.
   */
  destroy() {
    this._alive = false;
    this._stopLoop();
    this._stopPipeTimer();

    // Remove input listeners
    document.removeEventListener('game:flap', this._onFlapEvent);
    this.canvas?.removeEventListener('click',    this._onClickFlap);
    this.canvas?.removeEventListener('touchend', this._onTouchFlap);

    // Stop and release audio
    for (const snd of Object.values(this.sounds)) {
      try { snd?.pause(); } catch {}
    }

    // Disconnect resize observer
    this._resizeObserver?.disconnect();

    // Clear canvas contents and remove from DOM
    if (this.canvas) {
      const ctx = this.canvas.getContext('2d');
      ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.canvas.remove();
      this.canvas = null;
    }

    // Clear callbacks to prevent stale closures firing
    this._gameOverCallbacks = [];
    this._latestStateSnapshot = null;
  }

  /* ── LAYA Extension Point ───────────────────────────────
   *
   * The methods below provide hooks for the future autonomous
   * LAYA agent. In the prototype they are stubs.
   *
   * FUTURE INTEGRATION REQUIREMENTS:
   *
   * getState() → {
   *   birdY:        number,  // bird Y position (0 = top of play area)
   *   birdVelocity: number,  // current vertical velocity
   *   birdRotation: number,  // current rotation angle (degrees)
   *   nextPipe: {
   *     x: number,           // left edge of next pipe pair
   *     gapTop: number,      // top of gap
   *     gapBottom: number,   // bottom of gap
   *   } | null,
   *   score: number,
   *   state: 'splash'|'playing'|'gameover',
   * }
   *
   * issueFlap() — programmatically trigger a flap action.
   *   The agent calls this to exert its action.
   *
   * These are the observation/action interfaces that LAYA
   * must connect to. The reward signal is the score delta
   * per frame; episode termination is the 'gameover' state.
   */

  /**
   * Read the current game state for agent observation.
   * @returns {object}
   */
  getState() {
    const h = this._playH();
    const nextPipe = this._nextPipe();
    return {
      birdY:        this.position,
      birdVelocity: this.velocity,
      birdRotation: this.rotation,
      playAreaHeight: h,
      nextPipe: nextPipe ? {
        x:         nextPipe.x,
        gapTop:    nextPipe.gapTop,
        gapBottom: nextPipe.gapBottom,
      } : null,
      score: this.score,
      state: ['splash', 'playing', 'gameover'][this.state] ?? 'unknown',
    };
  }

  /**
   * Issue a flap action programmatically (for LAYA agent).
   * Identical mechanics to a human Space/click input.
   */
  issueFlap() {
    this._doFlap();
  }

  /* ─────────────────────────────────────────────────────── */
  /*  Private: Physics & Game Logic                          */
  /* ─────────────────────────────────────────────────────── */

  /** Reset bird physics to initial state */
  _resetPhysics() {
    const h = this._playH();
    this.velocity = 0;
    this.position = h * 0.45;  // start near vertical centre
    this.rotation = 0;
  }

  /** Height of the playable area (canvas height minus ground) */
  _playH() {
    if (!this.canvas) return 400;
    return this.canvas.height / this._dpr;
  }

  /** Width of the canvas in CSS pixels */
  _playW() {
    if (!this.canvas) return 288;
    return this.canvas.width / this._dpr;
  }

  /**
   * Find the next upcoming pipe pair (lowest x that hasn't passed the bird).
   * @returns {{ x, gapTop, gapBottom }|null}
   */
  _nextPipe() {
    const birdX = this._playW() * 0.22 + BIRD_W;
    for (const p of this.pipes) {
      if (p.x + PIPE_WIDTH > birdX) return p;
    }
    return null;
  }

  /** Execute a flap (set upward velocity) */
  _doFlap() {
    if (!this._alive) return;

    if (this.state === STATE.SPLASH) {
      this._beginPlaying();
      return;
    }

    if (this.state !== STATE.PLAYING) return;

    this.velocity = JUMP_VELOCITY;
    playSound(this.sounds.wing);
  }

  /** Transition from SPLASH to PLAYING */
  _beginPlaying() {
    this.state = STATE.PLAYING;
    this.velocity = JUMP_VELOCITY;
    playSound(this.sounds.wing);
    this._startPipeTimer();
  }

  /** Trigger game over */
  _triggerGameOver() {
    if (this.state === STATE.GAMEOVER) return;
    this.state = STATE.GAMEOVER;

    playSound(this.sounds.hit);
    setTimeout(() => playSound(this.sounds.die), 400);

    this._stopPipeTimer();

    const finalScore = this.score;
    this._latestStateSnapshot = this.getState();

    // Notify callbacks after a brief pause to show the flash
    setTimeout(() => {
      if (!this._alive) return;
      for (const cb of this._gameOverCallbacks) {
        try { cb(finalScore, this._latestStateSnapshot); } catch {}
      }
    }, 300);
  }

  /* ─────────────────────────────────────────────────────── */
  /*  Private: Pipe Management                               */
  /* ─────────────────────────────────────────────────────── */

  _startPipeTimer() {
    this._stopPipeTimer();
    this._spawnPipe();
    this._pipeTimer = setInterval(() => {
      if (this._alive && this.state === STATE.PLAYING) {
        this._spawnPipe();
      }
    }, PIPE_INTERVAL);
  }

  _stopPipeTimer() {
    if (this._pipeTimer) {
      clearInterval(this._pipeTimer);
      this._pipeTimer = null;
    }
  }

  _spawnPipe() {
    const h = this._playH();
    const w = this._playW();
    const groundH = h * LAND_HEIGHT_PCT;
    const playable = h - groundH - 14; // minus ceiling

    // Random gap position
    const minGapTop = 20;
    const maxGapTop = playable - PIPE_GAP - 20;
    const gapTop = minGapTop + Math.random() * (maxGapTop - minGapTop);
    const gapBottom = gapTop + PIPE_GAP;

    this.pipes.push({
      x:         w + 10,
      gapTop:    gapTop + 14,
      gapBottom: gapBottom + 14,
      scored:    false,
    });
  }

  /* ─────────────────────────────────────────────────────── */
  /*  Private: Animation Loop                                */
  /* ─────────────────────────────────────────────────────── */

  _startLoop() {
    this._stopLoop();
    this._lastTime = performance.now();
    const loop = (now) => {
      if (!this._alive) return;
      this._rafId = requestAnimationFrame(loop);

      const delta = now - this._lastTime;
      this._lastTime = now;
      this._accumulator += Math.min(delta, 100); // cap delta to avoid spiral

      while (this._accumulator >= FRAME_MS) {
        this._update();
        this._accumulator -= FRAME_MS;
      }

      this._draw();
    };
    this._rafId = requestAnimationFrame(loop);
  }

  _stopLoop() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  /* ─────────────────────────────────────────────────────── */
  /*  Private: Update (one fixed-timestep tick)              */
  /* ─────────────────────────────────────────────────────── */

  _update() {
    if (this.state !== STATE.PLAYING) return;

    const h       = this._playH();
    const w       = this._playW();
    const groundH = h * LAND_HEIGHT_PCT;
    const birdX   = w * 0.22;
    const pipeSpd = w * 0.006; // pipe movement speed (scales with width)

    // Physics
    this.velocity += GRAVITY;
    this.position += this.velocity;

    // Rotation: tip up on ascent, rotate down on descent
    this.rotation = Math.min((this.velocity / 10) * 90, 90);

    // Ceiling collision
    if (this.position < 14) {
      this.position = 14;
      this.velocity = 0;
    }

    // Ground collision
    if (this.position + BIRD_H >= h - groundH) {
      this.position = h - groundH - BIRD_H;
      this._triggerGameOver();
      return;
    }

    // Move pipes left, remove off-screen, score when passed
    const toRemove = [];
    for (const pipe of this.pipes) {
      pipe.x -= pipeSpd;

      // Score: bird passed the pipe's right edge
      if (!pipe.scored && pipe.x + PIPE_WIDTH < birdX) {
        pipe.scored = true;
        this.score++;
        playSound(this.sounds.score);
      }

      // Remove pipes that have scrolled fully off screen
      if (pipe.x + PIPE_WIDTH < -10) {
        toRemove.push(pipe);
      }

      // Collision detection
      const birdLeft   = birdX + 4;                     // small inset for fairness
      const birdRight  = birdX + BIRD_W - 4;
      const birdTop    = this.position + 2;
      const birdBottom = this.position + BIRD_H - 2;

      const pipeLeft  = pipe.x;
      const pipeRight = pipe.x + PIPE_WIDTH;

      // Horizontal overlap
      if (birdRight > pipeLeft && birdLeft < pipeRight) {
        // Vertical collision with upper pipe
        if (birdTop < pipe.gapTop) {
          this._triggerGameOver();
          return;
        }
        // Vertical collision with lower pipe
        if (birdBottom > pipe.gapBottom) {
          this._triggerGameOver();
          return;
        }
      }
    }

    // Remove out-of-bounds pipes
    this.pipes = this.pipes.filter(p => !toRemove.includes(p));
  }

  /* ─────────────────────────────────────────────────────── */
  /*  Private: Render (every animation frame)                */
  /* ─────────────────────────────────────────────────────── */

  _draw() {
    const canvas = this.canvas;
    if (!canvas) return;

    const ctx  = canvas.getContext('2d');
    const dpr  = this._dpr;
    const cw   = canvas.width;    // physical pixels
    const ch   = canvas.height;
    const w    = cw / dpr;        // CSS pixels
    const h    = ch / dpr;
    const img  = this.images;

    // Scale for HDPI
    ctx.save();
    ctx.scale(dpr, dpr);

    // Sky background
    this._drawTiled(ctx, img.sky, 0, 0, w, h);

    // Draw pipes
    const groundH = h * LAND_HEIGHT_PCT;
    for (const pipe of this.pipes) {
      if (img.pipeDown && img.pipeDown.naturalWidth) {
        // Upper pipe (pipe-down.png hangs from gap top)
        const upperH = pipe.gapTop;
        ctx.drawImage(img.pipeDown, pipe.x, 0, PIPE_WIDTH, upperH);
      }
      if (img.pipeUp && img.pipeUp.naturalWidth) {
        // Lower pipe (pipe-up.png rises from gap bottom)
        const lowerTop = pipe.gapBottom;
        const lowerH   = h - groundH - lowerTop;
        ctx.drawImage(img.pipeUp, pipe.x, lowerTop, PIPE_WIDTH, lowerH);
      }
    }

    // Ground
    this._drawTiled(ctx, img.land, 0, h - groundH, w, groundH);

    // Ceiling strip
    if (img.ceiling && img.ceiling.naturalWidth) {
      ctx.drawImage(img.ceiling, 0, 0, w, 14);
    }

    // Bird (rotated around its centre)
    const birdX     = w * 0.22;
    const birdCX    = birdX + BIRD_W / 2;
    const birdCY    = this.position + BIRD_H / 2;
    const radians   = (this.rotation * Math.PI) / 180;

    if (img.bird && img.bird.naturalWidth) {
      // Bird sprite is 96px tall (4 frames of 24px: BIRD_W=34, BIRD_H=24)
      const frameH = img.bird.naturalHeight === 96 ? 24 : Math.floor(img.bird.naturalHeight / 3);
      const totalFrames = Math.max(1, Math.round(img.bird.naturalHeight / frameH));
      const frameIndex = Math.floor((Date.now() / 80) % totalFrames);
      ctx.save();
      ctx.translate(birdCX, birdCY);
      ctx.rotate(radians);
      ctx.drawImage(
        img.bird,
        0, frameIndex * frameH,
        img.bird.naturalWidth, frameH,
        -BIRD_W / 2, -BIRD_H / 2,
        BIRD_W, BIRD_H
      );
      ctx.restore();
    }

    // Score overlay (splash or playing)
    if (this.state === STATE.PLAYING || this.state === STATE.SPLASH) {
      this._drawScore(ctx, w, h);
    }

    // Splash screen overlay
    if (this.state === STATE.SPLASH) {
      this._drawSplash(ctx, w, h);
    }

    // Game-over flash (brief white flash on death)
    if (this.state === STATE.GAMEOVER) {
      this._drawScore(ctx, w, h);
      // Slight darkening overlay — actual game-over UI is in game-screen.js
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();
  }

  /**
   * Tile an image horizontally across a rect.
   */
  _drawTiled(ctx, img, x, y, w, h) {
    if (!img || !img.naturalWidth) {
      ctx.fillStyle = '#4dc8e8';
      ctx.fillRect(x, y, w, h);
      return;
    }
    const pattern = ctx.createPattern(img, 'repeat');
    if (!pattern) return;

    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  /**
   * Draw the in-game big digit score in the top-centre.
   */
  _drawScore(ctx, w, _h) {
    const digits = String(this.score).split('');
    const digitImages = this.images.digits;
    if (!digitImages) return;

    // Each digit sprite is about 18×28 logical pixels
    const dw = 18;
    const dh = 28;
    const gap = 2;
    const totalW = digits.length * (dw + gap) - gap;
    let dx = (w - totalW) / 2;

    for (const d of digits) {
      const di = parseInt(d, 10);
      const img = digitImages[di];
      if (img && img.naturalWidth) {
        ctx.drawImage(img, dx, 16, dw, dh);
      }
      dx += dw + gap;
    }
  }

  /**
   * Draw the splash / ready screen (tap hint).
   */
  _drawSplash(ctx, w, h) {
    const img = this.images.splash;
    if (!img || !img.naturalWidth) {
      // Fallback text
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Tap to Start', w / 2, h / 2);
      ctx.textAlign = 'left';
      return;
    }

    // Centre the splash image
    const sw = Math.min(img.naturalWidth, w * 0.6);
    const sh = (sw / img.naturalWidth) * img.naturalHeight;
    ctx.drawImage(img, (w - sw) / 2, h * 0.30, sw, sh);
  }

  /* ─────────────────────────────────────────────────────── */
  /*  Private: Canvas Sizing                                  */
  /* ─────────────────────────────────────────────────────── */

  _resizeCanvas() {
    if (!this.canvas || !this.container) return;
    this._dpr = window.devicePixelRatio || 1;
    const rect = this.container.getBoundingClientRect();
    const w = Math.max(rect.width,  50);
    const h = Math.max(rect.height, 80);

    this.canvas.width  = Math.round(w * this._dpr);
    this.canvas.height = Math.round(h * this._dpr);

    // Re-seat bird position when resizing so it stays in-bounds
    if (this.state === STATE.SPLASH) {
      this._resetPhysics();
    }
  }

  /* ─────────────────────────────────────────────────────── */
  /*  Private: Input Handlers                                 */
  /* ─────────────────────────────────────────────────────── */

  _handleFlapEvent(_e) {
    if (!this._alive) return;
    this._doFlap();
  }

  _handleClickFlap(e) {
    if (!this._alive) return;
    e.preventDefault();
    this._doFlap();
  }

  _handleTouchFlap(e) {
    if (!this._alive) return;
    e.preventDefault();
    this._doFlap();
  }
}

/**
 * Create and set up a FlappyBirdGame.
 *
 * @param {HTMLElement} container — DOM node to mount into
 * @param {object}      options
 * @param {string}      options.assetsBase — URL prefix for assets
 * @returns {FlappyBirdGame}
 */
export async function createGame(container, options = {}) {
  const assetsBase = options.assetsBase ?? './games/flappy-bird/assets/';
  const game = new FlappyBirdGame(container, assetsBase);
  await game.setup();
  return game;
}
