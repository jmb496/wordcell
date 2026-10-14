---
title: 'Fly-to-cell on commit'
type: 'feature'
ticket: '11'
created: '2026-10-14'
status: done
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
baseline_revision: 'c068cee73b3332aee1a618cf00d410399c6376e1'
lenses_ran: [independent-reviewer]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/specs/spec-epic-5-tray/build-notes.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** Confirm and a committing Redo (kind `flyToCell`, F7) animate nothing: the committed cards appear in the target WordCell at once.

**Approach:** flip.ts flies the cards the move placed in a cell (F28) from captured to settled rect, bottom first, 30 ms stagger, 2 × base; WordCellRow holds the cell's look until the last landing. Source: the ticket (story-fly-to-cell-on-commit.md), owner answers F28 of 2026-10-14.

</intent-contract>

## Code Map

- `src/ui/flip.ts` -- `flyingSet`, `inFlight` (read-only `SvelteSet`s: committed ids, used-mirror id), `flyToCell` in `play()`, shared `start()`, `releaseHold()` in last settle / `finishAll` / any other play; `stagger` in `FlipDeps`; capture also records each cell's used mirror (`[data-wordcell] > [data-mirror-of]`).
- `src/ui/WordCellRow.svelte` -- reads `inFlight`: committed cards and the previous top visible while held, used mirror rendered first (beneath).
- `src/main.ts` -- passes `stagger`. `src/ui/ActionBar.svelte` -- stale "entry 11" comment.
- `src/ui/flip.test.ts`, `e2e/fly-to-cell.spec.ts` -- tests.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/flip.ts` -- fly-to-cell playback, landing hook, `inFlight`
- [x] `src/ui/WordCellRow.svelte` -- hold presentation
- [x] `src/main.ts`, `src/ui/ActionBar.svelte` -- stagger dep, comment
- [x] `src/ui/flip.test.ts` -- rewrite the two pins, add `AD-14 flyToCell playback`
- [x] `e2e/fly-to-cell.spec.ts` -- the ticket's AC, android

**Acceptance Criteria:** those of the ticket, each in `e2e/fly-to-cell.spec.ts` (Confirm session-place; own cell on redo-tail; other cell on two-cards; Undo mid-flight and Redo; reduced motion).

## Implementation Notes

Minors the ticket left for the build:
- Mirror stacking: the used mirror is rendered before the `{#each}`; cell cards are absolute, so DOM order puts it beneath every committed face.
- `[data-mirror-of]` scope: only direct children of `[data-wordcell]` are read (capture runs after `finishAll` + `flushSync`, so no held mirror is read).
- Delay phase: a delayed face sits at its captured rect (fill backwards) over the re-flowed tray, on `wc-glide` z-index 1 as any band-changer glide; accepted, not asserted.
- Reduced motion: no stagger, hold and hide at the fade end; the hide renders in the microtask flush after the last `onfinish`, before paint (e2e `afterLast`).
- flushSync before paint: the committed set is known only from the settled DOM, so `play()` does the kind lookup first, flushes, measures, sets the hold, then flushes again, both before paint (deviates from the ticket's "hold set above the first flushSync", which is marked `unverified` there). Unit test pins the flush sequence `[] → [3, 4]`; e2e reads inside the click task.
- Undo between landings: Undo runs `capture()` → `finishAll()`, which settles every animation and releases the hold (unit `finishAll` test); e2e Undo is clicked before the last card starts. A mid-way Undo is not timing-stable, so it is not separately asserted.
- Winning commit vs CAP-10: no CAP-10 code exists yet; `play()` runs synchronously after `dispatch`, a winning Confirm plays like any (unit test). Ordering with the guard belongs to its ticket.
- Landing-order observation: e2e pauses the face animations, `finish()`es them by delay, `await finished` and a frame, and snapshots the cell after the first, before the last and after the last.
- Screenshot baselines: no change expected (nothing is rendered at rest). `npm run test:screens` could not run here (Docker not installed in this WSL distro).

## Plan Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm run test:all` -- expected: green (run: 2307 unit, 516 e2e passed, 12 pwa, 14 dist)
- `npm run test:screens` -- expected: green (not run, no Docker)

## Auto Run Result

Status: built. One independent reviewer pass (not the full lens set): no production bug; two test-strength findings fixed (animation-less-play unit test, Undo-in-click-task e2e with a held-state assertion) and two redundant `releaseHold()` calls removed. `npm run test:all` green before those small edits; unit, flip e2e and fly-to-cell e2e re-run green after. `npm run test:screens` not run: Docker is not available in this WSL distro (baseline change not expected).
