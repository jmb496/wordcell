# Epic autopilot run 20261030-1141 — epic-pwa-release

Epic: PWA and release (epic 7), `_bmad-output/initiative-wordcell-v1/epic-pwa-release/`
Branch: `pwa-release`
Start commit: 87ab949
Authorisation: owner-authorised autopilot mode, 2026-09-28 (docs/development-methodology.md § Autopilot); one-ticket sessions via loop.sh.

Startup note: no handoff file yet (first session of this epic); no step pid files left running.

## 7.1 Worker registration, state module and swState() — done
What it adds: the app now registers its offline helper (the service worker) after the word list has loaded, keeps track of what that helper is doing (installing, waiting, active), and lets the automated tests read that state. The player sees nothing new; no update prompt exists, by design.
Ticket review: 3 passes, converged; nothing needed your input
Build: built; commits 4938cf9
Code review: thorough (ticket risk medium), 1 pass, converged; 0 fixes applied (4 minor findings left in `_bmad-output/implementation-artifacts/review-loop/7-1-build.md`)
Tests: all passing (`npm run test:all` exit 0: 3650 unit tests, 1126 dev-server e2e, the pwa and dist-smoke suites), screenshots not needed (no UI change: only `src/main.ts`, `src/shell/`, `e2e/` and `package.json`)
Ref to fix upstream: none
Tokens: 9.8M input-equivalent (ticket review 50%, build 31%, code review 14%, orchestrator 3%, other 2%); orchestrator peak context 76k
Worth knowing: until ticket 7.2 lands, a browser with no service-worker support, or a failed worker registration, would stop the app with the error screen, because the failure handling is 7.2's job (the branch is not deployed, so no player sees this). The test that pins the start-up order is deferred to 7.5. One code-review minor goes against the spec's wording: in test builds a worker-loading error is reported only if the game has not already stopped (`src/main.ts:273`), whereas spec F17 and AD-15 say report it anyway; it only affects test builds and is carried to 7.2 or the refactor sweep (7.10), with two small test-coverage gaps in `src/shell/sw.test.ts`.
Close-out docs: none

