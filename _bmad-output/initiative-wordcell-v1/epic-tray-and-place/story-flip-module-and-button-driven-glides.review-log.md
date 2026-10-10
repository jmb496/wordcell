# Review log — story-flip-module-and-button-driven-glides.md (ticket 5.10)

State: pass 4: done

Mode: docs, thorough, max 7, budget 1500 words (2.5x pass 0 plus the tickets.toml entry 10 fields unknown, interface, tests, owns, consumers that pass 1 adds to the Description). Pass 0: HEAD acf8115, .passes/pass0.md, 471 words.

## Pass 1 — 2026-10-10
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 10, minor 8, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 1121 (2.38 x pass 0)  |  Snapshot: .passes/pass1.md, fix diff .passes/pass1.fix.diff
Fixer: all 18 applied; no runnable commands added; source facts checked (Command union has giveUp, data-place values, [data-band] ids columns/tray/wordcells, cancel() calls finishFlight(), only validate flushes).
### Applied
- [major] Description — tickets.toml entry 10 fields unknown, interface, tests, owns, consumers missing → fixer item 1
- [major] Description/AC "gate idle at every dispatch" — nothing in entry 10 finishes a running glide before a button dispatch (finishAll reaches the controller only in entry 16) → fixer item 2
- [major] Description play/capture — no flush: TopBar/ControlRow/Confirm dispatch without flushSync, so play would read stale DOM and capture would record a selection lift the act()/deselect clear has not rendered → fixer item 3
- [major] Description "a no-edit release → flyBack" — no dispatch, so no command/result; CAP-5/CAP-6 own it (fly-back.ts) → fixer item 4
- [major] Description "committing Redo" — DispatchResult has no phase; F7's resulting-view-phase input and its bans dropped → fixer item 5
- [major] Description "play left to entry 11" — what play does for flyToCell in entry 10 unspecified → fixer item 6
- [major] AC coordinate frame — + 14 → 15 and the 412 × 780 anchor delta need tray growth (entry 12); must be synthetic pure-planner inputs → fixer item 7
- [major] Interface — no injection seam for gate/root/animate under Vitest node env → fixer item 8
- [major] Description "band" — band undefined; how a card's band and band rect are found and how rects are keyed (CardId) → fixer item 9
- [major] Description kind mapping — command types (tapDestinationCard, arrange, setPlacementOrder, add/removeFreeLetter, giveUp) not mapped; F17 move names only → fixer item 10
- [minor] AC P5 — no non-committing Redo glide case → fixer item 11
- [minor] AC P5 — start fixtures and step chains unnamed → fixer item 12
- [minor] Description — reduced-motion fade form → fixer item 13
- [minor] Description — "changed" tolerance → fixer item 14
- [minor] Description — New game/Replay/restore rule untested → fixer item 15
- [minor] Description — play without a pending capture → fixer item 16
- [minor] AC — run-on "…412 × 780) the gate idle…" → fixer item 17
- [minor] Notes — open question's second half belongs to entry 16 → fixer item 18
### Default applied (technical)
- finishAll path → capture() calls finishAll() first; the controller's cancel() gains flip.finishAll() here (entry 16 keeps pointerdown)
- flush → capture() and play() each call flushSync() before measuring
- seam → createFlip(deps) factory installed once from main.ts via a setter, plus pure kindOf(command, result, phase) and a pure planner over rects
- flyToCell before entry 11 → kind returned, no animation, no gate count
- band → from data-place (column → columns, tray/strip → tray, cell → wordcells), rects keyed by data-card-id
- tolerance → 0.5 px as controller near()
- giveUp → empty animated set
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (duplicates across lenses merged)

