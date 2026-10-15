# CONTEXT.md — Technical Handoff Document
**Game Library · Team ZENITH · PS 02: Beat the Bot**  
Last updated: 2026-10-14

---

## A. Project Summary

**Game Library** is a frontend prototype built for Team ZENITH's entry in the VESIT × Quest IT Hackathon, Problem Statement 02: *Beat the Bot: Teach Laya to Play*.

The application is a polished, dark-themed game platform where users:
1. Browse available games from a curated library.
2. Select a game and choose between playing it themselves or watching **Laya**, our AI agent, play autonomously.

**This repository is the prototype only.** Laya's decision-making, reinforcement learning training pipeline, and autonomous gameplay control are **not implemented here** and are intentionally outside the scope of this deliverable.

The prototype communicates the planned AI capability through the interface design without simulating or fabricating it.

---

## B. Current Implementation Status

### Implemented and Working

| Feature | Description |
|---|---|
| Library home screen | All 4 games rendered from registry; all 4 active and playable |
| Hash-based routing | `#/`, `#/game/:id`, `#/play/:id` with Back/Forward support |
| Flappy Bird — playable | Canvas-based game with original assets, physics, and scoring |
| 2048 — playable | Smooth GPU-accelerated grid tile merges, arrow keys, WASD, swipe |
| Hamster Hit — playable | 3x3 hole burrow grid, 30s timer, scaling speed, hamsters, golden bonus, bomb decoy |
| Snake — playable | Canvas-based snake, arrow keys, WASD, mobile swipe, virtual D-pad, Space pause |
| Score display & tracking | Real-time current score during gameplay for all 4 games |
| Best score persistence | Independent `localStorage` keys per game (`game-library:<id>:best`) |
| Game restart | Clean restart without page reload, duplicate loops, or state leaks |
| Game-over screen | Inline modal overlay with final score, new-best record badge, Play Again |
| Responsive layout | Mobile (320px+), tablet, and desktop with dynamic aspect-ratio scaling |
| Laya mode UI | Themed per game, properly disabled with prototype disclaimer note |
| Game lifecycle | init → start → restart → destroy with complete teardown on route change |
| Accessible markup | ARIA roles, labels, focus indicators, disabled semantics |
| SEO metadata | Title, description, Open Graph, viewport, theme-color |
| Favicon | SVG favicon with bird/pipe motif |

### Intentionally Not Implemented (Prototype Scope)

| Feature | Reason |
|---|---|
| Laya agent decision-making | Requires RL training pipeline — main project only |
| Autonomous gameplay control | Not in prototype scope |
| Backend / database | Static site, no server required |
| Multiplayer / leaderboards | Not in scope |
| LAYA agent training UI | Not in scope |

> **Rule:** Do not label a feature complete merely because its interface exists. The Laya mode button exists in the UI but is explicitly marked unavailable — this is by design, not an oversight.

---

## C. Project Structure

```
/
├── index.html            Single-page app shell; screen containers; ES module bootstrap
├── favicon.svg           SVG favicon (bird between pipes motif)
├── README.md             User-facing project documentation
├── CONTEXT.md            This file — technical handoff
├── css/
│   ├── main.css          Design tokens (:root vars), reset, typography, library layout
│   ├── components.css    Shared UI: buttons, cards, game grid, mode selection, badges
│   └── game.css          Play screen layout, score bar, game viewport, overlays
├── js/
│   ├── app.js            Entry: wires routes, global key prevention/dispatch, router init
│   ├── router.js         Hash router: route(), navigate(), showScreen(), onBeforeRoute()
│   ├── games.js          Game registry — source of truth for all game metadata
│   ├── library.js        Renders library home screen from registry
│   ├── game-mode.js      Renders mode selection screen (Play Yourself / Let Laya Play)
│   └── game-screen.js    Renders play screen; loads game module; manages lifecycle
└── games/
    ├── flappy-bird/
    │   ├── index.js      Public API module: init(), controller object
    │   ├── game.js       Canvas game engine: physics, pipes, collision, rendering
    │   ├── LICENSE       Apache 2.0 (original author: Nebez Briefkani)
    │   ├── README.md     Game attribution and modification notes
    │   └── assets/       Sprites and sounds
    ├── 2048/
    │   ├── index.js      Public API module: init(), controller object
    │   ├── game.js       Tile & Grid engine, touch swipe, WASD, LAYA hooks
    │   ├── 2048.css      Scoped CSS under .game-2048 with dark amber theme
    │   ├── LICENSE       MIT (original author: Gabriele Cirulli)
    │   └── README.md     Attribution and modification notes
    ├── hamster-hit/
    │   ├── index.js      Public API module: init(), controller object
    │   ├── game.js       3x3 burrow grid engine, 30s timer, bomb/gold mechanics, LAYA hooks
    │   ├── hamster-hit.css Scoped CSS under .game-hamster with warm orange theme & mallet cursor
    │   ├── LICENSE       MIT (authors: Yeab-Ad / Mubashir Naik)
    │   └── README.md     Attribution and modification notes
    └── snake/
        ├── index.js      Public API module: init(), controller object
        ├── game.js       Canvas snake engine, apple spawns, speed ramp, D-pad, LAYA hooks
        ├── snake.css     Scoped CSS under .game-snake with green theme & mobile D-pad
        ├── LICENSE       MIT (author: Impre7ive)
        └── README.md     Attribution and modification notes
```

