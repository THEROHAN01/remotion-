import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Img,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fonts } from "../shared/fonts";
import { clamp, enter, fitFontSize, mix } from "../shared/motion";
import { Sfx } from "../shared/sfx";
import type { Beat, KineticTypeProps } from "./schema";

type BeatProps = {
  readonly beat: Beat;
  readonly colors: KineticTypeProps["colors"];
};

// WCAG relative luminance for #rgb/#rrggbb; null for other color formats.
const luminance = (color: string) => {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return null;
  const hex = m[1].length === 3 ? m[1].replace(/./g, "$&$&") : m[1];
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: number, b: number) =>
  (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

// Text color for type sitting on the accent: whichever palette color reads better.
const onAccent = (colors: KineticTypeProps["colors"]) => {
  const [acc, txt, bg] = [colors.accent, colors.text, colors.background].map(
    luminance,
  );
  if (acc === null || txt === null || bg === null) return colors.background;
  return contrast(acc, txt) > contrast(acc, bg)
    ? colors.text
    : colors.background;
};

const SLAM = { damping: 14, stiffness: 280, mass: 0.6 };
const EM = 0.57; // Space Grotesk bold, uppercase: average glyph width in em

const useBox = () => {
  const { width, height } = useVideoConfig();
  const s = Math.min(width, height) / 1080;
  return {
    width,
    height,
    s,
    padX: 80 * s,
    padY: 100 * s,
    maxW: width - 160 * s,
  };
};

const base: React.CSSProperties = {
  fontFamily: fonts.spaceGrotesk,
  fontWeight: 700,
  letterSpacing: "-0.04em",
  lineHeight: 0.92,
  textTransform: "uppercase",
};

const lines = (text: string) =>
  text
    .split("/")
    .map((l) => l.trim())
    .filter(Boolean);

// Fits the longest line to the width and the stack of lines to the height.
const fitLines = (ls: string[], maxW: number, maxH: number, max: number) => {
  const longest = ls.reduce((a, b) => (b.length > a.length ? b : a), "");
  return Math.min(
    fitFontSize(longest, maxW, EM, max),
    Math.floor(maxH / (ls.length * 0.98)),
  );
};

const Flash: React.FC<{ color: string }> = ({ color }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: color,
        opacity: interpolate(frame, [0, 3], [0.85, 0], clamp),
      }}
    />
  );
};

export const Slam: React.FC<BeatProps> = ({ beat, colors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { maxW, height, s } = useBox();
  const p = enter(frame, fps, 0, SLAM);
  const fontSize = fitLines([beat.text], maxW, height * 0.6, 420 * s);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          ...base,
          fontSize,
          color: colors.text,
          scale: interpolate(p, [0, 1], [1.5, 1]),
        }}
      >
        {beat.text}
      </div>
      <Flash color={colors.text} />
      <Sfx name="impact-heavy" at={0} volume={0.75} />
      <Sfx name="sub-drop" at={0} volume={0.45} />
    </AbsoluteFill>
  );
};

export const Stack: React.FC<BeatProps> = ({ beat, colors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { maxW, height, padX, padY, s } = useBox();
  const ls = lines(beat.text);
  const fontSize = fitLines(ls, maxW, height - 2 * padY, 360 * s);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        justifyContent: "center",
        padding: `${padY}px ${padX}px`,
      }}
    >
      {ls.map((l, i) => {
        const p = enter(frame, fps, i * 6);
        return (
          <div
            key={i}
            style={{ overflow: "hidden", paddingBottom: fontSize * 0.04 }}
          >
            <div
              style={{
                ...base,
                fontSize,
                color: i === ls.length - 1 ? colors.accent : colors.text,
                translate: `0px ${(1 - p) * 110}%`,
              }}
            >
              {l}
            </div>
          </div>
        );
      })}
      {ls.map((_, i) => (
        <Sfx key={`sfx${i}`} name="click" at={i * 6} volume={0.55} />
      ))}
    </AbsoluteFill>
  );
};

export const Invert: React.FC<BeatProps> = ({ beat, colors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { maxW, height, s } = useBox();
  const p = enter(frame, fps, 0, SLAM);
  const ls = lines(beat.text);
  const fontSize = fitLines(ls, maxW, height * 0.7, 440 * s);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.accent,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {ls.map((l, i) => (
        <div
          key={i}
          style={{
            ...base,
            fontSize,
            color: onAccent(colors),
            textAlign: "center",
            scale: interpolate(p, [0, 1], [0.55, 1]),
          }}
        >
          {l}
        </div>
      ))}
      <Sfx name="thud-soft" at={0} volume={0.65} />
      <Sfx name="sub-drop" at={0} volume={0.45} />
    </AbsoluteFill>
  );
};

