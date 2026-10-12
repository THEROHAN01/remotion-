# rohansalunkhe.dev — launch film

**Product:** rohansalunkhe.dev, Rohan Salunkhe's portfolio site: a live tile-grid wall beside sliding panes, with a drawn portrait of Rohan that greets visitors and points them to the next thing to read.
**For:** people deciding whether to work with Rohan (hiring managers, founders, recruiters, collaborators).
**One message:** this portfolio is alive. It shows you around and gets you to Rohan.
**Proof moment:** the portrait guides a visitor from "hi" through experience and projects to his email in a few clicks, and "copied. talk soon." lands.
**Payoff line:** *hi. i live here.* (the portrait's real first-visit line)
**Closing:** *building thoughtful web products* · rohansalunkhe.dev

**Motif: the tile.** The site's 19 px tile with a 1 px gap (`CFG.tile`, `CFG.gap`).
- **Hook:** the tiles are dead and unlit. Nothing answers the pointer. That's the problem.
- **Demo:** the same tiles answer every move. Wakes follow the pointer, a light wave opens each pane, and a burst fires on copy.
- **Sign-off:** the tiles gather into the ROHAN wordmark, the same 5×7 glyphs the site spells on load.

**Beat:** 100 BPM (0.6 s). Headline words and the sound pulse land on it.

| # | Time (s) | Section | The viewer sees | They should feel / understand |
|---|---|---|---|---|
| 1 | 0.0–4.8 | Hook | A full frame of dark, unlit tiles. A pointer drifts across them; nothing reacts. Serif headline lands word by word on the beat: **Most portfolios / just sit there.** | "Yes, they all look the same and do nothing." |
| 2 | 4.8–6.6 | Turn | The pointer clicks one tile. The site's real opening splash spreads from that tile and wipes the headline away with light. | Something is different here. |
| 3 | 6.6–8.9 | Turn | The wall spells **ROHAN** letter by letter (the site's real name intro) while the camera settles on the whole site: the about pane with *Rohan Salunkhe · full-stack engineer*. | The product, by name. |
| 4 | 8.9–12.4 | Demo | The portrait wakes. Its eyes follow the pointer and it says *hi. i live here.* The pointer leaves real wake ripples on the wall. | It's a person, and it notices you. |
| 5 | 12.4–15.7 | Demo | Bubble: *start with my experience →*, with the hint glow on **KPoint Technologies**. Hovering previews the wall recolour. Click (14.0): a light wave opens the KPoint pane. *that's where i work.* | It shows you where to look. |
| 6 | 15.7–17.2 | Demo | The camera eases in on the pane's opening paragraph (Prism, the conversational AI platform). | Real, substantial work. |
| 7 | 17.2–21.7 | Demo | *now see what i build →* on **Projects**. Click (18.5): the flowing banner swaps KPoint for the projects list. *here's what i've built.* | Guided, not lost. |
| 8 | 21.7–26.3 | Demo | *pick one. jarvis is my favourite.* Click **jarvis** (23.6): the third pane opens with a wave and the camera pushes in on its description. *ooh, good pick.* | The work is real, and he's proud of it. |
| 9 | 26.3–28.9 | Proof | The pointer clicks the active **Projects** link (26.3). Both panes close in one cascade and the camera glides home. *back home.* | Easy to get back. |
| 10 | 28.9–32.0 | Proof | The visitor clicks the email. Tiles burst from the pane edge, the toast *copied. talk soon.* appears, and the portrait says *i'll write back. promise.* | From first look to contact in one click. |
| 11 | 32.0–34.0 | Payoff | The camera pushes into the portrait. Its bubble re-types *hi. i live here.* and grows off the card into the headline (32.6). | The line to remember. |
| 12 | 34.0–36.3 | Sign-off | The site dims under a jagged takeover of the unlit grid. The bubble collapses into the first tile, and tiles stream in and lock into the ROHAN wordmark. | The motif resolves into the mark. |
| 13 | 36.3–41.5 | Sign-off | The wordmark rises and the lockup comes up with it: **Rohan Salunkhe**, *full-stack engineer*, then *building thoughtful web products* and **rohansalunkhe.dev**. Hold. | Who, what, where. |

**Motion system:**
- One spring (ζ 0.82, ω 7.2).
- Three durations (0.36 / 0.72 / 1.3 s) and one stagger (0.07 s), on a 0.6 s beat.
- One camera, zoom capped at 2.3×.

**Logo in motion:**
- ROHAN spelled by the wall (3).
- The wordmark assembling (12).
- The wordmark rising into the lockup (13).

## Vertical (1080×1920)

Same beats and timing, built on the site's real phone layout. The site's real column sits over the live wall in a 432×768 CSS viewport. The column rises into frame at 8.3 s, after the wordmark.
- **Turn:** the ROHAN wordmark appears on the full-frame wall. *The site itself skips this intro on phones because the word doesn't fit, so on vertical it's a film device.*
- **Demo:** taps instead of a mouse pointer.
  - *experience* scrolls the column to the KPoint section.
  - A drag scrolls on to projects.
  - Tapping **jarvis** expands it in place (+ → −).
  - The column scrolls back up, and tapping the email copies it.
- **Recolour:** phones don't recolour the wall on route changes (the site skips `applyWork` in column mode), so vertical doesn't either.

## What is not real product UI or copy

- **Hook headline** "Most portfolios / just sit there." is film copy. The dead-tile hook frame is an illustration, not a state the site shows.
- **Sign-off:** the tile convergence into the wordmark and the lockup composition are film-only. The wordmark uses the site's real `GLYPHS`.
- **Pointer and tap markers:** drawn by the film.
- **Clock in the meta list:** shows a fixed time (sample data); the site shows live India time.
- **Timing:** hint timings are compressed. On the site, hints wait 4–15 s of dwell and idle time.
- **Hook tiles:** the unlit tiles are drawn at a 10% accent mix so they read on video. The site's unlit grid lines are a 5% mix.
- **Email:** the visitor clicks it unprompted. The site has no email hint.
- **Payoff:** the bubble re-types the first-visit line and grows into a headline. That is film-only, as is the grid takeover that hands off to the sign-off.
- **Vertical:** the ROHAN intro on the film's wider wall, and the column rising into place, are film devices.
- **Logo:** no logo file exists in the repo. The favicon is an "RS" monogram set in text, not SVG paths. The film uses the site's own ROHAN `GLYPHS` as the mark.
- **Sound:** synthesised by the film from the timeline cues. The site has no sound.
