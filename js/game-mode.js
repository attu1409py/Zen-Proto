/**
 * js/game-mode.js
 * Renders the Game Mode Selection screen (#/game/:id).
 *
 * Presents two mode cards:
 *   A) Play Yourself  — enabled, navigates to #/play/:id
 *   B) Let Laya Play  — deliberately unavailable in prototype
 *
 * The game theme (accent colour, glow) is applied as CSS custom
 * properties on the screen element itself, so all child components
 * automatically inherit the per-game visual identity.
 *
 * Team ZENITH · PS 02: Beat the Bot · VESIT × Quest IT
 */

import { getGame } from './games.js';
import { navigate, showScreen } from './router.js';

/* ── Icon SVGs ─────────────────────────────────────────── */
const ICONS = {
  arrowLeft: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  controller: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="2" y="7" width="20" height="12" rx="5" stroke="currentColor" stroke-width="1.8"/>
    <path d="M7 13v-3M5.5 11.5h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="16" cy="11" r="1.2" fill="currentColor"/>
    <circle cx="19" cy="13" r="1.2" fill="currentColor"/>
  </svg>`,

  robot: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="5" y="8" width="14" height="12" rx="3" stroke="currentColor" stroke-width="1.8"/>
    <circle cx="9" cy="13" r="1.5" fill="currentColor"/>
    <circle cx="15" cy="13" r="1.5" fill="currentColor"/>
    <path d="M10 17h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M12 8V5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="12" cy="4" r="1.5" fill="currentColor"/>
    <path d="M8 8H5a1 1 0 01-1-1V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M16 8h3a1 1 0 001-1V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  lock: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="3" y="7" width="10" height="8" rx="2" stroke="currentColor" stroke-width="1.5"/>
    <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  bird: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="20" cy="22" rx="12" ry="10" fill="#f3c97a"/>
    <ellipse cx="16" cy="23" rx="5" ry="3" fill="#e6b547"/>
    <circle cx="24" cy="18" r="4" fill="white"/>
    <circle cx="25" cy="18" r="2" fill="#1a1a2e"/>
    <path d="M27 20 L33 18 L33 21.5 Z" fill="#ff8c42"/>
    <path d="M12 23 L8 26 L8 23 Z" fill="#e6b547"/>
  </svg>`,
};

/**
 * Render the art section for a given game.
 * @param {import('./games.js').GameEntry} game
 * @returns {string} HTML string
 */
function renderModeArt(game) {
  if (game.id === 'flappy-bird') {
    return ICONS.bird;
  }
  return `<div style="font-size:2rem;opacity:0.6">🎮</div>`;
}

/**
 * Render the game mode selection screen.
 * @param {{ id: string }} params — from router
 */
export function renderGameMode(params) {
  const game = getGame(params.id);
  if (!game) {
    window.location.hash = '#/';
    return;
  }

  const screen = document.getElementById('screen-game-mode');
  if (!screen) return;

  // Apply per-game theme as CSS custom properties
  screen.style.setProperty('--game-accent',      game.theme.accent);
  screen.style.setProperty('--game-accent-soft', game.theme.accentSoft);
  screen.style.setProperty('--game-accent-glow', game.theme.accentGlow);

  screen.innerHTML = `
    <div class="mode-screen">
      <!-- Header -->
      <header class="mode-screen__header">
        <div class="mode-screen__header-inner">
          <nav class="mode-screen__nav" aria-label="Breadcrumb">
            <a href="#/" class="back-nav" aria-label="Back to Game Library">
              ${ICONS.arrowLeft}
              <span>Game Library</span>
            </a>
          </nav>
          <div class="mode-screen__identity">
            <div class="mode-screen__art" aria-hidden="true">
              ${renderModeArt(game)}
            </div>
            <div>
              <h1 class="mode-screen__game-title">${escHtml(game.name)}</h1>
              <p class="mode-screen__game-desc">${escHtml(game.descriptionLong)}</p>
              <div class="mode-screen__accent-line"></div>
            </div>
          </div>
        </div>
      </header>

      <!-- Body -->
      <main class="mode-screen__body" aria-label="Choose your mode">
        <div class="mode-grid">

          <!-- Mode A: Play Yourself (ENABLED) -->
          <div
            class="mode-card mode-card--available"
            id="mode-play-yourself"
            role="button"
            tabindex="0"
            aria-label="Play ${escHtml(game.name)} yourself"
          >
            <div class="mode-card__icon-wrap" aria-hidden="true">
              ${ICONS.controller}
            </div>
            <div>
              <div class="mode-card__label">Human mode</div>
              <div class="mode-card__title">Play Yourself</div>
            </div>
            <p class="mode-card__desc">
              You control the bird. Tap, click, or press Space to flap.
              Your reflexes, your score.
            </p>
            <button
              class="btn btn--primary btn--lg"
              id="btn-play-yourself"
              aria-label="Start playing ${escHtml(game.name)}"
            >
              Play Yourself
            </button>
          </div>

          <!-- Mode B: Let Laya Play (DISABLED – prototype) -->
          <div
            class="mode-card mode-card--unavailable"
            id="mode-laya"
            aria-disabled="true"
            role="group"
            aria-label="Laya agent mode — not yet available"
          >
            <div class="mode-card__icon-wrap" aria-hidden="true">
              ${ICONS.robot}
            </div>
            <div>
              <div class="mode-card__label">AI agent mode</div>
              <div class="mode-card__title">Let Laya Play</div>
            </div>

            <div class="mode-card__status" aria-label="Status: coming in full project">
              ${ICONS.lock}
              <span>Coming in the full project</span>
            </div>

            <p class="mode-card__desc">
              Laya, our AI agent, will learn to play the game autonomously
              through reinforcement learning — training, improving, and eventually
              beating your high score.
            </p>

            <div class="mode-card__note" role="note">
              <strong>Prototype build.</strong> Laya agent mode is not available
              yet. It arrives in the full project.
            </div>

            <button
              class="btn btn--secondary btn--lg"
              disabled
              aria-disabled="true"
              aria-label="Laya mode not yet available"
              style="cursor:not-allowed;"
              tabindex="-1"
            >
              ${ICONS.lock}
              Not yet available
            </button>
          </div>

        </div>
      </main>
    </div>
  `;

  showScreen('screen-game-mode');

  // Wire up the "Play Yourself" card and button
  const cardPlay = document.getElementById('mode-play-yourself');
  const btnPlay  = document.getElementById('btn-play-yourself');
  const playTarget = `#/play/${game.id}`;

  function handlePlay(e) {
    // Avoid double-trigger if button inside card also fires
    if (e.target !== e.currentTarget && e.target.closest('#btn-play-yourself')) return;
    navigate(playTarget);
  }

  function handlePlayKeyboard(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(playTarget);
    }
  }

  cardPlay?.addEventListener('click', handlePlay);
  cardPlay?.addEventListener('keydown', handlePlayKeyboard);
  btnPlay?.addEventListener('click', (e) => {
    e.stopPropagation();
    navigate(playTarget);
  });
}

/** Minimal HTML escape */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
