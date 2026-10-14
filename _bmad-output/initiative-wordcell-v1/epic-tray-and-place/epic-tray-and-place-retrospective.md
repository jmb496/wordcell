---
epic: epic-tray-and-place
date: 2026-10-14
verdict: accepted-with-open-items
criteria: declared
headless: true
---

# Retrospective: epic-tray-and-place (epic 5)

Run unattended (the owner was unavailable): the going-in-concerns question and the team discussion were skipped, and nothing was asked.

## Epic summary

- Epic file: `epic-tray-and-place.md` (risk high, after `epic-board-and-gestures`). Branch `epic-5-tray`, HEAD `89fc939`.
- Tickets, in build order from `tickets.py status`: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.17, 5.10, 5.16, 5.11, 5.12, 5.13, 5.14, 5.15. All 17 are `status: done`, `state: done`. None is at `built`. `pending_tickets` is empty (the status output has no such key; every row is done).
- Range: the plans' baselines are linear in history. The oldest is 5.1's `64ea5a4`, and the epic ran from there to `HEAD` (inferred end, no later work has landed). `git_evidence.py --range 64ea5a4..HEAD`: 181 commits, 0 merges, 178 files. A per-plan split was not run, because the baselines are linear and one range is enough for the aggregate views. Per-ticket provenance is in the plans' `baseline_revision` and the digest's commit lists. 86 of the 181 commits are WIP or review-log commits (subject contains "wip"), so ticket-level attribution by commit subject is weak.
- Engine and shell delta: only `src/engine/view.ts` (+4, the AD-3 `draft.wordCards` field) with `view.test.ts`, `serialize.test.ts` and `src/shell/game.svelte.test.ts` (test-only). This matches the epic's Boundaries.
- Evidence available: the epic file, 17 tickets with plans and review logs, the SPEC, rule-coverage and build-notes, the autopilot digest and handoff, and the previous retro. Missing: raw session transcripts. Process lessons come from the digest only, which is a narrowed scope.
- Verification available: `test:all` and `test:screens` were reported green by the caller just before this run. I ran `npm test` myself (see Behavior verification).

## Findings

Each finding has a source and a disposition. "Source" paths are relative to the repo root.

### Aggregate views

**Architecture delta.** No layering violation found. The engine change is the single sanctioned field (`src/engine/view.ts`), shell has only a test-file change, and the new modules are all under `src/ui/` (`flip.ts`, `gestures/*`, `tray/*`, `layout/tray.ts`). The `src/architecture-*.test.ts` scans are inside the 2393 passing unit tests. Checked: diff file list (`git diff --name-only 64ea5a4..HEAD -- src/engine src/shell`). Clean.

**Size growth (F-1, defer or fix).** `src/ui/gestures/controller.ts` grew from 1004 lines at `64ea5a4` to 1587 at HEAD (+1057/-474 churn, top of the non-test ranking in `git_evidence.py`). `controller.test.ts` grew from 3193 to 5389 lines. Epic 4 retro action A6 asked the sweep to split `controller.ts` along its seams. The seam modules were extracted (`fly-back.ts`, `hover-peek-timer.ts`, `visible-band.ts`, `lookup.ts`, `classes.ts`, `tile.ts`; ticket 5.4), but tile and free-letter drag, FLIP release wiring and the winning guard then landed in the same file and it ended 58 % larger than at the epic start. The 5.14 sweep plan lists no controller split (`story-refactor-sweep-code-plan.md` Design Notes). Disposition: defer, with a proposed code ticket (see A1). The `controller.test.ts` split stays blocked by owner decision F41 (the epic 4 split made the `/mnt/d` median worse), so only the source file is a candidate. Other large files are tests and e2e specs (`flip.test.ts` 1299 added, `e2e/free-letter.spec.ts` 997), which is expected for this epic's test-heavy kind.

