import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fonts } from "../shared/fonts";
import { clamp, enter, exit, mix, STAGGER } from "../shared/motion";
import type { Slide, StatStoryProps } from "./schema";

type Colors = StatStoryProps["colors"];
type SlideOf<T extends Slide["type"]> = Extract<Slide, { type: T }>;

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

export const useLayout = () => {
  const { width, height } = useVideoConfig();
  const s = Math.min(width, height) / 1080;
  const portrait = height > width;
  const padX = (portrait ? 80 : 140) * s;
  const padY = (portrait ? 200 : 130) * s; // leaves room for the brand + source chrome
  return {
    width,
    height,
    s,
    portrait,
    padX,
    padY,
    innerW: width - 2 * padX,
    innerH: height - 2 * padY,
  };
};

// Rounds a raw axis step up to 1, 2, 2.5 or 5 × 10^n so tick labels are round numbers.
const niceStep = (raw: number) => {
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow;
};

const fmt = (v: number, decimals = 0) =>
  v.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

// Shared frame: content fades/rises in, and eases out at the end of every slide.
const Frame: React.FC<{
  children: React.ReactNode;
  title?: string;
  colors: Colors;
  justify?: "center" | "flex-start";
}> = ({ children, title, colors, justify = "center" }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { s, padX, padY } = useLayout();
  const titleIn = enter(frame, fps, 0);
  const out = exit(frame, durationInFrames, 10);
  return (
    <AbsoluteFill
      style={{
        padding: `${padY}px ${padX}px`,
        justifyContent: justify,
        gap: 48 * s,
        opacity: 1 - out,
        translate: `0px ${-30 * s * out}px`,
      }}
    >
      {title ? (
        <div
          style={{
            fontFamily: fonts.fraunces,
            fontWeight: 600,
            fontSize: 64 * s,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: colors.ink,
            opacity: titleIn,
            translate: `0px ${(1 - titleIn) * 24 * s}px`,
            textWrap: "balance",
          }}
        >
          {title}
        </div>
      ) : null}
      {children}
    </AbsoluteFill>
  );
};

export const HeadlineSlide: React.FC<{
  headline: string;
  highlight: string;
  colors: Colors;
}> = ({ headline, highlight, colors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { s, portrait } = useLayout();
  const words = headline.split(/\s+/);
  const hl = highlight.split(/\s+/).filter(Boolean);
  // Index range of the highlighted phrase inside the headline.
  const start = words.findIndex((_, i) =>
    hl.every(
      (h, j) =>
        words[i + j]?.replace(/[^\p{L}\p{N}%]/gu, "") ===
        h.replace(/[^\p{L}\p{N}%]/gu, ""),
    ),
  );
  const markAt = words.length * 3 + 10;
  const mark = interpolate(frame, [markAt, markAt + 16], [0, 1], {
    ...clamp,
    easing: EASE_OUT,
  });
  const fontSize = (portrait ? 108 : 112) * s;
  return (
    <Frame colors={colors} justify="center">
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          columnGap: fontSize * 0.25,
          rowGap: fontSize * 0.08,
        }}
      >
        {words.map((w, i) => {
          const p = enter(frame, fps, i * 3);
          const isHl = start >= 0 && i >= start && i < start + hl.length;
          return (
            <span
              key={i}
              style={{
                position: "relative",
                zIndex: 0,
                fontFamily: fonts.fraunces,
                fontWeight: isHl ? 800 : 500,
                fontSize,
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
                color: colors.ink,
                opacity: p,
                translate: `0px ${(1 - p) * 30 * s}px`,
              }}
            >
              {isHl ? (
                <span
                  style={{
                    position: "absolute",
                    left: -fontSize * 0.06,
                    right: -fontSize * 0.06,
                    bottom: fontSize * 0.08,
                    height: fontSize * 0.36,
                    backgroundColor: mix(colors.highlight, 32, colors.paper),
                    transformOrigin: "left center",
                    scale: `${interpolate(mark, [(i - start) / hl.length, (i - start + 1) / hl.length], [0, 1], clamp)} 1`,
                    zIndex: -1,
                  }}
                />
              ) : null}
              {w}
            </span>
          );
        })}
      </div>
    </Frame>
  );
};

