/**
 * games/hamster-hit/game.js
 * Core engine and DOM renderer for Hamster Hit.
 *
 * ATTRIBUTION:
 *   Based on whack-a-mole mechanics (Yeab-Ad/Punch-Game & naikmubashir/FeF-WhackAMole)
 *   License: MIT
 *   Custom SVG assets & animations by Team ZENITH.
 *
 * Team ZENITH · PS 02: Beat the Bot · VESIT × Quest IT
 */

const DURATION_SECONDS = 30;

// Inline SVGs for cute hamsters, golden crown hamster, and bomb decoy
const HAMSTER_SVG = `
<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="20" cy="22" r="11" fill="#d97706"/>
  <circle cx="20" cy="22" r="6" fill="#fca5a5"/>
  <circle cx="60" cy="22" r="11" fill="#d97706"/>
  <circle cx="60" cy="22" r="6" fill="#fca5a5"/>
  <ellipse cx="40" cy="46" rx="28" ry="24" fill="#f59e0b"/>
  <ellipse cx="40" cy="52" rx="16" ry="14" fill="#fef3c7"/>
  <circle cx="26" cy="50" r="5" fill="#f87171" opacity="0.6"/>
  <circle cx="54" cy="50" r="5" fill="#f87171" opacity="0.6"/>
  <circle cx="31" cy="42" r="4.5" fill="#111827"/>
  <circle cx="32" cy="40.5" r="1.5" fill="#ffffff"/>
  <circle cx="49" cy="42" r="4.5" fill="#111827"/>
  <circle cx="50" cy="40.5" r="1.5" fill="#ffffff"/>
  <polygon points="37,47 43,47 40,50" fill="#f43f5e"/>
  <path d="M37 51 Q40 54 43 51" stroke="#78350f" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <line x1="16" y1="46" x2="26" y2="48" stroke="#78350f" stroke-width="1.2"/>
  <line x1="16" y1="52" x2="26" y2="51" stroke="#78350f" stroke-width="1.2"/>
  <line x1="64" y1="46" x2="54" y2="48" stroke="#78350f" stroke-width="1.2"/>
  <line x1="64" y1="52" x2="54" y2="51" stroke="#78350f" stroke-width="1.2"/>
</svg>`;

const GOLDEN_HAMSTER_SVG = `
<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M32 10 L35 18 L40 12 L45 18 L48 10 L48 20 L32 20 Z" fill="#fbbf24" stroke="#d97706" stroke-width="1"/>
  <circle cx="32" cy="10" r="1.5" fill="#ffffff"/>
  <circle cx="40" cy="12" r="1.5" fill="#ffffff"/>
  <circle cx="48" cy="10" r="1.5" fill="#ffffff"/>
  <circle cx="20" cy="22" r="11" fill="#f59e0b"/>
  <circle cx="20" cy="22" r="6" fill="#fef08a"/>
  <circle cx="60" cy="22" r="11" fill="#f59e0b"/>
  <circle cx="60" cy="22" r="6" fill="#fef08a"/>
  <ellipse cx="40" cy="46" rx="28" ry="24" fill="#fbbf24"/>
  <ellipse cx="40" cy="52" rx="16" ry="14" fill="#fffbeb"/>
  <circle cx="26" cy="50" r="5" fill="#f87171" opacity="0.6"/>
  <circle cx="54" cy="50" r="5" fill="#f87171" opacity="0.6"/>
  <circle cx="31" cy="42" r="4.5" fill="#111827"/>
  <circle cx="32" cy="40.5" r="1.5" fill="#ffffff"/>
  <circle cx="49" cy="42" r="4.5" fill="#111827"/>
  <circle cx="50" cy="40.5" r="1.5" fill="#ffffff"/>
  <polygon points="37,47 43,47 40,50" fill="#f43f5e"/>
  <path d="M37 51 Q40 54 43 51" stroke="#78350f" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <line x1="16" y1="46" x2="26" y2="48" stroke="#78350f" stroke-width="1.2"/>
  <line x1="16" y1="52" x2="26" y2="51" stroke="#78350f" stroke-width="1.2"/>
  <line x1="64" y1="46" x2="54" y2="48" stroke="#78350f" stroke-width="1.2"/>
  <line x1="64" y1="52" x2="54" y2="51" stroke="#78350f" stroke-width="1.2"/>
</svg>`;

