---
title: 'Game store load, dispatch and storage'
type: 'feature'
ticket: '3'
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
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-app-shell/story-game-store-load-dispatch-and-storage.md'
  - '{project-root}/_bmad-output/specs/spec-epic-3-app-shell/build-notes.md'
warnings: [oversized]
deferred:
  - summary: >-
      A throwing game.load() in main.ts (first-launch setItem quota or SecurityError) leaves a blank page with an uncaught error.
    evidence: |-
      main.ts calls game.load() before mount and no AD-15 error handler exists yet; entry 5 adds the fatal surface, halt and haltCause (SPEC CAP-4).
    location: >-
      src/main.ts
    severity: low
baseline_revision: '162af5a047cbf8ac9a1edd0e2b3f040697722890'
---

<intent-contract>

## Intent

**Problem:** The game store boots `active` on `createSession(1)` with no storage (E7), so nothing is saved, restored or dealt from a random seed, the board has no Undo/Redo, and the test hook exposes nothing.

**Approach:** Add `storage.ts`, `seed.ts` and the passive `clock.ts`; give the store AD-4's four-kind state, `load()`, `dispatch()` with `DispatchResult`, and `loaded()`/`current()` for the AD-17 hook; render the E1 minimal board (columns, WordCells, DESIGN.md Undo/Redo, Seed line); move the smoke, dist-smoke and screenshot specs onto `fixtures/session-idle-fresh.json`. The ticket file is the authority; this plan settles the review log's open major and its 16 Pass 4 minors (Design Notes).

## Boundaries & Constraints

**Always:** AGENTS.md rules 1–7, Conventions and Known pitfalls (single owners: `localStorage` only in `storage.ts`; no binding named `history`); every Session write is `write(SESSION_KEY, serializeSession(s))`, every read goes through `parseSession(text, EN)`; write first, then assign state; shell Vitest names start `AD-4`/`AD-5`/`AD-7`/`AD-9`/`AD-17`, Playwright names start with the R-id (`R-73`, `R-74`) or `AD-17`; Playwright seeds only through `seedStorage`; the hook object stays frozen; unit suite < 5 s; R-02 golden literals and every fixture file unchanged.

**Never:** primary-action, New game/Replay, `feedback`, `text.ts` or the E8 dispatch-cost script (entry 4); halt/`haltCause`, the `storage` listener or the rejected UI (entry 5); lifecycle listeners or any `clock.resume` call in app code (entry 6); history/prefs in `loaded()`/`current()` (entries 7/10); a dictionary in `apply` (entry 9); try/catch in the store; edits to AGENTS.md, SPEC, build-notes, the ticket, tickets.toml or engine sources; Playwright config edits.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| first launch | key absent | `createSession(newSeed())` written, then `active`; `loaded()` = `{ session: null }` | first-launch write throws → rethrow, stays `booting`, `loaded()` throws |
| parse ok | valid Session text | `active` with parsed Session; nothing written; `loaded().session` = parsed Session | none |
| parse not ok | `null` / version 99 | `rejected`, `reason` `{ reason: 'version-unreadable' }` / `{ reason: 'version-unknown', version: 99 }`; nothing written; `loaded().session` = `{ rejected: reason }` | none |
| second load | state active or rejected | throws | — |
| dispatch outside active | booting / rejected | throws, nothing written | — |
| changing dispatch | Undo on `session-place.json` | written, state updated, `changed: true` | write throws → rethrow, `game.state` same reference |
| no-op, clock paused | `setDestinationCount {k:1}` on `session-composing.json` | `changed: false`, nothing written | — |
| accrue-only | clock resumed, now advanced 1000, same no-op | `changed: false`; written Session = input with `activeMs + 1000` | — |
| un-finish / finish | Undo on `session-won.json`, then Redo; Undo on `session-gave-up.json` | `unfinished: true`; `finished: 'won'`; `unfinished: true` | — |

</intent-contract>

## Code Map

