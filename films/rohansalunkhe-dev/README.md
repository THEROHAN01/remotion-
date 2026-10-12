# rohansalunkhe.dev launch film

A 41.5 s launch film for [rohansalunkhe.dev](https://rohansalunkhe.dev), built entirely in code. The site's own CSS, markup, fonts, palette, tile-wall maths, portrait and copy are replayed frame by frame in headless Chromium and encoded with ffmpeg. The story and the list of film-only devices are in [STORY.md](STORY.md).

| Output | Size | |
|---|---|---|
| `out/rohansalunkhe-dev-launch-16x9.mp4` | 1920×1080, 60 fps, H.264 + AAC | laptop layout (1024×576 CSS @1.875) |
| `out/rohansalunkhe-dev-launch-9x16.mp4` | 1080×1920, 60 fps, H.264 + AAC | phone layout (432×768 CSS @2.5) |
| `out/landscape.wav`, `out/portrait.wav` | 48 kHz stereo | synthesised sound, peak −9 dBFS |
| `out/versions/` | | earlier renders, kept before overwriting |

## Render

Requires Node, global Playwright (`npm i -g playwright`), Chromium at `/opt/pw-browsers/...` (or set `CHROME=`), and ffmpeg.

```sh
cd films/rohansalunkhe-dev
node tools/sound.mjs landscape out/landscape.wav     # sound from the timeline's cue list
node tools/sound.mjs portrait  out/portrait.wav
node tools/render.mjs landscape                      # ~7 min on 4 cores; --workers N, --from/--to frame range
node tools/render.mjs portrait
node tools/purity.mjs landscape 40                   # in-order vs shuffled frames must be pixel-identical
node tools/stills.mjs landscape /tmp/s --every 0.5   # stills for review; tools/sheet.mjs tiles them
```

You can also open `film.html?format=landscape` (or `portrait`) from any static server and call `film.seek(t)` in the console.

## Where to change things

- **Copy** (hook, payoff, lockup lines): `COPY` in `src/timeline.js`. The site's own lines (hints, route lines) are verbatim in `src/product.js`.
- **Timing:** `T` in `src/timeline.js` (every beat, in seconds). Camera keys are in `laptopCamera` and `phoneCamera` in the same file. Sound follows automatically because the cues are built from `T`.
- **Motion system:** `src/motion.js` holds the spring, durations, stagger and beat.
- **Site markup and CSS:** regenerate with `node tools/extract.mjs <path-to-rohan.dev-checkout>`. Don't edit `src/site.css` or `src/panes.html` by hand.

## How it works

- `src/sim.js` replays the site's per-frame logic once at load:
  - tile waves, latching, the drawer switch banner, wakes and bursts;
  - portrait gaze, blink and speech;
  - the column scroll.
- It steps a fixed 1/60 s with seeded randomness and stores per-frame snapshots, so `seek(t)` is a pure function of t.
- `src/film.js` measures the real DOM once, after fonts load. Each seek then sets the camera transform, draws the wall canvases and applies the panes', portrait's and overlays' state for that frame.
- CSS transitions and animations are disabled globally (`src/film.css`).
