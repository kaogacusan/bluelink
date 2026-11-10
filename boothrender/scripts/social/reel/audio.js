/*
  blueLink reel: music + sound effects, synthesized with an OfflineAudioContext.
  Everything is seeded, so every render sounds the same.

  window.renderAudio({ mode: "music" | "sfx", duration, cues }) -> base64 of interleaved float32 stereo, 48 kHz

  Music: melodic deep techno, 124 BPM (beat 0.484 s, bar 1.935 s), F# minor, i - VI - III - VII (F#m D A E).
  Space, not sparkle: wide saw pads, a rolling 16th bassline, a pulsing analog sequencer through a ping-pong delay
  (the old "Berlin school" space sound), solar-wind noise, a slow saw lead in the breakdown and at the end, a breathy
  choir. No bells, chimes, or plucky arps anywhere.
   bars 0-3 the sky (no drums)   bar 4 drop (the logo)   bars 5-7 groove + hook stabs, 2-beat break at B30
   bars 8-12 groove with the sequencer (the app)   bar 13 breakdown   bar 14 build   bars 15-16 drop (the price)
   bars 17-18 the end: one last hit, then the pad and the lead ring out over the horizon
  SFX: a sonar-like pulse, soft UI clicks, line hiss, camera air, a docking clamp for the logo, an observatory shutter
  on the hard cuts, a low message "bloop", and a warm swell as the star rises.
*/
(function () {
  const SR = 48000;
  const BPM = 124, BEAT = 60 / BPM, BAR = 4 * BEAT, S16 = BEAT / 4;
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function mulberry(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  async function renderAudio({ mode, duration, cues }) {
    const ctx = new OfflineAudioContext(2, Math.ceil(SR * duration), SR);
    const rnd = mulberry(mode === "music" ? 124 : 66);

    /* ---------- shared buffers ---------- */
    const nb = ctx.createBuffer(2, SR * 2, SR);
    for (let c = 0; c < 2; c++) { const d = nb.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = rnd() * 2 - 1; }
    // a long, dark hall: the sky has a lot of air in it
    const ir = ctx.createBuffer(2, Math.floor(SR * 4.2), SR);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c); let lp = 0;
      for (let i = 0; i < d.length; i++) {
        const t = i / SR, n = rnd() * 2 - 1;
        lp += (n - lp) * Math.max(0.035, 0.7 * Math.exp(-t * 1.5));
        d[i] = lp * Math.exp(-t * 1.25) * Math.min(1, t / 0.03);
      }
    }

    /* ---------- busses ---------- */
    const master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 2.5; comp.attack.value = 0.008; comp.release.value = 0.22;
    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -4; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.09;
    const trim = ctx.createGain();
    master.gain.value = mode === "music" ? 0.34 : 0.9;
    master.connect(comp).connect(lim).connect(trim).connect(ctx.destination);
    trim.gain.setValueAtTime(1, 0);
    trim.gain.setValueAtTime(1, Math.max(0, duration - 1.8));
    trim.gain.linearRampToValueAtTime(0, duration - 0.04);

    const verb = ctx.createConvolver(); verb.normalize = true; verb.buffer = ir;
    const verbIn = ctx.createBiquadFilter(); verbIn.type = "highpass"; verbIn.frequency.value = 240;
    const verbOut = ctx.createGain(); verbOut.gain.value = 0.62;
    verbIn.connect(verb).connect(verbOut).connect(master);

    // ping-pong delay, dotted eighth
    const dIn = ctx.createGain();
    const dL = ctx.createDelay(2), dR = ctx.createDelay(2); dL.delayTime.value = dR.delayTime.value = BEAT * 0.75;
    const dLp = ctx.createBiquadFilter(); dLp.type = "lowpass"; dLp.frequency.value = 2600;
    const fbL = ctx.createGain(), fbR = ctx.createGain(); fbL.gain.value = fbR.gain.value = 0.45;
    const pL = ctx.createStereoPanner(), pR = ctx.createStereoPanner(); pL.pan.value = -0.85; pR.pan.value = 0.85;
    const dOut = ctx.createGain(); dOut.gain.value = 0.5;
    dIn.connect(dLp).connect(dL); dL.connect(pL).connect(dOut); dL.connect(fbL).connect(dR); dR.connect(pR).connect(dOut); dR.connect(fbR).connect(dL);
    dOut.connect(master);

    function out(gain = 1, pan = 0, rv = 0, dl = 0, dest = master) {
      const g = ctx.createGain(); g.gain.value = gain;
      let n = g;
      if (pan) { const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); n = p; }
      n.connect(dest);
      if (rv) { const s = ctx.createGain(); s.gain.value = rv; n.connect(s); s.connect(verbIn); }
      if (dl) { const s = ctx.createGain(); s.gain.value = dl; n.connect(s); s.connect(dIn); }
      return g;
    }
    function noise(t, d) { const s = ctx.createBufferSource(); s.buffer = nb; s.loop = true; s.start(Math.max(0, t), rnd() * 1.8); s.stop(Math.max(0, t) + d + 0.03); return s; }
    function osc(type, f, t, d) { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, Math.max(0, t)); o.start(Math.max(0, t)); o.stop(Math.max(0, t) + d + 0.03); return o; }
    function filt(type, f, q = 0.7) { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; }
    function amp(t, a, peak, dec) { const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setTargetAtTime(0, t + a, dec / 4); return g; }
    function sat(drive = 2) {
      const ws = ctx.createWaveShaper(); const n = 1024, c = new Float32Array(n);
      for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.tanh(x * drive) / Math.tanh(drive); }
      ws.curve = c; return ws;
    }
    // solar wind: two noise bands drifting slowly, wide in stereo
    function wind(t0, t1, v, f0 = 380, f1 = 1500) {
      [-0.7, 0.7].forEach((pan, k) => {
        const o = out(v, pan, 0.4, 0, master);
        const bp = filt("bandpass", f0, 2.4), d = t1 - t0, steps = Math.max(2, Math.ceil(d / 0.5));
        for (let i = 0; i <= steps; i++) { const t = t0 + (d * i) / steps; bp.frequency.linearRampToValueAtTime(f0 + (f1 - f0) * (0.5 + 0.5 * Math.sin(t * (0.55 + k * 0.23) + k * 2)), t); }
        const g = ctx.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(1, t0 + Math.min(1.5, d * 0.3)); g.gain.setValueAtTime(1, t1 - Math.min(1.5, d * 0.3)); g.gain.linearRampToValueAtTime(0, t1);
        noise(t0, d).connect(bp).connect(g).connect(o);
      });
    }

    if (mode === "music") buildMusic(); else buildSfx();

    /* ================= MUSIC ================= */
    function buildMusic() {
      const drums = ctx.createGain(); drums.gain.value = 0.95; drums.connect(master);
      const duck = ctx.createGain(); duck.gain.value = 1; duck.connect(master);
      const kicks = [];
      const bt = (n) => n * BEAT;

      const kickSat = sat(1.8), kickBus = ctx.createGain(); kickBus.gain.value = 0.95; kickSat.connect(kickBus).connect(drums);
      function kick(t, v = 1) {
        kicks.push(t);
        const o = osc("sine", 150, t, 0.55); o.frequency.exponentialRampToValueAtTime(52, t + 0.07); o.frequency.exponentialRampToValueAtTime(41, t + 0.4);
        const g = amp(t, 0.002, v, 0.5); o.connect(g).connect(kickSat);
        const n = noise(t, 0.012), h = filt("highpass", 3200), g2 = amp(t, 0.0008, 0.14 * v, 0.008); n.connect(h).connect(g2).connect(drums);
      }
      // a dry snap with a long tail, not a clap
      function snap(t, v = 1) {
        const o = out(0.5 * v, -0.08, 0.5, 0, drums);
        const bp = filt("bandpass", 1900, 1.4);
        [0, 0.007].forEach((d) => { const n = noise(t + d, 0.03), g = amp(t + d, 0.0008, 1, 0.022); n.connect(g).connect(bp); });
        bp.connect(o);
        const s = osc("triangle", 320, t, 0.06); s.frequency.exponentialRampToValueAtTime(190, t + 0.04);
        const g = amp(t, 0.001, 0.35, 0.03); s.connect(g).connect(o);
      }
      function hat(t, v = 0.3, open = false, pan = 0.18) {
        const o = out(v, pan, open ? 0.12 : 0.02, 0, drums);
        const hp = filt("highpass", open ? 7400 : 9000), n = noise(t, open ? 0.32 : 0.05), g = amp(t, 0.0008, 1, open ? 0.22 : 0.03);
        n.connect(hp).connect(g).connect(o);
      }
      function shaker(t, v = 0.08, pan = -0.3) {
        const o = out(v, pan, 0, 0, drums);
        const bp = filt("bandpass", 6200, 0.9), n = noise(t, 0.04), g = ctx.createGain();
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + 0.012); g.gain.setTargetAtTime(0, t + 0.014, 0.008);
        n.connect(bp).connect(g).connect(o);
      }
      function tom(t, m, v) {
        const o = out(v, 0, 0.3, 0, drums);
        const s = osc("sine", mtof(m) * 1.6, t, 0.4); s.frequency.exponentialRampToValueAtTime(mtof(m), t + 0.08);
        const g = amp(t, 0.002, 1, 0.3); s.connect(g).connect(o);
      }
      function crash(t, v = 0.4) {
        const o = out(v, 0, 0.4, 0, drums);
        const hp = filt("highpass", 5600), n = noise(t, 2.6), g = amp(t, 0.002, 1, 2.0); n.connect(hp).connect(g).connect(o);
      }
      function impact(t, v) {
        const o = out(v, 0, 0.55, 0, master);
        const s = osc("sine", 82, t, 2.4); s.frequency.exponentialRampToValueAtTime(29, t + 1.4);
        const g = amp(t, 0.004, 1, 1.9); s.connect(sat(1.4)).connect(g).connect(o);
        const n = noise(t, 1), lp = filt("lowpass", 520), g2 = amp(t, 0.003, 0.7, 0.6); n.connect(lp).connect(g2).connect(o);
      }
      // rolling bass: three 16ths after every kick
      function bass(t, m, d, v = 1) {
        const o = out(0.5 * v, 0, 0, 0, duck);
        const lp = filt("lowpass", 900, 5); lp.frequency.setValueAtTime(1100, t); lp.frequency.setTargetAtTime(240, t, 0.035);
        const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + 0.004); g.gain.setTargetAtTime(0.5, t + 0.01, 0.05); g.gain.setTargetAtTime(0, t + d, 0.02);
        const a = osc("sawtooth", mtof(m), t, d + 0.15), b = osc("sawtooth", mtof(m) * 1.006, t, d + 0.15), sub = osc("sine", mtof(m), t, d + 0.15);
        const sg = ctx.createGain(); sg.gain.value = 0.9;
        a.connect(lp); b.connect(lp); lp.connect(g); sub.connect(sg).connect(g); g.connect(o);
      }
      function subNote(t, m, d, v) { // long held sub for the breakdown and the end
        const o = out(v, 0, 0, 0, master);
        const s = osc("sine", mtof(m), t, d + 1.2), g = ctx.createGain();
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + 0.25); g.gain.setValueAtTime(1, t + d); g.gain.setTargetAtTime(0, t + d, 0.3);
        s.connect(g).connect(o);
      }
      function pad(t, notes, d, v, c0, c1, { att = 0.5, rel = 1.1, dest = duck, rv = 0.5 } = {}) {
        const lp = filt("lowpass", c0, 0.5); lp.frequency.setValueAtTime(c0, t); lp.frequency.linearRampToValueAtTime(c1, t + d);
        const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + att); g.gain.setValueAtTime(v, t + d); g.gain.setTargetAtTime(0, t + d, rel / 3);
        lp.connect(g); g.connect(out(1, 0, rv, 0, dest));
        notes.forEach((m) => [-11, -4, 4, 11].forEach((cents, k) => {
          const o = osc("sawtooth", mtof(m) * Math.pow(2, cents / 1200), t, d + rel * 2.5);
          const p = ctx.createStereoPanner(); p.pan.value = [-0.8, -0.3, 0.3, 0.8][k]; const gg = ctx.createGain(); gg.gain.value = 0.02;
          o.connect(gg).connect(p).connect(lp);
        }));
      }
      // breathy "ah": saws through two vowel formants
      function choir(t, notes, d, v) {
        const sum = ctx.createGain(); sum.gain.value = 1;
        const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.8); g.gain.setValueAtTime(v, t + d); g.gain.setTargetAtTime(0, t + d, 0.4);
        const f1 = filt("bandpass", 760, 5), f2 = filt("bandpass", 1150, 6), f3 = filt("bandpass", 2600, 8); const g3 = ctx.createGain(); g3.gain.value = 0.4;
        sum.connect(f1).connect(g); sum.connect(f2).connect(g); sum.connect(f3).connect(g3).connect(g);
        g.connect(out(1, 0, 0.75, 0.12, master));
        const vib = osc("sine", 4.6, t, d + 2), vg = ctx.createGain(); vg.gain.value = 5;
        notes.forEach((m, i) => [-6, 6].forEach((c) => {
          const o = osc("sawtooth", mtof(m) * Math.pow(2, c / 1200), t, d + 2); vib.connect(vg).connect(o.detune);
          const p = ctx.createStereoPanner(); p.pan.value = ((i % 2) * 2 - 1) * 0.5; const gg = ctx.createGain(); gg.gain.value = 0.05;
          o.connect(gg).connect(p).connect(sum);
        }));
      }
      // the sequencer: a low saw through a resonant filter that snaps shut on every note, into the ping-pong delay
      function seq(t, m, v, cut, pan) {
        const o = out(v, pan, 0.15, 0.4, duck);
        const lp = filt("lowpass", cut * 3, 7.5); lp.frequency.setValueAtTime(cut * 3.2, t); lp.frequency.setTargetAtTime(cut, t, 0.035);
        const g = amp(t, 0.003, 1, 0.2);
        const a = osc("sawtooth", mtof(m), t, 0.3), b = osc("square", mtof(m - 12) * 1.002, t, 0.3), bg = ctx.createGain(); bg.gain.value = 0.35;
        a.connect(lp); b.connect(bg).connect(lp); lp.connect(g).connect(o);
      }
      // a slow analog lead: two detuned saws, a little glide, vibrato that comes in late
      function lead(t, m, d, v, from = null) {
        const o = out(v, 0, 0.6, 0.45, master);
        const lp = filt("lowpass", 1700, 1.1);
        const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + 0.09); g.gain.setValueAtTime(1, t + d); g.gain.setTargetAtTime(0, t + d, 0.12);
        const vib = osc("sine", 5.2, t, d + 0.6), vg = ctx.createGain(); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(0, t + 0.25); vg.gain.linearRampToValueAtTime(14, t + 0.7);
        [-7, 7].forEach((c) => {
          const s = osc("sawtooth", mtof(from ?? m), t, d + 0.6);
          if (from != null) s.frequency.exponentialRampToValueAtTime(mtof(m), t + 0.09);
          s.detune.value = c; vib.connect(vg).connect(s.detune);
          const sg = ctx.createGain(); sg.gain.value = 0.5; s.connect(sg).connect(lp);
        });
        const tri = osc("triangle", mtof(m - 12), t, d + 0.6), tg = ctx.createGain(); tg.gain.value = 0.35; tri.connect(tg).connect(lp);
        lp.connect(g).connect(o);
      }
      function stab(t, notes, v) {
        const o = out(v, 0, 0.55, 0.3, duck);
        const lp = filt("lowpass", 3800, 1.2); lp.frequency.setValueAtTime(3800, t); lp.frequency.setTargetAtTime(500, t, 0.07);
        const g = amp(t, 0.003, 1, 0.45); lp.connect(g).connect(o);
        notes.forEach((m) => [-8, 8].forEach((c) => { const s = osc("sawtooth", mtof(m + 12) * Math.pow(2, c / 1200), t, 0.6), gg = ctx.createGain(); gg.gain.value = 0.06; s.connect(gg).connect(lp); }));
      }
      function riser(t0, t1, v) {
        const o = out(v, 0, 0.4, 0, master);
        const bp = filt("bandpass", 300, 1.4); bp.frequency.setValueAtTime(300, t0); bp.frequency.exponentialRampToValueAtTime(7000, t1);
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(1, t1); g.gain.setValueAtTime(0, t1 + 0.01);
        noise(t0, t1 - t0 + 0.05).connect(bp).connect(g).connect(o);
        const s = osc("sawtooth", mtof(42), t0, t1 - t0); s.frequency.exponentialRampToValueAtTime(mtof(78), t1);
        const lp = filt("lowpass", 2000), sg = ctx.createGain(); sg.gain.setValueAtTime(0.0001, t0); sg.gain.exponentialRampToValueAtTime(0.14, t1); sg.gain.setValueAtTime(0, t1 + 0.01);
        s.connect(lp).connect(sg).connect(o);
      }
      function revSwell(t0, t1, v) { // reversed-reverb swell into a hit
        const o = out(v, 0, 0.3, 0, master);
        const lp = filt("lowpass", 400, 0.7); lp.frequency.setValueAtTime(400, t0); lp.frequency.exponentialRampToValueAtTime(9000, t1);
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(1, t1); g.gain.setValueAtTime(0, t1 + 0.005);
        noise(t0, t1 - t0 + 0.05).connect(lp).connect(g).connect(o);
      }

      // F#m - D - A - E
      const CH = [
        { p: [54, 61, 64, 69], b: 42, arp: [54, 57, 61, 64, 66, 69] },
        { p: [50, 57, 61, 66], b: 38, arp: [50, 54, 57, 61, 62, 66] },
        { p: [57, 61, 64, 68], b: 45, arp: [52, 56, 57, 61, 64, 68] },
        { p: [52, 59, 64, 66], b: 40, arp: [52, 54, 59, 61, 64, 66] },
      ];
      const FIN = { p: [54, 61, 64, 68, 73], b: 42, arp: [54, 56, 57, 61, 64, 68] }; // F#m add9 for the end
      // which chord each bar plays. The breakdown goes D -> E, so the price drop lands on F#m.
      const MAP = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 3, 0, 1];
      const chord = (bar) => (bar >= 17 ? FIN : CH[MAP[bar]]);
      const sec = (bar) => (bar <= 3 ? "intro" : bar <= 7 ? "grooveA" : bar <= 12 ? "grooveB" : bar === 13 ? "break" : bar === 14 ? "build" : bar <= 16 ? "drop" : "end");
      const ARP = [0, 2, 1, 3, 2, 4, 3, 5, 4, 2, 3, 1, 2, 0, 1, 3];

      for (let bar = 0; bar < 18; bar++) {
        const t0 = bar * BAR, s = sec(bar), c = chord(bar);
        // pads
        if (s === "intro") pad(t0, c.p, BAR, 2.1, 500 + bar * 450, 900 + bar * 550, { att: bar ? 0.4 : 0.06, rv: 0.6 });
        else if (s === "grooveA") pad(t0, c.p, BAR, 0.75, 1500, 1900);
        else if (s === "grooveB") pad(t0, c.p, BAR, 0.7, 2100, 2400);
        else if (s === "break") { pad(t0, c.p, BAR, 1.9, 900, 1600, { dest: master, rv: 0.7 }); choir(t0, c.p.slice(1).map((m) => m + 12), BAR, 0.45); subNote(t0, c.b - 12, BAR - 0.05, 0.42); }
        else if (s === "build") { pad(t0, c.p, BAR, 1.5, 1200, 4200, { dest: master }); choir(t0, c.p.slice(1).map((m) => m + 12), BAR - 0.3, 0.38); }
        else if (s === "drop") pad(t0, c.p, BAR, 0.75, 2300, 2600);
        else if (bar === 17) { pad(t0, c.p, BAR * 2.4, 1.5, 2600, 900, { dest: master, rel: 3.5, rv: 0.7 }); choir(t0 + BAR * 0.5, [73, 76, 80], BAR * 1.6, 0.3); subNote(t0, 30, BAR * 1.2, 0.5); }

        for (let step = 0; step < 16; step++) {
          const t = t0 + step * S16, beatStep = step % 4, B = bar * 4 + step / 4;
          const grooving = s === "grooveA" || s === "grooveB" || s === "drop";
          const breakA = s === "grooveA" && B >= 30 && B < 32; // the 2-beat gap under "asking for help is normal"
          // ----- drums
          if (grooving && !breakA) {
            if (beatStep === 0) kick(t, step === 0 ? 1 : 0.93);
            if (step === 4 || step === 12) snap(t, 0.8);
            if (beatStep === 2) hat(t, s === "drop" || (s === "grooveB" && bar >= 10) ? 0.3 : 0.24, s === "drop" || (s === "grooveB" && bar >= 10), 0.22);
            if (s !== "grooveA" && beatStep !== 2) shaker(t + (step % 2 ? 0.008 : 0), step % 2 ? 0.06 : 0.09);
            if (s === "grooveA" && beatStep === 3) hat(t, 0.08, false, -0.25);
          }
          if (s === "intro" && bar >= 2 && beatStep === 2) shaker(t, 0.03 + (bar - 2) * 0.03, 0.3);
          if (s === "build") {
            const roll = B < 58 ? step % 2 === 0 : true;
            if (roll && B < 59.5) snap(t, 0.12 + (B - 56) * 0.12);
            if (B >= 58 && B < 59.5 && step % 4 === 0) tom(t, [45, 47, 49, 52][Math.floor((B - 58) * 2) % 4], 0.35);
          }
          // ----- bass
          if (grooving && !breakA && beatStep !== 0) {
            const up = beatStep === 3 && step % 8 === 7 ? 12 : 0;
            bass(t, c.b + up, S16 * 0.8, beatStep === 2 ? 1 : 0.8);
          }
          // ----- the sequencer: creeps in under the groove, opens up through the app, full on the price drop
          const seqOn = (s === "grooveA" && bar >= 5 && !breakA) || s === "grooveB" || s === "drop" || (s === "build" && B < 59.5);
          if (seqOn) {
            const cut = s === "grooveA" ? 260 + (bar - 5) * 60 : s === "grooveB" ? 420 + (bar - 8) * 110 + 140 * Math.sin(B * 0.4) : s === "build" ? 500 + (B - 56) * 220 : 1050;
            const v = s === "grooveA" ? 0.11 : s === "build" ? 0.12 : 0.15;
            seq(t, c.arp[ARP[step]], v, cut, step % 2 ? 0.25 : -0.25);
          }
        }
        // section one-shots
        if (bar === 4 || bar === 15) { crash(t0, 0.45); impact(t0, 0.75); }
        if (bar === 8) crash(t0, 0.25);
        if (bar === 13) impact(t0, 0.45);
      }
      // intro: solar wind and a sub drone under the pad
      wind(0, bt(16), 0.16, 300, 1300);
      subNote(0, 30, bt(15.5), 0.32);
      riser(bt(12), bt(16), 0.3); revSwell(bt(14.5), bt(16), 0.35);
      // hooks: a stab on every cut, then a swell into the app
      [24, 26, 28].forEach((b) => stab(bt(b), chord(Math.floor(b / 4)).p, 0.9));
      crash(bt(24), 0.22);
      revSwell(bt(30.5), bt(32), 0.3);
      // breakdown: the lead, D then E, rising into the drop
      [[52, 73, 1.5, null], [53.5, 76, 1, 73], [54.5, 78, 1.5, 76], [56, 76, 1.5, null], [57.5, 78, 1, 76], [58.5, 80, 1, 78]]
        .forEach(([b, m, d, from]) => lead(bt(b), m, bt(d) - 0.05, 0.16, from));
      riser(bt(56), bt(60), 0.34); revSwell(bt(58.5), bt(60), 0.3);
      stab(bt(60), CH[0].p, 0.8); stab(bt(62), CH[1].p, 0.6);
      // the end: one last hit, then the lead over the horizon and the wind
      const tEnd = bt(68);
      impact(tEnd, 0.85); crash(tEnd, 0.5); kick(tEnd, 1);
      [[69, 81, 1.4, null], [70.5, 80, 1.4, 81], [72, 76, 1.4, 80], [73.5, 73, 3, 76]].forEach(([b, m, d, from]) => lead(bt(b), m, bt(d) - 0.05, 0.12, from));
      wind(bt(68), bt(78), 0.13, 260, 1000);
      // sidechain the music bus on every kick
      kicks.sort((a, b) => a - b).forEach((t) => { duck.gain.setTargetAtTime(0.35, t, 0.004); duck.gain.setTargetAtTime(1, t + 0.04, 0.09); });
    }

    /* ================= SOUND EFFECTS ================= */
    function buildSfx() {
      const bus = ctx.createGain(); bus.gain.value = 1; bus.connect(master);
      const pulse = (t, v = 1) => { // a deep sonar-like pulse: a low thump and a breath of filtered noise in a big space
        const o = out(v * 0.6, 0, 0.6, 0.2, bus);
        const s = osc("sine", 96, t, 0.7); s.frequency.exponentialRampToValueAtTime(46, t + 0.4);
        const g = amp(t, 0.006, 1, 0.55); s.connect(g).connect(o);
        const bp = filt("bandpass", 700, 1.1), n = noise(t, 0.9), g2 = ctx.createGain();
        g2.gain.setValueAtTime(0, t); g2.gain.linearRampToValueAtTime(0.35, t + 0.05); g2.gain.setTargetAtTime(0, t + 0.06, 0.18);
        n.connect(bp).connect(g2).connect(o);
      };
      const click = (t, v = 1, pan = 0) => { // a soft UI click
        const o = out(v * 0.3, pan, 0.08, 0, bus);
        const n = noise(t, 0.012), bp = filt("bandpass", 2600, 1.5), g = amp(t, 0.0005, 1, 0.007); n.connect(bp).connect(g).connect(o);
        const s = osc("sine", 280, t, 0.03), g2 = amp(t, 0.001, 0.5, 0.02); s.connect(g2).connect(o);
      };
      const line = (t0, t1, v = 1) => { // the hiss of a line drawing across the sky
        const d = t1 - t0, o = out(v * 0.3, 0, 0.4, 0.15, bus);
        const p = ctx.createStereoPanner(); p.pan.setValueAtTime(-0.5, t0); p.pan.linearRampToValueAtTime(0.5, t1); p.connect(o);
        const bp = filt("bandpass", 2000, 1.6); bp.frequency.setValueAtTime(2000, t0); bp.frequency.exponentialRampToValueAtTime(6400, t1);
        const g = ctx.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.7, t0 + d * 0.35); g.gain.linearRampToValueAtTime(0, t1 + 0.08);
        noise(t0, d + 0.1).connect(bp).connect(g).connect(p);
      };
      const shutter = (t, v = 1) => { // observatory shutter: open, close, a low thud
        const o = out(v * 0.55, 0, 0.18, 0, bus);
        [[0, 1], [0.045, 0.7]].forEach(([d, a]) => { const n = noise(t + d, 0.03), bp = filt("bandpass", 2600, 1.6), g = amp(t + d, 0.0006, a, 0.02); n.connect(bp).connect(g).connect(o); });
        const s = osc("sine", 160, t, 0.15); s.frequency.exponentialRampToValueAtTime(70, t + 0.1); const g = amp(t, 0.002, 0.9, 0.12); s.connect(g).connect(o);
        const n = noise(t, 0.2), hp = filt("highpass", 6500), g2 = amp(t, 0.001, 0.25, 0.12); n.connect(hp).connect(g2).connect(o);
      };
      const dock = (t, v = 1) => { // two links lock together like a docking clamp: clunk, latch, a hiss of air
        const o = out(v * 0.75, 0, 0.3, 0, bus);
        const s = osc("sine", 140, t, 0.3); s.frequency.exponentialRampToValueAtTime(50, t + 0.16);
        const g = amp(t, 0.002, 1, 0.26); s.connect(sat(1.8)).connect(g).connect(o);
        [[180, 0.3, 0.16], [263, 0.2, 0.12], [391, 0.12, 0.09]].forEach(([f, gv, d]) => { const r = osc("triangle", f, t, d + 0.05), rg = amp(t, 0.001, gv, d); r.connect(rg).connect(o); });
        [[0, 0.8], [0.06, 0.45]].forEach(([d, a]) => { const n = noise(t + d, 0.02), bp = filt("bandpass", 1700, 2), cg = amp(t + d, 0.0004, a, 0.012); n.connect(bp).connect(cg).connect(o); });
        const hp = filt("highpass", 3200), hn = noise(t + 0.08, 0.7), hg = ctx.createGain();
        hg.gain.setValueAtTime(0, t + 0.08); hg.gain.linearRampToValueAtTime(0.22, t + 0.12); hg.gain.setTargetAtTime(0, t + 0.14, 0.14);
        hn.connect(hp).connect(hg).connect(o);
      };
      const swell = (t0, t1, v = 1) => {
        const o = out(v * 0.5, 0, 0.3, 0, bus);
        const lp = filt("lowpass", 500, 0.7); lp.frequency.setValueAtTime(500, t0); lp.frequency.exponentialRampToValueAtTime(8000, t1);
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(1, t1); g.gain.setValueAtTime(0, t1 + 0.005);
        noise(t0, t1 - t0 + 0.05).connect(lp).connect(g).connect(o);
      };
      const boom = (t, v = 1) => {
        const o = out(v * 0.75, 0, 0.45, 0, bus);
        const s = osc("sine", 76, t, 2); s.frequency.exponentialRampToValueAtTime(30, t + 1.1);
        const g = amp(t, 0.004, 1, 1.5); s.connect(sat(1.5)).connect(g).connect(o);
        const n = noise(t, 0.5), lp = filt("lowpass", 380), g2 = amp(t, 0.002, 0.5, 0.35); n.connect(lp).connect(g2).connect(o);
      };
      const air = (t0, t1, v = 1, f0 = 220, f1 = 2600, p0 = -0.4, p1 = 0.4) => { // a dark, wide camera move
        const d = t1 - t0, o = ctx.createGain(); o.gain.value = v * 0.55;
        const p = ctx.createStereoPanner(); p.pan.setValueAtTime(p0, t0); p.pan.linearRampToValueAtTime(p1, t1);
        o.connect(p).connect(bus); const sd = ctx.createGain(); sd.gain.value = 0.35; p.connect(sd).connect(verbIn);
        const bp = filt("bandpass", f0, 0.8); bp.frequency.setValueAtTime(f0, t0); bp.frequency.exponentialRampToValueAtTime(f1, t0 + d * 0.55); bp.frequency.exponentialRampToValueAtTime(Math.max(80, f0 * 0.8), t1);
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(1, t0 + d * 0.55); g.gain.exponentialRampToValueAtTime(0.0001, t1 + 0.1);
        noise(t0, d + 0.2).connect(bp).connect(g).connect(o);
      };
      const streak = (t0, t1, v = 1) => { // the rush: everything stretches into lines
        const d = t1 - t0, o = out(v * 0.45, 0, 0.3, 0, bus);
        const hp = filt("bandpass", 600, 0.9); hp.frequency.setValueAtTime(600, t0); hp.frequency.exponentialRampToValueAtTime(9000, t1);
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(1, t1 - 0.02); g.gain.setValueAtTime(0, t1);
        noise(t0, d).connect(hp).connect(g).connect(o);
        const s = osc("sawtooth", 110, t0, d), lp = filt("lowpass", 1600), sg = ctx.createGain();
        s.frequency.exponentialRampToValueAtTime(880, t1); sg.gain.setValueAtTime(0.0001, t0); sg.gain.exponentialRampToValueAtTime(0.12, t1 - 0.02); sg.gain.setValueAtTime(0, t1);
        s.connect(lp).connect(sg).connect(o);
      };
      const msg = (t, v = 1) => { // a low, round "bloop" for a message
        const o = out(v * 0.32, 0.1, 0.25, 0.1, bus), lp = filt("lowpass", 1400, 0.8);
        const s = osc("sine", 330, t, 0.2); s.frequency.exponentialRampToValueAtTime(520, t + 0.07);
        const g = amp(t, 0.004, 1, 0.16); s.connect(lp).connect(g).connect(o);
      };
      const type = (t, v = 1) => { const o = out(v * 0.16, (rnd() - 0.5) * 0.3, 0.05, 0, bus); const n = noise(t, 0.01), bp = filt("bandpass", 3000 + rnd() * 1200, 2), g = amp(t, 0.0004, 1, 0.006); n.connect(bp).connect(g).connect(o); };
      const tap = (t, v = 1) => { const o = out(v * 0.3, 0.1, 0.05, 0, bus); const s = osc("sine", 520, t, 0.05); s.frequency.exponentialRampToValueAtTime(260, t + 0.03); const g = amp(t, 0.001, 1, 0.03); s.connect(g).connect(o); const n = noise(t, 0.01), bp = filt("bandpass", 2400, 1.5), g2 = amp(t, 0.0005, 0.4, 0.006); n.connect(bp).connect(g2).connect(o); };
      const sunrise = (t, v = 1) => { // the warm star rising: a slow, soft swell, no chimes
        const o = out(v * 0.22, 0, 0.6, 0.2, bus), lp = filt("lowpass", 500, 0.6);
        lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(1500, t + 2.4);
        const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + 1.6); g.gain.setTargetAtTime(0, t + 2.2, 0.8);
        [54, 61, 66, 69].forEach((m) => [-6, 6].forEach((c) => { const s = osc("sawtooth", mtof(m) * Math.pow(2, c / 1200), t, 5), sg = ctx.createGain(); sg.gain.value = 0.08; s.connect(sg).connect(lp); }));
        lp.connect(g).connect(o);
      };

      for (const c of cues) {
        const t = c.t, v = c.v ?? 1;
        switch (c.type) {
          case "pulse": pulse(t, v); break;
          case "click": click(t, v, c.pan || 0); break;
          case "line": line(t, c.t1, v); break;
          case "shutter": shutter(t, v); break;
          case "dock": dock(t, v); break;
          case "swell": swell(t, c.t1, v); break;
          case "boom": boom(t, v); break;
          case "air": air(t, c.t1, v, c.f0, c.f1, c.p0 ?? -0.4, c.p1 ?? 0.4); break;
          case "streak": streak(t, c.t1, v); break;
          case "msg": msg(t, v); break;
          case "type": type(t, v); break;
          case "tap": tap(t, v); break;
          case "sunrise": sunrise(t, v); break;
        }
      }
    }

    const buf = await ctx.startRendering();
    const L = buf.getChannelData(0), R = buf.getChannelData(1);
    const inter = new Float32Array(L.length * 2);
    for (let i = 0; i < L.length; i++) { inter[2 * i] = L[i]; inter[2 * i + 1] = R[i]; }
    const bytes = new Uint8Array(inter.buffer);
    let s = "";
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }
  window.renderAudio = renderAudio;
})();
