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
 * Arrow keys and Space are intercepted only when the play screen is active.
 * This prevents page scrolling during gameplay across all games without
 * breaking normal keyboard navigation on other screens.
 */
document.addEventListener('keydown', (e) => {
  const playScreen = document.getElementById('screen-play');
  if (playScreen && !playScreen.hidden) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Space'].includes(e.key) || e.code === 'Space') {
      e.preventDefault();
    }
    if (e.key === ' ' || e.code === 'Space') {
      document.dispatchEvent(new CustomEvent('game:flap'));
      document.dispatchEvent(new CustomEvent('game:space'));
    }
  }
}, { passive: false });

/* ── Start the router ──────────────────────────────────── */
initRouter();
