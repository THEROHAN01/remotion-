import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fonts } from "../shared/fonts";
import { clamp, mix } from "../shared/motion";

// Animated film grain: SVG turbulence with a new seed on every stepped frame.
export const Grain: React.FC<{
  readonly amount: number;
  readonly step: number;
  readonly seed: number;
}> = ({ amount, step, seed }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const n = Math.floor(frame / Math.max(1, Math.round(step / 2)));
  return (
    <AbsoluteFill
      style={{
        mixBlendMode: "overlay",
        opacity: amount,
        pointerEvents: "none",
      }}
    >
      <svg width={width} height={height}>
        <filter id={`grain-${n}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            seed={seed + n}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={width} height={height} filter={`url(#grain-${n})`} />
      </svg>
    </AbsoluteFill>
  );
};

// Occasional vertical scratches and dust specks.
export const Scratches: React.FC<{
  readonly seed: number;
  readonly color: string;
}> = ({ seed, color }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const marks = [0, 1, 2].filter(
    (i) => random(`${seed}-sc-${frame}-${i}`) > 0.8,
  );
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {marks.map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: random(`${seed}-sx-${frame}-${i}`) * width,
            top: 0,
            width: 1 + random(`${seed}-sw-${frame}-${i}`) * 2,
            height,
            backgroundColor: mix(color, 35),
            rotate: `${(random(`${seed}-sr-${frame}-${i}`) - 0.5) * 1.2}deg`,
          }}
        />
      ))}
      {random(`${seed}-dust-${frame}`) > 0.7 ? (
        <div
          style={{
            position: "absolute",
            left: random(`${seed}-dx-${frame}`) * width,
            top: random(`${seed}-dy-${frame}`) * height,
            width: 6 + random(`${seed}-ds-${frame}`) * 10,
            height: 4 + random(`${seed}-dh-${frame}`) * 8,
            borderRadius: "50%",
            backgroundColor: mix("black", 55),
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

// Warm light leak that drifts across the frame; `boost` adds extra exposure.
export const LightLeak: React.FC<{
  readonly accent: string;
  readonly boost?: number;
}> = ({ accent, boost = 0 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const x = interpolate(frame, [0, 30, durationInFrames], [-20, 30, 110], {
    ...clamp,
    easing: Easing.bezier(0.45, 0, 0.55, 1),
  });
  const base = interpolate(frame, [0, 6, 30, 50], [0, 0.85, 0.7, 0.22], clamp);
  return (
    <AbsoluteFill
      style={{
        mixBlendMode: "screen",
        opacity: Math.min(1, base + boost),
        background: `radial-gradient(ellipse 45% 70% at ${x}% 30%, ${mix("#FFB36B", 90)}, transparent 70%), radial-gradient(ellipse 30% 50% at ${x - 18}% 80%, ${mix(accent, 70)}, transparent 70%)`,
        pointerEvents: "none",
      }}
    />
  );
};

// Classic 3-2-1 film leader with a sweeping wedge and exposure pops.
export const Leader: React.FC<{
  readonly paper: string;
  readonly background: string;
  readonly seed: number;
}> = ({ paper, background, seed }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const u = Math.min(width, height);
  const per = durationInFrames / 3;
  const n = 3 - Math.min(2, Math.floor(frame / per));
  const sweep = ((frame % per) / per) * 360;
  const pop = random(`${seed}-pop-${frame}`) > 0.86 ? 0.22 : 0;
  return (
    <AbsoluteFill
      style={{
        backgroundColor: background,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: u * 0.62,
          height: u * 0.62,
          borderRadius: "50%",
          background: `conic-gradient(${mix(paper, 22)} ${sweep}deg, transparent ${sweep}deg)`,
          border: `${u * 0.006}px solid ${mix(paper, 60)}`,
          boxShadow: `0 0 0 ${u * 0.05}px ${background}, 0 0 0 ${u * 0.056}px ${mix(paper, 40)}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: u * 0.004,
          backgroundColor: mix(paper, 40),
        }}
      />
      <div
        style={{
          position: "absolute",
          height: "100%",
          width: u * 0.004,
          backgroundColor: mix(paper, 40),
        }}
      />
      <div
        style={{
          fontFamily: fonts.anton,
          fontSize: u * 0.42,
          lineHeight: 1,
          color: paper,
        }}
      >
        {n}
      </div>
      <AbsoluteFill style={{ backgroundColor: paper, opacity: pop }} />
    </AbsoluteFill>
  );
};

// Film burn: a hot bloom from one corner, then fade to warm black.
export const Burn: React.FC<{
  readonly background: string;
  readonly accent: string;
}> = ({ background, accent }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const bloom = interpolate(frame, [0, durationInFrames * 0.6], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.5, 0, 0.75, 0),
  });
  const black = interpolate(
    frame,
    [durationInFrames * 0.45, durationInFrames * 0.9],
    [0, 1],
    clamp,
  );
  return (
    <>
      <AbsoluteFill
        style={{
          mixBlendMode: "screen",
          background: `radial-gradient(circle at 88% 12%, #FFF4DC ${bloom * 18}%, ${mix("#FF9A3C", 95)} ${bloom * 45}%, ${mix(accent, 60)} ${bloom * 75}%, transparent ${bloom * 110}%)`,
        }}
      />
      <AbsoluteFill style={{ backgroundColor: background, opacity: black }} />
    </>
  );
};
