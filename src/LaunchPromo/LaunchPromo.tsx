import type React from "react";
import {
  AbsoluteFill,
  type CalculateMetadataFunction,
  Series,
  useVideoConfig,
} from "remotion";
import { Background } from "./Background";
import { FeaturesScene } from "./FeaturesScene";
import { IntroScene } from "./IntroScene";
import { OutroScene } from "./OutroScene";
import { PhoneScene } from "./PhoneScene";
import { fonts } from "../shared/fonts";
import type { LaunchPromoProps } from "./schema";

const fontFamily = fonts.inter;

// Splits the total duration with the same ratios as the original 30s cut (3 / 9 / 10 / 8).
export const sceneTimings = (durationInFrames: number) => {
  const intro = Math.round(durationInFrames * (3 / 30));
  const features = Math.round(durationInFrames * (9 / 30));
  const phone = Math.round(durationInFrames * (10 / 30));
  const outro = durationInFrames - intro - features - phone;
  return { intro, features, phone, outro };
};

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
        <Series.Sequence
          name="Hook"
          durationInFrames={t.intro}
          premountFor={fps}
        >
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
        <Series.Sequence
          name="Phone"
          durationInFrames={t.phone}
          premountFor={fps}
        >
          <PhoneScene
            title={phoneTitle}
            tasks={tasks}
            accent={accent}
            text={text}
            background={background}
          />
        </Series.Sequence>
        <Series.Sequence
          name="Outro"
          durationInFrames={t.outro}
          premountFor={fps}
        >
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