export const Wipe: React.FC<BeatProps> = ({ beat, colors }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { maxW, height, padX, padY, s } = useBox();
  const frags = lines(beat.text);
  const per = durationInFrames / frags.length;
  const index = Math.min(frags.length - 1, Math.floor(frame / per));
  const local = frame - index * per;
  const fromLeft = index % 2 === 0;
  const reveal = interpolate(local, [0, 9], [100, 0], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const words = frags[index].split(/\s+/);
  const fontSize = fitLines(words, maxW, height - 2 * padY, 320 * s);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        justifyContent: "center",
        alignItems: fromLeft ? "flex-start" : "flex-end",
        padding: `${padY}px ${padX}px`,
      }}
    >
      <div
        style={{
          clipPath: fromLeft
            ? `inset(0 ${reveal}% 0 0)`
            : `inset(0 0 0 ${reveal}%)`,
          textAlign: fromLeft ? "left" : "right",
        }}
      >
        {words.map((w, i) => (
          <div
            key={i}
            style={{
              ...base,
              fontSize,
              color:
                index % 2 === 1 && i === words.length - 1
                  ? colors.accent
                  : colors.text,
            }}
          >
            {w}
          </div>
        ))}
      </div>
      {frags.map((_, i) => (
        <Sfx
          key={`sfx${i}`}
          name={i % 2 === 0 ? "whoosh-lr" : "whoosh-rl"}
          at={i * per}
          volume={0.55}
        />
      ))}
    </AbsoluteFill>
  );
};

export const Shatter: React.FC<BeatProps> = ({ beat, colors }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { maxW, height, s } = useBox();
  const p = enter(frame, fps, 0, SLAM);
  const breakAt = Math.round(durationInFrames * 0.55);
  const chars = beat.text.split("");
  const fontSize = fitLines([beat.text], maxW, height * 0.7, 640 * s);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", scale: interpolate(p, [0, 1], [0.4, 1]) }}>
        {chars.map((c, i) => {
          const t = interpolate(
            frame,
            [breakAt + i * 2, breakAt + i * 2 + 14],
            [0, 1],
            {
              ...clamp,
              easing: Easing.bezier(0.5, 0, 0.75, 0),
            },
          );
          const angle = random(`${beat.text}-a-${i}`) * Math.PI * 2;
          const dist = (0.6 + random(`${beat.text}-d-${i}`)) * fontSize * 2.2;
          return (
            <div
              key={i}
              style={{
                ...base,
                fontSize,
                whiteSpace: "pre",
                color: colors.accent,
                translate: `${Math.cos(angle) * dist * t}px ${Math.sin(angle) * dist * t}px`,
                rotate: `${(random(`${beat.text}-r-${i}`) - 0.5) * 220 * t}deg`,
                opacity: 1 - t,
              }}
            >
              {c}
            </div>
          );
        })}
      </div>
      <Sfx name="impact-heavy" at={0} volume={0.6} />
      <Sfx name="glass-shatter" at={breakAt} volume={0.9} />
    </AbsoluteFill>
  );
};

export const Highlight: React.FC<BeatProps> = ({ beat, colors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { maxW, height, padX, padY, s } = useBox();
  const ls = lines(beat.text);
  const fontSize = Math.min(
    fitLines(ls, maxW, height - 2 * padY, 200 * s),
    180 * s,
  );
  const accent = beat.accentWord?.toUpperCase();
  const markAt = ls.length * 6 + 8;
  const mark = interpolate(frame, [markAt, markAt + 12], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        justifyContent: "center",
        padding: `${padY}px ${padX}px`,
      }}
    >
      {ls.map((l, i) => {
        const p = enter(frame, fps, i * 6);
        return (
          <div
            key={i}
            style={{
              display: "flex",
              flexWrap: "wrap",
              columnGap: fontSize * 0.25,
              opacity: p,
              translate: `0px ${(1 - p) * 40}px`,
            }}
          >
            {l.split(/\s+/).map((w, wi) => {
              const isAccent =
                accent !== undefined &&
                w.toUpperCase().replace(/[^\p{L}\p{N}]/gu, "") === accent;
              return (
                <span
                  key={wi}
                  style={{
                    ...base,
                    fontSize,
                    position: "relative",
                    zIndex: 0,
                    color:
                      isAccent && mark > 0.5 ? onAccent(colors) : colors.text,
                  }}
                >
                  {isAccent ? (
                    <span
                      style={{
                        position: "absolute",
                        inset: `${fontSize * 0.04}px ${-fontSize * 0.08}px`,
                        backgroundColor: colors.accent,
                        transformOrigin: "left center",
                        scale: `${mark} 1`,
                        zIndex: -1,
                      }}
                    />
                  ) : null}
                  {w}
                </span>
              );
            })}
          </div>
        );
      })}
      {ls.map((_, i) => (
        <Sfx key={`sfx${i}`} name="tick" at={i * 6} volume={0.45} />
      ))}
      <Sfx name="marker" at={markAt} volume={0.6} />
    </AbsoluteFill>
  );
};

