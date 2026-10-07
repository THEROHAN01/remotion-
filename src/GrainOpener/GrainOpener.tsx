import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fonts, typewriterFont } from "../shared/fonts";
import { clamp, fitFontSize, mix } from "../shared/motion";
import { Burn, Grain, Leader, LightLeak, Scratches } from "./Film";
import { Halftone } from "./Halftone";
import { Tape, Torn } from "./paper";
import type { GrainOpenerProps } from "./schema";

export const GRAIN_FPS = 24;
export const GRAIN_FRAMES = 10 * GRAIN_FPS;

// Timeline (24fps): leader 0–1s · strips 1–3.5s · photos 3.5–6s · title 6–7s · subtitle 7.2–8.2s · burn 8.75–10s
const T = {
  leader: 24,
  strips: 24,
  photos: 84,
  title: 144,
  subtitle: 172,
  pushIn: 186,
  burn: 210,
};

type Box = { x: number; y: number; w: number; h: number; rot: number };
const LAYOUT: Record<
  "landscape" | "portrait",
  { strips: Box[]; main: Box; photos: Box[] }
> = {
  landscape: {
    strips: [
      { x: 0.03, y: 0.1, w: 0.58, h: 0.17, rot: -4 },
      { x: 0.6, y: 0.9, w: 0.34, h: 0.07, rot: 5 },
      { x: 0.55, y: 0.79, w: 0.43, h: 0.11, rot: 3 },
    ],
    main: { x: 0.13, y: 0.37, w: 0.74, h: 0.3, rot: -2 },
    photos: [
      { x: 0.02, y: 0.55, w: 0.19, h: 0.37, rot: -6 },
      { x: 0.73, y: 0.05, w: 0.23, h: 0.31, rot: 5 },
      { x: 0.33, y: 0.04, w: 0.2, h: 0.28, rot: 3 },
    ],
  },
  portrait: {
    strips: [
      { x: 0.05, y: 0.08, w: 0.78, h: 0.08, rot: -5 },
      { x: 0.46, y: 0.86, w: 0.5, h: 0.05, rot: 4 },
      { x: 0.03, y: 0.78, w: 0.6, h: 0.07, rot: 3 },
    ],
    main: { x: 0.04, y: 0.4, w: 0.92, h: 0.19, rot: -3 },
    photos: [
      { x: 0.06, y: 0.17, w: 0.47, h: 0.21, rot: -5 },
      { x: 0.5, y: 0.2, w: 0.44, h: 0.19, rot: 6 },
      { x: 0.27, y: 0.655, w: 0.48, h: 0.165, rot: 2 },
    ],
  },
};

const STOMP = { damping: 13, stiffness: 240, mass: 0.6 };

