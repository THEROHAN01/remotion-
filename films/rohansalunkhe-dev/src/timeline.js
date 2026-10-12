// The film's script: when things happen, where the visitor's pointer goes,
// how the camera moves, and the sign-off composition. All copy that appears
// inside the site comes from the site itself (panes.html / product.js);
// the strings here are the film's own headline and lockup.
//
// Edit timing here. STORY.md mirrors these beats.

import { CFG, GLYPHS, INTRO, hash3, switchBandCenter as bandCenter } from "./product.js";
import { BEAT, DUR, spring, springA, track, clamp01, lerp } from "./motion.js";

export const COPY = {
  hook: [["Most", "portfolios"], ["just", "sit", "there."]],
  payoff: "hi. i live here.",                 // the portrait's real first-visit line
  name: "Rohan Salunkhe",                     // site: .name
  role: "full-stack engineer",                // site: .me-role
  tag: "building thoughtful web products",    // site bio: "…building thoughtful web products…"
  url: "rohansalunkhe.dev"                    // site: canonical URL
};

// Beat-aligned times shared by both formats (seconds).
export const T = {
  boot: 4.8, columnRise: 8.3,
  greet: 8.9,
  hintExp: 12.4, clickExp: 14.0,
  hintProj: 17.2, clickProj: 18.5,
  hintPick: 21.7, clickPick: 23.6,
  clickHome: 26.3,
  clickEmail: 28.9,
  payType: 32.0, payGrow: 32.6,
  signoff: 34.0, lockup: 36.3,
  end: 41.5
};

