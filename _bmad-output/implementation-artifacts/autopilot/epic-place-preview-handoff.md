# Epic place-preview autopilot — handoff (2026-10-29)

**Ticket 11.4 (How to play Place scene preview) is done.** The How to play Place scene now shows the WordCell preview the way the game does: the target cell shows its future top letter with the ★ and no count badge (your decision), and the used cell 6 shows the empty outline underneath while it is not the target. The ticket review, the build, a 2-pass code review (one test tightened), the full test suite and the screenshot check all passed. Screenshots: one new baseline (scene 3 frame 4), no other baseline changed.

Worth knowing: the first full test run failed on the old double-tap flake (`e2e/nav.spec.ts:163`, the rejected-save screen). It passed 5 of 5 alone and the whole suite passed on the rerun. It is back despite fix 169c6bc, so it is worth a look in the 11.6 refactor sweep.

**Next: ticket 11.5 (Close-out: documents and device read).** It is marked as needing you (hitl), so the next driver run stops before it. It covers the doc syncs and your phone read of the place preview look.

**Close-out docs gathered so far** (applied at the retro or in 11.5):
- DESIGN.md § Components → WordCell (place preview) ← a two-digit count badge draws above the ★ where they meet (owner, 2026-10-28)
- DESIGN.md § Components → WordCell (fly-to-cell hold with the previewed top) ← landed cards stack over the previewed-top copy (no ★) until the last landing, epic 5 F28 kept (owner, 2026-10-28), if its wording does not already say so
- ARCHITECTURE-SPINE.md AD-14 mirror list ← the hold's previewed-top copy replaces the R-52 used mirror (2026-10-28)
- EXPERIENCE.md How to play (Place scene) / DESIGN.md ← the scene's previewed WordCell shows the ★ and no count badge (owner, 2026-10-29), only if their wording implies a badge

**To resume:** run 11.5 yourself, or record in its tickets.toml entry that the autopilot may do its non-device parts and leave it `built` for your phone check, then rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-place-preview`.

Digest: `_bmad-output/implementation-artifacts/autopilot/epic-place-preview-20261028-1937.md`