---

## D. Game Registry

**File:** `js/games.js`

The registry is the **single source of truth** for all game information. All screens derive their content from it — no game data is hardcoded in library.js, game-mode.js, or the HTML.

### Registry Entry Fields

| Field | Type | Description |
|---|---|---|
| `id` | string | URL-safe identifier used in hash routes |
| `name` | string | Display name shown in all UI |
| `description` | string | Short card description (1–2 sentences) |
| `descriptionLong` | string | Full mode-screen description |
| `status` | `'active'`\|`'coming-soon'` | Controls interactivity throughout the app |
| `theme.accent` | hex string | Primary accent colour |
| `theme.accentSoft` | rgba string | Translucent accent for backgrounds |
| `theme.accentGlow` | rgba string | Glow effect colour |
| `entryModule` | string\|null | Relative URL to the game's ES module entry |
| `layaAvailable` | boolean | Whether LAYA agent is connected (always `false` in prototype) |
| `artClass` | string | CSS class applied to the card artwork area |

### Status Behaviour

- **`active`** — card is clickable, navigates to mode screen, game loads on play route.
- **`coming-soon`** — card rendered with reduced opacity and a lock badge; all interaction disabled.

### Theme Application

When a game route is activated, `game-mode.js` and `game-screen.js` apply the theme as CSS custom properties on the screen root element:

```js
screen.style.setProperty('--game-accent',      game.theme.accent);
screen.style.setProperty('--game-accent-soft', game.theme.accentSoft);
screen.style.setProperty('--game-accent-glow', game.theme.accentGlow);
```

Child components automatically inherit these via `var(--game-accent)`.

### Adding a New Game

1. Add an entry to `GAMES` in `js/games.js`.
2. Create `games/<id>/` folder.
3. Implement `games/<id>/index.js` exporting `init(container, options) → controller`.
4. Set `status: 'active'` and `entryModule: './games/<id>/index.js'`.
5. Add a CSS class for artwork in `css/components.css` (`.game-card__art--<id>`).

---

## E. Game Integration Contract

### Required Interface

Every game module must export:

```js
export function init(container, options) → controller
```

The controller object must implement:

| Method | Signature | Description |
|---|---|---|
| `start()` | `() → void` | Start gameplay; called once after init |
| `restart()` | `() → void` | Reset state; safe to call mid-game |
| `getScore()` | `() → number` | Current score (synchronous) |
| `onGameOver(fn)` | `(Function) → void` | Register game-over callback |
| `destroy()` | `() → void` | Full cleanup — must cancel all loops and listeners |

### Lifecycle Rules

1. `init()` is **synchronous**. Asset loading must happen internally.
2. `destroy()` **must** cancel all `requestAnimationFrame` handles and `setInterval` timers.
3. `destroy()` **must** remove all event listeners added during init/start.
4. After `destroy()`, the container should be empty and safe for re-use.
5. Calling `restart()` must not create duplicate animation loops.
6. `onGameOver` must not accumulate duplicate callbacks on each render cycle. The current implementation replaces rather than appends.

### Flappy Bird Specific

The Flappy Bird engine also exposes:

```js
getState()    // observation object for LAYA agent
issueFlap()   // programmatic flap action for LAYA agent
```

---

## F. LAYA Integration Plan

### Observation / Action Loop

The future LAYA agent will operate as follows:

```
loop:
  state  = controller.getState()
  action = laya.decide(state)         ← RL model inference
  if action == 'flap':
    controller.issueFlap()
  next_state = controller.getState()
  reward = next_state.score - state.score
  done   = (next_state.state == 'gameover')
  laya.observe(state, action, reward, next_state, done)
  if done: controller.restart()
```

### Observation Object (from `getState()`)

