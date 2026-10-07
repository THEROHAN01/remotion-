# Remotion video templates

Props-driven, batch-renderable motion templates. Each one has a Zod schema (editable in the Studio sidebar) and example variants in `data/`.

| Template | Compositions | Storyboard | Example data |
| --- | --- | --- | --- |
| **LaunchPromo** | `LaunchPromo` (9:16) | – | `data/variants.json` |
| **FlashSale** | `FlashSale` (9:16), `FlashSale-Feed` (4:5) | `storyboard/06-flash-sale-countdown.md` | `data/flash-sale.json` |
| **KineticType** | `KineticType` (9:16), `KineticType-Square` (1:1) | `storyboard/01-kinetic-typography-ad.md` | `data/kinetic-type.json` |
| **StatStory** | `StatStory` (16:9), `StatStory-Vertical` (9:16) | `storyboard/07-data-stat-story.md` | `data/stat-story.json` |
| **GrainOpener** | `GrainOpener` (16:9), `GrainOpener-Vertical` (9:16), 24fps | `storyboard/08-grain-texture-opener.md` | `data/grain-opener.json` |

Shared code lives in `src/shared/` (`motion.ts` for springs/eases/helpers, `fonts.ts` for the bundled fonts). Storyboards for the remaining templates are in `storyboard/`.

- **FlashSale**: ticker bands, product drop with a discount stamp, old→new price countdown, deal carousel, flip-clock timer, CTA and code. Prices are formatted for any currency/locale. Product images are paths in `public/` or URLs (`public/products/*.svg` are placeholder illustrations).
- **KineticType**: the `beats` array is the script. Each beat picks a style (`slam`, `stack`, `invert`, `wipe`, `shatter`, `highlight`) and a length; use `/` in the text for line breaks or fragments. Duration = the sum of the beats + the outro.
- **StatStory**: headline with a highlighted phrase, then any mix of `bigNumber`, `bar`, `line` and `iconGrid` slides, then a takeaway. One highlight color against grey context, direct value labels and a source line on every slide. Duration comes from the slide list.
- **GrainOpener**: a 10s textured opener with a 3-2-1 film leader and light leak. Torn paper strips slap on in stop-motion (`stopMotionFps`), 1–3 photos become halftone cutouts taped to the board (`tint` prints one in the accent color), the title is rubber-stamped letter by letter, the subtitle typewrites, and a film burn fades to black. Animated grain and scratches run on top. `seed` changes every torn edge and jitter deterministically. `public/photos/*.svg` are placeholder images; use your own photos via a path or URL.

## Sound effects

Templates can play frame-accurate sound effects from `public/sfx/` (see `public/sfx/CREDITS.md`; CC0 Kenney sounds plus synthesized ones, rebuilt with `scripts/build-sfx.sh`). Turn them on per variant:

```json
"sound": { "sfx": true, "sfxVolume": 0.9 }
```

Leave `sound` out for a silent render. Cues are placed by the template itself (`<Sfx name="…" at={frame} />` from `src/shared/sfx.tsx`), so they stay in sync whatever the text or timing.

| Template | Sound support |
|---|---|
| KineticType | ✅ slam: impact + sub · stack: click per line · invert: thud + sub · wipe: panned whoosh per fragment · shatter: hit + glass break · highlight: ticks + marker swipe · outro: chime, pop, tick |
| LaunchPromo, FlashSale, StatStory, GrainOpener | not yet |

## LaunchPromo

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
npm run render:all     # render every variant in every data/*.json to out/[slug].mp4
npx remotion render LaunchPromo out/promo.mp4 --props=my-props.json   # one-off render
```

`render-all.mjs` options:

```console
node render-all.mjs --only=ledgerly-beta,fitloop-launch   # subset by slug
node render-all.mjs --data=data/flash-sale.json           # one variants file
REMOTION_BROWSER_EXECUTABLE=/path/to/chrome node render-all.mjs
```

## Adding a variant

Add an entry to any file in `data/`. Set `"composition"` to the composition id (it defaults to `LaunchPromo`). For a LaunchPromo variant:

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

- Inter, Anton, Space Grotesk, Fraunces and Special Elite are bundled in `public/fonts` (licenses included) so renders don't need network access.
- Remotion Agent Skills are installed in `.claude/skills` (`npx skills add remotion-dev/skills`).
