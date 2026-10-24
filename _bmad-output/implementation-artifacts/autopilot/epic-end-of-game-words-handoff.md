# Epic end-of-game-words: handoff (stopped at ticket 10.9, final test run)

**What happened.** This session picked up 10.9 (close-out: documents, AGENTS pitfall and device check) where the usage limit had stopped it. The ticket review finished in 4 passes and needed nothing from you. The build synced the documents, wrote the two celebration-copy lines to AGENTS.md and added a long-word-list won game for your phone check. The code review found nothing to fix. Then the full test run failed on one test, `e2e/nav.spec.ts:162` (a double tap on New game on the "can't read your saved game" screen). That test has failed now and then before (in the 10.4 and 10.5 builds, and once in this build) and passes when run alone. Nothing in this ticket touches that screen, but the autopilot stops on any failure, so the screenshot check and the rest of the run did not happen.

**What you need to do.**
1. Rerun `LIMIT_CHECK=off .claude/skills/epic-autopilot/scripts/loop.sh epic-end-of-game-words`. The next session reruns only the checks (full tests and screenshots). If they pass, it stops with 10.9 `built` for your phone check. If the same test keeps failing, it is worth fixing in 10.10 (the refactor sweep) or sooner.
2. Then the phone check (the done checkpoint): `node scripts/device-preview.mjs session-won-long-words` (see `docs/device-testing.md`), then Undo, then Confirm to play the win. Watch the long word list, put the app in the background during the celebration, and check the end sheet's Words section. The checklist is in the plan's "Owner items and handoff". Record what you saw, including your A-D12 verdict (are the copies readable at the smallest size?), in the epic Notes.

**Worth knowing.** The phone-check game has 21 words and 161 card copies, fewer than the "few hundred" mentioned in 10.6, and its words are made up rather than English. Its smallest size (0.553) and pacing were measured at 360×740, so your phone may look a little different.

**Close-out docs (this run):**
- docs/game-flow-spec.md R-87 + preamble amendment ← the dictionary banner is exempt from press-skip (your standing rule, 2026-10-24; applied in 52d5aa5)
- DESIGN.md Win celebration / A-D12 ← your Android verdict (pending, applied when 10.9 is done)
- Also when 10.9 is done: tickets.toml entry 7 `interface`, the epic References F-range (F1…F29)
- The earlier lines gathered for 10.9 (AD-19 Start/Skip/Hide, EXPERIENCE.md, SPEC F29, `open-menu.ts`) were applied by this build (52d5aa5).

Digest: `_bmad-output/implementation-artifacts/autopilot/epic-end-of-game-words-20261020-0925.md`.