## 7.2 Worker failure split and no-skip-waiting guards — done
What it adds: the offline helper now notices when it fails to install (the browser refuses it, it breaks while installing, or the browser has no support for it) and marks itself as failed for the rest of that launch. Players see nothing (the game keeps working online, as decided); in the test builds the failure stops the app on the error screen so a broken install fails a test at once. Two new automatic checks make sure nothing in the code ever forces a new version to take over while a game is open.
Ticket review: 3 passes, converged; nothing needed your input
Build: built; commits e340aee
Code review: thorough (ticket risk medium), 2 passes, converged; 1 fix applied (326edb4, tests only)
Tests: all passing (`npm run test:all` exit 0: 3684 unit tests, 22 dist-smoke, 1126 dev-server e2e, 19 pwa), screenshots not needed (no UI change: only `src/main.ts`, `src/shell/sw.ts`, architecture tests and `e2e/pwa/build-output.spec.ts`); size budget 560,685 / 600,000 bytes
Ref to fix upstream: none
Tokens: 10.1M input-equivalent (ticket review 45%, build 28%, code review 23%, orchestrator 2%, other 2%); orchestrator peak context 73k
Worth knowing: the 7.1 carry-over is resolved: in test builds a worker-loading error is now always reported, as spec F17 and AD-15 say (`src/main.ts`), though that is pinned only by a source check until ticket 7.7 adds the runtime test. In test builds only, if someone unregisters the helper or clears site data while a never-activated helper is installing, that counts as a failure (the spec's literal rule; no test does this; silent for players). Build-notes' description of the test-hook switch needs syncing to the as-built `VITE_TEST_HOOKS === '1'` at close-out (7.11). The build did not pause after its plan (the ticket's plan checkpoint), as usual under autopilot where gate 3 is delegated. Two code-review minors left for the refactor sweep (7.10) in `_bmad-output/implementation-artifacts/review-loop/7-2-build.md` (extra failing scan fixtures; gate-off tests should stub `'0'`).
Close-out docs: none

## Stopped — usage limit
Ticket 7.3, Step C (code review loop), pass 1 review: the step hit the 5-hour limit (`You've hit your 5-hour limit · resets 3pm (America/New_York)`) before any reviewer reported, and the orchestrator session was cut off by the same limit before it could record the stop; the interactive session recorded it afterwards. The build (26b0fae) is committed; the partial log `_bmad-output/implementation-artifacts/review-loop/7-3-build.md` (no `## Result`) is committed as a WIP checkpoint; step log kept as `.autopilot/20261030-1141/7.3-C-attempt1.log`.
Resume: rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-pwa-release`; it resumes 7.3 at Step C with the review-loop resume rule.

## 7.3 Two-build update proof — done
What it adds: an automated test that serves one version of the app, then quietly puts a newer version on the "server", and proves the new version never takes over while any game tab is open: open tabs keep the old version, nothing pops up asking the player to update, and only once every tab is closed does the next launch start on the new version. Two small test tools come with it (a local file server that can swap files mid-test, and a check that no prompt or dialog appeared). Players see nothing new.
Ticket review: 6 passes, converged; nothing needed your input
Build: built; commits 26b0fae
Code review: thorough (ticket risk medium), 2 passes, converged; 1 fix applied (8be346f, tests only: the multi-tab step now waits properly, so a too-early switch to the new version could no longer pass unnoticed)
Tests: all passing (`npm run test:all` exit 0: 3684 unit tests, 22 dist-smoke, 1141 dev-server e2e, 24 pwa), screenshots not needed (no UI change: only `e2e/` files); size budget 560,685 / 600,000 bytes
Ref to fix upstream: none
Paused: usage limit at Step C (code review pass 1), reset 3pm (America/New_York), resumed at 16:20 (America/New_York)
Tokens: 2.7M input-equivalent this session (code review 92%, orchestrator 5%, other 3%); orchestrator peak context 58k. Whole ticket including the earlier session: about 15M less 7.1/7.2's share of that session (usage-report from the run start: 15.0M across 7.2's tail and 7.3)
Worth knowing: four code-review minors are left for the refactor sweep (7.10) in `_bmad-output/implementation-artifacts/review-loop/7-3-build.md` (two plan wording fixes: a missing step for the 5-second hold and a wrong `--project` command line; one test self-check that does not prove what it claims; and a few untested helper branches, so the plan's "every row has a named test" claim should be narrowed). The ticket's own notes leave the static-server wording in F8 and build-notes for the close-out sync (7.11).
Close-out docs: none

## 7.4 precacheComplete() test hook — done
What it adds: a sixth reading for the automated tests, "is the offline copy of the app fully saved yet?", so the coming offline and failure tests (7.6, 7.7) can wait for that moment instead of guessing. It exists only in test builds; players see nothing new and the released app does not contain it.
Ticket review: 4 passes, converged; nothing needed your input
Build: built; commits 9fb2731
Code review: quick (ticket risk low; the build's own review patched all 4 medium findings, none deferred), 1 pass, converged; 0 fixes applied
Tests: all passing (`npm run test:all` exit 0: 3713 unit tests, 23 dist-smoke, 1144 dev-server e2e, 25 pwa), screenshots not needed (no UI change: `src/shell/test-hook.ts` and `e2e/` only)
Ref to fix upstream: none
Tokens: 8.3M input-equivalent (ticket review 59%, build 29%, code review 6%, orchestrator 3%, other 3%); orchestrator peak context 66k
Worth knowing: three code-review minors are left for the refactor sweep (7.10) in `_bmad-output/implementation-artifacts/review-loop/7-4-build.md` (the pwa test's "not halted" check runs a moment too early to catch a late one-off error; nothing yet stops another module from calling the new recompute at boot; one helper test runs only at `/`, so it cannot tell two URL bases apart). The ticket says the hook's absence from the released app is "proved by" the dist-smoke check; the plan says "checked by" (the build never edits the ticket), a wording nit only. If the test build's copy of the worker file ever cannot be read, every poll reports the error again; the plan confirms the error screen tolerates that.
Close-out docs: none
