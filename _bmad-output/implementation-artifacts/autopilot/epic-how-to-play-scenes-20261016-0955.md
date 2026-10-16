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
