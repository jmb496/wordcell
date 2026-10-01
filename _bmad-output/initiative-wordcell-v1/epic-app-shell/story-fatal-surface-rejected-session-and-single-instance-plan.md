---
title: 'Fatal surface, rejected Session and single instance'
type: 'feature'
ticket: '5'
created: '2026-09-30'
status: 'built'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-app-shell/story-fatal-surface-rejected-session-and-single-instance.md'
  - '{project-root}/_bmad-output/specs/spec-epic-3-app-shell/build-notes.md'
warnings: [oversized]
deferred: []
baseline_revision: '0008939b386288b64b0b048c5bd7d16f1c575772'
---

<intent-contract>

## Intent

**Problem:** Nothing surfaces an uncaught error, a font failure, a rejected Session or a second live window: the store has no `halt`, `main.ts` has no handlers or font check, and `App.svelte` shows only a heading while `rejected`.

**Approach:** Add `halt`/`haltCause`/`haltText` and an import-time `storage` listener to the AD-4 store, the AD-15 handlers, font check and halted-boot path to `main.ts`, one Blocking message component rendering the rejected root, fatal and another-window surfaces, the e2e storage spy, the version-3 fixture, and the tests the ticket lists. The ticket file is the authority for every detail; Design Notes settle the review log's unapplied minors.

## Boundaries & Constraints

**Always:** AGENTS.md rules 1–7, Conventions and Known pitfalls (no `history` binding, `localStorage` only in `storage.ts`, `console.error` only in the `main.ts` handler, strings only in `text.ts`); shell Vitest names start `AD-4`/`AD-15`/`AD-7`, Playwright names start with the ids the ticket gives; seed only through `seedStorage`/`fixture`; unit suite < 5 s; engine sources, R-02 literals and existing fixtures unchanged.

