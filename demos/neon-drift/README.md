# Neon Drift

A top-down wave shooter in one canvas file.

Move with WASD, aim with the mouse, and clear neon pests as the waves get denser. Two enemy kinds ship in the starter: chasers and sidesteppers.

## Run it

- Open `index.html` or serve the folder.
- Controls: **WASD / arrows** move, **mouse** aim, **click or Space** fire, **Enter** retry after a wipe.

## What's inside

- `game.js` — player, bullets, waves, particles. Tunables: `PLAYER_SPEED`, `FIRE_COOLDOWN`, `startWave()`.
- `audio.js`, `boot.js`, `style.css` — shared kit chrome.

Everything is drawn with canvas primitives. No imported sprites.

## Remix ideas

`PROMPTS.md` has a suggested path: a dash, a new enemy, a pickup, and a local high score.

## License

MIT. Built by Cloudy.