| Field | Type | Description |
|---|---|---|
| `birdY` | number | Bird Y position from top of play area |
| `birdVelocity` | number | Current vertical velocity |
| `birdRotation` | number | Rotation angle (degrees) |
| `playAreaHeight` | number | Total play area height |
| `nextPipe.x` | number | X position of next pipe pair's left edge |
| `nextPipe.gapTop` | number | Y coordinate of gap top |
| `nextPipe.gapBottom` | number | Y coordinate of gap bottom |
| `score` | number | Current episode score |
| `state` | string | `'splash'`, `'playing'`, or `'gameover'` |

### Reward Signal

Reward = score delta per step (typically 0 or +1 per pipe cleared).  
Terminal reward: −1 on game over (configurable by LAYA project).

### Episode Termination

Episode ends when `state.state === 'gameover'`.  
Agent calls `controller.restart()` to begin next episode.

### Logging Requirements (Main Project)

Each agent step should log:
```json
{
  "episode": 42,
  "step": 718,
  "state": { ... },
  "action": "flap" | "noop",
  "reward": 0,
  "next_state": { ... },
  "done": false
}
```

### What Already Exists (Prototype Hooks)

All four games implement standardized LAYA hooks:

1. **Flappy Bird:**
   - `controller.getState()` — returns `{ birdY, birdVelocity, birdRotation, playAreaHeight, nextPipe, score, state }`.
   - `controller.issueFlap()` — triggers a programmatic flap action.

2. **2048:**
   - `controller.getState()` — returns `{ board: number[][], score, over, won, maxTile, validMoves: number[] }`.
   - `controller.move(direction)` — programmatically slides tiles in direction `0` (Up), `1` (Right), `2` (Down), or `3` (Left).

3. **Hamster Hit:**
   - `controller.getState()` — returns `{ score, timeLeft, holes: Array<{id, type, isUp, isWhacked}>, difficulty }`.
   - `controller.whack(holeIndex)` — programmatically hits hole index `0` through `8`.

4. **Snake:**
   - `controller.getState()` — returns `{ snake: Array<{x, y}>, head, food, direction, gridSize, score, paused, over }`.
   - `controller.setDirection(dir)` — programmatically steers the snake (`'up'`, `'down'`, `'left'`, `'right'`).

- `controller.ready` — Promise on each controller; await before starting training episodes.

### What Must Be Added (Main Project)

- RL models (Python/TensorFlow, PyTorch, or in-browser ONNX).
- Agent inference loop calling `getState()` and the respective action method.
- Episode management and logging.
- Training pipeline.
- Connecting the "Let Laya Play" button to the agent loop.

---

## G. Design System

### Colour Tokens

| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#0b0d10` | Page background |
| `--bg-secondary` | `#11151a` | Headers, cards |
| `--bg-elevated` | `#171c23` | Raised surfaces |
| `--text-primary` | `#f3f5f7` | Headings, important text |
| `--text-secondary` | `#9aa4b2` | Body text |
| `--text-muted` | `#687382` | Labels, metadata |
| `--accent` | `#66d9e8` | Default accent (Flappy Bird) |
| `--success` | `#8ce3b1` | Active badge, new-best indicator |
| `--warning` | `#f3c97a` | Best score value |
| `--danger` | `#ff8585` | Error states |

Per-game theme variables:
- **Flappy Bird:** Cyan/Teal (`#66d9e8`)
- **2048:** Amber/Gold (`#f59e0b`)
- **Hamster Hit:** Warm Orange (`#ff7722`)
- **Snake:** Vibrant Emerald Green (`#22c55e`)

### Typography

- **Font:** Inter (Google Fonts) with system-font fallback.
- **Weights used:** 300, 400, 500, 600, 700, 800.
- **Scale:** 0.68rem (tiny labels) → 3.5rem (game-over score).

### Spacing

Multiples of 4px: `--space-1` (4px) through `--space-12` (48px).

### Radii

- `--radius-sm`: 10px (buttons, small surfaces)
- `--radius-md`: 16px (mode cards, art thumbnails)
- `--radius-lg`: 24px (game cards, game viewport)

### Motion

- `--transition-fast`: 180ms ease
- `--transition-normal`: 240ms ease
- `prefers-reduced-motion`: all durations collapse to 0.01ms

### Accessibility

- All interactive elements have visible focus outlines (`outline: 2px solid var(--accent)`).
- Unavailable options use `aria-disabled="true"` and `cursor: not-allowed`.
- Score display uses `aria-live="polite"` and `role="status"`.
- Icon-only buttons include `aria-label`.
- Contrast ratio ≥ 4.5:1 for all primary text.

---

## H. Open-Source Credits and Licenses

