# 03 · Wrapped – personalized year-in-review story

**Modeled on:** Spotify Wrapped, the best-known personalized motion campaign. It is built from a flexible grid, bold flat colors and per-card "personality" in the motion. Each person gets their own data, and the ending is designed to be shared.

**Use cases:** app year-in-review per user, creator stats recap, company annual recap, fitness/finance summaries.
**Format:** 1080×1920 · 30fps · 4–8 cards × 5s
**Motion feel:** bouncy and playful. Each card has its own personality.

## Visual identity
- One loud color pair **per card**, rotating through a palette of 5–6 duotones.
- Giant numbers (300px+) in a heavy font, with small, friendly copy.
- Geometric shapes (blobs, stripes, circles) that react to card changes.

## Storyboard

| Card | Frame | Action | Motion detail |
|------|-------|--------|---------------|
| Intro (0–4s) | "Your 2026, wrapped." over shapes | Shapes burst in from the edges, text pops | POP spring, shapes stagger 3f |
| Big number | "You listened for **48,213** minutes" | Number counts up fast, then slams to rest with a wobble | Count-up 45f + overshoot; background stripes slide |
| Top 5 list | Ranked list (#1 biggest) | Rows drop in from top with a bounce, #1 last | Stagger 5f; #1 gets a scale-up and a confetti burst |
| Comparison | "That's more than **92%** of users" | Ring or bar fills, percent counts | Fill synced to the counter |
| Personality | Archetype title ("The Night Owl") + illustration shape | Card flips (rotateY) to reveal | 3D flip 18f |
| Share card | Summary grid of 4 stats + handle + logo | Tiles assemble like a puzzle | Tile stagger 4f; ends on a still screenshot-ready frame |

Every transition is a **color wipe** in the next card's color, so the story keeps momentum.

## Props schema
```ts
{
  userName: string, year: number,
  cards: Array<
    | { type: "bigNumber"; value: number; unit: string; caption: string }
    | { type: "topList"; title: string; items: string[] }
    | { type: "percentile"; value: number; caption: string }
    | { type: "persona"; title: string; description: string; shape: "moon" | "flame" | "star" }
  >,
  share: { stats: Array<{ label: string; value: string }>; handle: string },
  palette: Array<[bg, fg]>
}
```

## Remotion notes
- A discriminated union in Zod → `switch (card.type)` → one component per card type.
- `calculateMetadata`: duration = intro + `cards.length × 150` + share card, so users with more data get longer videos automatically.
- This template is where batch rendering really pays off: generate `data/users.json` from a database query and render one video per user (Remotion Lambda at scale).
- Also export the share card as a PNG (`renderStill`) for the in-app share sheet.

## Master prompt
```
Create a Remotion composition called Wrapped.
Format: 1080x1920, 30fps, duration computed from the number of cards (5s each).

Visual identity:
- Rotating duotone palette prop, e.g. [#1DB954,#191414], [#FF4632,#FFE5DD], [#9B5DE5,#F9F871]
- Font: Inter 900 for numbers, 600 for copy
- Motion feel: bouncy & playful

Scenes: intro → one card per item in `cards` (bigNumber | topList | percentile | persona)
→ share card. Color-wipe transitions between cards in the next card's colors.

[Rules block]
```
