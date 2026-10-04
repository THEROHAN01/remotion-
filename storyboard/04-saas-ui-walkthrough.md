# 04 · UIWalkthrough – premium SaaS feature film

**Modeled on:** Linear, Stripe and Notion launch videos. Dark UI on black with soft gradient glows, a crisp UI walkthrough, a camera that pushes into the interface, and a real workflow shown instead of a feature list.

**Use cases:** feature launches, changelog videos, landing-page hero loops, investor demos.
**Format:** 1920×1080 (plus a 1080×1350 cut-down) · 30fps · 45s
**Motion feel:** snappy and technical, with smooth camera moves.

## Visual identity
- #08090A background, a 1px border at 8% white, and a blurred gradient "aurora" behind the app window.
- Inter, small UI text, big headline text between shots.
- A **fake cursor** that moves along eased paths and clicks with a ripple.

## Storyboard

| Time | Frame | Action | Motion detail |
|------|-------|--------|---------------|
| 0–4s | Headline: "Plan sprints in seconds." | Words rise with a blur-to-sharp effect | Stagger 4f, SNAPPY spring |
| 4–8s | App window floats in, perspective-tilted, over the aurora glow | Window rotates from `rotateX(18deg)` to flat | 30f eased; glow breathes |
| 8–18s | **Shot 1:** cursor opens the command palette, types "new cycle" | Camera zooms 1 → 1.8 onto the palette; characters type | Typing at 2f/char; camera bezier 20f |
| 18–28s | **Shot 2:** issues drag into the sprint column | Cards fly along arcs; counters update | Each card 12f, stagger 6f |
| 28–36s | **Shot 3:** a chart animates (burn-down line draws) | Camera pans right to the chart panel | SVG path draw with `strokeDashoffset` |
| 36–41s | Three quick feature captions over a split-screen of UI crops | Hard cuts every 1.6s | Cuts land on music beats |
| 41–45s | Logo + "Available today" + URL | Window zooms out and fades into the logo | Shared scale-down 20f |

## Props schema
```ts
{
  headline: string,
  screenshots: { app: string; palette?: string; board?: string; chart?: string },
  shots: Array<{ caption: string; focus: { x: number; y: number; zoom: number }; cursorPath: Array<[x, y]>; clickAt?: number }>,
  features: string[], cta: string, url: string,
  colors: { background, glowA, glowB, text }
}
```

## Remotion notes
- Two ways to do the UI: **(a)** screenshots plus a camera on `focus` points (fast to make), or **(b)** rebuild the UI in React so elements can really animate (best quality). Start with (a) and upgrade the hero shot to (b).
- A `<Camera>` wrapper that applies `scale`/`translate` around a focus point keeps every shot consistent.
- `<Cursor>` takes a path of points with `interpolate` over x and y, eased per segment, and shows a click ripple at `clickAt`.

## Master prompt
```
Create a Remotion composition called UIWalkthrough.
Format: 1920x1080, 30fps, 45 seconds.

Visual identity:
- Background: #08090A, glow: #5E6AD2 → #A855F7, text: #F7F8F8
- Font: Inter
- Motion feel: snappy & technical with smooth camera moves

Scenes:
1. (0–4s) headline blur-rises in
2. (4–8s) app screenshot window tilts in over an aurora glow
3. (8–36s) three shots: a camera pushes to each focus point while a fake cursor follows cursorPath and clicks
4. (36–41s) beat-cut feature captions
5. (41–45s) zoom-out into logo + CTA + URL

[Rules block]
```
