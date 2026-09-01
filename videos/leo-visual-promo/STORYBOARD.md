---
format: 1920x1080
duration: 20s
message: "One studio takes your brand from a blank page to every channel."
arc: Hook (blank page → brand) → Product_Intro (the brand builds itself) → Benefits (it deploys on four screens) → Brand_Outro (the screens collapse into Leo Visual)
audience: founders, small brands and agencies looking for a designer (international)
mode: autonomous
music: none
narration: none
language: en
---

## Video direction

- **Palette system (frame.md — Cobalt Grid, two-color only):** ground = `paper` #F0EBDE with the permanent graph-paper grid (`grid` rgba(31,43,224,0.10), ~2cqw cells) and the top + bottom cobalt hairlines; the only ink = `ink` #1F2BE0 for every headline, wordmark, rule, outline and filled cell; `ink-soft` #5560E5 for editorial sub-lines only; `ink-faint` rgba(31,43,224,0.18) for dividers and "off" cells; `paper-2` #E6E0CE for a secondary paper surface (the screen bodies). Never a second hue, never a gradient, never a rounded corner, never a shadow.
- **Type by role (frame.md):** display = Newsreader 400, negative-tracked, cobalt (`display-hero` / `display-chapter` / `display-closing` / `headline`); labels = Hanken Grotesk 600 uppercase tracked (`micro-strong`); chrome = DM Mono (`mono-tag`, `mono-chrome`). Hierarchy by size only.
- **Motion grammar + reveal model:** smooth long-tail settles (`power3` default; `expo.out` on fast arrivals) — no overshoot, no bounce. This video is **silent**: every reveal is cued to the on-screen text beat named in the Scene lines instead of a voiceover; nothing appears before its cue, and reveals spread across the back half of each frame. Aliveness during a hold = a blinking caret or nothing at all.
- **Rhythm / held frames:** Frame 1 holds after the retype (the promise reads still); Frame 2 holds its finished brand for the last ~0.8s (breather before the deploy); Frame 4 is the long hold — the lockup + URL read dead-still for the final ~40% of runtime.
- **Continuity:** one canvas throughout — the same paper + grid + hairlines on every frame, so the cuts read as one page evolving. The four screens carry a numerical handoff from Frame 3 into Frame 4 (see `handoff_out` / `handoff_in`).
- **Negative list:** no second ink color, no gradients, no rounded corners, no drop shadows, no photographic stock, no phone bezels / browser chrome / real cursors (screens are bare cobalt-hairline rectangles), no floating bokeh, no "AI" purple-blue, no infinite loops, no `Math.random`, no CSS transitions. Neither failure mode: no slideshow (front-load then freeze) and no screensaver (elements floating independently). No mid-frame exits except the seam cuts named below.
- **Caption band:** captions are disabled, but all load-bearing content stays inside the top ~83% of the canvas (below y≈896px nothing important lands).

## Frame 1 — A blank page

- scene: A caret types "A blank page." on the empty grid, backspaces, and retypes "A brand."
- duration: 3.5s
- poster: 3.2s
- transition_in: cut
- status: animated
- src: compositions/frames/01-blank-page.html
- type: hook
- persuasion: Outcome promise — the viewer's own transformation, in five words
- beat: promise
- blueprint: typewriter-reveal (Adapt)
- asset_candidates: none — built in-composition (typography only)
- focal: the typed display line
- roles: typed line = hero · mono brief tag = supporting · grid + hairlines = background
- voiceover: none (silent)

Adapt: keep the signature — a live caret types, then backspaces and retypes the key word; drop the brand payoff pop (the brand builds in Frame 2 instead). The empty grid IS the blank page.

