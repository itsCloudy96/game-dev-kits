# Orbit Garden

A tiny 3D collect-a-thon built with Three.js.

Steer a little craft around a floating island, gather the golden orbs, and stay on the grass. Three.js r160 is vendored in `vendor/` so the kit runs offline.

## Run it

- Opening `index.html` as a file often works (the kit uses the UMD build). If the canvas is blank, serve the folder: `python3 -m http.server 8080`.
- Controls: **WASD or arrows** to move. The craft faces the direction of travel. **Enter** restarts after you collect every orb.

## What's inside

- `game.js` — scene setup, island, craft, orbs, camera follow. `SPEED` and `ISLAND_R` are at the top.
- `vendor/three.min.js` — three.js r160, MIT, copyright the three.js authors. See `vendor/NOTICE.txt`.
- `audio.js`, `boot.js`, `style.css`.

The island, trees, rocks, and orbs are primitive meshes you can replace or extend.

## Remix ideas

`PROMPTS.md` covers a jump, a day cycle, a second island, and a simple shadow-play camera.

## License

MIT for the kit code, by Cloudy. three.js remains MIT under its own copyright.