export function makeTimeline(L, A, format) {
  const laptop = L.mode === "laptop";
  const cell = L.cell;
  const duration = T.end;

  // ---- the tile the visitor clicks to wake the wall ----
  const click = laptop ? { i: 36, j: 14 } : { i: L.OX + 14, j: L.OY + 8 };
  const clickPt = { x: click.i * cell + 9.5, y: click.j * cell + 9.5 };
  const fieldCorners = laptop
    ? [[L.homeRight, 1], [L.homeRight + L.ambient - 1, 1], [L.homeRight, L.rows - 2], [L.homeRight + L.ambient - 1, L.rows - 2]]
    : [[1, 1], [L.cols - 2, 1], [1, L.rows - 2], [L.cols - 2, L.rows - 2]];
  const maxD = Math.max(...fieldCorners.map(([i, j]) => Math.hypot(i - click.i, j - click.j))) + CFG.jagAmp * 0.5 + CFG.revealSoft;
  const boot = { si: click.i, sj: click.j, maxD };

  // ---- pointer (laptop) / finger (phone) ----
  const P = laptop ? laptopPointer(A, clickPt) : phonePointer(A, L, clickPt);
  const pos = track(P.keys, ["x", "y"], springA);
  const downs = P.downs;
  const bump = u => (u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0);
  const pointerAt = t => {
    const p = pos(t);
    // A slight arc while travelling, like a hand on a trackpad.
    const seg = P.keys.find((k, i) => i > 0 && t >= k.t - (k.dur ?? 0.6) && t < k.t);
    if (seg) {
      const i = P.keys.indexOf(seg), a = P.keys[i - 1];
      const u = clamp01((t - (seg.t - (seg.dur ?? 0.6))) / (seg.dur ?? 0.6));
      const dx = seg.x - a.x, dy = seg.y - a.y;
      const arc = Math.sin(Math.PI * u) * 0.08;
      p.x += -dy * arc; p.y += dx * arc;
    }
    let press = 1;
    for (const d of downs) press = Math.min(press, 1 - 0.16 * bump((t - d + 0.05) / 0.24));
    const alpha = P.alpha(t);
    const site = laptop ? p : { x: p.x + L.phone.x, y: p.y + L.phone.y };
    return { x: site.x, y: site.y, vx: p.x, vy: p.y, visible: alpha > 0.001, alpha, press };
  };

  // ---- events that drive the site's own logic ----
  const events = [
    { t: T.boot, type: "boot" }, { t: T.boot, type: "down" },
    { t: T.greet, type: "greet" },
    { t: T.hintExp, type: "hint", id: "experience" },
    { t: T.clickExp, type: "down", noWake: true }, { t: T.clickExp, type: "nav", path: "/work/kpoint" },
    ...[11.3, 16.1, 20.6, 24.9, 27.7, 30.4].map(t => ({ t, type: "blink" }))
  ];
  if (laptop) {
    events.push(
      { t: T.hintProj, type: "hint", id: "projects" },
      { t: T.clickProj, type: "down" }, { t: T.clickProj, type: "nav", path: "/projects" },
      { t: T.hintPick, type: "hint", id: "pick" },
      { t: T.clickPick, type: "down" }, { t: T.clickPick, type: "nav", path: "/projects/jarvis" },
      { t: T.clickHome, type: "down" }, { t: T.clickHome, type: "nav", path: "/" },
      { t: T.clickEmail, type: "down" }, { t: T.clickEmail, type: "email", row: A.email.cy / cell }
    );
  } else {
    events.push(...P.extraEvents);
  }

  // ---- camera ----
  const cameraAt = laptop ? laptopCamera(A) : phoneCamera(A, L);
  const phoneAmt = laptop ? () => 1 : t => spring(clamp01((t - 8.4) / DUR.long));
  const cameraBounds = laptop
    ? () => L.bounds
    : t => {
      const u = phoneAmt(t);
      const W = { x0: cell, y0: cell, x1: L.worldW - cell, y1: L.worldH - cell };
      return { x0: lerp(W.x0, L.bounds.x0, u), y0: lerp(W.y0, L.bounds.y0, u), x1: lerp(W.x1, L.bounds.x1, u), y1: lerp(W.y1, L.bounds.y1, u) };
    };

  // ---- hook headline: words land on the beat ----
  const beats = [1, 2, 4, 5, 6].map(b => b * BEAT);
  let bi = 0;
  const headline = {
    size: laptop ? 66 : 56,
    top: laptop ? 196 : 232,
    lines: COPY.hook.map(words => words.map(w => [w, beats[bi++] - 0.12]))
  };

  // ---- payoff and sign-off ----
  const payoff = {
    type: T.payType, grow: T.payGrow, signoff: T.signoff, lockup: T.lockup,
    text: COPY.payoff, size: laptop ? 70 : 40, y: L.VH / 2
  };
  const wordmark = buildWordmark(L, laptop);
  const lockup = {
    lines: laptop
      ? [
        { cls: "lock-name", text: COPY.name, size: 56, top: 268, at: T.lockup + 0.25 },
        { cls: "lock-role", text: COPY.role, size: 18, top: 334, at: T.lockup + 0.25 + 0.07 },
        { cls: "lock-tag", text: COPY.tag, size: 28, top: 388, at: T.lockup + 1.0 },
        { cls: "lock-url", text: COPY.url, size: 24, top: 430, at: T.lockup + 1.0 + 0.07 }
      ]
      : [
        { cls: "lock-name", text: COPY.name, size: 46, top: 366, at: T.lockup + 0.25 },
        { cls: "lock-role", text: COPY.role, size: 15, top: 422, at: T.lockup + 0.25 + 0.07 },
        { cls: "lock-tag", text: COPY.tag, size: 21, top: 470, at: T.lockup + 1.0 },
        { cls: "lock-url", text: COPY.url, size: 20, top: 503, at: T.lockup + 1.0 + 0.07 }
      ]
  };

  const faceAt = (t, scroll) => laptop
    ? { cx: A.face.cx, cy: A.face.y + A.face.h * 0.52 }
    : { cx: A.face.x + A.face.w / 2, cy: A.face.y + A.face.h * 0.52 - scroll };
  const hintTargetAt = (id, scroll) => {
    const r = id === "experience" ? A.kpLink : id === "projects" ? A.prLink : A.jvLink;
    return laptop ? { cx: r.cx, cy: r.cy } : { cx: r.x + r.w / 2, cy: r.y + r.h / 2 - scroll };
  };

  // ---- sound cues (synthesised in sound.mjs from this list) ----
  const cues = [];
  [1, 2, 3, 4, 5, 6, 7].forEach(b => cues.push({ t: b * BEAT, kind: "pulse", gain: b >= 7 ? 0.5 : 1 }));
  for (const d of downs) cues.push({ t: d, kind: laptop ? "click" : "tap" });
  cues.push({ t: T.boot, kind: "swell" });
  [...INTRO.word].forEach((_, li) => cues.push({ t: T.boot + INTRO.start + li * INTRO.letterStep, kind: "pluck", note: li }));
  for (const at of [T.greet, T.hintExp, T.clickExp + 0.02, T.clickEmail + 0.02]) cues.push({ t: at, kind: "blip" });
  if (laptop) {
    for (const at of [T.hintProj, T.clickProj + 0.02, T.hintPick, T.clickPick + 0.02, T.clickHome + 0.02]) cues.push({ t: at, kind: "blip" });
    cues.push({ t: T.clickExp, kind: "wave", dur: 1.3 }, { t: T.clickProj, kind: "wave", dur: 1.5 },
      { t: T.clickPick, kind: "wave", dur: 1.3 }, { t: T.clickHome, kind: "wave", dur: 1.6, down: true });
  } else {
    for (const s of P.scrolls) cues.push({ t: s.t, kind: "swipe", dur: s.dur });
  }
  cues.push({ t: T.clickEmail, kind: "sparkle" });
  cues.push({ t: T.payGrow, kind: "swell", soft: true });
  cues.push({ t: T.signoff, kind: "wave", dur: 1.2, down: true });
  for (let li = 0; li < 5; li++) cues.push({ t: wordmark.letterLand[li], kind: "pluck", note: li, soft: true });
  cues.push({ t: T.lockup + 0.25, kind: "chord" });

  return {
    duration, bootT: T.boot, boot, events, pointerAt, faceAt, hintTargetAt,
    ease: spring, cameraAt, cameraBounds, phoneAmt, headline, payoff, wordmark, lockup, cues,
    hideRealBubble: t => t >= T.payType - 0.05,
    switchBandCenter: vis => bandCenter(vis, L.rows),
    T
  };
}

