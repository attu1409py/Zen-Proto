# 2048

Based on the original 2048 game by [Gabriele Cirulli](https://github.com/gabrielecirulli/2048).
Licensed under the [MIT License](./LICENSE).

## Adaptations for Game Library
- Rewritten as an ES module complying with the Game Library lifecycle contract (`init`, `start`, `restart`, `getScore`, `onGameOver`, `destroy`).
- Scoped all CSS under `.game-2048` to prevent style leaks.
- Restyled with a sleek dark minimalist theme, responsive tile scaling, and warm amber/gold accents.
- Cross-device input: Arrow keys, WASD, and touch swipe gestures.
- Added LAYA extension hooks (`getState()`, `move(direction)`).
