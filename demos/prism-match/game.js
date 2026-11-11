/* Prism Match — original match-3. No third-party assets; gems are just colored facets. */
(function () {
  const COLS = 8, ROWS = 8, MOVES = 25;
  const COLORS = ["#7c5cff", "#22d3ee", "#34d399", "#fbbf24", "#f472b6", "#60a5fa"];
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const hud = document.getElementById("hud");
  const W = 960, H = 540;
  const PAD = 24;
  const BOARD = Math.min(H - PAD * 2, 500);
  const OX = (W - BOARD) / 2, OY = (H - BOARD) / 2;
  const CELL = BOARD / COLS;
  let state, anim = 0;

  function randColor() { return Math.floor(Math.random() * COLORS.length); }
  function makeBoard() {
    const b = [];
    for (let y = 0; y < ROWS; y++) {
      b[y] = [];
      for (let x = 0; x < COLS; x++) {
        do { b[y][x] = randColor(); }
        while (runAt(b, x, y));
      }
    }
    return b;
  }
  function runAt(b, x, y) {
    const c = b[y][x];
    let n = 1, i = x - 1;
    while (i >= 0 && b[y][i] === c) { n++; i--; }
    if (n >= 3) return true;
    n = 1; i = y - 1;
    while (i >= 0 && b[i][x] === c) { n++; i--; }
    return n >= 3;
  }
  function reset() {
    state = { board: makeBoard(), selected: null, score: 0, moves: MOVES, over: false, busy: false, time: 0, pops: [] };
  }

  function findMatches(b) {
    const mark = {};
    function flag(x, y) { mark[x + "," + y] = true; }
    for (let y = 0; y < ROWS; y++) {
      let run = 1;
      for (let x = 1; x <= COLS; x++) {
        if (x < COLS && b[y][x] === b[y][x - 1] && b[y][x] !== null) run++;
        else { if (run >= 3) for (let k = 0; k < run; k++) flag(x - 1 - k, y); run = 1; }
      }
    }
    for (let x = 0; x < COLS; x++) {
      let run = 1;
      for (let y = 1; y <= ROWS; y++) {
        if (y < ROWS && b[y][x] === b[y - 1][x] && b[y][x] !== null) run++;
        else { if (run >= 3) for (let k = 0; k < run; k++) flag(x, y - 1 - k); run = 1; }
      }
    }
    return Object.keys(mark).map(function (k) { const p = k.split(","); return { x: +p[0], y: +p[1] }; });
  }

  function resolve() {
    let total = 0, combo = 0;
    for (;;) {
      const m = findMatches(state.board);
      if (!m.length) break;
      combo++;
      total += m.length * 10 * combo;
      m.forEach(function (p) {
        state.board[p.y][p.x] = null;
        state.pops.push({ x: p.x, y: p.y, t: 12 });
      });
      for (let x = 0; x < COLS; x++) {
        const col = [];
        for (let y = 0; y < ROWS; y++) if (state.board[y][x] !== null) col.push(state.board[y][x]);
        while (col.length < ROWS) col.unshift(randColor());
        for (let y = 0; y < ROWS; y++) state.board[y][x] = col[y];
      }
    }
    return total;
  }

  function swap(a, b) {
    const t = state.board[a.y][a.x];
    state.board[a.y][a.x] = state.board[b.y][b.x];
    state.board[b.y][b.x] = t;
  }
  function adjacent(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1; }

  function trySwap(a, b) {
    if (state.busy || state.over) return;
    if (!adjacent(a, b)) { state.selected = b; return; }
    swap(a, b);
    const gained = resolve();
    if (!gained) {
      swap(a, b);
      if (window.AudioFX) AudioFX.tick();
    } else {
      state.score += gained;
      state.moves -= 1;
      if (window.AudioFX) AudioFX.match();
      if (state.moves <= 0) {
        state.over = true;
        if (window.AudioFX) AudioFX.win();
      }
    }
    state.selected = null;
  }

  function cellFromEvent(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * (W / r.width) - OX;
    const y = (e.clientY - r.top) * (H / r.height) - OY;
    const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
    if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) return null;
    return { x: cx, y: cy };
  }

  function drawGem(x, y, color, selected) {
    const px = OX + x * CELL, py = OY + y * CELL, m = 5;
    ctx.fillStyle = COLORS[color];
    ctx.beginPath();
    const cx = px + CELL / 2, cy = py + CELL / 2, r = CELL / 2 - m;
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r * 0.72, cy - r * 0.2);
    ctx.lineTo(cx + r * 0.45, cy + r * 0.75);
    ctx.lineTo(cx - r * 0.45, cy + r * 0.75);
    ctx.lineTo(cx - r * 0.72, cy - r * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.28)";
    ctx.beginPath();
    ctx.moveTo(cx, cy - r + 4);
    ctx.lineTo(cx + r * 0.3, cy - r * 0.1);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fill();
    if (selected) {
      ctx.strokeStyle = "#eef2ff";
      ctx.lineWidth = 3;
      ctx.strokeRect(px + 3, py + 3, CELL - 6, CELL - 6);
    }
  }

  function draw() {
    const s = state;
    ctx.fillStyle = "#070815";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#12182c";
    ctx.fillRect(OX - 8, OY - 8, BOARD + 16, BOARD + 16);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? "#161c32" : "#12182a";
      ctx.fillRect(OX + x * CELL, OY + y * CELL, CELL, CELL);
      if (s.board[y][x] !== null) {
        const sel = s.selected && s.selected.x === x && s.selected.y === y;
        drawGem(x, y, s.board[y][x], sel);
      }
    }
    s.pops = s.pops.filter(function (p) {
      p.t--;
      ctx.globalAlpha = Math.max(0, p.t / 12);
      ctx.fillStyle = "#eef2ff";
      ctx.beginPath();
      ctx.arc(OX + (p.x + 0.5) * CELL, OY + (p.y + 0.5) * CELL, (12 - p.t) * 2, 0, Math.PI * 2);
      ctx.strokeStyle = "#eef2ff";
      ctx.stroke();
      ctx.globalAlpha = 1;
      return p.t > 0;
    });
    if (s.over) {
      ctx.fillStyle = "rgba(7,11,20,.65)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#eef2ff";
      ctx.textAlign = "center";
      ctx.font = "bold 42px Inter, system-ui, sans-serif";
      ctx.fillText("Board's out of moves", W / 2, H / 2 - 8);
      ctx.font = "20px Inter, system-ui, sans-serif";
      ctx.fillStyle = "#a9b4d0";
      ctx.fillText("Score " + s.score + "  ·  Enter to deal again", W / 2, H / 2 + 36);
      ctx.textAlign = "left";
    }
  }

  function loop() {
    state.time++;
    draw();
    hud.textContent = "Score " + state.score + "  ·  Moves " + state.moves;
    if (window.tickKit) tickKit();
    requestAnimationFrame(loop);
  }

  canvas.addEventListener("pointerdown", function (e) {
    const c = cellFromEvent(e);
    if (!c || state.over) return;
    if (!state.selected) state.selected = c;
    else if (state.selected.x === c.x && state.selected.y === c.y) state.selected = null;
    else trySwap(state.selected, c);
  });
  window.addEventListener("keydown", function (e) {
    if (e.code === "Enter" && state && state.over) reset();
  });

  bootKit("prism-match", function () { reset(); loop(); });
})();