// ---------------------------------------------------------------- laptop ---
function laptopPointer(A, clickPt) {
  const c = r => ({ x: r.x + Math.min(r.w * 0.45, 60), y: r.y + r.h * 0.55 });
  const kp = c(A.kpLink), pr = c(A.prLink), jv = c(A.jvLink), em = { x: A.email.x + 70, y: A.email.y + A.email.h * 0.55 };
  const keys = [
    { t: 0, x: 1062, y: 470 },
    { t: 1.6, dur: 1.5, x: 790, y: 372 },
    { t: 3.0, dur: 1.3, x: 610, y: 262 },
    { t: 4.05, dur: 1.0, x: 676, y: 334 },
    { t: T.boot - 0.18, dur: 0.6, x: clickPt.x, y: clickPt.y },
    { t: 6.7, dur: 1.2, x: 846, y: 470 },
    { t: 9.9, dur: 1.0, x: 640, y: 430 },
    { t: 10.9, dur: 1.0, x: 905, y: 300 },
    { t: 11.95, dur: 1.0, x: 720, y: 486 },
    { t: T.clickExp - 0.28, dur: 1.25, ...kp },
    { t: 15.2, dur: 0.9, x: 975, y: 505 },
    { t: T.clickProj - 0.22, dur: 1.15, ...pr },
    { t: 19.6, dur: 0.8, x: 262, y: 520 },
    { t: T.clickPick - 0.26, dur: 1.3, ...jv },
    { t: 24.6, dur: 0.8, x: 990, y: 520 },
    { t: T.clickHome - 0.24, dur: 1.25, ...pr },
    { t: T.clickEmail - 0.26, dur: 1.3, ...em },
    { t: 30.0, dur: 0.9, x: em.x + 230, y: em.y + 70 }
  ];
  const downs = [T.boot, T.clickExp, T.clickProj, T.clickPick, T.clickHome, T.clickEmail];
  const alpha = t => 1 - clamp01((t - 30.7) / 0.4);
  return { keys, downs, alpha };
}

