# Flappy Bird

This implementation is based on the open-source **Floppy Bird** clone by Nebez Briefkani.

- **Original repository:** https://github.com/nebez/floppybird  
- **License:** Apache 2.0 (see `LICENSE`)  
- **Original author:** Nebez Briefkani

## Modifications

The original game used jQuery, jQuery Transit, and the Buzz audio library with CSS-animated DOM elements.

For the Game Library prototype this implementation:

- Rewrites the game engine as a vanilla ES module using the HTML5 Canvas API.
- Drops the jQuery, jQuery Transit, and Buzz dependencies.
- Retains the original physics constants (gravity, jump velocity, pipe gap, pipe interval).
- Retains all original sprite assets (bird, pipes, sky, land, ceiling, scoreboard, digits, sounds).
- Exposes a clean lifecycle interface (`init`, `start`, `restart`, `getScore`, `onGameOver`, `destroy`).
- Adds `getState()` and `issueFlap()` hooks for the future LAYA AI agent.
- Supports responsive canvas sizing via ResizeObserver.
- Handles missing audio gracefully (no crash if OGG is unsupported).

## Asset Attribution

All sprites and sounds are from the original Floppy Bird repository and are covered by the Apache 2.0 license.

Original game: https://nebezb.com/floppybird/

## License

Apache License 2.0 — see `LICENSE`.
