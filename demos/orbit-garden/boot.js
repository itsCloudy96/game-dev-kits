/* Shared boot: overlay start, autostart, error hook for headless tests. */
(function (root) {
  function bootKit(id, startFn) {
    const kit = root.__CLOUDY_KIT__ = { id: id, frames: 0, ready: false, started: false, errors: [] };
    root.addEventListener("error", function (ev) { kit.errors.push(String(ev.message || ev.error || ev)); });
    root.addEventListener("unhandledrejection", function (ev) { kit.errors.push(String(ev.reason)); });
    const overlay = document.getElementById("overlay");
    const startBtn = document.getElementById("start");
    function start() {
      if (kit.started) return;
      kit.started = true;
      if (root.AudioFX) AudioFX.unlock();
      if (overlay) overlay.classList.add("hidden");
      try { startFn(); kit.ready = true; }
      catch (err) { kit.errors.push(String(err && err.stack || err)); console.error(err); }
    }
    if (startBtn) startBtn.addEventListener("click", start);
    document.addEventListener("keydown", function (e) {
      if (!kit.started && (e.code === "Space" || e.code === "Enter")) { e.preventDefault(); start(); }
    });
    document.addEventListener("pointerdown", function (e) {
      if (!kit.started && e.target && e.target.id === "start") return;
    });
    const q = new URLSearchParams(location.search);
    if (q.has("autostart") || q.get("autostart") === "1") start();
    return kit;
  }
  function tickKit() {
    if (root.__CLOUDY_KIT__) root.__CLOUDY_KIT__.frames += 1;
  }
  root.bootKit = bootKit;
  root.tickKit = tickKit;
})(window);
