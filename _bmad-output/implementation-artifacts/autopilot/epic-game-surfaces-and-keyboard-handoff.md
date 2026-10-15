outcome: stopped
ticket: 6.7
reason: rule 1, decision-needed in the ticket review (gameplay/UX wording of when a line shows)
next: 6.7
updated: 2026-10-15T13:10:00Z
summary: Ticket 6.7 is hardened but needs your call on how long the "This game wasn't added to your statistics." line shows after Reset history.

## Report

The ticket review finished (3 passes, clean) with one question for you.

Question: how long should "This game wasn't added to your statistics." show after Reset history?
- Proposed default: it shows only on the finished-game sheet that was open when you reset (from the sheet's block, or the notice over it), kept through collapse and expand. After a reload it is gone. Undo then a new finish records normally with no line. Resetting from the Statistics panel leaves the sheet with neither block nor line.
- Effect: the reassurance appears only right after resetting from the finished-game sheet; otherwise the sheet just shows the result.

Close-out docs: none yet.
Resume: reply with your choice or "default"; record it in the ticket Notes, then rerun .claude/skills/epic-autopilot/scripts/loop.sh epic-game-surfaces-and-keyboard.
Digest: _bmad-output/implementation-artifacts/autopilot/epic-game-surfaces-and-keyboard-20261014-2230.md