## Pass 2 — 2026-10-10
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 9, minor 9, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 1481 (3.14 x pass 0; budget 1500)  |  Snapshot: .passes/pass2.md, fix diff .passes/pass2.fix.diff
Fixer: all 17 applied; no runnable commands added. Beyond the findings it added `ControllerDeps.glidesRunning(): boolean` beside finishGlides() so the press takes gate.enter() before finishing (inFlight); cut repetition in Interface/Consumers; 0.5 px rule moved into the planner rules.
### Applied
- [major] Description install/cancel() — how the controller reaches finishAll unstated; a throwing pre-install singleton breaks controller.test.ts cancel() calls and main.ts order → fixer item 1
- [major] Description "entry 16 adds the pointerdown wiring" — until entry 16 a press mid-glide neither finishes it (AD-14) nor measures settled faces (controller reads face rects/computed transforms); existing drag-after-Validate specs at risk → fixer item 2
- [major] Description gate-counting — settle semantics unstated (async onfinish vs gate.leave() at count 0 throwing; cancel event) → fixer item 3
- [major] Description planner / AC coordinate frame — anchor delta input has no role; band per card not an input; two SPEC cases merged → fixer item 4
- [major] AC "a selected tile, Flip pressed, an unmoved tile" — untestable (Flip moves every S tile; node Vitest cannot see a flush/CSS lift) → fixer item 5
- [major] Description card ↔ compact tile — SPEC's "takes its new size at once and glides from the previous rect's top-left" dropped, untested → fixer item 6
- [major] AC — "durations only from motion.ts" has no normal-speed test (rule-coverage S + P5) → fixer item 7
- [major] AC P5 "D faces gliding from/to the column" — no assertion of the glide's start → fixer item 8
- [major] AC P5 "an edit discards the redo tail, R-71" — no redo tail on a fresh session-composing load → fixer item 9
- [minor] createFlip deps — resulting phase source missing → fixer item 10
- [minor] createFlip deps — reduced-motion "flag" goes stale; getter → fixer item 11
- [minor] easing unstated → fixer item 12
- [minor] capture() while pending, CardId missing on one side, unmapped data-place → fixer item 13
- [minor] kind table — winning Confirm/committing Redo, unfinished Undo, changed:false Validate rows → fixer item 14
- [minor] entry 16 overlap (cancel()/pointerdown now here) not recorded → fixer item 15
- [minor] AC P5 Validate step — wait for Validate enabled (word list) → fixer item 16
- [minor] Notes — open question names no answering test → fixer item 17
- [minor] DOM root dep — App's main does not exist when main.ts builds deps → folded into fixer item 1
### Default applied (technical)
- controller seam → ControllerDeps gains finishGlides(); main.ts creates/installs flip after the gate and before createController; controller.test.ts passes a spy; root dep a getter or the mount target
- pointerdown → finishAll wired into the controller's pointerdown here too (flip's running state joins inFlight); entry 16 keeps release capture/play and the press-path P5
- settle → finishAll finishes and settles synchronously, idempotent per animation; a cancel event throws (rule 6), as fly-back.ts
- planner → per-card {band, viewport rect} before/after (next measured after any scroll write) plus band rects; no anchor-delta input
- selected-tile lift → Playwright on a separate load (select tile, `+` with block right, no animation on its face) plus planner equal-rects case
- easing → ease-out as fly-back.ts
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 3 — 2026-10-10
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 4, minor 11, decision-needed 0  |  Dropped in triage: 2 (adversarial stretch: cancel() root guard, plan-level; e2e face reads after act() clicks, plan-level)
Words (docs): 1500 (3.18 x pass 0; budget 1500, reached)  |  Snapshot: .passes/pass3.md, fix diff .passes/pass3.fix.diff
Fixer: all 15 applied; source facts checked (`.tiles` overflow hidden / wc-drag-tiles, gate.whenIdle(relayout), pointerdown gate.enter() before finishFlight, session-composing block right k 1); room made by cutting the command list after "every other command → snap" (AC table keeps it), two entry-16 clauses (Notes keep them), shorter Notes.
### Applied
- [major] Description play / AC Validate — glides into the tray/strip are clipped by `.tiles { overflow: hidden }` (TileRows.svelte:95), so F22's visible D travel fails unseen; P5 rect checks ignore clipping → fixer item 1
- [major] AC P5 "select a tray tile and press `+` in one evaluate" — a synthetic captured press throws at setPointerCapture → fixer item 2
- [major] Description play "(the next rects include the re-layout and any scroll write)" — false: the AD-11 re-layout runs as a gate whenIdle task after the glides; no entry-10 dispatch re-lays out → fixer item 3
- [major] AC controller.test.ts — AD-11 gate.enter() before finishing at pointerdown not asserted → fixer item 4
- [minor] Consumers — entry 16's fly-back finish and hover-peek timer consumers not carried over → fixer item 5
- [minor] glidesRunning() — no flip method bound (add running()) → fixer item 6
- [minor] phase getter `game.view?.phase or equivalent` / null root — silent undefined, rule 6 → fixer item 7
- [minor] Vitest scope — duration/onfinish/throw checks need createFlip on fakes, not only planner/kind → fixer item 8
- [minor] reduced flag vs duration() two sources; literal 120 ms → fixer item 9
- [minor] Tests line — reduced-motion fade P5 is entry 11's Confirm; move to (S) → fixer item 10
- [minor] AC P5 — compare the D face rect's top-left, not the whole rect → fixer item 11
- [minor] AC P5 second load — name fresh session-composing → fixer item 12
- [minor] Description — "or `finished: 'won'`" redundant → fixer item 13
- [minor] AC P5 — "none on mirrors" includes the destination column's mirrors during Validate → fixer item 14
- [minor] AC durations — snap and undoRedo are both 1 × base; spy on the kind passed to duration() → fixer item 15
### Default applied (technical)
- clip → while a glide into the tray band runs, play adds the existing `wc-drag-tiles` class to the tile area and `wc-drag-layer` to the gliding face, removed at the last settle (finishAll included); P5 elementFromPoint at the D face's time-0 centre hits the face
- re-layout → no entry-10 dispatch re-lays out; next rects after a gate-deferred re-layout are entry 12's (CAP-9)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- cancel() root guard before finishFlight — unreachable; placement is the plan's
- e2e specs reading faces right after act() clicks — plan greps and lists them; ticket at budget

