# 07 · StatStory – animated infographic / impact report

**Modeled on:** the data and infographic ad format, which according to the sources now ships as video about two-thirds of the time. The rule the best ones follow: one central insight, 3–5 data points, and motion used only to reveal, emphasize and sequence. A counter that counts up works; one that spins and bounces distracts.

**Use cases:** quarterly results, impact/ESG reports, survey findings, "state of the industry" posts, fundraising updates.
**Format:** 1920×1080 + 1080×1920 · 30fps · 30–60s
**Motion feel:** smooth and editorial. Calm, precise, trustworthy.

## Visual identity
- Off-white paper (#F6F4EF) with ink text (#111) and **one** highlight color for the key series. Everything else is grey.
- A serif headline (e.g. Fraunces) with a sans for the data (Inter, tabular numbers).
- Thin rules, a small source line on every chart.

## Storyboard

| Time | Frame | Action | Motion detail |
|------|-------|--------|---------------|
| 0–5s | Insight headline: "Remote teams ship **31% faster**" | Headline fades up; the key phrase gets a marker highlight | Highlight sweep 14f |
| 5–14s | **Big number** "31%" with a context line | Count-up 0 → 31 with an ease-out; context fades in after | Counter over 40f |
| 14–26s | **Bar chart**, 5 categories, highlight bar in color | Axis draws, bars grow in sequence, value labels follow | Stagger 5f; bars bezier(0.16,1,0.3,1) |
| 26–38s | **Line chart** over time with an annotation callout | Line draws left → right; a dot travels on the end | `strokeDashoffset` path draw over 60f; callout pops at its x |
| 38–48s | **Split stat**: "3 in 5" shown as a person-icon grid | Icons fill in color one by one | Stagger 2f per icon |
| 48–55s | Takeaway sentence + source + logo | Elements settle | — |

## Props schema
```ts
{
  headline: string, highlight: string,
  slides: Array<
    | { type: "bigNumber"; value: number; suffix?: string; context: string }
    | { type: "bar"; title: string; data: Array<{ label: string; value: number }>; highlightIndex: number }
    | { type: "line"; title: string; points: Array<{ x: string; y: number }>; annotation?: { index: number; text: string } }
    | { type: "iconGrid"; filled: number; total: number; caption: string }
  >,
  takeaway: string, source: string,
  colors: { paper, ink, highlight, muted }
}
```

## Remotion notes
- Read the **dataviz** skill before building the chart components (palette, axis and label rules).
- Charts are plain SVG plus `interpolate` (no chart library needed). Scales are simple linear maps from the data min/max.
- `slides` can be generated straight from a spreadsheet or analytics API, so this becomes an automated monthly-report video.

## Master prompt
```
Create a Remotion composition called StatStory.
Format: 1920x1080 and 1080x1920 versions, 30fps, duration from the number of slides.

Visual identity:
- Paper: #F6F4EF, ink: #111111, highlight: #2F6BFF, muted: #B8B5AE
- Fonts: Fraunces for headlines, Inter (tabular numbers) for data
- Motion feel: smooth & editorial, motion only to reveal/emphasize

Scenes: insight headline with highlight → one scene per slide
(bigNumber | bar | line | iconGrid) → takeaway + source + logo.

[Rules block]
```
