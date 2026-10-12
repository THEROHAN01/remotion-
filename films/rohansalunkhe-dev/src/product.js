// The wall's engine, ported from rohan.dev/index.html (the inline <script>).
// Constants, noise, palette LUT, splash, pane waves and the switch banner are
// copied as-is so the film's tiles behave exactly like the site's. The only
// change: Math.random() is replaced by seeded hashes so every frame is
// reproducible.

export const CFG = {
  tile: 19, gap: 1, radius: 0,
  speed: 1,
  react: 1,
  /* Deep teal → cyan → seafoam. No near-black stops. */
  palette: [
    "#003b36", "#00544c", "#0a6f63", "#127f6e",
    "#17c3a2", "#2ad9c2", "#5fe8d6", "#8ff2e6",
    "#c6faf1", "#0d9488", "#065f5a"
  ],
  colorScale: 0.05,
  colorDrift: 0.04,
  colorDriftY: 0.018,
  colorEvolve: 0.05,
  hueCycle: 0.012,
  waveScale: 0.10,
  waveDriftX: 0.06,
  waveDriftY: 0.025,
  waveEvolve: 0.09,
  threshold: 0.02,
  gamma: 0.95,
  floor: 0.55,
  revealIn: 1.3,
  switchIn: 1.5,
  colorIn: 0.65,
  revealSoft: 2.3,
  jagAmp: 7,
  drawerFlowCols: 3.1,
  drawerGlowCols: 4.2,
  drawerFlexCols: 1.6,
  switchBandRows: 10,
  switchBandMinRows: 10,
  switchFlowRows: 3,
  switchFlexRows: 2.2,
  dimQuiet: 0.10,
  swellSpeed: 3.0,
  paneAnimDur: 0.52,
  paneAccel: 0.16
};

export const WORK = {
  kpoint: { seed: 42, palette: ["#003b36", "#0a6f63", "#127f6e", "#17c3a2", "#5fe8d6", "#8ff2e6"] }
};

export const INTRO = {
  word: "ROHAN",
  start: 0.95,
  letterStep: 0.14,
  colStep: 0.025,
  fadeIn: 0.22,
  hold: 2.3,
  dissolve: 0.9,
  fadeOut: 0.35,
  dimField: 0.45,
  hueFrom: 0.56,
  hueTo: 0.70
};

export const GLYPHS = {
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"]
};

export const BUDDY_ROUTE_LINES = {
  kpoint: "that's where i work.",
  projects: "here's what i've built.",
  detail: "ooh, good pick.",
  home: "back home."
};

export const HINT_TEXT = {
  experience: "start with my experience →",
  projects: "now see what i build →",
  pick: "pick one. jarvis is my favourite."
};

export const ART_EYES = [
  { cx: 436.8, cy: 500.2, r: 18.5, lid: [0.002534, -2.393918, 1047.806059], min: -40, max: 3.24 },
  { cx: 638.1, cy: 463.2, r: 20.5, lid: [0.001554, -2.07164, 1137.857633], min: -45, max: 3.65 }
];
export const artLid = (eye, x) => eye.lid[0] * x * x + eye.lid[1] * x + eye.lid[2];

export const WAKE_MAX = 28, WAKE_GAP = 0.62, WAKE_LIFE = 0.52, WAKE_DELAY = 0.07;

export const sm = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
export const clamp01 = u => u <= 0 ? 0 : u >= 1 ? 1 : u;

export function fillLUT(out, palette) {
  const stops = palette.map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
  const n = stops.length;
  for (let k = 0; k < 512; k++) {
    const s = (k / 512) * n;
    const i0 = Math.floor(s);
    let f = s - i0;
    f = f * f * (3 - 2 * f);
    const a = stops[i0 % n], b = stops[(i0 + 1) % n];
    for (let c = 0; c < 3; c++) out[k * 3 + c] = Math.sqrt(a[c] * a[c] * (1 - f) + b[c] * b[c] * f);
  }
}

export function hash3(x, y, z) {
  let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1440662683)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
}
export function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const fx = x - xi, fy = y - yi, fz = z - zi;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const l = (a, b, t) => a + (b - a) * t;
  const x00 = l(hash3(xi, yi, zi), hash3(xi + 1, yi, zi), u);
  const x10 = l(hash3(xi, yi + 1, zi), hash3(xi + 1, yi + 1, zi), u);
  const x01 = l(hash3(xi, yi, zi + 1), hash3(xi + 1, yi, zi + 1), u);
  const x11 = l(hash3(xi, yi + 1, zi + 1), hash3(xi + 1, yi + 1, zi + 1), u);
  return l(l(x00, x10, v), l(x01, x11, v), w);
}
export function fbm(x, y, z) {
  return 0.62 * noise3(x, y, z) + 0.38 * noise3(x * 2.17 + 11.3, y * 2.17 + 7.9, z * 2.17 + 3.1);
}

/* Seeded stand-in for Math.random(): stable per (stream, n). */
export const rand = (stream, n) => hash3(stream * 7919 + 17, n * 104729 + 3, 2027);

export function splashEdge(i, j, cx, cy, radius) {
  const d = Math.hypot(i - cx, j - cy);
  const jag = (fbm(i * 0.3, j * 0.3, 5.7) - 0.5) * CFG.jagAmp;
  return radius - d + jag;
}
export function splashRing(e) { return Math.exp(-(e * e) / 5) * 0.8; }
export function splashMask(e) {
  let m = e / CFG.revealSoft;
  return m < 0 ? 0 : m > 1 ? 1 : m * m * (3 - 2 * m);
}

