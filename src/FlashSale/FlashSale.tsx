import type React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Series,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fonts } from "../shared/fonts";
import {
  clamp,
  enter,
  exit,
  fitFontSize,
  mix,
  POP,
  STAGGER,
} from "../shared/motion";
import { FlipClock } from "./FlipClock";
import type { FlashSaleProps } from "./schema";
import { Ticker } from "./Ticker";
import { formatPrice, src } from "./util";

// 12s at 30fps: intro 1.5s · hero + price 5.5s · carousel 2.5s · countdown 2.5s
const T = { intro: 45, hero: 165, more: 75, end: 75 };
export const FLASH_SALE_FRAMES = T.intro + T.hero + T.more + T.end;

const Intro: React.FC<{ headline: string; sale: string; text: string }> = ({
  headline,
  sale,
  text,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, durationInFrames } = useVideoConfig();
  const words = headline.toUpperCase().split(/\s+/);
  const out = exit(frame, durationInFrames, 8);
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: `0 ${80 * (width / 1080)}px`,
      }}
    >
      {words.map((w, i) => {
        const p = enter(frame, fps, i * STAGGER, {
          damping: 14,
          stiffness: 260,
          mass: 0.6,
        });
        return (
          <div
            key={i}
            style={{
              fontFamily: fonts.anton,
              fontSize: fitFontSize(
                w,
                width - 160 * (width / 1080),
                0.5,
                300 * (width / 1080),
              ),
              lineHeight: 0.95,
              color: i === words.length - 1 ? sale : text,
              opacity: frame >= i * STAGGER ? 1 - out : 0,
              scale: interpolate(p, [0, 1], [1.6, 1]) * (1 + out * 0.3),
            }}
          >
            {w}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Hero: React.FC<{ props: FlashSaleProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const s = width / 1080;
  const { hero, colors, currency, locale } = props;

  const drop = enter(frame, fps, 0, { damping: 16, stiffness: 200, mass: 0.9 });
  // Squash when the product lands (~frame 10), then recover.
  const squash = interpolate(frame, [8, 12, 22], [0, 1, 0], {
    ...clamp,
    easing: Easing.bezier(0.33, 1, 0.68, 1),
  });
  const badgeAt = 18;
  const badge = enter(frame, fps, badgeAt, POP);
  const shake =
    frame >= badgeAt && frame < badgeAt + 6
      ? Math.sin((frame - badgeAt) * 2.4) * 10 * s
      : 0;

  const priceAt = 40;
  const priceIn = enter(frame, fps, priceAt);
  const strike = interpolate(frame, [priceAt + 8, priceAt + 18], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const counted = interpolate(
    frame,
    [priceAt + 16, priceAt + 46],
    [hero.oldPrice, hero.newPrice],
    {
      ...clamp,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    },
  );
  const landed = enter(frame, fps, priceAt + 46, POP);
  const out = exit(frame, durationInFrames, 10);
  const imgH = Math.min(height * 0.34, 660 * s);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        gap: 24 * s * (height / 1350),
        opacity: 1 - out,
        translate: `${-out * width * 0.3}px 0px`,
      }}
    >
      <div style={{ position: "relative", translate: `${shake}px 0px` }}>
        <Img
          src={src(hero.image)}
          style={{
            height: imgH,
            maxWidth: width * 0.8,
            objectFit: "contain",
            translate: `0px ${(1 - drop) * -height * 0.7}px`,
            scale: `${1 + squash * 0.08} ${1 - squash * 0.1}`,
            transformOrigin: "50% 100%",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -40 * s,
            top: -30 * s,
            width: 230 * s,
            height: 230 * s,
            borderRadius: "50%",
            backgroundColor: colors.sale,
            color: colors.text,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: fonts.anton,
            fontSize: fitFontSize(props.discountLabel, 160 * s, 0.62, 84 * s),
            boxShadow: `0 20px 60px ${mix(colors.sale, 50)}`,
            opacity: frame >= badgeAt ? 1 : 0,
            scale: interpolate(badge, [0, 1], [2.2, 1]),
            rotate: `${interpolate(badge, [0, 1], [-24, -10])}deg`,
          }}
        >
          {props.discountLabel}
        </div>
      </div>
      <div
        style={{
          fontFamily: fonts.inter,
          fontWeight: 700,
          fontSize: 52 * s,
          color: colors.text,
          opacity: drop,
          textAlign: "center",
          maxWidth: width - 160 * s,
        }}
      >
        {hero.name}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 32 * s,
          opacity: priceIn,
          translate: `0px ${(1 - priceIn) * 60 * s}px`,
        }}
      >
        <div
          style={{
            position: "relative",
            fontFamily: fonts.anton,
            fontSize: 72 * s,
            color: mix(colors.text, 55, colors.background),
          }}
        >
          {formatPrice(hero.oldPrice, currency, locale)}
          <div
            style={{
              position: "absolute",
              left: -6 * s,
              right: -6 * s,
              top: "52%",
              height: 9 * s,
              backgroundColor: colors.sale,
              rotate: "-8deg",
              transformOrigin: "left center",
              scale: `${strike} 1`,
            }}
          />
        </div>
        <div
          style={{
            fontFamily: fonts.anton,
            fontSize: 150 * s,
            lineHeight: 1,
            color: colors.highlight,
            fontVariantNumeric: "tabular-nums",
            scale: 1 + Math.sin(Math.min(1, landed) * Math.PI) * 0.08,
          }}
        >
          {formatPrice(Math.round(counted), currency, locale)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const More: React.FC<{ props: FlashSaleProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const s = width / 1080;
  const { colors, currency, locale } = props;
  const out = exit(frame, durationInFrames, 8);
  const drift = interpolate(frame, [10, durationInFrames], [0, -40 * s], {
    ...clamp,
    easing: Easing.bezier(0.33, 1, 0.68, 1),
  });
  const portrait = height / width > 1.5;
  const cardW = portrait ? width - 160 * s : (width - 160 * s - 2 * 28 * s) / 3;
  const titleIn = enter(frame, fps, 0);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        gap: 48 * s,
        opacity: 1 - out,
      }}
    >
      <div
        style={{
          fontFamily: fonts.anton,
          fontSize: 96 * s,
          color: colors.text,
          opacity: titleIn,
          translate: `0px ${(1 - titleIn) * 40 * s}px`,
        }}
      >
        {props.moreTitle.toUpperCase()}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: portrait ? "column" : "row",
          gap: 28 * s,
          translate: portrait ? `0px ${drift}px` : `${drift}px 0px`,
        }}
      >
        {props.more.map((item, i) => {
          const p = enter(frame, fps, 4 + i * STAGGER);
          return (
            <div
              key={i}
              style={{
                width: cardW,
                borderRadius: 36 * s,
                padding: portrait
                  ? `${24 * s}px ${40 * s}px`
                  : `${30 * s}px ${20 * s}px`,
                backgroundColor: mix(colors.text, 8, colors.background),
                border: `2px solid ${mix(colors.text, 14)}`,
                display: "grid",
                gridTemplateColumns: portrait ? `${200 * s}px 1fr auto` : "1fr",
                justifyItems: portrait ? "start" : "center",
                alignItems: "center",
                columnGap: 36 * s,
                rowGap: 18 * s,
                opacity: p,
                translate: `${(1 - p) * width * 0.6}px 0px`,
              }}
            >
              <Img
                src={src(item.image)}
                style={{
                  height: portrait ? 180 * s : Math.min(height * 0.16, 260 * s),
                  width: portrait ? 200 * s : undefined,
                  maxWidth: "100%",
                  objectFit: "contain",
                }}
              />
              <div
                style={{
                  fontFamily: fonts.inter,
                  fontWeight: 600,
                  fontSize: (portrait ? 46 : 32) * s,
                  color: colors.text,
                  textAlign: portrait ? "left" : "center",
                  lineHeight: 1.15,
                }}
              >
                {item.name}
              </div>
              <div
                style={{
                  fontFamily: fonts.anton,
                  fontSize: (portrait ? 60 : 52) * s,
                  color: colors.background,
                  backgroundColor: colors.highlight,
                  padding: `${4 * s}px ${22 * s}px`,
                  borderRadius: 999,
                }}
              >
                {formatPrice(item.price, currency, locale)}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const End: React.FC<{ props: FlashSaleProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = width / 1080;
  const { colors } = props;
  const clockSize = (height / width > 1.5 ? 148 : 128) * s;
  const labelIn = enter(frame, fps, 0);
  const clockIn = enter(frame, fps, STAGGER);
  const ctaIn = enter(frame, fps, STAGGER * 2, POP);
  const codeIn = enter(frame, fps, STAGGER * 3);
  const pulse = (1 - Math.cos(Math.max(0, frame - 20) / 5)) / 2;

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", gap: 44 * s }}
    >
      <div
        style={{
          fontFamily: fonts.anton,
          fontSize: 64 * s,
          letterSpacing: "0.08em",
          color: colors.highlight,
          opacity: labelIn,
        }}
      >
        {props.timerLabel.toUpperCase()}
      </div>
      <div style={{ opacity: clockIn, scale: 0.9 + clockIn * 0.1 }}>
        <FlipClock
          startSeconds={props.timerSeconds}
          size={clockSize}
          color={colors.text}
          accent={colors.sale}
        />
      </div>
      <div
        style={{
          marginTop: 20 * s,
          padding: `${34 * s}px ${80 * s}px`,
          borderRadius: 999,
          backgroundColor: colors.sale,
          color: colors.text,
          fontFamily: fonts.anton,
          fontSize: 76 * s,
          letterSpacing: "0.03em",
          boxShadow: `0 0 ${40 + pulse * 60}px ${mix(colors.sale, 50 + pulse * 30)}`,
          opacity: Math.min(1, ctaIn * 2),
          scale: interpolate(ctaIn, [0, 1], [0.5, 1]) * (1 + pulse * 0.04),
        }}
      >
        {props.cta.toUpperCase()}
      </div>
      {props.code ? (
        <div
          style={{
            fontFamily: fonts.inter,
            fontWeight: 700,
            fontSize: 40 * s,
            color: colors.text,
            border: `3px dashed ${mix(colors.text, 50)}`,
            borderRadius: 20 * s,
            padding: `${16 * s}px ${36 * s}px`,
            opacity: codeIn,
            translate: `0px ${(1 - codeIn) * 30 * s}px`,
          }}
        >
          CODE:{" "}
          <span style={{ color: colors.highlight, letterSpacing: "0.08em" }}>
            {props.code}
          </span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const FlashSale: React.FC<FlashSaleProps> = (props) => {
  const { fps } = useVideoConfig();
  const { colors } = props;
  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        backgroundImage: `repeating-linear-gradient(-45deg, ${mix(colors.text, 3)} 0 2px, transparent 2px 28px), radial-gradient(circle at 50% 45%, ${mix(colors.sale, 22)}, transparent 60%)`,
      }}
    >
      <Series>
        <Series.Sequence
          name="Intro"
          durationInFrames={T.intro}
          premountFor={fps}
        >
          <Intro
            headline={props.headline}
            sale={colors.sale}
            text={colors.text}
          />
        </Series.Sequence>
        <Series.Sequence
          name="Hero"
          durationInFrames={T.hero}
          premountFor={fps}
        >
          <Hero props={props} />
        </Series.Sequence>
        <Series.Sequence
          name="More deals"
          durationInFrames={T.more}
          premountFor={fps}
        >
          <More props={props} />
        </Series.Sequence>
        <Series.Sequence
          name="Countdown"
          durationInFrames={T.end}
          premountFor={fps}
        >
          <End props={props} />
        </Series.Sequence>
      </Series>
      <Ticker
        text={props.tickerText}
        background={colors.sale}
        color={colors.text}
        top
      />
      <Ticker
        text={props.tickerText}
        background={colors.highlight}
        color={colors.background}
        top={false}
      />
    </AbsoluteFill>
  );
};
