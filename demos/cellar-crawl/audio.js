/* Tiny Web Audio helper — original Cloudy beeps, no sample files. */
(function (root) {
  const AudioFX = {
    ctx: null,
    muted: false,
    unlock() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    tone(freq, dur, type, vol, slide) {
      if (this.muted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || "square";
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.08, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(t); o.stop(t + dur + 0.02);
    },
    jump() { this.tone(520, 0.12, "square", 0.07, 280); },
    coin() { this.tone(880, 0.08, "square", 0.06); this.tone(1320, 0.12, "square", 0.05); },
    hit() { this.tone(160, 0.18, "sawtooth", 0.08, 70); },
    shoot() { this.tone(420, 0.06, "square", 0.05, 180); },
    win() { this.tone(523, 0.1, "triangle", 0.07); setTimeout(() => this.tone(659, 0.1, "triangle", 0.07), 90); setTimeout(() => this.tone(784, 0.2, "triangle", 0.08), 180); },
    lose() { this.tone(300, 0.25, "sawtooth", 0.07, 90); },
    tick() { this.tone(700, 0.04, "square", 0.03); },
    match() { this.tone(640, 0.07, "triangle", 0.06, 900); },
    click() { this.tone(240, 0.05, "square", 0.04); }
  };
  root.AudioFX = AudioFX;
})(window);
