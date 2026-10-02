# Review loop — ticket 4.6 build (code mode, 33015bf..9c25a0c)
State: pass 2: done

Target: `_bmad-output/implementation-artifacts/review-loop/4-6-build.passes/pass0.diff` (git diff 33015bf..9c25a0c)
Intent: `_bmad-output/initiative-wordcell-v1/epic-board-and-gestures/story-pointer-controller-core-and-cancel-wiring-plan.md`
Depth: thorough (correctness, edge cases, verification gap, intent alignment; fix diff from pass 2) | max 7
Pre-loop: HEAD 9c25a0c070dd556032ce5f82dd7ffb540e14b261, tree snapshot 0 267c9f85208ab16630584f699e96c957319dea60

## Pass 1 — 2026-10-02
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 6, decision-needed 0  |  Dropped in triage: 1 (duplicate)
Snapshot: tree e5e03c4130082bc3c8f08f463285d051602d3d8d (fix diff `4-6-build.passes/pass1.fix.diff`)
Fixer: items 1–6 applied (menuSlot clears on that pointerId's next pointerdown and before the `own` branch in up/cancel, new controller test; plan I/O rows, deferred lost-end and gutter deviation entries; nav.test hook order asserted; Design Notes reworded; pointer.spec comment). Orchestrator re-run: `npm test` 42 files / 1852 passed; lint clean (154 files); check 0 errors 0 warnings.
### Applied
- [major] src/ui/gestures/controller.ts pointerdown/pointerup/pointercancel — contextmenu slot never clears when the same pointerId's next press is uncaptured (its up takes the `own` branch first); plan I/O row "Contextmenu slot" says it clears on that pointerId's up/cancel → fixer item 1
- [minor] src/ui/gestures/controller.ts menuSlot (touch) — a cancelled captured touch press whose up is never delivered leaves a dead id in the slot until the next captured press; record as bounded in the plan I/O matrix → fixer item 2
- [minor] controller.ts uncaptured mouse press released over the desktop scrollbar gutter — pointerup never reaches the root, press and gate stay busy until the next click; add to the plan's lost-end `deferred` item → fixer item 3
- [minor] src/shell/nav.test.ts "AD-13 a Forward runs the hook before the correction…" — order of hook vs `go(-2)` not asserted → fixer item 4
- [minor] plan Design Notes "Review-log resolutions" — claims main.ts registration order is proven by lifecycle P4 tests, contradicting the plan's own `deferred` entry → fixer item 5
- [minor] e2e/pointer.spec.ts "AD-12 the controller root spans the viewport" desktop branch — bound relaxed for the scrollbar gutter without recording the deviation from the ticket Notes probe → fixer item 6
### Default applied (technical)
- menuSlot clearing — clear on any pointerdown/pointerup/pointercancel carrying `pointerId === menuSlot`, before the `own` branch
- touch dead-id slot staleness — accept as bounded, record in plan I/O matrix
- desktop gutter lost up — accept, fold into the existing lost-end `deferred` item (entries 8–11)
- viewport probe — keep the relaxed desktop bound, record it as a deviation in the plan plus a test comment
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- intent alignment: menuSlot same-id uncaptured press — duplicate of edge-case major (kept as item 1)

## Pass 2 — 2026-10-02
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 6, decision-needed 1  |  Dropped in triage: 1 (duplicate)
Snapshot: tree of HEAD c027aff (no fix pass: converged)
Orchestrator run at this state: `npm test` 42 files / 1852 passed; lint clean (154 files); check 0 errors 0 warnings.
### Open (not fixed; stopping rule: two consecutive passes with at most one major)
- [major] src/ui/gestures/controller.test.ts / controller.ts `wordcellTarget`, `resolve` — no controller test observes the resolved PressTarget, so the AD-3 sentence (WordCell emptiness from `game.view` at pointerdown, never the DOM) and column-vs-other resolution would pass on a wrong implementation — default for the next build/loop: add throw cases (cell missing from `game.view` → 'AD-12 WordCell press on unknown cell'; `game.view` undefined → 'AD-12 WordCell press without a GameView') and record in the plan's `deferred` that entry 7's tap/long-press handlers cover column/other and empty/non-empty WordCell outcomes end to end
### Default applied (technical)
- none applied (no fix pass); proposed defaults are listed with the unapplied minors below
### Decision needed (functionality / UX / gameplay)
- ticket Notes probe / e2e/pointer.spec.ts 'AD-12 the controller root spans the viewport' — the ticket said to stop and report if the controller root does not cover the viewport; on desktop it stops ~15 px short at the reserved scrollbar strip, and the build relaxed the probe and recorded the deviation in the plan instead. Practical effect: on desktop, a mouse press on the board background, a column's empty part or a foot pad that is released over that right-edge strip leaves the game treating the press as still held until the next click, so a pending layout update (e.g. after a window resize) waits for that click; the top bar, banner and action bar are inside the root. — proposed default: accept the deviation (no extra listeners outside the root, per the ticket), next click recovers
### Dropped
- verification gap: slot-clear test asserts only after pointerup — duplicate of the fix-diff minor (kept as unapplied minor 2)

## Result — converged after 2 passes
open major: controller tests do not observe the resolved PressTarget (AD-3 WordCell emptiness from `game.view`, column/other resolution); see Pass 2 Open.

Unapplied minors:
1. plan `deferred` lost-end entry vs the deviation entry and e2e/pointer.spec.ts:120 — gutter described both as routing pointerup to <html> and as receiving no page pointer events, and the lost-end entry claims "not reachable in entry 6" though the desktop gutter case is reachable now; use one wording (gutter is outside the root, its events do not reach the controller) and state it is reachable in entry 6 (mouse; next click recovers).
2. controller.test.ts 'AD-12 the slot clears on that pointer's next uncaptured press' — assert contextmenu not prevented right after `t.down(t.b.foot1)` (pins the pointerdown clear) and add a pointercancel-ended variant (pins the reordered clear).
3. controller.ts pointerdown — a same-id pointerdown with `button !== 0` returns before same-id recovery; default: run `end({ kind: 'sameId' })` for any same-id pointerdown before the button check, plus a test.
4. controller.ts `end` — a `sameId` end leaves an open peek open (cancel/pointercancel/lostCapture close it); default: close the peek on `sameId` like `pointercancel`, add to the I/O matrix 'Peek on end' row and the peek test.
5. e2e/pointer.spec.ts — no case shows the controller attached to a root mounted after boot (e.g. New game from the rejected root); default: record as entry 7/9 coverage in the plan's `deferred`, or add an android case.
