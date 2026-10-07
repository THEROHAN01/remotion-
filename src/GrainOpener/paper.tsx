import type React from "react";
import { random } from "remotion";
import { mix } from "../shared/motion";

// A rectangle with torn edges as a CSS polygon. `rough` is the tear depth in % of the side.
export const tornPolygon = (
  seed: string,
  {
    top = 2,
    right = 1,
    bottom = 2,
    left = 1,
  }: { top?: number; right?: number; bottom?: number; left?: number },
  points = 28,
) => {
  const pts: string[] = [];
  const jag = (key: string, amount: number) =>
    random(`${seed}-${key}`) * amount;
  for (let i = 0; i <= points; i++)
    pts.push(`${(i / points) * 100}% ${jag(`t${i}`, top)}%`);
  for (let i = 1; i <= points / 4; i++)
    pts.push(`${100 - jag(`r${i}`, right)}% ${(i / (points / 4)) * 100}%`);
  for (let i = points - 1; i >= 0; i--)
    pts.push(`${(i / points) * 100}% ${100 - jag(`b${i}`, bottom)}%`);
  for (let i = points / 4 - 1; i >= 1; i--)
    pts.push(`${jag(`l${i}`, left)}% ${(i / (points / 4)) * 100}%`);
  return `polygon(${pts.join(", ")})`;
};

// Paper strip / cutout: the drop shadow sits on a wrapper because clip-path would clip it.
export const Torn: React.FC<{
  readonly seed: string;
  readonly color: string;
  readonly edges?: Parameters<typeof tornPolygon>[1];
  readonly style?: React.CSSProperties;
  readonly shadow?: number;
  readonly children?: React.ReactNode;
}> = ({ seed, color, edges, style, shadow = 1, children }) => (
  <div
    style={{
      position: "absolute",
      filter: `drop-shadow(0 ${8 * shadow}px ${10 * shadow}px rgba(0,0,0,0.45))`,
      ...style,
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: color,
        // Subtle fibres so the paper isn't a flat fill.
        backgroundImage: `repeating-linear-gradient(${random(seed) * 180}deg, ${mix("black", 4)} 0 1px, transparent 1px 7px)`,
        clipPath: tornPolygon(seed, edges ?? {}),
        isolation: "isolate",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  </div>
);

export const Tape: React.FC<{
  readonly seed: string;
  readonly paper: string;
  readonly style: React.CSSProperties;
}> = ({ seed, paper, style }) => (
  <div
    style={{
      position: "absolute",
      backgroundColor: mix(paper, 72),
      clipPath: tornPolygon(
        seed,
        { top: 0, bottom: 0, left: 10, right: 10 },
        12,
      ),
      boxShadow: "inset 0 0 12px rgba(255,255,255,0.25)",
      ...style,
    }}
  />
);
