/**
 * games/2048/game.js
 * Core engine and DOM renderer for 2048.
 *
 * ATTRIBUTION:
 *   Based on the original 2048 game by Gabriele Cirulli.
 *   Source: https://github.com/gabrielecirulli/2048
 *   License: MIT
 *
 * Adaptations for Game Library:
 *   - Vanilla ES module class structure.
 *   - Scoped DOM and styling under .game-2048.
 *   - Dynamic tile sizing and GPU-accelerated CSS transforms.
 *   - Touch swipe and Arrow / WASD keyboard inputs.
 *   - LAYA agent observation and action hooks.
 *
 * Team ZENITH · PS 02: Beat the Bot · VESIT × Quest IT
 */

class Tile {
  constructor(position, value = 2) {
    this.x = position.x;
    this.y = position.y;
    this.value = value;
    this.previousPosition = null;
    this.mergedFrom = null;
    this.id = Tile._nextId++;
  }

  savePosition() {
    this.previousPosition = { x: this.x, y: this.y };
  }

  updatePosition(position) {
    this.x = position.x;
    this.y = position.y;
  }
}
Tile._nextId = 1;

class Grid {
  constructor(size = 4) {
    this.size = size;
    this.cells = this.empty();
  }

  empty() {
    const cells = [];
    for (let x = 0; x < this.size; x++) {
      cells[x] = [];
      for (let y = 0; y < this.size; y++) {
        cells[x].push(null);
      }
    }
    return cells;
  }

  randomAvailableCell() {
    const cells = this.availableCells();
    if (cells.length) {
      return cells[Math.floor(Math.random() * cells.length)];
    }
    return null;
  }

  availableCells() {
    const cells = [];
    this.eachCell((x, y, tile) => {
      if (!tile) {
        cells.push({ x, y });
      }
    });
    return cells;
  }

  eachCell(callback) {
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        callback(x, y, this.cells[x][y]);
      }
    }
  }

  cellsAvailable() {
    return this.availableCells().length > 0;
  }

  cellContent(cell) {
    if (this.withinBounds(cell)) {
      return this.cells[cell.x][cell.y];
    }
    return null;
  }

  insertTile(tile) {
    this.cells[tile.x][tile.y] = tile;
  }

  removeTile(tile) {
    this.cells[tile.x][tile.y] = null;
  }

  withinBounds(position) {
    return (
      position.x >= 0 &&
      position.x < this.size &&
      position.y >= 0 &&
      position.y < this.size
    );
  }
}

export class Game2048 {
  constructor(container) {
    this.container = container;
    this.size = 4;
    this.score = 0;
    this.over = false;
    this.won = false;
    this.keepPlaying = false;
    this._alive = true;
    this._gameOverCallbacks = [];

    // Root wrapper
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'game-2048';
    this.wrapper.setAttribute('tabindex', '0');
    this.wrapper.setAttribute('aria-label', '2048 board');

    // Board container
    this.board = document.createElement('div');
    this.board.className = 'game-2048__board';

    // 4x4 Grid background
    const gridEl = document.createElement('div');
    gridEl.className = 'game-2048__grid';
    for (let i = 0; i < 16; i++) {
      const cell = document.createElement('div');
      cell.className = 'game-2048__cell';
      gridEl.appendChild(cell);
    }
    this.board.appendChild(gridEl);

    // Tiles layer
    this.tilesContainer = document.createElement('div');
    this.tilesContainer.className = 'game-2048__tiles';
    this.board.appendChild(this.tilesContainer);

    this.wrapper.appendChild(this.board);
    this.container.appendChild(this.wrapper);

    // Touch swipe coordinates
    this._touchStartX = 0;
    this._touchStartY = 0;

    // Bound listeners
    this._onKeyDown = this.handleKeyDown.bind(this);
    this._onTouchStart = this.handleTouchStart.bind(this);
    this._onTouchEnd = this.handleTouchEnd.bind(this);

    window.addEventListener('keydown', this._onKeyDown, { passive: false });
    this.board.addEventListener('touchstart', this._onTouchStart, { passive: true });
    this.board.addEventListener('touchend', this._onTouchEnd, { passive: true });

    // Dynamic tile sizing observer
    this._resizeObserver = new ResizeObserver(() => this.updateDimensions());
    this._resizeObserver.observe(this.board);

    this.setup();
  }

