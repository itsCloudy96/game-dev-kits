/* Skyline Dash — original endless runner. High score is stored locally. */
(function () {
  const W = 960, H = 540;
  const GROUND_Y = 430;
  const GRAVITY = 0.7;
  const JUMP_VEL = -13;
  const DOUBLE_JUMP = -11;
  const PLAYER_W = 34, PLAYER_H = 48, DUCK_H = 28;
  const START_SPEED = 6;

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const hud = document.getElementById("hud");
  const keys = Object.create(null);
  let jumpQueued = false;
  let state;
  const BEST_KEY = "cloudy-skyline-dash-best";

  function best() {
    try { return parseInt(localStorage.getItem(BEST_KEY) || "0", 10) || 0; } catch (e) { return 0; }
  }
  function saveBest(n) {
    try { localStorage.setItem(BEST_KEY, String(n)); } catch (e) {}
  }

  function reset() {
    state = {
      y: GROUND_Y - PLAYER_H, vy: 0, onGround: true, jumps: 0, duck: false,
      speed: START_SPEED, dist: 0, score: 0, best: best(),
      obstacles: [], clouds: [], buildings: [],
      next: 90, time: 0, over: false, flicker: 0
    };
    for (let i = 0; i < 8; i++) state.buildings.push(makeBuilding(i * 180));
    for (let i = 0; i < 5; i++) state.clouds.push({ x: i * 220, y: 50 + (i * 47) % 90, r: 24 + (i % 3) * 8, sp: 0.3 + (i % 3) * 0.1 });
  }
  function makeBuilding(x) {
    return { x: x, w: 80 + Math.random() * 140, h: 80 + Math.random() * 200, shade: 0.08 + Math.random() * 0.12 };
  }
  function spawn() {
    const roll = Math.random();
    if (roll < 0.45) {
      state.obstacles.push({ kind: "crate", x: W + 20, y: GROUND_Y - 36, w: 36, h: 36 });
    } else if (roll < 0.7) {
      state.obstacles.push({ kind: "gap", x: W + 20, y: GROUND_Y, w: 90 + Math.random() * 50, h: 80 });
    } else if (roll < 0.88) {
      state.obstacles.push({ kind: "bar", x: W + 20, y: GROUND_Y - 78, w: 50, h: 16 });
    } else {
      state.obstacles.push({ kind: "crate", x: W + 20, y: GROUND_Y - 36, w: 36, h: 36 });
      state.obstacles.push({ kind: "bar", x: W + 90, y: GROUND_Y - 78, w: 50, h: 16 });
    }
    state.next = 70 + Math.random() * 50 - Math.min(25, state.speed * 2);
  }

  function step() {
    const s = state;
    s.time++;
    if (s.over) return;
    s.duck = !!(keys.ArrowDown || keys.KeyS) && s.onGround;
    const h = s.duck ? DUCK_H : PLAYER_H;
    if (s.onGround) s.jumps = 0;
    if (jumpQueued) {
      if (s.onGround || s.jumps < 2) {
        s.vy = s.onGround ? JUMP_VEL : DOUBLE_JUMP;
        s.onGround = false;
        s.jumps += 1;
        s.duck = false;
        if (window.AudioFX) AudioFX.jump();
      }
      jumpQueued = false;
    }
    const px = 140;
    s.vy += GRAVITY;
    s.y += s.vy;
    if (s.y >= GROUND_Y - h) {
      const overGap = s.obstacles.some(function (o) {
        return o.kind === "gap" && px < o.x + o.w && px + PLAYER_W > o.x;
      });
      if (!overGap) { s.y = GROUND_Y - h; s.vy = 0; s.onGround = true; }
    }
    if (s.y > H + 20) { die(); return; }

    s.speed = START_SPEED + Math.min(7, s.dist / 1800);
    s.dist += s.speed;
    s.score = Math.floor(s.dist / 10);
    s.next--;
    if (s.next <= 0) spawn();

    s.obstacles.forEach(function (o) { o.x -= s.speed; });
    s.obstacles = s.obstacles.filter(function (o) { return o.x + o.w > -40; });
    s.buildings.forEach(function (b) { b.x -= s.speed * 0.4; });
    if (s.buildings.length && s.buildings[0].x + s.buildings[0].w < 0) {
      s.buildings.shift();
      const last = s.buildings[s.buildings.length - 1];
      s.buildings.push(makeBuilding(last.x + last.w + 12));
    }
    s.clouds.forEach(function (c) {
      c.x -= c.sp * (s.speed * 0.15);
      if (c.x < -80) { c.x = W + 40; c.y = 40 + Math.random() * 100; }
    });

    const py = s.duck ? GROUND_Y - DUCK_H : s.y;
    const ph = s.duck ? DUCK_H : PLAYER_H;
    for (let i = 0; i < s.obstacles.length; i++) {
      const o = s.obstacles[i];
      if (o.kind === "gap") continue;
      if (px < o.x + o.w && px + PLAYER_W > o.x && py < o.y + o.h && py + ph > o.y) {
        die();
        return;
      }
    }
  }
  function die() {
    state.over = true;
    if (state.score > state.best) { state.best = state.score; saveBest(state.best); }
    if (window.AudioFX) AudioFX.lose();
  }

  function draw() {
    const s = state;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0d1530");
    g.addColorStop(0.55, "#1a1140");
    g.addColorStop(1, "#3b1d4d");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,220,150,.85)";
    ctx.beginPath(); ctx.arc(760, 90, 36, 0, Math.PI * 2); ctx.fill();
    s.clouds.forEach(function (c) {
      ctx.fillStyle = "rgba(200,190,255,.18)";
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.arc(c.x + c.r * 0.8, c.y + 4, c.r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    });
    s.buildings.forEach(function (b) {
      ctx.fillStyle = "rgba(10,14,28," + (0.55 + b.shade) + ")";
      ctx.fillRect(b.x, GROUND_Y - b.h, b.w, b.h);
      ctx.fillStyle = "rgba(251,191,36,.15)";
      for (let y = GROUND_Y - b.h + 16; y < GROUND_Y - 10; y += 18) {
        for (let x = b.x + 10; x < b.x + b.w - 10; x += 16) ctx.fillRect(x, y, 8, 8);
      }
    });
    ctx.fillStyle = "#161b2e";
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    ctx.fillStyle = "#22d3ee";
    ctx.fillRect(0, GROUND_Y, W, 3);

    s.obstacles.forEach(function (o) {
      if (o.kind === "gap") {
        ctx.fillStyle = "#070815";
        ctx.fillRect(o.x, GROUND_Y, o.w, H - GROUND_Y);
        ctx.fillStyle = "#3b1d4d";
        ctx.fillRect(o.x, GROUND_Y, o.w, 8);
        return;
      }
      ctx.fillStyle = o.kind === "bar" ? "#f472b6" : "#7c5cff";
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = "rgba(255,255,255,.15)";
      ctx.fillRect(o.x + 4, o.y + 4, o.w * 0.4, 4);
    });

    const px = 140;
    const ph = s.duck ? DUCK_H : PLAYER_H;
    const py = s.duck ? GROUND_Y - DUCK_H : s.y;
    ctx.fillStyle = "#7c5cff";
    ctx.fillRect(px, py, PLAYER_W, ph);
    ctx.fillStyle = "#fde68a";
    ctx.fillRect(px + 8, py + 4, 18, 14);
    ctx.fillStyle = "#0b1020";
    ctx.fillRect(px + 14, py + 8, 3, 3);
    ctx.fillRect(px + 20, py + 8, 3, 3);
    if (s.over) {
      ctx.fillStyle = "rgba(7,11,20,.6)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#eef2ff";
      ctx.textAlign = "center";
      ctx.font = "bold 42px Inter, system-ui, sans-serif";
      ctx.fillText("Trip up", W / 2, H / 2 - 10);
      ctx.font = "20px Inter, system-ui, sans-serif";
      ctx.fillStyle = "#a9b4d0";
      ctx.fillText("Score " + s.score + "  ·  Best " + s.best + "  ·  Enter to run again", W / 2, H / 2 + 36);
      ctx.textAlign = "left";
    }
  }

  function loop() {
    step(); draw();
    hud.textContent = "Score " + state.score + "  ·  Best " + state.best + "  ·  Speed " + state.speed.toFixed(1);
    if (window.tickKit) tickKit();
    requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", function (e) {
    keys[e.code] = true;
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") { e.preventDefault(); jumpQueued = true; }
    if (e.code === "Enter" && state && state.over) reset();
  });
  window.addEventListener("keyup", function (e) { keys[e.code] = false; });
  canvas.addEventListener("pointerdown", function () { if (state && state.over) reset(); else jumpQueued = true; });

  bootKit("skyline-dash", function () { reset(); loop(); });
})();