- `src/shell/game.svelte.ts` -- E7 first cut: `$state.raw` `GameState` (booting|active), `$derived` view, `export const game = { get state, get view }`; module-load `createSession(1)` goes. Extend in place; only this module calls `apply`/`accrue`/`createSession` (AD-4).
- `src/engine/index.ts` -- the surface: `apply`, `accrue`, `createSession`, `parseSession`, `serializeSession`, `view`, `EN`; types `Command`, `ApplyResult`, `ParseSessionResult` (`{ok:false; reason:'version-unreadable'} | {ok:false; reason:'version-unknown'|'replay-failed'; version}`), `Session`, `GameView` (`status`, `columns[].cards` top→bottom, `cells[]` `{cell, cards bottom→top}`, `faces[id].letter`, `canUndo`, `canRedo`), `Status` (`playing|won|gaveUp`). `ApplyContext.dictionary` optional; `validate` without it throws `command-dictionary`.
- `src/shell/test-hook.ts` -- frozen empty `window.__wordcell` under `DEV || VITE_TEST_HOOKS==='1'`; declares the `Window` type. `e2e/globals.d.ts` duplicates the type (change together).
- `src/ui/App.svelte` -- placeholder board (heading, `.meta` "Seed n · placeholder board · 52 cards", columns with live cards); `cardCount` `$derived` exists only because Biome misses markup-only uses (keep a script-side use of `game` if needed).
- `src/ui/app.css` -- `--wc-*` DESIGN.md colour tokens (use them; add none).
- `src/main.ts` -- imports test-hook, dictionary, App, css; `mount(App, { target })`.
- `e2e/smoke.spec.ts`, `e2e/pwa/dist-smoke.spec.ts`, `e2e/placeholder.screens.spec.ts` (+ `-snapshots/placeholder-board-{android,desktop}-linux.png`) -- unseeded today; seed 1 assumed.
- `e2e/pwa/font.spec.ts:~99` -- `page.getByText(/placeholder board/)`; hook-free, runs under `pwa` and `dist-smoke`.
- `e2e/test-hook.spec.ts`, `e2e/pwa/test-hook.spec.ts` -- assert `{ frozen: true, keys: 0 }`.
- `e2e/helpers/seed.ts` -- `seedStorage(page, { session: string })` takes raw text; tests for helpers live in `e2e/helpers.spec.ts` (android-only `beforeEach` skip). Its raw `'a'`/`'b'`/`'s'` seeds now reach `rejected` harmlessly (page shows the heading only).
- `src/architecture.test.ts` -- AD-1 scan: shell may import `src/engine/index`, fixtures JSON and npm packages; tsconfig.app.json has no node types (no `node:fs` in shell tests).
- Planning probe: a `$state.raw` + `$derived` module under node Vitest (current vite.config) updates reactively; no client-transform project needed.
- DESIGN.md: `button-secondary` = surface-raised fill, 1px outline border, ink-primary, 44px, radius full; `top-bar.undoRedo` = 44 × 44 icon-only, circle; icons inline SVG `↶`/`↷` in ink-primary; disabled = ink-disabled on surface-raised; `cell-number` typography 600 13px/16px system-ui.

## Tasks & Acceptance

