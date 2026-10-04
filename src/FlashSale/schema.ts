import { zColor } from "@remotion/zod-types";
import { z } from "zod";

const product = z.object({
  // Path inside public/ (e.g. "products/sneaker.svg") or an https:// URL.
  image: z.string().min(1),
  name: z.string(),
  price: z.number().nonnegative(),
});

export const flashSaleSchema = z.object({
  headline: z.string().min(1),
  tickerText: z.string().min(1),
  hero: z.object({
    image: z.string().min(1),
    name: z.string(),
    oldPrice: z.number().positive(),
    newPrice: z.number().nonnegative(),
  }),
  discountLabel: z.string().min(1),
  more: z.array(product).min(1).max(3),
  moreTitle: z.string(),
  currency: z.string().length(3),
  locale: z.string().min(2),
  timerSeconds: z.number().int().min(0).max(359999),
  timerLabel: z.string(),
  cta: z.string().min(1),
  code: z.string(),
  colors: z.object({
    background: zColor(),
    sale: zColor(),
    highlight: zColor(),
    text: zColor(),
  }),
});

export type FlashSaleProps = z.infer<typeof flashSaleSchema>;
