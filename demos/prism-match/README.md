# Prism Match

A match-3 puzzle on an 8×8 board with 25 moves.

Swap two adjacent gems. Matches of three or more clear, gravity fills from the top, and combos score more. When you are out of moves, the board calls it.

## Run it

- Open `index.html` or serve the folder.
- Controls: **click or tap** a gem, then an adjacent gem to swap. Clicking a non-neighbor retargets. **Enter** deals a new board after the game ends.

## What's inside

- `game.js` — `COLS`, `ROWS`, `MOVES`, `COLORS`, match finding, gravity, drawing.
- Gems are faceted polygons, not icons from another game.
- `audio.js`, `boot.js`, `style.css`.

## Remix ideas

`PROMPTS.md` suggests special gems, a target mode, and a hint.

## License

MIT. Built by Cloudy.
