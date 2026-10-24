# Epic end-of-game-words: handoff (10.9 built, waiting for your phone check)

**What happened.** Your fix to the double-tap tests (169c6bc) worked: the full test run passed (lint, type check, 3597 unit tests, build, 21 shipped-build checks, 1096 browser tests, 17 installed-app checks), and so did the screenshot check (67 screens, none changed). Ticket 10.9 (close-out: documents, AGENTS pitfall and device check) is now built and fully verified. It stays `built` because its last step is yours.

**What you need to do.** The phone check on your Android phone:

1. Run `node scripts/device-preview.mjs session-won-long-words` (see `docs/device-testing.md`) and open the link. The game opens already won, with no celebration. Tap Undo, then Confirm, to play the win. Reopen the link to start over.
2. Check: the long word list (smooth? cards readable at their smallest size?), put the app in the background during the celebration (the end sheet should be waiting when you come back), the end sheet's Words section, no cards left behind or colours changed, and the 10.7 leftovers: a browser toolbar showing or hiding ends the celebration; ☰ followed at once by back; coming back to the page mid-celebration after leaving it.
3. Record what you saw in the epic Notes, including your A-D12 verdict (are the card copies readable at the smallest size?). For each item: accepted, change it now, or a cleanup item for 10.10.
4. Mark 10.9 done (`uv run _bmad/method/scripts/tickets.py mark 10.9 done`), commit, and rerun `LIMIT_CHECK=off .claude/skills/epic-autopilot/scripts/loop.sh epic-end-of-game-words` for the last ticket, 10.10 (refactor sweep).

The build's notes for this check: the test game has 21 words and 161 card copies (fewer than the "few hundred" first planned), its words are not English, the smallest card size measured is 0.553 of full size, and the timing was measured on a 360x740 screen, so your phone may differ.

**Close-out docs (this run, applied at the retrospective):**
- docs/game-flow-spec.md R-87 + preamble amendment ← the dictionary banner is exempt from press-skip (your standing rule, 2026-10-24; applied in 52d5aa5)
- DESIGN.md Win celebration / A-D12 ← your Android verdict (pending, applied when 10.9 is done)
- Also when 10.9 is done: tickets.toml entry 7 `interface`, the epic References F-range (F1…F29)

Digest: `_bmad-output/implementation-artifacts/autopilot/epic-end-of-game-words-20261020-0925.md`.
