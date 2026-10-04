# 09 · BrandKit – logo stings + lower thirds + transitions

**Modeled on:** the staple categories that dominate the Envato Elements and Motion Array charts: logo reveals, lower thirds, title cards and transitions. Editors reuse these on every project, so they are the most "template-y" templates there are.

**Use cases:** YouTube/podcast branding, webinar and event packs, agency client packs.
**Format:** 1920×1080 (plus 1080×1920), **transparent** (ProRes 4444 / WebM VP9 alpha) · 30fps · 2–6s each
**Motion feel:** clean and snappy. One brand-consistent motion signature across every piece.

## Pieces in the kit

### A. Logo sting (4s)
| Time | Action |
|------|--------|
| 0–1s | Accent shapes (bars or circles) sweep across in brand colors |
| 1–2.5s | Logo mark assembles from the shapes (scale + mask reveal), POP spring |
| 2.5–3.5s | Wordmark slides out from behind the mark (clip-path) |
| 3.5–4s | Hold, then optional fast exit |

### B. Lower third (6s: in 0.6s, hold, out 0.6s)
| Time | Action |
|------|--------|
| 0–0.6s | Accent bar grows from the left, then the name box wipes open behind it |
| 0.3–0.9s | Name rises in, title follows 4f later |
| hold | Static, so editors can trim it to any length |
| last 0.6s | Reverse order out |

### C. Title card / chapter marker (3s)
Chapter number counts, then the title splits in per word over a thin rule that draws across.

### D. Transitions (0.5s)
Brand-colored shape wipes (bars, circle iris, diagonal) that fully cover the frame at the midpoint, so cuts hide underneath.

## Props schema
```ts
{
  logo: string, wordmark?: string,
  name?: string, title?: string,             // lower third
  chapter?: { number: number; title: string },
  colors: { primary, secondary, text },
  font: string, cornerRadius: number,
  position: "bottom-left" | "bottom-center" | "top-left"
}
```

## Remotion notes
- Register each piece as its own composition inside a `<Folder name="BrandKit">`.
- Transparent export: `npx remotion render ... --codec=prores --prores-profile=4444` (or `vp9` + `--pixel-format=yuva420p`). The **remotion-render** skill has a transparent-videos doc.
- A lower third's "hold" length comes from a `holdSeconds` prop through `calculateMetadata`.
- Batch idea: one `brands.json` → render the whole kit for each client brand (logo + colors + font) in one command.

## Master prompt
```
Create a Remotion folder of compositions called BrandKit: LogoSting (4s), LowerThird (6s),
ChapterCard (3s) and 3 transitions (0.5s each). 1920x1080, 30fps, transparent background.

Visual identity:
- Primary: #7C5CFF, secondary: #00D1B2, text: #FFFFFF
- Font: Inter 700/500
- Motion feel: clean & snappy; one shared motion signature across all pieces

All pieces share one props schema (logo, names, colors, font, position).
Render with ProRes 4444 so they can be dropped onto any edit.

[Rules block]
```
