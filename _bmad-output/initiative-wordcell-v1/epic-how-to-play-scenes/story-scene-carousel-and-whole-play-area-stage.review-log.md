# Review log — story-scene-carousel-and-whole-play-area-stage

State: pass 6: done
Pre-loop: HEAD 2a2ae35, words 270, budget 1500 words (stub), copy /mnt/d/CodeProjects/wordcell/_bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/story-scene-carousel-and-whole-play-area-stage.passes/pass0.md
Intent extra (tickets.toml entry 6, not yet in the ticket): interface = "src/ui/scenes/ (carousel, stage), HowToPlayPanel.svelte, text.ts howTo control names."; tests = "Carousel behaviour (P6 android); stage structure (U); screenshots (screens)."; owns = "The carousel and the shared play-area stage."; unknown = "How to fit eight columns plus the tray inside the phone-width panel at readable card size; reuse the layout measuring of src/ui/layout/."; verify = (as in Acceptance Criteria); risk = medium.

## Pass 1 — 2026-10-17
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 12 (after merge), minor 5, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
### Default applied (technical)
- Non-current scenes: not mounted (one figure at a time).
- Scene change / panel open: scene starts at step 1, playing (resting frame under reduced motion), panel opens on scene 1; tap pause/restart, pause icon, loop with rest carry over from HP-1.
- Arrows at the ends: aria-disabled + dimmed, click a no-op, no wrap; keyboard Left/Right stop at the ends.
- Keyboard scope: Left/Right while focus is inside the carousel, through act(); checked against src/ui/keys.ts ArrowLeft/ArrowRight.
- Names/position in text.ts ("Previous scene", "Next scene", "Scene n of N", aria-current on the current dot).
- Stage cards: Card mirror="static" (no data-card-id/data-testid), stage aria-hidden, reads no GameView; no swipe.
- Interim carousel holds the existing scenes in order (basic then tricky), Tricky heading goes; later entries prune.
- Fit: stage measures its panel width via the pure shared measure, fixed stage height across scenes, min card width at 360 px.
- Observables: exactly one figure mounted, document.getAnimations() empty when closed; screenshot = android, reduced motion, first scene resting frame, baseline regenerated.
### Applied
- all 12 majors and 3 minors (mounting, scene start state, aria-disabled ends, key scope, names, reduced-motion Next, static mirror cards, stage contract, fit, closed-panel observable, enumerated criteria, references) → fixer items 1–15
Words: 853 (3.2 x pass 0)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/story-scene-carousel-and-whole-play-area-stage.passes/pass1.md

## Pass 2 — 2026-10-17
Reviewers: fix-diff, edge-case, adversarial, ref-alignment  |  Findings: major 10 (after merge), minor 6, decision-needed 0  |  Dropped in triage: 0
### Default applied (technical)
- Reduced motion: keep existing Scene.svelte behaviour (frame 1 on entry, Next clamps at the final frame = resting state, Replay resets to frame 1); no wrap (the pass-1 "wraps" line was an unintended UX change).
- Fit: panel width read (ResizeObserver/clientWidth) into a new pure card-width function; fitSize/measureWidth are text-font fitters, not reused for cards.
- Dots row wraps to two rows at 44 px; sizes asserted in Playwright bounding boxes, not Vitest.
- Hidden tab / reduced-motion or speed change while open: scene re-enters at step 1 (user-paused stays paused on tab return).
- Filler cards use ids no scripted move touches; fixtures/HP-5 replay unchanged.
- Scene mounted only while overlay open flag true (not Panel presence); stage height derived from fitted card width, same for all scenes.
- Carousel root = arrows, dots, scene incl. its Next-frame/Replay/pause; element-level onkeydown, no window listener; existing document.hidden hook, no new visibilitychange listener.
### Applied
- 10 majors and 2 minors (fit symbols, reduced-motion frame/Replay, Playwright-vs-unit sizes, dots wrap, hidden/pref re-entry, filler ids, missing P6 cases, overlay-gated mount, carousel root/keys, test naming) → fixer items 1–12
Words: 1180 (4.4 x pass 0, within the 1500 budget)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/story-scene-carousel-and-whole-play-area-stage.passes/pass2.md

## Pass 3 — 2026-10-17
Reviewers: fix-diff, edge-case, adversarial, ref-alignment  |  Findings: major 8 (after merge), minor 8, decision-needed 1  |  Dropped in triage: 0
### Default applied (technical)
- Hidden tab follows the existing player (stops at the next step boundary, restarts once visible); the "user-paused stays paused" clause is dropped; test sets document.hidden/visibilityState and dispatches visibilitychange.
- Scene is keyed on (index, reduced motion, speed, fitted card width): a change re-enters as a newly shown scene (step 1, playing).
- Focus stays on the activated carousel control; focus inside a scene that unmounts moves to the carousel root (tabindex -1); keys act only with focus in the root.
- Stage and controls are in the panel's scrolling content; landscape/desktop reach controls by scrolling.
- Static Card carries none of data-card-id/testid/place/mirror-of (Card.svelte).
- New card-width function lives with src/ui/layout/ and reuses what fits (fixer names it), band order from BAND_ORDER; formula inputs pinned, 360 px result >= 32 px in a unit assertion.
- Filler goes at the far end of each column, ids unique per scene (unit assertion).
### Decision needed (functionality / UX / gameplay)
- Carousel behaviours the owner's 2026-10-17 decision does not state: buttons and keys only (no swipe), no wrap-around at the ends, panel always opens on scene 1, every entry restarts the scene — question: does the owner confirm these? — proposed default: as listed (already in the ticket; the loop applied them as technical in pass 1)
### Applied
- 8 majors and 4 minors (hidden-tab per player, focus and keys, keyed re-entry, vertical bounds, static card attributes, layout reuse, fit formula, filler placement; content width, exit placeholder, AC wording, locators) → fixer items 1–12
Words: 1393 (5.2 x pass 0; budget 1500, nearly reached)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/story-scene-carousel-and-whole-play-area-stage.passes/pass3.md

