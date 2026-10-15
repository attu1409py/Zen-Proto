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
    layaAvailable: false,
    artClass: 'game-card__art--flappy',
    aspectRatio: '9 / 16',
    hint: 'Space · Click · Tap to flap',
    modePlayDesc: 'You control the bird. Tap, click, or press Space to flap. Your reflexes, your score.',
  },

  {
    id: '2048',
    name: '2048',
    description: 'Slide and merge tiles to reach the elusive 2048 tile.',
    descriptionLong: 'Use arrow keys, WASD, or swipe to combine matching tiles. Reach 2048 to win.',
    status: 'active',
    theme: {
      accent:     '#f59e0b',
      accentSoft: 'rgba(245, 158, 11, 0.12)',
      accentGlow: 'rgba(245, 158, 11, 0.25)',
    },
    entryModule: './games/2048/index.js',
    layaAvailable: false,
    artClass: 'game-card__art--2048',
    aspectRatio: '1 / 1',
    hint: 'Arrows / WASD · Swipe to merge',
    modePlayDesc: 'Slide and merge tiles using arrow keys, WASD, or swipe. Reach 2048 to win.',
  },

  {
    id: 'hamster-hit',
    name: 'Hamster Hit',
    description: 'Whack the hamsters before they escape. Faster than it sounds.',
    descriptionLong: 'A high-speed reflex game. Spot the hamster, hit it, avoid bombs, and score high before time runs out.',
    status: 'active',
    theme: {
      accent:     '#ff7722',
      accentSoft: 'rgba(255, 119, 34, 0.12)',
      accentGlow: 'rgba(255, 119, 34, 0.25)',
    },
    entryModule: './games/hamster-hit/index.js',
    layaAvailable: false,
    artClass: 'game-card__art--hamster',
    aspectRatio: '1 / 1',
    hint: 'Click / Tap hamsters · Avoid bombs! (30s)',
    modePlayDesc: 'Whack the hamsters before they duck away. Watch out for bombs! Faster than it sounds.',
  },

  {
    id: 'snake',
    name: 'Snake',
    description: 'Grow your snake. Avoid yourself. Classic endless challenge.',
    descriptionLong: 'Eat the dots, grow longer, don\'t run into walls or your own tail. Space to pause.',
    status: 'active',
    theme: {
      accent:     '#22c55e',
      accentSoft: 'rgba(34, 197, 94, 0.12)',
      accentGlow: 'rgba(34, 197, 94, 0.25)',
    },
    entryModule: './games/snake/index.js',
    layaAvailable: false,
    artClass: 'game-card__art--snake',
    aspectRatio: '1 / 1',
    hint: 'Arrows / WASD · Swipe / D-pad · Space to pause',
    modePlayDesc: 'Direct the snake using arrow keys, WASD, or on-screen D-pad. Eat food, grow, avoid walls and your tail.',
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
