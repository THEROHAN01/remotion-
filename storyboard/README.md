# Storyboards – next Remotion templates

These are storyboards for 10 new templates. Each one is modeled on a motion format that big brands, template marketplaces or top editors use heavily right now. Every storyboard is written so it can become a props-driven, batch-renderable template, the same way `LaunchPromo` works (Zod schema → `data/*.json` → `render-all.mjs`).

> These are *style references*, not copies. Never use another brand's logo, typefaces, music or footage. Take the pacing, structure and motion language only.

## Index

| # | Template | Modeled on | Format | Length | Build effort |
|---|----------|-----------|--------|--------|-------------|
| 01 ✅ | [KineticType](01-kinetic-typography-ad.md) | 2026's #1 cited trend: text *is* the animation | 9:16 + 1:1 | 15s | ★★☆ |
| 02 | [PremiumReveal](02-premium-product-reveal.md) | Apple-style restrained product launch | 16:9 + 9:16 | 30s | ★★★ |
| 03 | [Wrapped](03-wrapped-year-in-review.md) | Spotify Wrapped personalized stats story | 9:16 | 20–40s | ★★★ |
| 04 | [UIWalkthrough](04-saas-ui-walkthrough.md) | Linear / Stripe / Notion launch films | 16:9 | 45s | ★★★ |
| 05 | [HookCaptions](05-hook-captions.md) | Hormozi / MrBeast word-by-word captions | 9:16 | any | ★★☆ |
| 06 ✅ | [FlashSale](06-flash-sale-countdown.md) | E-commerce drops, Black Friday countdowns | 9:16 + 4:5 | 10–15s | ★☆☆ |
| 07 ✅ | [StatStory](07-data-stat-story.md) | Animated infographic / impact report | 16:9 + 9:16 | 30–60s | ★★☆ |
| 08 ✅ | [GrainOpener](08-grain-texture-opener.md) | 2026 "authentic" trend: grain, collage, grunge | 16:9 + 9:16 | 8–12s | ★★☆ |
| 09 | [BrandKit](09-logo-reveal-lower-thirds.md) | Envato/Motion Array staples: logo stings, lower thirds | 16:9, transparent | 3–6s each | ★☆☆ |
| 10 | [HypeCut](10-beat-synced-hype-montage.md) | Nike-style sports/fitness reels | 9:16 | 15–30s | ★★★ |

✅ = built (see `src/`). Effort: ★☆☆ = one afternoon, ★★★ = needs new building blocks (camera moves, audio analysis, media slots).

## Suggested build order

1. **06 FlashSale** and **09 BrandKit**: quick wins that reuse what LaunchPromo already does (springs, CTA, Zod props).
2. **05 HookCaptions**: uses `@remotion/captions` (there's a Remotion skill for it), and it can overlay any talking-head video, which makes it the most reusable piece.
3. **01 KineticType**, then **07 StatStory**: these give the template library a text engine and a chart/counter engine.
4. **03 Wrapped**, **04 UIWalkthrough**, **02 PremiumReveal**, **10 HypeCut**: the flagship pieces, built on top of the blocks above.

## Shared building blocks to extract first

Several storyboards reuse the same parts. If these are built once in `src/shared/`, every new template is mostly composition work:

- `motion.ts`: already exists in LaunchPromo (SNAPPY/POP springs, `enter`, `exit`, `mix`). Promote it to shared.
- `<SplitText>`: animates text per word or per character with a stagger (01, 02, 03, 05, 08).
- `<Counter>`: eased number count-up with locale formatting (03, 06, 07).
- `<MediaSlot>`: an image or video prop with cover/contain and Ken Burns (02, 08, 10).
- `<Grain>` / `<Texture>`: an animated noise overlay (08, 10, optional everywhere).
- `useBeats()`: beat timestamps from props or audio analysis, used to place cuts (10, optional for 01).
- Format presets: `9:16`, `1:1`, `4:5`, `16:9` via `calculateMetadata`, so a single template can render every aspect ratio.

## How to use a storyboard

Each file ends with a **Master prompt** block in the same format as the LaunchPromo prompt. Paste it into Claude Code in this repo to build that template, then add variants to a JSON file and batch-render.

## Research sources

- [Video and motion creative trends 2026 – Graphic Design Junction](https://graphicdesignjunction.com/2026/01/video-and-motion-creative-trends-2026/)
- [Motion graphics trends 2026 – AutoAE](https://autoae.online/blog/motion-graphics-trends-2026)
- [Apple-style product launch video – Mosaic/Motion](https://motion.so/learn/apple-style-product-launch-video)
- [7 Kinetic Typography Examples for Brand Video – Moonb](https://www.moonb.io/blog/kinetic-typography)
- [Kinetic typography: the what, why and how – Linearity](https://www.linearity.io/blog/kinetic-typography/)
- [Exploring the Animation Landscape of 2023 Wrapped – Spotify Engineering](https://engineering.atspotify.com/2024/1/exploring-the-animation-landscape-of-2023-wrapped)
- [Making of Spotify Wrapped 2023 – The Brand Identity](https://the-brandidentity.com/interview/raw-playful-and-laced-with-a-chaotic-energy-we-dive-into-the-making-of-spotify-wrapped-2023)
- [Spotify used Rive for Wrapped 2025 – Rive](https://rive.app/blog/spotify-used-rive-for-spotify-wrapped-2025)
- [How Spotify's Wrapped 2022 came together – It's Nice That](https://itsnicethat.com/features/spotify-wrapped-campaign-identity-2022-graphic-design-301122)
- [SaaS product demo videos: 7 examples – Moonb](https://www.moonb.io/blog/saas-product-demo-video)
- [The rise of Linear style design – UX Design Bootcamp](https://bootcamp.uxdesign.cc/the-rise-of-linear-style-design-origins-trends-and-techniques-4fd96aab7646)
- [Alex Hormozi editing style in 2026 – Joyspace](https://joyspace.ai/hormozi-editing-style-2026-analysis)
- [Re-create popular editing styles – Choppity](https://www.choppity.com/tools/recreate-video-editing-style/)
- [Best After Effects & motion template sites – Videomaker](https://www.videomaker.com/buyers-guide/best-after-effects-and-motion-graphics-template-sites/)
- [Data & infographic ad format – Hawky](https://hawky.ai/ad-gallery/formats/data-infographic)
- [Animated infographic video principles – Knowlify](https://knowlify.com/articles/animated-infographic-video-maker)
- [Countdown / flash-sale templates – Pippit (CapCut)](https://pippit.capcut.com/templates/countdown-text-template)
- [Fitness motivation reel (Nike-inspired) – Revid](https://www.revid.ai/make/fitness-motivation-reel-generator)
- [Reels business launch promo – Envato Elements](https://elements.envato.com/reels-business-launch-promo-XVUKXTC)
