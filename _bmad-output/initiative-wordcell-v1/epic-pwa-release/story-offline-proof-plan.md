---
title: 'Offline proof'
type: 'feature'
ticket: '6'
created: '2026-10-30'
status: 'built'
baseline_revision: 'd4d58cf5b03042cecb8ffd846579622920979cb8'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 1
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-pwa-release/story-offline-proof.md'
  - '{project-root}/_bmad-output/specs/spec-epic-7-pwa-release/build-notes.md'
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** brief §6.8's offline criterion (CAP-4) is unproven: no test reloads the shipped build with the network off after a complete precache and then plays on.

**Approach:** One offline test per build, same name `AD-16 AD-17 offline after the precache is complete: a reload restores the game with no prompt, then deals and validates a word`: `e2e/pwa/offline.spec.ts` (`pwa`, `dist-test/`, hook reads) and an `F6 serviceWorkers allow` describe in `e2e/pwa/dist-smoke.spec.ts` (`dist/`, hook-free). Both share a new `e2e/helpers/offline.ts` (seed pin stub, flag and counter names; TAN compose; New game deal). The story file's Description and Acceptance Criteria are the rule text; this plan adds resolutions and locations.

## Boundaries & Constraints

**Always:** the story's step order (SPEC CAP-4 order: move, precache complete, offline reload, restore, no-prompt, deal, validate). Each offline test calls `test.setTimeout(60_000)` and attaches a `pageerror` collector before the first `goto`, asserted empty at the end. Setup (stub, `seedStorage`, precache wait) stays inside the test body. Both precache waits use a 15 s timeout. No fixed sleeps. Test names start with their ids (`AD-17` for helper self-tests).

**Never:** any `src/`, `playwright*.config.ts`, hook-key or ticket-file change; a file-level `test.use` in `dist-smoke.spec.ts` or changes to its existing tests; calling `precacheComplete()` after `setOffline(true)`; `context.route`/`page.route`; a touch helper replacing `tapAt` (review-log minor 4); `test.skip`/`test.fixme`; working around or fixing in `src/` a failure caused by production code (see Failure classification).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected | Error handling |
|---|---|---|---|
| Unarmed | stub installed, flag off, any `getRandomValues` call | original result, counter 0 | none |
| Armed, one-element `Uint32Array` | flag on | array holds `[1]`, same array returned, flag off, counter 1 | none |
| Armed, other array | flag on, `Uint8Array(4)` or `Uint32Array(2)` | passes through, stays armed, counter 0 | none |
| Offline reload | precache complete, network off | `reload()` response and the list response `fromServiceWorker()`; restored draft; no prompt | production failure → stop (below) |
| Deal | confirm `New game` with stub armed | seed 1, `moves: []`, cursor `{ index: 0, phase: 'idle' }`, tray `[]`, counter 1 | none |
| Validate | TAN composed again | `primary-action` reads `Confirm`; no prompt; `pwa`: `current().kind` `active` | production failure → stop |

</intent-contract>

## Code Map

