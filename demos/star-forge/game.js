/* Star Forge — original idle clicker. Save key is local-only; no accounts. */
(function () {
  const SAVE = "cloudy-star-forge-v1";
  const PRESTIGE_AT = 1000000;
  const GEN = [
    { id: "spark", name: "Spark Collector", baseCost: 15, rate: 0.1 },
    { id: "wrencher", name: "Dust Wrencher", baseCost: 100, rate: 1 },
    { id: "loom", name: "Nebula Loom", baseCost: 800, rate: 8 },
    { id: "pulsar", name: "Pulsar Farm", baseCost: 6000, rate: 47 },
    { id: "quasar", name: "Quasar Engine", baseCost: 50000, rate: 260 }
  ];
  const hud = document.getElementById("hud");
  const rateEl = document.getElementById("rate");
  const gensEl = document.getElementById("gens");
  const star = document.getElementById("star");
  const pops = document.getElementById("pops");
  const collapseBtn = document.getElementById("collapse");
  const hint = document.getElementById("prestige-hint");
  let state, last;

  function defaultState() {
    const counts = {};
    GEN.forEach(function (g) { counts[g.id] = 0; });
    return { dust: 0, click: 1, counts: counts, prestige: 0, total: 0 };
  }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE);
      if (!raw) return defaultState();
      const s = JSON.parse(raw);
      if (typeof s.dust !== "number") return defaultState();
      GEN.forEach(function (g) { if (typeof s.counts[g.id] !== "number") s.counts[g.id] = 0; });
      return s;
    } catch (e) { return defaultState(); }
  }
  function save() {
    try { localStorage.setItem(SAVE, JSON.stringify(state)); } catch (e) {}
  }
  function cost(g) { return Math.floor(g.baseCost * Math.pow(1.15, state.counts[g.id])); }
  function rate() {
    const mul = 1 + state.prestige * 0.1;
    let r = 0;
    GEN.forEach(function (g) { r += g.rate * state.counts[g.id]; });
    return r * mul;
  }
  function fmt(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
    if (n >= 1e4) return (n / 1e3).toFixed(1) + "k";
    if (n >= 100) return n.toFixed(0);
    return n.toFixed(n >= 10 ? 1 : 2);
  }
  function addDust(n, ev) {
    state.dust += n;
    state.total += n;
    if (ev) pop(n, ev);
  }
  function pop(n, ev) {
    const el = document.createElement("div");
    el.className = "pop";
    el.textContent = "+" + fmt(n);
    const r = star.getBoundingClientRect();
    const root = document.getElementById("forge").getBoundingClientRect();
    el.style.left = ((ev.clientX || (r.left + r.width / 2)) - root.left) + "px";
    el.style.top = ((ev.clientY || r.top) - root.top) + "px";
    pops.appendChild(el);
    setTimeout(function () { el.remove(); }, 700);
  }
  function buy(id) {
    const g = GEN.filter(function (x) { return x.id === id; })[0];
    const c = cost(g);
    if (state.dust < c) return;
    state.dust -= c;
    state.counts[id]++;
    if (window.AudioFX) AudioFX.coin();
    render();
    save();
  }
  function collapse() {
    if (state.dust < PRESTIGE_AT) return;
    state.prestige += 1;
    const p = state.prestige;
    state = defaultState();
    state.prestige = p;
    state.click = 1 + p;
    if (window.AudioFX) AudioFX.win();
    render();
    save();
  }
  function render() {
    hud.textContent = fmt(state.dust) + " stardust  ·  ×" + (1 + state.prestige * 0.1).toFixed(1) + " prestige";
    rateEl.textContent = fmt(rate()) + " / sec  ·  click +" + fmt(state.click * (1 + state.prestige * 0.1));
    gensEl.innerHTML = GEN.map(function (g) {
      const c = cost(g);
      const n = state.counts[g.id];
      const can = state.dust >= c;
      return '<div class="gen"><div><strong>' + g.name + "</strong> ×" + n +
        '<div class="muted">' + fmt(g.rate * (1 + state.prestige * 0.1)) + "/s each</div></div>" +
        '<button type="button" data-buy="' + g.id + '"' + (can ? "" : " disabled") + ">Buy " + fmt(c) + "</button></div>";
    }).join("");
    const ready = state.dust >= PRESTIGE_AT;
    collapseBtn.disabled = !ready;
    collapseBtn.textContent = ready ? "Collapse for +" + ((state.prestige + 1) * 10) + "% forever" : "Collapse (need " + fmt(PRESTIGE_AT) + ")";
    hint.textContent = "Prestige level " + state.prestige + ". Collapse resets generators and keeps a +10% production bonus per collapse.";
  }

  function loop(now) {
    if (last) {
      const dt = Math.min(1, (now - last) / 1000);
      addDust(rate() * dt);
    }
    last = now;
    render();
    if (window.tickKit) tickKit();
    requestAnimationFrame(loop);
    if (state.time++ % 60 === 0) save();
  }

  gensEl.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-buy]");
    if (btn) buy(btn.getAttribute("data-buy"));
  });
  star.addEventListener("click", function (e) {
    if (window.AudioFX) AudioFX.click();
    addDust(state.click * (1 + state.prestige * 0.1), e);
    render();
  });
  collapseBtn.addEventListener("click", collapse);
  window.addEventListener("keydown", function (e) {
    if (e.code === "Space") { e.preventDefault(); star.click(); }
  });

  bootKit("star-forge", function () {
    state = load();
    state.time = 0;
    last = 0;
    render();
    requestAnimationFrame(loop);
    setInterval(save, 5000);
  });
})();