**Never:** lifecycle listeners, hide flush, `isStale`/pageshow halt (entry 6); history store (entry 7); `overlays.resetForNewSession()`, History notice, nav (entry 8); dictionary load (entry 9); try/catch that swallows (the font check's `finally` only clears its timer); `preventDefault` in the handlers; edits to the ticket file or SPEC.md; a new test-hook accessor.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| storage event | localStorage area, key `wordcell:*` (any newValue incl. null) or key null | `halted`, cause `another-window` unless already `fatal` | — |
| ignored event | foreign key; sessionStorage area with `wordcell:` key or key null | no change | — |
| halt order | fatal then another-window / another-window then fatal | cause `fatal`, text of the last fatal | — |
| halted load | key absent / valid / rejected | parses, `loaded()` populated, no write, stays halted, no throw | — |
| halted commands | dispatch, newGame, replay | throw, nothing written | — |
| font check | `[]`, rejection, 30 s without settling | fatal surface, localStorage empty | thrown to handler |
| healthy font | settles before 30 s | timer cleared, stays active past 30 s | — |
| fatal after mount | throwing `setItem` in dispatch | App switches to fatal surface, bytes unchanged | `error` event |

</intent-contract>

## Code Map

- `src/shell/game.svelte.ts` -- AD-4 store; `state` `$state.raw`, `load` (throws unless booting), `dispatch` (write-then-assign), `fresh`, `newGame` (active/rejected), `replay`, `loaded`, `current`, exported `game` object. Header says `halted` is not reachable yet: update.
- `src/shell/storage.ts` -- only `localStorage` user; add `isLocalArea(area: Storage | null): boolean` (`area !== null && area === localStorage`, looked up at call time).
- `src/main.ts` -- today: sync `game.load()` then `mount(App)`. Static imports (`test-hook`, `dictionary.svelte`, `game.svelte`, `App.svelte`, `app.css`) run first; keep `app.css` imported before boot so `@font-face` is registered (dev injects it at import; build links it in the head).
- `src/ui/App.svelte` -- `board = $derived(game.view)`; `primary` `$derived.by` throws when `board` is undefined (read only inside the active branch); markup `{#if game.state.kind === 'active' && board} … {:else} <h1>WordCell</h1>`. `.primary` button styles to reuse.
- `src/ui/text.ts` -- frozen `text` object; add strings (Design Notes 5).
- `src/shell/game.svelte.test.ts` -- `setup()` resets modules, stubs `localStorage` (fake with `writes`, `map`, `control.failWrites`), `performance`, `crypto`, then imports; node environment (no `window`).
- `src/shell/storage.test.ts` -- add the `isLocalArea` case.
- `e2e/game-store.spec.ts` -- patterns: android-only `beforeEach` skip, `snapshot(page)`, `open(page)`; do not change its tests.
- `e2e/helpers/seed.ts` -- `seedStorage` uses `sessionStorage.__wordcellSeeded` (so a reload does not re-seed); `fixture(name)`.
- `e2e/helpers.spec.ts` -- AD-17 helper self-tests, android-only; direct `wordcell:*` evaluate writes allowed here.
- `e2e/globals.d.ts` -- mirrors the hook; add `__wordcellStorageWrites?: { key: string; value: string | null }[]`.
- `fixtures/session-place.json` -- version 1, seed 1, Place; source of the new fixture. `session-invalid-null.json` (version-unreadable), `session-invalid-s2-last-only.json` and `session-invalid-r50-placement-order.json` (version 1, replay-failed) exist.
- `EXPERIENCE.md` lines 99–101 (rejected rows, ASCII `can't`), 193–194; `DESIGN.md` line ~162 `components.dialog` tokens and line 603 Dialog, 625 Blocking message.
- Docs to update: `_bmad-output/specs/spec-epic-3-app-shell/rule-coverage.md` (§2 rows lines 21 and 27, AD-15 row line 100), `build-notes.md` Fixtures CAP-4 bullet (line 46), `_bmad-output/initiative-wordcell-v1/epic-app-shell/tickets.toml` entries 6 and 9 `tests`.

## Tasks & Acceptance

**Execution:**
- [x] (before edits) `npx vitest run` -- record Duration.
- [x] `fixtures/session-invalid-version-unknown.json` -- `session-place.json` byte-for-byte with `"version":3`.
- [x] `src/shell/storage.ts` + `storage.test.ts` -- `isLocalArea`; test `AD-7 isLocalArea is true only for the localStorage object` (stubbed localStorage vs another object vs null).
- [x] `src/shell/game.svelte.ts` -- `halted` record `$state.raw<{ cause: 'fatal'; text: string } | { cause: 'another-window' } | undefined>`; `halt` overloads (`'fatal', text` / `'another-window'`): from any state set `state = { kind: 'halted' }`; `fatal` always sets cause and text; `another-window` keeps an earlier `fatal`. Getters `haltCause` (undefined unless halted) and `haltText` (undefined unless cause `fatal`). `load()`: throws unless booting or halted; while halted it reads and parses, sets `launch` (`{ session: null }` when absent), never `createSession`/writes, returns. At module top level: `window.addEventListener('storage', (event) => { if (isLocalArea(event.storageArea) && (event.key === null || event.key.startsWith('wordcell:'))) halt('another-window'); })`. Header comment updated.
- [x] `src/ui/text.ts` -- Design Notes 5.
- [x] `src/ui/BlockingMessage.svelte` -- props `{ title, body?, action, onaction }`; `role="alertdialog"`, `aria-labelledby`/`aria-describedby` via `$props.id()`, `<h2>` title, `<p>` body only when given, one primary pill button (48 px, accent-orange, as `.primary`); DESIGN.md Blocking message: dialog-styled card centred on the table, no scrim, max 320 px wide, `--wc-surface-raised` fill (DESIGN.md dialog); text in rem (A-D9).
- [x] `src/ui/Halted.svelte` -- reads `game.haltCause`/`game.haltText`; renders one `BlockingMessage` whose props are `$derived` (fatal: `text.fatalTitle`, body `haltText`; another-window: `text.anotherWindow`, no body), action `text.reload`, `onaction` → `location.reload()`; no `{#if}` around it, so the alertdialog node persists when the cause changes.
- [x] `src/ui/App.svelte` -- markup order: `{#if game.state.kind === 'halted'} <Halted />` `{:else if game.state.kind === 'rejected'} <BlockingMessage title={text.rejectedTitle} body={rejectedBody(game.state.reason)} action={text.newGame} onaction={newGame} />` `{:else if active && board}` (board unchanged) `{:else}` heading. `rejectedBody` switches on `reason.reason` to the three text entries.
- [x] `src/main.ts` -- Design Notes 1–3.
- [x] `src/shell/game.svelte.test.ts` -- `setup()` stubs `window` with `new EventTarget()` before `vi.resetModules()`/import; helper `storageEvent(key, area)` = `Object.assign(new Event('storage'), { key, newValue: …, storageArea: area })` dispatched on the stubbed window; the AD-4 and AD-15 tests of the Tests mapping.
- [x] `e2e/helpers/storage-spy.ts` -- ticket Description "Storage spy": `armStorageSpy(page, { throwOn? })` waits (`waitForFunction`) for `window.__wordcell` and `current().kind !== 'booting'`, throws if already armed on the page, patches `Storage.prototype.setItem`/`removeItem` in one `page.evaluate`, recording to `window.__wordcellStorageWrites` only when `this === localStorage`; `storageWrites(page)` returns the records (throws if unarmed).
- [x] `e2e/helpers.spec.ts` -- a `storage spy` describe with the three AD-17 tests (ticket AC).
- [x] `e2e/globals.d.ts` -- the records global.
- [x] `e2e/blocking.spec.ts` -- new, android-only; helpers `expectFatal(page, body?)` (alertdialog with heading `Something went wrong.`, non-empty description, exactly one `button` on the page named `Reload`, `current().kind === 'halted'`) and `expectNoBoard(page)` (no `[data-testid^="card-"]`, `undo`, `redo`, `primary-action`); the Playwright tests of the Tests mapping.
- [x] Docs -- rule-coverage §2 unknown-version row: variants become four (add `session-invalid-r50-placement-order` as replay-rule `replay-failed`; `session-invalid-s2-last-only` relabelled pre-replay AD-7 `replay-failed`); replay-abort row cites the r50 fixture; AD-15 row CAP `4, 5`. build-notes Fixtures CAP-4 bullet: the same relabel. tickets.toml entry 6 `tests` gains `AD-15 halted: hide flush writes no wordcell:session (Playwright, spy); AD-16 halted boot registers no lifecycle listeners (shell Vitest)`; entry 9 `tests` gains `AD-16 halted boot requests no dictionary (Playwright)`.
- [x] Verification section; record outputs in Implementation Notes.

**Tests mapping (sentence → test):**
- Q-37 / AD-15 fatal before mount → `Q-37 AD-15 a 404 on the font gives the fatal surface and writes nothing` (body `A network error occurred.`, Chromium's NetworkError), `… a font load held past 30 s …` (clock installed before goto, route held, clock paused at 1000 before goto, wait for `window.__wordcell`, `runFor(29_999)` still booting with no alertdialog, then `runFor(1)`, body `AD-15 font check timed out after 30000 ms`), `… document.fonts.load resolving [] …` (init script, body `AD-15 font check: WordCell Serif did not load`); each `goto('/', { waitUntil: 'domcontentloaded' })`, then `expectFatal`, `expectNoBoard`, `localStorage.length === 0`. `Q-37 AD-15 a healthy boot stays active past the 30 s font timeout` (clock, `card-0` visible, `runFor(31_000)`, still active, no alertdialog).
- Q-37 / AD-15 fatal after mount + halted blocks writes → `Q-37 AD-15 a throwing Session write on Undo gives the fatal surface and stops writing` (ticket AC; body `storage-spy: wordcell:session`; records exactly `[{ key: 'wordcell:session', … }]`; stored bytes === fixture). `Q-37 AD-15 an unhandled rejection with a string or blank reason gives a non-blank fatal body` (`'Q-37 string reason'` → that body; `''` → `[object String]`).
- §2 → `§2 R-74 Q-29 version-unknown …` (session-invalid-version-unknown + history-three-records; body with `3`), `§2 version-unreadable …` (session-invalid-null), `§2 pre-replay AD-7 check …` (s2-last-only, version 1), `§2 replay rule …` (r50, version 1). Each: exact title and body, buttons exactly `New game`, `expectNoBoard`, bytes unchanged, reload, bytes unchanged and still rejected; New game clicked inside one `page.evaluate` that then reads `wordcell:session` and `current()` (written at once): fresh shape (version from session-idle-fresh.json, uint32 seed, `moves []`, `cursor { index 0, idle }`, `gaveUp false`, `activeMs 0`) deep-equal `current().session`; `card-0` visible. The R-74 test also: history bytes unchanged; reload shows `Seed <stored seed>`.
- R-84 / Q-38 two pages → `R-84 Q-38 an Undo in a second page halts the first with the another-window message` (ticket AC, Reload tapped at the end: page 1 active with page 2's `current().session`).
- Q-38 halted boot → `Q-38 a write by another page during boot halts it: no Board, no Session, and a later fatal replaces the message` (ticket AC; every held font route continued on release; alertdialog handle taken before the `setTimeout` throw, still `isConnected` after, one alertdialog, `expectFatal(page, 'Q-38 later fatal')`).
- Q-38 rejected root → `Q-38 a rejected root halts on another page's write` (session-invalid-null; page 2 `/favicon.svg` sets `wordcell:prefs`; heading `WordCell is open in another window.`, only `Reload`, bytes unchanged).
- AD-4 shell Vitest: halt before load (named `AD-4 AD-15 …`, carrying AD-15 "load writes nothing") with the key absent / valid / rejected (no write, halted, `another-window`, `loaded()` = `{ session: null }` / session / `{ rejected }`); fatal then storage event and storage event then fatal (`fatal`, text); rejected + storage event → `another-window`; rejected + `halt('fatal', t)` → `fatal`; foreign key, sessionStorage `wordcell:session`, sessionStorage key null → not halted; `wordcell:session` newValue null and localStorage key null → halted; `haltCause`/`haltText` undefined while booting, active, rejected, and `haltText` undefined for another-window; second fatal replaces the text (folded into the storage-event-then-fatal case; the three ignored events share one store).
- AD-15 shell Vitest: while halted (from active), `dispatch`, `newGame`, `replay` throw and `storage.writes` stays empty (one test over one halted store; load's no-write half is the `AD-4 AD-15` halt-before-load cases).
- AD-17 helper self-tests: spy order across keys and removals; thrower records then throws `storage-spy: <key>` and leaves the stored value; sessionStorage writes (incl. a `wordcell:` key) not recorded.
- AD-7 `isLocalArea`.
- Exempt / elsewhere: AD-15 hide-flush no-write (entry 6, tickets.toml); halted boot no listeners (entry 6), no dictionary (entry 9).

**Acceptance Criteria:**
- Given the finished change, when `npm run test:all` runs, then it exits 0 and the unit suite stays under 5 s.
- Given the dev server in a browser, when `wordcell:session` holds version 3, then the page shows the rejected title and the version-3 body with only New game.
- Given the change, when `git diff --stat src/engine` and `git diff --stat fixtures` run, then engine is empty and fixtures lists only the new file.

## Implementation Notes

- Resumed from an interrupted run: the store, storage, text, App, BlockingMessage, Halted, main.ts, fixture and shell Vitest changes in the tree were reviewed against this plan and kept; this run added the storage spy, its helper self-tests, the globals entry, `e2e/blocking.spec.ts`, the docs edits and verification.
- Deviation (technical, Design Notes 3): the font-check timer calls `reportError(new Error('AD-15 font check timed out after 30000 ms'))` instead of `throw`. Playwright's `page.clock` catches a throwing timer callback and rethrows it from `runFor` (playwright-core `ClockController._callFirstTimer`/`_runTo`), so a `throw` never reaches the window `error` handler under the fake clock and the 30 s test could not pass. `reportError` dispatches the same `error` event (with `event.error`) under both real and fake clocks and keeps the note's intent: a missing `clearTimeout` still fatals a healthy game, which the past-30 s test guards.
- `armStorageSpy` refuses a second arm on the same `Page` object for its lifetime (node-side `WeakSet`), also after a reload; `storageWrites` throws when the current document has no spy (e.g. after a reload).
- Review fix: `main.ts` registers the `error`/`unhandledrejection` handlers after `target` and `surface` are declared (still before `boot()`), so a handler never reads them in their TDZ; a missing `#app` now throws uncaught before the handlers exist.
- The halted-boot Playwright test also asserts `loaded()` is `{ session: null }` (load recorded the absent key without writing).
- `fixtures/session-invalid-version-unknown.json` equals `session-place.json` with `"version":1` → `"version":3`, no trailing newline (same as the source).
- Verification:
  - `npx vitest run` before edits (working tree stashed, HEAD 53f3e13): 27 files, 1490 tests, Duration 4.70 s. After: 27 files, 1509 tests, Duration 4.78–5.14 s over four standalone runs (5.77 s inside `test:all`, under concurrent load). ~70 % of the time is transform on `/mnt/d`. Review loop: the halt describe folded five fresh-store cases into two (no assertion dropped); 1504 tests, Duration 4.65 s, 4.76 s, 4.61 s over three standalone runs.
  - `npm run test:all`: exit 0 (lint, check, unit, build + size budget, `test:e2e:dist` 13 passed, `test:e2e` 64 passed with desktop skips, `test:e2e:pwa` 12 passed).
  - `git diff --stat src/engine fixtures`: empty; `git status fixtures`: only `?? fixtures/session-invalid-version-unknown.json`.
  - Acceptance "dev server shows the version-3 rejected root": covered by `§2 R-74 Q-29 version-unknown …` (exact title, body with 3, only New game).
- Decision: owner 2026-09-30 — when the Blocking message replaces the board (AD-15 fatal, Q-38 another window, §2 rejected save), keyboard focus moves to its one button (Reload / New game) when it appears (standalone `Halted` mount and the in-App switch) and again when its cause changes. Implemented as a `{@attach}` on the button in `src/ui/BlockingMessage.svelte` that reads `title`; tests in `e2e/blocking.spec.ts` `Blocking message focus`.

## Plan Change Log

## Review Triage Log

### 2026-09-30 — Review pass
- verdicts: 24 findings — high 0, medium 0, low 19, false 5, maybe-false 0
- findings:
  - `[low]` `[patch]` (blind) main.ts listeners registered before `target`/`surface` exist: an error in that window hits TDZ in `showStandalone` — listener registration moved below the declarations (grouped with edge #1).
  - `[false]` `[reject]` (blind) "Registered first, before any await" comment wrong for static imports — the comment says before any await, which holds; the static-import residual is the accepted residual in Design Notes.
  - `[low]` `[reject]` (blind) Undo-fatal test does not attempt a later write — the minimal board offers no write after the halt; the failable no-write proof is the shell Vitest `AD-15 while halted … throws and writes nothing`, and the hide flush case is entry 6's (tickets.toml).
  - `[low]` `[reject]` (blind) no e2e for Reload on the fatal surface / fatal over the rejected root — same `Halted`/`BlockingMessage` path as the tested another-window Reload; rejected→fatal is shell-Vitest-covered; adding tests beyond the ticket's list is not a defect fix.
  - `[false]` `[reject]` (blind) "pre-replay AD-7 check" label wrong for s2-last-only — `src/engine/errors.ts:20-22` and `replay.ts:50` list `s2-last-only` among the AD-7 pre-replay checks; the ticket uses the same label.
  - `[low]` `[reject]` (blind) version-3 fixture becomes valid once SESSION_VERSION reaches 3 — the ticket fixes version 3; at that bump the e2e body assertion fails loudly, which is the desired signal.
  - `[low]` `[reject]` (blind) alertdialog does not move focus — EXPERIENCE.md sets no focus rule for the Blocking message (only Confirm dialog / End sheet); a focus rule is a UX choice for the owner, surfaced in the run result, not auto-applied.
  - `[low]` `[reject]` (blind) fatal text can be `[object Object]`/empty for non-Error reasons — `event.message` is non-empty for real script errors; edge input only, display-only harm; see verification-gap row (deferred).
  - `[false]` `[reject]` (blind) plan not part of the diff — the plan exists beside the ticket and was deliberately excluded from the lens diff.
  - `[low]` `[reject]` (blind) rule-coverage AD-15 row CAP "4, 5" overstates history-write coverage — the plan's Docs task sets this; the history half is entry 7's per tickets.toml; documentation nuance, no runtime effect.
  - `[low]` `[reject]` (blind) `isLocalArea` has a redundant null check — cosmetic, plan-specified, behaviour identical.
  - `[low]` `[reject]` (blind) halt-cause literals duplicated in the `halted` type — cosmetic; two literals beside their only use.
  - `[low]` `[patch]` (edge) TDZ in `showStandalone` when an error fires before `target`/`surface` initialise — same root cause as blind #1; patched there.
  - `[false]` `[reject]` (edge) benign window errors (ResizeObserver loop, extension scripts) halt the game — `src/` uses no ResizeObserver, extension content-script errors do not reach the page's `error` event, and AD-15 makes every uncaught error fatal by design.
  - `[low]` `[reject]` (edge) `mount(Halted)` throwing after `replaceChildren()` leaves a blank page — Halted mount failing is itself a bug that fails fast (rule 6); no reachable trigger shown.
  - `[low]` `[reject]` (edge) `mount(App)` throwing partway leaves its effects alive beside Halted — no reachable trigger shown; fix needs extra unmount bookkeeping.
  - `[low]` `[reject]` (edge) focus not moved to the alertdialog after a fatal removes the focused button — same as blind focus row; owner UX choice.
  - `[low]` `[reject]` (edge) `armStorageSpy` refuses to re-arm the same Page after a reload — the plan specifies throw-if-armed per page; no current test re-arms; entries 6/7 can widen it when they need it.
  - `[low]` `[reject]` (edge) spy misses `localStorage.clear()` / index assignment — `src/shell/storage.ts` only calls `setItem`/`removeItem`, the only writers the spy must see.
  - `[low]` `[defer]` (verification-gap) no test for the fatal body of non-Error reasons / null `event.error` / empty message — pre-verified gap, lens disposition defer; deferred with severity low.
  - `[low]` `[reject]` (intent) a halt during boot shows its message only after the font check settles — Design Notes 3 chose boot ordering; delay is the font load (ms normally, ≤ 30 s then fatal).
  - `[low]` `[reject]` (intent) "no listeners"/"no dictionary" on halted boot true only by absence, proofs moved to entries 6/9 — plan-specified and recorded in tickets.toml.
  - `[low]` `[reject]` (intent) key-null / sessionStorage / most halt orders proven only in shell Vitest with synthetic events — the ticket's AC lists them as AD-4 shell Vitest; real-browser cross-page events are covered by the R-84 and Q-38 Playwright tests.
  - `[false]` `[reject]` (intent) browser "no later write" assertions cannot fail — duplicate of blind row 3's claim at a different lens; the failable proof exists in shell Vitest, so no unverified guarantee remains.

## Design Notes

1. **Handlers (main.ts, first statements after imports):** `error` → `fatal(event.error ?? event.message)`; `unhandledrejection` → `fatal(event.reason)`. `fatal(reason)`: `console.error(reason)` once, `game.halt('fatal', textOf(reason))`, `showStandalone()`; no `preventDefault`. `textOf` is total and never blank: `Error` → `message || name`, else `String(reason)`; a throw or blank text falls back to the ErrorEvent's `event.message`, then `Object.prototype.toString.call(reason)`.
2. **Surface flag:** `let surface = false`; `showStandalone()` returns if set, else `root.replaceChildren()`, `mount(Halted, { target: root })`, then sets it; the App mount sets it after `mount()` returns. A fatal after App mounts needs no mount: App's first branch renders `Halted` reactively.
3. **Boot:** `void boot()` (not awaited, so a font or load failure is an `unhandledrejection` before mount, writing nothing — the minor's reading of "before load"). `boot`: `await fontCheck()`, `game.load()`, then `if (game.state.kind === 'halted') { showStandalone(); return; }`, then mount App. `fontCheck`: `const timer = setTimeout(() => { throw new Error('AD-15 font check timed out after 30000 ms'); }, 30_000)`; `try { faces = await document.fonts.load('600 1em "WordCell Serif"', 'W') } finally { clearTimeout(timer) }`; `faces.length === 0` → throw `AD-15 font check: WordCell Serif did not load`. A `timedOut` flag set by the timer makes a later rejection or `[]` return without reporting again. The timer throws directly (reaching `error`) instead of rejecting a raced promise, so a missing clear would fatal a healthy game and the past-30 s test guards it (minor: font timer clear).
4. **Store halt:** `load` while halted is the only non-booting call allowed; the existing `newGame` guard already throws while halted. The listener is registered at import (AD-15: listener registration and `$state` only, no storage reads).
5. **Strings (text.ts):** `rejectedTitle: 'This saved game can't be opened.'` shared by the three bodies (minor: shared title plus three bodies): `rejectedVersionUnknown: (version: number) => \`It was saved in format version ${version}, which this version of WordCell can't read. It stays saved until you start a new game.\``, `rejectedVersionUnreadable` (constant), `rejectedReplayFailed: (version: number) => \`It (format version ${version}) failed a rules check while loading. It stays saved until you start a new game.\``; `fatalTitle: 'Something went wrong.'`, `anotherWindow: 'WordCell is open in another window.'`, `reload: 'Reload'`. Copy from EXPERIENCE.md 99–101, 193–194 verbatim.

Review-log resolutions (technical defaults; none changes functionality, UX or gameplay). Open major: none (converged, 0 majors). Unapplied minors:
- Boot-order wording → Design Notes 3.
- Later-fatal check → persistent alertdialog node asserted `isConnected` (Halted has no `{#if}`).
- sessionStorage negatives use `wordcell:session` and key null.
- Font timer → Design Notes 3.
- In-App transitions → the `Q-38 a rejected root halts …` Playwright test; fatal-over-App is the dispatch-throw test.
- Entries 6 and 9 halted-boot items → tickets.toml (Docs task).
- Description duplication → not applied: the build never edits the ticket file.
- Strings → Design Notes 5.
- `console.error` once, no `preventDefault` → Design Notes 1.
- AD-15 "load writes nothing" → carried by the halt-before-load tests, named `AD-4 AD-15 …`, not duplicated.
- Title role → `alertdialog` + `h2`. "Written at once" → New game clicked and storage read in one `page.evaluate`. Held font routes → all continued. App's halted branch first, before any view read. Static-import residual → accepted (a throw at import precedes the handlers; no storage is touched). rule-coverage R-84 same-task spy wording → entry 7. Reload uses the primary style (AD-15, DESIGN.md Blocking message) though DESIGN.md Buttons calls Reload secondary elsewhere: noted, not changed.

## Verification

**Commands:**
- `npx vitest run` -- all pass, Duration < 5 s (before/after recorded).
- `npm run test:all` -- exit 0.
- `git diff --stat src/engine fixtures` -- engine empty; fixtures only `session-invalid-version-unknown.json` (new, untracked until added).

**Manual checks (if no CLI):**
- None beyond the Playwright suites (no screenshot spec covers these surfaces; `test:screens` baselines unaffected because the seeded board is unchanged).

## Auto Run Result

**Summary:** Resumed after a usage-limit stop. The store gains `halt`/`haltCause`/`haltText` and an import-time Q-38 `storage` listener (localStorage area, `wordcell:` key or key null; fatal always wins); `load()` while halted parses and records `loaded()` without writing. `main.ts` registers the AD-15 `error`/`unhandledrejection` handlers, runs the 30 s font check before load, and shows a standalone Blocking message on a halted boot. `BlockingMessage.svelte` renders the §2 rejected root (three catalogue bodies, New game) and, via `Halted.svelte`, the fatal and another-window surfaces with Reload. E2E storage spy helper, version-3 fixture, shell Vitest and android Playwright tests added; rule-coverage, build-notes and tickets.toml updated.

**Files changed:**
- `src/shell/game.svelte.ts` — halt state, getters, halted `load()`, storage listener.
- `src/shell/storage.ts` — `isLocalArea`.
- `src/main.ts` — AD-15 handlers, font check (timer via `reportError`), async boot, standalone surface.
- `src/ui/BlockingMessage.svelte`, `src/ui/Halted.svelte` — new Blocking message surfaces.
- `src/ui/App.svelte` — halted and rejected branches before the board.
- `src/ui/text.ts` — rejected, fatal, another-window and Reload strings.
- `src/shell/game.svelte.test.ts`, `src/shell/storage.test.ts` — AD-4/AD-15/AD-7 shell tests.
- `e2e/helpers/storage-spy.ts`, `e2e/helpers.spec.ts`, `e2e/globals.d.ts` — storage spy and its self-tests.
- `e2e/blocking.spec.ts` — Q-37/AD-15 fatal, §2 rejected (four variants), R-84/Q-38 single-instance tests.
- `fixtures/session-invalid-version-unknown.json` — new version-3 fixture.
- `_bmad-output/specs/spec-epic-3-app-shell/rule-coverage.md`, `build-notes.md`, `epic-app-shell/tickets.toml` — coverage relabels and moved halted-boot obligations.

**Review findings:** 24 findings (0 high, 0 medium, 19 low, 5 false). Patched: 1 entry (low): handler TDZ in `main.ts` (blind + edge). Deferred: 1 (low): no test for non-Error fatal text (closed in the review loop). Rejected: 22, each with its reason in the Review Triage Log (notably: Blocking message focus management is unspecified in EXPERIENCE.md — an owner UX choice, not auto-applied).

**Follow-up review recommended:** false (patched by verdict: high 0, medium 0, low 1).

**Verification:** `npm run test:all` exit 0 after the patch (unit 1509 passed; dist smoke 13; dev e2e 64 passed with desktop skips; PWA 12). `git diff --stat src/engine fixtures` — engine untouched; fixtures only the new untracked file.

**Residual risks:**
- Unit suite duration is near the 5 s AD-17 budget: 4.70 s before this ticket, 4.61–4.76 s standalone after the review loop (mostly transform time on `/mnt/d`).
- The font timer uses `reportError` instead of a throwing timer (Playwright's fake clock swallows timer throws); same `error`-event outcome.
- `armStorageSpy` refuses a second arm on the same Page, even after a reload; entries 6/7 may need to widen it.
- Blocking message does not move focus into the alertdialog (EXPERIENCE.md has no rule for it).
