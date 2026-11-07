# Review loop — ticket 7.13 build (code mode, quick, max 7)

State: pass 2: done (converged, no fix)

Target: commit range `84df83f..HEAD` (e4c9ef0; plan-only, 0 code lines) — staged as `7-13-build.passes/pass0.diff`.
Intent: `_bmad-output/initiative-wordcell-v1/epic-pwa-release/story-deflake-the-success-signal-drag-test-plan.md`.
Pre-loop: HEAD `e4c9ef04f7d93a5fe36d491c13b1c94eb0d410eb`, tree snapshot 0 `991bd690d43c03867c308022786eebe8fa2a185f`; plan 3334 words.
Refs: ticket `story-deflake-the-success-signal-drag-test.md`, `epic-pwa-release.md`, `CLAUDE.md`, `AGENTS.md`, `ARCHITECTURE-SPINE.md`, `docs/development-methodology.md`.
Priority (caller): the plan's flagged unreviewed items — the `flip.ts` 6.1 delta, the halt reading from the forwarded console, the `cpu 20b` budget-exhaustion reading of the 7.9 sighting.

## Pass 1 — 2026-11-03
Reviewers: correctness, verification gap  |  Findings: major 1, minor 5, decision-needed 0  |  Dropped in triage: 0 (4 merged duplicates)
Snapshot: tree 074eb846975f49190df72944ee7044a424a1aaa3 (`7-13-build.passes/pass1.diff`, fix diff `pass1.fix.diff`)
### Applied
- [major] plan Item 3 "Diff of the failing path" (:42-55) and Item 5 current-tree halt read (:101-104) — the 6.1-tree diff omits on-path files that changed `03824f1..84df83f` (`src/ui/announce.ts`, `open-surface.ts`, `motion.ts`, `gestures/tile-drag.ts`, `Tray.svelte`, `tray/TileRows.svelte`, `tray/ControlRow.svelte`, `layout/tray.ts`, `gestures/targeting.ts`, `App.svelte`, `TopBar.svelte`, `app.css`, `src/main.ts`; verified by `git diff --stat`), and the halt read skips `closeTransient()` and `dispatchAnnounced`'s pre-dispatch `required` → fixer item 1
- [minor] Item 5 halt bullet (:99-100) — the forwarded-console check rules out only `fatal` halts; Q-38 `another-window` (6.1 `game.svelte.ts` storage listener, bfcache `pageshow`) halts without `console.error` (both reviewers) → fixer item 2
- [minor] Item 5 `cpu 20b` row (:91), 7.9 bullet (:107), triage :139, Auto Run Result :164 — the `cpu 20` step-7 failures are classed via `cpu 20b`, which had none; "throttled together" does not explain the first-wave-only failures (both reviewers) → fixer item 3
- [minor] Item 3 `flip.ts` bullet (:51) — omits the R-52 used-mirror hold removal and the `lifts()` clip change → fixer item 4
- [minor] Outcome :32, Item 5 rows :85-87, Auto Run Result :162-163 — injection refutations measured at 84df83f are stated without a tree → fixer item 5
- [minor] Implementation Notes :79, cpu 20 row :90, triage :138 — archived `~/wordcell-traces/7.13/injections/run.sh` is the pre-`cpu 20b` harness (no `outputDir` copy, line reporter; verified by `diff` with `/tmp/7.13/inj/run.sh`); `make.py` defines `lateEndStamped`/`lateTap`, never run (both reviewers) → fixer item 6
### Default applied (technical)
- `~/wordcell-traces/7.13/injections/` — which harness copy the record cites → archive the final `/tmp/7.13/inj/run.sh` as `run.sh`, keep the old as `run.sh.v1`
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (duplicates merged: halt/another-window, cpu 20 vs 20b, harness copy, each raised by both lenses)
### Fixer outcome
- All 6 items applied to the plan only (+49/−16; frontmatter untouched). Beyond the list: `src/ui/Board.svelte` (places `ActionBar`) added to item 3; `injected.ts` archived as `injected.ts` (cpu 20b) + `injected.ts.v1` (probe) beside `run.sh`/`run.sh.v1` in `~/wordcell-traces/7.13/injections/` (outside the repo). Playwright 1.63.0 verified at both trees (same `playwright-core` integrity).
- Orchestrator re-ran: `npm test` 91 files / 3788 passed; `npm run lint` clean; `npm run check` 0 errors.

