/**
 * games/2048/index.js
 * Public entry point for 2048 game module.
 *
 * ATTRIBUTION:
 *   Original 2048 by Gabriele Cirulli (https://github.com/gabrielecirulli/2048)
 *   MIT License
 *
 * Exposes the standard Game Library controller contract:
 *   init(container, options) -> controller
 *
 * Team ZENITH · PS 02: Beat the Bot · VESIT × Quest IT
 */

import { Game2048 } from './game.js';

let _cssLoaded = false;
function ensureCss() {
  if (_cssLoaded) return;
  const linkId = 'game-css-2048';
  if (!document.getElementById(linkId)) {
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = './games/2048/2048.css';
    document.head.appendChild(link);
  }
  _cssLoaded = true;
}

/**
 * Initialise 2048 inside the given container.
 * @param {HTMLElement} container
 * @param {object} [options]
 * @returns {GameController}
 */
export function init(container, options = {}) {
  ensureCss();

  let _game = null;
  let _destroyed = false;
  let _pendingGameOver = null;

  _game = new Game2048(container);

  const controller = {
    start() {
      // 2048 is ready upon setup
    },

    restart() {
      if (!_destroyed && _game) {
        _game.restart();
      }
    },

    getScore() {
      return _game?.getScore() ?? 0;
    },

    onGameOver(fn) {
      if (_game) {
        _game.onGameOver(fn);
      } else {
        _pendingGameOver = fn;
      }
    },

    destroy() {
      _destroyed = true;
      if (_game) {
        _game.destroy();
        _game = null;
      }
      _pendingGameOver = null;
    },

    /* ── LAYA Extension Hooks ───────────────────────────
     *
     * getState() returns current board representation for agent.
     * move(direction) executes programmatic action (0=up, 1=right, 2=down, 3=left).
     *
     * LOGGING REQUIREMENTS (for main project):
     *   Each agent step should log:
     *     { episode, step, state: getState(), action, reward, done }
     */
    getState() {
      return _game?.getState() ?? null;
    },

    move(direction) {
      return _game?.move(direction) ?? false;
    },

    ready: Promise.resolve(),
  };

  if (_pendingGameOver && _game) {
    _game.onGameOver(_pendingGameOver);
  }

  return controller;
}
