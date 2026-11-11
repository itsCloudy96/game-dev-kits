# Skyline Dash

An endless rooftop runner with a local high score.

The city auto-scrolls. Jump crates, duck under neon bars, and clear gaps that open in the roof. Speed climbs the longer you stay up.

## Run it

- Open `index.html` or serve the folder.
- Controls: **Space / ↑ / W / tap** jump (a second jump is available in mid-air), **Down / S** duck, **Enter** or tap after a crash to run again.

## What's inside

- `game.js` — speed curve, obstacle spawns, parallax skyline. `START_SPEED`, `JUMP_VEL`, `DOUBLE_JUMP` sit at the top.
- High score key: `cloudy-skyline-dash-best` in localStorage.
- `audio.js`, `boot.js`, `style.css`.

The skyline, moon, and obstacles are drawn in code.

## Remix ideas

`PROMPTS.md` has a triple-lane variant, a coin pickup, and a near-miss juice pass.

## License

MIT. Built by Cloudy.
