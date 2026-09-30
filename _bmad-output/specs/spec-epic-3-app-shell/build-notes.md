# Build notes — epic 3

How-level guidance per capability. The spec rules, the spine ADs and EXPERIENCE.md are the
contract; these notes fix what they leave open. `[ASSUMPTION]` marks inferences.

## Spine notes (for the spine owner to fold in at the retrospective)

- AD-7: `parseSession`'s `activeMs` domain is 0…2^52 (E4), not the whole safe-integer range.
- AD-7: `checkRecord` adds `won` → `finalScore ≥ 0` and `longestWord.letterCount ≥ 3` and
  `= spelling.length` (E5); the `= spelling.length` check is v1-English-only and moves behind
  `LangData` when a second language arrives.
- Proposed epics: the Session-rejected message, the History notice with its Reset confirm and
  the overlays core move from rows 6 and 4 to row 3 (E2, E3).
- AD-9/AD-17: the gesture-cancel half of the hide assertion lands with the pointer controller
  in epic 4 (E10).
- AD-13: the reload cases are restated for epic 3 (CAP-7); the literal plain-overlay wording and
  the discriminating win → New game → back case (end sheet expanded) are re-proven in epics 4/6.
- AD-9/Q-38: a persisted `pageshow` halts when any key owner's `isStale()` is true (CAP-4).
- AD-4: the store exposes `haltCause: 'fatal' | 'another-window'` beside the state; `current()`
  stays `{ kind: 'halted' }` (AD-17).
- AD-16/AD-9: the dictionary load awaits the store's `whenVisible()` after the double rAF.

## As-built facts that bite (8e5462f)

- `src/shell/` holds only `dictionary.svelte.ts` (exports the `?url`; its side-effect import in
  `main.ts` keeps the asset emitted) and `test-hook.ts` (a frozen empty `window.__wordcell`);
  `e2e/globals.d.ts` and `src/shell/test-hook.ts` declare the hook type: change both together.
  `e2e/test-hook.spec.ts` and `e2e/pwa/test-hook.spec.ts` assert zero keys: update them when
  CAP-3 adds accessors (the hook object stays frozen and read-only).
