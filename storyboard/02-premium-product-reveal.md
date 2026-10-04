# 02 · PremiumReveal – restrained product launch

**Modeled on:** Apple-style launch films. Quiet confidence, crisp typography, generous negative space and one hero product reveal. The motion serves the product message instead of decorating it.

**Use cases:** hardware/product launches, new app versions, premium D2C goods.
**Format:** 1920×1080 + 1080×1920 · 30fps (or 60fps) · 30s
**Motion feel:** smooth and cinematic. Slow eases, nothing bounces.

## Visual identity
- Pure black (#000) or warm white (#F5F5F7). Text in near-white or near-black, plus **one** gradient accent for the product name only.
- Tight-tracked display font (Inter Display 600) with lots of air around it.
- One hero image or video slot for the product (transparent PNG works best).

## Storyboard

| Time | Frame | Action | Motion detail |
|------|-------|--------|---------------|
| 0–3s | Black. A thin light streak crosses the frame | Rim light hints at the product silhouette | Gradient mask sweep, ease-in-out 60f |
| 3–7s | Product emerges from darkness, slowly rotating | Image fades up while scaling 1.15 → 1 | bezier(0.25,0.1,0.25,1) over 90f; subtle 3D `rotateY` |
| 7–10s | Name appears under the product: **"Aero."** with a gradient fill | Letters fade in with a tiny 8px rise, stagger 2f | Long, soft ease. No springs here |
| 10–20s | 3 feature beats. Each: macro crop of the product + one line ("All-day battery.") | Camera pushes in on crop regions of the same image | Ken Burns across `focus` points, each held 3.3s; crossfade 12f |
| 20–25s | Spec row: three big numbers ("18h", "1.1kg", "4K") with small labels | Numbers count up and settle | `<Counter>` with an ease-out; labels follow 6f later |
| 25–30s | Product centered small, name, price/date line, "Available October 24" | Everything settles to a still end card | Final 1s held completely still |

## Props schema
```ts
{
  productName: string, productImage: string, nameGradient: [color, color],
  features: Array<{ line: string; focus: { x: number; y: number; zoom: number } }>,
  specs: Array<{ value: number; suffix: string; label: string }>,
  endLine: string, theme: "dark" | "light"
}
```

## Remotion notes
- `focus` points let one product photo cover all the feature shots: animate `scale` plus `translate` toward each `{x,y}`.
- For a 60fps master, pass `fps` through `calculateMetadata` and express every timing in seconds × fps.
- Use `<Img>`/`CanvasImage` with `premountFor` so large PNGs are decoded before the reveal.

## Master prompt
```
Create a Remotion composition called PremiumReveal.
Format: 1920x1080 and 1080x1920 versions, 30fps, 30 seconds.

Visual identity:
- Background: #000000, text: #F5F5F7, product-name gradient: #A1C4FD → #C2E9FB
- Font: Inter, 600, tight tracking
- Motion feel: smooth & cinematic (long bezier eases, no overshoot)

Scenes:
1. (0–3s) light streak sweeps across black
2. (3–7s) productImage emerges from darkness, scale 1.15→1 with slight rotateY
3. (7–10s) productName fades up letter by letter with a gradient fill
4. (10–20s) features: push-in to each focus point, one line of text each
5. (20–25s) spec counters
6. (25–30s) still end card with endLine

[Rules block]
```
