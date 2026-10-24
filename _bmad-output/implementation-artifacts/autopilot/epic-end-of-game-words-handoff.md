# Epic end-of-game-words: handoff (stopped at ticket 10.9, final test run, again)

**What happened.** This session only reran the final checks for 10.9 (close-out: documents, AGENTS pitfall and device check), which is already built and reviewed. The full test run failed again on the same single test as last time: `e2e/nav.spec.ts:162`, a double tap on New game on the "can't read your saved game" screen. The test expects the second tap to land on the notice that opens, but the "Delete the score history?" confirm was still showing. Everything else that ran passed (lint, type check, 3597 unit tests, build, 21 shipped-build checks, 1093 Android-profile browser tests). The desktop and installed-app suites and the screenshot check did not run.

**Why it matters.** This test has now failed in 5 full runs since 10.4, including both full runs for 10.9. It passes when run alone. So it is not caused by 10.9 (which doesn't touch that screen), but it fails often enough under a full run that it now blocks every ticket's final check. The autopilot doesn't fix code itself, so it stopped.

**What you need to decide.**
1. **Fix it now (recommended).** Have a session look at the timing in `e2e/nav.spec.ts:162` (and the double-tap handling on the rejected-save screen it tests), commit the fix on this branch, then rerun `LIMIT_CHECK=off .claude/skills/epic-autopilot/scripts/loop.sh epic-end-of-game-words`. Effect: 10.9 can pass its checks, and 10.10 won't hit the same wall.
2. **Or set it aside until 10.10.** Mark the test as known-flaky/skipped for now and fix it in the refactor sweep. Effect: faster, but a real double-tap bug on that screen could slip by in the meantime.

After the checks pass, the next session stops with 10.9 `built` for your phone check: `node scripts/device-preview.mjs session-won-long-words` (see `docs/device-testing.md`), then Undo, then Confirm to play the win. Watch the long word list, put the app in the background during the celebration, and check the end sheet's Words section. Record what you see, including your A-D12 verdict (are the card copies readable at the smallest size?), in the epic Notes.

**Close-out docs (this run):**
- docs/game-flow-spec.md R-87 + preamble amendment ← the dictionary banner is exempt from press-skip (your standing rule, 2026-10-24; applied in 52d5aa5)
- DESIGN.md Win celebration / A-D12 ← your Android verdict (pending, applied when 10.9 is done)
- Also when 10.9 is done: tickets.toml entry 7 `interface`, the epic References F-range (F1…F29)

Digest: `_bmad-output/implementation-artifacts/autopilot/epic-end-of-game-words-20261020-0925.md`.
