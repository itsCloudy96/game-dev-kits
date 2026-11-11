# Vibe-coding prompts for Neon Drift

Use the `.cursorrules` in this folder, then try:

## 1. A short dash
> Add a dash on Shift or right-click: a brief burst of speed, a small cooldown, and a faint afterimage drawn on the canvas. The player should stay inside the arena. Show the cooldown somewhere in the HUD.

## 2. A new enemy
> Add a third enemy kind called "orbiter" that circles the player at a distance and periodically flings a slow projectile. Introduce it from wave 4. It should take two hits. Keep chaser and sider behavior intact.

## 3. A health pickup
> Occasionally spawn a cyan plus that restores 1 HP, up to the max. It should expire after a few seconds and never spawn on top of the player.

## 4. High score
> Save the best score in localStorage (use a unique key starting with cloudy-neon-drift). Show it in the HUD and on the game-over screen. Do not add a login or a server.

## 5. Screen wrap or walls
> Let me pass a flag at the top of game.js, WRAP_ARENA, that switches between today's clamped walls and screen wrapping. Default stays clamped.
