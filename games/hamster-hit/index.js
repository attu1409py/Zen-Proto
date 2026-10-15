/**
 * games/hamster-hit/index.js
 * Public entry point for the Hamster Hit game module.
 *
 * ATTRIBUTION:
 *   Whack-a-mole mechanics based on Yeab-Ad/Punch-Game & naikmubashir/FeF-WhackAMole
 *   License: MIT
 *
 * Exposes the standard Game Library controller contract:
 *   init(container, options) -> controller
 *
 * Team ZENITH · PS 02: Beat the Bot · VESIT × Quest IT
 */

import { HamsterHitGame } from './game.js';

let _cssLoaded = false;
function ensureCss() {
  if (_cssLoaded) return;
  const linkId = 'game-css-hamster-hit';
  if (!document.getElementById(linkId)) {
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = './games/hamster-hit/hamster-hit.css';
    document.head.appendChild(link);
  }
  _cssLoaded = true;
}

/**
 * Initialise Hamster Hit inside the given container.
 * @param {HTMLElement} container
 * @param {object} [options]
 * @returns {GameController}
 */
export function init(container, options = {}) {
  ensureCss();

  let _game = null;
  let _destroyed = false;
  let _pendingGameOver = null;

  _game = new HamsterHitGame(container);

  const controller = {
    start() {
      if (!_destroyed && _game) {
        _game.start();
      }
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
     * getState() returns current board and creature statuses.
     * whack(holeIndex) executes a hit on hole 0..8.
     *
     * LOGGING REQUIREMENTS (for main project):
     *   Each agent step should log:
     *     { episode, step, state: getState(), action, reward, done }
     */
    getState() {
      return _game?.getState() ?? null;
    },

    whack(holeIndex) {
      _game?.whack(holeIndex);
    },

    ready: Promise.resolve(),
  };

  if (_pendingGameOver && _game) {
    _game.onGameOver(_pendingGameOver);
  }

  return controller;
}