## Pass 4 — 2026-10-10
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 3, minor 3, decision-needed 0  |  Dropped in triage: 6 (adversarial stretch items accepted for the plan, see Dropped)
Words (docs): 1500 (3.18 x pass 0; budget 1500)  |  Snapshot: .passes/pass4.md, fix diff .passes/pass4.fix.diff
Fixer: all 5 applied; cuts to stay at budget (scrollReset parenthetical, giveUp-caller note, "cards land at once", near() citation, controller.test.ts-style fakes, shorter New game sentence and entry-16 Note); no requirement dropped.
Triage note: the elementFromPoint check (fix diff, adversarial), the hidden start of the Undo glide out of the tray (edge, ref) and `wc-drag-layer` breaking DESIGN.md's layer order (ref) are three defects in the one pass 3 sentence (fixer item 1 of pass 3) and are fixed by one rewrite, so they count as one major.
### Applied
- [major] Description clip-lift sentence / AC Validate + Undo steps — pass 3's mechanism: `wc-drag-layer` gives every gliding tray face the drag shadow and z 5 above the sticky bars (DESIGN.md Elevation & Depth layer order: cards → sticky bars → … → drag layer); it covers only glides into the tray, so the Undo Place → Composing D faces start under the tray (F22); and the P5 `elementFromPoint` check can never pass (`.face` has `pointer-events: none`, Card.svelte:175) → fixer item 1
- [major] AC finish-all Vitest — removal of the clip lift and glide layer at the last settle untested (a leak keeps the F2 clip lifted) → fixer item 2
- [major] Tests line vs AC — "(S + P5)" for no motion on a pure band shift (P5 deferred to entry 12) and durations (no P5 reads a duration; rule-coverage S + P5) → fixer item 3
- [minor] Description "call capture before" → "just before" (TopBar's deselect first) → fixer item 4
- [minor] createFlip deps — `duration` injected (the AC spies on it) → fixer item 5
- [minor] Description — "a glide into the tray band" reads as every tray glide; band changers only (subsumed by item 1)
### Default applied (technical)
- glide layer → band-changing faces only, both directions: the tile area takes `wc-drag-tiles` (unclipped) and each band-changing face a glide class at z-index 1 (above cards, below the sticky bars' 2, no shadow); P5 asserts the computed overflow and z-index at animation time 0
- durations P5 → each running animation's duration 320 (Slow) in the P5 evaluates
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- drag-shadow asymmetry Validate vs Undo — moot after item 1 (no shadow)
- lifting the clip under TRAY_ROWS = 1 shows a wide word's overflow rows during a band-changer glide until entry 12 — interim, for the plan to note
- New game/Replay/restore untested — exempt by construction, the plan lists it
- reverse-glide paint order accepted — superseded by item 1
- entry 16's toml still lists finishAll — recorded in Notes; trimmed when entry 16 is pulled
- dropped-word budget note — n/a