export function paneWaveBirth(wave) {
  const duration = wave.action === "close" ? 0.56 : 0.24;
  const progress = wave.age <= 0 ? 0 : wave.age >= duration ? 1 : sm(wave.age / duration);
  return wave.action === "close" ? progress : 0.58 + 0.42 * progress;
}
export function paneWaveFlow(wave, j) {
  const t = wave.age;
  const seed = wave.seed;
  const born = paneWaveBirth(wave);
  const breath = 0.82 + 0.18 * Math.sin(t * 1.9 + wave.phase);
  return (
    (fbm(j * 0.13 + seed, t * 0.22, 73.4 + seed) - 0.5) * 2 * CFG.drawerFlowCols * breath +
    Math.sin(j * 0.21 + t * 1.35 + wave.phase) * 1.05 +
    Math.sin(j * 0.47 - t * 0.8 + seed * 0.37) * 0.42
  ) * born;
}
export function paneWaveEdge(wave, i, j) {
  const front = wave.x + paneWaveFlow(wave, j);
  return wave.dir > 0 ? front - i : i - front;
}
export function paneWaveGlowWidth(wave, j) {
  const t = wave.age;
  const seed = wave.seed;
  const flow =
    (fbm(j * 0.15 + seed * 0.4, t * 0.18, 146.2 + seed) - 0.5) * 2 * CFG.drawerFlexCols +
    Math.sin(j * 0.28 - t * 1.1 + wave.phase) * 0.55;
  const breath = Math.sin(t * 1.6 + seed * 0.7) * 0.65;
  const born = paneWaveBirth(wave);
  return Math.max(1.5, 1.5 + (CFG.drawerGlowCols - 1.5 + flow + breath) * born);
}
export function wipeGlow(e, width) {
  const q = e / width;
  return Math.exp(-q * q * 2.2) * 0.85;
}
export function exposeLight(base, glow) {
  const clamped = Math.max(0, Math.min(1, base));
  return 1 - (1 - clamped) * Math.exp(-1.25 * glow);
}
export function paneWaveLight(waves, i, j, activePane) {
  let glow = 0;
  for (const wave of waves) {
    const { left, right } = wave;
    const inOwnBand = i >= left && i < right;
    const inOpenWorld = !activePane && i >= right;
    if (!inOwnBand && !inOpenWorld) continue;
    const width = paneWaveGlowWidth(wave, j);
    const e = paneWaveEdge(wave, i, j);
    let amt = Math.abs(e) <= width * 1.8 ? wipeGlow(e, width) * wave.strength : 0;
    if (wave.action === "close" && e > 0) {
      const worldDistance = Math.max(0, i - (right - 1));
      const worldFalloff = Math.exp(-worldDistance / 12);
      const behind = sm(clamp01(e / Math.max(1, width)));
      amt += 0.11 * behind * worldFalloff * wave.strength;
    }
    glow += amt;
  }
  return Math.min(1.25, glow);
}

export function switchBandCenter(progress, rows) {
  const half = CFG.switchBandRows * 0.5;
  const pad = half + CFG.switchFlowRows + CFG.switchFlexRows + 2;
  return (1 - pad) + ((rows - 2 + pad) - (1 - pad)) * progress;
}
export function switchBandEdge(i, j, transition, t, rows) {
  const p = transition.vis;
  const seed = transition.seed;
  const breath = 0.88 + 0.12 * Math.sin(t * 1.8 + transition.phase);
  const center =
    switchBandCenter(p, rows) +
    (fbm(i * 0.13 + seed, t * 0.2, 91.7 + seed) - 0.5) * 2 * CFG.switchFlowRows * breath +
    Math.sin(i * 0.21 + t * 1.25 + transition.phase) * 1.05 +
    Math.sin(i * 0.46 - t * 0.75 + seed) * 0.4;
  const thicknessFlow =
    (fbm(i * 0.14 + seed * 0.5, t * 0.17, 119.3 + seed) - 0.5) * 2 * CFG.switchFlexRows +
    Math.sin(i * 0.27 - t + transition.phase) * 0.7;
  const half = Math.max(CFG.switchBandMinRows * 0.5, CFG.switchBandRows * 0.5 * breath + thicknessFlow);
  return Math.min(j - (center - half), (center + half) - j);
}

/* Trapezoidal velocity: brief acceleration, linear travel, brief stop. */
export function paneGlide(t) {
  const a = CFG.paneAccel;
  const v = 1 / (1 - a);
  if (t < a) return 0.5 * (v / a) * t * t;
  if (t <= 1 - a) return 0.5 * a * v + (t - a) * v;
  const q = 1 - t;
  return 1 - 0.5 * (v / a) * q * q;
}

/* Copy toast and speech bubble use these CSS transitions on the site; the
   film evaluates them as functions of time instead. */
export const cssEase = u => {
  // cubic-bezier(0.25, 0.1, 0.25, 1) ("ease"), solved numerically.
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  let lo = 0, hi = 1, x = u;
  for (let k = 0; k < 24; k++) {
    const s = (lo + hi) / 2;
    const bx = 3 * (1 - s) * (1 - s) * s * 0.25 + 3 * (1 - s) * s * s * 0.25 + s * s * s;
    if (bx < x) lo = s; else hi = s;
  }
  const s = (lo + hi) / 2;
  return 3 * (1 - s) * (1 - s) * s * 0.1 + 3 * (1 - s) * s * s * 1 + s * s * s;
};
