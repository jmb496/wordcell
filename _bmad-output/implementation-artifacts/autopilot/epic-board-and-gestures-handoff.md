outcome: stopped
ticket: 4.9
reason: 1 — the code review needs your decision on how a selected card looks when you drag it
next: 4.9
updated: 2026-10-05T13:43:39Z
summary: Ticket 4.9 (dragging when interrupted) is built and reviewed, but one look-and-feel question needs your answer before it is finished.

# Epic board-and-gestures — handoff

Ticket 4.9 is built and reviewed. Dragging now copes with interruptions: if you drag while other cards are selected, the drag replaces the selection; if the drag is cut short (app sent to the background, back pressed, touch cancelled by the system), the cards fly home and your earlier selection comes back; Undo during a drag first puts the cards back.

- Ticket review: 4 rounds, settled, nothing needed you.
- Build: done (commit 8ce0a98).
- Code review: 2 rounds, careful depth; it fixed one real problem (commit 6b9bfed) and raised one question for you.
- Full test run (`test:all`): not run yet. It runs when the ticket resumes.

## Your decision

**When you drag a card that is already selected (so it sits lifted 8 px), should it stay lifted while you drag it?**

- **Keep things as they are for now (proposed).** The card visibly drops 8 px when the drag starts. If the drag is cancelled, it flies back 8 px too low and then snaps up. With reduced motion turned on, only the dragged cards show the lift until the fade ends. A later polish ticket can smooth this out. No extra work now.
- **Fix it now.** The dragged card keeps its lift, so there is no jump at the start and no snap after a cancelled drag. This changes how the drag position is worked out (the architecture's drag formula, AD-12), so the architecture doc needs a small wording change and the ticket gets a little more work and review.

## Worth knowing

- The unit tests take about 5.3 s, a little over the 5 s budget. This ticket didn't cause it; the refactor sweep (4.13) owns it.
- The flaky "banner during a scroll" layout test failed once more during the build (it passed on rerun). Still worth fixing in 4.13.

## Close-out docs

None from 4.9 yet. If you choose "fix it now", ARCHITECTURE-SPINE.md AD-12 (drag transform) gets an entry. Earlier tickets' entries are in the digest (`_bmad-output/implementation-artifacts/autopilot/epic-board-and-gestures-20261001-1955.md`).

## Resume

Record your answer in the ticket's Notes (or tell a Claude session, which records it and commits). Then rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-board-and-gestures`.
- If you keep the current behaviour, the next session picks up ticket 4.9 at the final check (full test run, then mark done).
- If you want it fixed now, the fix has to be built first. Ask a session to do that before you rerun the driver.

## Resolved — 2026-10-05 (interactive session)
Owner chose "fix it now" (SPEC F32) and answered two follow-ups (SPEC F33). The fix is built and code-reviewed: commits de3b04a, 7548c60, 6d09434; review log `_bmad-output/implementation-artifacts/review-loop/4-9-f32.md` (converged after 3 passes, one open major: a possibly flaky new e2e in `drag-interruptions.spec.ts`, default fix in the log). Close-out: build-notes spine entry AD-12 (F32/F33). Ticket 4.9 resumes at `test:all`, then mark done.
