// The film's single motion language: one damped spring, three durations,
// one stagger, one beat.
export const BEAT = 0.6;                         // 100 BPM
export const DUR = { short: 0.36, mid: 0.72, long: 1.3 };
export const STAGGER = 0.07;

const Z = 0.82, W = 7.2, WD = W * Math.sqrt(1 - Z * Z);
const raw = u => 1 - Math.exp(-Z * W * u) * (Math.cos(WD * u) + (Z / Math.sqrt(1 - Z * Z)) * Math.sin(WD * u));
const END = raw(1);
/* Damped spring step response on 0..1, ~1 % follow-through overshoot. */
export const spring = u => u <= 0 ? 0 : u >= 1 ? 1 : raw(u) / END;
/* Same spring with a small wind-up for big moves (anticipation). */
export const springA = u => {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  const wind = u < 0.2 ? -0.035 * Math.sin(Math.PI * u / 0.2) : 0;
  return spring(u) + wind;
};
export const clamp01 = u => u < 0 ? 0 : u > 1 ? 1 : u;
export const lerp = (a, b, u) => a + (b - a) * u;
/* Progress of an entrance that starts at t0 and lasts dur. */
export const enter = (t, t0, dur = DUR.mid) => spring(clamp01((t - t0) / dur));

/**
 * Keyframe track: each key says "arrive at value by time t, moving over dur".
 * Between arrivals the value holds. `fields` are interpolated with `ease`.
 */
export function track(keys, fields, ease = spring) {
  const ks = keys.slice().sort((a, b) => a.t - b.t);
  return t => {
    if (t <= ks[0].t) return pick(ks[0]);
    for (let k = 1; k < ks.length; k++) {
      const a = ks[k - 1], b = ks[k];
      const start = b.t - (b.dur ?? 0.6);
      if (t < start) return pick(a);
      if (t < b.t) {
        const u = (b.ease || ease)(clamp01((t - start) / (b.t - start)));
        const out = {};
        for (const f of fields) out[f] = lerp(a[f], b[f], u);
        return out;
      }
    }
    return pick(ks[ks.length - 1]);
  };
  function pick(k) { const o = {}; for (const f of fields) o[f] = k[f]; return o; }
}