- `e2e/pwa/update.spec.ts:17,25-31` -- file-level `test.use({ serviceWorkers: 'allow' })` with an F6 comment and the `TEST_TIMEOUT_MS` pattern to copy in `offline.spec.ts`.
- `e2e/pwa/test-hook.spec.ts:55-73` -- `precacheComplete()` `expect.poll` (15 s) and the `pageerror` collector pattern.
- `e2e/pwa/dist-smoke.spec.ts` -- every existing test file-level and unchanged; append the new `test.describe('F6 serviceWorkers allow', …)` at the end. Its local `errorsOf` also collects console errors: do not reuse it (console not checked offline); use a `pageerror`-only collector.
- `e2e/helpers/precache.ts` -- `readPrecacheManifest(request)` (online only) and `precacheMissing(page, urls)` for the `dist-smoke` poll.
- `e2e/helpers/restore.ts` -- `snapshot`, `sessionOf`, `booted`, `waitForDictionary`, `isList` (takes a `Request`).
- `e2e/restore.spec.ts:116-140` -- the AD-17 Reading state assertions to mirror on `pwa` (three `loaded()` fields vs `__wordcellBoot`, `loaded().session` vs `sessionOf(before)` with `activeMs` not smaller, the history/prefs loop over `before.present`).
- `e2e/helpers/selection.ts` -- `select(page, 3, 5)` (expects one History entry), `wcOf(page)`.
- `e2e/helpers/board.ts` -- `cards`, `centre`, `tapAt` (mouse click outside `android`), `glidesSettled`, `trayIds`.
- `e2e/helpers/live-region.ts` -- `expectNoPrompt(page)` (snapshot, no retry; rejects any `alertdialog`, so the AD-15 Halted surface too).
- `e2e/helpers/seed.ts` -- `seedStorage(page, { session }, { captureBoot: true })` on `pwa`; plain on `dist-smoke`; `fixture('session-idle-fresh.json')`.
- `e2e/helpers/blocking.ts` -- `stored(page, key)` for the stored `wordcell:session` on `dist-smoke`.
- `e2e/helpers/boot-calls.ts` -- shape to copy for an init-script helper: a `WeakMap<Page, …>` arm guard, source-only init function, window keys typed in `e2e/globals.d.ts`.
- `e2e/confirm.spec.ts:18-31` -- Menu button → `dialog` "Menu" → row "New game" → `dialog` "Start a new game?"; the confirm's `New game` button.
- `e2e/helpers.spec.ts` -- `AD-17` helper self-tests on the dev server (`android` only via its `beforeEach`); add one `describe('offline helpers')` at the end.
- `e2e/globals.d.ts` -- add the stub's two window keys beside `__wordcellBootCalls`.
- `src/shell/seed.ts` (`newSeed`: one-element `Uint32Array`), `src/shell/nav.ts:100` (launch id, also `newSeed`, called before arming) -- read-only.
- `playwright.pwa.config.ts` -- `pwa` runs every `e2e/pwa/` spec but `dist-smoke.spec.ts`; `dist-smoke`'s `testMatch` omits `offline.spec.ts`. No change.

## Tasks & Acceptance

**Execution:**
- [x] `e2e/helpers/offline.ts` -- new, hook-free (review-log minor 8): `pinNextSeed(page)` adds the init script (before the first `goto`; throws if called twice on a page): it stores `const original = crypto.getRandomValues.bind(crypto)` and replaces `crypto.getRandomValues` with a function that, while `window.__wordcellSeedArmed === true` and the argument is a `Uint32Array` of length 1, writes 1 into it, sets the flag false, increments `window.__wordcellSeedPins` and returns the array; otherwise it returns `original(array)`. It initialises `__wordcellSeedPins = 0` and the flag false per document. `armSeed(page)` sets the flag (throws unless `pinNextSeed` ran on the page); `seedPins(page)` reads the counter (throws if absent). `composeTan(page)`: `select(page, 3, 5)`, tap the centre of `cards(page, 6).last()` with `tapAt`, `glidesSettled`, click the button named `Flip` (exact), `glidesSettled`, `expect.poll(() => trayIds(page)).toEqual(TAN_TRAY)`. Export `TAN_TRAY = ['42', '0', '28m'] as const` (typed `readonly string[]`) and use it everywhere the TAN tray is asserted (both specs, `helpers.spec.ts`); no other copy of the literal. `dealNewGame(page)`: Menu → "New game" row; expect the dialog named `Start a new game?` (`exact: true`) visible; `armSeed`; click its `New game` button (exact); expect that dialog and the `Menu` dialog `toHaveCount(0)`; `glidesSettled`; `expect.poll(() => wcOf(page)).toBe(0)` (review-log minor 11, done always so the second `select()` sees one entry). -- story Start and Steps.
- [x] `e2e/globals.d.ts` -- `__wordcellSeedArmed?: boolean; __wordcellSeedPins?: number;` with a comment naming `e2e/helpers/offline.ts`.
- [x] `e2e/helpers.spec.ts` -- `describe('offline helpers')`, cases named `AD-17 …` on the dev page: (1) unarmed one-element calls pass through, counter 0, and the four draws are not all equal (a stub that writes a constant or skips the original fails it); (2) armed: one-element call gives `[1]`, same array returned, counter 1, a following call disarmed (counter stays 1); (3) armed: `Uint8Array(4)` and `Uint32Array(2)` pass through, still armed (a later one-element call pins, counter 1); (4) `composeTan` on `session-idle-fresh` reaches `TAN_TRAY`; (5) `dealNewGame` after `pinNextSeed` and `composeTan` on `session-idle-fresh`: both dialogs gone, `trayIds` `[]`, the stored `wordcell:session` (`stored`, `e2e/helpers/blocking.ts`) has `seed: 1` and `moves: []`, `seedPins` 1, `wcOf` 0. Seed through `openFixture`/`seedStorage` (seed 1).
- [x] `e2e/pwa/offline.spec.ts` -- new; file-level `test.use({ serviceWorkers: 'allow' })` with the F6 comment; one test, steps in Design Notes (`pwa`).
- [x] `e2e/pwa/dist-smoke.spec.ts` -- append `test.describe('F6 serviceWorkers allow', () => { test.use({ serviceWorkers: 'allow' }); … })` with an F6 comment saying the tests above leave the worker mode at Playwright's default (no `serviceWorkers` set; never claim they run `block`), this describe sets `allow` explicitly, and entry 7 adds its cases here; one test with the same name, steps in Design Notes (`dist-smoke`).

