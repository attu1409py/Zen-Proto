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
| Library home screen | All 4 games rendered from registry; 1 active, 3 placeholder |
| Hash-based routing | `#/`, `#/game/:id`, `#/play/:id` with Back/Forward support |
| Flappy Bird — playable | Canvas-based game with original assets, physics, and scoring |
| Space / Click / Tap to flap | Cross-device input handling |
| Score display | Real-time current score during gameplay |
| Best score persistence | localStorage with validation and graceful fallback |
| Game restart | Clean restart without page reload or duplicate loops |
| Game-over screen | Inline overlay with score, new-best indicator, Play Again |
| Responsive layout | Mobile (320px+), tablet, and desktop |
| Laya mode UI | Visible, properly disabled, with explanatory note |
| Game lifecycle | init → start → restart → destroy with cleanup on route change |
| Coming-soon cards | 2048, Hamster Hit, Snake — visible, non-interactive |
| Accessible markup | ARIA roles, labels, focus indicators, disabled semantics |
| SEO metadata | Title, description, Open Graph, viewport, theme-color |
| Favicon | SVG favicon with bird/pipe motif |

### Intentionally Not Implemented (Prototype Scope)

| Feature | Reason |
|---|---|
| Laya agent decision-making | Requires RL training pipeline — main project only |
| Autonomous gameplay control | Not in prototype scope |
| 2048, Hamster Hit, Snake gameplay | Placeholders for future sprints |
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
│   ├── app.js            Entry: wires routes, global Space key handler, router init
│   ├── router.js         Hash router: route(), navigate(), showScreen(), onBeforeRoute()
│   ├── games.js          Game registry — source of truth for all game metadata
│   ├── library.js        Renders library home screen from registry
│   ├── game-mode.js      Renders mode selection screen (Play Yourself / Let Laya Play)
│   └── game-screen.js    Renders play screen; loads game module; manages lifecycle
└── games/
    └── flappy-bird/
        ├── index.js      Public API module: init(), controller object
        ├── game.js       Canvas game engine: physics, pipes, collision, rendering
        ├── LICENSE       Apache 2.0 (original author: Nebez Briefkani)
        ├── README.md     Game attribution and modification notes
        └── assets/
            ├── bird.png, sky.png, land.png, ceiling.png
            ├── pipe-up.png, pipe-down.png, pipe.png
            ├── splash.png, scoreboard.png, replay.png
            ├── font_big_0.png … font_big_9.png
            ├── font_small_0.png … font_small_9.png
            ├── medal_bronze/silver/gold/platinum.png
            └── sounds/
                sfx_wing.ogg, sfx_point.ogg, sfx_hit.ogg,
                sfx_die.ogg, sfx_swooshing.ogg
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

- `controller.getState()` — fully implemented, returns real observation.
- `controller.issueFlap()` — fully implemented, triggers real flap.
- `controller.ready` — Promise; await before starting training episodes.

### What Must Be Added (Main Project)

- RL model (Python/TensorFlow or PyTorch, or in-browser ONNX).
- Agent inference loop that calls `getState()` and `issueFlap()`.
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

Per-game theme variables (`--game-accent`, `--game-accent-soft`, `--game-accent-glow`) override the defaults on the screen element.

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
| Flappy Bird clone engine | https://github.com/nebez/floppybird | Apache 2.0 |
| All sprite assets | Same repository | Apache 2.0 |
| Sound effects | Same repository | Apache 2.0 |
| Inter font | Google Fonts | SIL OFL 1.1 |

The license file is stored at `games/flappy-bird/LICENSE`.

**Modifications to the original work:**
- Engine rewritten as vanilla ES module using Canvas API (no jQuery/Buzz).
- Physics constants preserved exactly from original.
- All original assets retained without modification.
- Added LAYA integration hooks (`getState`, `issueFlap`).
- Added responsive ResizeObserver-based canvas sizing.

---

## I. Testing

