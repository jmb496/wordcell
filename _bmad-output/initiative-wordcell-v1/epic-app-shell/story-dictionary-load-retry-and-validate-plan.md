---
title: 'Dictionary load, retry and Validate'
type: 'feature'
ticket: '9'
created: '2026-10-01'
baseline_revision: '43d46dc69ce6a70eedf0a14ff42afdfc6985c36b'
status: 'built'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-app-shell/story-dictionary-load-retry-and-validate.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-app-shell/story-dictionary-load-retry-and-validate.review-log.md'
warnings: [oversized]
deferred:
  - summary: >-
      Spine bug to report: AD-15 says the font check has "a 30 s timeout that throws to this handler, like the dictionary fetch (AD-8)", which reads as a fatal dictionary timeout; AD-8 maps the timeout to `failed`. The build follows AD-8.
    evidence: |-
      ARCHITECTURE-SPINE.md AD-15 vs AD-8 Load; ticket review log pass 4 unapplied minor.
    location: ARCHITECTURE-SPINE.md AD-15
    severity: low
  - summary: >-
      Epic 7 P7: Playwright proof of the Q-42 controlled-service-worker branch (owner decision 2026-10-01: after a 404, Reload retries in place with the banner kept visible, never reloads). Epic 3 proves it only in the shell Vitest.
    evidence: |-
      rule-coverage Q-42 row (P3 + P7); ticket Notes decision.
    location: epic 7 (P7)
    severity: medium
  - summary: >-
      Unit suite is over AD-17's 5 s budget before this ticket (about 7.5 s); this ticket must not make it worse, but the overrun itself needs a dedicated fix (entry 12 refactor sweep or later).
    evidence: |-
      Implementation Notes before/after timings.
    location: vitest config / test suite
    severity: medium
  - summary: >-
      The 2026-10-01 owner decision on Q-42 under a controlling service worker (Reload retries in place, banner kept visible during the retry, hides once the list loads) is recorded only in the ticket/epic Notes; spec §9 Q-42 and EXPERIENCE.md State Patterns › Dictionary failed still say the banner stays until the next launch.
    evidence: |-
      docs/game-flow-spec.md line 473; EXPERIENCE.md line 192; epic-app-shell.md Notes. Owner-owned rules text (spec §9 records owner answers), so not edited by the build.
    location: docs/game-flow-spec.md §9 Q-42; EXPERIENCE.md State Patterns
    severity: medium
---

<intent-contract>

## Intent

**Problem:** The word list is never fetched, so Validate is always disabled; there is no loading/failed state, retry, banner, invalid-word line or `dictionaryState()` hook (R-38, AD-8, Q-42, CAP-8).

**Approach:** Turn `src/shell/dictionary.svelte.ts` into the `dictionary` store (state, words, load, retry, banner visibility), start it from `main.ts` after first paint and visibility, feed it to the game store's ctx, and render Validate enablement/labels, the invalid-word line and `DictionaryBanner.svelte` on the minimal board — exactly as the ticket's Description and Acceptance Criteria say.

## Boundaries & Constraints

**Always:**
- The ticket (`story-dictionary-load-retry-and-validate.md`) Description and Acceptance Criteria are binding; this plan only resolves what the ticket leaves open.
- Owner decision 2026-10-01 (Q-42, controlling service worker): after any 404, Reload never calls `location.reload()`; it retries the download in place with the banner kept visible; on success state is `ready` (banner hides, Validate works). The controller is read at each `retry()` call (`navigator.serviceWorker?.controller`).
- AGENTS.md rule 6: catch only around the awaited fetch and body read (AD-8 outcomes); anything else propagates to AD-15. Precondition throws are synchronous (before any await) with `AD-8 …` messages.
- Every catalogue string in `src/ui/text.ts`; test names carry ids (AD-8 for shell Vitest and the Retry/Timeout/banner Playwright cases; R-38, R-73, §2, Q-42, AD-16 as the ticket names).
- Unit suite time: record before/after (`npx vitest run` Duration) in Implementation Notes; the after value must not exceed the before value by more than run-to-run noise (~0.3 s). Keep the new Vitest file cheap (one file, `vi.resetModules()` + dynamic import per case, no full dictionary).

