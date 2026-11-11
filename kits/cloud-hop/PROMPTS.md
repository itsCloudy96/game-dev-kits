# Vibe-coding prompts for Cloud Hop

Paste the Cursor rules in `.cursorrules` into your project rules (they're already in this folder). Then try these in order.

## 1. Tighten the jump
> Open game.js. Keep the current move speed. Tune GRAVITY, JUMP_VEL, COYOTE_FRAMES and the jump cut so I can hop onto a one-tile-high cloud reliably and still clear the longer gaps. Do not add a double jump yet. Tell me what you changed and how I should playtest it.

## 2. Add a moving storm cloud
> Add a new platform kind called "storm" to LEVEL. It should look different from solid and cloud platforms, drift slowly left and right, and hurt the player on contact the way spikes do. Keep the existing level playable.

## 3. A second, shorter course
> Add a LEVELS array with the current course as level 1 and a shorter, trickier level 2. Reaching the beacon on level 1 should load level 2 and keep the star count and lives. Reaching the beacon on level 2 still shows the win screen.

## 4. Juice
> Add a small landing squash, a puff of particles when I collect a star, and a soft camera bump on taking damage. Honor a reduced feel if it's easy: skip extra flash. Do not add image files.

## 5. Touch controls
> Add on-screen left / right / jump buttons that only show on coarse pointers, without breaking the keyboard controls.
