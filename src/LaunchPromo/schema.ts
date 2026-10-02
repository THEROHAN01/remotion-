import { zColor } from "@remotion/zod-types";
import { z } from "zod";

export const iconNames = [
  "focus",
  "streak",
  "tasks",
  "bolt",
  "calendar",
  "chart",
  "sparkle",
  "shield",
] as const;

export const launchPromoSchema = z.object({
  brandName: z.string().min(1),
  headline: z.string().min(1),
  features: z
    .array(
      z.object({
        title: z.string().min(1),
        icon: z.enum(iconNames),
      }),
    )
    .min(1)
    .max(4),
  phoneTitle: z.string(),
  tasks: z.array(z.string().min(1)).min(1).max(6),
  tagline: z.string(),
  cta: z.string().min(1),
  colors: z.object({
    background: zColor(),
    accent: zColor(),
    text: zColor(),
  }),
  durationInSeconds: z.number().min(10).max(120),
});

export type LaunchPromoProps = z.infer<typeof launchPromoSchema>;
export type IconName = (typeof iconNames)[number];