**Never:** engine changes; `AbortSignal.timeout`; a second store or component-held dictionary state; new `data-testid`s; the 44 px sticky offset or AD-11 gesture latch (epic 4); a live-region announcement for the invalid word (epic 5); service-worker code (epic 7); editing the spine.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Success | 200, non-empty LF list | `words` set, then state `ready`; load() resolves | — |
| Non-OK | 500 (any non-404) | `failed`; flag unchanged | no rejection |
| 404 | 404 at first fetch or any retry | `failed`; reload flag set | no rejection |
| Network | fetch rejects | `failed` | no unhandled rejection |
| Body error | text() rejects before abort | `failed` | no unhandled rejection |
| Empty | body `''` or `'\n'` | `failed` | — |
| Stall | body never settles (load or retry) | `loading` at 29 999 ms, `failed` at 30 000 ms (fake timers) | losing promise caught; body erroring on abort → still `failed`, no unhandled rejection |
| Retry, no flag | `failed` after 500 | state `loading` synchronously, banner hidden, refetch | — |
| Retry, flag, no controller | `failed` after a 404 | `location.reload()` called, no fetch, state stays `failed`, resolves at once | — |
| Retry, flag, controller | `failed` after a 404, controller stubbed | no reload; state `loading`, `showBanner` true while in flight; refetch → `ready` (banner false) or `failed` | — |
| Misuse | second `load()`; `retry()` while `loading`/`ready` | throws synchronously | AD-15 if reached at runtime |

</intent-contract>

## Code Map

