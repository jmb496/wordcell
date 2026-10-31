---
title: 'Device-read tooling for a registered worker'
type: 'feature'
ticket: '9'
created: '2026-10-31'
status: done
baseline_revision: '6785917d76f092d1734be4f25285ceeb5ae6b33f'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-pwa-release/story-device-read-tooling-for-a-registered-worker.md'
  - '{project-root}/_bmad-output/specs/spec-epic-7-pwa-release/device-checks.md'
  - '{project-root}/_bmad-output/specs/spec-epic-7-pwa-release/release-checklist.md'
  - '{project-root}/_bmad-output/specs/spec-epic-7-pwa-release/build-notes.md'
warnings: ['oversized']
deferred:
  - summary: >-
      `main()` wiring of scripts/device-preview.mjs (fixtures read before Tailscale/build, stale `dist/seed.html` removed on a no-fixture run, seed write only when seeded, signal handlers before `serve`) has no automated test; only the plan's manual AC runs cover it. Two wiring claims have neither a test nor a recorded run: a SIGINT during the port wait or `serve` runs `stop()`; `WORDCELL_APP_VERSION` reaches the script's own build (the AC run set it on a bare `npm run build`). A non-JSON fixture failing before any Tailscale or build output, and the port-4173 probe, are recorded manual runs (Implementation Notes).
    evidence: |-
      Verification-gap lens: device-preview.test.mjs imports only parseArgs, seedPage, hintLines, tailnetUrl; nothing runs main(). Deleting the rmSync line or moving readFixture after the build passes npm test. Closing it means extracting the seed-page decision and ordering into an exported helper (a refactor beyond this ticket); candidate for the CAP-8 sweep.
    location: >-
      scripts/device-preview.mjs main()
    severity: medium
  - summary: >-
      If `waitForPort` times out, main()'s rejection is unhandled and Node exits without `stop()`, leaving the spawned `vite preview` on 4173 (pre-existing).
    evidence: |-
      Blind-hunter lens; behaviour unchanged by this ticket (waitForPort and the un-caught main() call predate it). The next run then fails fast on the strict port, naming the cause.
    location: >-
      scripts/device-preview.mjs waitForPort / main() call
    severity: low
---

<intent-contract>

## Intent

**Problem:** Once the generated worker controls the tailnet origin, its `NavigationRoute` answers `/seed.html` with `index.html`, so today's "Repeat step 3" re-seed silently does nothing; the script cannot seed `wordcell:history` (G6, A-A11), and the doc lacks the G2 readiness, G3 two-build update read, Desktop-row and uninstall procedures CAP-7 lists.

**Approach:** Refactor `scripts/device-preview.mjs` into pure exported helpers (`parseArgs`, `seedPage({ sessionJson?, historyJson? })`, `hintLines`) that `main()` only wires, in the ticket's order; rewrite `docs/device-testing.md`'s read procedure per the story's Seed steps, Desktop rows, Update read and Also bullets; cover the helpers in `scripts/device-preview.test.mjs`. The story file is the full contract; this plan adds the review-log minors' resolutions (Design Notes).

## Boundaries & Constraints

**Always:** Rule 6: usage errors and a non-JSON fixture throw (`Error` whose message contains `usage` for usage errors); no catch in `main()`. Absent fixture is `undefined`; `history-invalid-null` parses to `null` and is stored as `"null"`. Test names start `AD-17`. Printed strings exactly as Design Notes. Cite ids (G-n, CAP-n, AD-n) instead of restating rules in comments.