**Duplication map (F-2, defer).** `measure(el, px)` is written twice, near-identically, in `src/ui/ActionBar.svelte:82` and `src/ui/tray/WordLine.svelte:45` (both set a font size, read `getBoundingClientRect().width`, restore in `finally`; the WordLine copy also toggles a `MEASURING` class). Both came from the fractional-width fix in 5.14. Disposition: defer; extract one fit-to-width helper in a later sweep (technical default). The `typeof target.closest === 'function'` check in `src/ui/motion.ts:165` (`inUndo`) is the 5.13 minor that the digest says was carried to 5.14 and was not applied; it is also a defensive check that AGENTS.md rule 6 disallows (F-3, fix with A2).

**Pattern divergence.** Added non-test `src/` lines contain two `try/finally` blocks (both the `measure` helpers, not error swallowing), no `catch`, no `console.`, no `Math.random`, and a `biome-ignore noUnusedImports` for Svelte markup in several components (an accepted Biome limitation, repeated per file). No rule-6 divergence other than F-3. Checked by a regex scan of the added lines of the epic diff.

**Spec-to-implementation reconciliation.** See the verdict table for Done when 1 to 6. Divergences:
- F-4 (fix, doc): the close-out edit lists in `_bmad-output/specs/spec-epic-5-tray/build-notes.md` lines 6 to 56 are mostly still open. `story-refactor-sweep-paperwork-and-budget-plan.md` section "S13" records them: spine AD-12 (F4, F2, F5), AD-14 (F6/F7, F8); the epic file's Structural Seed, Proposed epics row 5 and Done when 3 wording ("apart from `activeMs`"); EXPERIENCE.md and DESIGN.md (Arrange M caret F16, selection clearing F18, `5 letters` and Place meta strings F11); and the AGENTS.md changes (see F-5). They are proposed here and not applied (see A3 to A6). I re-checked the Done when 3 wording: `epic-tray-and-place.md` still reads "gives the same Session", so it is open.
- F-5 (fix, AGENTS.md through `bmad-project-context`): `AGENTS.md` line 82 still reads "never animate, except the tray's drag parting shift (AD-14)"; the SPEC's wording is that mirrors take no part in the FLIP glide. The Where-things-are paragraph lacks `src/ui/flip.ts`, `src/ui/tray/`, the new `src/ui/gestures/` modules and `src/ui/motion.ts` (S13 list, verified present in the tree). The epic file's Notes said this AGENTS.md edit was due before CAP-5; it was never made and the build went on, covered by SPEC Constraints AD-14. The run-time risk is low, but a future agent reading only AGENTS.md could remove the FLIP exceptions or add mirror animation.

### Diff-scope review (narrowed)

`bmad-review` was not invoked: the diff is 181 commits and about 150 files, and the caller asked for the cheapest adequate pass. I ran the adversarial, edge-case and verification-gap lenses inline over the existing evidence instead: each ticket already went through a thorough code-review loop with its own log (`*.review-log.md`, 1 to 4 passes each, all converged), and I read the digest and the carry-over lists rather than re-reviewing every hunk. Narrowing recorded: no fresh line-by-line read of the 17 tickets' code, only the boundary items below. Findings that sit on ticket boundaries, where no single session saw both sides:

