# Epic end-of-game-words: handoff (ticket 10.7 built, waiting for you)

**What happened.** 10.7 (celebration interruptions) went through a 4-pass ticket review (converged), the build (commit eae5179), a thorough code review (1 pass, no majors), `npm run test:all` (unit 3581, e2e 1093, pwa 19, dist 17) and the screenshot check (67 passed). Now the celebration ends cleanly on ☰/M (end sheet, then the menu over it), on going to the background (the sheet is waiting on return), and on a resize or rotation.

**Your answer is needed on two items** (plan `story-celebration-interruptions-plan.md`, Design Notes, owner items 1–2):

1. **Going to the background mid-celebration.** The architecture (AD-19 Hide) describes a special "hide mode" that only stops the run. The build instead ends it the ordinary way, which also removes the celebration's back-button step. To the player both behave the same: the end sheet is waiting when they return. The ordinary way avoids a second code path. *Proposed: approve*; 10.9 updates AD-19 and the EXPERIENCE.md row, and your Android read at 10.9 checks it on the device. *If no:* the ticket is revised and needs new back-history operations.
2. **☰/M when something else gets there first.** If, in the split second between pressing ☰ and the end sheet appearing, a back gesture lands or the menu is already open from a second press, the extra menu open is skipped. The player sees the sheet (or the menu that is already open), never two menus. *Proposed: keep*; 10.9 adds a line to the epic spec.

**To resume:** record the answers (ticket Notes, epic Notes, SPEC memlog), commit, and rerun `LIMIT_CHECK=off .claude/skills/epic-autopilot/scripts/loop.sh epic-end-of-game-words`. The next session reruns the checks and marks 10.7 done, then continues with 10.8.

**Merge:** once you accept items 1–2, the ☰/M merge blocker from 10.4–10.6 is closed.

**Close-out docs (for the retrospective; 10.9 syncs them):** the 10.7 entry of the digest `_bmad-output/implementation-artifacts/autopilot/epic-end-of-game-words-20261020-0925.md` (AD-19 Hide, EXPERIENCE.md Win celebration message row, a new SPEC F-row, AD-13/AD-19 naming `open-menu.ts`), plus 10.6's and 10.5's entries there.
