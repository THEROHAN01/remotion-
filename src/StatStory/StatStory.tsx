import type React from "react";
import {
  AbsoluteFill,
  type CalculateMetadataFunction,
  Series,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fonts } from "../shared/fonts";
import { enter, mix } from "../shared/motion";
import type { Slide, StatStoryProps } from "./schema";
import {
  BarSlide,
  BigNumberSlide,
  HeadlineSlide,
  IconGridSlide,
  LineSlide,
  TakeawaySlide,
  useLayout,
} from "./Slides";

const FPS = 30;
const HEADLINE = 4.5 * FPS;
const TAKEAWAY = 4.5 * FPS;
const SLIDE_FRAMES: Record<Slide["type"], number> = {
  bigNumber: 5 * FPS,
  bar: 7 * FPS,
  line: 7.5 * FPS,
  iconGrid: 6 * FPS,
};

export const calculateStatStoryMetadata: CalculateMetadataFunction<
  StatStoryProps
> = ({ props }) => ({
  fps: FPS,
  durationInFrames:
    HEADLINE +
    TAKEAWAY +
    props.slides.reduce((sum, sl) => sum + SLIDE_FRAMES[sl.type], 0),
});

const Chrome: React.FC<{
  brandName: string;
  source: string;
  colors: StatStoryProps["colors"];
}> = ({ brandName, source, colors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { s, padX, portrait } = useLayout();
  const p = enter(frame, fps, 0);
  const edge = (portrait ? 100 : 56) * s;
  const small: React.CSSProperties = {
    position: "absolute",
    fontFamily: fonts.inter,
    fontSize: 28 * s,
    opacity: p,
  };
  return (
    <>
      <div
        style={{
          ...small,
          top: edge,
          left: padX,
          fontWeight: 700,
          color: colors.ink,
          display: "flex",
          alignItems: "center",
          gap: 14 * s,
        }}
      >
        <div
          style={{
            width: 18 * s,
            height: 18 * s,
            borderRadius: "50%",
            backgroundColor: colors.highlight,
          }}
        />
        {brandName}
      </div>
      <div
        style={{
          ...small,
          bottom: edge,
          left: padX,
          right: padX,
          color: mix(colors.ink, 60, colors.paper),
        }}
      >
        Source: {source}
      </div>
    </>
  );
};

export const StatStory: React.FC<StatStoryProps> = ({
  brandName,
  headline,
  highlight,
  slides,
  takeaway,
  source,
  colors,
}) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: colors.paper }}>
      <Series>
        <Series.Sequence
          name="Headline"
          durationInFrames={HEADLINE}
          premountFor={fps}
        >
          <HeadlineSlide
            headline={headline}
            highlight={highlight}
            colors={colors}
          />
        </Series.Sequence>
        {slides.map((slide, i) => (
          <Series.Sequence
            key={i}
            name={`${i + 1}. ${slide.type}`}
            durationInFrames={SLIDE_FRAMES[slide.type]}
            premountFor={fps}
          >
            {slide.type === "bigNumber" ? (
              <BigNumberSlide slide={slide} colors={colors} />
            ) : slide.type === "bar" ? (
              <BarSlide slide={slide} colors={colors} />
            ) : slide.type === "line" ? (
              <LineSlide slide={slide} colors={colors} />
            ) : (
              <IconGridSlide slide={slide} colors={colors} />
            )}
          </Series.Sequence>
        ))}
        <Series.Sequence
          name="Takeaway"
          durationInFrames={TAKEAWAY}
          premountFor={fps}
        >
          <TakeawaySlide
            takeaway={takeaway}
            brandName={brandName}
            colors={colors}
          />
        </Series.Sequence>
      </Series>
      <Chrome brandName={brandName} source={source} colors={colors} />
    </AbsoluteFill>
  );
};