export const BigNumberSlide: React.FC<{
  slide: SlideOf<"bigNumber">;
  colors: Colors;
}> = ({ slide, colors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { s, portrait, innerW } = useLayout();
  const value = interpolate(frame, [4, 44], [0, slide.value], {
    ...clamp,
    easing: EASE_OUT,
  });
  const text = `${slide.prefix ?? ""}${fmt(slide.value, slide.decimals)}${slide.suffix ?? ""}`;
  const fontSize = Math.min(
    (portrait ? 380 : 360) * s,
    innerW / (text.length * 0.6),
  );
  const bar = interpolate(frame, [30, 50], [0, 1], {
    ...clamp,
    easing: EASE_OUT,
  });
  const ctx = enter(frame, fps, 44);
  return (
    <Frame colors={colors}>
      <div
        style={{
          fontFamily: fonts.fraunces,
          fontWeight: 800,
          fontSize,
          lineHeight: 0.95,
          letterSpacing: "-0.04em",
          color: colors.ink,
          fontVariantNumeric: "tabular-nums lining-nums",
        }}
      >
        {slide.prefix}
        {fmt(value, slide.decimals)}
        {slide.suffix}
      </div>
      <div
        style={{
          width: Math.min(innerW, 520 * s),
          height: 14 * s,
          borderRadius: 7 * s,
          backgroundColor: colors.highlight,
          transformOrigin: "left center",
          scale: `${bar} 1`,
        }}
      />
      <div
        style={{
          fontFamily: fonts.inter,
          fontWeight: 500,
          fontSize: 52 * s,
          lineHeight: 1.3,
          maxWidth: 1100 * s,
          color: mix(colors.ink, 75, colors.paper),
          opacity: ctx,
          translate: `0px ${(1 - ctx) * 24 * s}px`,
          textWrap: "balance",
        }}
      >
        {slide.context}
      </div>
    </Frame>
  );
};

export const BarSlide: React.FC<{ slide: SlideOf<"bar">; colors: Colors }> = ({
  slide,
  colors,
}) => {
  const frame = useCurrentFrame();
  const { s, innerW, portrait } = useLayout();
  const max = Math.max(...slide.data.map((d) => d.value));
  const decimals = slide.data.some((d) => !Number.isInteger(d.value)) ? 1 : 0;
  // Portrait: label sits above its bar so bars get the full width.
  const labelW = portrait ? 0 : Math.min(innerW * 0.3, 400 * s);
  const valueW = 200 * s;
  const trackW = innerW - labelW - valueW;
  const barH = portrait
    ? 76 * s
    : Math.min(80 * s, (620 * s) / slide.data.length - 20 * s);
  return (
    <Frame colors={colors} title={slide.title}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: (portrait ? 30 : 22) * s,
        }}
      >
        {slide.data.map((d, i) => {
          const grow = interpolate(
            frame,
            [12 + i * STAGGER, 36 + i * STAGGER],
            [0, 1],
            {
              ...clamp,
              easing: EASE_OUT,
            },
          );
          const isHl = i === slide.highlightIndex;
          const w = Math.max(8 * s, (d.value / max) * trackW * grow);
          const label = (
            <div
              style={{
                width: portrait ? undefined : labelW,
                paddingRight: portrait ? 0 : 28 * s,
                marginBottom: portrait ? 10 * s : 0,
                textAlign: portrait ? "left" : "right",
                fontFamily: fonts.inter,
                fontWeight: isHl ? 700 : 500,
                fontSize: 38 * s,
                color: isHl ? colors.ink : mix(colors.ink, 72, colors.paper),
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {d.label}
            </div>
          );
          return (
            <div key={i}>
              {portrait ? label : null}
              <div
                style={{ display: "flex", alignItems: "center", height: barH }}
              >
                {portrait ? null : label}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: trackW + valueW,
                    height: "100%",
                    borderLeft: `2px solid ${mix(colors.ink, 60, colors.paper)}`,
                  }}
                >
                  <div
                    style={{
                      flexShrink: 0,
                      height: "100%",
                      width: w,
                      backgroundColor: isHl ? colors.highlight : colors.muted,
                      borderRadius: `0 ${4 * s}px ${4 * s}px 0`,
                    }}
                  />
                  <div
                    style={{
                      paddingLeft: 20 * s,
                      fontFamily: fonts.inter,
                      fontWeight: isHl ? 800 : 600,
                      fontSize: 40 * s,
                      color: colors.ink,
                      fontVariantNumeric: "tabular-nums",
                      opacity: grow,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {fmt(d.value * grow, decimals)}
                    {slide.unit}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Frame>
  );
};

export const LineSlide: React.FC<{
  slide: SlideOf<"line">;
  colors: Colors;
}> = ({ slide, colors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { s, innerW, innerH, portrait } = useLayout();
  const W = innerW;
  const H = Math.min(innerH - 200 * s, (portrait ? 900 : 560) * s);
  const axisL = 110 * s;
  const axisB = 70 * s;
  const plotW = W - axisL - 40 * s;
  const plotH = H - axisB - 30 * s;
  const ys = slide.points.map((p) => p.y);
  const lo = Math.min(0, Math.min(...ys));
  const step = niceStep((Math.max(...ys) - lo) / 3);
  const hi = lo + Math.ceil((Math.max(...ys) - lo) / step) * step;
  const x = (i: number) => axisL + (i / (slide.points.length - 1)) * plotW;
  const y = (v: number) => 30 * s + plotH - ((v - lo) / (hi - lo)) * plotH;
  const d = slide.points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.y)}`)
    .join(" ");

  const draw = interpolate(frame, [16, 16 + 70], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.45, 0, 0.25, 1),
  });
  // Travelling dot follows the drawn tip (by index, which matches the path for evenly spaced x).
  const tip = draw * (slide.points.length - 1);
  const i0 = Math.floor(tip);
  const i1 = Math.min(slide.points.length - 1, i0 + 1);
  const tipY =
    slide.points[i0].y + (slide.points[i1].y - slide.points[i0].y) * (tip - i0);
  const ticks = Array.from(
    { length: Math.round((hi - lo) / step) + 1 },
    (_, k) => lo + k * step,
  );
  const labelEvery = Math.ceil(slide.points.length / (portrait ? 4 : 7));
  const ann = slide.annotation;
  const annIn = ann
    ? enter(
        frame,
        fps,
        16 + Math.round((ann.index / (slide.points.length - 1)) * 70),
      )
    : 0;
  const axisIn = enter(frame, fps, 6);

  return (
    <Frame colors={colors} title={slide.title}>
      <svg width={W} height={H} style={{ overflow: "visible" }}>
        <g opacity={axisIn}>
          {ticks.map((t, k) => (
            <g key={k}>
              <line
                x1={axisL}
                x2={axisL + plotW}
                y1={y(t)}
                y2={y(t)}
                stroke={mix(colors.ink, k === 0 ? 55 : 14, colors.paper)}
                strokeWidth={k === 0 ? 2 : 1.5}
              />
              <text
                x={axisL - 20 * s}
                y={y(t) + 12 * s}
                textAnchor="end"
                fontFamily={fonts.inter}
                fontSize={32 * s}
                fill={mix(colors.ink, 65, colors.paper)}
              >
                {fmt(Math.round(t))}
                {slide.unit}
              </text>
            </g>
          ))}
          {slide.points.map((p, i) =>
            (i % labelEvery === 0 &&
              slide.points.length - 1 - i >= labelEvery) ||
            i === slide.points.length - 1 ? (
              <text
                key={i}
                x={x(i)}
                y={H - 16 * s}
                textAnchor="middle"
                fontFamily={fonts.inter}
                fontSize={32 * s}
                fill={mix(colors.ink, 65, colors.paper)}
              >
                {p.x}
              </text>
            ) : null,
          )}
        </g>
        <path
          d={d}
          fill="none"
          stroke={colors.highlight}
          strokeWidth={7 * s}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
        />
        {draw > 0 ? (
          <circle
            cx={axisL + (tip / (slide.points.length - 1)) * plotW}
            cy={y(tipY)}
            r={13 * s}
            fill={colors.highlight}
            stroke={colors.paper}
            strokeWidth={4 * s}
          />
        ) : null}
        {ann && annIn > 0 ? (
          <g opacity={annIn}>
            <circle
              cx={x(ann.index)}
              cy={y(slide.points[ann.index].y)}
              r={11 * s}
              fill={colors.paper}
              stroke={colors.ink}
              strokeWidth={4 * s}
            />
            <line
              x1={x(ann.index)}
              x2={x(ann.index)}
              y1={y(slide.points[ann.index].y) - 18 * s}
              y2={y(slide.points[ann.index].y) - 70 * s * annIn}
              stroke={colors.ink}
              strokeWidth={2 * s}
            />
          </g>
        ) : null}
      </svg>
      {ann ? (
        <div
          style={{
            alignSelf: "flex-start",
            fontFamily: fonts.inter,
            fontWeight: 600,
            fontSize: 38 * s,
            color: colors.ink,
            borderLeft: `6px solid ${colors.highlight}`,
            paddingLeft: 20 * s,
            opacity: annIn,
            translate: `0px ${(1 - annIn) * 20 * s}px`,
          }}
        >
          {slide.points[ann.index].x}: {ann.text}
        </div>
      ) : null}
    </Frame>
  );
};

const Person: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size * 1.4} viewBox="0 0 20 28">
    <circle cx="10" cy="6" r="5" fill={color} />
    <path d="M1 27v-7a9 9 0 0 1 18 0v7z" fill={color} />
  </svg>
);

export const IconGridSlide: React.FC<{
  slide: SlideOf<"iconGrid">;
  colors: Colors;
}> = ({ slide, colors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { s, innerW, portrait } = useLayout();
  const cols = slide.total <= 10 ? slide.total : 10;
  const gap = 24 * s;
  const size = Math.min(
    (portrait ? 170 : 150) * s,
    (innerW - gap * (cols - 1)) / cols,
  );
  const captionIn = enter(frame, fps, 12 + slide.filled * 4 + 6);
  const big = `${slide.filled} in ${slide.total}`;
  return (
    <Frame colors={colors}>
      <div
        style={{
          fontFamily: fonts.fraunces,
          fontWeight: 800,
          fontSize: 170 * s,
          lineHeight: 1,
          letterSpacing: "-0.03em",
          color: colors.ink,
        }}
      >
        {big}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, ${size}px)`,
          gap,
        }}
      >
        {Array.from({ length: slide.total }, (_, i) => {
          const on = i < slide.filled ? enter(frame, fps, 12 + i * 4) : 0;
          return (
            <div
              key={i}
              style={{ position: "relative", width: size, height: size * 1.4 }}
            >
              <Person size={size} color={colors.muted} />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: on,
                  scale: 0.7 + on * 0.3,
                }}
              >
                <Person size={size} color={colors.highlight} />
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          fontFamily: fonts.inter,
          fontWeight: 500,
          fontSize: 50 * s,
          lineHeight: 1.3,
          maxWidth: 1200 * s,
          color: mix(colors.ink, 75, colors.paper),
          opacity: captionIn,
          translate: `0px ${(1 - captionIn) * 24 * s}px`,
          textWrap: "balance",
        }}
      >
        {slide.caption}
      </div>
    </Frame>
  );
};

export const TakeawaySlide: React.FC<{
  takeaway: string;
  brandName: string;
  colors: Colors;
}> = ({ takeaway, brandName, colors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { s, padX, padY } = useLayout();
  const p = enter(frame, fps, 0);
  const rule = interpolate(frame, [10, 30], [0, 1], {
    ...clamp,
    easing: EASE_OUT,
  });
  const brandIn = enter(frame, fps, 20);
  return (
    <AbsoluteFill
      style={{
        padding: `${padY}px ${padX}px`,
        justifyContent: "center",
        gap: 48 * s,
      }}
    >
      <div
        style={{
          fontFamily: fonts.fraunces,
          fontWeight: 600,
          fontSize: 96 * s,
          lineHeight: 1.12,
          letterSpacing: "-0.025em",
          color: colors.ink,
          opacity: p,
          translate: `0px ${(1 - p) * 30 * s}px`,
          textWrap: "balance",
        }}
      >
        {takeaway}
      </div>
      <div
        style={{
          width: 240 * s,
          height: 6 * s,
          backgroundColor: colors.ink,
          transformOrigin: "left",
          scale: `${rule} 1`,
        }}
      />
      <div
        style={{
          fontFamily: fonts.inter,
          fontWeight: 700,
          fontSize: 44 * s,
          color: colors.ink,
          opacity: brandIn,
        }}
      >
        {brandName}
      </div>
    </AbsoluteFill>
  );
};
