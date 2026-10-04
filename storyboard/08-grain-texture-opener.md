# 08 · GrainOpener – textured "handmade" opener

**Modeled on:** 2026's shift toward authenticity over polish. Grain, film scratches, paper-cut collage, grunge street openers and warm analog fades are now standard for brand films, music, fashion and Gen-Z brands. Glossy corporate perfection is out.

**Use cases:** YouTube channel intro, brand film opener, event recap opener, music/fashion drops.
**Format:** 1920×1080 + 1080×1920 · 24fps (deliberately filmic) · 10s
**Motion feel:** raw and stop-motion. Posterized motion at 8–12 "drawings" per second.

## Visual identity
- Warm off-black (#16130F), paper cream (#EDE6D6), one ink accent (#E4572E).
- Torn paper shapes, tape strips, halftone photos, a hand-stamped serif or condensed grotesk.
- Permanent overlays: animated grain, a light leak and an occasional film scratch.

## Storyboard

| Time | Frame | Action | Motion detail |
|------|-------|--------|---------------|
| 0–1s | Film-leader flicker, a light leak burns in | Exposure flashes | 3 random-looking (seeded) brightness pops |
| 1–3.5s | Torn paper strips slap onto the frame, one by one | Each strip lands with a slight rotation and a shadow | `posterize: 3` on every interpolate, stop-motion jitter ±1.5px |
| 3.5–6s | Halftone photo cutouts (3 media slots) pop up in a collage | Pieces "jump" into place in 2–3 steps | Stepped positions, tape strips appear after |
| 6–8.5s | Title stamps on: letters appear like rubber stamps | Per-letter scale 1.3 → 1 with ink spread | Each letter 2f apart; a slight random rotation per letter (seeded) |
| 8.5–10s | Subtitle typewriter, then the whole collage drifts and fades to warm black | Slow push-in, grain intensifies | Film burn-out transition |

## Props schema
```ts
{
  title: string, subtitle: string,
  photos: string[],                    // 1–3 images, auto-halftoned
  colors: { background, paper, accent },
  grainAmount: number, stopMotionFps: number,   // e.g. 8
  seed: number                         // controls all the "random" jitter, deterministic per variant
}
```

## Remotion notes
- Every bit of randomness must come from `random(seed + id)` in `remotion`, never `Math.random()`, so renders stay deterministic.
- Stop-motion feel: either `posterize` on interpolations or `Math.floor(frame / (fps / stopMotionFps))` as the animation clock.
- Grain: a small noise PNG tiled with a seeded offset per frame, or `<HtmlInCanvas>` with an effect (see the remotion-markup effects docs).
- Halftone: CSS `mask-image` with a radial-dot pattern over a grayscale image, or a shader effect.

## Master prompt
```
Create a Remotion composition called GrainOpener.
Format: 1920x1080 and 1080x1920 versions, 24fps, 10 seconds.

Visual identity:
- Background: #16130F, paper: #EDE6D6, accent: #E4572E
- Font: a condensed grotesk for the title, a typewriter mono for the subtitle
- Motion feel: raw, stop-motion (8fps animation clock), seeded jitter

Scenes:
1. (0–1s) film-leader flicker + light leak
2. (1–3.5s) torn paper strips slap on
3. (3.5–6s) halftone photo collage jumps into place
4. (6–8.5s) title rubber-stamps on letter by letter
5. (8.5–10s) subtitle typewriter, push-in, film burn-out

[Rules block — but with posterized motion instead of smooth springs]
```
