import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { mix } from "../shared/motion";

// Faint technical grid + an accent glow that drifts (eased) between scene focal points.
export const Background: React.FC<{
  readonly background: string;
  readonly accent: string;
  readonly text: string;
}> = ({ background, accent, text }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const d = durationInFrames;

  const glowY = interpolate(
    frame,
    [0, d * 0.1, d * 0.4, d * 0.73, d],
    [38, 30, 55, 42, 45],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.65, 0, 0.35, 1),
    },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: background }}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${mix(text, 5)} 1px, transparent 1px), linear-gradient(90deg, ${mix(text, 5)} 1px, transparent 1px)`,
          backgroundSize: "90px 90px",
          backgroundPosition: "-1px -1px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle 720px at 50% ${glowY}%, ${mix(accent, 26)}, transparent 70%)`,
        }}
      />
    </AbsoluteFill>
  );
};
