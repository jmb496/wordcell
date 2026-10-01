---
title: 'Primary action, New game, Replay and feedback'
type: 'feature'
ticket: '4'
created: '2026-09-30'
status: done
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-app-shell/story-primary-action-new-game-replay-and-feedback.md'
  - '{project-root}/_bmad-output/specs/spec-epic-3-app-shell/build-notes.md'
warnings: [oversized]
deferred: []
baseline_revision: 'd7df29cca7d9db946e4506e203a80ddf29496d6d'
---

<intent-contract>

## Intent

**Problem:** The minimal board has no primary action, so Confirm, game-over New game and Replay are unreachable, the store has no `newGame()`/`replay()`/`feedback`, player-visible strings live inline in `App.svelte`, and the E8 dispatch cost is unmeasured.

**Approach:** Add `newGame()`, `replay()` and a `$state` `feedback` to the AD-4 store, a `words` binding in `dictionary.svelte.ts` passed to `apply`, `src/ui/text.ts`, one `primary-action` button on the minimal board, and the standalone `scripts/measure-dispatch.mjs` (+ `summarise` test). The ticket file is the authority for every detail; this plan settles the review log's unapplied minors (Design Notes).

## Boundaries & Constraints

**Always:** AGENTS.md rules 1–7, Conventions and Known pitfalls; store order per AD-4 (take-and-discard, `createSession`, enter `active` with `feedback` cleared, then `write(SESSION_KEY, serializeSession(s))`); only `game.svelte.ts` calls `createSession`/`apply`; `newGame`/`replay` never touch any key but `wordcell:session`; shell Vitest names start `AD-4`, Playwright names start with the R-id (`R-73`, `R-74 R-73`) or `AD-3`; seed Playwright only through `seedStorage`/`fixture`; unit suite < 5 s; R-02 literals, engine sources and every fixture file unchanged.

**Never:** Validate enablement, loading/failed labels, dictionary loading or rendering the invalid-word line (entry 9); `overlays.resetForNewSession()` (entry 8); halt/rejected-root UI (entry 5); lifecycle/clock resume in app code (entry 6); history reconcile (entry 7); a confirm dialog or double-tap guard; try/catch in the store; optimising dispatch; adding the E8 run to `test:all`, CI or any Playwright config; edits to the ticket, SPEC, AGENTS.md or tickets.toml.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| New game from active | any active Session | writes `createSession(newSeed())` before returning; `current()` active with it; `feedback` `{}` | write throws → rethrows, stored bytes unchanged |
| New game from rejected | rejected launch | as above; `loaded()` still `{ session: { rejected: reason } }` | write throws → rethrows, stored bytes unchanged |
| Replay | active, seed s | writes `createSession(s)` | write throws → rethrows, stored bytes unchanged |
| wrong state | newGame while booting; replay while booting/rejected | throws, nothing written | — |
| failed Validate | session-composing + mocked `words` lacking the word | `rejectedWord` = engine's lowercase spelling, `changed:false` | — |
| rejectedWord kept | no-op; accrue-only no-op (write happens, `changed:false`) | unchanged | — |
| rejectedWord cleared | changed dispatch, `newGame()`, `replay()` | `feedback` has no `rejectedWord` key | — |
| discarded take | clock resumed, +a ms, newGame/replay, +b ms, `giveUp` | stored `activeMs === b` | — |

</intent-contract>

## Code Map

