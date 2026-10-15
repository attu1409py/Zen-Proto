# Hamster Hit

Based on the open-source whack-a-mole game mechanics by [Yeab-Ad/Punch-Game](https://github.com/Yeab-Ad/Punch-Game) and [naikmubashir/FeF-WhackAMole](https://github.com/naikmubashir/FeF-WhackAMole).
Licensed under the [MIT License](./LICENSE).

## Adaptations for Game Library
- Reskinned as an original, cute, flat-minimalist Hamster Hit game with custom inline SVGs (hamsters, golden hamsters, bombs, and earthen burrows).
- Implemented as a vanilla ES module complying with the Game Library lifecycle contract (`init`, `start`, `restart`, `getScore`, `onGameOver`, `destroy`).
- 3x3 hole grid, 30-second game timer with dynamic difficulty scaling (faster spawn intervals and shorter visibility).
- Bomb and golden hamster mechanics:
  - Whacking normal hamster: +10 pts
  - Whacking golden crown hamster: +25 pts
  - Whacking bomb decoy: -5 pts
- Desktop hammer cursor and bonk animations.
- Scoped all styles under `.game-hamster` with warm orange accents.
- Added LAYA extension hooks (`getState()`, `whack(holeIndex)`).