## Pass 2 — 2026-11-03
Reviewers: correctness, verification gap, fix diff  |  Findings: major 1, minor 11, decision-needed 0  |  Dropped in triage: 0 (2 merged into the major)
Snapshot: tree 074eb846975f49190df72944ee7044a424a1aaa3 (unchanged; no fix pass)
### Open major (not fixed: stopping rule, two consecutive passes with at most one major)
- [major] plan Item 3 "Diff of the failing path, `03824f1..84df83f`" and its closing paragraph; Item 5 current-tree throw read — pass 1's completeness fix is still partial. On-path files that changed `03824f1..84df83f` and run before the storage write are still unlisted: `src/ui/overlays.svelte.ts` (+111; `closeTransient()` calls `close`/`closePeek`/`closeHoverPeek`/`deselect`, `act()` calls `clearTile()`; new `removeTop(reason)` celebration throw, `SUSPENDING`) and the `dispatch` pre-write engine path (`src/engine/view.ts` +45, Q-49 `preview` runs `commitMove` in Place; also `src/engine/replay.ts`, `scoring.ts`, `types.ts`; `src/shell/storage.ts` +19). The closing sentence ("Other `src/ui/` files … are not on the tap path") is wrong for `overlays.svelte.ts` and silent on engine/shell. Raised by fix-diff and correctness lenses; verification-gap raised the engine half as minor. Verified with `git diff --stat 03824f1 84df83f`. Proposed fix: list them with inert/deterministic notes (engine code is deterministic for this fixed Session, so a throw would fail every run; overlay paths are inert with no overlay open) and add `view()`/`closeTransient`'s overlay calls to the item 5 throw list.
### Unapplied minors (for the next build or loop)
- Item 3 `controller.ts` — "`rescroll()` runs first" is wrong: the `p.celebrating` early return precedes it (`src/ui/gestures/controller.ts:858-863`).
- Item 3 `flip.ts` — glide-rect `found` lookups already existed at 6.1; the new 84df83f tile-area `found` in `measure()` runs in `capture()` before dispatch, so "none can skip dispatch / covered by the 6.1 log" is wrong for it; cover it by `TileRows.svelte` always rendering `.tiles` and this build's green runs.
- Item 5 `cpu 20b` row / Auto Run Result — "(cold)" wave is unsupported (failed workers are replaced, so tests 9–16 also ran fresh); drop it or mark it a hypothesis.
- Item 5 halt bullet / Auto Run Result — compare the failing 6.1 log with the green attempt-2 log at the same tree (`.autopilot/20261014-2230/6.1-T.log`, identical forwarded set and counts), not with this build's superset `test:all`.
- Item 5 `probe` row / Outcome — "Refuted" rests on 3 unloaded runs; reword to "not observed unloaded at 84df83f; structurally excluded (page fits 839 px viewport, sticky bar)" or record a probe under `cpu 20`.
- Outcome / Auto Run Result — "No R-73 test failed" holds only under Scope item 2's two-test definition; `surfaces-success.spec.ts:70` (R-73-titled) teardown-stalled in the drvfs diagnostic; say so.
- Item 4 "Counted 1–3" — "each exit 0" is not in the archived logs (no exit line); say "no failed line".
- Item 4 durations — counted runs log `4.3m`/`4.4m`/`4.4m` and the drvfs full run `16.2m` (Playwright summaries), not 4.1–4.2 / 15.4 min; quote Playwright's figures or label wall-clock.
- Item 3 "Run load" / Residual risks — the 6.1 `test:all` ran 557 tests (log :1411-1414), fewer than each 903-test counted run; drop "lighter than the 6.1 `test:all`" or name the real difference (no desktop/mouse tests).
### Dropped
- none

## Result — converged after 2 passes
open major: plan Item 3 failing-path diff still omits `src/ui/overlays.svelte.ts` and the `dispatch` pre-write engine/shell files (`src/engine/view.ts`, `replay.ts`, `scoring.ts`, `types.ts`, `src/shell/storage.ts`); its "not on the tap path" sentence is wrong for `overlays.svelte.ts`. Accuracy of the evidence record only; the Never-reproduces outcome rests on the run counts, which no finding disputes.
Majors per pass: 1, 1. Decision-needed: none. Technical defaults applied: 1 (harness archive layout).
Final checks at tree 074eb84 (plan-only change): `npm test` 3788 passed; `npm run lint` clean; `npm run check` 0 errors.
Unapplied minors: the 9 listed under Pass 2.
