/**
 * js/game-screen.js
 * Renders and manages the Play screen (#/play/:id).
 *
 * Responsibilities:
 *   - Build the play screen HTML (header, score bar, game viewport,
 *     game-over overlay, action buttons).
 *   - Dynamically import the game's entry module.
 *   - Wire game lifecycle: init → start → restart → destroy.
 *   - Persist and display best score via localStorage.
 *   - Handle Space/click/touch input and prevent page scroll.
 *   - Expose destroy() for the router's cleanup hook.
 *
 * Team ZENITH · PS 02: Beat the Bot · VESIT × Quest IT
 */

import { getGame } from './games.js';
import { navigate, showScreen } from './router.js';

/* ── Icons ─────────────────────────────────────────────── */
const ICONS = {
  arrowLeft: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  restart: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M13.5 8A5.5 5.5 0 112.5 6M2.5 2v4h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  home: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M2 7l6-5 6 5v8H10V9H6v6H2V7z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
  </svg>`,
};

/** Storage key generator for best score per game */
function getStorageKey(gameId) {
  return `game-library:${gameId}:best`;
}

/** Currently active game controller (from entry module) */
let _gameController = null;

/** Track whether space/click should be suppressed */
let _gameActive = false;

/**
 * Read and validate the stored best score.
 * @param {string} gameId
 * @returns {number}
 */
function readBestScore(gameId) {
  try {
    const raw = localStorage.getItem(getStorageKey(gameId));
    if (raw === null) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

/**
 * Write the best score to localStorage.
 * @param {string} gameId
 * @param {number} score
 */
function writeBestScore(gameId, score) {
  try {
    localStorage.setItem(getStorageKey(gameId), String(score));
  } catch {
    // Storage unavailable — fail silently, don't crash
  }
}

/**
 * Destroy the active game cleanly.
 * Called by router's cleanup hook before each route transition.
 */
export function destroyActiveGame() {
  _gameActive = false;
  if (_gameController && typeof _gameController.destroy === 'function') {
    try {
      _gameController.destroy();
    } catch (e) {
      console.warn('[GameScreen] Error during game.destroy():', e);
    }
  }
  _gameController = null;
}

/**
 * Render the play screen and load the game.
 * @param {{ id: string }} params
 */
export async function renderGameScreen(params) {
  const game = getGame(params.id);
  if (!game || game.status !== 'active') {
    navigate(`#/game/${params.id}`);
    return;
  }

  const screen = document.getElementById('screen-play');
  if (!screen) return;

  // Apply game theme CSS variables
  screen.style.setProperty('--game-accent',      game.theme.accent);
  screen.style.setProperty('--game-accent-soft', game.theme.accentSoft);
  screen.style.setProperty('--game-accent-glow', game.theme.accentGlow);
  screen.style.setProperty('--game-aspect',      game.aspectRatio || '9 / 16');

  let bestScore = readBestScore(game.id);

  // Build screen HTML
  screen.innerHTML = `
    <div class="play-screen">
      <!-- Header -->
      <header class="play-screen__header">
        <nav aria-label="Navigation">
          <a href="#/" class="back-nav" id="btn-back-play" aria-label="Back to Game Library">
            ${ICONS.arrowLeft}
            <span>Library</span>
          </a>
        </nav>
        <div class="play-screen__title-block">
          <span class="play-screen__game-name">${escHtml(game.name)}</span>
          <span class="play-screen__hint" aria-live="polite" id="play-hint">${escHtml(game.hint || '')}</span>
        </div>
        <button
          class="btn btn--ghost btn--sm"
          id="btn-header-restart"
          aria-label="Restart game"
        >${ICONS.restart} Restart</button>
      </header>

      <!-- Body -->
      <main class="play-screen__body" id="play-body">
        <!-- Score Bar -->
        <div class="score-bar" role="status" aria-label="Score display" aria-live="polite">
          <div class="score-item">
            <span class="score-item__label">Score</span>
            <span class="score-item__value" id="current-score" aria-label="Current score: 0">0</span>
          </div>
          <div class="score-divider" aria-hidden="true"></div>
          <div class="score-item">
            <span class="score-item__label">Best</span>
            <span class="score-item__value score-item__value--best" id="best-score" aria-label="Best score: ${bestScore}">${bestScore}</span>
          </div>
        </div>

        <!-- Game Viewport -->
        <div class="game-viewport" id="game-viewport" aria-label="${escHtml(game.name)} game area">
          <div class="game-viewport__inner" id="game-container">
            <!-- Game mounts here -->
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="game-actions">
          <button class="btn btn--secondary" id="btn-restart" aria-label="Restart game">
            ${ICONS.restart} Restart
          </button>
          <a href="#/" class="btn btn--ghost" id="btn-quit" aria-label="Quit to library">
            ${ICONS.home} Quit
          </a>
        </div>
      </main>
    </div>
  `;

  showScreen('screen-play');

  // DOM refs
  const container    = document.getElementById('game-container');
  const scoreEl      = document.getElementById('current-score');
  const bestEl       = document.getElementById('best-score');
  const btnRestart   = document.getElementById('btn-restart');
  const btnHdrRst    = document.getElementById('btn-header-restart');
  const hintEl       = document.getElementById('play-hint');

  if (!container) return;

  /**
   * Update the displayed current score.
   * @param {number} n
   */
  function updateScore(n) {
    if (scoreEl) {
      scoreEl.textContent = String(n);
      scoreEl.setAttribute('aria-label', `Current score: ${n}`);
    }
  }

  /**
   * Update best score display and persist if new record.
   * @param {number} finalScore
   */
  function checkBest(finalScore) {
    if (finalScore > bestScore) {
      bestScore = finalScore;
      writeBestScore(game.id, bestScore);
      if (bestEl) {
        bestEl.textContent = String(bestScore);
        bestEl.setAttribute('aria-label', `Best score: ${bestScore}`);
        bestEl.classList.remove('score-item__value--new-best');
        void bestEl.offsetHeight; // reflow to retrigger animation
        bestEl.classList.add('score-item__value--new-best');
        setTimeout(() => bestEl.classList.remove('score-item__value--new-best'), 600);
      }
    }
  }

  /**
   * Show game-over overlay inside the game viewport.
   * @param {number} finalScore
   */
  function showGameOver(finalScore) {
    _gameActive = false;
    checkBest(finalScore);

    // Remove existing overlay if present
    document.getElementById('gameover-overlay')?.remove();

    const isNewBest = finalScore === bestScore && finalScore > 0;

    const overlay = document.createElement('div');
    overlay.className = 'gameover-overlay';
    overlay.id = 'gameover-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Game over');
    overlay.innerHTML = `
      <div class="gameover-overlay__title">Game Over</div>
      <div class="gameover-overlay__score">
        <div class="gameover-overlay__score-label">Score</div>
        <div class="gameover-overlay__score-value">${finalScore}</div>
        ${isNewBest ? `<div class="gameover-overlay__best">🏆 New best!</div>` : ''}
      </div>
      <button class="btn btn--primary btn--lg" id="btn-gameover-restart" aria-label="Play again">
        Play Again
      </button>
    `;

    // Mount overlay in the viewport container
    const viewport = document.getElementById('game-container');
    viewport?.appendChild(overlay);

    document.getElementById('btn-gameover-restart')?.addEventListener('click', restartGame);
  }

  /**
   * Restart the game session cleanly.
   */
  function restartGame() {
    document.getElementById('gameover-overlay')?.remove();
    updateScore(0);
    _gameActive = true;
    if (hintEl) hintEl.textContent = game.hint || '';

    if (_gameController && typeof _gameController.restart === 'function') {
      try {
        _gameController.restart();
      } catch (e) {
        console.warn('[GameScreen] Restart error:', e);
      }
    }
  }

  // Wire restart buttons
  btnRestart?.addEventListener('click', restartGame);
  btnHdrRst?.addEventListener('click', restartGame);

  // Load and initialise the game module
  try {
    const rawPath = game.entryModule;
    const importUrl = rawPath.startsWith('./')
      ? new URL(rawPath.replace(/^\.\//, '../'), import.meta.url).href
      : new URL(rawPath, import.meta.url).href;
    const module = await import(importUrl);

    if (typeof module.init !== 'function') {
      throw new Error('Game module must export init()');
    }

    _gameController = module.init(container, {
      assetsBase: `./games/${game.id}/assets/`,
      game,
    });

    // Register game-over callback
    if (typeof _gameController.onGameOver === 'function') {
      _gameController.onGameOver((finalScore) => {
        updateScore(finalScore);
        showGameOver(finalScore);
      });
    }

    // Score polling (some implementations emit events, others need polling)
    let _lastScore = 0;
    const _scorePoller = setInterval(() => {
      if (!_gameController || !_gameActive) return;
      try {
        const s = _gameController.getScore?.() ?? 0;
        if (s !== _lastScore) {
          _lastScore = s;
          updateScore(s);
        }
      } catch {
        // ignore
      }
    }, 50);

    // Override destroy to also clear our poller
    const _origDestroy = _gameController.destroy?.bind(_gameController);
    _gameController.destroy = () => {
      clearInterval(_scorePoller);
      _origDestroy?.();
    };

    _gameActive = true;

    // Start the game
    if (typeof _gameController.start === 'function') {
      _gameController.start();
    }

  } catch (err) {
    console.error('[GameScreen] Failed to load game module:', err);
    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:1.5rem;text-align:center;color:var(--text-secondary);flex-direction:column;gap:1rem;">
        <div style="font-size:2rem;">⚠️</div>
        <div style="font-weight:600;color:var(--text-primary);">Failed to load game</div>
        <div style="font-size:0.85rem;">${err.message}</div>
        <a href="#/" class="btn btn--primary" style="margin-top:0.5rem;">Back to Library</a>
      </div>
    `;
  }
}

/** Minimal HTML escape */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