Scene 1 (0.0–0.4s): only the ground — paper, graph-paper grid, top + bottom cobalt hairlines. A DM Mono `mono-tag` chrome line "001 — BRIEF" fades in top-left on the safe line (`edge` inset), and a cobalt caret blinks alone at the left of the display baseline (left-anchored, upper-third; ~45% empty). Nothing else.
Scene 2 (0.4–1.9s): **type-on with caret** (`discrete-text-sequence` + `context-sensitive-cursor`): "A blank page." types character by character in Newsreader `display-chapter`, cobalt, left-anchored on the same baseline; the caret trails and blinks. Camera locked.
Scene 3 (1.9–2.3s): hold; caret blinks twice.
Scene 4 (2.3–3.1s): **backspace-and-retype** (`discrete-text-sequence`): "blank page." deletes character by character back to "A ", then "brand." types in — the line now reads "A brand." Same size, same baseline, so the eye never moves.
Scene 5 (3.1–3.5s): held read — "A brand." still, caret blinking; the mono tag flips in place to "001 — BRIEF ✓" (one hard swap). No drift, no push.

## Frame 2 — The brand builds itself

- scene: On the same grid a brand assembles part by part — wordmark, palette cells, type spec, first layout — each ticked off in a mono ledger at the left
- duration: 6.5s
- poster: 5.8s
- transition_in: crossfade 0.4s
- status: outline
- src: compositions/frames/02-brand-build.html
- type: product_intro
- persuasion: Mechanism as spectacle — watch the deliverable come into existence
- beat: build
- blueprint: logo-assemble-lockup (Adapt — Brand_Outro parts-arrive variant, extended with a ledger)
- asset_candidates: none — built in-composition (wordmark, cobalt cells, hairline rectangles)
- focal: the "Your Brand" wordmark
- roles: wordmark = hero · palette cells + type spec + first-layout card = supporting (arrive on cue) · ledger rows = chrome · grid + hairlines = background
- voiceover: none (silent)

Adapt: keep the signature — the mark is BUILT from arriving parts (letters slide in one by one, terminal punctuation lands) and resolves into a held lockup. Change: the "mark" is a sample wordmark that literally reads "Your Brand", and each part that arrives on the right is ticked off in a four-row DM Mono ledger on the left (`01 wordmark · 02 palette · 03 type · 04 layout`), so the frame reads as a brand system being delivered, not a logo sting. No confetti, no pixel-stripe streak — the risograph system stays flat.

Scene 1 (0.0–0.6s): ground continues from Frame 1 (paper + grid + hairlines). Asymmetric 30/70: at the left, inside the safe edge, the four-row ledger enters via **per-word staggered reveal** (`dynamic-content-sequencing`) top to bottom — each row = mono ordinal + Hanken `micro-strong` label, `ink-faint` 1px dividers between rows, all rows at 35% opacity (unchecked). The right 70% is empty grid. The mono chrome top-left now reads "002 — BUILD".
Scene 2 (0.6–2.2s): **sequential per-letter slide-in** (`dynamic-content-sequencing`): "Your Brand" arrives letter by letter, left→right, in Newsreader `display-hero` cobalt, centered in the right region at upper-third height — each letter slides a short distance up into its slot on a long-tail settle; the terminal letter lands and the whole word settles. As it completes, ledger row `01 wordmark` snaps from 35% to 100% opacity with a mono "✓" hard-swapping in at its right edge (`discrete-text-sequence`).
Scene 3 (2.2–3.6s): beneath the wordmark, a row of four square palette cells assembles via **item stagger-assemble** (`dynamic-content-sequencing` — each cell fades + slides a short distance directly into its slot, ~0.12s apart) — four 0-radius squares, filled cobalt at 100% / 60% (`ink-soft`) / 18% (`ink-faint`) / 10% (`grid`), each with a tiny DM Mono hex label under it; the fourth cell lands and row `02 palette` ticks ✓.
Scene 4 (3.6–4.8s): to the right of the cells, a two-line type spec **types on with caret** (`discrete-text-sequence`): line 1 in Newsreader `table-name` "Newsreader 400", line 2 in Hanken `micro-strong` "HANKEN GROTESK 600 · DM MONO"; caret disappears on completion; row `03 type` ticks ✓.
Scene 5 (4.8–5.7s): a first layout card arrives via **item stagger-assemble** (`dynamic-content-sequencing`): a 1.5px cobalt-outlined rectangle fades + slides a short distance up into the lower-right of the region (a small poster), then inside it the wordmark repeats at `table-name` size and two `ink-faint` text bars land one after another; the card settles and row `04 layout` ticks ✓ — the ledger is fully lit.
Scene 6 (5.7–6.5s): held read — the whole brand system sits still (wordmark, cells, spec, card, ledger). No push, no breathing. The breather before the deploy.