export const GrainOpener: React.FC<GrainOpenerProps> = ({
  title,
  subtitle,
  photos,
  colors,
  grainAmount,
  stopMotionFps,
  seed,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const u = Math.min(width, height);
  const layout = LAYOUT[height > width ? "portrait" : "landscape"];

  // Stop-motion clock: the collage only updates every `step` frames.
  const step = Math.max(1, Math.round(fps / stopMotionFps));
  const sf = Math.floor(frame / step) * step;
  const boil = (key: string, amount: number) =>
    (random(`${seed}-${key}-${sf}`) - 0.5) * 2 * amount;
  const land = (at: number) => spring({ frame: sf - at, fps, config: STOMP });

  const px = (b: Box) => ({
    left: b.x * width,
    top: b.y * height,
    width: b.w * width,
    height: b.h * height,
  });
  const stripColors = [
    colors.accent,
    colors.paper,
    mix(mix(colors.accent, 28, colors.paper), 55, colors.background),
  ];

  const pushIn = interpolate(frame, [T.pushIn, GRAIN_FRAMES], [1, 1.07], {
    ...clamp,
    easing: Easing.bezier(0.33, 0, 0.2, 1),
  });
  const grain =
    grainAmount *
    interpolate(frame, [T.burn - 30, GRAIN_FRAMES], [1, 1.7], clamp);

  // Title: rubber-stamped letter by letter on the main strip.
  const main = px(layout.main);
  const letters = title.toUpperCase().split("");
  const titleSize = Math.min(
    fitFontSize(title, main.width * 0.84, 0.46, u * 0.3),
    main.height * 0.78,
  );
  const letterGap = Math.max(1, Math.round(step * 0.67));
  const typed = Math.max(0, Math.floor((frame - T.subtitle) * 1.6));

  const slap = (at: number, key: string): React.CSSProperties => {
    const p = land(at);
    return {
      opacity: sf >= at ? 1 : 0,
      scale: interpolate(p, [0, 1], [1.18, 1]),
      rotate: `${interpolate(p, [0, 1], [random(`${seed}-${key}-r`) * 8 - 4, 0])}deg`,
      translate: `${boil(`${key}x`, 1.5)}px ${boil(`${key}y`, 1.5)}px`,
    };
  };

  return (
    <AbsoluteFill
      style={{ backgroundColor: colors.background, overflow: "hidden" }}
    >
      <AbsoluteFill style={{ scale: pushIn }}>
        {/* Background strips */}
        {layout.strips.map((b, i) => (
          <div
            key={`s${i}`}
            style={{ position: "absolute", ...px(b), rotate: `${b.rot}deg` }}
          >
            <Torn
              seed={`${seed}-strip-${i}`}
              color={stripColors[i % stripColors.length]}
              edges={{ top: 9, bottom: 9, left: 1.5, right: 1.5 }}
              style={{ inset: 0, ...slap(T.strips + i * 7, `s${i}`) }}
            />
          </div>
        ))}

        {/* Halftone photo cutouts, each jumping into place in a few steps */}
        {photos.slice(0, 3).map((photo, i) => {
          const b = layout.photos[i];
          const at = T.photos + i * 12;
          const p = land(at);
          const dir = random(`${seed}-pd-${i}`) * Math.PI * 2;
          const box = px(b);
          return (
            <div
              key={`p${i}`}
              style={{ position: "absolute", ...box, rotate: `${b.rot}deg` }}
            >
              <Torn
                seed={`${seed}-photo-${i}`}
                color={colors.paper}
                edges={{ top: 2, bottom: 2, left: 2, right: 2 }}
                style={{
                  inset: 0,
                  opacity: sf >= at ? 1 : 0,
                  translate: `${Math.cos(dir) * u * 0.22 * (1 - p) + boil(`p${i}x`, 1.5)}px ${Math.sin(dir) * u * 0.22 * (1 - p) + boil(`p${i}y`, 1.5)}px`,
                  rotate: `${(1 - p) * 14}deg`,
                }}
              >
                <div style={{ position: "absolute", inset: u * 0.018 }}>
                  <Halftone
                    image={photo.src}
                    cell={Math.max(6, u * 0.011)}
                    ink={photo.tint ? colors.accent : undefined}
                  />
                </div>
              </Torn>
              <Tape
                seed={`${seed}-tape-${i}`}
                paper={colors.paper}
                style={{
                  left: box.width * 0.34,
                  top: -u * 0.022,
                  width: box.width * 0.32,
                  height: u * 0.05,
                  rotate: `${random(`${seed}-tr-${i}`) * 16 - 8}deg`,
                  opacity: sf >= at + step * 3 ? 0.9 : 0,
                }}
              />
            </div>
          );
        })}

        {/* Main strip with the stamped title */}
        <div
          style={{
            position: "absolute",
            ...main,
            rotate: `${layout.main.rot}deg`,
          }}
        >
          <Torn
            seed={`${seed}-main`}
            color={colors.paper}
            edges={{ top: 7, bottom: 7, left: 1, right: 1 }}
            shadow={1.4}
            style={{ inset: 0, ...slap(T.strips + 26, "main") }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: titleSize * 0.02,
              translate: `${boil("tx", 1)}px ${boil("ty", 1)}px`,
            }}
          >
            {letters.map((ch, i) => {
              const at = T.title + i * letterGap;
              const p = interpolate(sf, [at, at + step * 2], [0, 1], clamp);
              return (
                <span
                  key={i}
                  style={{
                    fontFamily: fonts.anton,
                    fontSize: titleSize,
                    lineHeight: 1,
                    whiteSpace: "pre",
                    color: colors.background,
                    opacity:
                      sf >= at ? 0.82 + random(`${seed}-lo-${i}`) * 0.18 : 0,
                    scale: interpolate(p, [0, 1], [1.35, 1]),
                    rotate: `${(random(`${seed}-lr-${i}`) - 0.5) * 6}deg`,
                    translate: `0px ${(random(`${seed}-ly-${i}`) - 0.5) * titleSize * 0.04}px`,
                    // Ink spread: soft bleed right after the stamp hits.
                    textShadow: `0 0 ${(1 - p) * titleSize * 0.06 + titleSize * 0.006}px ${mix(colors.background, 70)}`,
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
        </div>

        {/* Typewriter subtitle under the strip */}
        {subtitle ? (
          <div
            style={{
              position: "absolute",
              left: main.left,
              width: main.width,
              top: main.top + main.height + u * 0.035,
              textAlign: "center",
              fontFamily: typewriterFont,
              fontSize: Math.min(
                u * 0.05,
                (main.width * 0.95) / (subtitle.length * 0.6),
              ),
              color: colors.paper,
              rotate: `${layout.main.rot}deg`,
              whiteSpace: "pre",
              textShadow: `0 2px 0 ${mix("black", 50)}`,
            }}
          >
            {subtitle.slice(0, typed)}
            <span style={{ opacity: 0 }}>{subtitle.slice(typed)}</span>
          </div>
        ) : null}
      </AbsoluteFill>

      <LightLeak
        accent={colors.accent}
        boost={interpolate(frame, [T.burn - 20, T.burn], [0, 0.25], clamp)}
      />
      <Sequence durationInFrames={T.leader} name="Film leader">
        <Leader
          paper={colors.paper}
          background={colors.background}
          seed={seed}
        />
      </Sequence>
      <Scratches seed={seed} color={colors.paper} />
      <Sequence from={T.burn} name="Film burn">
        <Burn background={colors.background} accent={colors.accent} />
      </Sequence>
      <Grain amount={grain} step={step} seed={seed} />
    </AbsoluteFill>
  );
};