- F-6 (fix, test): the 5.16 code review left an open major, "capture = play invariant has no test for free-letter drag ends, sameId, tail null-highlight up, longPress, sheet/scrim ends". The 5.14 sweep chose not to apply it and reported it (`story-refactor-sweep-code-plan.md` line 143, table row "5-16 open major"). Its own reading found no pending-capture path, so this is a verification gap, not a known bug. Disposition: fix with a test (A7).
- F-7 (fix, test): the 5.12 open major, a scroll-busy e2e in `e2e/tray-growth.spec.ts` that asserts `0 < scrollY < 6` after a smooth scroll, is timing-fragile (digest, 5.12 "Worth knowing" item 2; sweep plan line 183 "open majors of 5-12 and 5-16 untouched"). This is an intermittent-failure risk for `test:all`. Disposition: fix (A8).
- F-8 (defer): the `watchTiles` effect on New game or Replay is covered only by unit fakes (digest 5.12 item 3); the Android fling anchor write is unverified (item 4, routed to epic 7 device checks); the reduced-motion fade and press/back/hide during a glide are covered only by unit tests (digest 5.10). Disposition: defer; the fling item belongs to epic 7.
- F-9 (defer): the controller-seams `deferred` list (miss paths of converted lookup sites untested) was left "deferred to a later sweep, no owner decision pending" (`story-refactor-sweep-paperwork-and-budget-plan.md` S13). Same disposition as F-6, merge into A7.
- F-10 (owner, rendered output): two rendered-output minors were deliberately not applied: the ActionBar ellipsis font size (5-3 #1) and the FLIP reduced-fade easing (5-10 #4) (`story-refactor-sweep-code-plan.md` lines 153 and 183). They change what the player sees, so they are an Open question, not decided.
- F-11 (accept): the F25 wrap-case behavior (tile dropped past a wrapped word block lands at the nearest gap) was decided by the owner (SPEC F25) and hand-checked on the phone 2026-10-09 (digest, "Owner hand check"). The free-letter-click-with-hover-preview-open behavior was kept as built (SPEC F26). Accepted, so it should not be re-flagged.

### Process

- F-12 (process): retro L3 asked that `test:screens` be in every ticket's gate. The digest shows it was not run for 5.11, 5.12, 5.13, 5.14 and 5.16 ("Docker not installed in this WSL" or "not available here") and was only run at the end, when it passed (caller report; 5.15 plan: 10 passed). The shared mitigation is that no rendered baseline changed. Disposition: accept for this epic, since the final run is green; the lesson is that autopilot needs an explicit stop or a recorded Docker check when the screenshot suite cannot run (A9, process).
- F-13 (process, accept): the epic needed 17 tickets for one lane. Ticket review took 3 to 7 passes (5.10 took 7 and 5.13 took 7 with majors 10, 10, 6, 3, 2, 1, 0) and ticket review was 38 to 98 % of per-ticket tokens on several tickets (digest). The usage-limit stops (5.1, 5.8, 5.17, 5.10, 5.11) and owner questions (5.6, 5.8, 5.10, 5.11) were handled and resumed cleanly; each owner answer is recorded as SPEC F25 to F28. This is a record, with no action.
- F-14 (process, positive): L1 `consumers`, L2 (the sweep split in two) and the draft check of the ticket plan at inception (`epic-tray-and-place.md` Notes) were all applied. The unit budget held: 3.00 s median and 584 ms watch re-run on the Linux filesystem (5.15 plan, S12), against the 5 s AD-17 budget.

## Behavior verification

The epic changed runtime behavior (tray, Place, FLIP, fly-to-cell, winning guard). What I could prove cheaply:

- Observed this run: `npm test` on the `/mnt/d` checkout: 55 files, 2393 tests passed, 6.37 s wall time (cold, unbudgeted; the AD-17 budget is measured on the Linux filesystem, see F-14).
- Not re-run by me: `test:all` and `test:screens`. The caller reported both green just before this run, and the 5.15 plan records `test:all` exit 0 and `test:screens` 10 passed at HEAD. I did not start a dev server or a browser, and did not drive the app by hand.
- What the suites prove, with files: the tap-only whole move and its drag twin (`e2e/success-signal.spec.ts`, ticket 5.17), the F34 under-25 % tray release leaving the stored Session identical (`e2e/tile-drag.spec.ts`, `e2e/free-letter.spec.ts`), 52 `data-card-id` elements in each phase (`e2e/board-phases.spec.ts`), the WordCell row box after tray growth (`e2e/tray-growth.spec.ts`), and the winning guard (`e2e/win-guard.spec.ts`). The 5.15 audit maps all 42 P5 rows of `rule-coverage.md` to a passing `android` test (`story-refactor-sweep-paperwork-and-budget-plan.md`, Done when 1 audit table).
- Hand checks by the owner: F25 wrap case on the phone, 2026-10-09 (digest). No hand check of the whole epic on a real phone is recorded after 5.11 to 5.15 (fly-to-cell, growth, guard). The live-site check is Done when 6.
- Not exercised by anything: Android fling with the anchor scroll write (F-8, epic 7).

## Previous-retro follow-through

Previous retro: `epic-board-and-gestures/epic-board-and-gestures-retrospective.md`, Action items section, exists.

| Item (owner) | Landed? | Evidence |
|---|---|---|
| A1 `hasLeftSource` fix before merge (Dev) | Yes | retro Open questions, owner answer 6: A1 to A3 built and reviewed, commits 90de645 and 54dabda; epic 5 baseline already contains them |
| A2 android e2e for F34 with the banner (Dev) | Yes | same, owner answer 6 |
| A3 add `Q-18` to the R-14 test name (Dev) | Yes | same |
| A4 split `controller.test.ts` (Dev) | Superseded by owner F41, not landed | retro owner answer 5; `controller.test.ts` is now 5389 lines (F-1) |
| A5 move copied e2e helpers into `e2e/helpers/` (Dev) | Yes | `e2e/helpers/*.ts` (15 modules) and `e2e/helpers.spec.ts`; 5.14 plan |
| A6 split `controller.ts` along seams, shared class constants (Dev) | Partly | seam modules and `classes.ts` exist in `src/ui/gestures/`, but `controller.ts` is 1587 lines, up from 1004 (F-1) |
| A7 sticky view over kept selection before key commands (Dev, epic 6) | Not due | epic 6; no evidence found either way |
| A8 wheel during mouse drag, hover-peek re-anchor test, F7 hide-flush back, `WordCellRow` label to `text.ts` (Dev, epic 6) | Not due | epic 6 per its Boundaries (`epic-tray-and-place.md`); no evidence found |
| A9 4.12 and 4.13 Result-section minors (Dev) | Yes, recorded | 5.14 outcome table and 5.15 S8 to S16 records; unapplied rows are listed, not hidden (F-9, F-10) |
| L1 list a rule's other consumers in ticket review (Process) | Yes | epic Notes decision on `consumers`; tickets 5.2, 5.11, 5.14 |
| L2 split a sweep with more than 10 rows (Owner) | Yes | tickets 5.14 and 5.15 |
| L3 keep `test:screens` in every gate (Owner) | Partly | digest: not run for 5.11 to 5.14 and 5.16; green at the end (F-12) |
| Close-out docs C1 to C38, G1 to G4 (applied before this epic) | Yes | retro Open questions, owner answer 6 |

## Action items

All of these are proposed, none applied. "Edits docs" marks items that touch a spec, spine, UX doc or AGENTS.md.

| # | Action | Owner | Kind |
|---|---|---|---|
| A1 | Split `src/ui/gestures/controller.ts` (1587 lines) along its tile-drag, free-letter, FLIP-release and winning-guard seams in a code ticket; keep `controller.test.ts` whole per F41 | Dev (code ticket) | Remediation (F-1) |
| A2 | Replace the `typeof target.closest === 'function'` check in `src/ui/motion.ts:165` with the plain `Element` check (rule 6) | Dev | Remediation (F-3) |
| A3 | Apply the spine close-out edits (AD-12 F4, F2, F5; AD-14 F6 to F8; Structural Seed gestures/ list; build-notes label) | Owner | Spec reconciliation, edits docs (F-4) |
| A4 | Apply the epic file edits (Structural Seed, Proposed epics row 5, AD-17 Speed result 3.00 s / 584 ms, Done when 3 "apart from `activeMs`") | Owner | Spec reconciliation, edits docs (F-4) |
| A5 | Apply the EXPERIENCE.md and DESIGN.md edits (Arrange M caret F16, selection clearing F18, `5 letters` and Place meta strings F11) | Owner | Spec reconciliation, edits docs (F-4) |
| A6 | Run `bmad-project-context` for AGENTS.md: the Known pitfalls mirrors line (no FLIP glide, parting shift excepted) and the Where-things-are additions | Owner via `bmad-project-context` | Edits AGENTS.md (F-5) |
| A7 | Add Vitest cases for the capture = play invariant (free-letter drag ends, same-id, tail up with no highlight, long-press, sheet/scrim) and for the miss paths of the converted lookup sites | Dev | Remediation (F-6, F-9) |
| A8 | Rewrite the 780-px scroll-busy e2e in `e2e/tray-growth.spec.ts` so it does not depend on smooth-scroll timing | Dev | Remediation (F-7) |
| A9 | Autopilot: stop or record a Docker check when `test:screens` cannot run for a ticket, rather than carrying "not run" to the close | Owner/process | Process (F-12) |
| A10 | Extract one fit-to-width `measure` helper shared by `ActionBar.svelte` and `WordLine.svelte` | Dev | Remediation, low (F-2) |

Needs the owner's decision or own edit: A3, A4, A5, A6 (spec, spine, UX and AGENTS.md changes), A9 (process), and the Open questions below. A1, A2, A7, A8, A10 are technical defaults for the dev loop.

## Acceptance verdict

**accepted-with-open-items**, criteria declared (the epic file has Done when). Every ticket is finished, so the machine rule for unfinished tickets does not apply.

1. Done when 1 (`test:all` and `test:screens` green, all P5 rows have a passing `android` test): **met**. Evidence: the caller's report, the 5.15 plan (`test:all` exit 0, `test:screens` 10 passed, 42 of 42 P5 rows mapped), and my `npm test` run.
2. Done when 2 (tap-only whole move): **met** by `e2e/success-signal.spec.ts` (5.17, code review 1 pass, 0 majors). Not hand-checked as a whole on a phone.
3. Done when 3 (same move by drag, 25 % rule leaves the Session identical): **met** by `e2e/success-signal.spec.ts`, `e2e/tile-drag.spec.ts`, `e2e/free-letter.spec.ts`. The epic text should read "apart from `activeMs`" (A4).
4. Done when 4 (52 `data-card-id`, mirrors out of FLIP, WordCell box unchanged on growth): **met** by `e2e/board-phases.spec.ts`, `e2e/flip*.spec.ts`, `e2e/tray-growth.spec.ts` (with the F-7 timing risk).
5. Done when 5 (winning guard): **met** by `e2e/win-guard.spec.ts` (5.13, 3 code review passes).
6. Done when 6 (merge and deploy once the owner gives the go-ahead): **open**. The owner said yes (SPEC F20), but the merge and live-site check have not happened; they are the close-out after this retro, and the epic spec accepts the no-menu, stuck-game gap until epic 6.

Open items carried: the findings F-1 to F-10 above (none blocking). Nothing found is a failing criterion.

## Open questions

1. Done when 6: shall I treat the owner's earlier yes (SPEC F20) as the go-ahead to merge `epic-5-tray` and deploy, now that this retro is written? Nothing here changed the answer, but the merge is owner-gated and was not done in this run.
2. F-10, rendered change: apply the ActionBar ellipsis font size minor and the FLIP reduced-fade easing minor, or accept them as built? They change what the player sees.
3. A1 (controller split): any objection to a source-only split now, or does the owner prefer to wait for epic 6 keyboard work to settle the controller first? Technical default: split now.

### Resolved (2026-10-14)

- Q2: owner said apply both minors; applied in 543575c, reviewed in 7e8dd28.
- Q3: owner said split now; done in 543575c (source only). A1, A2, A7, A8, A10 applied; A3 to A6 applied (doc edits in 41a9765, AGENTS.md refresh after). A9 (autopilot `test:screens` check) not applied.
- Q1: still open, awaiting the owner's go-ahead to merge and deploy.

## Assumptions

- The epic was named in the invocation as `epic-tray-and-place`; the folder is `_bmad-output/initiative-wordcell-v1/epic-tray-and-place`. `tickets.py status <folder>` has no `pending_tickets` key in this version, so I derived "none pending" from the 17 rows being `done`.
- The previous epic is `epic-board-and-gestures`, from the order of sibling epic folders and the epic file's `after`.
- One epic-wide range from 5.1's baseline was used instead of per-plan ranges (baselines are linear).
- `bmad-review` was replaced by inline lenses with the narrowing recorded under Findings, and the behavior check relied on the caller's reported green `test:all` and `test:screens` plus one `npm test` run, with no browser or dev server started.
- Every action item above is a technical default, except those marked for the owner.