export const Outro: React.FC<{
  brandName: string;
  logo?: string;
  logoBackground?: string;
  showBrandName: boolean;
  url?: string;
  cta: string;
  colors: KineticTypeProps["colors"];
}> = ({ brandName, logo, logoBackground, showBrandName, url, cta, colors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { s, maxW } = useBox();
  const mark = enter(frame, fps, 0, { damping: 12, stiffness: 220, mass: 0.6 });
  const nameIn = enter(frame, fps, 6);
  const ctaIn = enter(frame, fps, 12);
  const urlIn = enter(frame, fps, 18);
  // Same spring for the logo and the letter mark; the logo rotates less because it is wide.
  const markMotion = {
    scale: interpolate(mark, [0, 1], [0.2, 1]),
    rotate: `${(1 - mark) * (logo ? 12 : 90)}deg`,
  };
  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        justifyContent: "center",
        alignItems: "center",
        gap: 40 * s,
      }}
    >
      {logo ? (
        <div
          style={{
            padding: logoBackground ? `${44 * s}px ${64 * s}px` : 0,
            borderRadius: 48 * s,
            backgroundColor: logoBackground ?? "transparent",
            boxShadow: logoBackground
              ? `0 30px 90px ${mix(colors.accent, 45)}`
              : undefined,
            ...markMotion,
          }}
        >
          <Img
            src={staticFile(logo)}
            style={{
              display: "block",
              width: Math.min(maxW * 0.66, 600 * s),
              height: Math.min(maxW * 0.46, 414 * s),
              objectFit: "contain",
            }}
          />
        </div>
      ) : (
        <div
          style={{
            ...base,
            width: 240 * s,
            height: 240 * s,
            borderRadius: 48 * s,
            backgroundColor: colors.accent,
            color: colors.background,
            fontSize: 170 * s,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
            ...markMotion,
          }}
        >
          {brandName.charAt(0)}
        </div>
      )}
      {showBrandName ? (
        <div
          style={{
            ...base,
            fontSize: fitFontSize(brandName, maxW, EM, 190 * s),
            color: colors.text,
            opacity: nameIn,
            translate: `0px ${(1 - nameIn) * 30}px`,
          }}
        >
          {brandName}
        </div>
      ) : null}
      <div
        style={{
          fontFamily: fonts.spaceGrotesk,
          fontWeight: 600,
          fontSize: (logo ? 64 : 58) * s,
          color: logo ? colors.background : colors.text,
          backgroundColor: logo ? colors.text : "transparent",
          border: `3px solid ${colors.text}`,
          borderRadius: 999,
          padding: `${20 * s}px ${48 * s}px`,
          opacity: ctaIn,
          translate: `0px ${(1 - ctaIn) * 30}px`,
        }}
      >
        {cta}
      </div>
      <Sfx name="chime" at={0} volume={0.65} />
      <Sfx name="pop" at={12} volume={0.6} />
      {url ? <Sfx name="tick" at={18} volume={0.4} /> : null}
      {url ? (
        <div
          style={{
            marginTop: -16 * s,
            fontFamily: fonts.spaceGrotesk,
            fontWeight: 500,
            fontSize: Math.min(44 * s, maxW / (url.length * 0.55)),
            letterSpacing: "0.01em",
            whiteSpace: "nowrap",
            color: mix(colors.text, 75, colors.background),
            opacity: urlIn,
            translate: `0px ${(1 - urlIn) * 20}px`,
          }}
        >
          {url}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
