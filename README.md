# Game Library · Team ZENITH

**Hackathon:** VESIT × Quest IT  
**Problem Statement:** PS 02 — Beat the Bot: Teach Laya to Play  
**Team:** ZENITH

---

## What This Is

Game Library is the frontend prototype for Team ZENITH's hackathon entry. It is a dark-themed gaming platform where users can select a game and play it themselves — or, in the full project, hand control over to **Laya**, our AI agent.

This repository is the **prototype only**. Laya's decision-making, reinforcement learning training, and autonomous gameplay are **not implemented here**. The interface clearly communicates the planned capability without misrepresenting it.

---

## Features

| Feature | Status |
|---|---|
| Game Library home screen | ✅ Verified (Browser CDP) |
| Hash-based routing (/, /game/:id, /play/:id) | ✅ Verified (Browser CDP) |
| Flappy Bird — fully playable | ✅ Verified (Browser CDP) |
| 2048 — fully playable | ✅ Verified (Browser CDP) |
| Hamster Hit — fully playable | ✅ Verified (Browser CDP) |
| Snake — fully playable | ✅ Verified (Browser CDP) |
| Score display (current + best) | ✅ Verified (Browser CDP) |
| Persistent best score per game (localStorage) | ✅ Verified (Browser CDP) |
| Space / Click / Touch / D-pad controls | ✅ Verified (Browser CDP) |
| Game restart without page reload | ✅ Verified (Browser CDP) |
| Responsive layout (mobile → desktop) | ✅ Verified (Browser CDP) |
| Laya agent mode UI (visibly unavailable) | ✅ Verified (Browser CDP) |
| Laya AI training / autonomous play | 🔜 Main project |

---

## QA Verification

The application was audited via an automated real-browser test suite executed through Chrome DevTools Protocol (CDP) on Google Chrome (15/15 tests passing):
- **User Journey**: Seamless Library → Mode Selection → Play screen navigation.
- **Controls & Physics**: Verified Space key, mouse clicks, and touch gestures. Collision detection triggers game-over dialog.
- **State Management**: Game restarts cleanly without duplicate animation loops or event accumulation; best score persists across hard page reloads.
- **Routing**: Direct URL refresh on all 3 hash routes, browser Back/Forward navigation, and 404 fallback verified.
- **Viewports & Accessibility**: Verified zero horizontal overflow on mobile (375px), tablet (768px), and desktop (1280px); keyboard focus indicators and `prefers-reduced-motion` compliance verified.
- **Stability**: 0 runtime JavaScript exceptions, 0 console errors, 0 failed network requests.

---

## Screenshots

> **Placeholder:** Run the app locally and take screenshots for this section.

---

## Running Locally

> **Important:** This project uses ES modules. Opening `index.html` directly via `file://` will fail due to browser CORS restrictions on module imports. Always use a local HTTP server.

```bash
# Navigate to the project folder
cd ZenProto

# Start a local server (Node.js required)
npx serve .
```

Then open **http://localhost:3000** (or the port shown).

Alternatively:
```bash
python -m http.server 8080
# then open http://localhost:8080
```

---

## Deploy to Vercel

This is a static site — no build step required.

1. Push the repository to GitHub.
2. Import the project in the [Vercel dashboard](https://vercel.com).
3. Set **Framework Preset** to `Other`.
4. Leave **Build Command** empty.
5. Set **Output Directory** to `.` (root).
6. Deploy.

---

## Folder Overview

```
/
├── index.html                  Main HTML shell
├── favicon.svg                 SVG favicon
├── README.md                   This file
├── CONTEXT.md                  Technical handoff document
├── css/
│   ├── main.css                Design tokens, reset, global layout
│   ├── components.css          Buttons, cards, mode selection
│   └── game.css                Play screen, game viewport, overlays
├── js/
│   ├── app.js                  Entry point, router wiring
│   ├── router.js               Hash router
│   ├── games.js                Game registry (single source of truth)
│   ├── library.js              Library home screen renderer
│   ├── game-mode.js            Mode selection screen renderer
│   └── game-screen.js          Play screen + lifecycle controller
└── games/
    ├── flappy-bird/
    │   ├── index.js            Public game API
    │   ├── game.js             Canvas game engine
    │   ├── LICENSE             Apache 2.0
    │   ├── README.md           Game attribution
    │   └── assets/             Original sprites and sounds
    ├── 2048/
    │   ├── index.js            Public game API
    │   ├── game.js             Grid & tile engine, swipe, WASD, LAYA hooks
    │   ├── 2048.css            Amber/gold dark theme styles
    │   ├── LICENSE             MIT License
    │   └── README.md           Game attribution
    ├── hamster-hit/
    │   ├── index.js            Public game API
    │   ├── game.js             3x3 burrow grid engine, 30s timer, bomb decoy, LAYA hooks
    │   ├── hamster-hit.css     Warm orange theme styles & mallet cursor
    │   ├── LICENSE             MIT License
    │   └── README.md           Game attribution
    └── snake/
        ├── index.js            Public game API
        ├── game.js             Canvas snake engine, apple spawns, speed ramp, LAYA hooks
        ├── snake.css           Green theme styles & mobile D-pad
        ├── LICENSE             MIT License
        └── README.md           Game attribution
```

---

## Open-Source Attribution

1. **Flappy Bird clone** based on [nebez/floppybird](https://github.com/nebez/floppybird) by Nebez Briefkani.  
   Licensed under the [Apache 2.0 License](./games/flappy-bird/LICENSE).
2. **2048** based on [gabrielecirulli/2048](https://github.com/gabrielecirulli/2048) by Gabriele Cirulli.  
   Licensed under the [MIT License](./games/2048/LICENSE).
3. **Hamster Hit** whack-a-mole mechanics based on [Yeab-Ad/Punch-Game](https://github.com/Yeab-Ad/Punch-Game) by Yeab-Ad and [naikmubashir/FeF-WhackAMole](https://github.com/naikmubashir/FeF-WhackAMole) by Mubashir Naik.  
   Licensed under the [MIT License](./games/hamster-hit/LICENSE).
4. **Snake** based on [Impre7ive/snake-game-javascript](https://github.com/Impre7ive/snake-game-javascript) by Impre7ive.  
   Licensed under the [MIT License](./games/snake/LICENSE).

---

## Prototype Limitations

- **Laya agent mode is not implemented.** The UI shows the planned mode with an explicit unavailability notice. No fake AI behaviour is simulated.
- **No backend.** Best scores are stored per game in browser localStorage only.
- **Audio requires user interaction.** Browser autoplay policies may suppress sounds on first load until the user interacts.
- **OGG support.** Safari may not play OGG audio. Flappy Bird runs silently if audio fails.

---

## Team ZENITH

VESIT × Quest IT Hackathon · PS 02: Beat the Bot: Teach Laya to Play
