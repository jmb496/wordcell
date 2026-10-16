# Autopilot digest — epic-how-to-play-scenes (20261016-0955)

Epic: epic-how-to-play-scenes (epic 8). Branch: epic-8-how-to-play. Start commit: 61d7b72.
Owner authorisation: methodology § Autopilot (2026-09-28); owner said "proceed with epic 8" on 2026-10-16. Entry 1 carries plan_checkpoint and done_checkpoint; entry 4 is hitl: the run stops at each.

## 8.1 Scene player, first scene and engine replay harness — done
What it adds: the animated-scene player, the first scene (drag a stack) in the How to play panel, and a test that replays scene content through the real game engine.
Ticket review: 4 passes, converged (majors 11, 7, 5, 0); the one question (tap pauses, next tap restarts) was answered before the build.
Build: built; commit bbf44c3 (plan: three medium findings patched, no high)
Code review: thorough, 1 pass, converged; 0 fixes applied
Owner review (2026-10-16): slower steps, a pause before the drag, a hand pointer instead of the circle, and each dragged card and the D card flying to its own tray slot; commit 7164a66.
Tests: all passing (test:all), screenshots passed (38 passed, 14 skipped), both re-run after the owner changes
Ref to fix upstream: none
Worth knowing: review minors left: the dictionary test passes vacuously (scene 1 has no words yet), hiddenStop fires only at step/loop boundaries (known residual risk in the plan), defineScene does not range-check carry counts or columns, plan checkboxes unticked. The plan checkpoint question (does the harness split into a following ticket?) is answered by the plan: read it.
Close-out docs: none

## 8.2 Compose and destination-block scenes — done
What it adds: two more animated scenes in the How to play panel: composing BALKED from letters (borrowing L, Validate), and the destination-block scene (STAPE, then Flip to PEATS), each with its caption and a test that replays it through the real game engine.
Ticket review: 5 passes, converged (majors 8, 6, 6, 1, 1); nothing needed your input
Build: built; commit 797ba44 (plan: three medium findings patched as tests, no high); the one open major was a test detail, resolved in the build
Code review: quick, 2 passes, converged (majors 2, 0); fixes applied in c92ec45
Tests: all passing (test:all), screenshots passed (40 passed, 16 skipped)
Ref to fix upstream: none
Tokens: Tokens: 6.9M input-equivalent (ticket review 51%, build 31%, code review 12%, orchestrator 3%, other 3%); orchestrator peak context 62k
Worth knowing: nothing
Close-out docs: none