  updateDimensions() {
    if (!this._alive || !this.board) return;
    const rect = this.board.getBoundingClientRect();
    const isSmall = rect.width < 340;
    const gap = isSmall ? 8 : 10;
    const available = rect.width - 2 * gap - (this.size - 1) * gap;
    const tileSize = Math.floor(available / this.size);

    this.wrapper.style.setProperty('--tile-gap', `${gap}px`);
    this.wrapper.style.setProperty('--tile-size', `${tileSize}px`);
  }

  setup() {
    this.grid = new Grid(this.size);
    this.score = 0;
    this.over = false;
    this.won = false;
    this.keepPlaying = false;

    this.addStartTiles();
    this.updateDimensions();
    this.actuate();
  }

  restart() {
    this.setup();
  }

  addStartTiles() {
    for (let i = 0; i < 2; i++) {
      this.addRandomTile();
    }
  }

  addRandomTile() {
    if (this.grid.cellsAvailable()) {
      const value = Math.random() < 0.9 ? 2 : 4;
      const tile = new Tile(this.grid.randomAvailableCell(), value);
      this.grid.insertTile(tile);
    }
  }

  prepareTiles() {
    this.grid.eachCell((x, y, tile) => {
      if (tile) {
        tile.mergedFrom = null;
        tile.savePosition();
      }
    });
  }

  moveTile(tile, cell) {
    this.grid.cells[tile.x][tile.y] = null;
    this.grid.cells[cell.x][cell.y] = tile;
    tile.updatePosition(cell);
  }

  /**
   * Move tiles in the specified direction.
   * @param {number} direction 0: up, 1: right, 2: down, 3: left
   */
  move(direction) {
    if (!this._alive || this.isGameTerminated()) return false;

    const vector = this.getVector(direction);
    const traversals = this.buildTraversals(vector);
    let moved = false;

    this.prepareTiles();

    traversals.x.forEach((x) => {
      traversals.y.forEach((y) => {
        const cell = { x, y };
        const tile = this.grid.cellContent(cell);

        if (tile) {
          const positions = this.findFarthestPosition(cell, vector);
          const next = this.grid.cellContent(positions.next);

          if (next && next.value === tile.value && !next.mergedFrom) {
            const merged = new Tile(positions.next, tile.value * 2);
            merged.mergedFrom = [tile, next];

            this.grid.insertTile(merged);
            this.grid.removeTile(tile);

            tile.updatePosition(positions.next);

            this.score += merged.value;
            if (merged.value === 2048) {
              this.won = true;
            }
          } else {
            this.moveTile(tile, positions.farthest);
          }

          if (cell.x !== tile.x || cell.y !== tile.y) {
            moved = true;
          }
        }
      });
    });

    if (moved) {
      this.addRandomTile();

      if (!this.movesAvailable()) {
        this.over = true;
      }

      this.actuate();

      if (this.isGameTerminated()) {
        for (const cb of this._gameOverCallbacks) {
          cb(this.score);
        }
      }
    }

    return moved;
  }

  getVector(direction) {
    const map = {
      0: { x: 0, y: -1 }, // Up
      1: { x: 1, y: 0 },  // Right
      2: { x: 0, y: 1 },  // Down
      3: { x: -1, y: 0 }, // Left
    };
    return map[direction];
  }

  buildTraversals(vector) {
    const traversals = { x: [], y: [] };
    for (let pos = 0; pos < this.size; pos++) {
      traversals.x.push(pos);
      traversals.y.push(pos);
    }
    if (vector.x === 1) traversals.x.reverse();
    if (vector.y === 1) traversals.y.reverse();
    return traversals;
  }

  findFarthestPosition(cell, vector) {
    let previous;
    do {
      previous = cell;
      cell = { x: previous.x + vector.x, y: previous.y + vector.y };
    } while (this.grid.withinBounds(cell) && !this.grid.cellContent(cell));

    return {
      farthest: previous,
      next: cell,
    };
  }

  movesAvailable() {
    return this.grid.cellsAvailable() || this.tileMatchesAvailable();
  }