function laptopCamera(A) {
  const k = [
    { t: 0, cx: 622, cy: 300, z: 1.12 },
    { t: 4.3, dur: 4.3, cx: 662, cy: 297, z: 1.16 },
    { t: T.boot, dur: 0.5, cx: 702, cy: 292, z: 1.22 },
    { t: 7.6, dur: 2.4, cx: 512, cy: 288, z: 1.0 },
    { t: 13.4, dur: 1.2, cx: 330, cy: 252, z: 1.24 },
    { t: 15.7, dur: 1.4, cx: A.kpPara.cx + 10, cy: A.kpPara.cy - 6, z: 1.42 },
    { t: 17.9, dur: 1.0, cx: 400, cy: 262, z: 1.2 },
    { t: 19.7, dur: 1.0, cx: 470, cy: 292, z: 1.1 },
    { t: 23.3, dur: 1.3, cx: 600, cy: 300, z: 1.12 },
    { t: 25.3, dur: 1.4, cx: A.jvPara.cx, cy: A.jvPara.cy - 8, z: 1.46 },
    { t: 26.7, dur: 1.0, cx: 512, cy: 288, z: 1.0 },
    { t: 29.1, dur: 1.3, cx: 370, cy: 168, z: 1.4 },
    { t: 32.2, dur: 1.5, cx: A.face.cx + 70, cy: A.face.cy + 6, z: 2.3 }
  ];
  return track(k, ["cx", "cy", "z"], springA);
}

// ----------------------------------------------------------------- phone ---
function phonePointer(A, L, clickPt) {
  // Finger positions in phone-local coordinates (scroll-adjusted where needed).
  const local = { x: clickPt.x - L.phone.x, y: clickPt.y - L.phone.y };
  const kpScroll = Math.max(0, A.colKpointTop - 16);
  const prScroll = Math.min(A.colMaxScroll(null), A.colProjectsTop - 16);
  const jvScroll = Math.min(A.colMaxScroll("project-jarvis"), A.colJarvisTop - 16);
  const at = (r, scroll) => ({ x: r.x + Math.min(r.w * 0.45, 70), y: r.y + r.h * 0.55 - scroll });
  const kp = at(A.kpLink, 0), jvLink = at(A.jvLink, prScroll), em = at(A.email, 0);
  const keys = [
    { t: 0, x: 300, y: 430 },
    { t: 1.8, dur: 1.4, x: 220, y: 230 },
    { t: 3.4, dur: 1.4, x: 320, y: 320 },
    { t: T.boot - 0.2, dur: 0.9, x: local.x, y: local.y },
    { t: 10.4, dur: 0.6, x: 130, y: 150 },
    { t: 11.3, dur: 0.6, x: 330, y: 105 },
    { t: T.clickExp - 0.2, dur: 1.0, ...kp },
    { t: 17.5, dur: 0.6, x: 230, y: 640 },
    { t: 18.35, dur: 0.7, x: 230, y: 250 },                // drag up: scroll to projects
    { t: 21.0 - 0.2, dur: 0.8, ...jvLink },
    { t: 25.2, dur: 0.6, x: 230, y: 230 },
    { t: 26.15, dur: 0.85, x: 230, y: 660 },               // drag down: back to the top
    { t: T.clickEmail - 0.2, dur: 1.0, ...em }
  ];
  const downs = [T.boot, 10.4, 11.3, T.clickExp, 21.0, T.clickEmail];
  const drags = [[17.5, 18.35], [25.2, 26.15]];
  const tapVis = t => {
    let a = 0;
    for (const d of downs) a = Math.max(a, clamp01(1 - Math.abs(t - d) / 0.32));
    for (const [s, e] of drags) if (t >= s - 0.2 && t <= e + 0.25) a = Math.max(a, clamp01(Math.min(t - (s - 0.2), e + 0.25 - t) / 0.18));
    return a;
  };
  const extraEvents = [
    { t: 10.4, type: "down" }, { t: 11.3, type: "down" },
    { t: 17.5, type: "scroll", to: prScroll, dur: 0.85 },
    { t: 21.0, type: "down", noWake: true }, { t: 21.0, type: "nav", path: "/projects/jarvis" },
    { t: 25.2, type: "scroll", to: 0, dur: 0.95 },
    { t: T.clickEmail, type: "down", noWake: true },
    { t: T.clickEmail, type: "email", row: L.OY + (A.email.y + A.email.h / 2) / L.cell }
  ];
  const scrolls = [{ t: T.clickExp, dur: 0.62 }, { t: 17.5, dur: 0.85 }, { t: 21.0, dur: 0.62 }, { t: 25.2, dur: 0.95 }];
  return { keys, downs, alpha: tapVis, extraEvents, scrolls, kpScroll, prScroll, jvScroll };
}

