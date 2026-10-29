# Epic 11 (place preview) autopilot handoff

Last session: ticket 11.3 "Fly-to-cell keeps the previewed top" is **stopped at the ticket review** with one question for you. Nothing was built yet.

The ticket makes the fly-in after Confirm (or a Redo that places a word) show the target WordCell's new top card from the start, so its old top card or a used card never flashes.

**Your decision:** while the word's cards fly into the cell (under a second), what should the cell show once the first card has landed?

- **Stacking (proposed default):** the landed cards pile up visibly over the new top card, one after another, until the top card itself lands; then they hide together. This keeps your epic 5 rule (F28, 2026-10-14) that landed cards stay visible until the last one lands.
- **Top stays in front:** the final top card is in view the whole time, but each card seems to vanish into the cell as it lands. This changes the F28 rule.

Either way the old top never flashes. You can also judge it at the plan checkpoint or at ticket 11.5's device read.

To resume: record the answer in the ticket's Notes (and the epic's Notes), commit, and rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-place-preview`. The next session starts the build, which stops after planning for your plan approval (this ticket has a plan checkpoint).

Close-out docs so far:
- DESIGN.md § Components → WordCell (place preview) ← the count badge draws above the ★ pill where they meet at 360 px (owner, 2026-10-28)

Digest: `_bmad-output/implementation-artifacts/autopilot/epic-place-preview-20261028-1937.md`
