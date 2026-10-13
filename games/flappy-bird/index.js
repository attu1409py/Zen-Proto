/**
 * games/flappy-bird/index.js
 * Public entry point for the Flappy Bird game module.
 *
 * ATTRIBUTION:
 *   Based on "Floppy Bird" by Nebez Briefkani
 *   https://github.com/nebez/floppybird
 *   Apache 2.0 License
 *
 * This module is the boundary between the Game Library
 * application and the game implementation. It:
 *
 *   1. Exposes the required synchronous init() function.
 *   2. Returns a controller object immediately (before assets load).
 *   3. Internally manages the async asset loading.
 *   4. Exposes the LAYA extension hooks (getState, issueFlap).
 *
 * Required interface:
 *   init(container, options)  → controller
 *   controller.start()
 *   controller.restart()
 *   controller.getScore()     → number
 *   controller.onGameOver(fn)
 *   controller.destroy()
 *
 * LAYA extension hooks (for future AI agent):
 *   controller.getState()     → observation object
 *   controller.issueFlap()    → issue programmatic flap
 *
 * Team ZENITH · PS 02: Beat the Bot · VESIT × Quest IT
 */

import { createGame } from './game.js';

/**
 * Initialise Flappy Bird inside the given container.
 *
 * Returns a controller immediately; asset loading happens
 * asynchronously in the background via the internal Promise.
 *
 * @param {HTMLElement} container — DOM element to mount into
 * @param {object}      options
 * @param {string}      [options.assetsBase] — URL prefix for game assets
 * @returns {GameController}
 */
export function init(container, options = {}) {
  let _game = null;       // resolves once setup() completes
  let _ready = false;     // true once game is loaded
  let _pendingGameOver = null; // callback registered before ready
  let _destroyed = false;

  /** @type {Promise<void>} */
  const _readyPromise = createGame(container, options).then((game) => {
    if (_destroyed) {
      game.destroy();
      return;
    }
    _game = game;
    _ready = true;

    // Re-apply any callback that was registered before ready
    if (_pendingGameOver) {
      _game.onGameOver(_pendingGameOver);
    }
  }).catch((err) => {
    console.error('[FlappyBird] Failed to initialise game:', err);
  });

  /* ── Controller object ──────────────────────────────── */

  const controller = {

    /**
     * Start or resume the game.
     * Waits for assets to finish loading before starting.
     */
    start() {
      _readyPromise.then(() => {
        if (!_destroyed && _game) _game.start();
      });
    },

    /**
     * Restart the current session.
     * Resets score and bird position.
     */
    restart() {
      if (_ready && _game) {
        _game.restart();
      } else {
        _readyPromise.then(() => {
          if (!_destroyed && _game) _game.restart();
        });
      }
    },

    /**
     * Returns the current score synchronously.
     * Returns 0 if the game hasn't loaded yet.
     * @returns {number}
     */
    getScore() {
      return _game?.getScore() ?? 0;
    },

    /**
     * Register a game-over callback.
     * Safe to call before assets are loaded.
     * @param {Function} fn — called with (finalScore, stateSnapshot)
     */
    onGameOver(fn) {
      if (_ready && _game) {
        _game.onGameOver(fn);
      } else {
        _pendingGameOver = fn;
      }
    },

    /**
     * Destroy the game: cancel loops, remove listeners, clear DOM.
     * The container is left empty and ready for reuse or removal.
     */
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
     * getState() provides the observation vector for the agent.
     * issueFlap() is the action primitive the agent calls.
     *
     * These are intentionally minimal — the LAYA agent project
     * should extend / wrap this interface rather than modify it.
     *
     * LOGGING REQUIREMENTS (for main project):
     *   Each agent step should log:
     *     { episode, step, state: getState(), action, reward, done }
     *   where reward = score delta and done = (state === 'gameover').
     */

    /**
     * Get the current game state for agent observation.
     * @returns {object|null}
     */
    getState() {
      return _game?.getState() ?? null;
    },

    /**
     * Programmatically issue a flap.
     * Call this once per agent decision step.
     */
    issueFlap() {
      _game?.issueFlap();
    },

    /**
     * Promise that resolves when the game is fully loaded.
     * LAYA agent should await this before starting an episode.
     */
    ready: _readyPromise,
  };

  return controller;
}

/**
 * @typedef {Object} GameController
 * @property {() => void}            start
 * @property {() => void}            restart
 * @property {() => number}          getScore
 * @property {(fn: Function) => void} onGameOver
 * @property {() => void}            destroy
 * @property {() => object|null}     getState      — LAYA hook
 * @property {() => void}            issueFlap     — LAYA hook
 * @property {Promise<void>}         ready         — LAYA hook
 */
