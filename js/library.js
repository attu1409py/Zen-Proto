/**
 * js/library.js
 * Renders the Game Library home screen (#/).
 *
 * Builds game cards from the registry and handles navigation
 * to #/game/:id for the active Flappy Bird entry.
 *
 * Team ZENITH · PS 02: Beat the Bot · VESIT × Quest IT
 */

import { GAMES } from './games.js';
import { navigate, showScreen } from './router.js';

/** SVGs for placeholder game art */
const PLACEHOLDER_ART = {
  '2048': `
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="34" height="34" rx="8" fill="rgba(167,139,250,0.2)" stroke="rgba(167,139,250,0.4)" stroke-width="1.5"/>
      <rect x="42" y="4" width="34" height="34" rx="8" fill="rgba(167,139,250,0.12)" stroke="rgba(167,139,250,0.2)" stroke-width="1.5"/>
      <rect x="4" y="42" width="34" height="34" rx="8" fill="rgba(167,139,250,0.12)" stroke="rgba(167,139,250,0.2)" stroke-width="1.5"/>
      <rect x="42" y="42" width="34" height="34" rx="8" fill="rgba(167,139,250,0.35)" stroke="rgba(167,139,250,0.5)" stroke-width="1.5"/>
      <text x="21" y="26" text-anchor="middle" fill="rgba(167,139,250,0.9)" font-size="13" font-weight="700" font-family="Inter,sans-serif">2</text>
      <text x="21" y="64" text-anchor="middle" fill="rgba(167,139,250,0.5)" font-size="11" font-weight="600" font-family="Inter,sans-serif">4</text>
      <text x="59" y="64" text-anchor="middle" fill="rgba(167,139,250,0.9)" font-size="10" font-weight="700" font-family="Inter,sans-serif">2048</text>
    </svg>`,

  'hamster-hit': `
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Hole -->
      <ellipse cx="40" cy="52" rx="22" ry="10" fill="rgba(0,0,0,0.4)"/>
      <rect x="18" y="42" width="44" height="10" rx="2" fill="rgba(134,239,172,0.15)"/>
      <!-- Hamster face -->
      <circle cx="40" cy="38" r="18" fill="rgba(134,239,172,0.2)" stroke="rgba(134,239,172,0.4)" stroke-width="1.5"/>
      <circle cx="32" cy="35" r="3" fill="rgba(134,239,172,0.5)"/>
      <circle cx="48" cy="35" r="3" fill="rgba(134,239,172,0.5)"/>
      <circle cx="32" cy="35" r="1.5" fill="rgba(134,239,172,0.9)"/>
      <circle cx="48" cy="35" r="1.5" fill="rgba(134,239,172,0.9)"/>
      <path d="M35 43 Q40 47 45 43" stroke="rgba(134,239,172,0.8)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    </svg>`,

  'snake': `
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Snake body segments -->
      <rect x="10" y="36" width="14" height="14" rx="4" fill="rgba(252,211,77,0.15)" stroke="rgba(252,211,77,0.3)" stroke-width="1"/>
      <rect x="26" y="36" width="14" height="14" rx="4" fill="rgba(252,211,77,0.2)" stroke="rgba(252,211,77,0.35)" stroke-width="1"/>
      <rect x="42" y="36" width="14" height="14" rx="4" fill="rgba(252,211,77,0.3)" stroke="rgba(252,211,77,0.5)" stroke-width="1"/>
      <rect x="42" y="20" width="14" height="14" rx="4" fill="rgba(252,211,77,0.4)" stroke="rgba(252,211,77,0.6)" stroke-width="1"/>
      <!-- Head -->
      <rect x="58" y="20" width="14" height="14" rx="4" fill="rgba(252,211,77,0.7)" stroke="rgba(252,211,77,0.9)" stroke-width="1.5"/>
      <circle cx="63" cy="25" r="2" fill="#0b0d10"/>
      <circle cx="69" cy="25" r="2" fill="#0b0d10"/>
      <!-- Food dot -->
      <circle cx="20" cy="20" r="5" fill="rgba(252,211,77,0.9)"/>
    </svg>`,
};

