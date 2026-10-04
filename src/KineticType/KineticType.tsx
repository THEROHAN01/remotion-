import type React from "react";
import {
  type CalculateMetadataFunction,
  Series,
  useVideoConfig,
} from "remotion";
import { Highlight, Invert, Outro, Shatter, Slam, Stack, Wipe } from "./Beats";
import type { KineticTypeProps } from "./schema";

const FPS = 30;

export const calculateKineticTypeMetadata: CalculateMetadataFunction<
  KineticTypeProps
> = ({ props }) => ({
  fps: FPS,
  durationInFrames:
    props.beats.reduce((sum, b) => sum + Math.round(b.seconds * FPS), 0) +
    Math.round(props.outroSeconds * FPS),
});

const components = {
  slam: Slam,
  stack: Stack,
  invert: Invert,
  wipe: Wipe,
  shatter: Shatter,
  highlight: Highlight,
} as const;

export const KineticType: React.FC<KineticTypeProps> = ({
  beats,
  brandName,
  cta,
  outroSeconds,
  colors,
}) => {
  const { fps } = useVideoConfig();
  return (
    <Series>
      {beats.map((beat, i) => {
        const Component = components[beat.style];
        return (
          <Series.Sequence
            key={i}
            name={`${i + 1}. ${beat.style}`}
            durationInFrames={Math.round(beat.seconds * fps)}
            premountFor={fps}
          >
            <Component beat={beat} colors={colors} />
          </Series.Sequence>
        );
      })}
      <Series.Sequence
        name="Outro"
        durationInFrames={Math.round(outroSeconds * fps)}
        premountFor={fps}
      >
        <Outro brandName={brandName} cta={cta} colors={colors} />
      </Series.Sequence>
    </Series>
  );
};
