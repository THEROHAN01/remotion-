# LaunchPromo – Remotion video template

A 1080×1920 (Reels/Shorts) 30fps promo video. Every bit of text, the colors, the feature list, the task list and the duration come from props validated by a Zod schema (`src/LaunchPromo/schema.ts`).

| Scene | Share of duration (30s cut) | What happens |
| --- | --- | --- |
| Hook | 10% (0–3s) | Headline types on word by word, accent underline sweeps in |
| Features | 30% (3–12s) | 1–4 feature cards slide up staggered, then each is spotlighted |
| Phone | 33% (12–22s) | Phone scales in; 1–6 tasks get checked off with a pop, progress ring fills |
| Outro | 27% (22–30s) | Logo springs in, brand name + tagline + CTA fade up |

Changing `durationInSeconds` scales all scenes proportionally.

## Commands

```console
npm i
npm run dev            # Remotion Studio preview: edit props live in the sidebar
npm run render:all     # render every variant in data/variants.json to out/[slug].mp4
npx remotion render LaunchPromo out/promo.mp4 --props=my-props.json   # one-off render
```

`render-all.mjs` options:

```console
node render-all.mjs --only=ledgerly-beta,fitloop-launch   # subset by slug
node render-all.mjs --data=data/other.json                # different variants file
REMOTION_BROWSER_EXECUTABLE=/path/to/chrome node render-all.mjs
```

## Adding a variant

Add an entry to `data/variants.json`:

```json
{
  "slug": "my-product",
  "props": {
    "brandName": "…", "headline": "…",
    "features": [{ "title": "…", "icon": "focus" }],
    "phoneTitle": "…", "tasks": ["…"],
    "tagline": "…", "cta": "…",
    "colors": { "background": "#0B0B0F", "accent": "#7C5CFF", "text": "#FFFFFF" },
    "durationInSeconds": 30
  }
}
```

Icons: `focus`, `streak`, `tasks`, `bolt`, `calendar`, `chart`, `sparkle`, `shield`.
Props are validated against the schema before rendering, so a bad entry fails with a clear message and the other variants still render. Since the input is just a JSON array, you can just as easily generate it from a CSV, a database or an API.

## Notes

- Inter is bundled in `public/fonts` (OFL license) so renders don't need network access.
- Remotion Agent Skills are installed in `.claude/skills` (`npx skills add remotion-dev/skills`).
