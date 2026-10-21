---
title: 'Celebration step, renderer and run controller'
type: 'feature'
ticket: 'story-celebration-step-renderer-and-run-controller'
created: '2026-10-21'
status: done
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-celebration-step-renderer-and-run-controller.md'
warnings: [oversized]
deferred: []
baseline_revision: '57efcbd72c6e1ce16e527c9d689a879ed49d7f6b'
---

<intent-contract>

## Intent

**Problem:** The win celebration (AD-19, R-87) has no pure step, renderer or run controller yet; later entries (4-8) need them, unmounted and untriggered.

**Approach:** Add `src/ui/celebration/` (`step.ts`, `Celebration.svelte`, `celebration.svelte.ts`), `celebrationCapMs()` in `motion.ts`, and export `BASE_MS` from `prefs.svelte.ts`, exactly as the ticket Description (the story file, read it fully; it is the spec) states. Nothing mounts or triggers it.

## Boundaries & Constraints

**Always:** `step.ts` pure (no DOM, clock, `Math.random`). Per-frame `transform`/opacity written directly (rule 3), no reactive per-frame state. Copies carry `data-celebration` and `aria-hidden`, never `data-card-id`, `data-testid`, `data-mirror-of`. Rule 6: no fallbacks (missing `wordcell-<n>` throws; `start` while active throws, checked first). Tests named `AD-19 …`. Cite rules by id.

**Never:** mount `Celebration` in `App`, touch `overlays.svelte.ts`, `test-hook.ts`, `main.ts`, `end-sheet.ts` (entries 4-5). Change `BASE_MS` values or add a second copy. Edit the ticket file.

</intent-contract>

## Code Map

- `src/ui/celebration/step.ts` -- new, pure `step(state, dtMs)`; launch by entry index; `rowScale(n, cardW, bandW)`.
- `src/ui/celebration/Celebration.svelte` -- new; groups from `view.faces` by entry `cards`; look after `src/ui/Card.svelte` `.face`/`.glyph`/`.badge` CSS (copy the look, do not reuse `Card` with `mirror`: it emits `data-mirror-of`/`data-card-id`).
- `src/ui/celebration/celebration.svelte.ts` -- new run controller; measures with `src/ui/layout/` (bars carry `data-band="topBar"` / `actionBar`; cells `data-testid="wordcell-<n>"`, label `data-wordcell-label`).
- `src/ui/motion.ts` -- add `celebrationCapMs()`; `src/shell/prefs.svelte.ts:64` -- `export` `BASE_MS`.
- `src/engine/view.ts` -- `WordListEntry` (`cards`, `cell`), `Face`; read-only. Prefs mocking pattern: `src/ui/motion.test.ts`.

## Tasks & Acceptance

**Execution:**
- [x] `src/shell/prefs.svelte.ts`, `src/ui/motion.ts` -- export `BASE_MS`; add `celebrationCapMs()` = 6000 × baseMs / `BASE_MS.normal` -- cap (AD-19)
- [x] `src/ui/celebration/step.ts` + test -- pure step per Description
- [x] `src/ui/celebration/Celebration.svelte` + render test
- [x] `src/ui/celebration/celebration.svelte.ts` + test -- `start/end/cancel/onEnd/running/setManual/advance`, rAF and manual drivers
- [x] Run `npm run test:all` (lint, check, unit …) green

**Acceptance Criteria:**
- Given the ticket Verify list (story file), when `npm test` runs, then every clause has a passing `AD-19 …` test.
- Given the pass 7 open major, then the plan's tests also cover the two clauses the ticket's Verify lacks: `advance(ms)` does nothing when idle, not manual, or ms ≤ 0 (no step, no render, remainder untouched); `setManual` is read only at `start` (toggling it mid-run throws; the run keeps the driver chosen at `start`; a later `start` picks up the new value).
- Given a 23-letter row, then it scales to fit 360 px (0.675 at card width 40; 0.4 at 150 px); the component is not mounted anywhere and `npm run build` size budget holds.

## Implementation Notes

Open major from the ticket review log (pass 7): the ticket's Verify lacks the two clauses above. Resolved here, not in the ticket: build-auto never writes to the ticket file, so the plan's acceptance criteria and tests carry them. The "trim other Verify wording" half is an owner edit to the ticket and is reported in the result JSON.

## Plan Change Log

## Review Triage Log

