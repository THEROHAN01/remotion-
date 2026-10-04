# 10 · HypeCut – beat-synced sports/fitness montage

**Modeled on:** Nike-style sports and fitness reels. Rapid intercut editing (slow-motion moments against high-speed shots), every cut on the beat, and text only where it adds meaning. It works best when each shot is short and the music has a clear beat.

**Use cases:** gym/fitness brands, sports teams, event aftermovies, athlete highlights, apparel drops.
**Format:** 1080×1920 · 30fps · 15–30s (follows the track)
**Motion feel:** aggressive and rhythmic. Speed ramps, flash frames, hard cuts.

## Visual identity
- Footage-led. Color grade via a CSS filter (contrast up, slight desaturation, crushed blacks).
- Text: a huge condensed italic sans, all caps, white with an accent underline. Only 3–5 words total across the whole video.
- Flash frames (2f white/accent) and short RGB-split glitches on drops.

## Storyboard

| Section | Frame | Action | Motion detail |
|---------|-------|--------|---------------|
| Intro (bars 1–2) | Black, breathing sound, a single slow-mo clip fades up | Slow push-in | Clip at 0.5× playbackRate |
| Build (bars 3–4) | Clips cut every **2 beats** | Each cut has a quick zoom punch 1.08 → 1 | Cuts snapped to beat timestamps |
| Word hits | **"NO."** / **"DAYS."** / **"OFF."** | Each word slams in on a beat over the footage | 1 word per beat, 2f flash frame before each |
| Drop | Clips cut every **beat**, speed ramps (0.5× → 2×) | RGB split on the drop beat | Glitch for 4f only |
| Outro | Freeze frame on the last clip, desaturates, logo + tagline | Freeze, then the logo stamps in | `freeze` prop on the clip; logo POP spring |

## Props schema
```ts
{
  music: string,
  beats?: number[],                    // seconds; auto-detected if omitted
  clips: Array<{ src: string; trimBefore?: number; speed?: number; hero?: boolean }>,
  words: string[],                     // placed on beats in the "Word hits" section
  logo: string, tagline: string,
  grade: { contrast: number; saturation: number },
  accent: string
}
```

## Remotion notes
- Beats: pass them from a DAW or tap-tempo, or detect onsets from the audio in Node before rendering (`@remotion/media-utils` `getAudioData` + simple energy peak picking), then store them in the variant JSON. Load the **remotion-markup** audio-visualization and sfx docs.
- Build the cut list in `calculateMetadata`: walk through the beats and assign clips round-robin. `durationInFrames` = music length.
- `<Video>` from `@remotion/media` with `trimBefore` and `playbackRate` per clip. Use `premountFor` generously because there are many short clips.
- Batch idea: the same clip pool with 3 different tracks gives 3 completely different edits.

## Master prompt
```
Create a Remotion composition called HypeCut.
Format: 1080x1920, 30fps, duration = music length.

Visual identity:
- Accent: #D7FF00, text: #FFFFFF, footage graded high-contrast & slightly desaturated
- Font: a condensed italic sans, all caps, huge
- Motion feel: aggressive & rhythmic

Scenes: intro slow-mo → build (cut every 2 beats) → word hits (one word per beat
with flash frames) → drop (cut every beat, speed ramps, RGB split) → freeze-frame outro with logo.
All cuts snap to the `beats` prop.

[Rules block]
```
