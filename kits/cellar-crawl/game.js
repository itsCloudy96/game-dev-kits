/* Cellar Crawl — original turn-based roguelike. Seed is shown so you can retry a floor. */
(function () {
  const COLS = 25, ROWS = 13, TILE = 36;
  const OX = 30, OY = 0;
  const MAX_HP = 8;
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const hud = document.getElementById("hud");
  let state, moving = false;

  function rng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }
  function inBounds(x, y) { return x >= 0 && y >= 0 && x < COLS && y < ROWS; }
  function key(x, y) { return x + "," + y; }

  function carveRoom(map, x, y, w, h) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (inBounds(i, j)) map[j][i] = 0;
  }
  function carveHall(map, x1, y1, x2, y2) {
    let x = x1, y = y1;
    while (x !== x2) { map[y][x] = 0; x += x2 > x ? 1 : -1; }
    while (y !== y2) { map[y][x] = 0; y += y2 > y ? 1 : -1; }
    map[y][x] = 0;
  }

  function generate(seed, floor) {
    const rand = rng(seed);
    const map = [];
    for (let y = 0; y < ROWS; y++) {
      map[y] = [];
      for (let x = 0; x < COLS; x++) map[y][x] = 1;
    }
    const rooms = [];
    const attempts = 18;
    for (let i = 0; i < attempts; i++) {
      const w = 3 + Math.floor(rand() * 5);
      const h = 3 + Math.floor(rand() * 4);
      const x = 1 + Math.floor(rand() * (COLS - w - 2));
      const y = 1 + Math.floor(rand() * (ROWS - h - 2));
      let overlap = false;
      rooms.forEach(function (r) {
        if (x <= r.x + r.w && x + w >= r.x && y <= r.y + r.h && y + h >= r.y) overlap = true;
      });
      if (overlap) continue;
      carveRoom(map, x, y, w, h);
      rooms.push({ x: x, y: y, w: w, h: h, cx: x + (w >> 1), cy: y + (h >> 1) });
    }
    if (rooms.length < 3) return generate(seed + 17, floor);
    for (let i = 1; i < rooms.length; i++) {
      carveHall(map, rooms[i - 1].cx, rooms[i - 1].cy, rooms[i].cx, rooms[i].cy);
    }
    const start = rooms[0];
    const end = rooms[rooms.length - 1];
    const px = start.cx, py = start.cy;
    const stairs = { x: end.cx, y: end.cy };
    const items = [];
    const enemies = [];
    rooms.forEach(function (r, i) {
      if (i === 0) return;
      if (rand() < 0.55) items.push({ x: r.cx + (rand() < 0.5 ? -1 : 1), y: r.cy, kind: rand() < 0.55 ? "flask" : "coin" });
      if (i !== rooms.length - 1 && rand() < 0.7) {
        const n = 1 + (floor > 2 && rand() < 0.5 ? 1 : 0);
        for (let k = 0; k < n; k++) {
          enemies.push({
            x: r.x + 1 + Math.floor(rand() * Math.max(1, r.w - 2)),
            y: r.y + 1 + Math.floor(rand() * Math.max(1, r.h - 2)),
            hp: 1 + (floor > 3 ? 1 : 0),
            kind: rand() < 0.3 && floor > 1 ? "worm" : "mite"
          });
        }
      }
    });
    return { map: map, px: px, py: py, stairs: stairs, items: items, enemies: enemies };
  }

  function visible(map, px, py, radius) {
    const vis = {};
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (Math.abs(x - px) + Math.abs(y - py) <= radius && !blocked(map, px, py, x, y)) vis[key(x, y)] = true;
    }
    vis[key(px, py)] = true;
    return vis;
  }
  function blocked(map, x0, y0, x1, y1) {
    let x = x0, y = y0;
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) {
      const tx = Math.round(x0 + ((x1 - x0) * i) / (n || 1));
      const ty = Math.round(y0 + ((y1 - y0) * i) / (n || 1));
      if (map[ty][tx] === 1 && !(tx === x1 && ty === y1)) return true;
      x = tx; y = ty;
    }
    return false;
  }

  function makeFloor(floor, keep) {
    const seed = (keep && keep.seedBase || (Date.now() & 0xffff)) + floor * 997;
    const g = generate(seed, floor);
    const next = {
      seedBase: keep && keep.seedBase || seed - floor * 997,
      seed: seed,
      floor: floor,
      map: g.map,
      px: g.px, py: g.py,
      stairs: g.stairs,
      items: g.items,
      enemies: g.enemies.filter(function (en) { return !(en.x === g.px && en.y === g.py); }),
      hp: keep ? keep.hp : MAX_HP,
      gold: keep ? keep.gold : 0,
      seen: keep && keep.seen && floor === keep.floor ? keep.seen : {},
      log: keep && keep.log ? keep.log.slice(-4) : ["You descend into cellar " + floor + "."],
      over: false, wonFloor: false, time: 0
    };
    const vis = visible(next.map, next.px, next.py, 5);
    Object.keys(vis).forEach(function (k) { next.seen[k] = true; });
    next.vis = vis;
    return next;
  }

  function enemyAt(x, y) {
    for (let i = 0; i < state.enemies.length; i++) {
      if (state.enemies[i].x === x && state.enemies[i].y === y && state.enemies[i].hp > 0) return state.enemies[i];
    }
    return null;
  }
  function walkable(x, y) {
    return inBounds(x, y) && state.map[y][x] === 0;
  }

  function tryMove(dx, dy) {
    if (!state || state.over || moving) return;
    const nx = state.px + dx, ny = state.py + dy;
    if (!walkable(nx, ny)) return;
    const foe = enemyAt(nx, ny);
    if (foe) {
      foe.hp -= 1;
      state.log.push("You swat the " + foe.kind + ".");
      if (window.AudioFX) AudioFX.hit();
      if (foe.hp <= 0) {
        state.gold += foe.kind === "worm" ? 5 : 3;
        state.log.push("The " + foe.kind + " drops.");
        if (window.AudioFX) AudioFX.coin();
      }
    } else {
      state.px = nx; state.py = ny;
      state.items = state.items.filter(function (it) {
        if (it.x === nx && it.y === ny) {
          if (it.kind === "flask") {
            state.hp = Math.min(MAX_HP, state.hp + 3);
            state.log.push("The flask warms you (+3 HP).");
          } else {
            state.gold += 4;
            state.log.push("You pocket a coin.");
          }
          if (window.AudioFX) AudioFX.coin();
          return false;
        }
        return true;
      });
      if (state.px === state.stairs.x && state.py === state.stairs.y) {
        state.log.push("Stairs spiral deeper...");
        if (window.AudioFX) AudioFX.win();
        state = makeFloor(state.floor + 1, state);
        return;
      }
    }
    state.enemies = state.enemies.filter(function (en) { return en.hp > 0; });
    enemiesTurn();
    state.vis = visible(state.map, state.px, state.py, 5);
    Object.keys(state.vis).forEach(function (k) { state.seen[k] = true; });
    if (state.hp <= 0) {
      state.over = true;
      state.log.push("You collapse in the cellar.");
      if (window.AudioFX) AudioFX.lose();
    }
  }

  function enemiesTurn() {
    state.enemies.forEach(function (en) {
      const dist = Math.abs(en.x - state.px) + Math.abs(en.y - state.py);
      let dx = 0, dy = 0;
      if (dist <= 7 && state.vis[key(en.x, en.y)]) {
        dx = Math.sign(state.px - en.x);
        dy = Math.sign(state.py - en.y);
        if (Math.abs(state.px - en.x) >= Math.abs(state.py - en.y)) dy = 0;
        else dx = 0;
      } else if (Math.random() < 0.4) {
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        const d = dirs[Math.floor(Math.random() * 4)];
        dx = d[0]; dy = d[1];
      }
      const nx = en.x + dx, ny = en.y + dy;
      if (nx === state.px && ny === state.py) {
        const dmg = en.kind === "worm" ? 2 : 1;
        state.hp -= dmg;
        state.log.push("The " + en.kind + " nips you (−" + dmg + ").");
        if (window.AudioFX) AudioFX.hit();
        return;
      }
      if (walkable(nx, ny) && !enemyAt(nx, ny) && !(nx === state.stairs.x && ny === state.stairs.y)) {
        en.x = nx; en.y = ny;
      }
    });
  }

  function draw() {
    const s = state;
    ctx.fillStyle = "#070815";
    ctx.fillRect(0, 0, 960, 540);
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const k = key(x, y);
        const seen = s.seen[k], vis = s.vis[k];
        const px = OX + x * TILE, py = OY + y * TILE;
        if (!seen) {
          ctx.fillStyle = "#05060c";
          ctx.fillRect(px, py, TILE, TILE);
          continue;
        }
        if (s.map[y][x] === 1) {
          ctx.fillStyle = vis ? "#2a2048" : "#161022";
          ctx.fillRect(px, py, TILE, TILE);
          ctx.fillStyle = vis ? "#3b2d62" : "#1c1730";
          ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
        } else {
          ctx.fillStyle = vis ? "#1b1433" : "#100c1c";
          ctx.fillRect(px, py, TILE, TILE);
          if (vis) {
            ctx.fillStyle = "rgba(124,92,255,.07)";
            ctx.fillRect(px, py, TILE, TILE);
          }
        }
      }
    }
    const sx = OX + s.stairs.x * TILE, sy = OY + s.stairs.y * TILE;
    if (s.seen[key(s.stairs.x, s.stairs.y)]) {
      ctx.fillStyle = s.vis[key(s.stairs.x, s.stairs.y)] ? "#22d3ee" : "#164e63";
      ctx.fillRect(sx + 8, sy + 8, TILE - 16, TILE - 16);
      ctx.strokeStyle = "#eef2ff";
      ctx.strokeRect(sx + 8, sy + 8, TILE - 16, TILE - 16);
    }
    s.items.forEach(function (it) {
      if (!s.vis[key(it.x, it.y)]) return;
      ctx.fillStyle = it.kind === "flask" ? "#34d399" : "#fbbf24";
      ctx.beginPath();
      ctx.arc(OX + it.x * TILE + TILE / 2, OY + it.y * TILE + TILE / 2, 7, 0, Math.PI * 2);
      ctx.fill();
    });
    s.enemies.forEach(function (en) {
      if (!s.vis[key(en.x, en.y)] || en.hp <= 0) return;
      const cx = OX + en.x * TILE + TILE / 2, cy = OY + en.y * TILE + TILE / 2;
      ctx.fillStyle = en.kind === "worm" ? "#f472b6" : "#fb7185";
      ctx.beginPath();
      ctx.arc(cx, cy, en.kind === "worm" ? 11 : 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0b1020";
      ctx.fillRect(cx - 3, cy - 3, 2, 2);
      ctx.fillRect(cx + 2, cy - 3, 2, 2);
    });
    ctx.fillStyle = "#c4b5fd";
    const px = OX + s.px * TILE + 6, py = OY + s.py * TILE + 6;
    ctx.fillRect(px, py, TILE - 12, TILE - 12);
    ctx.fillStyle = "#fde68a";
    ctx.fillRect(px + 6, py + 3, 16, 12);

    ctx.fillStyle = "#a9b4d0";
    ctx.font = "13px Inter, system-ui, sans-serif";
    const logs = s.log.slice(-4);
    logs.forEach(function (line, i) { ctx.fillText(line, OX, ROWS * TILE + 16 + i * 16); });
    ctx.fillStyle = "#64748b";
    ctx.fillText("Seed " + s.seed, 780, ROWS * TILE + 16);

    if (s.over) {
      ctx.fillStyle = "rgba(7,11,20,.7)";
      ctx.fillRect(0, 0, 960, 540);
      ctx.fillStyle = "#eef2ff";
      ctx.textAlign = "center";
      ctx.font = "bold 42px Inter, system-ui, sans-serif";
      ctx.fillText("The cellar keeps you", 480, 240);
      ctx.font = "20px Inter, system-ui, sans-serif";
      ctx.fillStyle = "#a9b4d0";
      ctx.fillText("Floor " + s.floor + "  ·  Gold " + s.gold + "  ·  Enter to crawl again", 480, 286);
      ctx.textAlign = "left";
    }
  }

  function loop() {
    state.time++;
    draw();
    hud.textContent = "Floor " + state.floor + "  ·  HP " + state.hp + " / " + MAX_HP + "  ·  Gold " + state.gold;
    if (window.tickKit) tickKit();
    requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", function (e) {
    const map = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1], KeyA: [-1, 0], KeyD: [1, 0], KeyW: [0, -1], KeyS: [0, 1] };
    if (map[e.code]) { e.preventDefault(); tryMove(map[e.code][0], map[e.code][1]); }
    if (e.code === "Enter" && state && state.over) { state = makeFloor(1, null); }
  });

  bootKit("cellar-crawl", function () { state = makeFloor(1, null); loop(); });
})();