- `main.ts` mounts `App.svelte` with `deal(1)`; `e2e/smoke.spec.ts` asserts `Seed 1` text (the
  minimal board keeps a `Seed <n>` line from the store's Session; `session-idle-fresh` is seed 1) and
  7/6 column counts; `e2e/placeholder.screens.spec.ts` has a seed-1 baseline;
  `e2e/pwa/dist-smoke.spec.ts` asserts 52 cards and no console errors. After CAP-3 a fresh load
  deals a random seed: seed these specs with `fixtures/session-idle-fresh.json` via `seedStorage`
  (dist-smoke too; it is hook-free, and `seedStorage` needs no hook) and regenerate the
  screenshot baseline with `npm run test:screens -- --update-snapshots` in the container.
- The heading `WordCell` is a locator in several specs; keep a heading with that name on the
  minimal board.
- Error codes live in `src/engine/errors.ts`; each new check adds one; tests assert the code via
  a per-file `expectEngineError` (AGENTS.md Known pitfalls).
- `parseHistory` returns `{ ok: true, history }`: read `result.history` (the `history` naming
  pitfall; AD-1 scan).

## Fixtures (with the CAP that first needs each)

- CAP-4: `session-invalid-version-unknown.json` (new, below); `session-invalid-null.json`
  (exists, `version-unreadable`); `session-invalid-s2-last-only.json` (exists, `replay-failed`:
  `moves[1]` is below committed but not last, a Q-41 redo-tail violation past `cursor.index`
  1). Only the unknown-version and replay-failed variants show a version number.
- CAP-6: `session-won.json` with the history absent: Undo (un-finish, nothing to remove), Redo
  (finish appends), Undo (removes). `session-gave-up.json` + `history-three-records.json` (its
  last record equals `gameRecord` of `session-gave-up`: seed 1, `gaveUp`, −530, 1000 ms): Undo
  removes it.
- CAP-7: `history-invalid-version-unknown.json` (new: a valid history with `version: 2`).
- CAP-9: `prefs-non-default.json` (new: `{ "version": 1, "animationSpeed": "slow", "showTimer":
  true }`); `prefs-unreadable.json` (new; Q-36 is not a §2 rejection, so prefs are exempt from the
  per-check `*-invalid-*` rule); `parsePrefs` gets S tests, one inline case per reason.
- CAP-10: "a finish recorded then undone" = `session-gave-up.json` + `history-three-records.json`,
  Undo, reload.

## CAP-1 Engine carry-ins and D1 export removal

- B6: in `commands.ts` `addFreeLetter`, `index === undefined` takes the append path whether or
  not the key is present; add the table row "`addFreeLetter` with `index: undefined` → same
  result as absent" (not a no-op: it appends).
- B7 test minors (`review-loop/2-12-build.md` Result): a literal-order R-42 case (left side,
  k ≥ 1, interleaved free letter); `expect(draftOf(s).reached).toBe('composing')` in
  `LABELLED['Idle with a pending draft']`; `destinationCount > 0` and
  `remainderOf(s).length > 1` guards in the `k = n − 1` / `k = 1` cases; `view.test.ts` imports
  `DICT` from `test-helpers.ts` instead of its local copy. The two plan-text minors are accepted
  (plans are historical).
- Fixture regeneration: one test per valid fixture builds the Session from `createSession(seed)`
  plus the scripted `accrue`/`apply` sequence that produced it (e.g. `session-gave-up` has
  `activeMs` 1000) (the scripts are recovered by reading each fixture's
  moves) and asserts `serializeSession(built)` deep-equals the file parsed; a fixture that no
  script reproduces is a bug to report, not to regenerate.
- Index exactness: an `AD-2 …` Vitest test in `src/architecture.test.ts` (engine tests may
  import only `vitest` and fixtures JSON, AD-1, so not `src/engine/index.test.ts`) builds a
  `ts.createProgram` over `src/engine/index.ts`, takes
  `program.getTypeChecker().getExportsOfModule(<its module symbol>)` and asserts the sorted names
  (types and values) equal one literal list. Values (AD-2): `accrue`, `apply`, `createSession`,
  `EN`, `gameRecord`, `HISTORY_VERSION`, `isRecorded`, `letterCount`, `parseHistory`,
  `parseSession`, `reconcileHistory`, `SESSION_VERSION`, `serializeHistory`, `serializeSession`,
  `statistics`, `view`. Types (as of 8e5462f, minus `Card`): `ApplyContext`, `ApplyResult`,
  `CardId`, `CellView`, `ColumnView`, `Command`, `Cursor`, `DestinationSide`, `DraftView`,
  `Face`, `GameRecord`, `GameView`, `LangData`, `LongestWord`, `Move`, `ParseHistoryResult`,
  `ParseSessionResult`, `Phase`, `PlaceView`, `Reached`, `ScoreHistory`, `Session`,
  `Statistics`, `Status`, `StructuralCheck`, `WordCellNumber`. The existing runtime-key test in
  `src/engine/index.test.ts` stays. The check took ~0.75 s in review; the plan records the unit
  suite time before and after, and if over the 5 s budget builds the program with `noLib` and
  `skipLibCheck` over engine files only. After this lands, the AGENTS.md pitfall "type exports are unchecked" is updated through
  `bmad-project-context`.
- D1 export: delete `deal` and `Card` from `index.ts`; keep the internal CardId deal the golden
  test uses; engine-internal uses may keep the `Card` type. `App.svelte` renders `view.columns`
  and `view.faces` (import type only); the first store cut (E7) is `game.svelte.ts` with `{ kind: 'booting' } | { kind:
  'active'; session }`, `createSession(1)` at module load into `active`, and `view` `$derived`;
  no storage, no dispatch yet. The smoke spec keeps passing unchanged.

## CAP-2 Parse hardening and engine cleanup

- New checks and fixtures: `session-invalid-active-ms-headroom.json` (`activeMs = 2^52 + 1`),
  `history-invalid-won-negative.json`, `history-invalid-letter-count-short.json`,
  `history-invalid-letter-count-mismatch.json` [ASSUMPTION names]; one code each in
  `errors.ts`.
- Fold: one `SESSION_FIELDS`/`MOVE_FIELDS` definition used by `serialize.ts` and `replay.ts`; one
  field-set checker; one `isUint32` and one `isSafeNonNegative` in an engine-internal module; one
  letter-count sum used by `scoring.ts` and `rules.ts`. Replace the "entry 10" citations
  (`replay.ts:147`, `rules.ts:286`) and cross-epic `CAP-n` citations with rule or AD ids.
- The E5 checks run after `longest-word-letter-count` (last in the history order, `errors.ts`),
  so existing fixtures such as `history-invalid-longest-word-spelling-empty.json` (empty
  spelling, `letterCount` 8) keep their codes.
- Keep every existing check code and its test; the fold must not change any parse result (the
  full fixture suite is the proof).

## CAP-3 Game store, storage, seed, clock module

- `storage.ts`: `read(key): string | null`, `write(key, text): void` (throws through),
  `remove(key): void` (CAP-6 Q-39 rollback); keys as constants `SESSION_KEY`, `HISTORY_KEY`, `PREFS_KEY`
  exported from `storage.ts` [ASSUMPTION]. No parsing in `storage.ts`.
- `seed.ts`: `newSeed(): number` per AD-5.
- Store API [ASSUMPTION names]: `game` state rune (`game.state`), `view` getter, `dispatch`,
  `newGame()`, `replay()`, `feedback`, `load()` called by `main.ts`, `halt(cause)` and
  `haltCause` (CAP-4), `registerBeforeHide` and `whenVisible` (CAP-5). `dispatch` computes `before = state.session`,
  `accrued = accrue(before, clock.take(performance.now()), EN)`, `result = apply(accrued, command,
  { lang: EN, dictionary })`; writes when `result.session !== before`; `changed` is
  `result.session !== accrued`. CAP-6 inserts the history reconcile between apply and the
  writes. Until CAP-8 the dictionary is `undefined` (Validate stays disabled), so the R-73
  per-dispatch test covers Undo, Redo and Confirm (from `session-place.json`); CAP-8 adds the
  Validate assertion to it. New game has its own test from `session-gave-up.json` (the primary
  action shows New game only when status ≠ playing); the rejected-root New game stays CAP-4.
- Test hook: `loaded()` returns the launch parse results as stored shapes (`JSON.parse` of the
  key for a success, `null` when absent, `{ rejected: reason }` otherwise); the history and prefs
  fields are added to `loaded()`/`current()` (and `e2e/globals.d.ts`) only in CAP-6 and CAP-9,
  never reported as `null` before (`null` means absent, AD-17); `loaded()` throws while
  `current().kind === 'booting'`, so restore specs wait for `current().kind !== 'booting'`.
  `current()` per AD-17 reports in-memory values (defaults for never-written prefs, `{ version:
  1, records: [] }` for never-written history).
- Minimal board markup: heading `WordCell`; `column-<n>` lists with live cards (`data-card-id`,
  `data-testid="card-<id>"`, `data-place="column"` or `"cell"`); `wordcell-<n>` stacks
  bottom→top; top row buttons `Undo` and `Redo` (role button, accessible names, testids);
  `primary-action`. Mirrors are not needed (no tray yet) [ASSUMPTION]. Cards in Composing and
  Place stay where `view` puts them (columns and cells are committed positions only).
- Measurement (E8): a Playwright script plays the recorded moves of the longest valid fixture
  forward and back with CDP `Emulation.setCPUThrottlingRate { rate: 4 }`, timing each dispatch
  with `performance.now()` inside the page; it is a standalone script under `scripts/` on
  Playwright's library API (no config edit), and the plan records max and median. A dispatch above 16 ms is recorded as a flag
  for the epic 7 device check, not optimised in epic 3 (spine Deferred).

## CAP-4 Fatal surface, rejected Session, single instance

- `main.ts` registers `error` and `unhandledrejection` first, before any await; the handler
  calls the store's `halt('fatal')`. `console.error` only there. The handlers stay in `main.ts`
  (AD-15; AD-1 fails a code file elsewhere in `src/`, so no `src/fatal-handler.ts`): static
  imports run before its body, so shell modules do only listener registration and `$state`
  initialisation at top level, no storage reads.
- Halt surface: halted before mount, `main.ts` mounts the standalone Blocking message for
  `haltCause` into `#app`; after mount `App.svelte` switches to it. `halt('fatal')` always sets
  `haltCause` `'fatal'`; `halt('another-window')` leaves an earlier `'fatal'`. Shell Vitest `AD-4`
  covers both orders.
- Font check: `document.fonts.load('600 1em "WordCell Serif"', 'W')` raced against a 30 s timer
  (a plain `setTimeout`, shell/main only); empty list or rejection throws. Playwright: route
  `**/*.woff2` to 404 → fatal surface, and `localStorage` empty after it (nothing written before
  the font check).
- Rejected: `{ kind: 'rejected', reason }`; the root renders the catalogue variant from `reason`
  (`version-unknown` / `version-unreadable` / `replay-failed`, the version as read). The store's
  `newGame()`: `clock.take` discarded, `createSession(newSeed())`, `active`, write, and stops
  there. From CAP-7 on, the UI's New game handler (rejected root and game-over primary action)
  then calls `overlays.resetForNewSession()` and, from the rejected root, pushes the deferred
  History notice (shell never imports `src/ui/`, AD-4).
- Q-38: `window` `storage` event with a `wordcell:` key, or `key === null` with `storageArea
  === localStorage` (clear), → `halted` plus the another-window message; `sessionStorage` events
  are ignored. The store registers the listener when the module is created (while `booting`); once
  halted, the load and every later boot step leave it halted: no fresh-Session write, no Board
  mounted over the blocking message (shell Vitest `AD-4` case: halt before the load). Playwright:
  page 1 seeded and `active`, then page 2 opens unseeded in the same context (its key already
  exists, so its boot writes nothing), then a dispatch in page 2 (e.g. Undo) halts page 1.
- Q-38 back/forward cache: a restored page never receives the `storage` events fired while it
  was cached. Each key's owner (game store for session, `history.svelte.ts` including after
  rollback/remove, `prefs.svelte.ts`) keeps its own last read or written text (`null` when
  absent) and exposes `isStale(): boolean` (rereads via `storage.read`); on `pageshow` with
  `persisted` (CAP-5 listener) any stale owner → `halted` with the another-window message.
  Shell Vitest `AD-4`: this window's own finish, Delete history or prefs change followed by a
  persisted `pageshow` does not halt. Playwright: the page under test changes a `wordcell:` key
  with `page.evaluate(() => localStorage.setItem(...))` (a document never gets its own storage
  events), asserts `active`, then `pageShow(page, { persisted: true })` → halted; nothing
  changed → stays `active`. The fatal and another-window surfaces share the Blocking message component; only the
  fatal one shows error text.