const BOMB_SVG = `
<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M40 28 Q44 14 54 16" stroke="#d97706" stroke-width="3" fill="none"/>
  <circle cx="55" cy="16" r="4" fill="#ef4444"/>
  <polygon points="55,10 57,15 62,16 57,18 55,23 53,18 48,16 53,15" fill="#fbbf24"/>
  <circle cx="40" cy="48" r="23" fill="#1f2937" stroke="#374151" stroke-width="2"/>
  <ellipse cx="32" cy="38" rx="5" ry="2.5" fill="#9ca3af" opacity="0.6" transform="rotate(-30 32 38)"/>
  <text x="40" y="56" font-size="22" text-anchor="middle" fill="#ef4444" font-weight="900" font-family="Inter,sans-serif">!</text>
</svg>`;

export class HamsterHitGame {
  constructor(container) {
    this.container = container;
    this.score = 0;
    this.timeLeft = DURATION_SECONDS;
    this._alive = true;
    this._isRunning = false;
    this._gameOverCallbacks = [];

    this._gameTimer = null;
    this._spawnTimer = null;
    this._stayTimeouts = new Map();

    // 9 Holes state: { id, el, creatureEl, state: 'empty'|'hamster'|'golden'|'bomb', isUp, isWhacked }
    this.holes = [];

    // Root UI
    this.root = document.createElement('div');
    this.root.className = 'game-hamster';

    // Header info
    this.header = document.createElement('div');
    this.header.className = 'game-hamster__header';
    this.header.innerHTML = `
      <div class="game-hamster__timer-box">
        <span>⏱️ Time:</span>
        <span class="game-hamster__timer-badge" id="hh-timer">${this.timeLeft}s</span>
      </div>
      <div class="game-hamster__guide">
        <span class="guide-hamster">🐹 +10</span> ·
        <span class="guide-gold">👑 +25</span> ·
        <span class="guide-bomb">💣 -5</span>
      </div>
    `;
    this.root.appendChild(this.header);

    // 3x3 Board
    this.board = document.createElement('div');
    this.board.className = 'game-hamster__board';

    for (let i = 0; i < 9; i++) {
      const hole = document.createElement('div');
      hole.className = 'game-hamster__hole';
      hole.setAttribute('role', 'button');
      hole.setAttribute('aria-label', `Hole ${i + 1}`);

      const burrowBg = document.createElement('div');
      burrowBg.className = 'game-hamster__burrow-bg';

      const creature = document.createElement('div');
      creature.className = 'game-hamster__creature';

      const frontLip = document.createElement('div');
      frontLip.className = 'game-hamster__hole-front';

      hole.appendChild(burrowBg);
      hole.appendChild(creature);
      hole.appendChild(frontLip);

      const holeData = {
        id: i,
        el: hole,
        creatureEl: creature,
        type: 'empty',
        isUp: false,
        isWhacked: false,
      };

      hole.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.whack(i);
      });

