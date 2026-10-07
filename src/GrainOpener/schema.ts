import { zColor } from "@remotion/zod-types";
import { z } from "zod";

export const grainOpenerSchema = z.object({
  title: z.string().min(1).max(24),
  subtitle: z.string().max(60),
  photos: z
    .array(
      z.object({
        // Path inside public/ or an https:// URL. Any photo works; it is halftoned automatically.
        src: z.string().min(1),
        // Print this photo's dots in the accent color instead of ink.
        tint: z.boolean().optional(),
      }),
    )
    .min(1)
    .max(3),
  colors: z.object({
    background: zColor(),
    paper: zColor(),
    accent: zColor(),
  }),
  grainAmount: z.number().min(0).max(1),
  // How many "drawings" per second the collage moves at. Lower = choppier stop-motion.
  stopMotionFps: z.number().int().min(4).max(24),
  // Changes every "random" detail (torn edges, jitter, flicker) deterministically.
  seed: z.number().int(),
});

export type GrainOpenerProps = z.infer<typeof grainOpenerSchema>;
