# Epic pwa-release — handoff after ticket 7.14

**Done this session:** 7.14 "Deflake the helpers.spec.ts doubleTap test under load". The test helper that simulates a quick double tap sometimes produced two single taps instead. The cause: on this computer the Linux (WSL2) clock jumps back about 1.6 seconds roughly every 32 seconds. The helper set the second tap's time from a clock reading taken before the first tap, so when a jump landed between the taps, Chrome saw them as too far apart to be a double tap. Each tap is now time-stamped when it is sent. The cause was proven both ways: an injected clock jump broke the old helper 5 times out of 5 and the fixed one 0 times out of 5. After the fix: 0 failures in 50 repeats and in 3 full runs, and the full test suite passed. Only test code changed; players see nothing new. The ticket is marked done.

**Worth knowing:** the same clock jump probably explains the older flaky double-tap test in your backlog (D-64). This fix also covers that test, so its rare failures may stop; the retrospective can judge that.

**Why it stopped:** the next ticket, 7.11 (Close-out: documents, audits and device read), is hands-on for you. It needs your read of every Device row on the phone (tailnet preview, `docs/device-testing.md`) and every Desktop row in desktop Chrome, plus your answers or deferrals to the spec's three open questions. The autopilot cannot do those parts.

**Nothing else needs your input.**

**Close-out docs:** none so far this run.

**Resume:** run 7.11 with the owner present, for example `bmad-build` on ticket 7.11 in an interactive session. After 7.11 (and 7.12 after the merge), the next step is the epic retrospective.

Digest: `_bmad-output/implementation-artifacts/autopilot/epic-pwa-release-20261030-1141.md`
