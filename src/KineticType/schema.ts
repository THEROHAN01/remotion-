import { zColor } from "@remotion/zod-types";
import { z } from "zod";

export const beatStyles = [
  "slam",
  "stack",
  "invert",
  "wipe",
  "shatter",
  "highlight",
] as const;

export const kineticTypeSchema = z.object({
  // The script. Use "/" inside `text` to break lines (stack, highlight) or fragments (wipe).
  beats: z
    .array(
      z.object({
        text: z.string().min(1),
        style: z.enum(beatStyles),
        accentWord: z.string().optional(),
        seconds: z.number().min(0.4).max(10),
      }),
    )
    .min(1),
  brandName: z.string().min(1),
  cta: z.string().min(1),
  outroSeconds: z.number().min(1).max(10),
  colors: z.object({
    background: zColor(),
    text: zColor(),
    accent: zColor(),
  }),
});

export type KineticTypeProps = z.infer<typeof kineticTypeSchema>;
export type Beat = KineticTypeProps["beats"][number];
