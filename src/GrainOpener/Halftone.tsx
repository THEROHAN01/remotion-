import type React from "react";
import { Img, staticFile } from "remotion";

const src = (p: string) => (/^https?:\/\//.test(p) ? p : staticFile(p));

// Newspaper-style halftone of any image, done in CSS:
// darkened grayscale image + a grid of radial "dot" gradients added on top (plus-lighter),
// then a hard contrast threshold turns the sum into black dots whose size follows the tone.
// The result is multiplied onto the paper, optionally printed in the accent color.
export const Halftone: React.FC<{
  readonly image: string;
  readonly cell: number;
  readonly ink?: string;
}> = ({ image, cell, ink }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      isolation: "isolate",
      mixBlendMode: "multiply",
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        filter: "contrast(30)",
        backgroundColor: "white",
      }}
    >
      <Img
        src={src(image)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: `grayscale(1) blur(${cell * 0.12}px) brightness(0.52) contrast(1.15)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle closest-side, #000 0%, #808080 100%)",
          backgroundSize: `${cell}px ${cell}px`,
          mixBlendMode: "plus-lighter",
        }}
      />
    </div>
    {ink ? (
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: ink,
          mixBlendMode: "lighten",
        }}
      />
    ) : null}
  </div>
);