- New fixture `session-invalid-version-unknown.json` (`version: 3`, otherwise a valid Session),
  per AD-17 naming `<key>-invalid-<reason>.json`.

## CAP-5 Lifecycle

- Listeners registered by a store function `main.ts` calls after the load (CAP-10 pins the
  position). `pageshow` and `visibilitychange` both resume only when visible; hide handler order:
  before-hide callbacks, `take`, `pause`, then `accrue` and write while `active`.
- `whenVisible(): Promise<void>` resolves from the store's own `visibilitychange` listener, at
  once if already visible (AGENTS.md single owner); `main.ts` awaits it before
  `dictionary.load()`.
- A page loaded hidden: `startHidden(page)` in `e2e/helpers/lifecycle.ts` adds an init script
  defining configurable `visibilityState: 'hidden'` and `hidden: true` getters on `document`;
  its `e2e/helpers.spec.ts` test covers a following `showPage`.
- `pageHide(page)` alone writes `wordcell:session` with the accrued `activeMs` (P3).

## CAP-6 History store

- `scoreHistory` state, `reconcile(before, after)` returns whether it wrote and the Q-39
  `rollback` below; the store calls it
  with the accrued and resulting Sessions. While `unreadable`, `reconcile` writes nothing.
- Q-39: `history.svelte.ts` owns the snapshot and the write-back: `reconcile` returns a
  `rollback()` that restores the previous history text, or `storage.remove`s the key when it was
  absent (`remove` is named in `storage.ts`). If the Session write throws, the game store calls
  `rollback()` and rethrows. A rollback that itself throws propagates as-is (no nested catch,
  rule 6): the fatal surface shows that error and the store is halted.