      this.holes.push(holeData);
      this.board.appendChild(hole);
    }

    this.root.appendChild(this.board);
    this.container.appendChild(this.root);

    this.timerEl = this.header.querySelector('#hh-timer');
  }

  start() {
    if (this._isRunning) return;
    this._isRunning = true;
    this.score = 0;
    this.timeLeft = DURATION_SECONDS;
    this.updateTimerDisplay();

    // Start 1-second countdown
    this._gameTimer = setInterval(() => {
      if (!this._alive || !this._isRunning) return;
      this.timeLeft--;
      this.updateTimerDisplay();

      if (this.timeLeft <= 0) {
        this.endGame();
      }
    }, 1000);

    this.scheduleNextSpawn();
  }

  restart() {
    this.resetState();
    this.start();
  }

  resetState() {
    this._isRunning = false;
    clearInterval(this._gameTimer);
    clearTimeout(this._spawnTimer);

    for (const [id, timeout] of this._stayTimeouts.entries()) {
      clearTimeout(timeout);
    }
    this._stayTimeouts.clear();

    for (const hole of this.holes) {
      this.hideHole(hole);
    }

    this.score = 0;
    this.timeLeft = DURATION_SECONDS;
    this.updateTimerDisplay();
  }

  updateTimerDisplay() {
    if (this.timerEl) {
      this.timerEl.textContent = `${this.timeLeft}s`;
    }
  }

  getDifficulty() {
    // 0 (start) -> 1 (end)
    return Math.max(0, Math.min(1, (DURATION_SECONDS - this.timeLeft) / DURATION_SECONDS));
  }

  scheduleNextSpawn() {
    if (!this._alive || !this._isRunning) return;

    const diff = this.getDifficulty();
    // Delay between spawns: starts around 850ms, decreases to 450ms
    const delay = Math.max(380, 850 - diff * 470 + (Math.random() * 150 - 75));

    this._spawnTimer = setTimeout(() => {
      this.spawnCreature();
      this.scheduleNextSpawn();
    }, delay);
  }

  spawnCreature() {
    if (!this._alive || !this._isRunning) return;

    // Pick empty holes
    const available = this.holes.filter((h) => !h.isUp);
    if (!available.length) return;

    const hole = available[Math.floor(Math.random() * available.length)];

    // Determine type: 75% normal, 15% bomb, 10% golden
    const rand = Math.random();
    let type = 'hamster';
    let svg = HAMSTER_SVG;

    if (rand < 0.12) {
      type = 'golden';
      svg = GOLDEN_HAMSTER_SVG;
    } else if (rand < 0.28) {
      type = 'bomb';
      svg = BOMB_SVG;
    }

    hole.type = type;
    hole.isUp = true;
    hole.isWhacked = false;
    hole.creatureEl.innerHTML = svg;
    hole.el.classList.remove('game-hamster__hole--whacked');
    hole.el.classList.add('game-hamster__hole--up');

    // How long it stays up: 950ms initially, scales down to 500ms
    const diff = this.getDifficulty();
    const stayTime = Math.max(480, 950 - diff * 450);

    const timeout = setTimeout(() => {
      this.hideHole(hole);
    }, stayTime);

    this._stayTimeouts.set(hole.id, timeout);
  }

  hideHole(hole) {
    hole.isUp = false;
    hole.el.classList.remove('game-hamster__hole--up');
    const existing = this._stayTimeouts.get(hole.id);
    if (existing) {
      clearTimeout(existing);
      this._stayTimeouts.delete(hole.id);
    }
  }

  whack(holeIndex) {
    if (!this._alive || !this._isRunning) return;
    const hole = this.holes[holeIndex];
    if (!hole || !hole.isUp || hole.isWhacked) return;

    hole.isWhacked = true;
    hole.el.classList.add('game-hamster__hole--whacked');

    if (hole.type === 'hamster') {
      this.score += 10;
      this.showFloater(hole.el, '+10', 'plus');
    } else if (hole.type === 'golden') {
      this.score += 25;
      this.showFloater(hole.el, '+25', 'gold');
    } else if (hole.type === 'bomb') {
      this.score = Math.max(0, this.score - 5);
      this.showFloater(hole.el, '-5', 'minus');
      this.triggerShake();
    }

    // Hide after squish
    setTimeout(() => {
      this.hideHole(hole);
    }, 180);
  }

  showFloater(holeEl, text, modifier) {
    const floater = document.createElement('div');
    floater.className = `game-hamster__floater game-hamster__floater--${modifier}`;
    floater.textContent = text;
    holeEl.appendChild(floater);
    setTimeout(() => floater.remove(), 550);
  }

  triggerShake() {
    this.root.classList.remove('game-hamster--shake');
    void this.root.offsetHeight;
    this.root.classList.add('game-hamster--shake');
    setTimeout(() => this.root.classList.remove('game-hamster--shake'), 320);
  }

  endGame() {
    this._isRunning = false;
    clearInterval(this._gameTimer);
    clearTimeout(this._spawnTimer);

    for (const hole of this.holes) {
      this.hideHole(hole);
    }

    for (const cb of this._gameOverCallbacks) {
      cb(this.score);
    }
  }

  getScore() {
    return this.score;
  }

  onGameOver(cb) {
    this._gameOverCallbacks.push(cb);
  }

  destroy() {
    this._alive = false;
    this.resetState();
    this.root.remove();
    this._gameOverCallbacks = [];
  }

  /* ── LAYA HOOK ──────────────────────────────────────────
   *
   * getState() returns the observation vector:
   *   {
   *     score: number,
   *     timeLeft: number,
   *     holes: Array<{
   *       id: number,
   *       type: 'empty' | 'hamster' | 'golden' | 'bomb',
   *       isUp: boolean,
   *       isWhacked: boolean
   *     }>,
   *     difficulty: number (0.0 to 1.0)
   *   }
   *
   * whack(holeIndex) programmatically hits hole 0..8:
   *   agent calls game.whack(0..8)
   *
   * Reward: +10 for hamster, +25 for golden, -5 for bomb.
   * Terminal state: timeLeft === 0.
   */
  getState() {
    return {
      score: this.score,
      timeLeft: this.timeLeft,
      holes: this.holes.map((h) => ({
        id: h.id,
        type: h.isUp ? h.type : 'empty',
        isUp: h.isUp,
        isWhacked: h.isWhacked,
      })),
      difficulty: this.getDifficulty(),
    };
  }
}
