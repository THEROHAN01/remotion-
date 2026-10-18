Make a launch film for <PRODUCT>, built entirely in code from this repository.


Fill these in. Leave any blank and work it out from the repo, then tell me what you chose.
Product and who it's for: <...>
The one message the viewer should leave with: <...>
The moment that proves it (the flow to demo): <...>
Where the UI, design tokens, fonts and logos live: <paths, or blank>
Closing line and URL: <...>
Output folder (new; the only place you may write): <...>
Length and formats: 35–45 s; 1920×1080 and 1080×1920, 60 fps, H.264
What I'm after
A film I could post as a product launch: a short story with the real product at its centre, not a screen recording and not a generic template. Someone who has never seen the product should understand the problem, watch the product solve it, and remember one line.
Stay true to the product
Rebuild the interface in code (HTML/CSS/SVG) instead of screenshotting it, so every frame is sharp and animatable. Read the real components first and take layout, spacing, colours, icons and every word of copy from them. Use only the product's own fonts and palette. Trace the flow you're demoing through the code so the film behaves the way the product does, including steps you might not expect (confirmations, disabled states, loading states). If the product has no graphical UI (a CLI, API or library), rebuild what its user actually sees: a terminal or editor with real commands and real output.
Every claim must be something the product does today. No invented numbers, customers, testimonials or features. Invented sample data (a user's name, example content) is fine; tell me what you made up. If you illustrate something that isn't a real screen, tell me that too. Use logos by inlining their real SVG paths: animate their parts, but never redraw or recolour them. If a brand file doesn't contain what you'd expect, flag it instead of working around it.
Story before code
Write STORY.md first: one row per beat, with what the viewer sees and what they should feel or understand. The arc: a hook showing a specific, recognisable pain; a turn that introduces the product by name; a demo that shows intent rather than features; a proof moment where the benefit visibly happens; a payoff line; a sign-off. Pick one visual motif taken from the product itself and carry it through: it appears in the hook as the problem, in the demo as the answer, and in the sign-off it resolves into the logo.
One idea per screen, short copy, real product language wherever it exists. Build to that script and keep it in sync with what you ship.
Pipeline
Check what's installed first (node, python, ffmpeg, Chrome or Chromium, whatever is in node_modules) and pick the simplest pipeline that gives exact control of every frame. A good default: one HTML page exposing seek(t) and a duration, plus a small script that drives headless Chrome, screenshots each frame and pipes them to ffmpeg.
Whatever you choose, every frame must be a pure function of t: no CSS transitions, timers, or state carried over from the previous frame. Prove it by rendering frames out of order and getting the same result. Measure layout once, after fonts load. Lay the page out at a small viewport and render at a higher device scale (for example 1024×576 at 1.875× for 1080p) so interface text is large enough to read on a phone.
Motion
Use one motion language for the whole film: one easing family (damped springs work well), two or three durations, one stagger, and a beat that headline words and sounds land on. Give big moves anticipation and follow-through, and overlap actions instead of starting everything at once. Sections hand over through a shared element, a mask, a wipe or a shape morph, never a hard cut or a fade through black or white. In the demo, every movement is caused by an action (typing, a click, a response arriving), with a visible pointer.
Put the product on one stage with a single camera transform computed from t. Push in slowly and follow the caret while text is typed, ease toward each click before it happens and back out after, and drift to whatever happens next. Cap the zoom so what's being read stays in frame. Get depth from scale, layering and parallax; no 3D, glows, particles or decorative gradients. Keep colour to the brand palette and neutrals, and reserve any accent colour for the one meaning it has in the product.
Use the logo in motion two or three times, where it carries meaning (the turn, the sign-off): assemble it from its parts, draw it on, or use one of its shapes as a transition.
Sign-off
End on a designed final frame: the motif resolves into the logo, the logo settles into a lockup, then one closing line and the URL. It has to work as a still thumbnail, so compose it separately for landscape and vertical: balanced, nothing cut off, readable at phone size.
Sound
Optional. If you add it, synthesise it in code from the same timeline (key and pointer clicks, a soft pulse on the beat, something for each transition), keep it quiet, and check the levels. You can't hear it, so say so.
Check your work by looking
You can view the images you render, so use that throughout. For each format, render a still every half second, tile them into contact sheets, look at them, and fix what looks off: text too small, two things competing for attention, the camera fighting the action, an empty or frozen moment, a transition that's really a cut, anything that looks like a generic AI video. Step through transitions at 0.1 s. Look at the final frame full size. After encoding, pull frames from the video files themselves and confirm resolution, frame rate, frame count and audio with ffprobe. Repeat until you'd post it.


Rules
Work only in the output folder and change nothing else in the repo. If earlier renders exist there, copy them to versioned names before overwriting so we can compare. Don't stop to ask unless you're truly blocked; make the call and tell me.


When you're done, tell me: the story in five lines, where the files are, how to re-render and where to change copy and timing, anything in the film that isn't real product UI or copy, anything you couldn't verify, and the three things you'd improve next.
