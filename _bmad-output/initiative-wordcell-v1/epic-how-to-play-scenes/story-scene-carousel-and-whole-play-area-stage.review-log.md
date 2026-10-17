# Review log — story-scene-carousel-and-whole-play-area-stage

State: pass 1: done
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
