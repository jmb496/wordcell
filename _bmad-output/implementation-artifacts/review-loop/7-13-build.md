# Review loop — ticket 7.13 build (code mode, quick, max 7)

State: pass 1: done

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
