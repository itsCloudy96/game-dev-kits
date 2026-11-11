# Vibe-coding prompts for Prism Match

Use `.cursorrules`, then:

## 1. Target mode
> Add a MODE constant that can be 'moves' (today) or 'target'. In target mode I have unlimited moves until I reach a score goal that you pick, and the end screen should say whether I made it.

## 2. Special gems
> If a match is 4 long, leave a 'prism' gem that, when matched, clears its row. If a match is 5, leave a gem that clears its color from the board. They should look distinct and still be drawn in code.

## 3. A hint
> Add an H key or a Hint button that briefly pulses one valid swap, if any exists. If the board has no moves, reshuffle instead of stranding me, and say so in the HUD.

## 4. Animated gravity
> Right now clears resolve in one step. Add a short fall animation so gems drop into the holes before new ones appear. Keep it snappy (under 300ms) and don't let me swap mid-resolve.

## 5. Colorblind palette
> Add a second palette of shapes-plus-colors (circle, square, diamond, etc.) toggled from a button, so color is not the only tell.
