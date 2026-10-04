# 06 · FlashSale – e-commerce drop / countdown

**Modeled on:** the flash-sale and Black Friday countdown templates e-commerce brands run constantly: product hero, a big discount, a live-feeling timer and a hard CTA. It is built to create urgency in under 15 seconds.

**Use cases:** flash sales, product drops, Black Friday / Diwali / Prime Day, restock alerts.
**Format:** 1080×1920 + 1080×1350 (4:5 feed) · 30fps · 12s
**Motion feel:** loud and fast. Everything lands hard.

## Visual identity
- High-contrast brand colors plus a "sale" color (red/yellow). Diagonal stripe or ticker-tape textures.
- Condensed heavy font for numbers (e.g. Anton / Bebas Neue).
- Product photos on clean cutouts (transparent PNGs).

## Storyboard

| Time | Frame | Action | Motion detail |
|------|-------|--------|---------------|
| 0–1.5s | **"48 HOURS ONLY"** marquee ticker across the frame (top and bottom bands) | Bands slide in from opposite sides | Ticker scroll uses eased per-loop offsets |
| 1.5–4s | Hero product drops in and lands with a squash | Discount badge "**-40%**" stamps onto the corner | POP spring; badge rotates −12° → −6° on impact, shake 4f |
| 4–7s | Price: old price struck through, new price counts *down* to the final value | ₹2,999 → ₹1,799 | Strike sweep 10f, then a counter over 30f |
| 7–9.5s | Carousel of 3 more products sliding past, each with a mini price tag | Horizontal conveyor | Each item enters with a SNAPPY spring, stagger 6f |
| 9.5–12s | Countdown timer **23:59:42** ticking + "Shop now" + URL/code | Digits flip on each second, CTA pulses | Flip-clock digits (rotateX); pulse via eased sine |

## Props schema
```ts
{
  headline: string,                    // "48 HOURS ONLY"
  hero: { image: string; name: string; oldPrice: number; newPrice: number },
  discountLabel: string,               // "-40%"
  more: Array<{ image: string; price: number }>,
  endsAt: string,                      // ISO date: timer counts from "now" at render time
  currency: string, locale: string,
  cta: string, code?: string,
  colors: { background, sale, text }
}
```

## Remotion notes
- Format prices with `Intl.NumberFormat(locale, { style: "currency", currency })`, so the same template works for ₹, $ and €.
- The timer's start value comes from `endsAt - renderTime` in `calculateMetadata`, so every render looks "live".
- This is the closest of the ten to LaunchPromo: reuse `motion.ts`, the CTA pulse and the batch script directly. Feed it from a product CSV.

## Master prompt
```
Create a Remotion composition called FlashSale.
Format: 1080x1920 (plus a 1080x1350 version), 30fps, 12 seconds.

Visual identity:
- Background: #111111, sale: #FF2E2E, text: #FFFFFF, secondary: #FFD400
- Font: Anton for numbers/headlines, Inter for small text
- Motion feel: loud & fast, hard landings

Scenes:
1. (0–1.5s) ticker bands with the headline slide in
2. (1.5–4s) hero product drops + discount badge stamps on
3. (4–7s) old price strikes through, new price counts down
4. (7–9.5s) product carousel
5. (9.5–12s) flip-clock countdown + pulsing CTA + code

[Rules block]
```
