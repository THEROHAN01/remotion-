import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Icon } from "./Icon";
import { enter, exit, mix, STAGGER } from "./motion";
import type { LaunchPromoProps } from "./schema";

export const FeaturesScene: React.FC<{
  readonly features: LaunchPromoProps["features"];
  readonly accent: string;
  readonly text: string;
  readonly background: string;
}> = ({ features, accent, text, background }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // After all cards are in, spotlight each one in turn so the hold stays alive.
  const spotlightStart = 30;
  const spotlightLength =
    (durationInFrames - spotlightStart - 20) / features.length;

  return (
    <AbsoluteFill
      style={{
        padding: "100px 80px",
        justifyContent: "center",
        gap: 40,
      }}
    >
      {features.map((feature, i) => {
        const p = enter(frame, fps, 4 + i * STAGGER);
        const exitP = exit(frame, durationInFrames - (features.length - 1 - i) * 3);
        const spotStart = spotlightStart + i * spotlightLength;
        const spot = interpolate(
          frame,
          [spotStart, spotStart + 10, spotStart + spotlightLength, spotStart + spotlightLength + 10],
          [0, 1, 1, 0],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.33, 1, 0.68, 1),
          },
        );

        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 40,
              padding: "44px 48px",
              borderRadius: 40,
              backgroundColor: mix(text, 5 + spot * 3, background),
              border: `2px solid ${mix(accent, 18 + spot * 62, mix(text, 10))}`,
              boxShadow: `0 30px 80px ${mix(accent, spot * 30)}`,
              opacity: p * (1 - exitP),
              translate: `${-80 * exitP}px ${(1 - p) * 220}px`,
              scale: 0.94 + p * 0.06 + spot * 0.02,
            }}
          >
            <div
              style={{
                flexShrink: 0,
                width: 132,
                height: 132,
                borderRadius: 34,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: mix(accent, 18 + spot * 82, background),
              }}
            >
              <Icon
                name={feature.icon}
                size={72}
                color={spot > 0.5 ? text : mix(accent, 40, text)}
              />
            </div>
            <div
              style={{
                fontSize: 60,
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                color: text,
                overflowWrap: "anywhere",
              }}
            >
              {feature.title}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
