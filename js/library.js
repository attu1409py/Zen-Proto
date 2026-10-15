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
/** Game Card Previews */
function renderCardArt(game) {
  if (game.id === 'flappy-bird') {
    return renderFlappyArt();
  }

  if (game.id === '2048') {
    return `
      <div class="art-scene" aria-hidden="true" style="position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 50%, #2a1b06 0%, #140d04 100%);">
        <svg width="140" height="100" viewBox="0 0 140 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Mini Board -->
          <rect x="10" y="5" width="120" height="90" rx="12" fill="#11151a" stroke="rgba(245,158,11,0.3)" stroke-width="1.5"/>
          <!-- Cells & Tiles -->
          <rect x="18" y="13" width="24" height="24" rx="5" fill="#1c222c" stroke="rgba(245,158,11,0.2)"/>
          <text x="30" y="29" text-anchor="middle" fill="#f3f5f7" font-size="11" font-weight="700" font-family="Inter,sans-serif">2</text>
          
          <rect x="46" y="13" width="24" height="24" rx="5" fill="#252d3b" stroke="rgba(245,158,11,0.3)"/>
          <text x="58" y="29" text-anchor="middle" fill="#f3f5f7" font-size="11" font-weight="700" font-family="Inter,sans-serif">4</text>
          
          <rect x="74" y="13" width="24" height="24" rx="5" fill="#422912" stroke="rgba(245,158,11,0.4)"/>
          <text x="86" y="29" text-anchor="middle" fill="#fde68a" font-size="11" font-weight="700" font-family="Inter,sans-serif">8</text>

          <rect x="102" y="13" width="24" height="24" rx="5" fill="#5e360f" stroke="rgba(245,158,11,0.5)"/>
          <text x="114" y="29" text-anchor="middle" fill="#fef3c7" font-size="10" font-weight="700" font-family="Inter,sans-serif">16</text>

          <rect x="18" y="41" width="24" height="24" rx="5" fill="#7d4409"/>
          <text x="30" y="57" text-anchor="middle" fill="#ffffff" font-size="10" font-weight="700" font-family="Inter,sans-serif">32</text>

          <rect x="46" y="41" width="24" height="24" rx="5" fill="#b56201"/>
          <text x="58" y="57" text-anchor="middle" fill="#ffffff" font-size="9" font-weight="700" font-family="Inter,sans-serif">128</text>

          <!-- Golden 2048 Tile -->
          <rect x="74" y="41" width="52" height="48" rx="8" fill="url(#goldGrad)" stroke="#ffffff" stroke-width="1.5" filter="drop-shadow(0 0 10px rgba(251,191,36,0.6))"/>
          <text x="100" y="71" text-anchor="middle" fill="#0b0d10" font-size="16" font-weight="800" font-family="Inter,sans-serif">2048</text>
          
          <defs>
            <linearGradient id="goldGrad" x1="74" y1="41" x2="126" y2="89" gradientUnits="userSpaceOnUse">
              <stop stop-color="#fde047"/>
              <stop offset="1" stop-color="#f59e0b"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
    `;
  }

  if (game.id === 'hamster-hit') {
    return `
      <div class="art-scene" aria-hidden="true" style="position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 40%, #261608 0%, #120b04 100%);">
        <svg width="120" height="90" viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Burrow Hole -->
          <ellipse cx="60" cy="68" rx="42" ry="16" fill="#090b0e" stroke="rgba(255,119,34,0.3)" stroke-width="2"/>
          <ellipse cx="60" cy="69" rx="36" ry="12" fill="#050608"/>
          <!-- Emerging Hamster -->
          <circle cx="44" cy="36" r="9" fill="#d97706"/>
          <circle cx="44" cy="36" r="5" fill="#fca5a5"/>
          <circle cx="76" cy="36" r="9" fill="#d97706"/>
          <circle cx="76" cy="36" r="5" fill="#fca5a5"/>
          <ellipse cx="60" cy="52" rx="22" ry="19" fill="#f59e0b"/>
          <ellipse cx="60" cy="56" rx="13" ry="11" fill="#fef3c7"/>
          <circle cx="48" cy="53" r="4" fill="#f87171" opacity="0.6"/>
          <circle cx="72" cy="53" r="4" fill="#f87171" opacity="0.6"/>
          <circle cx="53" cy="48" r="3.5" fill="#111827"/>
          <circle cx="54" cy="47" r="1.2" fill="#ffffff"/>
          <circle cx="67" cy="48" r="3.5" fill="#111827"/>
          <circle cx="68" cy="47" r="1.2" fill="#ffffff"/>
          <polygon points="58,52 62,52 60,54.5" fill="#f43f5e"/>
          <path d="M58 55 Q60 57.5 62 55" stroke="#78350f" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          <!-- Front Lip of hole -->
          <path d="M22 68 Q60 84 98 68" stroke="#ff7722" stroke-width="2.5" fill="none" opacity="0.7"/>
          <!-- Mallet Sparkle -->
          <circle cx="95" cy="25" r="3" fill="#ff7722"/>
          <polygon points="95,15 97,22 104,25 97,28 95,35 93,28 86,25 93,22" fill="#fbbf24"/>
        </svg>
      </div>
    `;
  }

  if (game.id === 'snake') {
    return `
      <div class="art-scene" aria-hidden="true" style="position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 50%, #092011 0%, #05120a 100%);">
        <svg width="130" height="90" viewBox="0 0 130 90" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Subtle Grid lines -->
          <path d="M15 15 H115 M15 35 H115 M15 55 H115 M15 75 H115" stroke="rgba(34,197,94,0.08)" stroke-width="1"/>
          <path d="M25 5 V85 M50 5 V85 M75 5 V85 M100 5 V85" stroke="rgba(34,197,94,0.08)" stroke-width="1"/>
          
          <!-- Snake Body Segments -->
          <rect x="25" y="55" width="16" height="16" rx="5" fill="#16a34a"/>
          <rect x="45" y="55" width="16" height="16" rx="5" fill="#22c55e"/>
          <rect x="65" y="55" width="16" height="16" rx="5" fill="#22c55e"/>
          <rect x="65" y="35" width="16" height="16" rx="5" fill="#22c55e"/>
          <!-- Snake Head with Glow -->
          <rect x="85" y="35" width="18" height="18" rx="6" fill="#4ade80" filter="drop-shadow(0 0 8px rgba(74,222,128,0.7))"/>
          <circle cx="98" cy="40" r="2.2" fill="#0b0d10"/>
          <circle cx="98" cy="48" r="2.2" fill="#0b0d10"/>
          
          <!-- Radiant Food Apple Orb -->
          <circle cx="106" cy="63" r="10" fill="rgba(239,68,68,0.25)"/>
          <circle cx="106" cy="63" r="6" fill="#ef4444" filter="drop-shadow(0 0 6px #ef4444)"/>
          <circle cx="104" cy="61" r="1.5" fill="#ffffff"/>
        </svg>
      </div>
    `;
  }

  return '';
}

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
  artSection.innerHTML = renderCardArt(game);

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
