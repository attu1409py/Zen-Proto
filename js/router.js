/**
 * js/router.js
 * Lightweight hash-based router.
 *
 * Routes:
 *   #/                 → library screen
 *   #/game/:gameId     → game-mode selection screen
 *   #/play/:gameId     → playable game screen
 *
 * Design principles:
 *   - No duplicate event listeners; listener added once at init.
 *   - clean() called before each route to destroy active game.
 *   - Screen transitions use CSS animation classes.
 *   - Invalid game IDs and unknown paths render the 404 screen.
 *
 * Team ZENITH · PS 02: Beat the Bot · VESIT × Quest IT
 */

import { getGame } from './games.js';

/** @type {Record<string, () => void>} registered route handlers */
const _handlers = {};

/** Current cleanup function (e.g. game.destroy) */
let _cleanup = null;

/** Whether a transition is already in flight */
let _transitioning = false;

/**
 * Register a route handler.
 * @param {string}   pattern  — e.g. '/', '/game/:id', '/play/:id'
 * @param {Function} handler  — called with params object
 */
export function route(pattern, handler) {
  _handlers[pattern] = handler;
}

/**
 * Register a cleanup function that runs before every route change.
 * Use this to call game.destroy() etc.
 * @param {Function} fn
 */
export function onBeforeRoute(fn) {
  _cleanup = fn;
}

/**
 * Navigate programmatically.
 * @param {string} hash — e.g. '#/game/flappy-bird'
 */
export function navigate(hash) {
  window.location.hash = hash;
}

/**
 * Resolve the current hash against registered patterns.
 * Matches:  '/', '/game/:id', '/play/:id'
 * Returns:  { pattern, params }
 */
function resolve(hash) {
  // Normalise: strip leading '#', ensure starts with '/'
  const path = hash.replace(/^#/, '') || '/';

  // Static match
  if (_handlers[path]) {
    return { pattern: path, params: {} };
  }

  // Parameterised match
  for (const pattern of Object.keys(_handlers)) {
    if (!pattern.includes(':')) continue;
    const patternParts = pattern.split('/');
    const pathParts    = path.split('/');
    if (patternParts.length !== pathParts.length) continue;

    const params = {};
    let matched = true;
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
      } else if (patternParts[i] !== pathParts[i]) {
        matched = false;
        break;
      }
    }
    if (matched) return { pattern, params };
  }

  return null;
}

/**
 * Show one screen, hide all others, with CSS transitions.
 * @param {string} id — screen element ID
 */
export function showScreen(id) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(s => {
    if (s.id === id) {
      s.hidden = false;
      s.classList.remove('screen--leaving');
      // Force reflow so the animation starts fresh
      void s.offsetHeight;
      s.classList.add('screen--entering');
      s.addEventListener('animationend', () => {
        s.classList.remove('screen--entering');
      }, { once: true });
    } else {
      s.hidden = true;
      s.classList.remove('screen--entering', 'screen--leaving');
    }
  });
}

/**
 * Dispatch the current route.
 */
function dispatch() {
  if (_transitioning) return;

  // Run cleanup before switching screens
  if (typeof _cleanup === 'function') {
    _cleanup();
  }

  const hash = window.location.hash || '#/';
  const match = resolve(hash);

  if (!match) {
    showScreen('screen-404');
    return;
  }

  const { pattern, params } = match;

  // Validate game IDs against the registry
  if (params.id) {
    const game = getGame(params.id);
    if (!game) {
      showScreen('screen-404');
      return;
    }
    // For /play/:id, only active games can be played
    if (pattern === '/play/:id' && game.status !== 'active') {
      navigate('#/game/' + params.id);
      return;
    }
  }

  _handlers[pattern]?.(params);
}

/**
 * Initialise the router. Call once at app startup.
 */
export function initRouter() {
  window.addEventListener('hashchange', dispatch);
  // Dispatch immediately for the current URL (direct links / refresh)
  dispatch();
}
