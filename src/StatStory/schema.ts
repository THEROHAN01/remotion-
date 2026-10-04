import { zColor } from "@remotion/zod-types";
import { z } from "zod";

export const slideSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("bigNumber"),
    value: z.number(),
    prefix: z.string().optional(),
    suffix: z.string().optional(),
    decimals: z.number().int().min(0).max(3).optional(),
    context: z.string(),
  }),
  z.object({
    type: z.literal("bar"),
    title: z.string(),
    unit: z.string().optional(),
    data: z
      .array(z.object({ label: z.string(), value: z.number() }))
      .min(2)
      .max(8),
    highlightIndex: z.number().int().min(0),
  }),
  z.object({
    type: z.literal("line"),
    title: z.string(),
    unit: z.string().optional(),
    points: z
      .array(z.object({ x: z.string(), y: z.number() }))
      .min(3)
      .max(24),
    annotation: z
      .object({ index: z.number().int().min(0), text: z.string() })
      .optional(),
  }),
  z.object({
    type: z.literal("iconGrid"),
    filled: z.number().int().min(0),
    total: z.number().int().min(1).max(100),
    caption: z.string(),
  }),
]);

export const statStorySchema = z.object({
  brandName: z.string(),
  headline: z.string().min(1),
  highlight: z.string(),
  slides: z.array(slideSchema).min(1).max(8),
  takeaway: z.string().min(1),
  source: z.string(),
  colors: z.object({
    paper: zColor(),
    ink: zColor(),
    highlight: zColor(),
    muted: zColor(),
  }),
});

export type StatStoryProps = z.infer<typeof statStorySchema>;
export type Slide = z.infer<typeof slideSchema>;