function phoneCamera(A, L) {
  const ph = L.phone;
  const cxP = ph.x + ph.w / 2, cyP = ph.y + ph.h / 2;
  const world = { cx: L.worldW / 2, cy: L.worldH / 2 };
  const kpY = ph.y + (A.kpPara.y - Math.max(0, A.colKpointTop - 16)) + A.kpPara.h / 2;
  const jvScroll = Math.min(A.colMaxScroll("project-jarvis"), A.colJarvisTop - 16);
  const jvY = ph.y + (A.jvPara.y - jvScroll) + A.jvPara.h / 2;
  const faceY = ph.y + A.face.y + A.face.h / 2;
  const k = [
    { t: 0, cx: cxP, cy: cyP, z: 1.06 },
    { t: 4.3, dur: 4.3, cx: cxP, cy: cyP, z: 1.1 },
    { t: T.boot, dur: 0.5, cx: cxP + 30, cy: cyP - 40, z: 1.14 },
    { t: 6.6, dur: 1.8, cx: world.cx, cy: world.cy, z: 0.636 },
    { t: 9.6, dur: 1.2, cx: cxP, cy: cyP, z: 1.0 },
    { t: 15.6, dur: 1.3, cx: cxP, cy: kpY, z: 1.06 },
    { t: 17.6, dur: 0.8, cx: cxP, cy: cyP, z: 1.0 },
    { t: 22.6, dur: 1.3, cx: cxP, cy: jvY, z: 1.06 },
    { t: 25.3, dur: 0.8, cx: cxP, cy: cyP, z: 1.0 },
    { t: 29.2, dur: 1.2, cx: cxP, cy: faceY + 60, z: 1.2 },
    { t: 32.2, dur: 1.5, cx: ph.x + A.face.x + A.face.w / 2 + 50, cy: faceY - 10, z: 2.1 }
  ];
  return track(k, ["cx", "cy", "z"], springA);
}

// ------------------------------------------------------------- wordmark ---
// ROHAN in the site's own 5×7 glyphs, one tile per glyph pixel, at the site's
// tile size (19 px + 1 px gap) on landscape, 15 + 1 on vertical.
function buildWordmark(L, laptop) {
  const P = laptop ? 20 : 13, tile = P - 1;
  const w = 29 * P - 1;
  const x0 = laptop ? 222 : 28;
  const top0 = laptop ? 220 : 338;              // centred while it assembles
  const topLock = laptop ? 100 : 247;           // risen for the lockup (same grid)
  const tiles = [];
  const letterLand = [];
  let n = 0;
  [...INTRO.word].forEach((ch, li) => {
    GLYPHS[ch].forEach((row, gy) => {
      for (let gx = 0; gx < 5; gx++) {
        if (row[gx] !== "1") continue;
        const col = li * 6 + gx;
        const x = x0 + col * P, y = top0 + gy * P;
        // Each tile starts as an unlit tile somewhere on the grid and streams in.
        const sx = x0 % P + Math.floor(hash3(col, gy, 7) * (L.VW / P)) * P;
        const sy = Math.floor(hash3(col, gy, 11) * (L.VH / P)) * P;
        const at = T.signoff + 0.12 + li * INTRO.letterStep + gx * INTRO.colStep + hash3(col, gy, 3) * 0.08;
        tiles.push({
          x, y, sx: n === 0 ? x : sx, sy: n === 0 ? y : sy, ss: tile,
          lx: x, ly: y + (topLock - top0),
          hue: INTRO.hueFrom + (INTRO.hueTo - INTRO.hueFrom) * col / 29,
          at: n === 0 ? T.signoff + DUR.mid * 0.75 : at,
          sourceFill: "rgb(9,15,15)"
        });
        n++;
      }
    });
    letterLand.push(T.signoff + 0.12 + li * INTRO.letterStep + DUR.long * 0.6);
  });
  return {
    cell: P, tile, lockTile: tile, tiles, letterLand, rise: top0 - topLock,
    gridX0: x0 % P, gridY0: 0, width: w,
    firstLands: T.signoff + DUR.mid * 0.8
  };
}