**Execution:**
- [x] (before edits) `npx vitest run` -- record Duration in Implementation Notes.
- [x] `src/shell/storage.ts` -- new: `SESSION_KEY`, `HISTORY_KEY`, `PREFS_KEY` constants (`'wordcell:session'|'wordcell:history'|'wordcell:prefs'`), `read(key): string | null`, `write(key, text): void`, `remove(key): void`; each looks up `localStorage` at call time; no parsing, no catch.
- [x] `src/shell/seed.ts` -- new: `newSeed(): number` = `crypto.getRandomValues(new Uint32Array(1))[0]` (AD-5).
- [x] `src/shell/clock.ts` -- new, passive, module state starts paused: `resume(now)`, `pause(now)`, `take(now)` (floor of carry + running span, keeps the fraction), `peek(now)` (floor, non-consuming); resume while running / pause while paused are no-ops.
- [x] `src/shell/game.svelte.ts` -- `GameState` = AD-4's four kinds (`rejected` carries `reason: RejectReason` = the parse failure minus `ok`; `halted` unreachable); start `booting`, no top-level storage read; `load()` per the matrix (throws unless booting; first launch: create, write, then `active`); `dispatch(command): DispatchResult` (export the type: `changed`, `rejectedWord?`, `finished?: 'won'|'gaveUp'`, `unfinished?: true`): throw unless active; `before`; `accrued = accrue(before, clock.take(performance.now()), EN)`; `result = apply(accrued, command, { lang: EN })`; `changed = result.session !== accrued`; pass `rejectedWord` through; only when changed compare `view(accrued).status` vs `view(result.session).status` once; when `result.session !== before` write, then assign `active`; `loaded()` (throws while booting; `{ session: Session | null | { rejected: RejectReason } }` kept from the launch); `current()` (`{kind:'booting'} | {kind:'active', session} | {kind:'rejected', reason} | {kind:'halted'}`); `view` getter as today.
- [x] `src/shell/test-hook.ts` + `e2e/globals.d.ts` -- hook = `Object.freeze({ loaded: () => game.loaded(), current: () => game.current() })`; both type declarations describe exactly these two members (globals.d.ts: `import type { ParseSessionResult, Session } from '../src/engine/index'`).
- [x] `src/main.ts` -- import `game`; `game.load()` synchronously before `mount`.
- [x] `src/ui/App.svelte` -- while `active`: `<main>` with a top row (heading `WordCell`, Undo and Redo as DESIGN.md undoRedo: 44 × 44 circular icon-only `button-secondary`, inline SVG ↶/↷ `aria-hidden`, `aria-label` `Undo`/`Redo`, `data-testid` `undo`/`redo`, native `disabled={!canUndo}`/`{!canRedo}`, `onclick` → `game.dispatch({ type: 'undo' | 'redo' })`); the Seed line `Seed <n>` replacing `.meta`; columns unchanged; a WordCells row: cells 3–10 as `<ol data-testid="wordcell-<n>" aria-label="WordCell <n>">` with a visible cell-number label and its `cards` bottom→top as live cards (`data-card-id`, `data-testid`, `data-place="cell"`). Any other kind: `<main><h1>WordCell</h1></main>` only. Tokens only from `--wc-*`.
- [x] `src/shell/storage.test.ts`, `seed.test.ts`, `clock.test.ts`, `game.svelte.test.ts` -- shell Vitest per the Tests mapping; each store/clock test: `vi.resetModules()`, stub globals (`localStorage` Map fake, `performance`, `crypto` as needed), dynamic-import `./game.svelte` and `./clock`; `afterEach(vi.unstubAllGlobals)`. Fixtures via `import x from '../../fixtures/<f>.json' with { type: 'json' }`, stored as `JSON.stringify(x)`.
- [x] `e2e/helpers/seed.ts` + `e2e/helpers.spec.ts` -- add `fixture(name): string` returning the verbatim text of root `fixtures/<name>` (throws when missing); one `AD-17` self-test.
- [x] `e2e/game-store.spec.ts` -- new dev-server spec, android-only skip like helpers.spec: the R-73/R-74/AD-17 Playwright tests of the mapping.
- [x] `e2e/smoke.spec.ts`, `e2e/pwa/dist-smoke.spec.ts`, `e2e/placeholder.screens.spec.ts` -- `seedStorage(page, { session: fixture('session-idle-fresh.json') })` before `goto`; smoke also asserts column 1's card ids and letters in order against literals (seed 1, from `view(createSession(1), EN)`), and Undo/Redo visible and disabled.
- [x] `e2e/pwa/font.spec.ts` -- `/placeholder board/` → `/^Seed \d+/` (stays unseeded).
- [x] `e2e/test-hook.spec.ts`, `e2e/pwa/test-hook.spec.ts` -- assert frozen and own keys exactly `['current', 'loaded']` (sorted), and `current().kind === 'active'`; rename to "exposes loaded and current".
- [x] Screenshot baseline -- `npm run test:screens -- --update-snapshots` (container), inspect both PNGs, then `npm run test:screens` green; same file names.
- [x] Verification section; record outputs in Implementation Notes.

