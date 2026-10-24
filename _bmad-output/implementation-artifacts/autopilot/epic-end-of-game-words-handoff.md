# Epic end-of-game-words: handoff (stopped before ticket 10.9)

**What happened.** This session found 10.8 done and 10.9 next. 10.9 (close-out: documents, AGENTS pitfall and device check) is marked hands-on (`hitl`) and nothing authorises the autopilot to run it, so the autopilot started nothing and stopped.

**What you need to do.** Pick one:
- **Run 10.9 yourself.** Do the Android read of a long word list, the hide-to-background path and the end sheet's Words section (`node scripts/device-preview.mjs <fixture>`, see `docs/device-testing.md`), and apply the doc syncs listed below.
- **Let the autopilot do the paperwork.** Note in 10.9's ticket entry that the autopilot may run its non-device parts. It then builds and checks the ticket, leaves it `built`, and stops so you can do the device check. Commit the note, then rerun `LIMIT_CHECK=off .claude/skills/epic-autopilot/scripts/loop.sh epic-end-of-game-words`.

10.10 (refactor sweep) can run under the autopilot once 10.9 is done.

**Close-out docs (gathered so far; 10.9 applies them):**
- ARCHITECTURE-SPINE.md AD-19 Start ← F16: a win that settles while the app is in the background opens the end sheet on return with no celebration; reduced motion or the seam off adds no `celebration` history entry (owner, 2026-10-23)
- EXPERIENCE.md § celebration "Never plays" ← F16 background win (owner, 2026-10-23)
- ARCHITECTURE-SPINE.md AD-19 Skip ← F17 keys skip whatever holds focus (2026-10-23); F18 300 ms press guard (2026-10-24); F19 press-point bar test, chorded or repeated Space never activates a control (2026-10-24)
- docs/game-flow-spec.md R-87 ← the whole dictionary banner is exempt from skipping (owner to confirm at 10.9)
- ARCHITECTURE-SPINE.md AD-19 Hide ← F28: hide ends the run the ordinary way (2026-10-24); EXPERIENCE.md Win celebration message row ← F28
- SPEC (epic 10) ← F29 row (added): a raced ☰/M menu open is skipped
- ARCHITECTURE-SPINE.md AD-13/AD-19 ← `openMenu()` lives in `src/ui/open-menu.ts`

Digest: `_bmad-output/implementation-artifacts/autopilot/epic-end-of-game-words-20261020-0925.md`.
