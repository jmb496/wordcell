# Review log — story-scene-carousel-and-whole-play-area-stage

State: pass 2: done
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