**Tests mapping (sentence → test):**
- R-74 first-launch deal (UI) / uint32 seed → `R-74 a fresh context stores a uint32-seeded Session before any input, equal to current().session, loaded().session null`; `R-74 two fresh contexts get different seeds`.
- R-73 saved after every change (Undo, Redo) → `R-73 Undo and Redo on session-place.json are each stored before the next action` (Redo disabled before Undo, enabled after; each click: stored `JSON.parse` deep-equals `current().session`, which differs from its pre-click value).
- R-73 exact phase after kill → `R-73 kill variant: …` (seed `session-place-free-letter-redo-tail.json`, Undo; stored = `current().session` ≠ fixture; CDP `Page.crash`; unseeded new page in same context: `loaded().session` and `current().session` deep-equal it).
- R-73 no account/no server → `R-73 a dispatch-and-reload session makes no off-origin and no non-GET request` (`page.on('request')` before first `goto`; seed `session-place.json`, Undo, reload).
- AD-17 `loaded()`/`current()` → covered inside the above plus the two test-hook specs.
- AD-4 (shell Vitest): states; import with throwing `localStorage` succeeds; first launch writes and enters active; throwing first-launch write (stays booting, rethrows, `loaded()` throws); parse-ok writes nothing; rejected load (version-unknown 99 with version, `session-invalid-null.json` without) writes nothing, `current()`/`loaded()` shapes; `load()` after active and after rejected throws; dispatch throws while booting and while rejected; Undo writes post-Undo Session, `changed`; throwing session write rethrows, `game.state` same reference; paused no-op → `changed:false`, no write; accrue-only write (activeMs +1000); dispatch order (resume, advance 1000, Undo → written = Undo of the accrued Session, `activeMs` +1000); won Undo `unfinished`, Redo `finished:'won'`; gave-up Undo `unfinished`; `loaded()` unchanged after a changing dispatch; reactivity probe (first test: a dispatch changes `game.view`).
- AD-5: `crypto.getRandomValues` stubbed to 0 and to 4294967295 → first-launch Session has that seed and its written text parses ok.
- AD-7: `storage.ts` read null when absent, write throws through, remove deletes the key, `localStorage` looked up at call time (stub swapped between calls).
- AD-9: take before any resume = 0; from `resume(0)` fractional carry across takes; peek non-consuming; resume-while-running / pause-while-paused no-ops; pause gap: `resume(0)`, `pause(10)`, `take(100)` = 10, `resume(200)`, `take(205)` = 5.
- Exempt: none beyond those the rule-coverage rows assign to other entries.

**Acceptance Criteria:**
- Given a fresh browser context on android, when the app loads, then `wordcell:session` exists before any input, `JSON.parse` of it deep-equals `current().session`, its seed is an integer in 0…4294967295, and `loaded().session` is `null`.
- Given `session-place.json` seeded, when Undo then Redo are clicked, then after each click the stored Session deep-equals `current().session` and differs from the pre-click value, and Redo is disabled before the Undo and enabled after it.
- Given `session-place-free-letter-redo-tail.json` seeded and one Undo, when the renderer crashes (CDP `Page.crash`) and an unseeded page opens in the same context, then its `loaded().session` and `current().session` deep-equal the pre-crash stored Session, which differs from the fixture.
- Given the board, when inspected, then Undo and Redo are 44 × 44 circular icon-only buttons with accessible names Undo and Redo and `data-testid` `undo`/`redo`, and cells 3–10 render as `wordcell-<n>`.
- Given `npm run test:all` and `npm run test:screens` (after regenerating the baseline), then both exit 0 and the unit suite stays under 5 s.

## Implementation Notes