**Acceptance Criteria:**
- Given `npm run build:test`, when `npm run test:e2e:pwa` runs, then the `pwa` offline test, `precache.spec.ts` and every other `pwa` spec pass.
- Given `npm run build`, when `npm run test:e2e:dist` runs, then the `dist-smoke` offline test, `precache.spec.ts` (AD-8 one download) and every other `dist-smoke` spec pass.
- Given `npm run test:e2e`, when the `offline helpers` cases run on `android`, then each passes.
- Given the full suite, when `npm run test:all` runs, then it is green and `git diff --stat` against `baseline_revision` touches only the five files above and this plan.
- Given a run where a production-caused failure (Failure classification) appears, then the build stops `blocked` with the evidence, and nothing in `src/` or the test works around it.

## Design Notes

Shared steps (both builds), after `pinNextSeed` and seeding, `goto('/')`, 52 live cards:
1. `composeTan(page)` online (target draft TAN; review-log minor 6: not a fixture-equality assertion).
2. Precache wait (15 s). `pwa`: `expect.poll(() => page.evaluate(() => window.__wordcell?.precacheComplete()), { timeout: 15_000 }).toBe(true)` (minor 1); never called again. `dist-smoke`: `urls` from `readPrecacheManifest(request)`, then `expect.poll` (15 s) of one `page.evaluate`/`precacheMissing` pair returning `{ missing, active }` until `missing` is `[]` and `(await navigator.serviceWorker.getRegistration())?.active?.state === 'activated'`.
3. Before-state: `pwa` `snapshot(page)`; `dist-smoke` `trayIds(page)` and the stored session through a local `storedSession()` that throws a named error when `stored(page, 'wordcell:session')` is `null` (AGENTS rule 6), then `JSON.parse`.
4. `context.setOffline(true)`; `const [response, listResponse] = await Promise.all([page.reload(), page.waitForResponse((r) => isList(r.request()))])` (the list wait is created in the same call, so neither promise is left pending if the other rejects); assert `response?.fromServiceWorker()` and `listResponse.fromServiceWorker()` true. `fromServiceWorker()` suffices: precached URLs are served cache-first, so an offline hit is the precache (plan note from the review log).
5. Restore. `pwa` (minor 2: AD-17 Reading state plus its history/prefs clauses): `booted(page)`, `current().kind` `active`, `after = snapshot(page)`; three `loaded()` fields equal `JSON.parse` of `__wordcellBoot` (`null` for absent); `after.loaded.session` equals `{ ...sessionOf(before), activeMs: expect.any(Number) }` with `activeMs` not smaller; for `wordcell:history`/`wordcell:prefs` in `before.present`, `after.loaded.history` equals `before.current.history`, and `{ ...DEFAULTS.prefs, ...after.loaded.prefs }` equals `before.current.prefs` (as `e2e/restore.spec.ts:145-152`); then the `current()` clauses (AD-17 Reading state's last sentence, `e2e/restore.spec.ts:156-165`): `after.current.session` equals `{ ...after.loaded.session, activeMs: expect.any(Number) }` with `activeMs` not smaller, `after.current.history` equals `after.loaded.history ?? DEFAULTS.history`, and `after.current.prefs` equals `{ ...DEFAULTS.prefs, ...after.loaded.prefs }`. `DEFAULTS` is a local copy of `e2e/restore.spec.ts:60-63` with its mirror comment (`src/shell/prefs.svelte.ts` DEFAULTS, `src/shell/history.svelte.ts` EMPTY; change together); `restore.spec.ts` is not edited. With `session-idle-fresh` only the session is stored, so these defaults clauses are the history/prefs proof. Then `waitForDictionary(page, 'ready')`, `trayIds` `['42','0','28m']`, `primary-action` `Validate`. `dist-smoke` (minor 7: the DOM is the restore proof, named first): `primary-action` `toHaveText('Validate')` and `trayIds` equal to the before value; then the stored session (the old page's pagehide write, persistence) equals the before one except `activeMs`, not smaller.
6. `expectNoPrompt(page)` (entry 3's check, before the deal; on `dist-smoke` once `Validate` shows).
7. `dealNewGame(page)`. Deal proof (minor 5): `trayIds` `[]`; session `seed: 1`, `moves: []`, cursor `{ index: 0, phase: 'idle' }` (`pwa` `current().session`; `dist-smoke` `expect.poll` on the stored `wordcell:session`); then `seedPins(page)` is 1.
8. `composeTan(page)`, click `primary-action` (`Validate`), `expect(primary).toHaveText('Confirm')`, `glidesSettled`, `expectNoPrompt(page)`; `pwa`: `current().kind` `active`; both: page errors `[]`.

Review-log minors resolved: (1) step 2; (2) step 5; (3) the order bullet's sync claim reads "CAP-9 syncs the spine's AD-17 Projects line" only, brief §6.8 names the steps without a conflicting order (plan reading; the build never edits the ticket); (4) `tapAt` sends mouse clicks under `pwa`/`dist-smoke` (Pixel 7 project name is not `android`), accepted; (5) step 7; (6) step 1; (7) step 5; (8) `e2e/helpers/offline.ts`; (9) Failure classification; (10) the final `expectNoPrompt` assumes nothing opens in place phase after an accepted Validate (true today: the place phase shows no dialog); a future place-phase dialog would fail it and needs this step revisited; (11) `dealNewGame`'s `wcOf` poll.

Failure classification (story AC, minor 9): production-caused, stop the build `blocked` and report for a fix ticket: a `pageerror`; the AD-15 Halted surface (`alertdialog`, `current().kind` `halted`); `swState()` `failed`; the precache never complete within 15 s or a URL left missing (e.g. the `sw.ts` chunk, F17); the reload or list response not from the worker; the dictionary not `ready`/`Validate` offline; a restored session or tray differing; the pinned seed not 1. Test-caused (fix in the test): locators, waits, helper logic.

## Verification

**Commands:**
- `npx playwright test e2e/helpers.spec.ts --project android -g "offline helpers"` -- expected: all pass.
- `npm run build:test && PW_PREVIEW=dist-test npx playwright test -c playwright.pwa.config.ts e2e/pwa/offline.spec.ts --repeat-each 3` -- expected: 3 passed.
- `npm run build && PW_PREVIEW=dist npx playwright test -c playwright.pwa.config.ts e2e/pwa/dist-smoke.spec.ts -g offline --repeat-each 3` -- expected: 3 passed.
- `npm run lint && npm run check` -- expected: clean.
- `npm run test:all` -- expected: exit 0.

## Implementation Notes

Pass 1 (reverted at the review-pass-1 loopback; kept facts):

- The stub's signature is `<T extends Exclude<BufferSource, ArrayBuffer>>(array: T): T`, which matches TypeScript 6's `lib.dom` `Crypto.getRandomValues`. A plain `ArrayBufferView` bound failed `tsc -p tsconfig.e2e.json` because of `SharedArrayBuffer`.
- The `pwa` test also calls `booted(page)` before the first compose. It is an extra wait, not an extra assertion.
- Verified on 2026-10-31: the offline helper cases passed 4/4 on `android`, the `pwa` offline test passed 3/3 with `--repeat-each 3`, the `dist-smoke` offline test passed 3/3 with `--repeat-each 3`, and lint and check were clean. No production-caused failure was observed.

Pass 2 (after the review-pass-1 loopback):

- Re-applied `/tmp/wc-7.6-pass1-attempt.patch` to the baseline, then made only the Plan Change Log amendments: `TAN_TRAY` export used by `composeTan`, `offline.spec.ts` and `helpers.spec.ts`; the confirm locator `exact: true`; `Promise.all` for the reload and list response in both specs; the `dist-smoke` `storedSession()` throws a named error on an absent key; the `dist-smoke` describe comment states the default mode without claiming `block`; the `pwa` restore adds a local `DEFAULTS`, the `DEFAULTS.prefs`-based merge and the `current()` clauses; helper case (1) (and case (2)'s disarmed draws) assert the four draws are not all equal; new helper case (5) for `dealNewGame`, which first asserts the compose is stored (`moves` not `[]`) so the seed-1 `moves: []` read comes from the deal and not the seed-1 fixture.
- Verified on 2026-10-31: offline helper cases 5/5 on `android`; the `pwa` offline test 3/3 with `--repeat-each 3`; the `dist-smoke` offline test 3/3 with `--repeat-each 3`; `npm run lint` and `npm run check` clean; `npm run test:all` exit 0 (3733 unit, 24 `dist-smoke`, 1152 dev-server e2e, 32 `pwa`). No production-caused failure was observed.

Review pass 2 patches (same subagent):

- `e2e/helpers.spec.ts` case (5): the pre-deal `moves` read throws `wordcell:session is not stored` on an absent key.
- `e2e/helpers/offline.ts`: `TAN_TRAY` is `readonly string[]` without `as const`. The Tasks line's `as const` wording is superseded: the annotation widened it, so it had no effect.
- Verified on 2026-10-31 (`/tmp/wc-7.6-verify3.log`): every Verification command green, the same counts as pass 2.

## Plan Change Log

### 2026-10-31 — Review pass 1 (bad_plan loopback, iteration 1)
- **Trigger:** blind-hunter and intent-alignment: the `pwa` restore assertion was not AD-17 Reading state "in full" (story Restore assertion). It omitted the `current()` clauses, including "when a post-reload `loaded()` field is `null`, `current()` reports the in-memory defaults", which is the only history/prefs clause that applies to `session-idle-fresh`. The prefs merge used `before.current.prefs` as its base, which can't catch a dropped key. Also blind-hunter: no `helpers.spec.ts` case for `dealNewGame`.
- **Amended:** Design Notes step 5 (`pwa` `current()` clauses, `DEFAULTS`-based prefs merge, local `DEFAULTS` copy); task `e2e/helpers.spec.ts` case (5) `dealNewGame` and a stronger case (1). The pass's low patches are folded in: `TAN_TRAY` export, the confirm locator `exact: true`, step 3's null-safe `storedSession`, step 4's `Promise.all`, and the `dist-smoke` describe comment no longer claims `block`.
- **Known-bad state avoided:** a `pwa` restore check that passes when the restored store's `current()` differs from what was loaded, or when history/prefs defaults are wrong; a `{ ...expected, ...actual }` merge that hides dropped keys; a comment claiming `dist-smoke` runs `block` when nothing sets it.
- **KEEP:** everything else in the pass-1 code, saved at `/tmp/wc-7.6-pass1-attempt.patch` (applies cleanly to the baseline with `git apply`). Re-apply it, then make only the amendments above. Specifically keep: the stub signature `<T extends Exclude<BufferSource, ArrayBuffer>>(array: T): T` (TS 6 `lib.dom`; `ArrayBufferView` fails `npm run check`); the `WeakSet<Page>` guards; `booted(page)` before the first compose on `pwa`; `current().kind` `active` checked before `snapshot()` after the reload; the 15 s precache polls; `dealNewGame`'s `wcOf` poll; the `pageerror`-only collectors; the existing `dist-smoke` tests unchanged.

## Review Triage Log

### 2026-10-31 — Review pass
- verdicts: 19 findings — high 0, medium 3, low 11, false 5, maybe-false 0
- findings:
  - `[medium]` `[bad_plan]` blind-hunter: the `pwa` restore check omits restore.spec's `current()` clauses (session vs loaded, history/prefs vs loaded or defaults) — confirmed against `e2e/restore.spec.ts:156-165` and AD-17 Reading state's last sentence; the plan's step 5 list left them out. Amended: Design Notes step 5 adds the `current()` clauses and a local `DEFAULTS`.
  - `[medium]` `[bad_plan]` blind-hunter: the prefs clause merges onto `before.current.prefs`, so it can't catch dropped keys, and with `session-idle-fresh` the present-key branches never run — confirmed: only `wordcell:session` is seeded, and prefs are written only by a setter. Same root cause as above. Amended: step 5 uses a `DEFAULTS.prefs`-based merge, and the defaults clauses become the history/prefs proof.
  - `[low]` `[bad_plan]` blind-hunter: `e2e/helpers.spec.ts` has no case for the exported `dealNewGame` (AGENTS.md: helper modules have their tests in `helpers.spec.ts`) — confirmed; the plan's task listed no such case. Amended: task case (5). The guard-throw and reload-reset cases are not added: the offline specs exercise both paths (`armSeed` throws without a stub in the reloaded document; `seedPins` 1 after the reload).
  - `[low]` `[patch]` blind-hunter: the TAN tray literal is written three times — confirmed in `offline.ts`, `offline.spec.ts` and `helpers.spec.ts`. Moot this pass (bad_plan); folded into the amendment as the `TAN_TRAY` export.
  - `[low]` `[patch]` blind-hunter: `dist-smoke` `storedSession()` casts `JSON.parse('null')`, so an absent key surfaces as a TypeError retried inside `expect.poll` until timeout — confirmed. Moot this pass; folded into step 3 (throws a named error).
  - `[low]` `[patch]` blind-hunter: the `list` `waitForResponse` is left pending if `reload()` throws or the first assertion fails — confirmed for both specs. Moot this pass; folded into step 4 (`Promise.all`).
  - `[low]` `[patch]` blind-hunter: the unarmed pass-through case passes a stub that writes 0 or skips the original — confirmed: `some(v !== 1)` holds for zeros. Moot this pass; folded into task case (1) (draws not all equal).
  - `[low]` `[patch]` blind-hunter: the confirm dialog locator lacks `exact: true`, unlike its neighbours — confirmed. Moot this pass; folded into the `dealNewGame` task.
  - `[false]` `[reject]` blind-hunter: `dist-smoke` should assert `navigator.serviceWorker.controller` after the reload — a navigation response with `fromServiceWorker()` true was produced by the worker's fetch handler, and a client created from such a navigation is controlled. The ticket's review log already settled this ("subsumed by … `fromServiceWorker()` proof").
  - `[low]` `[reject]` edge-case-hunter: an offline list request that fails (`requestfailed`) makes `waitForResponse` time out generically — real, but it only affects how a production failure is diagnosed (the run still fails and stops the build). The fix adds a race branch, so it is rejected as low.
  - `[low]` `[patch]` edge-case-hunter: a pending list promise when `reload()` rejects — the same root cause as the `Promise.all` row above, and it shares that route.
  - `[low]` `[patch]` edge-case-hunter: an absent `wordcell:session` gives a TypeError retried in `expect.poll` — the same root cause as the `storedSession` row above, and it shares that route.
  - `[low]` `[reject]` edge-case-hunter: a missed tap-drop surfaces as a Flip click timeout — real, but it only affects diagnosis, and `composeTan`'s final poll and the helper case already localise it. The fix adds guards, so it is rejected as low.
  - `[low]` `[patch]` verification-gap (other): the `dist-smoke` describe comment says the tests above keep the default "`block`, no worker", but no config or spec sets `serviceWorkers: 'block'` (grep of `playwright*.ts` and `e2e/`), so they run Playwright's default `allow` — confirmed. Moot this pass; folded into the `dist-smoke` task (the comment states the actual mode).
  - `[medium]` `[bad_plan]` intent-alignment: the restore assertion is not "in full"; the null-to-defaults clause, the one that applies to this fixture, is omitted — the same root cause as the first row, with the same amendment.
  - `[false]` `[reject]` intent-alignment: extra assertions (`wcOf` 0, `current().kind` after `booted`) — these tighten the test and do not loosen it, so there is no bad outcome.
  - `[false]` `[reject]` intent-alignment: "cards 42 and 0 back in columns" is checked only by `trayIds` `[]` — the ticket's review-log minor 5 settled `moves: []` with seed 1 as the deal proof, and that is asserted.
  - `[false]` `[reject]` intent-alignment: the stub's own cases run on the dev server, not on the builds — intended (helper self-tests live in `helpers.spec.ts`), and the builds prove the stub through seed 1 and a pin count of 1.
  - `[false]` `[reject]` intent-alignment: the diff contains no evidence of the acceptance runs — refuted by the step-03 verification log (`/tmp/wc-7.6-verify.log`, `VERIFY_EXIT_0`: 4/3/3 targeted passes; `test:all` 3733 unit, 24 + 1151 + 32 e2e passed).

### 2026-10-31 — Review pass
- verdicts: 16 findings — high 0, medium 0, low 7, false 9, maybe-false 0
- findings:
  - `[low]` `[reject]` blind-hunter: the `pwa` test never polls `swState()`, so a late registration failure could land after the test passes — real only in theory: the boot tail registers after the dictionary load, which the test awaits before several seconds of deal, compose and Validate; a halt by then fails the final `current().kind` `active` and `expectNoPrompt`. The fix adds a poll, not a direct correction, so it is rejected as low.
  - `[false]` `[reject]` blind-hunter: nothing proves `setOffline` cuts the worker's network, so the proof could pass with the emulation silently off — refuted by experiment: on `dist-test/` (vite preview, `serviceWorkers: 'allow'`, controlled page) a non-precached `fetch` resolved 200 online and was rejected (`Failed to fetch`) after `context.setOffline(true)`, so worker-routed network requests are cut.
  - `[low]` `[reject]` blind-hunter: the restore block and `DEFAULTS` are a third "change together" copy (`restore.spec.ts`, `prefs.spec.ts`) — real, but the copy is deliberate (pass-1 amendment: `restore.spec.ts` is outside the allowed files) and carries the mirror comment. The fix is a cross-spec refactor, not a direct correction, so it is rejected as low.
  - `[low]` `[patch]` blind-hunter: `helpers.spec.ts` case 5 reads `JSON.parse(stored(...) ?? 'null').moves`, an unnamed TypeError on an absent key — confirmed. Fixed: a named-error null check, as the poll below it does.
  - `[low]` `[reject]` blind-hunter: the guard throws and the per-document reset have no helper cases, and pass 1's triage reason was wrong — confirmed that the specs take only the success branches (pass 1's row overstated it); the reset is shown only for the counter (`seedPins` 1 on the dealing document). Developers rarely meet these throws, and the fix adds test cases, not a direct correction, so it is rejected as low.
  - `[low]` `[reject]` blind-hunter: the offline steps and timeout constants are duplicated between the two builds' tests — real (inline `60_000`/`15_000` on `dist-smoke` vs named constants on `pwa`), but each value matches the plan and the fix is a shared-helper refactor, so it is rejected as low.
  - `[false]` `[reject]` blind-hunter: `dealNewGame` does not check that the arm was consumed — every caller (both specs and helper case 5) asserts `seedPins` 1 right after it, which proves consumption.
  - `[low]` `[patch]` blind-hunter: `TAN_TRAY` has both a `readonly string[]` annotation and `as const` — confirmed; the annotation widens it. Fixed: dropped `as const`.
  - `[false]` `[reject]` blind-hunter: `composeTan` does not assert its starting board — its second call follows the asserted `seed: 1`, `moves: []` and `seedPins` 1, so a wrong deal fails there with a clear message first.
  - `[low]` `[reject]` edge-case-hunter: `tapAt` sends mouse events under `pwa`/`dist-smoke` (Pixel 7), not touch — the intent-contract's Never excludes replacing `tapAt` (review-log minor 4, accepted), and the offline proof is about the network, not the touch path.
  - `[false]` `[reject]` intent-alignment: `Promise.all([page.reload(), page.waitForResponse(...)])` calls `reload()` first in source order — both promises are created synchronously in one expression, before any response event can be delivered, so the wait is armed in time.
  - `[false]` `[reject]` intent-alignment: on `dist-smoke` the tray is compared with the before value, not the literal — the before value is asserted to equal `TAN_TRAY` inside `composeTan`, so the check holds.
  - `[false]` `[reject]` intent-alignment: extra settle conditions (`wcOf` 0, early `current().kind`) — these tighten the test, and nothing required is dropped.
  - `[false]` `[reject]` intent-alignment: the history/prefs clauses take the generic reading, without `restore.spec.ts`'s fixture-specific extras — those extras are for fixtures with stored history (`history-three-records`); `session-idle-fresh` has none.
  - `[false]` `[reject]` intent-alignment: the helper cases run on the dev server, not the builds — intended; the builds prove the stub through seed 1 and a pin count of 1.
  - `[false]` `[reject]` intent-alignment: no run evidence in the diff — refuted: verification pass 2 (`/tmp/wc-7.6-verify2.log`, `VERIFY_EXIT_0`) ran every Verification command green.

## Auto Run Result

**Summary.** CAP-4's offline proof (brief §6.8) now runs on both production builds. After a move online and a complete precache, the test turns the network off, reloads, checks the game is restored with no prompt, then deals a seed-1 game (New game seed pinned by a test-only `crypto.getRandomValues` init-script stub) and validates TAN. One test with the same name runs on each build: `e2e/pwa/offline.spec.ts` (`pwa`, `dist-test/`, the full AD-17 Reading state restore check, including the `current()` defaults clauses) and an `F6 serviceWorkers allow` describe in `e2e/pwa/dist-smoke.spec.ts` (`dist/`, hook-free, Cache Storage poll). Test-only: no `src/`, config or hook-key change.

**Files changed:**
- `e2e/helpers/offline.ts` (new): `pinNextSeed`/`armSeed`/`seedPins` (the seed stub), `composeTan`, `dealNewGame`, `TAN_TRAY`.
- `e2e/globals.d.ts`: types for `__wordcellSeedArmed` and `__wordcellSeedPins`.
- `e2e/helpers.spec.ts`: five `AD-17` `offline helpers` cases (stub pass-through, pin and disarm, other arrays, `composeTan`, `dealNewGame`).
- `e2e/pwa/offline.spec.ts` (new): the `pwa` offline proof.
- `e2e/pwa/dist-smoke.spec.ts`: the `F6 serviceWorkers allow` describe holding the `dist-smoke` offline proof; the existing tests are unchanged.

**Review findings.** Thorough set (blind-hunter, edge-case-hunter, verification-gap, intent-alignment), two passes.
- Pass 1 (19 findings): one bad_plan loopback (iteration 1) for the incomplete `pwa` restore check (3 medium rows: the `current()`/defaults clauses were missing and the prefs merge was weak) and the missing `dealNewGame` helper case (low). Seven low patch-type rows were folded into the amendment. Rejected: two low rows (an offline `requestfailed` race and the tap-drop diagnosis) because the fix adds branches for a diagnosis-only gain; five false rows (the controller check, already covered by `fromServiceWorker()`; the extra settle checks; the deal-proof wording; helper cases on the dev server; run evidence).
- Pass 2 (16 findings): 2 low patches applied (the named null check in helper case 5, the redundant `as const`). Five low rows were rejected:
  - `swState` poll: theoretical race, already caught by the final `current().kind` and no-prompt checks.
  - `DEFAULTS` third copy: deliberate (`restore.spec.ts` is outside the allowed files) and carries the mirror comment.
  - Guard-throw and reset cases: rarely met, and the fix adds tests.
  - Duplicated steps and constants across the builds: values match the plan; the fix is a refactor.
  - `tapAt` mouse path: excluded by the intent-contract's Never (minor 4).
- Pass 2 also had nine false rows. One of them, "setOffline may not cut the worker's network", was refuted by experiment: on a controlled `dist-test/` page a non-precached `fetch` returned 200 online and was rejected offline. Nothing deferred.
- Patched counts by verdict: high 0, medium 0, low 2. Follow-up review recommended: false.

**Verification.** The plan's Verification commands passed three times (pass 1, after the loopback, after the patches), the last in `/tmp/wc-7.6-verify3.log`:
- offline helpers: 5/5 on `android`
- `pwa` offline: 3/3 with `--repeat-each 3`
- `dist-smoke` offline: 3/3 with `--repeat-each 3`
- lint and check: clean
- `npm run test:all`: exit 0 (3733 unit; 24 `dist-smoke`, 1152 dev-server and 32 `pwa` Playwright tests; `precache.spec.ts` included)

Matrix audit: every I/O row is covered by a test that ran and passed. No production-caused failure was observed.

**Residual risks.**
- The final `expectNoPrompt` assumes no dialog opens in the place phase (review-log minor 10).
- `DEFAULTS` is mirrored in three e2e specs; change them together with `src/shell/prefs.svelte.ts`/`history.svelte.ts`.
- SPEC F6 and the build-notes describe `block` specs in `dist-smoke.spec.ts`, but nothing sets `serviceWorkers: 'block'`, so the existing `dist-smoke` tests run Playwright's default `allow` (spec-text mismatch, for CAP-9's doc sync; the new comment states the actual mode).