| Item | Source | License |
|---|---|---|
| Flappy Bird clone engine & sprites | https://github.com/nebez/floppybird | Apache 2.0 |
| 2048 game engine & mechanics | https://github.com/gabrielecirulli/2048 | MIT License |
| Hamster Hit whack-a-mole mechanics | https://github.com/Yeab-Ad/Punch-Game (fallback: https://github.com/naikmubashir/FeF-WhackAMole) | MIT License |
| Snake game engine & mechanics | https://github.com/Impre7ive/snake-game-javascript | MIT License |
| Inter font | Google Fonts | SIL OFL 1.1 |

Each game directory maintains its respective license file:
- `games/flappy-bird/LICENSE` (Apache 2.0)
- `games/2048/LICENSE` (MIT)
- `games/hamster-hit/LICENSE` (MIT)
- `games/snake/LICENSE` (MIT)

**Modifications & Design Adaptations:**
- **Flappy Bird:** Canvas-based rewrite; LAYA observation & action hooks.
- **2048:** Re-engineered as a modern ES module with scoped `.game-2048` CSS, responsive GPU transforms, touch swipe, WASD, and amber/gold dark theme.
- **Hamster Hit:** Reskinned as an original hamster game with inline SVG art (hamsters, golden bonus, bomb decoy, burrows), 30-second timer with dynamic difficulty scaling, and warm orange theme.
- **Snake:** Canvas engine rewritten with high-DPI scaling, smooth rounded segments, apple spawns, speed progression, Space key pause, mobile virtual D-pad, and green theme.

---

## I. Testing

### Real-Browser QA Audit (Chrome DevTools Protocol Automated Suite)

Executed against running application (`http://127.0.0.1:3000`) using Google Chrome:

| Check | Testing Method | Result | Notes |
|---|---|---|---|
| Library screen load & cards | Browser CDP DOM Inspection | ✅ PASS | All 4 cards rendered with Active badges and themed artwork |
| 2048 mode & play screen | Browser CDP Navigation & Input | ✅ PASS | Navigates cleanly; WASD/arrows slide tiles; score tracks |
| Hamster Hit mode & play screen | Browser CDP Navigation & Clicks | ✅ PASS | 30s timer runs; hamsters and bombs pop up; clicks score correctly |
| Snake mode & play screen | Browser CDP Navigation & Input | ✅ PASS | Canvas scales with DPR; arrow keys/D-pad steer snake; Space pauses |
| Flappy Bird card navigation | Browser CDP Click & DOM Evaluation | ✅ PASS | Flappy Bird gameplay remains completely intact and verified |
| LAYA mode disabled state | Browser CDP DOM & Attribute Check | ✅ PASS | All 4 games render Laya card disabled with prototype disclaimer |
| Best score persistence per game | Browser Page Reload & localStorage | ✅ PASS | Independent keys verified (`flappy-bird`, `2048`, `hamster-hit`, `snake`) |
| Repeated entry/exit lifecycle | Rapid Route Transition Loop | ✅ PASS | Switching between games cancels timers, listeners, and loops without leaks |
| Keyboard page scroll suppression | DOM Event Evaluation | ✅ PASS | Arrow keys and Space intercepted on active play screen |

---

## J. Deployment

### Local Development

```bash
npx serve .
```

Opens on http://localhost:3000. ES modules require an HTTP server.

### Vercel (Static)

- Import the repository; set Framework Preset to `Other`.
- Build Command: *(leave empty)*
- Output Directory: `.`
- No environment variables required.

All asset URLs use relative paths (`./css/...`, `./games/...`) and resolve correctly from the Vercel root or any hash route.

---

## K. Changelog

| Date | Change |
|---|---|
| 2026-10-15 | **Sprint 2: Multi-Game Expansion (2048, Hamster Hit, Snake)**.<br>• Cloned open-source MIT references: Gabriele Cirulli's 2048, Yeab-Ad's Punch-Game / naikmubashir's WhackAMole, and Impre7ive's Snake.<br>• Implemented 2048 with GPU-accelerated transforms, amber/gold palette, and touch/WASD controls.<br>• Implemented Hamster Hit with custom inline SVG hamsters/bombs, 30s countdown, ramping difficulty, and desktop mallet cursor.<br>• Implemented Snake with high-DPI canvas, rounded segments, dynamic speed ramp, Space pause, and on-screen virtual D-pad.<br>• Extended Game Library controller lifecycle contract to all 3 new games with comprehensive `destroy()` cleanup.<br>• Isolated best scores using `game-library:<id>:best` in `localStorage`.<br>• Implemented documented LAYA observation & action hooks on all games.<br>• Updated library cards to Active status, updated mode screen art, and refreshed footer credits. |
| 2026-10-14 | Initial build. Complete from scratch. Library, mode, and play screens implemented. Flappy Bird canvas engine written. All assets downloaded from nebez/floppybird@gh-pages. Hash router, game registry, game lifecycle interface, LAYA stubs, documentation. |
