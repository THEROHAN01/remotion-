import type React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { enter, mix, POP, STAGGER } from "../shared/motion";

export const OutroScene: React.FC<{
  readonly brandName: string;
  readonly tagline: string;
  readonly cta: string;
  readonly accent: string;
  readonly text: string;
  readonly background: string;
}> = ({ brandName, tagline, cta, accent, text, background }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logo = enter(frame, fps, 0, POP);
  const nameIn = enter(frame, fps, 10);
  const taglineIn = enter(frame, fps, 10 + STAGGER * 2);
  const ctaIn = enter(frame, fps, 10 + STAGGER * 4);
  // Gentle, eased breathing on the CTA glow once it has landed.
  const pulse = (1 - Math.cos(Math.max(0, frame - 50) / 14)) / 2;

  return (
    <AbsoluteFill
      style={{
        padding: "100px 80px",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        gap: 0,
      }}
    >
      <div
        style={{
          width: 240,
          height: 240,
          borderRadius: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(145deg, ${mix(accent, 60, "white")}, ${accent} 55%, ${mix(accent, 70, "black")})`,
          boxShadow: `0 40px 120px ${mix(accent, 55)}, inset 0 2px 0 ${mix("white", 35)}`,
          fontSize: 150,
          fontWeight: 800,
          color: text,
          letterSpacing: "-0.05em",
          scale: interpolate(logo, [0, 1], [0.3, 1]),
          opacity: Math.min(1, logo * 2),
          rotate: `${(1 - logo) * -12}deg`,
        }}
      >
        {brandName.trim().charAt(0).toUpperCase()}
      </div>
      <div
        style={{
          marginTop: 56,
          fontSize: 104,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          color: text,
          lineHeight: 1,
          textWrap: "balance",
          opacity: nameIn,
          translate: `0px ${(1 - nameIn) * 40}px`,
        }}
      >
        {brandName}
      </div>
      <div
        style={{
          marginTop: 32,
          maxWidth: 860,
          fontSize: 48,
          fontWeight: 500,
          lineHeight: 1.25,
          textWrap: "balance",
          color: mix(text, 70, background),
          opacity: taglineIn,
          translate: `0px ${(1 - taglineIn) * 40}px`,
        }}
      >
        {tagline}
      </div>
      <div
        style={{
          marginTop: 80,
          display: "flex",
          alignItems: "center",
          gap: 22,
          padding: "36px 64px",
          borderRadius: 999,
          backgroundColor: accent,
          color: text,
          fontSize: 48,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          boxShadow: `0 0 ${50 + pulse * 50}px ${mix(accent, 45 + pulse * 30)}`,
          opacity: ctaIn,
          translate: `0px ${(1 - ctaIn) * 40}px`,
          scale: 1 + pulse * 0.025,
        }}
      >
        {cta}
        <svg width={44} height={44} viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12h14m-6-6 6 6-6 6"
            stroke={text}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