## Frame 3 — One brand, every channel

- scene: Four bare 9:16 screens outline themselves side by side — Instagram, TikTok, LinkedIn, YouTube — and fill with the brand's content one after another; the headline "One brand. Every channel." lands above
- duration: 6.5s
- poster: 5.6s
- transition_in: push-slide LEFT
- status: outline
- src: compositions/frames/03-four-screens.html
- type: benefit_highlight
- persuasion: Breadth as one gesture — the brand deploys everywhere at once
- beat: deploy
- blueprint: grid-card-assemble (Adapt — Key_Feature grid variant, four items, bookend headline)
- asset_candidates: none — built in-composition (four hairline screens, cobalt cells and bars, small wordmark)
- focal: the four screens
- roles: four screens = hero (assemble on cue) · channel labels = chrome · headline = payoff (arrives last) · grid + hairlines = background
- voiceover: none (silent)
- handoff_out: four-screens — four 0-radius rectangles, 280×498px each (9:16), tops at y=300px, bottoms at y=798px, lefts at x=310 / 650 / 990 / 1330px (60px gaps; the block is centered at x=960), 1.5px cobalt outline, `paper-2` fill, contents fully revealed, opacity 1, scale 1, no motion (static hold) at the cut. Headline "One brand. Every channel." in Newsreader `headline`, centered at x=960, baseline y≈215px, opacity 1, static. Channel labels (Hanken `micro-strong`, uppercase) centered under each screen at y≈830px, opacity 1. Ground: paper + grid + hairlines, identical to every frame.

Adapt: keep the signature — N items self-assemble in a staggered cascade into a grid and hold, with a headline bookend. Change: four items (not a 3×3), each item is a bare 9:16 screen that first outlines itself and then populates with content sequentially (one screen per beat, ~0.8s each), and the headline arrives AFTER the array (payoff), not before. No camera zoom-out, no traveling glow, no float on the hold — the frame ends dead still so Frame 4 can pick the screens up at the exact same coordinates.

Scene 1 (0.0–1.0s): ground continues (paper + grid + hairlines); mono chrome top-left "003 — DEPLOY". The four screens **draw themselves** (`svg-path-draw`) as 1.5px cobalt rectangle outlines, staggered left→right (~0.1s apart), at the exact handoff geometry (280×498px, tops y=300, lefts x=310/650/990/1330); their `paper-2` fill fades in as each outline closes. Full-width strip framing, four equal panels, centered; the upper third stays empty for the headline.
Scene 2 (1.0–1.8s): channel labels arrive under each screen via **per-word staggered reveal** (`dynamic-content-sequencing`), left→right: "INSTAGRAM" · "TIKTOK" · "LINKEDIN" · "YOUTUBE" in Hanken `micro-strong` cobalt.
Scene 3 (1.8–2.6s): screen 1 (Instagram) populates via **item stagger-assemble** (`center-outward-expansion`, short-path form): a square cobalt cell (a post image stand-in, 100% ink) fills the upper half of the screen, "Your Brand" in Newsreader `table-name` sits above it as the account name, three `ink-faint` caption bars slide in beneath.
Scene 4 (2.6–3.4s): screen 2 (TikTok) populates: a full-bleed `ink-faint` field fills the screen, a tall cobalt cell (a vertical video stand-in) occupies its center, and the small wordmark plus two `ink-faint` bars stack at its lower-left — same stagger-assemble move.
Scene 5 (3.4–4.2s): screen 3 (LinkedIn) populates: the small wordmark top-left as the author line, then five `ink-faint` text bars of varying width **type on** line by line (`dynamic-content-sequencing`), then a small cobalt square "attachment" cell lands at the bottom.
Scene 6 (4.2–5.0s): screen 4 (YouTube) populates: a 16:9 cobalt cell (thumbnail stand-in) with a small `paper` square at its center (a play mark, 0 radius) pops in on a long-tail settle, then a Newsreader `table-name` title line and one `ink-faint` bar beneath it.
Scene 7 (5.0–5.9s): payoff — the headline "One brand. Every channel." lands centered above the array via **per-word staggered reveal** (`dynamic-content-sequencing`) in Newsreader `headline` cobalt, baseline y≈215px; the last word settles.
Scene 8 (5.9–6.5s): held read — everything dead still at the handoff geometry. No push, no float, no jitter (the hold must be static so the cut into Frame 4 is invisible).