**Never:** Touch any file outside `scripts/device-preview.mjs`, `scripts/device-preview.test.mjs`, `docs/device-testing.md` (plus this plan); no `src/`, `public/`, `vite.config.ts` change; no new CLI flag beyond `--history`; no `env` passed to the build's `execFileSync`; no string overload of `seedPage`; do not drop the seed page's unregister.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| No args | `parseArgs([])` | `{ session: undefined, history: undefined, build: true }` | — |
| Session only | `['session-x']` | session `session-x`, history `undefined` | — |
| History only | `['--history','history-x']` | session `undefined`, history `history-x` | — |
| Both, either order | `['session-x','--history','history-y']` / reversed | both set | — |
| `--no-build` anywhere (not the `--history` value slot), repeated OK | first/middle/last; `['--no-build','--no-build']` | `build: false` | — |
| `--history` missing / `--`-prefixed value | `['--history']`, `['--history','--no-build']` | — | throws `/usage/` |
| Repeated `--history`, 2nd positional, unknown flag, positional not `session-` (incl. `history-x`), value not `history-` (incl. `session-x`) | — | — | throws `/usage/` |
| seedPage history-only | `{ historyJson: <history-invalid-null.json> }` | stores `wordcell:history` = `"null"`, no `wordcell:session`; has `unregister()`, `location.replace('/')` | — |
| seedPage both | `{ sessionJson, historyJson }` | both `setItem`s | — |
| seedPage bad | `{}`; `{ historyJson: '' }`; `{ sessionJson: '{not json' }` | — | throws |
| hintLines seeded | `parseArgs(['--history','history-x'])` | `[url line …/seed.html, seed hint, 'Ctrl+C stops.']` | — |
| hintLines no fixture | `parseArgs([])` | `[url line …/, 'Fresh install…', 'Update read (G3)…', 'Ctrl+C stops.']` | — |

</intent-contract>

## Code Map

