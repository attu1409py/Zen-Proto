# Snake

Based on the canvas snake game by [Impre7ive/snake-game-javascript](https://github.com/Impre7ive/snake-game-javascript).
Licensed under the [MIT License](./LICENSE).

## Adaptations for Game Library
- Canvas-based rendering with High-DPI support and responsive scaling.
- Dark minimalist aesthetic: subtle checkerboard grid, glowing neon-green snake with rounded segments, eyes directed along movement vector, and radiant food orbs.
- Dynamic speed progression: tick rate scales gently from 130ms down to 75ms as the snake grows.
- Cross-platform controls: Arrow keys, WASD, swipe gestures, and an on-screen responsive D-pad for mobile.
- Space key to pause/resume with pause indicator.
- Scoped all styling under `.game-snake`.
- Added LAYA extension hooks (`getState()`, `setDirection(dir)`).