### 2026-10-21 — Review pass
- verdicts: 27 findings — high 0, medium 3, low 14, false 8, maybe-false 2
- findings:
  - `[false]` `[reject]` blind: reduced motion ignored — AD-19 sends reduced motion straight to `done` in `end-sheet.ts` (entry 4), not in this unmounted layer.
  - `[false]` `[reject]` blind: frame-rate dependent physics — rAF uses real dt clamped to 50 ms and manual uses fixed 16 ms by the ticket's own Description.
  - `[low]` `[reject]` blind: register/elements bookkeeping brittle — a count mismatch throwing is rule 6; the component is mounted fresh per run (entry 4).
  - `[low]` `[reject]` blind: band measured once — resize ends the run via entry 4's wiring (AD-19), logged in the ticket review as unapplied.
  - `[low]` `[reject]` blind: `as` casts / undefined `wordList` ends silently — the ticket specifies "empty or absent" ends at once.
  - `[low]` `[reject]` blind: `onEnd` throwing skips `done` — engine-style fail-fast to the AD-15 handler (rule 6).
  - `[low]` `[reject]` blind: CSS duplicates Card.svelte; source-text shadow test — copies must not use `Card` (emits mirror/id attributes); cosmetic.
  - `[low]` `[reject]` blind: stale prefs mock and weak count test in Celebration.test.ts — cosmetic.
  - `[low]` `[reject]` blind: BASE_MS export and controller error paths untested — one constant; throws are rule 6.
  - `[low]` `[reject]` blind: step.ts loose ends (tiny band, unused exports) — unreachable inputs, tuned at entry 6.
  - `[false]` `[reject]` blind: plan file incomplete — a fix would edit this build's plan; triage log and result are filled here.
  - `[medium]` `[patch]` edge: exited groups written every frame — fixed with a per-run hidden flag, written once; test added.
  - `[low]` `[reject]` edge: stale elements when groups prop changes (two rows) — fresh mount per run.
  - `[low]` `[reject]` edge: render throw leaves run active — fail fast to AD-15 halts the store.
  - `[false]` `[reject]` edge: onEnd throw loses `done` — as above.
  - `[low]` `[reject]` edge: origin outside band / zero rect — not reachable with the real row.
  - `[low]` `[reject]` edge: resize mid-run — entry 4.
  - `[low]` `[reject]` edge: empty band, step on finished state, baseMs 0 — unreachable (`baseMs` ≥ 90).
  - `[medium]` `[patch]` gap: controller-to-step wiring unpinned — wiring test and Slow cap test added.
  - `[defer-equivalent]` `[reject]` gap: component mount/register contract — nothing mounts it yet; entry 4 closes it.
  - `[medium]` `[patch]` gap: count-mismatch throw untested — test added.
  - `[low]` `[patch]` gap: post-exit opacity unobserved — assertions added.
  - `[false]` `[reject]` gap other: source-text shadow assertion — cosmetic, value is the DESIGN token.
  - `[maybe-false]` `[reject]` intent: layout measured with direct rects, not `src/ui/layout/` helpers — no such rect helper exists; settles at entry 4 mount.
  - `[maybe-false]` `[reject]` intent: shadow via `var(--wc-shadow-drag)` — equals `#0008` in the default theme.
  - `[false]` `[reject]` intent: added public surface (`props`, `register`, factory) — needed by the renderer.

## Verification

**Commands:**
- `npm run lint && npm run check && npm test` -- expected: green
- `npm run test:all` -- expected: green (build must precede `test:e2e:dist`)

## Auto Run Result

Status: built. Blocking condition: none.

**Summary:** `step.ts` (pure step, launch, `rowScale`), `Celebration.svelte`, run controller `celebration.svelte.ts` (rAF and manual drivers), `celebrationCapMs()`, exported `BASE_MS`; unmounted, untriggered.

**Files:** `src/shell/prefs.svelte.ts` (export `BASE_MS`); `src/ui/motion.ts` + test (cap); `src/ui/celebration/{step,celebration.svelte}.ts`, `Celebration.svelte`, and their `*.test.ts`.

**Open major from the ticket review log (pass 7):** resolved in this plan, not in the ticket (build-auto never writes the ticket): the acceptance criteria add the `advance` no-op (idle, not manual, ms ≤ 0) and `setManual` read-only-at-`start` clauses, and tests cover both. Owner item: add the two clauses to the ticket's Verify (trimming other wording) if the ticket should match.

**Review:** 27 findings; patches applied 4 (1 medium code fix: exited groups written once; 3 test gaps); deferred 0; rest rejected with reasons in the triage log. Follow-up review recommended: false (patched: medium 3, low 1).

**Verification:** on the `/mnt` drvfs checkout `npm test` fails (15 tests in `celebration.svelte.test.ts`): `./celebration.svelte` resolves case-insensitively to `Celebration.svelte`. In a Linux-filesystem copy `npm run test:all` exits 0 (3091+ unit tests, e2e suites). The `Celebration.svelte` / `celebration.svelte.ts` pair is the ticket's and AD-19's naming; owner decision needed on a rename or explicit imports.

**Residual risks:** physics constants untuned (entry 6); component-to-controller mount wiring untested until entry 4.