/** Flappy Bird card art — inline SVG scene */
function renderFlappyArt() {
  return `
    <div class="art-scene" aria-hidden="true" style="position:relative;width:100%;height:100%;overflow:hidden;background:linear-gradient(180deg,#4dc8e8 0%,#87ceeb 60%,#7ec8e3 100%);">
      <!-- Sky layers -->
      <div style="position:absolute;bottom:28%;width:200%;height:35%;background:url('./games/flappy-bird/assets/sky.png') repeat-x bottom/auto 100%;opacity:0.9;"></div>
      <!-- Ground -->
      <div style="position:absolute;bottom:0;width:200%;height:28%;background:url('./games/flappy-bird/assets/land.png') repeat-x top/auto 100%;"></div>
      <!-- Upper pipe -->
      <div style="position:absolute;right:28%;top:0;width:13%;height:35%;background:url('./games/flappy-bird/assets/pipe-down.png') no-repeat center bottom/100% auto;"></div>
      <!-- Lower pipe -->
      <div style="position:absolute;right:28%;bottom:28%;width:13%;height:30%;background:url('./games/flappy-bird/assets/pipe-up.png') no-repeat center top/100% auto;"></div>
      <!-- Bird -->
      <div style="position:absolute;left:30%;top:38%;width:11%;aspect-ratio:34/24;background:url('./games/flappy-bird/assets/bird.png') no-repeat 0 0/100% auto;"></div>
    </div>`;
}

/** Icon SVGs */
const ICONS = {
  chevronRight: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  lock: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="3" y="7" width="10" height="8" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
};

/**
 * Build a single game card DOM element.
 * @param {import('./games.js').GameEntry} game
 * @returns {HTMLElement}
 */
function buildCard(game) {
  const isActive = game.status === 'active';

  const el = document.createElement(isActive ? 'a' : 'div');
  el.setAttribute('role', 'listitem');
  el.className = `game-card ${isActive ? 'game-card--active' : 'game-card--placeholder'}`;

  if (isActive) {
    el.href = `#/game/${game.id}`;
    el.setAttribute('aria-label', `Play ${game.name}`);
    // Apply game theme CSS vars
    el.style.setProperty('--game-accent',      game.theme.accent);
    el.style.setProperty('--game-accent-soft', game.theme.accentSoft);
    el.style.setProperty('--game-accent-glow', game.theme.accentGlow);
  } else {
    el.setAttribute('aria-disabled', 'true');
    el.setAttribute('aria-label', `${game.name} — coming soon`);
  }

  // Build art section
  const artSection = document.createElement('div');
  artSection.className = `game-card__art ${game.artClass}`;

  if (isActive && game.id === 'flappy-bird') {
    artSection.innerHTML = renderFlappyArt();
  } else {
    const artInner = document.createElement('div');
    artInner.className = 'game-card__art-inner';
    artInner.innerHTML = PLACEHOLDER_ART[game.id] ?? '';
    artSection.appendChild(artInner);
  }

  // Build body
  const body = document.createElement('div');
  body.className = 'game-card__body';

  const meta = document.createElement('div');
  meta.className = 'game-card__meta';

  const name = document.createElement('span');
  name.className = 'game-card__name';
  name.textContent = game.name;

  const badge = document.createElement('span');
  badge.className = `status-badge ${isActive ? 'status-badge--active' : 'status-badge--coming-soon'}`;
  badge.textContent = isActive ? 'Active' : 'Soon';

  meta.appendChild(name);
  meta.appendChild(badge);

  const desc = document.createElement('p');
  desc.className = 'game-card__description';
  desc.textContent = game.description;

  body.appendChild(meta);
  body.appendChild(desc);

  if (isActive) {
    const cta = document.createElement('div');
    cta.className = 'btn btn--primary btn--sm';
    cta.style.width = 'fit-content';
    cta.innerHTML = `Play now ${ICONS.chevronRight}`;
    cta.setAttribute('aria-hidden', 'true');
    body.appendChild(cta);
  } else {
    const lockBadge = document.createElement('div');
    lockBadge.className = 'mode-card__status';
    lockBadge.innerHTML = `${ICONS.lock} Coming soon`;
    body.appendChild(lockBadge);
  }

  el.appendChild(artSection);
  el.appendChild(body);

  return el;
}

/**
 * Render the library home screen.
 * Called by the router whenever the '#/' route is active.
 */
export function renderLibrary() {
  showScreen('screen-library');

  const grid = document.getElementById('game-grid');
  if (!grid) return;

  // Clear and rebuild grid
  grid.innerHTML = '';
  for (const game of GAMES) {
    grid.appendChild(buildCard(game));
  }
}
