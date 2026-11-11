/* Neon Drift — original top-down wave shooter. Edit the tunables at the top. */
(function () {
  const W = 960, H = 540;
  const PLAYER_SPEED = 4.2;
  const PLAYER_R = 14;
  const BULLET_SPEED = 10;
  const FIRE_COOLDOWN = 10;
  const MAX_HP = 4;

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const hud = document.getElementById("hud");
  const keys = Object.create(null);
  const mouse = { x: W / 2, y: H / 2, down: false };
  let state;

  function reset() {
    state = {
      x: W / 2, y: H / 2, hp: MAX_HP, cd: 0, inv: 0,
      bullets: [], enemies: [], particles: [],
      wave: 1, score: 0, spawned: 0, toSpawn: 0, spawnTimer: 0,
      over: false, cleared: false, time: 0, shake: 0
    };
    startWave();
  }
  function startWave() {
    state.toSpawn = 4 + state.wave * 2;
    state.spawned = 0;
    state.spawnTimer = 20;
    state.cleared = false;
  }
  function spawnEnemy() {
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    if (edge === 0) { x = Math.random() * W; y = -20; }
    else if (edge === 1) { x = Math.random() * W; y = H + 20; }
    else if (edge === 2) { x = -20; y = Math.random() * H; }
    else { x = W + 20; y = Math.random() * H; }
    const kind = state.wave >= 3 && Math.random() < 0.35 ? "sider" : "chaser";
    const hp = kind === "sider" ? 2 : 1 + (state.wave > 4 ? 1 : 0);
    const speed = (kind === "sider" ? 2.4 : 1.6) + state.wave * 0.08;
    state.enemies.push({ x: x, y: y, r: kind === "sider" ? 13 : 16, kind: kind, hp: hp, speed: speed, t: Math.random() * 100 });
  }
  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 1 + Math.random() * 3;
      state.particles.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 18 + Math.random() * 12, color: color });
    }
  }

  function step() {
    const s = state;
    s.time++;
    if (s.over) return;
    let ix = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
    let iy = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
    const im = Math.hypot(ix, iy) || 1;
    s.x = clamp(s.x + (ix / im) * PLAYER_SPEED, PLAYER_R, W - PLAYER_R);
    s.y = clamp(s.y + (iy / im) * PLAYER_SPEED, PLAYER_R, H - PLAYER_R);
    if (s.cd > 0) s.cd--;
    if (s.inv > 0) s.inv--;
    if ((mouse.down || keys.Space) && s.cd === 0) {
      const a = Math.atan2(mouse.y - s.y, mouse.x - s.x);
      s.bullets.push({ x: s.x, y: s.y, vx: Math.cos(a) * BULLET_SPEED, vy: Math.sin(a) * BULLET_SPEED, life: 70 });
      s.cd = FIRE_COOLDOWN;
      if (window.AudioFX) AudioFX.shoot();
    }
    if (s.toSpawn > 0) {
      s.spawnTimer--;
      if (s.spawnTimer <= 0) {
        spawnEnemy();
        s.toSpawn--;
        s.spawned++;
        s.spawnTimer = Math.max(18, 40 - s.wave * 2);
      }
    }
    s.bullets.forEach(function (b) { b.x += b.vx; b.y += b.vy; b.life--; });
    s.bullets = s.bullets.filter(function (b) { return b.life > 0 && b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20; });
    s.enemies.forEach(function (en) {
      en.t++;
      if (en.kind === "chaser") {
        const a = Math.atan2(s.y - en.y, s.x - en.x);
        en.x += Math.cos(a) * en.speed;
        en.y += Math.sin(a) * en.speed;
      } else {
        const a = Math.atan2(s.y - en.y, s.x - en.x) + Math.sin(en.t / 12) * 0.8;
        en.x += Math.cos(a) * en.speed;
        en.y += Math.sin(a) * en.speed;
      }
    });
    s.bullets.forEach(function (b) {
      s.enemies.forEach(function (en) {
        if (en.hp <= 0) return;
        if (Math.hypot(b.x - en.x, b.y - en.y) < en.r + 4) {
          en.hp--;
          b.life = 0;
          burst(en.x, en.y, "#22d3ee", 6);
          if (en.hp <= 0) {
            s.score += en.kind === "sider" ? 30 : 15;
            burst(en.x, en.y, "#fbbf24", 14);
            if (window.AudioFX) AudioFX.coin();
          }
        }
      });
    });
    s.enemies = s.enemies.filter(function (en) { return en.hp > 0; });
    s.enemies.forEach(function (en) {
      if (s.inv > 0) return;
      if (Math.hypot(en.x - s.x, en.y - s.y) < en.r + PLAYER_R - 2) {
        s.hp--;
        s.inv = 50;
        s.shake = 14;
        burst(s.x, s.y, "#f87171", 16);
        if (window.AudioFX) AudioFX.hit();
        if (s.hp <= 0) { s.over = true; if (window.AudioFX) AudioFX.lose(); }
      }
    });
    if (s.toSpawn === 0 && s.enemies.length === 0 && !s.over) {
      s.wave++;
      s.score += 50;
      startWave();
      if (window.AudioFX) AudioFX.win();
    }
    s.particles.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.life--; p.vx *= 0.96; p.vy *= 0.96; });
    s.particles = s.particles.filter(function (p) { return p.life > 0; });
    if (s.shake > 0) s.shake--;
  }

  function draw() {
    const s = state;
    ctx.save();
    if (s.shake) ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
    ctx.fillStyle = "#070815";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(34,211,238,.07)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    s.particles.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, p.life / 24);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    });
    ctx.globalAlpha = 1;
    s.enemies.forEach(function (en) {
      ctx.fillStyle = en.kind === "sider" ? "#f472b6" : "#fb7185";
      ctx.beginPath();
      if (en.kind === "sider") {
        ctx.save();
        ctx.translate(en.x, en.y);
        ctx.rotate(en.t / 10);
        ctx.fillRect(-en.r, -en.r, en.r * 2, en.r * 2);
        ctx.restore();
      } else {
        ctx.arc(en.x, en.y, en.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.3)";
        ctx.stroke();
      }
    });
    s.bullets.forEach(function (b) {
      ctx.fillStyle = "#22d3ee";
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    if (s.inv % 4 < 3 || s.inv === 0) {
      const a = Math.atan2(mouse.y - s.y, mouse.x - s.x);
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(a);
      ctx.fillStyle = "#7c5cff";
      ctx.beginPath();
      ctx.moveTo(18, 0); ctx.lineTo(-12, 12); ctx.lineTo(-6, 0); ctx.lineTo(-12, -12);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#22d3ee";
      ctx.fillRect(10, -2, 10, 4);
      ctx.restore();
    }
    ctx.restore();
    if (s.over) {
      ctx.fillStyle = "rgba(7,11,20,.6)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#eef2ff";
      ctx.textAlign = "center";
      ctx.font = "bold 42px Inter, system-ui, sans-serif";
      ctx.fillText("Arena down", W / 2, H / 2 - 10);
      ctx.font = "20px Inter, system-ui, sans-serif";
      ctx.fillStyle = "#a9b4d0";
      ctx.fillText("Score " + s.score + "  ·  Wave " + s.wave + "  ·  Enter to retry", W / 2, H / 2 + 36);
      ctx.textAlign = "left";
    }
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function loop() {
    step(); draw();
    hud.textContent = "Score " + state.score + "  ·  Wave " + state.wave + "  ·  HP " + state.hp;
    if (window.tickKit) tickKit();
    requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", function (e) {
    keys[e.code] = true;
    if (e.code === "Space") e.preventDefault();
    if (e.code === "Enter" && state && state.over) reset();
  });
  window.addEventListener("keyup", function (e) { keys[e.code] = false; });
  canvas.addEventListener("pointermove", function (e) {
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * (W / r.width);
    mouse.y = (e.clientY - r.top) * (H / r.height);
  });
  canvas.addEventListener("pointerdown", function () { mouse.down = true; });
  window.addEventListener("pointerup", function () { mouse.down = false; });

  bootKit("neon-drift", function () { reset(); loop(); });
})();
