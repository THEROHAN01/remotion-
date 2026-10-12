// Draws the tile wall for one snapshot. The per-tile shading below is the
// site's frame() loop: fbm brightness + hue field, wake ripples, sparks, pane
// wave light, switch banner cover, opening splash, name intro, palette LUT.
// Film additions: the "dead" pre-boot state, the column film margin, and
// drawing only visible tiles through the camera at output resolution.

import {
  CFG, INTRO, fbm, fillLUT, splashEdge, splashMask, splashRing, paneWaveLight,
  switchBandEdge, wipeGlow, exposeLight, sm, clamp01, WAKE_LIFE, WAKE_DELAY
} from "./product.js";

export const BG = "#060607";
// --line: color-mix(in srgb, var(--accent) 5%, var(--bg)) — the site's unlit tile colour.
export const LINE = mixHex("#17c3a2", 0.05, BG);
// Film: the "switched-off" wall (hook) and the sign-off grid use the same token mix at 10 %
// so the unlit tiles survive video compression and phone screens.
export const DEAD = mixHex("#17c3a2", 0.10, BG);

export function mixHex(a, amt, b) {
  const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, k) => Math.round(v * amt + pb[k] * (1 - amt))).join(",")})`;
}

// Palette blends over time (applyWork + snapshotLUT), evaluated as a function of t.
export function makeLUTs(lutEvents) {
  const keys = [];
  let prevFrom = new Float32Array(512 * 3), prevTo = new Float32Array(512 * 3), prev = null;
  for (const e of lutEvents) {
    const to = new Uint8ClampedArray(512 * 3);
    fillLUT(to, e.palette);
    const from = new Float32Array(512 * 3);
    if (!prev) from.set(to);
    else {
      const u = sm(clamp01((e.t - prev.t) / prev.dur));
      for (let i = 0; i < from.length; i++) from[i] = prevFrom[i] * (1 - u) + prevTo[i] * u;
    }
    keys.push({ t: e.t, dur: e.dur, from, to: Float32Array.from(to) });
    prevFrom = from; prevTo = Float32Array.from(to); prev = e;
  }
  return t => {
    let k = 0;
    while (k + 1 < keys.length && keys[k + 1].t <= t) k++;
    const key = keys[k];
    const u = sm(clamp01((t - key.t) / key.dur));
    return { from: key.from, to: key.to, u };
  };
}

export function lutFill(lut, s, b) {
  const idx = (s * 512) | 0;
  const bq = (b * 63) | 0;
  const m2 = (bq + 0.5) / 64;
  const u = lut.u, v = 1 - u, o = idx * 3;
  return "rgb(" +
    ((lut.from[o] * v + lut.to[o] * u) * m2 | 0) + "," +
    ((lut.from[o + 1] * v + lut.to[o + 1] * u) * m2 | 0) + "," +
    ((lut.from[o + 2] * v + lut.to[o + 2] * u) * m2 | 0) + ")";
}

/**
 * ctx: 2D context already transformed so 1 unit = 1 site px.
 * view: visible site rect {x0,y0,x1,y1}.
 * opts: { boot:{si,sj,maxD}, phoneAmt (column), deadAmt }
 */
export function drawWall(ctx, L, S, intro, lut, view, opts) {
  const cell = L.cell, tile = L.tile, cols = L.cols, rows = L.rows;
  const laptop = L.mode === "laptop";
  ctx.fillStyle = BG;
  ctx.fillRect(view.x0 - 2, view.y0 - 2, view.x1 - view.x0 + 4, view.y1 - view.y0 + 4);
  if (S.openT < 0) return;           // before boot the wall is off (the dead layer shows the tiles)

  const iMin = Math.max(0, Math.floor(view.x0 / cell) - 1), iMax = Math.min(cols - 1, Math.ceil(view.x1 / cell) + 1);
  const jMin = Math.max(0, Math.floor(view.y0 / cell) - 1), jMax = Math.min(rows - 1, Math.ceil(view.y1 / cell) + 1);

  const colorLeft = S.colorLeft;
  const ambient = laptop ? L.ambient : L.pCols - 2;
  const lightFieldRight = laptop ? Math.min(cols - 1, colorLeft + ambient) : L.OX + L.pCols - 1;
  const homeRight = laptop ? L.homeRight : L.OX + 1;
  const revealP = sm(S.openT / CFG.revealIn);
  const sweepDone = revealP >= 1;
  const th = CFG.threshold, floor = CFG.floor;
  const wtW = S.wt, wtC = S.wt;
  const introOn = S.introT >= 0 && S.introT < intro.holdEnd + INTRO.dissolve + INTRO.fadeOut + 0.2;
  const introDim = introOn
    ? sm(clamp01(S.introT / 0.4)) * (1 - sm(clamp01((S.introT - intro.holdEnd - 0.2) / (INTRO.dissolve + INTRO.fadeOut))))
    : 0;
  const phoneAmt = opts.phoneAmt ?? 1;

  // Cleared cells: open pane text shows through the canvas (canvas sits above the panes).
  if (laptop && (S.drawerId || S.detailId) && S.cells) {
    const paneRight = Math.max(S.drawerId ? L.drawerR : L.drawerL, S.detailId ? L.detailR : L.drawerL);
    for (let j = Math.max(1, jMin); j <= Math.min(rows - 2, jMax); j++) {
      for (let i = Math.max(L.drawerL, iMin); i < Math.min(paneRight, iMax + 1); i++) {
        if (S.cells[j * cols + i] === 1) ctx.clearRect(i * cell, j * cell, cell, cell);
      }
    }
  }

  for (let j = jMin; j <= jMax; j++) {
    const py = j * cell;
    for (let i = iMin; i <= iMax; i++) {
      let alpha = 1;
      let onBorder, onLightBorder, inLightField, onHome = false, inDrawer = false, inDetail = false;
      if (laptop) {
        onBorder = j === 0 || j === rows - 1 || i === 0 || i === cols - 1;
        onHome = !onBorder && i < homeRight;
        if (onHome) continue;
        inDrawer = !!S.drawerId && !onBorder && i >= L.drawerL && i < L.drawerR;
        inDetail = !!S.detailId && !onBorder && i >= L.detailL && i < L.detailR;
        inLightField = i >= colorLeft && i < lightFieldRight;
        onLightBorder = !onBorder && i === lightFieldRight;
      } else {
        // Column: the phone's own grid (29×52) inside a film-only margin.
        const pi = i - L.OX, pj = j - L.OY;
        const inPhone = pi >= 0 && pi < L.pCols && pj >= 0 && pj < L.pRows;
        const phoneBorder = inPhone && (pi === 0 || pi === L.pCols - 1 || pj === 0 || pj === L.pRows - 1);
        const worldBorder = i === 0 || i === cols - 1 || j === 0 || j === rows - 1;
        if (!inPhone) alpha = 1 - phoneAmt;
        if (alpha <= 0.002) continue;
        onBorder = worldBorder;
        onLightBorder = false;
        inLightField = !worldBorder;
        if (phoneBorder && phoneAmt > 0) {
          // Phone border tiles fade in as the film margin goes away.
          if (phoneAmt >= 1) { ctx.fillStyle = LINE; ctx.fillRect(i * cell, py, tile, tile); continue; }
        }
      }
      const activePane = inDetail ? "detail" : inDrawer ? "drawer" : null;
      const paneCellIsOpen = !!activePane && S.cells && S.cells[j * cols + i] === 1;

      if (onBorder || onLightBorder) {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = LINE;
        ctx.fillRect(i * cell, py, tile, tile);
        ctx.globalAlpha = 1;
        continue;
      }
      if (!activePane && !inLightField) continue;

      let b = fbm(i * CFG.waveScale + wtW * CFG.waveDriftX, j * CFG.waveScale + wtW * CFG.waveDriftY, wtW * CFG.waveEvolve + 47.1 + S.workSeed);
      b = (b - th) / (1 - th);
      b = b < 0 ? 0 : Math.pow(b, CFG.gamma);
      b = floor + (1 - floor) * (b > 1 ? 1 : b);
      let s = fbm(i * CFG.colorScale + wtC * CFG.colorDrift, j * CFG.colorScale + wtC * CFG.colorDriftY, wtC * CFG.colorEvolve) + wtC * CFG.hueCycle + S.hueSpin;
      b *= S.glowNow;

      if (S.wake.length) {
        let g = 0;
        const px = i + 0.5, pyy = j + 0.5;
        for (const wp of S.wake) {
          const delayed = S.t - wp.t - WAKE_DELAY;
          if (delayed < 0) continue;
          const life = 1 - delayed / (WAKE_LIFE - WAKE_DELAY);
          if (life <= 0) continue;
          const fade = life * life;
          const dx = px - wp.x, dy = pyy - wp.y;
          const d2 = dx * dx + dy * dy;
          const spread = 0.42 + delayed * 2.1;
          g += fade * 0.22 * Math.exp(-d2 / (spread * spread * 0.28));
          const ring = Math.sqrt(d2) - delayed * 6.5;
          g += fade * 0.28 * Math.exp(-(ring * ring) / 0.7);
        }
        if (g > 0.004) { b += g; s += g * 0.09; }
      }
      for (const sp of S.sparks) {
        const ax = i - sp.x, ay = j - sp.y;
        if (sp.t < 0 || ax > 8 || ax < -8 || ay > 8 || ay < -8) continue;
        const g = Math.exp(-(ax * ax + ay * ay) / sp.r) * Math.exp(-sp.t / 0.55) * sp.a;
        if (sp.hue === undefined) { b += g; s += g * 0.1; continue; }
        const lit = g > 1 ? 1 : g;
        b += (1 - b) * lit;
        s += (sp.hue - (s - Math.floor(s))) * lit;
      }

      const paneGlow = laptop ? paneWaveLight(S.waves, i, j, activePane) : 0;
      if (!activePane && paneGlow > 0.002) b = exposeLight(b, paneGlow);
      if (activePane) {
        let cover = 0, edgeGlow = 0;
        if (activePane === "drawer" && S.switches.length) {
          for (const tr of S.switches) {
            const e = switchBandEdge(i, j, tr, S.t, rows);
            cover = Math.max(cover, sm(clamp01(e + 1)));
            edgeGlow = Math.max(edgeGlow, wipeGlow(Math.abs(e), 2.2));
          }
        }
        if (cover > 0.01) {
          ctx.fillStyle = BG;
          ctx.fillRect(i * cell, py, cell, cell);
          b *= cover;
          b = exposeLight(b, edgeGlow);
        } else if (paneCellIsOpen) {
          if (paneGlow <= 0.012) continue;
          ctx.fillStyle = BG;
          ctx.fillRect(i * cell, py, cell, cell);
          b = exposeLight(b, paneGlow);
        } else {
          b = exposeLight(b, paneGlow);
        }
      }

      if (!sweepDone) {
        const e = splashEdge(i, j, opts.boot.si, opts.boot.sj, revealP * opts.boot.maxD);
        const m = splashMask(e);
        b = b * m + splashRing(e);
        if (b < 0.02) continue;
      }
      s -= Math.floor(s);
      if (introOn && !activePane) {
        const k = j * cols + i;
        b *= 1 - INTRO.dimField * introDim;
        const d = intro.delay[k];
        if (d >= 0) {
          const on = sm(clamp01((S.introT - d) / INTRO.fadeIn));
          const off = sm(clamp01((S.introT - intro.holdEnd - intro.out[k] * INTRO.dissolve) / INTRO.fadeOut));
          const lit = on * (1 - off);
          if (lit > 0) { b += (1 - b) * lit; s += (intro.hue[k] - s) * lit; }
        }
      }
      if (b > 1) b = 1;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = lutFill(lut, s, b);
      ctx.fillRect(i * cell, py, tile, tile);
      if (!laptop && phoneAmt > 0 && phoneAmt < 1) {
        const pi = i - L.OX, pj = j - L.OY;
        if (pi === 0 || pi === L.pCols - 1 || pj === 0 || pj === L.pRows - 1) {
          ctx.globalAlpha = phoneAmt;
          ctx.fillStyle = LINE;
          ctx.fillRect(i * cell, py, tile, tile);
        }
      }
      ctx.globalAlpha = 1;
    }
  }
}

// The hook's switched-off wall: every cell is an unlit tile until the splash reaches it.
export function drawDead(ctx, L, S, view, boot) {
  const cell = L.cell, tile = L.tile;
  const iMin = Math.max(0, Math.floor(view.x0 / cell) - 1), iMax = Math.min(L.cols - 1, Math.ceil(view.x1 / cell) + 1);
  const jMin = Math.max(0, Math.floor(view.y0 / cell) - 1), jMax = Math.min(L.rows - 1, Math.ceil(view.y1 / cell) + 1);
  const revealP = S.openT < 0 ? 0 : sm(S.openT / CFG.revealIn);
  if (revealP >= 1) return false;
  for (let j = jMin; j <= jMax; j++) for (let i = iMin; i <= iMax; i++) {
    let m = 0;
    if (S.openT >= 0) m = splashMask(splashEdge(i, j, boot.si, boot.sj, revealP * boot.maxD));
    if (m >= 0.999) continue;
    ctx.globalAlpha = 1 - m;
    ctx.fillStyle = BG;
    ctx.fillRect(i * cell, j * cell, cell, cell);
    ctx.fillStyle = DEAD;
    ctx.fillRect(i * cell, j * cell, tile, tile);
    ctx.globalAlpha = 1;
  }
  return true;
}
