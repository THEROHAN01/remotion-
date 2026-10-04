import type React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { fonts } from "../shared/fonts";
import { clamp, mix } from "../shared/motion";

const pad = (n: number) => String(n).padStart(2, "0");

const Digit: React.FC<{
  readonly value: string;
  readonly changedAt: number;
  readonly size: number;
  readonly color: string;
  readonly box: string;
}> = ({ value, changedAt, size, color, box }) => {
  const frame = useCurrentFrame();
  const flip = interpolate(frame, [changedAt, changedAt + 7], [-90, 0], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <div
      style={{
        width: size * 0.72,
        height: size * 1.1,
        borderRadius: size * 0.14,
        backgroundColor: box,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: size * 4,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          fontFamily: fonts.anton,
          fontSize: size,
          lineHeight: 1,
          color,
          transform: `rotateX(${flip}deg)`,
          transformOrigin: "50% 50%",
        }}
      >
        {value}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          height: Math.max(2, size * 0.02),
          backgroundColor: "rgba(0,0,0,0.35)",
        }}
      />
    </div>
  );
};

// Counts down from `startSeconds`, one tick per second of video.
export const FlipClock: React.FC<{
  readonly startSeconds: number;
  readonly size: number;
  readonly color: string;
  readonly accent: string;
}> = ({ startSeconds, size, color, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const elapsed = Math.floor(frame / fps);
  const remaining = Math.max(0, startSeconds - elapsed);
  const prev = Math.max(0, startSeconds - elapsed + 1);
  const tickFrame = elapsed * fps;

  const parts = (t: number) =>
    [Math.floor(t / 3600), Math.floor((t % 3600) / 60), t % 60]
      .map(pad)
      .join("");
  const now = parts(remaining);
  const before = elapsed === 0 ? now : parts(prev);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.1 }}>
      {now.split("").map((d, i) => (
        <div
          key={i}
          style={{ display: "flex", alignItems: "center", gap: size * 0.1 }}
        >
          {i > 0 && i % 2 === 0 ? (
            <div
              style={{
                fontFamily: fonts.anton,
                fontSize: size * 0.8,
                color: accent,
                marginBottom: size * 0.08,
              }}
            >
              :
            </div>
          ) : null}
          <Digit
            value={d}
            changedAt={before[i] !== d ? tickFrame : -100}
            size={size}
            color={color}
            box={mix(color, 10, "black")}
          />
        </div>
      ))}
    </div>
  );
};
