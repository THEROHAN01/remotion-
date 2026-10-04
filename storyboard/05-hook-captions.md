# 05 · HookCaptions – word-by-word talking-head captions

**Modeled on:** the Hormozi and MrBeast caption styles that dominate Shorts, Reels and TikTok. Big bold all-caps words pop in one at a time with a slight bounce. The active word turns yellow or green, and keywords get emoji or B-roll punch-ins.

**Use cases:** founder clips, podcast cut-downs, UGC ads, course snippets. Any talking-head video.
**Format:** 1080×1920 · 30fps · the source clip's length
**Motion feel:** punchy. A scale bounce on every word.

## Visual identity
- Montserrat/Inter 900, all caps, 90–110px, thick black stroke plus drop shadow.
- Active word color: #FFE600 (or a brand color). Already-spoken words stay white.
- Captions sit in the lower-middle third (y ≈ 62%), clear of the platform UI.

## Storyboard

| Time | Frame | Action | Motion detail |
|------|-------|--------|---------------|
| 0–2s | **Hook card**: a 3–5 word hook in a white box above the speaker's head | Box scales in with POP; "ding" sfx | Stays until 2s, then shrinks away |
| Throughout | 2–4 word caption groups | Each word pops (scale 0.6 → 1.1 → 1) as it's spoken | Timing from the word timestamps |
| Keyword | e.g. "**$10,000**" | Word turns accent color, the video punch-zooms 1 → 1.12 | 6f zoom in, hold, 10f out |
| Emoji beats | 💰 🔥 next to marked keywords | Emoji springs in beside the caption | POP spring, slight rotation |
| B-roll | Optional cutaway image/video over the top 60% | Slides in from the side and covers the speaker | 8f slide, speaker audio continues |
| Last 2s | Progress bar fills + "Follow for part 2" | Bar fills, text pops | — |

## Props schema
```ts
{
  video: string,                       // talking-head source
  captions: Caption[],                 // @remotion/captions format (word, startMs, endMs)
  hook: string,
  keywords: Array<{ word: string; emoji?: string; zoom?: boolean }>,
  broll: Array<{ src: string; fromMs: number; toMs: number }>,
  style: { activeColor, font, fontSize, position: number }
}
```

## Remotion notes
- Load the **remotion-captions** skill. Transcribe with `@remotion/install-whisper-cpp` (local) or an API, then `createTikTokStyleCaptions()` to build the word groups.
- `<Video>` from `@remotion/media`, with `calculateMetadata` reading the clip's duration so the composition always matches the source.
- Keywords are matched case-insensitively. The punch-zoom goes on the video layer, not the captions.
- Batch idea: a folder of raw clips → transcribe → render, for a fully automated Shorts pipeline.

## Master prompt
```
Create a Remotion composition called HookCaptions.
Format: 1080x1920, 30fps, duration = length of the `video` prop.

Visual identity:
- Active word: #FFE600, other words: #FFFFFF with 8px black stroke + shadow
- Font: Montserrat 900, all caps, ~100px
- Motion feel: punchy, every word bounces in

Scenes: hook card (0–2s), word-by-word captions from the captions prop
(TikTok-style pages of 2–4 words), keyword punch-zooms + emoji, optional B-roll cutaways,
end card with progress bar + follow CTA.

[Rules block]
```
