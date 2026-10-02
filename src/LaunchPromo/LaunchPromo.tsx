import { loadFont } from "@remotion/fonts";
import type React from "react";
import {
  AbsoluteFill,
  type CalculateMetadataFunction,
  Series,
  staticFile,
  useVideoConfig,
} from "remotion";
import { Background } from "./Background";
import { FeaturesScene } from "./FeaturesScene";
import { IntroScene } from "./IntroScene";
import { sceneTimings } from "./motion";
import { OutroScene } from "./OutroScene";
import { PhoneScene } from "./PhoneScene";
import type { LaunchPromoProps } from "./schema";

// Bundled locally (public/fonts) so batch renders work offline.
const fontFamily = "Inter";
loadFont({
  family: fontFamily,
  url: staticFile("fonts/Inter-Variable.woff2"),
  weight: "100 900",
});

export const calculateLaunchPromoMetadata: CalculateMetadataFunction<
  LaunchPromoProps
> = ({ props }) => ({
  durationInFrames: Math.round(props.durationInSeconds * 30),
  fps: 30,
});

export const LaunchPromo: React.FC<LaunchPromoProps> = ({
  brandName,
  headline,
  features,
  phoneTitle,
  tasks,
  tagline,
  cta,
  colors,
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  const t = sceneTimings(durationInFrames);
  const { background, accent, text } = colors;

  return (
    <AbsoluteFill style={{ fontFamily, color: text }}>
      <Background background={background} accent={accent} text={text} />
      <Series>
        <Series.Sequence name="Hook" durationInFrames={t.intro} premountFor={fps}>
          <IntroScene headline={headline} accent={accent} text={text} />
        </Series.Sequence>
        <Series.Sequence
          name="Features"
          durationInFrames={t.features}
          premountFor={fps}
        >
          <FeaturesScene
            features={features}
            accent={accent}
            text={text}
            background={background}
          />
        </Series.Sequence>
        <Series.Sequence name="Phone" durationInFrames={t.phone} premountFor={fps}>
          <PhoneScene
            title={phoneTitle}
            tasks={tasks}
            accent={accent}
            text={text}
            background={background}
          />
        </Series.Sequence>
        <Series.Sequence name="Outro" durationInFrames={t.outro} premountFor={fps}>
          <OutroScene
            brandName={brandName}
            tagline={tagline}
            cta={cta}
            accent={accent}
            text={text}
            background={background}
          />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
