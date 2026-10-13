/**
 * js/games.js
 * Single source of truth for the Game Library registry.
 *
 * Each entry describes a game: its identity, display metadata,
 * current status, visual theme, and where to load its module.
 *
 * Status values:
 *   "active"      — fully playable, entry module present.
 *   "coming-soon" — visible placeholder, no playable module.
 *
 * Adding a new game:
 *   1. Add an entry object below.
 *   2. Create the game folder at games/<id>/.
 *   3. Export the required interface from games/<id>/index.js.
 *   4. Set status to "active".
 *
 * Team ZENITH · PS 02: Beat the Bot · VESIT × Quest IT
 */

/** @type {GameEntry[]} */
export const GAMES = [
  {
    /** Unique URL-safe identifier */
    id: 'flappy-bird',

    /** Display name shown in UI */
    name: 'Flappy Bird',

    /** Short description shown on card and mode screen */
    description: 'Navigate the pipes. Beat your best.',

    /** Full flavour text for mode screen */
    descriptionLong: 'Tap, click, or press Space to flap your wings. Squeeze through the gaps without hitting a pipe or the ground. How far can you go?',

    /**
     * "active"      → playable; entryModule is loaded.
     * "coming-soon" → shown as placeholder; no interaction.
     */
    status: 'active',

    /**
     * Per-game CSS custom properties.
     * Applied to the game screen as --game-accent etc.
     * Used by buttons, borders, and glow effects.
     */
    theme: {
      accent:     '#66d9e8',
      accentSoft: 'rgba(102, 217, 232, 0.12)',
      accentGlow: 'rgba(102, 217, 232, 0.20)',
    },

    /**
     * Path to the ES-module entry point that exports the
     * game controller interface: { init, start, restart,
     * getScore, onGameOver, destroy }.
     */
    entryModule: './games/flappy-bird/index.js',

    /**
     * Whether the LAYA agent has been integrated with this game.
     * false = Laya mode shown but disabled in prototype.
     * true  = (future) Laya agent connected.
     */
    layaAvailable: false,

    /** Decorative info for placeholders / cards */
    artClass: 'game-card__art--flappy',
  },

  {
    id: '2048',
    name: '2048',
    description: 'Slide and merge tiles to reach the elusive 2048 tile.',
    descriptionLong: 'Use arrow keys or swipe to combine matching tiles. Reach 2048 to win.',
    status: 'coming-soon',
    theme: {
      accent:     '#a78bfa',
      accentSoft: 'rgba(167, 139, 250, 0.12)',
      accentGlow: 'rgba(167, 139, 250, 0.20)',
    },
    entryModule: null,
    layaAvailable: false,
    artClass: 'game-card__art--2048',
  },

  {
    id: 'hamster-hit',
    name: 'Hamster Hit',
    description: 'Whack the hamsters before they escape. Faster than it sounds.',
    descriptionLong: 'A high-speed reflex game. Spot the hamster, hit it, score.',
    status: 'coming-soon',
    theme: {
      accent:     '#86efac',
      accentSoft: 'rgba(134, 239, 172, 0.12)',
      accentGlow: 'rgba(134, 239, 172, 0.20)',
    },
    entryModule: null,
    layaAvailable: false,
    artClass: 'game-card__art--hamster',
  },

  {
    id: 'snake',
    name: 'Snake',
    description: 'Grow your snake. Avoid yourself. Classic endless challenge.',
    descriptionLong: 'Eat the dots, grow longer, don\'t run into your own tail.',
    status: 'coming-soon',
    theme: {
      accent:     '#fcd34d',
      accentSoft: 'rgba(252, 211, 77, 0.12)',
      accentGlow: 'rgba(252, 211, 77, 0.20)',
    },
    entryModule: null,
    layaAvailable: false,
    artClass: 'game-card__art--snake',
  },
];

/**
 * Retrieve a game entry by ID.
 * @param {string} id
 * @returns {GameEntry|undefined}
 */
export function getGame(id) {
  return GAMES.find(g => g.id === id);
}

/**
 * @typedef {Object} GameEntry
 * @property {string}      id             — URL-safe identifier
 * @property {string}      name           — Display name
 * @property {string}      description    — Short card description
 * @property {string}      descriptionLong — Full mode-screen description
 * @property {'active'|'coming-soon'} status
 * @property {GameTheme}   theme          — CSS custom property values
 * @property {string|null} entryModule    — Relative path to game module
 * @property {boolean}     layaAvailable  — Laya agent integration status
 * @property {string}      artClass       — CSS class for card artwork
 */

/**
 * @typedef {Object} GameTheme
 * @property {string} accent      — Primary accent colour (hex)
 * @property {string} accentSoft  — Soft translucent accent (rgba)
 * @property {string} accentGlow  — Glow accent (rgba)
 */
