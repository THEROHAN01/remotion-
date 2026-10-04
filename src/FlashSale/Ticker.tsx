import type React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { fonts } from "../shared/fonts";
import { clamp, enter } from "../shared/motion";

const STEP_EVERY = 24;

// A marquee band that advances in eased steps (no constant linear scroll).
export const Ticker: React.FC<{
  readonly text: string;
  readonly background: string;
  readonly color: string;
  readonly top: boolean;
}> = ({ text, background, color, top }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const s = width / 1080;
  const fontSize = 64 * s;
  const item = `${text.toUpperCase()}  ✦  `;
  // Rough width of one item; the band repeats it enough times to always cover the frame.
  const itemWidth = item.length * fontSize * 0.5;
  const repeats = Math.ceil((width * 1.6) / itemWidth) + 2;

  const step = Math.floor(frame / STEP_EVERY);
  const within = interpolate(frame % STEP_EVERY, [0, 10], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });
  const offset = ((step + within) * itemWidth * 0.5) % itemWidth;

  const p = enter(frame, fps, top ? 0 : 4);
  const dir = top ? 1 : -1;

  return (
    <div
      style={{
        position: "absolute",
        left: -width * 0.2,
        right: -width * 0.2,
        [top ? "top" : "bottom"]: 70 * s,
        height: 104 * s,
        backgroundColor: background,
        rotate: `${top ? -3 : -3}deg`,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        translate: `${(1 - p) * -dir * width * 1.4}px 0px`,
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
      }}
    >
      <div
        style={{
          whiteSpace: "pre",
          fontFamily: fonts.anton,
          fontSize,
          letterSpacing: "0.02em",
          color,
          translate: `${dir * offset - itemWidth}px 0px`,
        }}
      >
        {item.repeat(repeats)}
      </div>
    </div>
  );
};
