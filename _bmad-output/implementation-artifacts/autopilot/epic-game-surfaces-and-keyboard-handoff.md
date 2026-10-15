outcome: stopped
ticket: 6.10
reason: rule 1, code review decision-needed (button behaviour)
next: 6.10
updated: 2026-10-15T19:42:17Z
summary: Ticket 6.10 is built and code-reviewed, but one gameplay-visible choice needs your answer before it is marked done.

## Report

Ticket 6.10 (keyboard keys for menus and dialogs) is built and went through 2 code review passes, with no remaining problems except one choice for you.

**Your decision:** when a word view is open (tap-and-hold peek or a sticky view), should the Validate, Confirm and Flip buttons close it first, as Undo, Redo and the menu do? Recommended: yes (keep). Effect: the view closes when you press them, and no stale-selection error occurs. If no: those buttons would act with the view still open.

To resume: answer this (record it in the ticket Notes), then run `.claude/skills/epic-autopilot/scripts/loop.sh epic-game-surfaces-and-keyboard`. The next session runs `test:all` (and screenshots, as `src/ui` changed), then marks 6.10 done.

Close-out docs: none yet (spine AD-13 should mention `nav.settled`/`whenSettled`).
