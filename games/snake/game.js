/**
 * games/snake/game.js
 * Core engine and Canvas renderer for Snake.
 *
 * ATTRIBUTION:
 *   Based on Impre7ive/snake-game-javascript (https://github.com/Impre7ive/snake-game-javascript)
 *   License: MIT
 *   Custom dark minimalist rendering, responsive canvas, and D-pad by Team ZENITH.
 *
 * Team ZENITH · PS 02: Beat the Bot · VESIT × Quest IT
 */

const GRID_SIZE = 20; // 20x20 cells
const BASE_SPEED_MS = 135;
const MIN_SPEED_MS = 70;

export class SnakeGame {
  constructor(container) {
    this.container = container;
    this.score = 0;
    this.paused = false;
    this.over = false;
    this._alive = true;
    this._gameOverCallbacks = [];

    // State
    this.snake = [];
    this.direction = 'right';
    this.nextDirection = 'right';
    this.food = { x: 14, y: 10 };

    this._lastTickTime = 0;
    this._rafId = null;
    this._dpr = window.devicePixelRatio || 1;

    // Build DOM structure
    this.root = document.createElement('div');
    this.root.className = 'game-snake';

    this.canvasWrap = document.createElement('div');
    this.canvasWrap.className = 'game-snake__canvas-wrap';

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'game-snake__canvas';
    this.ctx = this.canvas.getContext('2d');

    // Pause overlay
    this.pauseOverlay = document.createElement('div');
    this.pauseOverlay.className = 'game-snake__pause-overlay hidden';
    this.pauseOverlay.innerHTML = `
      <div class="game-snake__pause-title">PAUSED</div>
      <div class="game-snake__pause-hint">Press Space or tap here to resume</div>
    `;
    this.pauseOverlay.addEventListener('click', () => this.togglePause());

    this.canvasWrap.appendChild(this.canvas);
    this.canvasWrap.appendChild(this.pauseOverlay);
    this.root.appendChild(this.canvasWrap);

    // Virtual D-pad
    this.dpad = document.createElement('div');
    this.dpad.className = 'game-snake__dpad';
    this.dpad.innerHTML = `
      <button class="game-snake__btn game-snake__btn--up" aria-label="Up">▲</button>
      <button class="game-snake__btn game-snake__btn--left" aria-label="Left">◀</button>
      <button class="game-snake__btn game-snake__btn--pause" aria-label="Pause">❚❚</button>
      <button class="game-snake__btn game-snake__btn--right" aria-label="Right">▶</button>
      <button class="game-snake__btn game-snake__btn--down" aria-label="Down">▼</button>
    `;
    this.root.appendChild(this.dpad);
    this.container.appendChild(this.root);

    // Wire D-pad
    this.dpad.querySelector('.game-snake__btn--up')?.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.setDirection('up');
    });
    this.dpad.querySelector('.game-snake__btn--down')?.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.setDirection('down');
    });
    this.dpad.querySelector('.game-snake__btn--left')?.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.setDirection('left');
    });
    this.dpad.querySelector('.game-snake__btn--right')?.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.setDirection('right');
    });
    this.dpad.querySelector('.game-snake__btn--pause')?.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.togglePause();
    });

    // Touch swipe handling on canvas
    this._touchStartX = 0;
    this._touchStartY = 0;
    this._onTouchStart = (e) => {
      if (e.touches.length > 0) {
        this._touchStartX = e.touches[0].clientX;
        this._touchStartY = e.touches[0].clientY;
      }
    };
    this._onTouchEnd = (e) => {
      if (e.changedTouches.length === 0) return;
      const dx = e.changedTouches[0].clientX - this._touchStartX;
      const dy = e.changedTouches[0].clientY - this._touchStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (Math.max(absDx, absDy) > 25) {
        if (absDx > absDy) {
          this.setDirection(dx > 0 ? 'right' : 'left');
        } else {
          this.setDirection(dy > 0 ? 'down' : 'up');
        }
      }
    };

    this.canvasWrap.addEventListener('touchstart', this._onTouchStart, { passive: true });
    this.canvasWrap.addEventListener('touchend', this._onTouchEnd, { passive: true });

    // Keyboard handling
    this._onKeyDown = this.handleKeyDown.bind(this);
    this._onSpaceCustom = () => this.togglePause();

    window.addEventListener('keydown', this._onKeyDown, { passive: false });
    document.addEventListener('game:space', this._onSpaceCustom);

    // Responsive Canvas Resizing
    this._resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this._resizeObserver.observe(this.canvasWrap);

    this.initSnake();
    this.resizeCanvas();
  }

  initSnake() {
    this.snake = [
      { x: 8, y: 10 },
      { x: 7, y: 10 },
      { x: 6, y: 10 },
    ];
    this.direction = 'right';
    this.nextDirection = 'right';
    this.score = 0;
    this.over = false;
    this.paused = false;
    this.spawnFood();
  }

  start() {
    this.initSnake();
    this._lastTickTime = performance.now();
    this.render();
    this.loop(performance.now());
  }

  restart() {
    this.pauseOverlay.classList.add('hidden');
    this.initSnake();
    this.paused = false;
  }

  togglePause() {
    if (this.over || !this._alive) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.pauseOverlay.classList.remove('hidden');
    } else {
      this.pauseOverlay.classList.add('hidden');
      this._lastTickTime = performance.now();
    }
  }

  resizeCanvas() {
    if (!this._alive || !this.canvasWrap) return;
    const rect = this.canvasWrap.getBoundingClientRect();
    const size = Math.floor(Math.min(rect.width, rect.height || rect.width));
    if (size <= 0) return;

    this._dpr = window.devicePixelRatio || 1;
    this.canvas.width = size * this._dpr;
    this.canvas.height = size * this._dpr;
    this.cellSize = (size * this._dpr) / GRID_SIZE;
    this.render();
  }

  getTickInterval() {
    // Scales down from 135ms to 70ms as score increases
    return Math.max(MIN_SPEED_MS, BASE_SPEED_MS - this.score * 2.2);
  }

  loop(timestamp) {
    if (!this._alive) return;

    if (!this.paused && !this.over) {
      const elapsed = timestamp - this._lastTickTime;
      if (elapsed >= this.getTickInterval()) {
        this.update();
        this._lastTickTime = timestamp;
      }
    }

    this.render();
    this._rafId = requestAnimationFrame((t) => this.loop(t));
  }

  setDirection(dir) {
    if (this.paused) {
      this.togglePause();
    }
    const opposites = {
      up: 'down',
      down: 'up',
      left: 'right',
      right: 'left',
    };
    if (opposites[dir] !== this.direction) {
      this.nextDirection = dir;
    }
  }

  handleKeyDown(e) {
    if (!this._alive) return;
    const playScreen = document.getElementById('screen-play');
    if (!playScreen || playScreen.hidden) return;

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault();
        this.setDirection('up');
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault();
        this.setDirection('down');
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        this.setDirection('left');
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        this.setDirection('right');
        break;
      case ' ':
      case 'Spacebar':
        e.preventDefault();
        this.togglePause();
        break;
    }
  }

  update() {
    this.direction = this.nextDirection;
    const head = { ...this.snake[0] };

    switch (this.direction) {
      case 'up':    head.y--; break;
      case 'down':  head.y++; break;
      case 'left':  head.x--; break;
      case 'right': head.x++; break;
    }

    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      this.triggerGameOver();
      return;
    }

    // Self collision
    for (let i = 0; i < this.snake.length; i++) {
      if (this.snake[i].x === head.x && this.snake[i].y === head.y) {
        this.triggerGameOver();
        return;
      }
    }

    this.snake.unshift(head);

    // Food collision
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score++;
      this.spawnFood();
    } else {
      this.snake.pop();
    }
  }

  spawnFood() {
    let emptyCells = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        const inSnake = this.snake.some((s) => s.x === x && s.y === y);
        if (!inSnake) emptyCells.push({ x, y });
      }
    }

    if (emptyCells.length > 0) {
      const idx = Math.floor(Math.random() * emptyCells.length);
      this.food = emptyCells[idx];
    }
  }

  triggerGameOver() {
    this.over = true;
    for (const cb of this._gameOverCallbacks) {
      cb(this.score);
    }
  }

  render() {
    if (!this.ctx || !this.cellSize) return;
    const ctx = this.ctx;
    const cs = this.cellSize;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Subtle dark grid
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#0b0f14' : '#0e131a';
        ctx.fillRect(c * cs, r * cs, cs, cs);
      }
    }

    // Food (Radiant Apple Orb with glow)
    const fx = this.food.x * cs + cs / 2;
    const fy = this.food.y * cs + cs / 2;
    const foodRadius = cs * 0.38;

    // Glow halo
    ctx.beginPath();
    ctx.arc(fx, fy, foodRadius * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.fill();

    // Orb body
    ctx.beginPath();
    ctx.arc(fx, fy, foodRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();

    // Food leaf / shine
    ctx.beginPath();
    ctx.arc(fx - foodRadius * 0.3, fy - foodRadius * 0.3, foodRadius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fill();

    // Snake Body
    for (let i = this.snake.length - 1; i >= 0; i--) {
      const seg = this.snake[i];
      const isHead = i === 0;
      const x = seg.x * cs + 1;
      const y = seg.y * cs + 1;
      const size = cs - 2;
      const radius = isHead ? cs * 0.38 : cs * 0.25;

      ctx.fillStyle = isHead ? '#4ade80' : '#22c55e';

      // Soft rounded rectangle for each segment
      this.drawRoundedRect(ctx, x, y, size, size, radius);

      // Head Details (Eyes looking towards movement)
      if (isHead) {
        ctx.fillStyle = '#0b0d10';
        const eyeOffset = cs * 0.25;
        const eyeSize = cs * 0.12;
        let eye1 = { x: x + eyeOffset, y: y + eyeOffset };
        let eye2 = { x: x + size - eyeOffset, y: y + eyeOffset };

        if (this.direction === 'down') {
          eye1 = { x: x + eyeOffset, y: y + size - eyeOffset };
          eye2 = { x: x + size - eyeOffset, y: y + size - eyeOffset };
        } else if (this.direction === 'left') {
          eye1 = { x: x + eyeOffset, y: y + eyeOffset };
          eye2 = { x: x + eyeOffset, y: y + size - eyeOffset };
        } else if (this.direction === 'right') {
          eye1 = { x: x + size - eyeOffset, y: y + eyeOffset };
          eye2 = { x: x + size - eyeOffset, y: y + size - eyeOffset };
        }

        ctx.beginPath();
        ctx.arc(eye1.x, eye1.y, eyeSize, 0, Math.PI * 2);
        ctx.arc(eye2.x, eye2.y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  getScore() {
    return this.score;
  }

  onGameOver(cb) {
    this._gameOverCallbacks.push(cb);
  }

  destroy() {
    this._alive = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
    }
    window.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('game:space', this._onSpaceCustom);
    this.canvasWrap?.removeEventListener('touchstart', this._onTouchStart);
    this.canvasWrap?.removeEventListener('touchend', this._onTouchEnd);
    this._resizeObserver?.disconnect();
    this.root.remove();
    this._gameOverCallbacks = [];
  }

  /* ── LAYA HOOK ──────────────────────────────────────────
   *
   * getState() returns the observation vector:
   *   {
   *     snake: Array<{x: number, y: number}>,
   *     head: {x: number, y: number},
   *     food: {x: number, y: number},
   *     direction: 'up' | 'down' | 'left' | 'right',
   *     gridSize: number,
   *     score: number,
   *     paused: boolean,
   *     over: boolean
   *   }
   *
   * setDirection(dir) programmatically steers the snake:
   *   agent calls game.setDirection('up' | 'down' | 'left' | 'right')
   *
   * Reward: +1 for food, -1 for collision/gameover.
   * Terminal state: over === true.
   */
  getState() {
    return {
      snake: this.snake.map((s) => ({ ...s })),
      head: this.snake[0] ? { ...this.snake[0] } : null,
      food: { ...this.food },
      direction: this.direction,
      gridSize: GRID_SIZE,
      score: this.score,
      paused: this.paused,
      over: this.over,
    };
  }
}
