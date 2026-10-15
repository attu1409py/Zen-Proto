/**
 * games/snake/index.js
 * Public entry point for the Snake game module.
 *
 * ATTRIBUTION:
 *   Canvas snake game based on Impre7ive/snake-game-javascript
 *   License: MIT
 *
 * Exposes the standard Game Library controller contract:
 *   init(container, options) -> controller
 *
 * Team ZENITH · PS 02: Beat the Bot · VESIT × Quest IT
 */

import { SnakeGame } from './game.js';

let _cssLoaded = false;
function ensureCss() {
  if (_cssLoaded) return;
  const linkId = 'game-css-snake';
  if (!document.getElementById(linkId)) {
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = './games/snake/snake.css';
    document.head.appendChild(link);
  }
  _cssLoaded = true;
}

/**
 * Initialise Snake inside the given container.
 * @param {HTMLElement} container
 * @param {object} [options]
 * @returns {GameController}
 */
export function init(container, options = {}) {
  ensureCss();

  let _game = null;
  let _destroyed = false;
  let _pendingGameOver = null;

  _game = new SnakeGame(container);

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
     * getState() returns snake, food, direction, score, and state.
     * setDirection(dir) programmatically sends a direction action ('up'|'down'|'left'|'right').
     *
     * LOGGING REQUIREMENTS (for main project):
     *   Each agent step should log:
     *     { episode, step, state: getState(), action, reward, done }
     */
    getState() {
      return _game?.getState() ?? null;
    },

    setDirection(dir) {
      _game?.setDirection(dir);
    },

    ready: Promise.resolve(),
  };

  if (_pendingGameOver && _game) {
    _game.onGameOver(_pendingGameOver);
  }

  return controller;
}