- `src/shell/game.svelte.ts` -- AD-4 store: `state` (`$state.raw`), `launch`, `load`, `dispatch` (take → accrue → `apply(accrued, command, { lang: EN })` → write-then-assign). Add `newGame`, `replay`, `feedback` getter on the exported `game` object; pass `dictionary: words` to `apply` (spread it only when defined if the compiler rejects `undefined` for the optional field).
- `src/shell/dictionary.svelte.ts` -- only `dictionaryUrl`; add `export let words: ReadonlySet<string> | undefined;` (no initializer, so Biome `useConst` stays quiet; entry 9 assigns it).
- `src/shell/game.svelte.test.ts` -- `setup({ stored, storage, seed })` does `vi.resetModules()` + stubs + dynamic import of `./game.svelte` and `./clock`; `storage.control.failWrites`, `storage.writes`, `storage.map`; `time.now` drives the stubbed `performance.now`; `NO_OP` = `setDestinationCount {k:1}` on session-composing; `active(text)` loads.
- `src/ui/App.svelte` -- minimal board: top row (heading, Undo/Redo with inline `aria-label`s), Seed line, columns, WordCells; `.icon` styles; add the primary action after the WordCells section. GameView fields: `status` (`playing|won|gaveUp`), `phase`, `canConfirm`, `draft?.structural` (`{ok:true}|{ok:false; reason:'too-short'}`).
- `src/ui/app.css` -- tokens `--wc-accent-orange`, `--wc-ink-on-accent`, `--wc-surface-raised`, `--wc-ink-secondary`, `--wc-ink-disabled` (add none).
- `e2e/game-store.spec.ts` -- android-only; `snapshot(page)` (stored/current/loaded in one evaluate), `sessionOf`, `open`; the existing `R-73 Undo and Redo on session-place.json …` test is extended and renamed.
- `e2e/helpers/seed.ts` -- `seedStorage(page, { session })`, `fixture(name)`; plain TS (type-only Playwright import), runnable under Node 24 type stripping.
- `scripts/size-budget.mjs` / `scripts/build-icons.mjs` -- patterns: `// @ts-check`, JSDoc types, direct-execution guard `process.argv[1] !== undefined && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)`, `const { chromium } = await import('@playwright/test')` inside `main`, in-page code as a string (tsconfig.node.json: lib ES2023, no DOM, checkJs over `scripts/**/*.mjs`). Vitest includes `scripts/**/*.test.mjs`.
- `playwright.pwa.config.ts` -- uses port 4173 for `dist-test` preview; E8 uses 4174.
- `e2e/placeholder.screens.spec.ts` (+ `-snapshots/placeholder-board-{android,desktop}-linux.png`) -- seeded session-idle-fresh; baselines change with the button.
- `fixtures/session-won.json` -- seed 1, 8 committed moves, cursor 8 idle, `activeMs` 0.

## Tasks & Acceptance

