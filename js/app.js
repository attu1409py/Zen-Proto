/**
 * js/app.js
 * Application entry point.
 *
 * Initialises the router and wires routes to screen renderers.
 * Also registers the global keyboard handler (Space to flap)
 * and the router cleanup hook (game.destroy).
 *
 * Team ZENITH · PS 02: Beat the Bot · VESIT × Quest IT
 */

import { route, initRouter, onBeforeRoute } from './router.js';
import { renderLibrary }    from './library.js';
import { renderGameMode }   from './game-mode.js';
import { renderGameScreen, destroyActiveGame } from './game-screen.js';

/* ── Route cleanup hook ────────────────────────────────── */
/*
 * Before every route transition, destroy any active game.
 * This cancels animation frames, removes event listeners,
 * and clears timers — preventing stale game instances.
 */
onBeforeRoute(destroyActiveGame);

/* ── Routes ────────────────────────────────────────────── */
route('/',           () => renderLibrary());
route('/game/:id',  (params) => renderGameMode(params));
route('/play/:id',  (params) => renderGameScreen(params));

/* ── Global keyboard handler ───────────────────────────── */
/*
 * Space key is intercepted only when the play screen is active.
 * This prevents scrolling during gameplay without breaking
 * normal keyboard navigation on other screens.
 *
 * The actual flap action is forwarded to the game via a
 * CustomEvent on the document, which the game module listens for.
 * This decouples app-level input handling from game-specific logic.
 */
document.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.code === 'Space') {
    const playScreen = document.getElementById('screen-play');
    if (playScreen && !playScreen.hidden) {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('game:flap'));
    }
  }
}, { passive: false });

/* ── Start the router ──────────────────────────────────── */
initRouter();
