import { Audio } from "@remotion/media";
import type React from "react";
import { createContext, useContext } from "react";
import { staticFile, useVideoConfig } from "remotion";
import { z } from "zod";

// public/sfx/*.wav, built by scripts/build-sfx.sh. Lengths in seconds.
export const SFX = {
  "impact-heavy": 0.65,
  "thud-soft": 0.57,
  "sub-drop": 0.8,
  "glass-shatter": 0.24,
  click: 0.04,
  tick: 0.02,
  marker: 0.14,
  pop: 0.19,
  confirm: 0.29,
  "whoosh-lr": 0.45,
  "whoosh-rl": 0.45,
  chime: 2.43,
} as const;
export type SfxName = keyof typeof SFX;

// Shared `sound` prop. Omit it (or set sfx: false) for a silent render.
export const soundSchema = z
  .object({
    sfx: z.boolean(),
    sfxVolume: z.number().min(0).max(1),
  })
  .optional();
export type SoundProps = z.infer<typeof soundSchema>;

const SoundContext = createContext<{ enabled: boolean; volume: number }>({
  enabled: false,
  volume: 1,
});

export const SoundProvider: React.FC<{
  sound: SoundProps;
  children: React.ReactNode;
}> = ({ sound, children }) => (
  <SoundContext.Provider
    value={{ enabled: sound?.sfx ?? false, volume: sound?.sfxVolume ?? 1 }}
  >
    {children}
  </SoundContext.Provider>
);

// One sound effect at frame `at` (relative to the enclosing sequence). Renders nothing when sound is off.
export const Sfx: React.FC<{ name: SfxName; at: number; volume?: number }> = ({
  name,
  at,
  volume = 1,
}) => {
  const { enabled, volume: master } = useContext(SoundContext);
  const { fps } = useVideoConfig();
  if (!enabled || volume <= 0) return null;
  return (
    <Audio
      name={`sfx: ${name}`}
      src={staticFile(`sfx/${name}.wav`)}
      from={Math.round(at)}
      durationInFrames={Math.ceil(SFX[name] * fps) + 1}
      volume={volume * master}
      premountFor={fps}
    />
  );
};
