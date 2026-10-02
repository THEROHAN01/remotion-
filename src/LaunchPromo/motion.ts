import { Easing, interpolate, spring, type SpringConfig } from "remotion";

// "Snappy & technical": fast settle, barely any overshoot.
export const SNAPPY: Partial<SpringConfig> = {
  damping: 26,
  stiffness: 260,
  mass: 0.7,
};

// Used for the checkbox pop and the logo, where a small overshoot reads as "satisfying".
export const POP: Partial<SpringConfig> = {
  damping: 11,
  stiffness: 240,
  mass: 0.6,
};

export const STAGGER = 5;

export const enter = (
  frame: number,
  fps: number,
  delay: number,
  config: Partial<SpringConfig> = SNAPPY,
) => spring({ frame: frame - delay, fps, config });

// 0 → 1 over the last `length` frames of a scene, ease-in so content accelerates away.
export const exit = (frame: number, sceneDuration: number, length = 10) =>
  interpolate(frame, [sceneDuration - length, sceneDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.7, 0, 0.84, 0),
  });

export const mix = (color: string, percent: number, other = "transparent") =>
  `color-mix(in srgb, ${color} ${percent}%, ${other})`;

// Splits the total duration with the same ratios as the original 30s cut (3 / 9 / 10 / 8).
export const sceneTimings = (durationInFrames: number) => {
  const intro = Math.round(durationInFrames * (3 / 30));
  const features = Math.round(durationInFrames * (9 / 30));
  const phone = Math.round(durationInFrames * (10 / 30));
  const outro = durationInFrames - intro - features - phone;
  return { intro, features, phone, outro };
};
