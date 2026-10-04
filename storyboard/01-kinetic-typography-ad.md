# 01 · KineticType – kinetic typography ad

**Modeled on:** the most-cited motion trend of 2026, where the words themselves are the animation. They slide, stretch, break apart and re-form in rhythm with the audio. Brands use it for social ads, manifestos and quote videos because it works with the sound off.

**Use cases:** brand manifesto, feature announcement, testimonial quote, event promo.
**Format:** 1080×1920 (primary), 1080×1080 · 30fps · 15s
**Motion feel:** snappy and rhythmic. Every hit lands on a beat.

## Visual identity
- One background color that **inverts** on key beats (bg ↔ text), with a single accent color.
- One heavy display font (e.g. Space Grotesk 700 / Inter 900), set huge: 160–260px.
- No imagery. Type, shapes and color only.

## Storyboard

| Time | Frame | Action | Motion detail |
|------|-------|--------|---------------|
| 0.0–1.5s | Black. One word, giant, fills the width: **"EVERY"** | Word slams in from scale 1.4 → 1 | spring damping 14; 2-frame white flash on impact |
| 1.5–3.0s | **"EVERY / SINGLE"** stacked | Second word slides up and pushes the first word up | Stacked "push" lines, stagger 4f |
| 3.0–4.5s | **"DAY."** | Background inverts to accent; the word scales from the center | Colors swap on the beat (cut, no fade) |
| 4.5–7.0s | Sentence fragments: "you open / 14 tabs / to do / 1 thing" | Each fragment replaces the last, alternating left/right alignment | Mask wipes (clip-path) in alternating directions |
| 7.0–9.0s | **"14"** scales to fill the frame, then shatters into letters | Per-character split; letters fly out with rotation | Char stagger 2f, eased outward |
| 9.0–11.5s | Brand-promise line in 2–3 lines, with one word in the accent color | Lines assemble line by line; the accent word gets a marker highlight | Highlight sweep 12f, bezier(0.16,1,0.3,1) |
| 11.5–15s | Logo + short CTA | Promise line compresses into the logo mark; CTA fades up | Shared-element morph (scale + position) |

## Props schema
```ts
{
  beats: Array<{ text: string; style: "slam" | "stack" | "invert" | "wipe" | "shatter" | "highlight"; accentWord?: string; durationInFrames: number }>,
  cta: string, logo?: string /* staticFile path */,
  colors: { background, text, accent }, font: "Inter" | "SpaceGrotesk",
  audio?: string, bpm?: number   // if bpm is set, snap beat durations to the grid
}
```
The `beats` array *is* the script, so a single JSON entry describes a whole new ad.

## Remotion notes
- Each `style` is its own small component. `<Series>` plays the beats in order.
- `bpm` → `framesPerBeat = fps * 60 / bpm`; round each beat's `durationInFrames` to a multiple of it.
- Use `measureText`/`fitText` from `@remotion/layout-utils` so the single-word frames always fill the safe width.

## Variants to ship
1. Dark manifesto (black/white/red). 2. Pastel quote card (1:1). 3. Event date announcement (numbers-heavy).

## Master prompt
```
Create a Remotion composition called KineticType.
Format: 1080x1920 (also register a 1080x1080 version), 30fps, 15 seconds.

Visual identity:
- Background: #0A0A0A, accent: #FF3B30, text: #FFFFFF
- Font: Space Grotesk, 700, set huge (160–260px)
- Motion feel: snappy & rhythmic

Scenes: driven by a `beats` array prop; each beat has text + style
(slam | stack | invert | wipe | shatter | highlight) + durationInFrames.
Final beat compresses into the logo + CTA.

[Rules block]
```
