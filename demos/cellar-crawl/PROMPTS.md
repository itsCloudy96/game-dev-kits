# Vibe-coding prompts for Cellar Crawl

Use `.cursorrules`, then:

## 1. Smarter pests
> When a mite or worm can see the player, it should path around obvious walls instead of walking into them and stalling. Keep the one-step-per-turn rule. Do not add a heavyweight pathfinding library — a tiny BFS on the grid is enough.

## 2. A locked gate
> Sometimes a room should be behind a gate that opens only if you are carrying a key item. Spawn the key in an earlier room on that floor. Draw the gate and the key as original shapes, not icons from another game.

## 3. A thrown flask
> Add a 'fire a flask in the last move direction' action on F or Space. It should travel until a wall or an enemy, deal damage, and be limited by how many flasks you have picked up. Don't break bump-to-attack.

## 4. Depth modifiers
> From floor 4, introduce one new hazard (fungus tiles that deal 1 when you step on them, or a dark floor with a smaller FOV). Make it obvious in the log.

## 5. Shareable seed
> Let me pass ?seed=12345 to start a crawl with that base seed, and add a "copy seed" button near the HUD using the same boot/page chrome.
