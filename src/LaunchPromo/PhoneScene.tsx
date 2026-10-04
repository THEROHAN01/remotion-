import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { enter, exit, mix, POP, STAGGER } from "../shared/motion";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const TaskRow: React.FC<{
  readonly label: string;
  readonly checkAt: number;
  readonly enterAt: number;
  readonly accent: string;
  readonly text: string;
  readonly background: string;
  readonly compact: boolean;
}> = ({ label, checkAt, enterAt, accent, text, background, compact }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const p = enter(frame, fps, enterAt);
  const checked = frame >= checkAt;
  const pop = spring({ frame: frame - checkAt, fps, config: POP });
  const ring = interpolate(frame, [checkAt, checkAt + 18], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const draw = interpolate(frame, [checkAt + 2, checkAt + 12], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.33, 1, 0.68, 1),
  });
  const strike = interpolate(frame, [checkAt + 4, checkAt + 16], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 28,
        padding: compact ? "18px 30px" : "26px 30px",
        borderRadius: 32,
        backgroundColor: mix(text, checked ? 4 : 7, background),
        opacity: p,
        translate: `0px ${(1 - p) * 60}px`,
        scale: checked ? 1 + Math.sin(Math.min(1, pop) * Math.PI) * 0.03 : 1,
      }}
    >
      <div
        style={{ position: "relative", width: 62, height: 62, flexShrink: 0 }}
      >
        {checked ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 999,
              border: `4px solid ${accent}`,
              scale: 1 + ring * 0.9,
              opacity: 1 - ring,
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 999,
            border: `4px solid ${checked ? accent : mix(text, 35)}`,
            backgroundColor: checked ? accent : "transparent",
            scale: checked ? 0.6 + pop * 0.4 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width={36} height={36} viewBox="0 0 24 24" fill="none">
            <path
              d="m5 12.5 4.5 4.5L19 7.5"
              stroke={text}
              strokeWidth={3.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - draw}
            />
          </svg>
        </div>
      </div>
      <div
        style={{
          position: "relative",
          minWidth: 0,
          fontSize: 40,
          fontWeight: 600,
          color: text,
          opacity: 1 - strike * 0.55,
          lineHeight: 1.15,
        }}
      >
        <div
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "52%",
            height: 4,
            borderRadius: 2,
            backgroundColor: text,
            transformOrigin: "left center",
            scale: `${strike} 1`,
          }}
        />
      </div>
    </div>
  );
};

const ProgressRing: React.FC<{
  readonly progress: number;
  readonly enterAt: number;
  readonly accent: string;
  readonly text: string;
  readonly background: string;
}> = ({ progress, enterAt, accent, text, background }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = enter(frame, fps, enterAt);
  const size = 120;
  const stroke = 14;
  const r = (size - stroke) / 2;

  return (
    <div
      style={{
        marginTop: "auto",
        display: "flex",
        alignItems: "center",
        gap: 32,
        padding: "28px 32px",
        borderRadius: 32,
        backgroundColor: mix(accent, 14, background),
        border: `2px solid ${mix(accent, 35)}`,
        opacity: p,
        translate: `0px ${(1 - p) * 60}px`,
      }}
    >
      <svg
        width={size}
        height={size}
        style={{ flexShrink: 0, rotate: "-90deg" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={mix(text, 12)}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - progress}
          opacity={progress > 0.001 ? 1 : 0}
        />
      </svg>
      <div
        style={{
          fontSize: 76,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          color: text,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {Math.round(progress * 100)}%
      </div>
    </div>
  );
};

export const PhoneScene: React.FC<{
  readonly title: string;
  readonly tasks: string[];
  readonly accent: string;
  readonly text: string;
  readonly background: string;
}> = ({ title, tasks, accent, text, background }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const compact = tasks.length > 5;
  const phoneIn = enter(frame, fps, 0);
  const out = exit(frame, durationInFrames, 12);

  const firstCheck = 40;
  const lastCheck = durationInFrames - 70;
  const interval =
    tasks.length > 1 ? (lastCheck - firstCheck) / (tasks.length - 1) : 0;
  const checkAt = (i: number) => Math.round(firstCheck + i * interval);
  const done = tasks.filter((_, i) => frame >= checkAt(i)).length;

  // Each check adds its own eased step, so the bar never runs ahead of the list.
  const progress = tasks.reduce(
    (sum, _, i) =>
      sum +
      interpolate(frame, [checkAt(i), checkAt(i) + 14], [0, 1 / tasks.length], {
        ...clamp,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
    0,
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "100px 80px",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 700,
          height: 1280,
          borderRadius: 96,
          padding: 16,
          background: `linear-gradient(160deg, ${mix(text, 22, background)}, ${mix(text, 8, background)})`,
          boxShadow: `0 60px 160px ${mix(accent, 30)}, 0 0 0 2px ${mix(text, 12)}`,
          opacity: phoneIn * (1 - out),
          scale: (0.82 + phoneIn * 0.18) * (1 - out * 0.08),
          translate: `0px ${(1 - phoneIn) * 120}px`,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 82,
            backgroundColor: mix(text, 3, background),
            overflow: "hidden",
            padding: "112px 36px 36px",
            display: "flex",
            flexDirection: "column",
            gap: compact ? 16 : 22,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 30,
              left: "50%",
              translate: "-50% 0px",
              width: 170,
              height: 48,
              borderRadius: 999,
              backgroundColor: "#000",
            }}
          />
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: accent,
              opacity: enter(frame, fps, 8),
            }}
          >
            {done} of {tasks.length} done
          </div>
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: text,
              lineHeight: 1.05,
              opacity: enter(frame, fps, 10),
            }}
          >
            {title}
          </div>
          <div
            style={{
              height: 12,
              borderRadius: 999,
              backgroundColor: mix(text, 10),
              overflow: "hidden",
              marginBottom: 18,
              opacity: enter(frame, fps, 12),
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 999,
                backgroundColor: accent,
                boxShadow: `0 0 24px ${accent}`,
                transformOrigin: "left center",
                scale: `${progress} 1`,
              }}
            />
          </div>
          {tasks.map((task, i) => (
            <TaskRow
              key={i}
              label={task}
              enterAt={14 + i * STAGGER}
              checkAt={checkAt(i)}
              accent={accent}
              text={text}
              background={background}
              compact={compact}
            />
          ))}
          <ProgressRing
            progress={progress}
            enterAt={14 + tasks.length * STAGGER}
            accent={accent}
            text={text}
            background={background}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
