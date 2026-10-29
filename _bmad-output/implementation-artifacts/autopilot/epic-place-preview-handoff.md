# Epic place-preview autopilot — handoff (2026-10-29)

**The run stopped before ticket 11.5 (Close-out: documents and device read): it needs you.** Tickets 11.1–11.4 are done. 11.5 is marked as needing the owner (hitl). It goes beyond a final check: it updates your documents (the game spec, EXPERIENCE.md, DESIGN.md, and the architecture spine's AD-3 and AD-14) to match what was built, and it asks for your Android read. Nothing was started for 11.5.

**What 11.5 asks of you on the phone** (`node scripts/device-preview.mjs <entry 2's Place fixture>`, see `docs/device-testing.md`): retargeting, reordering, a used cell that is not the target, Undo and Redo, Confirm's fly-to-cell, whether the ★ mark looks subtle enough, and (from your 2026-10-28 decision) how a two-digit count badge looks where it meets the ★ on a 360 px screen. Record your read, and any change you want as a new entry, in the epic Notes.

**Close-out docs gathered so far** (for 11.5's doc sync or the retro):
- DESIGN.md § Components → WordCell (place preview) ← a two-digit count badge draws above the ★ where they meet (owner, 2026-10-28)
- DESIGN.md § Components → WordCell (fly-to-cell hold with the previewed top) ← landed cards stack over the previewed-top copy (no ★) until the last landing, epic 5 F28 kept (owner, 2026-10-28), if its wording does not already say so
- ARCHITECTURE-SPINE.md AD-14 mirror list ← the hold's previewed-top copy replaces the R-52 used mirror (2026-10-28)
- EXPERIENCE.md How to play (Place scene) / DESIGN.md ← the scene's previewed WordCell shows the ★ and no count badge (owner, 2026-10-29), only if their wording implies a badge (a grep found none)

**Still open for 11.6 (refactor sweep):** the double-tap flake in `e2e/nav.spec.ts:163` came back in 11.4's first full test run, and one code-review minor from 11.4 (two bad-frame render tests match only the message prefix).

**To resume:** either run 11.5 yourself, or record in its `tickets.toml` entry that the autopilot may do the doc parts and leave it `built` for your phone check. Then rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-place-preview`.

Digest: `_bmad-output/implementation-artifacts/autopilot/epic-place-preview-20261028-1937.md`