- Unit suite Duration: before 2.89 s (1429 tests); after 4.33–4.54 s (1464 tests) over five runs. The rise is almost all first-transform cost of `game.svelte.test.ts` (Svelte client runtime plus engine, ~2.4 s alone, 83 % transform); still under the 5 s AD-17 budget but with ~0.5 s headroom.
- `game.svelte.ts` declares `state` as `$state.raw<GameState>(…)` (not `let state: GameState = …`) so TypeScript does not narrow it to `booting` inside the module-level `$derived`.
- `newSeed()` returns `crypto.getRandomValues(new Uint32Array(1))[0]` directly (no `noUncheckedIndexedAccess` in tsconfig.app.json).
- Minimal board: Undo/Redo are 44 × 44 circular `button-secondary` with inline SVG arcs (`aria-hidden`); empty WordCells draw the DESIGN.md `wordcell.empty` 2px outline border; cell numbers use `cell-number` typography.
- Seed-1 column 1 literals (from `view(createSession(1), EN)`): ids `[24, 6, 49, 30, 25, 20, 48]`, letters `L D X O M I W`.
- Screenshot baselines: `--update-snapshots` alone rewrote only android (the desktop diff stayed under `maxDiffPixelRatio` 0.01), so both were regenerated with `--update-snapshots=all`; both PNGs inspected (heading, Undo/Redo circles right of the heading, `Seed 1`, 8 columns; android also shows the 8 empty WordCells labelled 3–10, desktop's viewport ends above them).
- Verification: `npm run test:all` exit 0 (lint, check, 1464 unit, build + size budget, dist-smoke 13 passed, e2e 40 passed / 30 skipped, pwa 12 passed); `npm run test:screens` exit 0 (2 passed); `git diff --stat src/engine fixtures` empty.

## Plan Change Log

## Review Triage Log

### 2026-09-30 — Review pass
- verdicts: 23 findings — high 0, medium 3, low 12, false 7, maybe-false 1
- findings:
  - `[false]` `[reject]` blind-hunter: Undo/Redo icon-only contradicts the ticket's text-labelled wording — the owner's invocation directed the DESIGN.md undoRedo component (SPEC E1) for the review log's open major; Design Notes record it.
  - `[medium]` `[patch]` blind-hunter: WordCell stacks never tested with cards — added `AD-17 WordCell cards render bottom → top as live cell cards` in `e2e/smoke.spec.ts` (redo-tail fixture: `wordcell-3` = `['42','0','28']`, each `data-place="cell"`, 52 live, 0 mirrors).
  - `[low]` `[patch]` blind-hunter: `replay-failed` rejection untested — added the AD-4 `session-invalid-s2-last-only.json` case (`{ reason: 'replay-failed', version: 1 }`, nothing written).
  - `[low]` `[patch]` blind-hunter: `finished: 'gaveUp'` never asserted — Redo after undoing a give-up has no redo data (throws R-71), so the case re-dispatches `giveUp` after the Undo and asserts `{ changed: true, finished: 'gaveUp' }`.
  - `[low]` `[patch]` blind-hunter: R-74 fresh-launch test does not check a fresh deal — now asserts `moves: []`, `activeMs: 0`, `gaveUp: false`, `cursor { index: 0, phase: 'idle' }`.
  - `[low]` `[patch]` blind-hunter: request test listens at page level only — now `page.context().on('request')`, attached before the first goto.
  - `[low]` `[reject]` blind-hunter: second context in the two-seeds test lacks the android device options — the seed comes from `crypto` regardless of emulation; the outcome under test cannot differ.
  - `[maybe-false]` `[reject]` blind-hunter: kill variant may crash before the renderer's localStorage write reaches the browser process — would need Chromium's DOMStorage IPC ordering vs the evaluate round trip; if true it is only a low test flake (passed every run); AD-17 prescribes this exact test.
  - `[low]` `[reject]` blind-hunter: dispatch runs three replays per changing dispatch — performance, not a defect; entry 4 measures dispatch cost (E8) and flags > 16 ms for epic 7.
  - `[low]` `[reject]` blind-hunter: hook types duplicated in `e2e/globals.d.ts` — the ticket prescribes the engine type import and "change both together".
  - `[low]` `[defer]` blind-hunter: `game.load()` throwing (first-launch quota/SecurityError) leaves a blank page — no AD-15 handler exists yet; entry 5 adds the fatal surface and halt.
  - `[false]` `[reject]` blind-hunter: `apply` gets `{ lang: EN }` instead of `dictionary: undefined` — identical at runtime; Design Notes record the choice.
  - `[low]` `[reject]` edge-case-hunter: a throwing write after `clock.take` loses the taken ms — a throwing write is fatal (entry 5 halts; nothing is written after), so the lost ms are never observable.
  - `[low]` `[defer]` edge-case-hunter: `load()` throwing → blank page — same root cause as the blind-hunter row above (entry 5).
  - `[false]` `[reject]` edge-case-hunter: clock `now` earlier than `startedAt` — callers pass `performance.now()`, which is monotonic (AD-9).
  - `[false]` `[reject]` edge-case-hunter: won → gaveUp transition unreported — from a finished status only `undo` applies (R-75, `command-status`), and it returns to playing; no command moves between finished statuses.
  - `[low]` `[reject]` edge-case-hunter: two fresh contexts may collide (2^-32) — rule-coverage R-74 row accepts it as probabilistic.
  - `[medium]` `[patch]` verification-gap: cell cards untested — grouped with the blind-hunter WordCell row; same patch.
  - `[false]` `[reject]` verification-gap (other): `rejectedWord` pass-through untested — the ticket moves that test to entry 9's Validate.
  - `[low]` `[patch]` intent-alignment: undoRedo shape asserted only by the screenshot — smoke now asserts `data-testid` `undo`/`redo` and 44 × 44 bounding boxes.
  - `[medium]` `[patch]` intent-alignment: WordCells with cards untested — grouped with the blind-hunter WordCell row; same patch.
  - `[false]` `[reject]` intent-alignment: entry 7 "reuses the comparison" claim dropped — Pass 4 minor 6: AD-6 `reconcileHistory` derives status itself; no behaviour lost.
  - `[false]` `[reject]` intent-alignment: `rejectedWord` untested — deferred to entry 9 by the ticket.

## Design Notes

Review-log resolutions (technical defaults; none changes functionality, UX or gameplay):
- Open major: Undo/Redo use DESIGN.md `top-bar.undoRedo` (44 × 44 icon-only `button-secondary`, circles, inline SVG ↶/↷, accessible names Undo/Redo) per SPEC E1, superseding the ticket's text-labelled wording; role/name locators are unchanged.
- Minors: (1) "load() after an active or rejected load throws" is its own case, separate from the throwing first-launch case; (2) clock pause-gap case added; (3) paused TABLE no-op → `changed:false`, nothing written; (4) "dispatch order" made concrete (resume, advance, Undo, written = post-Undo with accrued `activeMs`); (5) writes when `result.session !== before` (pre-accrue), which equals AD-4's "apply or accrue produced a new reference"; (6) no claim that entry 7 reuses the comparison — AD-6 `reconcileHistory` derives status itself; (7) font.spec locator `/^Seed \d+/`, unseeded; (8) the `Seed <n>` line replaces the meta line; (9) Undo/Redo disabled state asserted; (10) storage `remove` test; (11) request listener attached before the first `goto`; (12) store accessors named `game.loaded()` and `game.current()`, test-hook delegates; (13) `vi.unstubAllGlobals()` in `afterEach`; (14) reactivity probe is the first store test (verified at planning); (15) seed cases named `AD-5`; (16) ticket 1's deferred smoke gap closes here: smoke asserts column 1's ids and letters in order.
- `loaded().session` on success is the parsed Session (the stored shape; deep-equals `JSON.parse` of the key).
- `apply` gets `{ lang: EN }` (no dictionary key) — equivalent to `dictionary: undefined`, and safe under exact optional types.
- The fixture-text helper lives in `e2e/helpers/seed.ts` (single seeding module) with its self-test, so specs never hand-roll `readFileSync`.

## Verification

**Commands:**
- `npx vitest run` -- all pass, Duration < 5 s (before/after recorded).
- `npm run test:all` -- exit 0.
- `npm run test:screens -- --update-snapshots` then `npm run test:screens` -- exit 0 (Docker); if Docker fails, stop and report, never skip.
- `git diff --stat src/engine fixtures` -- empty.

**Manual checks (if no CLI):**
- Open both regenerated PNGs: heading, Undo/Redo circles top-right of the heading row, `Seed 1`, 8 columns, 8 empty WordCells labelled 3–10.

## Auto Run Result

- **Summary:** The store now starts `booting`, `main.ts` runs `game.load()` before mount (first launch deals `createSession(newSeed())` and writes it before going `active`; parse ok → `active`, nothing written; parse not ok → `rejected` with `{ reason, version? }`, nothing written), and `dispatch` runs take → accrue → apply → write-then-assign with the full `DispatchResult`. New stateless `storage.ts`, `seed.ts` and passive `clock.ts`. The AD-17 hook exposes `loaded()`/`current()`. The minimal board has DESIGN.md undoRedo buttons (44 × 44 circular icon-only, names Undo/Redo, `undo`/`redo` test ids, native `disabled`), the `Seed <n>` line and WordCells 3–10. Smoke, dist-smoke and screenshot specs seed `session-idle-fresh.json`; baselines regenerated in the container.
- **Files:** `src/shell/storage.ts`, `seed.ts`, `clock.ts` (new) with their tests; `src/shell/game.svelte.ts` (load, dispatch, states, loaded/current) and `game.svelte.test.ts`; `src/shell/test-hook.ts` and `e2e/globals.d.ts` (hook accessors); `src/main.ts` (load before mount); `src/ui/App.svelte` (minimal board); `e2e/game-store.spec.ts` (new R-73/R-74 flows); `e2e/helpers/seed.ts` + `helpers.spec.ts` (`fixture()`); `e2e/smoke.spec.ts`, `e2e/pwa/dist-smoke.spec.ts`, `e2e/placeholder.screens.spec.ts` (+ both PNGs), `e2e/pwa/font.spec.ts`, both test-hook specs.
- **Review-log items:** the open major is resolved (DESIGN.md undoRedo per SPEC E1, per the owner's invocation); all 16 Pass 4 minors are resolved in Design Notes and the code.
- **Review:** 23 findings. 6 patch entries applied (1 medium: cell cards untested, raised by three lenses; 5 low: replay-failed case, finished gaveUp, fresh-deal shape, context-level request capture, undoRedo size/test ids). 1 deferred (low: blank page when load throws, entry 5, raised twice). Rejected: 5 low (second-context device options, three replays per dispatch (E8 in entry 4), duplicated hook types (prescribed), ms lost on a fatal write, 2^-32 seed collision), 1 maybe-false (kill-variant IPC timing, low if true), 7 false.
- **Follow-up review recommended:** false (patched: high 0, medium 1, low 5).
- **Verification:** after the patches `npm run test:all` exit 0 (1465 unit tests, 4.40 s; dist-smoke 13, e2e 41 passed / 31 skipped desktop, pwa 12); `npm run test:screens` exit 0 (2 passed) against the regenerated baselines (inspected); `git diff --stat src/engine fixtures` empty.
- **Residual risks:** unit suite at 4.3–4.6 s against the 5 s AD-17 budget (the Svelte runtime transform for `game.svelte.test.ts` costs ~2.4 s); later shell rune tests may push it over. Screenshot regeneration needs `--update-snapshots=all` (the desktop diff can stay under the 1 % threshold). The ticket text still says text-labelled Undo/Redo; the owner-directed DESIGN.md component supersedes it.