  tileMatchesAvailable() {
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        const tile = this.grid.cellContent({ x, y });
        if (tile) {
          for (let direction = 0; direction < 4; direction++) {
            const vector = this.getVector(direction);
            const cell = { x: x + vector.x, y: y + vector.y };
            const other = this.grid.cellContent(cell);
            if (other && other.value === tile.value) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  isGameTerminated() {
    return this.over || (this.won && !this.keepPlaying);
  }

  actuate() {
    if (!this._alive || !this.tilesContainer) return;
    this.tilesContainer.innerHTML = '';

    this.grid.eachCell((x, y, tile) => {
      if (tile) {
        this.renderTile(tile);
      }
    });
  }

  renderTile(tile) {
    const el = document.createElement('div');
    const classes = ['tile', `tile-${tile.value}`];
    if (tile.value > 2048) classes.push('tile-super');

    const inner = document.createElement('div');
    inner.className = 'tile-inner';
    inner.textContent = String(tile.value);

    // Initial position
    const posX = tile.previousPosition ? tile.previousPosition.x : tile.x;
    const posY = tile.previousPosition ? tile.previousPosition.y : tile.y;

    el.style.transform = `translate(calc(${posX} * (var(--tile-size) + var(--tile-gap))), calc(${posY} * (var(--tile-size) + var(--tile-gap))))`;

    if (tile.previousPosition) {
      window.requestAnimationFrame(() => {
        el.style.transform = `translate(calc(${tile.x} * (var(--tile-size) + var(--tile-gap))), calc(${tile.y} * (var(--tile-size) + var(--tile-gap))))`;
      });
    } else if (tile.mergedFrom) {
      classes.push('tile-merged');
      tile.mergedFrom.forEach((merged) => this.renderTile(merged));
    } else {
      classes.push('tile-new');
    }

    el.className = classes.join(' ');
    el.appendChild(inner);
    this.tilesContainer.appendChild(el);
  }

  handleKeyDown(e) {
    if (!this._alive) return;
    const playScreen = document.getElementById('screen-play');
    if (!playScreen || playScreen.hidden) return;

    let handled = false;
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        handled = this.move(0);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        handled = this.move(1);
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        handled = this.move(2);
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        handled = this.move(3);
        break;
    }

    if (handled) {
      e.preventDefault();
    }
  }

  handleTouchStart(e) {
    if (e.touches.length > 0) {
      this._touchStartX = e.touches[0].clientX;
      this._touchStartY = e.touches[0].clientY;
    }
  }

  handleTouchEnd(e) {
    if (e.changedTouches.length === 0) return;
    const dx = e.changedTouches[0].clientX - this._touchStartX;
    const dy = e.changedTouches[0].clientY - this._touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 30) {
      if (absDx > absDy) {
        this.move(dx > 0 ? 1 : 3);
      } else {
        this.move(dy > 0 ? 2 : 0);
      }
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
    window.removeEventListener('keydown', this._onKeyDown);
    if (this.board) {
      this.board.removeEventListener('touchstart', this._onTouchStart);
      this.board.removeEventListener('touchend', this._onTouchEnd);
    }
    this._resizeObserver?.disconnect();
    this.wrapper.remove();
    this._gameOverCallbacks = [];
  }

  /* ── LAYA HOOK ──────────────────────────────────────────
   *
   * getState() returns the current 4x4 matrix and game status:
   *   {
   *     board: number[][],     // 4x4 array of tile numbers (0 for empty)
   *     score: number,
   *     over: boolean,
   *     won: boolean,
   *     maxTile: number,
   *     validMoves: number[]   // valid directions: 0=up, 1=right, 2=down, 3=left
   *   }
   *
   * move(direction) programmatically slides tiles in that direction:
   *   agent calls game.move(0 | 1 | 2 | 3)
   *
   * Reward signal: score delta or change in heuristic evaluation.
   * Terminal state: state.over === true.
   */
  getState() {
    const board = [];
    let maxTile = 0;
    for (let x = 0; x < this.size; x++) {
      board[x] = [];
      for (let y = 0; y < this.size; y++) {
        const val = this.grid.cells[x][y]?.value ?? 0;
        board[x][y] = val;
        if (val > maxTile) maxTile = val;
      }
    }

    const validMoves = [];
    for (let d = 0; d < 4; d++) {
      if (this.canMove(d)) validMoves.push(d);
    }

    return {
      board,
      score: this.score,
      over: this.over,
      won: this.won,
      maxTile,
      validMoves,
    };
  }

  canMove(direction) {
    const vector = this.getVector(direction);
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        const tile = this.grid.cellContent({ x, y });
        if (tile) {
          const cell = { x: x + vector.x, y: y + vector.y };
          if (this.grid.withinBounds(cell)) {
            const next = this.grid.cellContent(cell);
            if (!next || next.value === tile.value) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }
}
