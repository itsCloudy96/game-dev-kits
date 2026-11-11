# Cloud Hop

A tiny 2D platformer you can open in a browser and start vibe-coding.

Run, jump (with coyote time and a jump cut), collect stars, avoid crimson spikes, and reach the beacon at the end of the sky islands.

## Run it

- Double-click `index.html`, or from this folder run `python3 -m http.server 8080` and open http://localhost:8080/
- Controls: **← →** or **A D** to move, **Space / ↑ / W / tap** to jump, **Enter** to restart after a win or a fall.

## What's inside

- `game.js` — physics, the level, drawing. Constants at the top (`GRAVITY`, `JUMP_VEL`, `LEVEL`, `STARS`).
- `audio.js` — tiny Web Audio beeps, no sound files.
- `boot.js` — start overlay, `?autostart=1` for tests, `window.__CLOUDY_KIT__`.
- `style.css` — the chrome around the canvas.

All art is drawn in code. No spritesheets, no trademarked characters.

## Remix ideas

See `PROMPTS.md` for step-by-step Cursor / Claude prompts. Easy first edits: change `JUMP_VEL`, add a platform to `LEVEL`, or recolor the sky in `drawSky`.

## License

MIT. Built by Cloudy.