## Pass 4 — 2026-10-17
Reviewers: fix-diff, edge-case, adversarial, ref-alignment  |  Findings: major 5 (after merge), minor 9, decision-needed 0  |  Dropped in triage: 0
### Default applied (technical)
- Card-width function takes panel content width, visible panel height and the scenes' max column cards / tray rows; the 32 px floor wins over the height cap (below it the panel scrolls); unit cases for a short height.
- Filler cards need no unique CardId (static cards render no id; the 52-card deck cannot hold 40 filler cards plus scripts): keyed by render key; drop the no-repeat-id assertion.
- Re-fit is a no-op when the integer card width is unchanged; width measured so a scrollbar appearing does not change it (scrollbar-gutter: stable or the .inner box); test that an idle scene does not restart.
- Animation speed re-entry test drives the preference through the existing test hook or seeded prefs (Preferences cannot open over How to play, LEGAL_TOPS); verify the mechanism exists, else cover it by reopening.
- Minors applied at zero added words: paused-during-hidden wording follows player.ts; one 328 px content width named for a 360 px viewport.
### Unapplied minors (over budget)
- Keys and no-swipe follow APG research, not named in the owner decision (covered by the decision-needed item of pass 3); position announcement on arrow press; root focus ring; stage extra-height look; cardWidth gutter arithmetic.
### Applied
- 4 majors and 1 minor (fit inputs and floor precedence, filler without unique CardIds, scrollbar-stable no-op re-fit, Animation speed dropped from the in-panel test and covered by reopening, hidden-wait wording) → fixer items 1–5
Words: 1476 (5.5 x pass 0; budget 1500)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/story-scene-carousel-and-whole-play-area-stage.passes/pass4.md

## Pass 5 — 2026-10-17
Reviewers: fix-diff, edge-case, adversarial, ref-alignment  |  Findings: major 3, minor 9, decision-needed 0  |  Dropped in triage: 0 (height-reserve and filler-unrelated precision items reclassified minor)
### Default applied (technical)
- Same focus rule on every re-entry (resize, reduced-motion toggle) and when Next becomes Replay at the final frame: focus moves to Replay / the carousel root, never body; assertions added.
- Filler letters: a fixed deterministic sequence constant in src/ui/scenes/, pinned by the stage unit test (no randomness).
- Minors applied at near-zero words: Panel.svelte named in the interface (shared `.content` gutter; other panel baselines may shift); accessible name stays "Next", "Next frame" is prose.
### Unapplied minors (over budget / build-plan detail)
- Height reserve for controls in the card-width function; maxima constant source; getAnimations filtering of non-carousel animations; "idle" wording; position announcement on arrow press; "visible" 5 cards; two visibility sources.
### Applied
- 3 majors and 2 minors (focus on every re-entry, focus to Replay at the final frame, deterministic filler letters; Panel.svelte in interface, "Next" name) → fixer items 1–5
Words: 1483 (5.5 x pass 0; budget 1500)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/story-scene-carousel-and-whole-play-area-stage.passes/pass5.md

## Pass 6 — 2026-10-17
Reviewers: fix-diff, edge-case, adversarial, ref-alignment (ref found nothing)  |  Findings: major 3 (after merge and the late-pass bar), minor ~10, decision-needed 0  |  Dropped in triage: 0 (detail-level adversarial items reclassified minor: focus-loss mechanism, getAnimations scoping, placeholder height source, stage column overflow rule, dots count, announcement wording)
### Default applied (technical)
- Card-width formula is min(widthTerm, max(32, heightTerm)): the 32 px floor never exceeds the width term; a short panel box caps the width only when the stage would exceed it; stage height derives from the fitted width, so the scene key (width) already covers it; a refit that changes the width re-enters the scene by design; unit test pins the formula.
- Focus returns to Next when Replay is pressed (Replay unmounts); assertion after Replay.
- Filler letter sequence added to the Unit AC list.
### Unapplied minors (over budget / build-plan detail)
- Focus-loss detection mechanism (build plan); getAnimations scoping to the carousel; placeholder height before first measurement; stage column clipping rule; N <= 14 dots; arrow-path position announcement; Screens end signal "Replay visible"; baseline regeneration for other panels shifted by the gutter; restoring three cut sentences (covered by AC).
### Applied
- 3 majors (focus after Replay, filler letters in Unit AC, min(widthTerm, max(32, heightTerm)) formula) → fixer items 1–3
Words: 1493 (5.5 x pass 0; budget 1500)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/story-scene-carousel-and-whole-play-area-stage.passes/pass6.md
