# Review loop — ticket 4.6 build (code mode, 33015bf..9c25a0c)
State: pass 1: done

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
