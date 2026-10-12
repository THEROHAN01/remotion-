// Synthesise the film's sound from the timeline's cue list (window.film.cues), so
// sound and picture come from one source of truth. Deterministic: seeded noise, no samples.
//   node tools/sound.mjs <landscape|portrait> <out.wav>
// Kept quiet on purpose: master peak is limited to PEAK_DB and the bed is sparse.
import { writeFile } from "node:fs/promises";
import { openFilm } from "./browser.mjs";

const [format, outPath] = process.argv.slice(2);
const SR = 48000, PEAK_DB = -9;

const film = await openFilm(format);
const { duration } = film.info;
const cues = await film.page.evaluate(() => window.film.cues);
await film.close();

const N = Math.ceil(duration * SR);
const L = new Float32Array(N), R = new Float32Array(N);
let seed = 0x2f6e2b1;
const noise = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 31) - 1;

// Notes: A minor pentatonic, the five letters of ROHAN climb it.
const PENT = [440, 523.25, 587.33, 659.25, 783.99];
function add(t0, len, gain, pan, fn) {
  const s0 = Math.max(0, Math.round(t0 * SR)), n = Math.min(N - s0, Math.round(len * SR));
  const gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
  for (let k = 0; k < n; k++) { const v = fn(k / SR, k); L[s0 + k] += v * gl; R[s0 + k] += v * gr; }
}
const sine = f => t => Math.sin(2 * Math.PI * f * t);
const attack = (t, a) => Math.min(1, t / a);

const SYNTH = {
  // Hook heartbeat: a soft low thump on the beat.
  pulse: c => add(c.t, 0.4, 0.2 * (c.gain ?? 1), 0, t => attack(t, 0.004) * Math.exp(-t * 11) * Math.sin(2 * Math.PI * (52 + 30 * Math.exp(-t * 30)) * t)),
  // Trackpad click: a tiny filtered tick.
  click: c => { let y = 0; add(c.t, 0.03, 0.22, 0.1, t => { y += 0.5 * (noise() - y); return y * Math.exp(-t * 260) + 0.4 * Math.sin(2 * Math.PI * 2100 * t) * Math.exp(-t * 300); }); },
  tap: c => add(c.t, 0.05, 0.2, 0, t => Math.sin(2 * Math.PI * 900 * t) * Math.exp(-t * 120)),
  // Tiles waking: low-passed noise rising, with a soft fifth underneath.
  swell: c => {
    const len = c.soft ? 1.0 : 1.4, g = c.soft ? 0.09 : 0.14; let y = 0;
    add(c.t - 0.15, len, g, 0, t => {
      const u = t / len, env = Math.sin(Math.PI * Math.min(1, u)) ** 2;
      y += (0.02 + 0.2 * u) * (noise() - y);
      return env * (y * 1.6 + 0.35 * Math.sin(2 * Math.PI * 220 * t) + 0.2 * Math.sin(2 * Math.PI * 330 * t));
    });
  },
  pluck: c => {
    const f = PENT[c.note % 5], g = c.soft ? 0.09 : 0.13;
    add(c.t, 0.9, g, -0.4 + c.note * 0.2, t => attack(t, 0.003) * Math.exp(-t * 6) * (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t) * Math.exp(-t * 10)));
  },
  // Speech bubble / hint: a two-step blip.
  blip: c => add(c.t, 0.12, 0.07, 0.25, t => attack(t, 0.003) * Math.exp(-t * 30) * Math.sin(2 * Math.PI * (t < 0.04 ? 1320 : 1760) * t)),
  // Pane wave: a noise sweep across the wall, rising (open) or falling (close).
  wave: c => {
    let y = 0; const len = c.dur;
    add(c.t, len, 0.11, c.down ? 0.3 : -0.3, t => {
      const u = t / len, cut = c.down ? 0.12 - 0.1 * u : 0.02 + 0.1 * u;
      y += cut * (noise() - y);
      return Math.sin(Math.PI * u) ** 2 * y * 2.2;
    });
  },
  swipe: c => { let y = 0; const len = Math.max(0.3, c.dur); add(c.t, len, 0.08, 0, t => { const u = t / len; y += (0.03 + 0.06 * u) * (noise() - y); return Math.sin(Math.PI * u) ** 2 * y * 2; }); },
  // Email copied: a quick upward arpeggio.
  sparkle: c => [0, 2, 4].forEach((n, i) => add(c.t + 0.05 + i * 0.07, 0.6, 0.06, -0.3 + i * 0.3, t => attack(t, 0.002) * Math.exp(-t * 9) * sine(PENT[n] * 2)(t))),
  // Lockup: a held A-major-add9 chord.
  chord: c => [220, 277.18, 329.63, 440, 493.88].forEach((f, i) =>
    add(c.t + i * 0.025, 4.6, 0.055, -0.5 + i * 0.25, t => attack(t, 0.02) * Math.exp(-t * 0.75) * (sine(f)(t) + 0.25 * sine(f * 2)(t) * Math.exp(-t * 2))))
};
for (const c of cues) { if (!SYNTH[c.kind]) throw new Error("no synth for cue " + c.kind); SYNTH[c.kind](c); }

// Small room: a few feedback delays per channel, mixed low.
function room(x, taps) {
  const out = Float32Array.from(x);
  for (const [ms, g] of taps) { const d = Math.round(ms * SR / 1000); for (let k = d; k < N; k++) out[k] += g * out[k - d]; }
  return out;
}
const wL = room(L, [[37, 0.28], [83, 0.18]]), wR = room(R, [[41, 0.28], [89, 0.18]]);
for (let k = 0; k < N; k++) { L[k] = 0.82 * L[k] + 0.18 * wL[k]; R[k] = 0.82 * R[k] + 0.18 * wR[k]; }

// Fade the tail into the last frame, then scale to the peak target.
const fade = Math.round(0.8 * SR);
for (let k = 0; k < fade; k++) { const g = k / fade; L[N - 1 - k] *= g; R[N - 1 - k] *= g; }
let peak = 0; for (let k = 0; k < N; k++) peak = Math.max(peak, Math.abs(L[k]), Math.abs(R[k]));
const scale = 10 ** (PEAK_DB / 20) / peak;

const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVEfmt ", 8);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let k = 0; k < N; k++) {
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[k] * scale)) * 32767), 44 + k * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[k] * scale)) * 32767), 46 + k * 4);
}
await writeFile(outPath, buf);
console.log(`${cues.length} cues → ${outPath} (${duration}s, peak ${PEAK_DB} dBFS)`);