- `scripts/device-preview.mjs` -- today: `seedPage(sessionJson)` string arg (L22–31), `main()` L59–121 parses argv inline (`args.find(...)` takes a `--history` value as session, the bug), builds before reading the fixture, prints L103–106 ("After a new build…", to replace), registers SIGINT/SIGTERM only after `serve` succeeds (L107–108). Keep `tailnetUrl`, `tailscaleBin`, `waitForPort`, the `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` env, `stop()`'s `serve --https=443 off`, and the `import.meta.url` main guard. Update the header usage comment to the new CLI; the seed page's unregister comment says guard for an uncontrolled first visit.
- `scripts/device-preview.test.mjs` -- 4 existing cases; port the two `seedPage` ones to `seedPage({ sessionJson })` keeping their assertions (regex on `localStorage.setItem("wordcell:session", …)`); tailnetUrl cases unchanged.
- `docs/device-testing.md` -- keep "Why Tailscale" and "One-time setup"; rewrite "Each read" and "Notes"; add sections per Tasks.
- `scripts/app-version.mjs` -- read-only: `WORDCELL_APP_VERSION` replaces the whole footer string (no SHA); unset → `<version> (<7-char sha>)`.
- `fixtures/history-invalid-null.json` (content `null`), `session-place-free-letter-redo-tail.json`, `session-gave-up.json`, `session-won-words.json` -- exist; doc names them without `.json`.
- Sources the doc must match: `device-checks.md` G1–G6, G20–G22 (G3's full order and Disposition); `release-checklist.md` Production sequence steps 2–4; `build-notes.md` "Device tooling".

## Tasks & Acceptance

**Execution:**
- [x] `scripts/device-preview.mjs` -- export `parseArgs`, `seedPage`, `hintLines` per story Script bullet and Design Notes; `main()` order: `parseArgs` → read + `JSON.parse` each given fixture (fail fast; pass the raw strings on) → no fixture: `rmSync('dist/seed.html', { force: true })` → Tailscale lookup → build (unless `--no-build`) → `dist/index.html` check → seed write (either fixture) → spawn preview → register SIGINT/SIGTERM → wait port → serve → print `''`, `hintLines(...)`, `''` -- CAP-7, F9.
- [x] `scripts/device-preview.test.mjs` -- port existing cases; add every I/O Matrix row as `AD-17 …` cases; usage cases assert `toThrow(/usage/)`; `hintLines` asserts exact arrays (`toEqual`).
- [x] `docs/device-testing.md` -- per story Seed steps, Desktop rows, Update read (tailnet + production variant), Also bullets and Design Notes doc items.

**Acceptance Criteria:**
- Given the new tests, when `npx vitest run scripts/device-preview.test.mjs` runs, then every I/O Matrix case and the ported cases pass.
- Given `docs/device-testing.md`, when checked line by line against `device-checks.md` G1–G6, G20–G22 and `release-checklist.md` steps 2–4, then each step CAP-7 lists is present in G3's order, with the spoiled-read routing of G3 and step 4.
- Given a stub `dist/seed.html`, when `npm run build` runs, then the stub is gone (Vite empties `dist/`).
- Given a plain `npm run build` and a stub `dist/seed.html`, when `timeout --preserve-status -s INT 60 node scripts/device-preview.mjs --no-build` runs (plain `timeout` reports 124 whenever it fires), then the stub is gone, the run exits 0 at SIGINT, and a second identical run (no stub) also exits 0; then `tailscale.exe serve status` shows no share (unverified until run: needs Serve enabled on the tailnet).
- Given no `fixtures/session-missing.json`, when `timeout -s INT 60 node scripts/device-preview.mjs session-missing` runs (no `--no-build`), then it exits non-zero with an ENOENT for that path and prints no Tailscale or Vite/`npm run build` output.
- Given `WORDCELL_APP_VERSION=A npm run build`, when `dist/assets/*.js` is grepped, then `` textContent=`A` `` is found; a `WORDCELL_APP_VERSION=B` build gives a different `dist/sw.js` (both sha256 recorded); then a plain rebuild.
- Given the diff from `baseline_revision`, when listed outside `_bmad-output/`, then only the three files appear; `npm run test:all` is green.

## Implementation Notes

Script AC runs (2026-10-31, HEAD 6785917, Tailscale 1.102.3 via `tailscale.exe`, Serve enabled):

- Missing fixture: `timeout -s INT 60 node scripts/device-preview.mjs session-missing` (no `--no-build`) exits 1 with `ENOENT … open 'fixtures/session-missing.json'`; no Tailscale, Vite or `npm run build` output.
- Build removes a stub: `echo stub > dist/seed.html`, then `WORDCELL_APP_VERSION=A npm run build`: `dist/seed.html` gone.
- Footer override: after the A build, `` textContent=`A` `` found in `dist/assets/index-ZlA9o4As.js`; `dist/sw.js` sha256 `f85a7ee9e034a1695dfc3d60fc6a425f2b44b30b44960db3f3ed324d2f1c882c`. `WORDCELL_APP_VERSION=B npm run build`: `` textContent=`B` `` in `dist/assets/index-p68R-YxV.js`; `dist/sw.js` sha256 `2c7878dad46447044235a8bf580c1241282a05c3a8481dfe162800097ff8c63c` (different). Plain rebuild: footer `0.0.0 (6785917)`.
- `--no-build` stub removal: after a plain build, `echo stub > dist/seed.html`, `timeout -s INT 60 node scripts/device-preview.mjs --no-build`: stub gone, share came up and printed the no-fixture lines. Plain `timeout` reports 124 whenever it fires, whatever the child returns, so the exit code was read with `timeout --preserve-status -s INT 60 …`: 0 with a stub, and 0 for a second run with no stub. `tailscale.exe serve status` afterwards: `No serve config`.
- Extra: `timeout --preserve-status -s INT 25 node scripts/device-preview.mjs --history history-invalid-null --no-build` exits 0, prints the `/seed.html` line and the seed hint; `dist/seed.html` stores only `wordcell:history` = `"null"`; serve status `No serve config` after; the seed page was then removed by hand.
- Non-JSON fixture (review-loop pass, 2026-10-31): `printf '{not json' > fixtures/session-tmp.json`, then `timeout -s INT 60 node scripts/device-preview.mjs session-tmp` (no `--no-build`) exits 1 with `SyntaxError: Expected property name or '}' in JSON at position 1` from `readFixture`; no Tailscale, Vite or `npm run build` output; the file was then deleted.
- Port busy (review-loop pass, 2026-10-31): with a throwaway `node -e "require('net').createServer().listen(4173,'127.0.0.1')"` listener, `timeout -s INT 60 node scripts/device-preview.mjs` (no `--no-build`) exits 1 with `device-preview: port 4173 is taken; stop the other run (Ctrl+C) or free it`; no Tailscale, Vite or `npm run build` output; listener stopped after.
- The Verification diff command's original `':!_bmad-output'` was rejected by git (`Unimplemented pathspec magic '_'`); `':(exclude)_bmad-output'` lists only the three files.
- `npm run test:all`: lint, check, unit (3759 passed), build, `test:e2e:dist` green on both runs; `test:e2e` had one timing flake per run, a different spec each time (run 1 `e2e/success-signal.spec.ts:440` drag step; run 2 `e2e/nav.spec.ts:163` doubleTap, taps 1.7 s apart), neither reachable from this change (no `src/` file touched); each passed on rerun (success-signal `--repeat-each 3`, nav.spec whole file); `test:e2e:pwa` then run on its own: 37 passed.
- Parent verification (2026-10-31): `npm run lint`, `npm run check`, `npm test` (91 files, 3759 passed), `npm run build` (560,704 / 600,000), `test:e2e:dist` (28 passed), `test:e2e` (1153 passed, 1091 skipped, no failure), `test:e2e:pwa` (37 passed), run one after another as `test:all`'s sequence: all green. Verification and AC commands corrected in place (`:(exclude)` pathspec, `timeout --preserve-status`).

## Plan Change Log

- SIGINT/SIGTERM register right after the preview spawns, before the port wait and `serve`, which goes beyond the story's `main()` order (… preview → serve, no signal step); harmless (`serve … off` with no share is ignored) and justified by Design Notes item 2.
- Review-loop pass: `main()` probes 127.0.0.1:4173 once after reading the fixtures and before the stale-seed removal, Tailscale lookup and build, and throws `device-preview: port 4173 is taken; stop the other run (Ctrl+C) or free it` (rule 6), a step beyond the story's `main()` order; a second run would otherwise rebuild `dist/` under the first run's server and its preview-exit `stop(1)` would turn off the first run's share. `waitForPort` reuses the same `portOpen` connect check. The doc's re-seed sentence and G4 row now say Ctrl+C the running script first.

## Review Triage Log

### 2026-10-31 — Review pass
- verdicts: 28 findings — high 0, medium 2, low 10, false 13, maybe-false 3
- findings:
  - `[low]` `[patch]` blind: "Remove animations" line stranded under "Before the production install" — moved into Notes.
  - `[low]` `[patch]` blind: production variant mixes release-checklist step numbers with the doc's Update-read steps — checklist steps written as "release-checklist step n".
  - `[medium]` `[patch]` blind: "Afterwards, the next run builds…" does not forbid `--no-build`, which would serve build B (footer `B`) to later reads — reworded: the next run must build. Grouped with edge #5.
  - `[low]` `[patch]` blind: Seeded reads step 6 "launch cold" undefined — step 6 launches from the icon with no WordCell window in recents. Grouped with edge #4.
  - `[low]` `[reject]` blind: uninstall step gives no path — every Android user knows uninstall; the production origin is a different origin, so tailnet site data is irrelevant; no named harm.
  - `[low]` `[patch]` blind: intro sentence ungrammatical after the edit — split into two sentences.
  - `[low]` `[defer]` blind: waitForPort timeout leaves vite preview running — pre-existing, unchanged by this diff; deferred (low).
  - `[low]` `[reject]` blind: Ctrl+C during the synchronous `serve` prints the "approve the link" message and exits 1 — share is still turned off by stop(1); a sub-second window; fix adds a branch. Grouped with edge #1.
  - `[false]` `[reject]` blind: hintLines omits a desktop/localhost line — the intent fixes the printed lines exactly.
  - `[low]` `[reject]` blind: first ported test keeps its inline regex — intent says ported cases keep their assertions; cosmetic.
  - `[low]` `[reject]` blind: `stored()` returns `{ value }`, forcing casts — cosmetic, test-only.
  - `[medium]` `[defer]` blind: seedPage order/re-serialisation and main() wiring untested — re-serialisation is asserted (stored value parsed and compared); setItem-before-replace is fixed by one string concatenation; the main() part grouped with verification-gap #1 (deferred).
  - `[false]` `[reject]` blind: Implementation Notes pathspec bullet self-contradictory — fix is a plan edit (rule); the note text was restored to the original rejected form as a record correction.
  - `[false]` `[reject]` blind: AC still tagged "(unverified until run)" — plan edit; the run is recorded in Implementation Notes.
  - `[false]` `[reject]` blind: Plan Change Log empty, story wording differs — no bad_plan loopback happened (the log's purpose); the hint wording follows the invocation's resolved minor (CAP-7 wording), Design Notes item 6.
  - `[false]` `[reject]` blind: lenses_ran set before triage — the review was in progress; this entry is its record.
  - `[false]` `[reject]` blind: plan file mode 100755 — `core.fileMode` is false on this checkout, so git records 100644 regardless of drvfs bits.
  - `[low]` `[reject]` edge: Ctrl+C during `serve` spawnSync gives a false Serve error — same as blind #8.
  - `[low]` `[reject]` edge: SIGINT during waitForPort turns off an unrelated 443 serve config — stop() already ran `serve … off` on the pre-existing preview-exit and serve-failure paths; this machine's Serve exists for this script; fix adds state.
  - `[false]` `[reject]` edge: a fixture containing `</script>` breaks the inline script — fixtures hold letters, numbers and fixed keys (`fixtures/session-*.json`, `history-*.json`); not reachable.
  - `[maybe-false]` `[patch]` edge: installing from the seeded tab may open an app window, making step 6 a resume — settle on the phone; grouped with blind #4 (verified low), fixed by the same step-6 wording.
  - `[medium]` `[patch]` edge: a `--no-build` run after G3 serves footer B — same as blind #3.
  - `[medium]` `[defer]` verification-gap: main() wiring changes covered only by manual runs — deferred (frontmatter), lens disposition defer.
  - `[false]` `[reject]` intent: seed hint text diverges from the story's "Seed or re-seed" — the invocation directed CAP-7's "Seed, re-seed or fresh install" wording (review-log minor); tests pin it.
  - `[maybe-false]` `[defer]` intent: main() runtime expectations untested — same as verification-gap #1.
  - `[maybe-false]` `[reject]` intent: doc procedures have no automated check — inherent to owner device procedures; the doc was checked against device-checks.md and release-checklist.md; the "(unverified)" tags come from the spec.
  - `[false]` `[reject]` intent: F9 "nothing new ships" has no test — the diff touches only the three files (Verification command), and `npm run build` leaves no seed page (AC run).
  - `[false]` `[reject]` intent: scope additions (early signal handlers, snackbar wait, desktop notes) — each is a review-log minor the invocation asked the build to resolve.

## Design Notes

Printed lines (`hintLines(url, parsed)`; seeded = `parsed.session !== undefined || parsed.history !== undefined`):
- seeded: `On the phone (Tailscale connected): ${url}/seed.html`, `Seed, re-seed or fresh install: clear this origin's site data on the phone first.`, `Ctrl+C stops.`
- else: `On the phone (Tailscale connected): ${url}/`, `Fresh install: clear site data first.`, `Update read (G3): keep site data.`, `Ctrl+C stops.`

Review-log minors (Result) resolved:
1. Missing-fixture check runs without `--no-build` (AC above); fixtures are read before the Tailscale lookup.
2. Stub-removal check after a plain build, exit 0 at SIGINT, second run with no stub, `tailscale.exe serve status` (unverified tag) — AC above. SIGINT/SIGTERM handlers now register right after the preview spawns, so a SIGINT during the port wait or `serve` still runs `stop()` (`serve … off` with no share is harmless; its status is ignored as today).
3. `seedPage({})` throwing case; history-only case asserts `unregister()` and `location.replace('/')` — Matrix.
4. `--no-build` in the `--history` value slot is a usage error — Matrix.
5. Doc check covers `release-checklist.md` steps 2–4 — AC.
6. Seed-run hint uses CAP-7's "Seed, re-seed or fresh install" wording. The optional "close every WordCell window" is not added to the printed line: the doc's first seed step carries it with the reason, and the line stays the ticket's single hint.
7. Doc: Jared records `git rev-parse --short=7 HEAD` (7 chars, as `scripts/app-version.mjs`) with each A/B footer in the epic Notes.
8. Doc seed step: after closing the origin's Chrome tabs, wait until Chrome's Undo snackbar is gone before clearing (unverified).
9. `main()` JSON-parses each fixture for fail-fast, then passes the raw strings to `seedPage` (which parses again; cheap, keeps `seedPage` the one place that serialises).
10. A `.json`-suffixed name: no extra usage check; the read of `fixtures/<name>.json.json` already fails fast with the path in the ENOENT, before any Tailscale or build output.
11. `WORDCELL_APP_VERSION` reaches `npm run build` because `execFileSync('npm', …)` passes no `env` (inherits `process.env`); keep it that way.
12. Carried from pass 3: repeated `--no-build` accepted (Matrix); usage tests match `/usage/`; doc Note: "`dist/seed.html` … the next build or a no-fixture run removes it"; Desktop rows read from a no-fixture run, site data cleared per origin opened (tailnet URL and `localhost:4173` are separate origins).

## Verification

**Commands:**
- `npx vitest run scripts/device-preview.test.mjs` -- expected: all pass
- `npm run lint && npm run check` -- expected: clean
- `git diff --name-only 6785917d76f092d1734be4f25285ceeb5ae6b33f -- . ':(exclude)_bmad-output'` -- expected: the three files only
- `npm run test:all` -- expected: green

**Manual checks (if no CLI):**
- The four script AC runs above, results (exit codes, hashes, serve status) recorded in Implementation Notes.

## Auto Run Result

**Summary:** CAP-7 device-read tooling. `scripts/device-preview.mjs` now exports `parseArgs` (with `--history` consuming its value, and usage errors per the story), `seedPage({ sessionJson?, historyJson? })` (stores `wordcell:session` and/or `wordcell:history`; `{}`, `''` and non-JSON input throw) and `hintLines` (the exact printed lines). `main()` reads the fixtures before Tailscale or the build, removes a stale `dist/seed.html` on a no-fixture run, and registers its Ctrl+C handlers right after the preview starts. `docs/device-testing.md` now has: clearing site data with every window closed, the seeded reads for G4–G6 with their fixtures, G1/G2 install and offline readiness, the Desktop rows G20–G22, the G3 update read in G3's order (recording `git rev-parse --short=7 HEAD` next to each footer, and the spoiled-read routing), the production variant (release-checklist steps 2–4), and uninstalling the tailnet app before the production install.

**Files changed:**
- `scripts/device-preview.mjs` -- pure CLI/seed/hint helpers; `main()` wiring and order as planned.
- `scripts/device-preview.test.mjs` -- existing cases ported to `seedPage({ sessionJson })`; 21 new `AD-17` cases (25 total).
- `docs/device-testing.md` -- the read procedures listed above.

**Review (thorough: blind-hunter, edge-case-hunter, verification-gap, intent-alignment):** 28 findings.
- Patched: 5 entries (1 medium, 4 low), all doc wording: the "Remove animations" line moved into Notes; release-checklist step numbers made explicit; the run after G3 must build; step 6 defines a cold launch; the intro split into two sentences.
- Deferred: 2. `main()` wiring has no automated test, and the SIGINT-before-`serve` and `WORDCELL_APP_VERSION`-through-the-script claims have no recorded run either (medium; CAP-8 candidate). A `waitForPort` timeout leaves `vite preview` running (low, pre-existing).
- Rejected: 21, each with its reason in the Review Triage Log.

**Follow-up review recommended:** false. One medium and no high entry was patched; every patch is a doc-text change.

**Verification:**
- Each `test:all` suite passed when run in its order: lint, check, unit (3759 tests), build (560,704 / 600,000), `test:e2e:dist` (28), `test:e2e` (1153 passed), `test:e2e:pwa` (37).
- After the doc patches: the device-preview tests (25) and lint passed again.
- The four script acceptance runs are recorded in Implementation Notes: missing fixture exits 1 with no Tailscale or build output; stub removal exits 0 at SIGINT; `serve status` shows no config; A/B footers and `sw.js` hashes differ.
- The diff outside `_bmad-output/` touches only the three files.

**Residual risks:**
- The doc's phone steps marked (unverified) are confirmed only at entry 11's device read: the Chrome All-sites clear path, the Undo-snackbar wait, chrome://serviceworker-internals, and an app window opened by the install.
- The implementer's `test:all` runs each hit one timing failure in the dev-server e2e suite (`success-signal.spec.ts:440`, `nav.spec.ts:163`). Neither spec can be reached from this change, and both passed on rerun and in the parent's run.