### Real-Browser QA Audit (Chrome DevTools Protocol Automated Suite)

Executed against running application (`http://127.0.0.1:3000`) using Google Chrome via direct Chrome DevTools Protocol (CDP) session:

| Check | Testing Method | Result | Notes |
|---|---|---|---|
| Library screen load & cards | Browser CDP DOM Inspection | ✅ PASS | 4 cards rendered; 1 active Flappy Bird, 3 placeholders with "Soon" status badges |
| Flappy Bird card navigation | Browser CDP Click & DOM Evaluation | ✅ PASS | Navigates to `#/game/flappy-bird` |
| Mode screen rendering & theme | Browser CDP DOM & Computed Style | ✅ PASS | Per-game CSS accent (`#66d9e8`) and glow variables applied |
| LAYA mode disabled state | Browser CDP DOM & Attribute Check | ✅ PASS | `aria-disabled="true"`, disabled button, lock badge, explanatory text |
| Play Yourself navigation & canvas | Browser CDP Click & Canvas Inspection | ✅ PASS | Navigates to `#/play/flappy-bird`, canvas mounts (DPR scaled), score=0 |
| Space, Click, Touch input handling | Browser DOM Event Dispatch | ✅ PASS | Flaps triggered via keyboard Space, mouse click, and touch start |
| Gravity physics & collision detection | Browser Event & Physics Evaluation | ✅ PASS | Bird falls under gravity; pipe/ground collision triggers game-over state |
| Game-over overlay display | Browser CDP DOM Evaluation | ✅ PASS | Modal overlay renders with final score and Play Again button |
| Game restart without page reload | Browser CDP Button Click | ✅ PASS | Clears overlay, resets score to 0, preserves best score |
| Best score persistence across refresh | Browser Page Reload & localStorage | ✅ PASS | Best score verified in `localStorage` and persists after hard page reload |
| Back navigation & lifecycle teardown | Browser CDP Button Click | ✅ PASS | Returns to `#/`; cancels animation loop; removes stale nodes |
| Direct route refresh (all 3 routes) | Browser Direct URL Navigation | ✅ PASS | `#/`, `#/game/flappy-bird`, `#/play/flappy-bird` all load directly |
| Browser Back / Forward history | Browser History API Back/Forward | ✅ PASS | Hash changes and view transitions sync with history navigation |
| Invalid route handling (404) | Browser Navigation to Invalid Hash | ✅ PASS | Unknown routes render 404 screen with Return Home button |
| Responsive layout (375px, 768px, 1280px) | Browser CDP Viewport Emulation | ✅ PASS | Zero horizontal scroll/overflow across mobile, tablet, and desktop |
| Reduced motion support | Browser CDP Media Emulation | ✅ PASS | `prefers-reduced-motion: reduce` collapses CSS transitions |
| Keyboard focus accessibility | Browser Focus Management | ✅ PASS | Interactive controls accept focus with visible outline |
| Repeated entry/exit lifecycle (5 cycles) | Rapid Route Transition Loop | ✅ PASS | 5 rapid transitions between `#/` and `#/play/flappy-bird`; 0 duplicate canvases |
| Console errors & network failures | Browser Console & Network Interception | ✅ PASS | 0 runtime JS exceptions, 0 console errors, 0 failed network requests |

### Known Limitations

- **OGG audio on Safari:** Safari does not support OGG Vorbis by default. The game runs silently on Safari; no crash occurs.
- **Physical touch device validation:** Touch events were verified via synthetic touch event dispatch; physical haptic testing requires a mobile device.
- **Very narrow viewports (<320px):** Layout degrades gracefully but was not exhaustively tested below 320px.

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
| 2026-10-14 | Initial build. Complete from scratch. Library, mode, and play screens implemented. Flappy Bird canvas engine written. All assets downloaded from nebez/floppybird@gh-pages. Hash router, game registry, game lifecycle interface, LAYA stubs, documentation. |
