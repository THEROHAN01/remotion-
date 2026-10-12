// Deterministic replay of the site's runtime logic at a fixed 1/60 s step.
// The film's script (timeline.js) supplies the visitor's input (pointer path,
// clicks); this module runs the same state machines the site runs in frame()
// (pane waves, cell latching, switch banner, palette blends, sparks, wake,
// name intro, buddy speech/gaze/blinks, copy toast, column scrolling) and
// stores one snapshot per video frame. seek(t) then only reads a snapshot, so
// every frame is a pure function of t.

import {
  CFG, WORK, INTRO, GLYPHS, BUDDY_ROUTE_LINES, HINT_TEXT, ART_EYES,
  WAKE_MAX, WAKE_GAP, WAKE_LIFE, hash3, rand, paneWaveEdge, paneGlide, sm, clamp01
} from "./product.js";

export const FPS = 60;

export function runSim(L, TL, A) {
  const dt = 1 / FPS;
  const N = Math.round(TL.duration * FPS) + 1;
  const laptop = L.mode === "laptop";
  const cols = L.cols, rows = L.rows, cell = L.cell;
  const frames = new Array(N);

  // ---- state ----
  let bootT = TL.bootT;
  let drawerId = null, paneIntentOpen = false, detailId = null, detailIntentOpen = false;
  let drawerLayers = [];          // [{id, clipCutPx|null}]
  const drawerSwitches = [];
  const paneWaves = [];
  let paneWaveSeq = 0;
  const paneCellOpen = new Uint8Array(cols * rows);
  const paneCellEvent = new Uint32Array(cols * rows);
  let workId = null, workLocked = false, workSeed = 0, workSeedTo = 0;
  const lutEvents = [{ t: -1, palette: CFG.palette, dur: 0.01 }];
  let sparks = [], wake = [], lastTileKey = -1, introBurstsFired = 0;
  let rngN = 0;
  const R = () => rand(91, rngN++);
  // buddy
  const buddy = {
    text: "", textT: 0, textUntil: -1, hint: null, mood: null, moodUntil: 0,
    blinks: [], routeKey: "", routeSaid: new Set(), pointerX: -1, pointerY: -1, pointerT: -100,
    x: 0.85, y: 0.1, open: 1, shownAt: null
  };
  let blushOnAt = -10, blushOffAt = -10, wasBlush = false, browsOnAt = -10, browsOffAt = -10, wasBrows = false;
  let sayOnAt = -10, sayOffAt = -10, sayWasOn = false, lastSaid = "";
  let toastOnAt = -10, toastOffAt = -10;
  let hoverWork = false;
  // column
  let colScroll = 0, colScrollFrom = 0, colScrollTo = 0, colScrollT0 = -10, colScrollDur = 0.6;
  let colDetailOpen = null, colRouteDetail = null;

  const swell = 1 + CFG.swellSpeed * CFG.react * 0.35 * 0.35;  // live.total is a steady 0.35
  const env = 0.75 * 0.35 + 0.25 * 0.35;
  const glowNow = 1 - Math.min(0.6, CFG.dimQuiet * CFG.react) * (1 - env);

  const colorLeft = () => laptop ? (detailId ? L.detailR : drawerId ? L.drawerR : L.homeRight) : L.colorLeft;

  // ---- site functions (laptop) ----
  function paneBand(name) {
    return name === "detail" ? { left: L.detailL, right: L.detailR } : { left: L.drawerL, right: L.drawerR };
  }
  function markPaneBand(name, open) {
    const { left, right } = paneBand(name);
    const ev = ++paneWaveSeq;
    for (let j = 1; j < rows - 1; j++) for (let i = left; i < right; i++) {
      paneCellOpen[j * cols + i] = open ? 1 : 0; paneCellEvent[j * cols + i] = ev;
    }
  }
  function retire(name) { for (let i = paneWaves.length - 1; i >= 0; i--) if (paneWaves[i].band === name) paneWaves.splice(i, 1); }
  function paneCellsMatch(open, name) {
    const { left, right } = paneBand(name);
    const wanted = open ? 1 : 0;
    for (let j = 1; j < rows - 1; j++) for (let i = left; i < right; i++) if (paneCellOpen[j * cols + i] !== wanted) return false;
    return true;
  }
  function emitPaneWave(action, name) {
    const opening = action === "open";
    const dir = opening ? 1 : -1;
    const { left, right } = paneBand(name);
    const lead = 1.15;
    const source = opening ? left - lead : right - 1 + lead;
    const speed = (right - left + lead * 2) / CFG.revealIn;
    retire(name);
    paneWaves.push({
      id: ++paneWaveSeq, band: name, action, dir, left, right, x: source, speed,
      age: 0, strength: opening ? 1 : 0, seed: R() * 1000, phase: R() * Math.PI * 2
    });
    if (name === "detail") detailIntentOpen = opening; else paneIntentOpen = opening;
  }
  function emitCascadeClose() {
    const lead = 1.15, left = L.drawerL, right = L.detailR;
    const source = right - 1 + lead;
    const speed = (L.drawerR - L.drawerL + lead * 2) / CFG.revealIn;
    retire("drawer"); retire("detail"); retire("stack");
    paneIntentOpen = false; detailIntentOpen = false;
    paneWaves.push({
      id: ++paneWaveSeq, band: "stack", action: "close", dir: -1, left, right, x: source, speed,
      age: 0, strength: 0, seed: R() * 1000, phase: R() * Math.PI * 2
    });
  }
  function applyWork(id, lock, dur, t) {
    const next = id || null;
    if (next === workId) { if (lock) workLocked = !!workId; return; }
    workId = next;
    if (lock) workLocked = !!workId;
    const spec = workId && WORK[workId];
    lutEvents.push({ t, palette: spec ? spec.palette : CFG.palette, dur: dur || CFG.colorIn });
    workSeedTo = spec ? spec.seed * 0.07 : 0;
  }
  function buddySay(text, hold, t) {
    buddy.text = text; buddy.textT = t; buddy.textUntil = t + text.length * 0.048 + (hold ?? 1.9);
  }
  function buddyMood(mood, seconds, t) { buddy.mood = mood; buddy.moodUntil = t + seconds; }
  function endHint(t) {
    if (!buddy.hint) return;
    if (buddy.text === buddy.hint.text) buddy.textUntil = Math.min(buddy.textUntil, t);
    buddy.hint = null;
  }
  function navigate(path, t) {
    if (!laptop) return columnRoute(path, t);
    if (path === "/work/kpoint") {
      applyWork("kpoint", true, drawerId && paneIntentOpen ? CFG.switchIn : CFG.revealIn, t);
      openDrawer("kpoint", t);
    } else if (path === "/projects") {
      applyWork(null, true, drawerId && paneIntentOpen ? CFG.switchIn : CFG.revealIn, t);
      openDrawer("projects", t);
    } else if (path === "/projects/jarvis") {
      applyWork(null, true, undefined, t);
      openDrawer("projects", t);
      detailId = "project-jarvis";
      emitPaneWave("open", "detail");
    } else if (path === "/") {
      if (detailId) emitCascadeClose(); else if (drawerId) emitPaneWave("close", "drawer");
      applyWork(null, true, CFG.revealIn, t);
    }
  }
  function openDrawer(id, t) {
    if (id === drawerId) return;
    if (drawerId) {
      // startDrawerSwitch: one flowing banner replaces the old page row by row.
      drawerLayers.push({ id, clip: true });
      drawerSwitches.push({ to: id, p: 0, vis: 0, seed: R() * 1000, phase: R() * Math.PI * 2 });
      drawerId = id;
      return;
    }
    drawerId = id;
    drawerLayers = [{ id, clip: false }];
    emitPaneWave("open", "drawer");
  }

  // ---- column (phone) routes ----
  function columnRoute(path, t) {
    let target = null;
    colRouteDetail = path === "/projects/jarvis" ? "project-jarvis" : null;
    colDetailOpen = colRouteDetail;
    if (path === "/work/kpoint") target = A.colKpointTop;
    else if (path === "/projects") target = A.colProjectsTop;
    else if (path === "/projects/jarvis") target = A.colJarvisTop;
    if (target != null) scrollColumn(Math.max(0, target - 16), t, 0.62);
  }
  function scrollColumn(to, t, dur) {
    colScrollFrom = colScroll; colScrollTo = Math.min(A.colMaxScroll(colDetailOpen), to);
    colScrollT0 = t; colScrollDur = dur;
  }

  // ---- input helpers ----
  const pointerAt = TL.pointerAt;
  function onField(x, y) {
    const fx = x / cell, fy = y / cell;
    if (laptop) {
      const i = Math.floor(fx), j = Math.floor(fy);
      const openText = (drawerId && i >= L.drawerL && i < L.drawerR && j >= 1 && j < rows - 1 && paneCellOpen[j * cols + i] === 1) ||
        (detailId && i >= L.detailL && i < L.detailR && j >= 1 && j < rows - 1 && paneCellOpen[j * cols + i] === 1);
      if (openText) return false;
      return fx >= L.homeRight && fx < cols - 1 && fy >= 1 && fy < rows - 1;
    }
    return fx >= 1 && fx < cols - 1 && fy >= 1 && fy < rows - 1;
  }
  function stampWake(x, y, force, t) {
    if (!onField(x, y)) return;
    const wx = x / cell, wy = y / cell;
    const last = wake[wake.length - 1];
    if (!force && last && Math.hypot(wx - last.x, wy - last.y) < WAKE_GAP && t - last.t < 0.035) return;
    wake.push({ x: wx, y: wy, t });
    if (wake.length > WAKE_MAX) wake.shift();
  }
  function mouseSpark(x, y, strong, force) {
    if (!onField(x, y)) return;
    const wx = x / cell, wy = y / cell;
    const key = ((wx * 2) | 0) + ((wy * 2) | 0) * 4096;
    if (key === lastTileKey && !force) return;
    lastTileKey = key;
    sparks.push({ x: wx, y: wy, t: 0, r: strong ? 12 : 6.5, a: strong ? 0.85 : 0.38 });
    if (sparks.length > 60) sparks.shift();
  }
  function emailBurst(cyRow, t) {
    buddyMood({ mouth: "smile", blush: true }, 2.2, t);
    buddySay("i'll write back. promise.", 2.2, t);
    const x0 = colorLeft() + 0.6;
    const y0 = Math.min(rows - 2, Math.max(1, cyRow));
    sparks.push({ x: x0, y: y0, t: 0, r: 4, a: 0.9 });
    wake.push({ x: x0, y: y0, t });
    if (wake.length > WAKE_MAX) wake.shift();
    for (let k = 0; k < 16; k++) {
      const ang = ((k + R()) / 16 - 0.5) * 2.8;
      const speed = 10 + R() * 9;
      sparks.push({
        x: x0, y: y0, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
        t: -R() * 0.06, r: 0.6, a: 1.2 + R() * 0.4,
        hue: INTRO.hueFrom + R() * (INTRO.hueTo - INTRO.hueFrom)
      });
    }
    while (sparks.length > 60) sparks.shift();
    toastOnAt = t; toastOffAt = t + 2.2;
  }

  // Intro tile map, as in buildIntro().
  const intro = (() => {
    const { scale, i0, j0 } = L.intro;
    const textCols = 29;
    const delay = new Float32Array(cols * rows).fill(-1), out = new Float32Array(cols * rows), hue = new Float32Array(cols * rows);
    const bursts = [];
    [...INTRO.word].forEach((ch, Li) => {
      GLYPHS[ch].forEach((row, gy) => {
        for (let gx = 0; gx < 5; gx++) {
          if (row[gx] !== "1") continue;
          for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) {
            const col = (Li * 6 + gx) * scale + sx;
            const i = i0 + col, j = j0 + gy * scale + sy, k = j * cols + i;
            delay[k] = Li * INTRO.letterStep + (gx * scale + sx) * INTRO.colStep;
            out[k] = hash3(i, j, 91);
            hue[k] = INTRO.hueFrom + (INTRO.hueTo - INTRO.hueFrom) * col / (textCols * scale);
          }
        }
      });
      bursts.push({ x: i0 + (Li * 6 + 2.5) * scale, y: j0 + 3.5 * scale, at: Li * INTRO.letterStep, r: 9 * scale });
    });
    return { delay, out, hue, bursts, holdEnd: INTRO.hold };
  })();

  // Script events, sorted.
  const events = TL.events.slice().sort((a, b) => a.t - b.t);
  let ev = 0;
  let prevPointer = null;

  for (let n = 0; n < N; n++) {
    const t = n * dt;
    // ---- scripted input for this step ----
    while (ev < events.length && events[ev].t <= t + 1e-9) {
      const e = events[ev++];
      if (e.type === "down") {
        const p = pointerAt(e.t);
        if (t >= bootT && !e.noWake) { stampWake(p.x, p.y, true, t); mouseSpark(p.x, p.y, true, true); }
        buddy.pointerX = p.vx; buddy.pointerY = p.vy; buddy.pointerT = t;
      } else if (e.type === "boot") {
        const p = pointerAt(e.t);
        sparks.push({ x: p.x / cell, y: p.y / cell, t: 0, r: 12, a: 0.85 });
      } else if (e.type === "greet") {
        buddy.shownAt = t;
        buddySay("hi. i live here.", 2.6, t);
        buddyMood({ mouth: "smile" }, 1.8, t);
        buddy.blinks.push(t);
      } else if (e.type === "hint") {
        buddy.hint = { id: e.id, text: HINT_TEXT[e.id] };
        buddySay(HINT_TEXT[e.id], 4.5, t);
        buddyMood({ brows: "up", mouth: "smile" }, 1.4, t);
      } else if (e.type === "nav") {
        endHint(t);
        navigate(e.path, t);
      } else if (e.type === "email") {
        emailBurst(e.row, t);
      } else if (e.type === "blink") {
        buddy.blinks.push(t);
      } else if (e.type === "scroll") {
        scrollColumn(e.to, t, e.dur);
      }
    }

    // ---- pointer movement (pointermove / mousemove) ----
    const p = pointerAt(t);
    if (prevPointer && (Math.abs(p.x - prevPointer.x) > 0.01 || Math.abs(p.y - prevPointer.y) > 0.01) && p.visible) {
      if (laptop && t >= bootT) { stampWake(p.x, p.y, false, t); mouseSpark(p.x, p.y, false, false); }
      if (laptop) { buddy.pointerX = p.vx; buddy.pointerY = p.vy; buddy.pointerT = t; }
    }
    prevPointer = p;
    // Hovering the work link previews its palette (pointerover / pointerout).
    if (laptop && A.kpLink) {
      const r = A.kpLink;
      const over = p.visible && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
      if (over && !hoverWork) { hoverWork = true; if (!workLocked) applyWork("kpoint", false, CFG.colorIn, t); }
      if (!over && hoverWork) { hoverWork = false; if (!workLocked) applyWork(null, false, CFG.colorIn, t); }
    }

    // ---- frame(): pane waves, switches, close bookkeeping ----
    for (let w = paneWaves.length - 1; w >= 0; w--) {
      const wave = paneWaves[w];
      const { left, right } = wave;
      const lead = 1.15;
      wave.age += dt;
      wave.x += wave.dir * wave.speed * dt;
      const beyond = wave.dir > 0 ? Math.max(0, wave.x - (right - 1 + lead)) : Math.max(0, (left - lead) - wave.x);
      const tailSeconds = wave.action === "close" ? 2.4 : 1.8;
      const finishAt = Math.max(lead + 2, wave.speed * tailSeconds);
      const strengthTarget = beyond > 0 ? Math.max(0, 1 - beyond / finishAt) : 1;
      const strengthRate = strengthTarget > wave.strength ? 8 : 1.6;
      wave.strength += (strengthTarget - wave.strength) * (1 - Math.exp(-dt * strengthRate));
      for (let j = 1; j < rows - 1; j++) for (let i = left; i < right; i++) {
        const index = j * cols + i;
        if (paneWaveEdge(wave, i, j) >= 0 && wave.id >= paneCellEvent[index]) {
          paneCellEvent[index] = wave.id;
          paneCellOpen[index] = wave.action === "open" ? 1 : 0;
        }
      }
      if (beyond > finishAt && wave.strength < 0.02) paneWaves.splice(w, 1);
    }
    for (let k = drawerSwitches.length - 1; k >= 0; k--) {
      const s = drawerSwitches[k];
      s.p = Math.min(1, s.p + dt / CFG.switchIn);
      s.vis = paneGlide(s.p);
      if (s.p >= 1) { drawerSwitches.splice(k, 1); drawerLayers = [{ id: s.to, clip: false }]; }
    }
    if (laptop) {
      if (!detailIntentOpen && detailId && paneCellsMatch(false, "detail")) detailId = null;
      if (!paneIntentOpen && drawerId && !detailId && paneCellsMatch(false, "drawer")) {
        markPaneBand("drawer", false); drawerId = null; drawerLayers = [];
      }
    }

    while (wake.length && t - wake[0].t > WAKE_LIFE) wake.shift();
    const seedDelta = workSeedTo - workSeed, seedStep = 1.8 * dt;
    if (Math.abs(seedDelta) <= seedStep) workSeed = workSeedTo; else workSeed += Math.sign(seedDelta) * seedStep;

    // Name intro bursts (sparks) fire as each letter starts.
    const openT = t - bootT;
    const introT = openT - INTRO.start;
    while (introT >= 0 && introBurstsFired < intro.bursts.length && introT >= intro.bursts[introBurstsFired].at) {
      const b = intro.bursts[introBurstsFired++];
      sparks.push({ x: b.x, y: b.y, t: 0, r: b.r, a: 0.45 });
    }
    for (let k = sparks.length - 1; k >= 0; k--) {
      const sp = sparks[k];
      sp.t += dt;
      if (sp.vx && sp.t > 0) { sp.x += sp.vx * dt; sp.y += sp.vy * dt; sp.vx *= 1 - dt * 2.5; sp.vy *= 1 - dt * 2.5; }
      if (sp.t > 1.5) sparks.splice(k, 1);
    }

    // ---- buddy ----
    const routeKey = laptop
      ? (detailIntentOpen ? "detail" : paneIntentOpen ? (drawerId === "kpoint" ? "kpoint" : "projects") : "home")
      : "home";
    if (routeKey !== buddy.routeKey) {
      const first = !buddy.routeKey;
      buddy.routeKey = routeKey;
      endHint(t);
      if (!first && !buddy.routeSaid.has(routeKey)) { buddy.routeSaid.add(routeKey); buddySay(BUDDY_ROUTE_LINES[routeKey], 1.9, t); }
    }
    if (buddy.hint && t > buddy.textUntil) endHint(t);
    if (buddy.mood && t > buddy.moodUntil) buddy.mood = null;
    const blushNow = !!(buddy.mood && buddy.mood.blush), browsNow = !!(buddy.mood && buddy.mood.brows === "up");
    if (blushNow !== wasBlush) { if (blushNow) blushOnAt = t; else blushOffAt = t; wasBlush = blushNow; }
    if (browsNow !== wasBrows) { if (browsNow) browsOnAt = t; else browsOffAt = t; wasBrows = browsNow; }
    // Gaze target, as buddyGaze(): hint target, else a recent pointer, else rest.
    const face = TL.faceAt(t, colScroll);
    let gx = 0.85, gy = 0.1;
    const cl = v => v < -1 ? -1 : v > 1 ? 1 : v;
    if (buddy.hint && TL.hintTargetAt) {
      const r = TL.hintTargetAt(buddy.hint.id, colScroll);
      gx = cl((r.cx - face.cx) / (L.VW * 0.18)); gy = cl((r.cy - face.cy) / (L.VH * 0.25));
    } else if (t - buddy.pointerT < 4 && buddy.pointerX >= 0) {
      gx = cl((buddy.pointerX - face.cx) / (L.VW * 0.3)); gy = cl((buddy.pointerY - face.cy) / (L.VH * 0.35));
    }
    buddy.x += (gx - buddy.x) * (1 - Math.exp(-dt * 12));
    buddy.y += (gy - buddy.y) * (1 - Math.exp(-dt * 12));
    let openTarget = 1;
    for (const b of buddy.blinks) if (t >= b && t < b + 0.11) openTarget = 0.04;
    buddy.open += (openTarget - buddy.open) * (1 - Math.exp(-dt * 30));

    const said = (!buddy.text || t > buddy.textUntil) ? "" : buddy.text.slice(0, Math.floor((t - buddy.textT) / 0.048) + 1);
    const on = !!said;
    if (on !== sayWasOn) { if (on) sayOnAt = t; else sayOffAt = t; sayWasOn = on; }
    if (said) lastSaid = said;

    // ---- column scroll (smooth scrollTo) ----
    if (!laptop) {
      const u = clamp01((t - colScrollT0) / colScrollDur);
      colScroll = colScrollFrom + (colScrollTo - colScrollFrom) * TL.ease(u);
    }

    // ---- snapshot ----
    const anyPane = laptop && (drawerId || detailId);
    frames[n] = {
      t, openT,
      wt: Math.max(0, openT) * swell, hueSpin: Math.max(0, openT) * CFG.react * 0.04, glowNow,
      workSeed, colorLeft: colorLeft(),
      drawerId, detailId, paneIntentOpen, detailIntentOpen, workId, workLocked,
      drawerLayers: drawerLayers.map(l => ({ ...l })),
      switches: drawerSwitches.map(s => ({ ...s })),
      waves: paneWaves.map(w => ({ ...w })),
      cells: anyPane ? paneCellOpen.slice() : null,
      sparks: sparks.map(s => ({ ...s })),
      wake: wake.map(w => ({ ...w })),
      introT: openT - INTRO.start,
      face: { x: buddy.x, y: buddy.y, open: buddy.open, mood: buddy.mood ? { ...buddy.mood } : null,
        blush: { on: wasBlush, onAt: blushOnAt, offAt: blushOffAt }, brows: { on: wasBrows, onAt: browsOnAt, offAt: browsOffAt } },
      say: { text: on ? said : lastSaid, on, onAt: sayOnAt, offAt: sayOffAt, hint: !!(buddy.hint && said) },
      hint: buddy.hint ? buddy.hint.id : null,
      toast: { onAt: toastOnAt, offAt: toastOffAt },
      colScroll, colDetailOpen
    };
  }
  return { frames, intro, lutEvents, N };
}
