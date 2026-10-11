import { Audio } from "@remotion/media";
import type React from "react";
import { staticFile, useVideoConfig } from "remotion";
import { z } from "zod";

// Voiceover generated with Cartesia (scripts/voiceover.mjs). Each line plays at `at` seconds.
// `audio` is filled in by the generator; lines without it are skipped at render time.
export const voiceoverSchema = z
  .object({
    voiceId: z.string().min(1),
    model: z.string().optional(),
    language: z.string().optional(),
    speed: z.number().min(0.6).max(1.5).optional(),
    emotion: z.string().optional(),
    // Playback volume of the voice, and how much sound effects are lowered under it.
    volume: z.number().min(0).max(1).optional(),
    duckSfx: z.number().min(0).max(1).optional(),
    lines: z
      .array(
        z.object({
          text: z.string().min(1),
          at: z.number().min(0),
          audio: z
            .object({
              src: z.string(),
              seconds: z.number(),
              hash: z.string(),
            })
            .optional(),
        }),
      )
      .min(1),
  })
  .optional();

export type VoiceoverProps = z.infer<typeof voiceoverSchema>;

export const hasVoiceover = (vo: VoiceoverProps) =>
  vo?.lines.some((l) => l.audio) ?? false;

export const Voiceover: React.FC<{ readonly voiceover: VoiceoverProps }> = ({
  voiceover,
}) => {
  const { fps } = useVideoConfig();
  if (!voiceover) return null;
  return (
    <>
      {voiceover.lines.map((line, i) =>
        line.audio ? (
          <Audio
            key={i}
            name={`voiceover ${i + 1}: ${line.text.slice(0, 24)}`}
            src={staticFile(line.audio.src)}
            from={Math.round(line.at * fps)}
            durationInFrames={Math.ceil(line.audio.seconds * fps) + 1}
            volume={voiceover.volume ?? 1}
            premountFor={fps}
          />
        ) : null,
      )}
    </>
  );
};
