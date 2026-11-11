/* Cloud Hop — a tiny original platformer. Tweak the constants first. */
(function () {
  const W = 960, H = 540;
  const GRAVITY = 0.55;
  const MAX_FALL = 14;
  const MOVE_SPEED = 4.4;
  const JUMP_VEL = -11.6;
  const COYOTE_FRAMES = 8;
  const JUMP_BUFFER = 8;
  const PLAYER_W = 28, PLAYER_H = 36;

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const hud = document.getElementById("hud");
  const keys = Object.create(null);
  let jumpQueued = 0;
  let state;

  const LEVEL = [
    // x, y, w, h, kind: solid | cloud | spike | move
    [0, 500, 280, 40, "solid"],
    [320, 430, 160, 24, "cloud"],
    [540, 370, 140, 24, "cloud"],
    [740, 430, 120, 24, "solid"],
    [880, 330, 150, 24, "cloud"],
    [1080, 260, 180, 24, "solid"],
    [1180, 236, 80, 24, "spike"],
    [1320, 200, 140, 24, "cloud"],
    [1520, 280, 200, 24, "move"],
    [1800, 220, 160, 24, "cloud"],
    [2020, 300, 240, 40, "solid"],
    [2320, 240, 140, 24, "cloud"],
    [2520, 180, 220, 24, "solid"],
    [2780, 260, 160, 24, "cloud"],
    [3000, 200, 280, 40, "solid"]
  ];
  const STARS = [
    [360, 390], [580, 330], [800, 390], [940, 290], [1140, 220],
    [1360, 160], [1600, 230], [1840, 180], [2100, 250], [2360, 200],
    [2580, 140], [2860, 220], [3120, 150]
  ];
  const FLAG_X = 3200, FLAG_Y = 200;
  const WORLD_W = 3320;

  function reset(full) {
    state = {
      x: 60, y: 400, vx: 0, vy: 0,
      onGround: false, coyote: 0, facing: 1,
      camX: 0, stars: full && state ? state.stars : 0, collected: full && state ? state.collected.slice() : [],
      lives: full && state ? state.lives : 3,
      won: false, dead: false, flicker: 0, shake: 0,
      time: 0, moving: { 9: 0 }
    };
    if (!full) { state.stars = 0; state.collected = []; state.lives = 3; }
  }

  function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function platformAt(i, t) {
    const p = LEVEL[i];
    const plat = { x: p[0], y: p[1], w: p[2], h: p[3], kind: p[4] };
    if (plat.kind === "move") {
      plat.x += Math.sin((t / 50) + i) * 70;
    }
    return plat;
  }

  function physics() {
    const s = state;
    const left = keys.ArrowLeft || keys.KeyA;
    const right = keys.ArrowRight || keys.KeyD;
    s.vx = (right ? MOVE_SPEED : 0) - (left ? MOVE_SPEED : 0);
    if (s.vx) s.facing = s.vx > 0 ? 1 : -1;

    if (s.onGround) s.coyote = COYOTE_FRAMES;
    else if (s.coyote > 0) s.coyote--;
    if (jumpQueued > 0) jumpQueued--;
    if (jumpQueued && s.coyote > 0 && !s.dead && !s.won) {
      s.vy = JUMP_VEL;
      s.onGround = false;
      s.coyote = 0;
      jumpQueued = 0;
      if (window.AudioFX) AudioFX.jump();
    }
    if (!(keys.Space || keys.ArrowUp || keys.KeyW) && s.vy < -4) s.vy *= 0.5;

    s.vy = Math.min(MAX_FALL, s.vy + GRAVITY);
    s.x += s.vx;
    s.onGround = false;
    for (let i = 0; i < LEVEL.length; i++) {
      const p = platformAt(i, s.time);
      if (p.kind === "spike") continue;
      if (rectsOverlap(s.x, s.y, PLAYER_W, PLAYER_H, p.x, p.y, p.w, p.h)) {
        if (s.vy >= 0 && s.y + PLAYER_H - s.vy <= p.y + 6) {
          s.y = p.y - PLAYER_H;
          s.vy = 0;
          s.onGround = true;
        } else if (s.vy < 0 && s.y >= p.y + p.h - 8) {
          s.y = p.y + p.h;
          s.vy = 0;
        } else if (s.x + PLAYER_W / 2 < p.x + p.w / 2) {
          s.x = p.x - PLAYER_W;
        } else {
          s.x = p.x + p.w;
        }
      }
    }
    s.y += s.vy;
    if (s.x < 0) s.x = 0;

    for (let i = 0; i < LEVEL.length; i++) {
      const p = platformAt(i, s.time);
      if (p.kind === "spike" && rectsOverlap(s.x, s.y + PLAYER_H - 10, PLAYER_W, 10, p.x, p.y, p.w, p.h)) {
        hurt();
      }
    }

    STARS.forEach(function (star, i) {
      if (s.collected[i]) return;
      if (rectsOverlap(s.x, s.y, PLAYER_W, PLAYER_H, star[0] - 8, star[1] - 8, 16, 16)) {
        s.collected[i] = true;
        s.stars += 1;
        if (window.AudioFX) AudioFX.coin();
      }
    });

    if (rectsOverlap(s.x, s.y, PLAYER_W, PLAYER_H, FLAG_X - 10, FLAG_Y - 80, 20, 80) && !s.won) {
      s.won = true;
      if (window.AudioFX) AudioFX.win();
    }
    if (s.y > H + 40) hurt(true);
    s.camX += (s.x - 280 - s.camX) * 0.08;
    if (s.camX < 0) s.camX = 0;
    if (s.camX > WORLD_W - W) s.camX = Math.max(0, WORLD_W - W);
    if (s.flicker > 0) s.flicker--;
    if (s.shake > 0) s.shake--;
  }

  function hurt(fell) {
    const s = state;
    if (s.dead || s.won || s.flicker > 0) {
      if (fell && !s.dead && !s.won) respawn();
      return;
    }
    s.lives -= 1;
    s.shake = 12;
    s.flicker = 40;
    if (window.AudioFX) AudioFX.hit();
    if (s.lives <= 0) {
      s.dead = true;
      if (window.AudioFX) AudioFX.lose();
    } else if (fell) {
      respawn();
    }
  }
  function respawn() {
    state.x = 60; state.y = 400; state.vx = 0; state.vy = 0; state.camX = 0;
  }

  function drawSky(t) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#1a1050");
    g.addColorStop(0.6, "#2a1860");
    g.addColorStop(1, "#3c1d4a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,.7)";
    for (let i = 0; i < 40; i++) {
      const x = (i * 97 + t * 0.05) % (W + 20) - 10;
      const y = (i * 53) % 240 + 10;
      ctx.fillRect(x, y, 2, 2);
    }
    // distant clouds
    ctx.fillStyle = "rgba(180,160,255,.15)";
    for (let i = 0; i < 6; i++) {
      const x = ((i * 280) - state.camX * 0.3) % (W + 200) - 80;
      cloud(x, 60 + i * 18, 50 + (i % 3) * 10);
    }
  }
  function cloud(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r * 0.6, 0, Math.PI * 2);
    ctx.arc(x + r * 0.6, y - 6, r * 0.45, 0, Math.PI * 2);
    ctx.arc(x + r, y + 4, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw() {
    const s = state;
    const shx = s.shake ? (Math.random() - 0.5) * 6 : 0;
    ctx.save();
    ctx.translate(shx, 0);
    drawSky(s.time);
    ctx.translate(-s.camX, 0);
    LEVEL.forEach(function (_, i) {
      const p = platformAt(i, s.time);
      if (p.kind === "spike") {
        ctx.fillStyle = "#f87171";
        const n = Math.floor(p.w / 16);
        for (let k = 0; k < n; k++) {
          ctx.beginPath();
          ctx.moveTo(p.x + k * 16, p.y + p.h);
          ctx.lineTo(p.x + k * 16 + 8, p.y);
          ctx.lineTo(p.x + k * 16 + 16, p.y + p.h);
          ctx.fill();
        }
        return;
      }
      ctx.fillStyle = p.kind === "cloud" ? "#c4b5fd" : p.kind === "move" ? "#22d3ee" : "#34d399";
      ctx.strokeStyle = "rgba(0,0,0,.25)";
      roundRect(p.x, p.y, p.w, p.h, 8);
      ctx.fill(); ctx.stroke();
      if (p.kind === "cloud") {
        ctx.fillStyle = "rgba(255,255,255,.35)";
        ctx.fillRect(p.x + 8, p.y + 4, p.w * 0.4, 4);
      }
    });
    STARS.forEach(function (star, i) {
      if (s.collected[i]) return;
      ctx.save();
      ctx.translate(star[0], star[1] + Math.sin(s.time / 12 + i) * 3);
      ctx.rotate(s.time / 30);
      ctx.fillStyle = "#fbbf24";
      starPath(0, 0, 5, 9, 4);
      ctx.fill();
      ctx.restore();
    });
    // flag / beacon
    ctx.fillStyle = "#eef2ff";
    ctx.fillRect(FLAG_X, FLAG_Y - 80, 5, 80);
    ctx.fillStyle = "#7c5cff";
    ctx.beginPath();
    ctx.moveTo(FLAG_X + 5, FLAG_Y - 80);
    ctx.lineTo(FLAG_X + 44, FLAG_Y - 62);
    ctx.lineTo(FLAG_X + 5, FLAG_Y - 44);
    ctx.fill();
    ctx.fillStyle = "#22d3ee";
    ctx.beginPath();
    ctx.arc(FLAG_X + 2, FLAG_Y - 80, 6 + Math.sin(s.time / 8) * 1.5, 0, Math.PI * 2);
    ctx.fill();

    if (s.flicker % 4 < 3 || s.flicker === 0) {
      const px = s.x, py = s.y;
      ctx.fillStyle = "#7c5cff";
      roundRect(px, py + 6, PLAYER_W, PLAYER_H - 6, 8);
      ctx.fill();
      ctx.fillStyle = "#fde68a";
      ctx.beginPath();
      ctx.arc(px + PLAYER_W / 2 + s.facing * 2, py + 8, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0b1020";
      ctx.beginPath();
      ctx.arc(px + PLAYER_W / 2 + s.facing * 4 - 3, py + 7, 2, 0, Math.PI * 2);
      ctx.arc(px + PLAYER_W / 2 + s.facing * 4 + 3, py + 7, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    if (s.won || s.dead) {
      ctx.fillStyle = "rgba(7,11,20,.55)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#eef2ff";
      ctx.textAlign = "center";
      ctx.font = "bold 42px Inter, system-ui, sans-serif";
      ctx.fillText(s.won ? "You reached the beacon!" : "Fell through the clouds", W / 2, H / 2);
      ctx.font = "20px Inter, system-ui, sans-serif";
      ctx.fillStyle = "#a9b4d0";
      ctx.fillText(s.won ? "Stars collected: " + s.stars + "  ·  Enter to play again" : "Enter to try again", W / 2, H / 2 + 40);
      ctx.textAlign = "left";
    }
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function starPath(x, y, n, ro, ri) {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const a = (i * Math.PI) / n - Math.PI / 2;
      const r = i % 2 === 0 ? ro : ri;
      const fn = i === 0 ? ctx.moveTo : ctx.lineTo;
      fn.call(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.closePath();
  }

  function loop() {
    state.time++;
    if (!state.won && !state.dead) physics();
    draw();
    hud.textContent = "Stars " + state.stars + " / " + STARS.length + "  ·  Lives " + state.lives;
    if (window.tickKit) tickKit();
    requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", function (e) {
    keys[e.code] = true;
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
      e.preventDefault();
      jumpQueued = JUMP_BUFFER;
    }
    if ((e.code === "Enter" || e.code === "Space") && (state.dead || state.won)) {
      reset(false);
      e.preventDefault();
    }
  });
  window.addEventListener("keyup", function (e) { keys[e.code] = false; });
  canvas.addEventListener("pointerdown", function () { jumpQueued = JUMP_BUFFER; });

  bootKit("cloud-hop", function () {
    reset(false);
    loop();
  });
})();