**Execution:**
- [x] (before edits) `npx vitest run` -- record Duration.
- [x] `src/ui/text.ts` -- new: `export const text = Object.freeze({ … } as const)` with `validate: 'Validate'`, `needLetters: 'Need 3+ letters'`, `confirm: 'Confirm'`, `newGame: 'New game'`, `undo: 'Undo'`, `redo: 'Redo'`; header comment: every EXPERIENCE.md catalogue string lives here (later entries add theirs).
- [x] `src/shell/dictionary.svelte.ts` -- add the `words` binding.
- [x] `src/shell/game.svelte.ts` -- `feedback = $state<{ rejectedWord?: string }>({})`, exposed as `get feedback()`; in `dispatch`, after the write-then-assign: `result.rejectedWord !== undefined` → `feedback = { rejectedWord }`; else `changed` → `feedback = {}`; else keep. `newGame()`: throws unless `active`/`rejected`; `fresh(createSession(newSeed()))`. `replay()`: throws unless `active`; `fresh(createSession(state.session.seed))`. `fresh(session)`: `clock.take(performance.now())` (discarded), `state = { kind: 'active', session }`, `feedback = {}`, then `write`. Header comment updated.
- [x] `src/ui/App.svelte` -- Undo/Redo `aria-label`s from `text`; one `<button type="button" class="primary" data-testid="primary-action">` after the WordCells: status ≠ playing → `text.newGame`, enabled, `onclick` → `game.newGame()`; else phase `place` → `text.confirm`, `disabled={!board.canConfirm}`, dispatches `{ type: 'confirm' }`; else disabled, label `text.needLetters` when phase is `composing` and `board.draft?.structural.ok === false`, otherwise `text.validate`, no handler. Style: DESIGN.md button-primary (accent-orange fill, ink-on-accent, 48px tall, full width of the board, radius 9999px); disabled: surface-raised fill, `Need 3+ letters` ink-secondary, plain `Validate` ink-disabled.
- [x] `src/shell/game.svelte.test.ts` -- the shell Vitest tests of the Tests mapping; feedback tests in their own `describe` with `vi.doMock('./dictionary.svelte', () => ({ dictionaryUrl: '', words: new Set([...]) }))` before `setup()` and `vi.doUnmock` in its `afterAll`.
- [x] `e2e/game-store.spec.ts` -- extend/rename the R-73 test, add the `R-74 R-73` and `AD-3` tests.
- [x] `scripts/measure-dispatch.mjs` -- new, `// @ts-check`: exported pure `summarise(ms)`; guarded `main()`: fail with `run npm run build:test first` when `dist-test/index.html` is missing; spawn `node_modules/.bin/vite preview --outDir dist-test --port 4174 --strictPort`, poll `http://localhost:4174/` until ok (fail after ~30 s); `try/finally` kills the child and closes the browser, and a `SIGINT` handler kills the child then exits 130; `chromium.launch()`, `browser.newContext({ ...devices['Pixel 7'] })`, `seedStorage(page, { session: fixture('session-won.json') })` via `await import(new URL('../e2e/helpers/seed.ts', import.meta.url).href)`; `goto`; wait until `__wordcell.current().kind === 'active'` and `[data-testid="undo"]` is enabled; then CDP `Emulation.setCPUThrottlingRate { rate: 4 }`; Undo loop then Redo loop (each step one string `page.evaluate` → `{ sync: t1 − t0, frame: t2 − t0, disabled }`, cap 200 → fail), fail if counts differ, fail if the stored Session after the Redo walk is not deep-equal to session-won.json apart from `activeMs`; print step counts and, per figure, count/max/median (+ the sync figure's flag) and exit 0. Any setup/walk failure exits non-zero.
- [x] `scripts/measure-dispatch.test.mjs` -- `// @ts-check`, `AD-17`-named tests of `summarise`: `[]` throws; one sample; even count unsorted (`[4, 1, 3, 2]` → median 2.5); odd count > 1 (`[5, 1, 3]` → 3); `[16]` not flagged; `[16.01]` flagged.
- [x] Screenshot baselines -- `npm run test:screens -- --update-snapshots=all` (container), inspect both PNGs, then `npm run test:screens` green.
- [x] E8 run -- `npm run build:test`, then `node scripts/measure-dispatch.mjs`; record in Implementation Notes: `git rev-parse HEAD` + "uncommitted working tree", the Undo/Redo step counts, sync and double-rAF max/median, and the flag.
- [x] Verification section; record outputs in Implementation Notes.

**Tests mapping (sentence → test):**
- R-73 saved after Undo, Redo, Confirm → `R-73 Undo, Redo and Confirm on session-place.json are each stored before the next action` (Confirm is `primary-action`, enabled in Place; after each click stored deep-equals `current().session` and differs from the pre-click value).
- R-74 New game fresh seed / R-73 new game saved / Q-29 → `R-74 R-73 game-over New game on session-gave-up.json stores a fresh Session at once`: `primary-action` reads `New game`, enabled; click; snapshot at once: stored deep-equals `current().session` and `{ version: <session-idle-fresh.json's version>, seed: <uint32>, moves: [], cursor: { index: 0, phase: 'idle' }, gaveUp: false, activeMs: 0 }` (seed checked for range only); `wordcell:history` still `null`; then `primary-action` reads `Validate`, disabled.
- AD-3 label per phase → one `AD-3 primary-action on <fixture> reads <label> …` test per ticket row (idle-fresh, idle-pending-draft, composing-draft-2-letters then Undo, composing, place, gave-up, won), asserting text and enabled/disabled.
- AD-4 shell Vitest: newGame from active (seed stub 7, stored seed 7, fresh shape, bytes replaced, only `wordcell:session` written, written before return) and from rejected (same + `loaded()` still the launch result); replay (same fresh shape with the old seed); newGame while booting, replay while booting and while rejected → throw and no write; throwing write for newGame from active, from rejected and replay → rethrows, stored bytes unchanged; discarded take for newGame (active, rejected) and replay; feedback: set on failed Validate (exact lowercase spelling), kept on paused no-op, kept on accrue-only no-op (write happened, `changed:false`), cleared on a changed dispatch (Undo), on newGame, on replay (`game.feedback` `toEqual({})` and no `rejectedWord` key).
- AD-17 `summarise` cases (scripts test).
- Exempt: none beyond rows the rule-coverage file assigns to other entries.

**Acceptance Criteria:**
- Given the finished change, when `npm run test:all` runs, then it exits 0 and the unit suite stays under 5 s.
- Given the container, when `npm run test:screens` runs against the regenerated baselines, then it exits 0.
- Given a fresh `npm run build:test`, when `node scripts/measure-dispatch.mjs` runs, then it exits 0 with equal Undo/Redo counts and this plan records both figures' max and median, their definitions, the commit, and whether the synchronous max exceeds 16 ms.

## Implementation Notes

- Unit suite (`npx vitest run`): before 4.17 s (1466 tests); after 4.53 s in `test:all` (1490 tests).
- `npm run test:all`: exit 0 (lint, check, 1490 unit, build 482417 / 600000 B, dist-smoke 13 passed, e2e 49 passed / 39 skipped (android-only specs on desktop), pwa 12 passed).
- Screenshots: `npm run test:screens -- --update-snapshots=all` regenerated only the android PNG (full-width disabled `Validate` pill below the WordCells); the desktop 1280×720 viewport crops above the button, so its baseline is byte-identical. `npm run test:screens`: 2 passed.
- E8 (`npm run build:test && node scripts/measure-dispatch.mjs`), commit `d7df29cca7d9db946e4506e203a80ddf29496d6d` + uncommitted working tree, Chromium 153.0.8010.12, Pixel 7, CPU throttling rate 4, session-won.json: Undo steps 24, Redo steps 24 (48 samples per figure), stored Session after the Redo walk equals the fixture apart from `activeMs`.
  - sync (t1 − t0 around `button.click()`): max 10.40 ms, median 1.10 ms, flagged false (max ≤ 16 ms).
  - frame (t0 to the second nested rAF callback): max 41.20 ms, median 31.40 ms (no flag).
  - An earlier run on the same build gave sync max 6.50 / median 1.20, frame max 38.50 / median 31.50. Lower bound: predates entry 7's history reconcile (Design Notes 9).
- `node scripts/measure-dispatch.mjs` without `dist-test/` exits 1 with the `run npm run build:test first` message.
- `git diff --stat src/engine fixtures`: empty.
- Deviations: the primary action is one `<button>` with a `$derived` `{ label, onclick }`; `disabled` is `onclick === undefined`, which in Place equals `!board.canConfirm`. Feedback tests register `vi.doMock` in the describe's `beforeAll` (before every `setup()`), `vi.doUnmock` in its `afterAll`.
- E8 re-run after the review patches, on commit `2e537053acede3ed318a13b066a7f09e0b4be883` (clean tree, `npm run build:test` right before), Node 24.1.0, Chromium 153.0.8010.12, Pixel 7, CPU throttling rate 4, session-won.json: Undo steps 24, Redo steps 24 (48 samples per figure); walk-end Session equals the fixture apart from `activeMs`. **Recorded figures:** sync max 6.00 ms, median 1.00 ms, flagged false; frame max 40.50 ms, median 31.60 ms. Lower bound (predates entry 7's history reconcile). Definitions: sync = `performance.now()` after `button.click()` minus before (dispatch's own take, accrue, apply replay, status `view` calls and storage write); frame = same t0 to the second nested rAF callback (adds the render's `$derived` view, Svelte's DOM update and one frame). Sync max varies run to run (6.00–10.40 ms across three runs); never over 16 ms.
- Correction 2026-10-01 (3.12): Tests mapping, R-74 row: the built `R-74 R-73 game-over New game …` test seeds history-three-records.json and asserts its `wordcell:history` bytes unchanged (Q-29); it does not assert `null`.
- Correction 2026-10-01 (3.12): Tasks and Design Notes describe pre-patch code: `feedback` is `$state.raw` (not `$state`); `Need 3+ letters` shows when `structural.ok === false` with `reason === 'too-short'` (not on `ok === false` alone); the E8 sync figure excludes the render's `$derived` view, which falls in the frame figure (scripts/measure-dispatch.mjs header).
- Correction 2026-10-01 (3.12): the `R-74 R-73` e2e New game range-checks the seed only, so it would also pass if New game reused the old seed; the fresh-vs-old distinction rests on the AD-4 seed-stub shell Vitest ('AD-4 newGame() from active stores createSession(newSeed()) before it returns'), which is not R-id coverage.

## Plan Change Log

## Review Triage Log

### 2026-09-30 — Review pass
- verdicts: 24 findings — high 0, medium 0, low 17, false 7, maybe-false 0
- findings:
  - `[low]` `[patch]` blind-hunter: `sync` definition claims "replay in apply/view" though the render's `$derived` view runs after the handler — script header now says sync covers dispatch's own apply/view calls and the render recomputation falls in `frame`.
  - `[low]` `[patch]` blind-hunter: `fresh()` built the Session before `clock.take`, against AD-4's stated order — `fresh(seed)` now takes, then `createSession`, then enters active, then writes.
  - `[low]` `[patch]` blind-hunter: "touches no other key" checks could not detect a history/prefs write or removal — Vitest pre-sets `wordcell:history`/`wordcell:prefs` sentinels and asserts them unchanged; the `R-74 R-73` e2e seeds `history-three-records.json` and asserts its bytes unchanged (Q-29).
  - `[low]` `[patch]` blind-hunter: wrong-state tests used bare `toThrow()` — now assert the store messages.
  - `[low]` `[patch]` blind-hunter: unreachable `board === undefined` default in `primary` (rule 6) — now throws.
  - `[low]` `[patch]` blind-hunter: `reason` styling keyed on comparing label text — explicit `reason` field in the derived object.
  - `[low]` `[patch]` blind-hunter: `feedback` was a deep `$state` proxy, mutable through `game.feedback` — now `$state.raw`.
  - `[low]` `[patch]` blind-hunter: `exited` promise left pending after the race, so a mid-walk preview exit would reject unhandled and skip `finally` — `exited.catch(() => {})` after the race. SIGINT browser close / SIGTERM rejected: Playwright's browser dies with its parent process.
  - `[low]` `[reject]` blind-hunter: no Node ≥ 22.18 check — host-only script, the dev machine runs Node 24, the header states the requirement; a version guard adds a branch for an unlikely case.
  - `[low]` `[reject]` blind-hunter: no warm-up step, so max includes the cold first click — the ticket fixes the method (every step pooled); the cold click is a real dispatch; three runs recorded (sync max 6.00–10.40 ms) show the spread.
  - `[false]` `[reject]` blind-hunter: plan bookkeeping incomplete (status in-review, empty triage log) — the review step was in progress; status and logs are written by this step, and deviations are in Implementation Notes.
  - `[low]` `[reject]` edge-case-hunter: a foreign server on port 4174 could answer before `--strictPort` makes vite exit — unlikely on the host (4174 is reserved for this script) and the fix adds a pre-check branch.
  - `[low]` `[reject]` edge-case-hunter: spawn ENOENT surfaces as a raw unhandled `error` event — it still fails loudly and non-zero (rule 6); `node_modules/.bin/vite` exists after `npm ci`.
  - `[low]` `[patch]` edge-case-hunter: take/createSession order — same root cause as the blind-hunter order row; same patch.
  - `[false]` `[reject]` intent-alignment: Replay has no player surface — the ticket scopes `replay()` to the store; rule-coverage R-74 Replay row assigns the UI to epic 6.
  - `[false]` `[reject]` intent-alignment: feedback exercised only under a mock — the ticket prescribes the `vi.doMock` tests; `words` stays undefined until entry 9; `beforeAll` registration precedes every dynamic import, as the AC requires.
  - `[low]` `[patch]` intent-alignment: AD-4 order not followed literally in `fresh()` — same root cause as the blind-hunter order row; same patch.
  - `[false]` `[reject]` intent-alignment: throwing write via `control.failWrites` instead of setup()'s `storage` option — the fake is setup()'s storage; same throwing `setItem`, all three cases covered (Design Notes 1).
  - `[false]` `[reject]` intent-alignment: desktop baseline does not show the button — both baselines were regenerated with `=all`; the 1280×720 viewport crops above it, so the desktop PNG is legitimately unchanged; `test:screens` green.
  - `[false]` `[reject]` intent-alignment: precedence untested with game-over in a non-Idle phase — unreachable: gave-up requires Idle (`ad7-gave-up-idle`) and a win ends on a commit in Idle.
  - `[low]` `[patch]` intent-alignment: `Need 3+ letters` checked only `ok === false`, not `reason: 'too-short'` — now checks the reason too.
  - `[false]` `[reject]` intent-alignment: fresh seed only range-checked in Playwright; rejected-root New game absent — the ticket says the seed is not compared; the rejected-root UI test is entry 5's (rule-coverage R-74 row), the store path is covered in Vitest.
  - `[low]` `[patch]` intent-alignment: unreachable defensive branch in `primary` — same root cause as the blind-hunter dead-branch row; same patch (now throws).
  - `[low]` `[patch]` intent-alignment: E8 "records the commit" met only as baseline + working tree — code committed first (`2e53705`), then `build:test` and the measured run on the clean tree; figures recorded against that commit.

## Design Notes

Review-log resolutions (technical defaults; none changes functionality, UX or gameplay). Open major: none (converged, 0 majors). Unapplied minors:
1. Throwing write covered for newGame from active, from rejected and replay (the fake's `failWrites`, which is setup()'s storage fake).
2. Throw cases also assert no write.
3. Label precedence: status ≠ playing → `New game` whatever the phase; otherwise by phase.
4. `rejectedWord` is the engine value verbatim (lowercase); uppercasing is text.ts's at render (entry 9); tests assert the exact value.
5. `feedback` is a getter on `game` (`game.feedback`).
6. `summarise` tests include unsorted even and odd > 1 counts.
7. E8 walk checks the stored Session after Redo against session-won.json minus `activeMs`.
8. The label and `R-74 R-73` assertions are interim; entry 9 rewrites them (comment in the spec).
9. The E8 figure predates entry 7's history reconcile; recorded as a lower bound.
10. Confirm is always enabled in Place (`canConfirm`, R-42); no disabled-Confirm label; the button still binds `disabled={!canConfirm}`.
11. `Need 3+ letters` ink-secondary has no visual check (disposable minimal board).
12. Pass 4: E8 waits for `active` and an enabled Undo before throttling; try/finally + SIGINT teardown; `words` is a plain `export let`; the e2e expected `version` comes from a valid fixture.

- E8 definitions: **sync** = `performance.now()` right after `button.click()` minus right before (the synchronous handler: take, accrue, replay in `apply`/`view`, storage write); **frame** = the same `t0` to the callback of a second nested `requestAnimationFrame` (includes Svelte's DOM update and one frame's render). Only sync carries the 16 ms flag.
- `newGame()`/`replay()` assign state before writing (AD-4 "enter active, then write"), unlike `dispatch`'s write-then-assign; after a throwing write the in-memory state is entry 5's halt, so tests assert only the stored bytes.

## Verification

**Commands:**
- `npx vitest run` -- all pass, Duration < 5 s (before/after recorded).
- `npm run test:all` -- exit 0.
- `npm run test:screens -- --update-snapshots=all` then `npm run test:screens` -- exit 0 (Docker); if Docker fails, stop and report, never skip.
- `npm run build:test && node scripts/measure-dispatch.mjs` -- exit 0; figures recorded.
- `git diff --stat src/engine fixtures` -- empty.

**Manual checks (if no CLI):**
- Both regenerated PNGs: previous board plus a full-width `Validate` button (disabled, ink-disabled on surface-raised) below the WordCells (desktop may crop it).

## Auto Run Result

- **Summary:** The AD-4 store gains `newGame()` (from active or rejected) and `replay()` (active only), both taking and discarding the clock ms, creating the Session, entering `active` with `feedback` cleared, then writing; `game.feedback` (`$state.raw`) holds the engine's `rejectedWord` from a failed Validate, kept on no-ops, cleared on changed dispatches, New game and Replay; `dispatch` passes `dictionary: words` (a new `export let` in `dictionary.svelte.ts`, undefined until entry 9). The minimal board has one `primary-action` button: `New game` when status ≠ playing, `Confirm` in Place, otherwise disabled `Need 3+ letters` (Composing, too short) or `Validate`, DESIGN.md primary styling. `src/ui/text.ts` holds the six labels. `scripts/measure-dispatch.mjs` measures E8; `summarise` is unit-tested.
- **Files:** `src/shell/game.svelte.ts` (newGame, replay, feedback, dictionary pass-through); `src/shell/dictionary.svelte.ts` (`words`); `src/ui/text.ts` (new, labels); `src/ui/App.svelte` (primary action, text labels); `src/shell/game.svelte.test.ts` (AD-4 newGame/replay/feedback tests); `e2e/game-store.spec.ts` (R-73 + Confirm, `R-74 R-73` New game, AD-3 labels); `scripts/measure-dispatch.mjs` + `.test.mjs` (E8); `e2e/placeholder.screens.spec.ts-snapshots/placeholder-board-android-linux.png` (regenerated).
- **E8 result:** sync max 6.00 ms, median 1.00 ms (not flagged, ≤ 16 ms); frame max 40.50 ms, median 31.60 ms; commit `2e537053acede3ed318a13b066a7f09e0b4be883`; lower bound before entry 7's history reconcile. No flag for the epic 7 device check.
- **Review-log items:** no open major (the loop converged); all 12 unapplied minors resolved in Design Notes and the code/tests.
- **Review:** 24 findings. 13 patch rows applied (all low; 10 distinct fixes: AD-4 order in `fresh`, `$state.raw` feedback, throwing dead branch, explicit `reason` flag, `too-short` reason check, sentinel keys + seeded history for Q-29, exact throw messages, handled `exited` rejection, sync-definition comment, E8 measured on a commit). Deferred: none. Rejected: 4 low (Node version guard, warm-up step, foreign server on 4174, raw ENOENT) and 7 false (see triage log).
- **Follow-up review recommended:** false (patched: high 0, medium 0, low 13).
- **Verification:** after the patches `npm run test:all` exit 0 (1490 unit tests, 4.53 s; dist-smoke 13, e2e 49 passed, pwa 12); `npm run test:screens` exit 0 (2 passed); `git diff --stat src/engine fixtures` empty; `npm run build:test && node scripts/measure-dispatch.mjs` exit 0 on commit 2e53705.
- **Residual risks:** unit suite at ~4.5 s against the 5 s AD-17 budget. The label and `R-74 R-73` assertions are interim until entry 9. The desktop screenshot does not show the primary button (viewport crop). The E8 sync max varies 6–10 ms between runs on the host; the device check in epic 7 remains the real measure.