- `scoreHistory.reset()` throws while the game store is halted (as AD-10 prefs; shell Vitest
  `AD-15`).

## CAP-7 Nav and overlays core

- `nav.ts` API [ASSUMPTION]: `launch(): Promise<void>`, `push(): void`, `pop(): void`,
  `register({ closedByBack, depth, beforeBack })`. `overlays.svelte.ts`: `open(id)` (push),
  `close(id)`, `closedByBack(depth)`, `depth`, `top`, `resetForNewSession()`, `isOpen(id)`.
- History notice: shown once per launch; on the rejected path deferred until New game. Reset
  confirm opens above it; `Delete history` calls `scoreHistory.reset()`, then closes the dialog
  and the notice top-down.
- "Back leaves the app" in Playwright: navigate from `about:blank` to the app, then `goBack()`
  lands on `about:blank`.
- Reload cases in epic 3: the only overlays (notice, confirm) exist only while the history is
  unreadable, so boot re-pushes the notice after any reload; the test asserts `{ wc: 1, launch:
  <new> }`, back → Board at `wc: 0`, back → `about:blank`, and no old-launch entry reached.
  AD-13's literal plain-overlay outcomes are re-proven with the epic 4/6 overlays.

## CAP-8 Dictionary

- `state` `$state`, `words` a `Set<string>` (split on LF, empty lines dropped; empty list →
  `failed`). `load()` is started by `main.ts` after the double rAF following the first paint of
  whichever root is mounted (rejected root included) and `await game.whenVisible()`, so a page
  loaded hidden starts it only once visible (Playwright's `startHidden` fakes only
  `visibilityState`; rAF keeps firing). `retry()` sets `loading`;
  a 404 at any fetch sets a `reloadOnNextRetry` flag; `retry()` then calls `location.reload()`
  unless `navigator.serviceWorker?.controller` is set.
