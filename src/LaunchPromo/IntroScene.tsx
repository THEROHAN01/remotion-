import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { enter, exit, mix, STAGGER } from "./motion";

const WORD_GAP = STAGGER + 1;

export const IntroScene: React.FC<{
  readonly headline: string;
  readonly accent: string;
  readonly text: string;
}> = ({ headline, accent, text }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width } = useVideoConfig();

  // One line per sentence ("Stop planning." / "Start executing."), sized so the longest fits.
  const lines = (headline.match(/[^.!?]+[.!?]*/g) ?? [headline])
    .map((l) => l.trim().split(/\s+/).filter(Boolean))
    .filter((l) => l.length > 0);
  const words = lines.flat();
  const longestLine = Math.max(...lines.map((l) => l.join(" ").length));
  const contentWidth = width - 160;
  const fontSize = Math.max(
    72,
    Math.min(124, Math.floor(contentWidth / (longestLine * 0.52))),
  );

  const typedAt = (i: number) => i * WORD_GAP;
  const lastWordAt = typedAt(words.length - 1);
  const underlineStart = lastWordAt + 6;

  const cursorIndex = words.filter((_, i) => frame >= typedAt(i)).length;
  const cursorVisible =
    frame < underlineStart + 6 || Math.floor(frame / 12) % 2 === 0;

  const out = exit(frame, durationInFrames);

  return (
    <AbsoluteFill
      style={{
        padding: "100px 80px",
        justifyContent: "center",
        opacity: 1 - out,
        translate: `0px ${-60 * out}px`,
      }}
    >
      <div style={{ position: "relative", alignSelf: "flex-start" }}>
        <div
          style={{
            fontSize,
            fontWeight: 800,
            lineHeight: 1.06,
            letterSpacing: "-0.035em",
            color: text,
          }}
        >
          {lines.map((line, li) => {
            const offset = lines.slice(0, li).flat().length;
            return (
              <div
                key={li}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  columnGap: fontSize * 0.26,
                }}
              >
                {line.map((word, wi) => {
                  const i = offset + wi;
                  const p = enter(frame, fps, typedAt(i));
                  return (
                    <span
                      key={wi}
                      style={{
                        position: "relative",
                        opacity: frame >= typedAt(i) ? 1 : 0,
                        translate: `0px ${(1 - p) * 28}px`,
                        filter: `blur(${(1 - p) * 6}px)`,
                      }}
                    >
                      {word}
                      {i === cursorIndex - 1 && cursorVisible ? (
                        <span
                          style={{
                            position: "absolute",
                            right: -fontSize * 0.16,
                            top: "12%",
                            width: fontSize * 0.07,
                            height: "78%",
                            backgroundColor: accent,
                          }}
                        />
                      ) : null}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: fontSize * 0.28,
            height: Math.max(10, fontSize * 0.1),
            borderRadius: 999,
            background: `linear-gradient(90deg, ${accent}, ${mix(accent, 55, "white")})`,
            boxShadow: `0 0 40px ${mix(accent, 70)}`,
            transformOrigin: "left center",
            scale: `${interpolate(frame, [underlineStart, underlineStart + 16], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            })} 1`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
