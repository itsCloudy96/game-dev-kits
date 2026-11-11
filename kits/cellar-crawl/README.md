# Cellar Crawl

A turn-based roguelike on a grid, with fog of war, flasks, pests, and stairs.

Each key press is one turn: you move or bump-attack, then the mites take their step. A new floor is generated when you walk onto the stairs. The seed is shown so you can talk about a specific cellar.

## Run it

- Open `index.html` or serve the folder.
- Controls: **arrows or WASD** to move (one cell per press), **Enter** to start a new crawl after you fall.

## What's inside

- `game.js` — room-and-corridor generator, FOV, items, enemies, drawing. `COLS`, `ROWS`, `MAX_HP` are at the top.
- `audio.js`, `boot.js`, `style.css`.

Tiles, creatures, and items are drawn as simple shapes. No tile sheets from other games.

## Remix ideas

`PROMPTS.md` covers a second enemy AI, a locked door, and a visible map legend.

## License

MIT. Built by Cloudy.