## Frame 4 — Leo Visual

- scene: The four screens shrink toward the center and vanish; "Leo Visual" assembles where they met, with "brand · content · motion" above and leovisual.nl beneath; long hold
- duration: 3.5s
- poster: 3.0s
- transition_in: cut
- status: animated
- src: compositions/frames/04-leo-visual.html
- type: branding
- persuasion: Attribution — the studio behind the transformation
- beat: lockup
- blueprint: logo-assemble-lockup (Adapt — Brand_Outro morph-chain / parts-arrive)
- asset_candidates: none — built in-composition (typographic "Leo Visual" wordmark)
- focal: the "Leo Visual" wordmark
- roles: wordmark = hero · kicker + URL = supporting (arrive on cue) · the four screens = the raw material that collapses · grid + hairlines = background
- voiceover: none (silent)
- handoff_in: four-screens — at t=0 the four rectangles are present at exactly Frame 3's geometry (280×498px, tops y=300, lefts x=310/650/990/1330, 1.5px cobalt outline, `paper-2` fill, contents visible as in Frame 3's final state — a cobalt cell + bars per screen is sufficient), opacity 1, scale 1, static; the headline "One brand. Every channel." (Newsreader `headline`, centered x=960, baseline y≈215) and the four channel labels (y≈830) are present at opacity 1, static. Ground identical.

Adapt: keep the signature — nothing cuts to a finished logo; the preceding material is the raw material and the transformation stays unbroken (the screens collapse into the point where the wordmark then assembles from parts). Change: the collapse is a shrink-toward-center + fade of four rectangles (`scale-swap-transition` at one shared center), the mark is a typographic wordmark built letter by letter, and the hold is long and dead static.

Scene 1 (0.0–0.7s): mono chrome top-left "004 — STUDIO". The headline and channel labels fade out fast (0.0–0.3s). The four screens **collapse toward the shared center** (`scale-swap-transition`): each rectangle translates toward x=960, y=549 while scaling down to ~0 and fading, the outer two leading the inner two by a hair — an implosion into one point, on an ease-in. The point lands empty for a beat on the bare grid.
Scene 2 (0.6–2.0s): **sequential per-letter slide-in** (`dynamic-content-sequencing`): "Leo Visual" assembles letter by letter out of that center in Newsreader `display-closing` cobalt, centered at x=960 with its baseline near y≈600 — each letter rising a short distance into its slot on a long-tail settle, left→right; the final letter lands and the word settles. Centered template, ~55% empty — let the grid show.
Scene 3 (1.8–2.4s): above the wordmark, the kicker "BRAND · CONTENT · MOTION" reveals via **per-word staggered reveal** (`dynamic-content-sequencing`) in Hanken `micro-strong` cobalt; beneath the wordmark a 1.5px cobalt rule (~26cqw wide) grows from its left edge to full width (a width tween on a long-tail settle) and "leovisual.nl" in DM Mono `mono-tag` fades + slides a short distance up into place beneath it (`dynamic-content-sequencing`).
Scene 4 (2.4–3.5s): the long hold — lockup + kicker + URL dead static to the final frame. No fade-out at the tail; the paper, grid and hairlines simply hold.