- The store passes `dictionary.state === 'ready' ? words : undefined` in `ctx`.
- The 30 s timeout test waits until the route sees the request, then advances `page.clock`
  30 000 ms from there.
- Invalid word: `session-composing.json` spells `TAN`; that case fulfils `**/en*.txt` with a list
  omitting `tan`.

## CAP-9 Prefs

- `parsePrefs(text)` lives in `prefs.svelte.ts` (not the engine): exact fields `{ version: 1,
  animationSpeed, showTimer }`; failure reasons mirror `parseHistory`'s. Setters
  `setAnimationSpeed`, `setShowTimer` write at once; epic 6 calls them.
- `motion.ts` exports `duration(kind)` [ASSUMPTION] over `motion.baseMs` and the 120 ms reduced
  fade; no animation uses it until epic 5.

## CAP-10 Boot and restore suite

- One restore spec per AD-17 boundary × {hidden then reloaded, reloaded without a hide};
  snapshots via `current()` before reload and `loaded()` after; `seedStorage(..., { captureBoot:
  true })`. `loaded().session` deep-equals the snapshot's session except `activeMs` (not
  smaller); `loaded().history`/`.prefs` deep-equal `JSON.parse(__wordcellBoot['wordcell:<key>'])`
  (`null` when absent) and equal the snapshot only when the key was present before reload. First-paint proxy (AD-16): hold the `**/en*.txt` route; when the request arrives,
  `card-0` and `primary-action` are already in the DOM (the double rAF is S). Hidden launch:
  `startHidden(page)`, no `**/en*.txt` request until `showPage`. "A finish recorded then undone": seed `session-gave-up` with `history-three-records`
  (its last record is that finish), Undo, then reload: record still absent.

## CAP-11 Refactor sweep

- `playwright.base.ts` exports the shared `use`, `retries`, `reporter`, `forbidOnly`,
  `fullyParallel`, and the `android`/`desktop` device map; add it to `tsconfig.e2e.json`.
