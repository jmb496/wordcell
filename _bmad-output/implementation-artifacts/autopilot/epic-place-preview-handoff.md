# Epic 11 (place preview) autopilot handoff

Last session: ticket 11.3 "Fly-to-cell keeps the previewed top" is **stopped at the plan checkpoint**. The build wrote its plan and, as the ticket asks, stopped before writing any code so you can approve the plan.

The ticket makes the fly-in after Confirm (or a Redo that places a word) show the target WordCell's new top card from the start, so its old top card or a used card never flashes.

**What the plan does (your stacking answer, 2026-10-28):** from Confirm until the last card lands, the cell shows a copy of its new top card (without the ★) underneath; the landed cards pile up over it; when the last one lands, only the real top card remains. The tests gain two extra flights: a Redo that places a word onto a cell that already holds one, and a Confirm where a used one-card cell ends up empty.

**Your step:** read and approve the plan: `_bmad-output/initiative-wordcell-v1/epic-place-preview/story-fly-to-cell-keeps-the-previewed-top-plan.md`. 12 of the 13 small review notes are handled in its Design Notes; the 13th (splitting a long sentence in the ticket) is left, because a build never edits ticket files.

To resume: record the approval in the ticket's Notes (and the epic's Notes), commit, and rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-place-preview`. The next session builds on the approved plan, code-reviews it, runs all tests and marks it done.

Close-out docs so far:
- DESIGN.md § Components → WordCell (place preview) ← the count badge draws above the ★ pill where they meet at 360 px (owner, 2026-10-28)
- DESIGN.md § Components → WordCell (fly-to-cell hold with the previewed top) ← landed cards stack over the previewed-top copy until the last landing, epic 5 F28 kept (owner, 2026-10-28), if its wording does not already say so

Digest: `_bmad-output/implementation-artifacts/autopilot/epic-place-preview-20261028-1937.md`