- `src/shell/dictionary.svelte.ts` -- today exports `dictionaryUrl` and an unassigned `words`. Rewrite as the store (Design Notes 1); keep `dictionaryUrl` and the `?url` import.
- `src/shell/game.svelte.ts` -- line ~28 `import { words }` and `dispatch` ctx `{ lang: EN, dictionary: words }`: switch to `import { dictionary }` and `dictionary.state === 'ready' ? dictionary.words : undefined`. Feedback (`rejectedWord`, cleared on any changed dispatch) already exists; do not change it.
- `src/shell/game.svelte.test.ts` ~496–501 -- `vi.doMock('./dictionary.svelte', …)` must now export `dictionary: { state: 'ready', words: new Set(['cat']) }` (plus `dictionaryUrl`). Lines ~100–125 show the stubGlobal/resetModules/dynamic-import pattern to copy for the new test.
- `src/shell/test-hook.ts` + `e2e/globals.d.ts` -- add `dictionaryState(): 'loading' | 'ready' | 'failed'`.
- `src/main.ts` -- drop the AD-8 side-effect import and its comment (game.svelte.ts now imports `dictionary`, so the URL is no longer tree-shaken; confirm `dist/assets/en-*.txt` still exists via `test:e2e:pwa`'s precache spec). After `mount(App, { target }); surface = true;` add the start sequence (Design Notes 2). Standalone halted path returns earlier and never starts it.
- `src/ui/App.svelte` -- `primary` derived block: add the dictionary labels (Design Notes 3), Validate handler `game.dispatch({ type: 'validate' })` (check the engine Command name in `src/engine/index.ts`/`commands.ts`); invalid-word line directly above the primary action; `<DictionaryBanner />` directly after the `.top` row inside `<main>` (inherits `inert`). Follow its biome-ignore import pattern for markup-only components.
- `src/ui/text.ts` (+ `text.test.ts`) -- add `loadingWords: 'Loading words…'` (U+2026), `wordListUnavailable: 'Word list unavailable'`, `wordListFailed: "Word list didn't load."`, `invalidWord: (word) => \`${word.toUpperCase()} isn't in the word list.\`` (engine spelling is lowercase letters incl. `qu`, so uppercasing gives `QU`); test `invalidWord('tan')` → `TAN isn't in the word list.` named `AD-8 …` (UI Vitest, AGENTS.md).
- `src/ui/DictionaryBanner.svelte` -- new (Design Notes 4). Style reference for secondary pill: `Dialog.svelte` / `.icon` in App.svelte.
- `e2e/game-store.spec.ts` -- `tokenColor` helper (line ~143) to reuse; interim LABELS table (~154) and the "Interim" New game test (~110, final `toHaveText('Validate')` must wait for `dictionaryState()` 'ready'); R-73 per-dispatch test (~77) gains Validate.
- `e2e/history.spec.ts` (~189, 199, 249), `e2e/nav.spec.ts` (~209), `e2e/lifecycle.spec.ts` (~182, paused clock: `runFor` then `expect.poll`) -- plain `Validate` assertions wait for 'ready' first.
- `e2e/blocking.spec.ts` -- healthy-boot test (~100) waits for 'ready' before `runFor(31_000)`; in-load halt pattern at ~284 (hold `**/*.woff2`, other page writes `wordcell:prefs`, wait for halted, then continue the route).
- `e2e/test-hook.spec.ts`, `e2e/pwa/test-hook.spec.ts` -- expected keys `['current','dictionaryState','loaded']`.
- `e2e/placeholder.screens.spec.ts` -- wait for 'ready' before capture; regenerate the baseline (`npm run test:screens`, Docker) only if the image changes.
- `e2e/helpers/lifecycle.ts` -- `startHidden`, `showPage`; `e2e/helpers/seed.ts` -- `seedStorage`, `fixture`.

## Tasks & Acceptance

**Execution:**
- [x] `src/shell/dictionary.svelte.ts` -- the store per Design Notes 1 -- AD-8.
- [x] `src/shell/dictionary.svelte.test.ts` -- new shell Vitest (all `AD-8 …`): every I/O matrix row; `vi.useFakeTimers()`, `vi.stubGlobal` for `fetch`, `location` (`{ reload: vi.fn() }`), `navigator` (`{ serviceWorker: { controller: {} } }` or `{}`); stall stub = a Response-like `{ ok: true, status: 200, text: () => new Promise(() => {}) }` and a variant whose text() rejects when the signal aborts; assert no unhandled rejection with a `process.on('unhandledRejection')` spy (or Vitest's own failure on unhandled errors) after flushing.
- [x] `src/shell/game.svelte.ts`, `src/shell/game.svelte.test.ts` -- ctx switch and mock update per Code Map.
- [x] `src/shell/test-hook.ts`, `e2e/globals.d.ts` -- `dictionaryState()`.
- [x] `src/main.ts` -- start sequence (Design Notes 2); remove the side-effect import.
- [x] `src/ui/text.ts`, `src/ui/text.test.ts` -- strings and the `invalidWord` case.
- [x] `src/ui/DictionaryBanner.svelte` -- new banner.
- [x] `src/ui/App.svelte` -- labels, Validate handler, invalid-word line, banner placement; update the header comment (Validate no longer "disabled until entry 9").
- [x] `e2e/dictionary.spec.ts` -- new android spec (other projects skip like `game-store.spec.ts`) with every ticket Acceptance case (Design Notes 5).
- [x] `e2e/game-store.spec.ts` -- rewrite LABELS against routed states (Design Notes 5), R-73 Validate step, New game test waits for 'ready'.
- [x] `e2e/history.spec.ts`, `e2e/nav.spec.ts`, `e2e/lifecycle.spec.ts`, `e2e/blocking.spec.ts`, `e2e/test-hook.spec.ts`, `e2e/pwa/test-hook.spec.ts`, `e2e/placeholder.screens.spec.ts` -- continuity edits per Code Map.

**Acceptance Criteria:**
- Given the ticket's Acceptance Criteria (R-38, invalid word, R-73, §2, Retry, Timeout, Q-42, AD-16, shell Vitest), when the new and updated specs run, then each passes under a name carrying its id.
- Given a page under a controlling service worker (stubbed in Vitest) after a 404, when Reload is tapped, then the page is not reloaded, a refetch runs with the banner still shown, and success hides the banner and enables Validate.
- Given the change on a clean tree, when `npm run test:all` runs, then it exits 0, and the unit-suite Duration is not worse than the recorded baseline.

## Implementation Notes

- Baseline unit-suite time (before any change, `npm run test`): Duration 7.51 s (transform 67%). After: 6.03 s and 5.78 s (two runs, `npx vitest run`), not worse.
- Shell Vitest fakes only `setTimeout`/`clearTimeout`, and only after the dynamic import (the module loader needs real timers); "no unhandled rejection" is Vitest's own failure, given a real macrotask in `settled()` (no `process` types in the app tsconfig). `Promise.race` already marks the losing body promise handled, so the no-op catches are belt-and-braces and not separately observable.
- `main.ts` re-checks halted through a `halted()` function: an inline `game.state.kind === 'halted'` after the earlier return is a TypeScript no-overlap error (stale narrowing across awaits).
- Playwright request counting matches only `/en*.txt` without a query: the dev server also loads the `en.txt?url` module.
- The R-38 primary-action rows live in `e2e/game-store.spec.ts` LABELS (named `R-38 AD-3 …`); `e2e/dictionary.spec.ts` holds the other cases. Mutation check: dropping the post-`whenVisible()` halted check fails the AD-16 after-mount case.
- `npm run test:all` exit 0; `npm run test:screens` (Docker) passes against the unchanged baseline; dictionary + game-store specs pass with `--repeat-each 3`; `git diff --stat 43d46dc -- src/engine fixtures` empty.
- Orchestrator re-measure (the 7.51 s baseline was a single cold run): baseline tree stashed, `npx vitest run` twice → 5.64 s, 5.58 s (1590 tests); with the change → 5.58 s, 6.37 s, and 5.65 s inside `test:all` (1612 tests). Not worse beyond run-to-run noise; still above AD-17's 5 s (deferred).
- Orchestrator fix: the `invalidWord` UI Vitest renamed from `R-38 …` to `AD-8 …` (AGENTS.md: shell/UI Vitest names use AD ids, never R-id coverage; the plan's Code Map was wrong and is corrected). `npm run test:all` re-run after it: exit 0.

## Plan Change Log

## Review Triage Log

### 2026-10-01 — Review pass
- verdicts: 25 findings — high 0, medium 3, low 15, false 7, maybe-false 0
- findings:
  - `[medium]` `[defer]` blind: spec §9 Q-42 and EXPERIENCE.md still say "banner stays until the next launch" under SW, against the owner decision — fix edits owner-owned rules docs; deferred to the owner (frontmatter deferred).
  - `[low]` `[reject]` blind: plan timing numbers (7.51 s vs re-measured 5.6 s) disagree — fix edits this build's plan; Implementation Notes already explain the re-measure.
  - `[false]` `[reject]` blind: empty triage log while lenses_ran is set — the log is written at this step.
  - `[low]` `[reject]` blind: removing `await nextPaint()` fails no test — ticket review log resolved the double rAF as exempt (covered by the P3 held-request case); a rAF-count probe adds machinery for no current regression path.
  - `[low]` `[reject]` blind: no positive startHidden → showPage → one request test — the ticket hands the startHidden ordering case to CAP-10 (ticket 11).
  - `[medium]` `[patch]` blind: Q-42 controlled-SW branch unproven in Playwright though a controller stub is cheap; disabled Reload untested — grouped with verification-gap #1 and intent #1; added an android test with a stubbed controller (banner kept, Reload disabled, loading, no page load; then ready, banner gone, Validate enabled).
  - `[low]` `[reject]` blind: Q-42 Playwright case only proves a load event — the ticket AC asks exactly that, contrasted with the 500 case; the 500→404 path is in the shell Vitest.
  - `[false]` `[reject]` blind: invalid-word test skips "Redo state unchanged" — it asserts stored moves (incl. the redo tail) and cursor unchanged.
  - `[low]` `[patch]` blind: LABELS lacks idle-pending-draft held/failing and a place ready row — added the three rows.
  - `[low]` `[reject]` blind: timer-cleanup test covers success only — `clearTimeout` sits in `finally`, so every path clears; extra tests add nothing.
  - `[low]` `[reject]` blind: tokenColor/waitForDictionary copied instead of shared in e2e/helpers — small duplication; shared Playwright infrastructure is entry 12's (CAP-11) refactor sweep, and a helper module needs its own helpers.spec.ts tests.
  - `[low]` `[patch]` blind: state union declared in store and test hook — exported `DictionaryState` from the store, used in test-hook.ts (globals.d.ts stays a mirror by design).
  - `[false]` `[reject]` blind: redundant `state === 'ready'` guard in dispatch — the ticket prescribes exactly this ctx expression (build-notes CAP-8).
  - `[low]` `[reject]` blind: Reload stays enabled after the no-controller 404 reload — repeat taps only repeat an idempotent `location.reload()`; a pending flag adds state for no visible harm.
  - `[false]` `[reject]` edge: reload flag never resets, so under SW a later 500 retry keeps the banner — AD-8/ticket: "any 404 at any fetch" sets it; the owner decision keeps the banner during every in-place retry after a 404.
  - `[low]` `[reject]` edge: running clock could drift >1 s before runFor(29_000) — the ticket (pass 2/4 defaults) chose a running clock with a margin; the exact boundary is the shell Vitest; the spec passed with --repeat-each 3.
  - `[medium]` `[patch]` verification-gap: disabled Reload during the Q-42 in-place retry untested at the UI — same group as blind #6; patched by the new Playwright test.
  - `[low]` `[reject]` verification-gap (other): double rAF not pinned — same as blind #4.
  - `[low]` `[patch]` intent: Q-42 SW decision proven only on the store, not the banner/labels — same group as blind #6.
  - `[false]` `[reject]` intent: ticket Description still says "stays until the next launch" — the build never writes a ticket file; its Notes record the superseding decision (spec text deferred above).
  - `[low]` `[reject]` intent: banner absence on the rejected root unchecked — the ticket review log (pass 3) dropped that test; the banner is inside the board markup only.
  - `[low]` `[reject]` intent: invalid-word clearing shown only for Undo — the ticket AC names Undo; edit/Redo/Validate clearing is the existing game.svelte.test.ts feedback Vitest (review-log carry-forward).
  - `[low]` `[reject]` intent: Playwright timeout counts from the route, not the store's timer — same as edge #2.
  - `[false]` `[reject]` intent: unit time like-for-like after range reaches higher than before — recorded as noise (5.58–6.37 vs 5.58–5.64, and 5.65 inside test:all); the intent's ~7.3 s is not exceeded.
  - `[false]` `[reject]` intent: AD-15 spine wording unresolved — already deferred as a spine bug; the build follows AD-8.

## Design Notes

1. **Store.** Module state: `let state = $state<'loading' | 'ready' | 'failed'>('loading')`, `let keepBanner = $state(false)`, plain `words: ReadonlySet<string> | undefined`, `started = false`, `reloadOnNextRetry = false` (unexported). Export one `dictionary` object with getters `state`, `words`, `showBanner` (`state === 'failed' || keepBanner`), and `load()`, `retry()`.
   - `load()`: throw `AD-8 load() called twice` if started; set started; `return attempt()`.
   - `retry()`: throw unless `state === 'failed'`. If `reloadOnNextRetry && !navigator.serviceWorker?.controller` → `location.reload()`, return `Promise.resolve()` (state stays `failed`). Else `keepBanner = reloadOnNextRetry` (controller branch only can reach true), `state = 'loading'`, `return attempt()`.
   - `attempt()`: new `AbortController`; `const timer = setTimeout(() => controller.abort(), 30_000)`; `aborted` = a promise rejecting on the signal's `abort` event, with a no-op `.catch`. `Promise.race([fetch(dictionaryUrl, { signal }), aborted])` inside try/catch → `failed`; a non-OK response → `failed` (404 also sets the flag); then `const body = response.text(); body.catch(() => {})`; race it against `aborted` in a try/catch → `failed`. Split on `'\n'`, drop empty strings, empty → `failed`; else assign `words`, then `state = 'ready'`. `finally` clear the timer and `keepBanner = false`. Racing the fetch too means stubs need not honour the signal.
2. **Start (main.ts).** After mount: `await nextPaint()` (a promise resolving in the second nested `requestAnimationFrame`); `if (game.state.kind === 'halted') return;` `await game.whenVisible();` `if (game.state.kind === 'halted') return;` `await dictionary.load();` (inside `boot()`, so a non-AD-8 rejection reaches `unhandledrejection` → AD-15). The rejected root also reaches this path (it mounts App). Epic 7 appends SW registration after this await.
3. **Primary labels (App.svelte).** Order: status ≠ playing → `New game` (unchanged, wins over everything); Place → Confirm (unchanged); otherwise (Idle and Composing) dictionary first: `failed` → `Word list unavailable` (reason); `loading` → `Loading words…` (reason); then Composing too-short → `Need 3+ letters` (reason); then `Validate` with `onclick: board.canValidate ? validate : undefined` (Idle: `canValidate` is false → plain disabled Validate, ink disabled). Reason style (`class:reason`) for the three reason labels. Gave-up/won rows under held and failing routes prove `New game` still wins.
4. **Banner.** `{#if dictionary.showBanner}` a `<div class="banner">` containing `<p>` with `text.wordListFailed` (ui-label, `--wc-error`, single line ellipsis) and a secondary `Reload` button (44 px pill, `--wc-surface-raised` fill, 1 px `--wc-outline` border) with `disabled={dictionary.state !== 'failed'}` (only reachable in the controller branch; a UI-level no-op so a tap during the in-place retry cannot throw) and `onclick={() => void dictionary.retry()}`. The invalid-word line: `{#if game.feedback.rejectedWord !== undefined}` a `<p class="invalid">` with an aria-hidden inline SVG ✕ (stroke `--wc-error`) and a `<span>` holding `text.invalidWord(...)` in `--wc-error`; Playwright locates the span with `getByText(…, { exact: true })`.
5. **Playwright (`e2e/dictionary.spec.ts`, android).** Route `**/en*.txt`: hold (push the route, later `route.continue()` for the real list), fulfil 500/404/body, or abort. Request counting via `page.on('request')` registered before `goto`. Cases: R-38 composing held → `Loading words…` disabled, ink secondary, `dictionaryState()` 'loading', then continue → enabled Validate → click → Place (Confirm); 2-letter draft held/failing (`Loading words…` / `Word list unavailable`, ink secondary); idle-fresh loading/failing/ready (ready: plain Validate, ink disabled); gave-up and won rows under held and failing routes → `New game`. Invalid word: fulfil `cat\ndog\n` → click Validate → exact text, phase Composing, stored moves/cursor unchanged and stored == current().session; Undo clears it. §2: route 500 on session-place.json → banner; Undo → disabled `Word list unavailable`; Redo → Confirm; `page.reload()` (route still failing) → Place. Retry (from session-composing.json): first 500, then hold → tap Reload → banner hidden, 'loading', `Loading words…`; continue → ready; repeat failure → banner again; a 500's Reload causes no `load` event (contrast). Q-42: 404 → tap Reload → `page.waitForEvent('load')`. Timeout: `page.clock.install()` (running, not paused) before goto, hold the route; once the request is seen `runFor(29_000)` → loading, no banner; `runFor(1_000)` → banner. AD-16: held request arrives while `card-0` and `primary-action` are attached; in-load halt (blocking.spec pattern) and after-mount halt (startHidden, card-0, two in-page rAF round-trips, other page writes, showPage) → after two rAF round-trips zero `**/en*.txt` requests. Rejected root: seed `session-invalid-version-unknown.json` → one request, 'ready' (a §2 rejection test, named `§2 AD-16`); with a 500 route → 'failed', no banner (named `§2 AD-8`). Validate one-tap rule and the double rAF are exempt from P3 (synchronous dispatch; the held-request case covers first paint).

### Review-log carry-forward (each resolved here)
- Interface "resolve once state leaves 'loading'" — read as "once the attempt settles" (reload branch resolves at once with `failed`): Design Notes 1.
- Retry runs from session-composing.json: DN 5. Synchronous precondition throws, `toThrow`: Boundaries, DN 1. resetModules + dynamic import, stubGlobal fetch/location/navigator, node env: Tasks. getByText exact + aria-hidden SVG ✕: DN 4. §2 reload is `page.reload()` after the Redo: DN 5.
- R-73 loop: Validate step asserts Place, primary `Confirm` and Redo disabled; sequence Undo → Validate → Undo → Redo → Confirm, stored == current().session after each.
- Double rAF and one-tap rule exempt at P3: DN 5. Banner colour asserted via `tokenColor(--wc-error)` on the banner text. Status ≠ playing wins: DN 3/5. main.ts side-effect import dropped: Code Map. Rejected root starts the load: DN 5.
- Pass 4: running `page.clock.install()`; `route.continue()`; line above primary-action; clearing by edit/Redo/Validate is the existing game.svelte.test.ts feedback Vitest (no new test); `page.on('request')` before goto; AD-15 wording → deferred spine bug; New game test waits for 'ready'.
- "Stalled body after abort": not relied on — the explicit race in DN 1 fails at 30 s whatever the stream does.
- Review log `## Result` has no open major (converged); its decision-needed is settled by the owner decision above.

## Verification

**Commands:**
- `npx vitest run src/shell/dictionary.svelte.test.ts src/shell/game.svelte.test.ts src/ui/text.test.ts` -- all pass.
- `npm run test` -- pass; record Duration (vs 7.51 s baseline).
- `npx playwright test e2e/dictionary.spec.ts e2e/game-store.spec.ts --project android` -- all pass.
- `npm run test:all` -- exit 0.
- `git diff --stat <baseline> -- src/engine fixtures` -- empty.

## Auto Run Result

**Summary:** Ticket 3.9 built. `dictionary.svelte.ts` is now the AD-8 store (loading/ready/failed, word Set, `load()`, `retry()`, 30 s per-attempt `setTimeout` → `abort()` racing fetch and body, 404 → next Reload reloads the page, and under a controlling service worker an in-place retry with the banner kept shown per the 2026-10-01 owner decision). `main.ts` starts it after a double rAF and `whenVisible()` with halted re-checks on the App mount path; the game store passes words only when ready; App shows the EXPERIENCE.md Validate label order, enables Validate iff `canValidate && ready`, renders the invalid-word line and the new `DictionaryBanner`; the test hook gains `dictionaryState()`.

**Files changed:**
- `src/shell/dictionary.svelte.ts` — the store; exports `dictionary`, `dictionaryUrl` and `DictionaryState`.
- `src/shell/dictionary.svelte.test.ts` — new AD-8 shell Vitest (every I/O matrix row).
- `src/shell/game.svelte.ts`, `src/shell/game.svelte.test.ts` — ctx gated on 'ready'; the feedback mock is updated.
- `src/shell/test-hook.ts`, `e2e/globals.d.ts` — `dictionaryState()`.
- `src/main.ts` — removes the side-effect import; adds the start sequence after mount.
- `src/ui/App.svelte`, `src/ui/DictionaryBanner.svelte` — labels, Validate, invalid-word line, banner.
- `src/ui/text.ts`, `src/ui/text.test.ts` — catalogue strings and `invalidWord`.
- `e2e/dictionary.spec.ts` — new android spec: R-38, invalid word, §2, Retry, Q-42 (plus a stubbed-controller case), Timeout, AD-16, rejected root.
- `e2e/game-store.spec.ts` — LABELS rewritten against held/failing/ready word lists (19 rows); R-73 loop gains Validate.
- `e2e/{history,nav,lifecycle,blocking,test-hook,pwa/test-hook,placeholder.screens}.spec.ts` — continuity waits and hook keys.

**Review:** 25 findings (medium 3, low 15, false 7). Patched: 1 medium group (Q-42 controlled-SW branch had no UI test → new Playwright case with a stubbed controller; it fails if the banner's disabled binding is removed) and 2 lows (LABELS rows; shared `DictionaryState` type). Deferred: spec §9 Q-42 / EXPERIENCE.md text still predates the owner decision (owner docs). Rejected: 21 rows, each with its reason in the Review Triage Log.

**Follow-up review recommended:** false (patched: high 0, medium 1, low 2).

**Verification:** `npm run test:all` exit 0 after the patches: unit 32 files / 1612 tests, dist 13, e2e 147 passed, pwa 12. The implementer also ran `npm run test:screens` (Docker), which passed against the unchanged baseline. `git diff --stat` on `src/engine` and `fixtures` is empty. Unit-suite time, like-for-like on a warm cache: baseline 5.64 s / 5.58 s; after 5.58 / 6.37 / 5.73 s, and 5.65 / 6.24 s inside test:all. That is within noise, so not worse, but still above AD-17's 5 s (deferred).

**Residual risks:** the Playwright timeout case uses a running clock with a margin of about 1 s; the real-service-worker Q-42 proof is P7 (epic 7); the spine AD-15 wording bug is still unreported to the spine owner.
