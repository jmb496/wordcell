---
id: SPEC-epic-3-app-shell
companions:
  - rule-coverage.md
  - build-notes.md
  - ../../../docs/game-flow-spec.md
  - ../../planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md
  - ../../planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md
  - ../../planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md
  - ../../../AGENTS.md
  - ../../../docs/development-methodology.md
sources:
  - ../../initiative-wordcell-v1/epic-rules-engine/epic-rules-engine-retrospective.md
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# Epic 3 — App shell services

## Why

Foundation. The engine (epic 2) derives every position but nothing yet saves a game, restores
it after Android kills the app, loads the dictionary, measures active time or reports a failure.
Brief §6.2's promise (the player returns to the exact phase they left) and the §2 rule that a
save the app cannot read is never overwritten live here. This epic builds the shell services of
spine Proposed epics row 3 on a minimal board, so epics 4–6 add only presentation and input on
top of a store whose persistence, lifecycle and failure paths are already proven by Playwright.
It also absorbs the epic 2 retrospective's carry-ins B6–B11 and removes the transitional
`deal`/`Card` export (epic 2 SPEC D1). B10's ticketing half (each `tickets.toml` entry names its export/signature delta, sentence →
test ids and the owning ticket of any shared rule) is applied at epic 3 inception as the
recommended default, subject to the owner's B10 decision, like its step-log-folder half. `docs/game-flow-spec.md` is the rule text, the spine the shape; neither is reopened, and
D3 (the Q-43 same-seed record match) stays the owner's rule as is.

## Capabilities

In build order; each depends on those above it unless noted. `rule-coverage.md` maps every
app-shell sentence and shell-owned decision to its capability and test kind (Playwright here per
the AGENTS.md test split; shell Vitest tests are AD-named and never count as R-id coverage).
`build-notes.md` holds the how and the spine notes.

- **CAP-1** Engine carry-ins and D1 export removal (B6, B7, D1)
  - **intent:** The engine gaps the epic 2 retrospective left open are closed, and the board is
    fed by the game store instead of the transitional `deal`/`Card` export.
  - **success:** `apply` with `addFreeLetter { cell, index: undefined }` appends exactly like an
    absent `index`, with a command-table row; a test named `R-38 …` asserts `validate` throws its
    structural check code while R-36 fails; the four open test minors of
    `review-loop/2-12-build.md` land (`build-notes.md` CAP-1); an `R-76`/`R-84` test accrues time
    between a finish and its un-finish in AD-4 order (accrue, apply, reconcile) and the record is
    still removed; a Vitest test rebuilds each of the nine valid `fixtures/session-*.json` from a
    scripted `accrue`/`apply` sequence and asserts it deep-equals the parsed file; `index.ts` no
    longer exports `deal` or `Card`, and an `AD-2` Vitest test (TypeScript compiler API, in
    `src/architecture.test.ts`; the existing runtime-key test in `src/engine/index.test.ts`
    stays) fails if `index.ts` exports any name, type or value, beyond one literal list
    (`build-notes.md` CAP-1); `main.ts` and `src/ui/App.svelte` read `view` from `src/shell/game.svelte.ts` (first cut, E7); the `R-02 golden deal` literals stay
    byte-identical.

- **CAP-2** Parse hardening and engine cleanup (B8, B9) — may run in parallel with CAP-3
  - **intent:** Stored data outside the engine's headroom (E4) or that no play could produce (E5)
    is rejected at parse, statistics never
    hand out a stored object, and the duplicated validation code is folded before the shell
    relies on it.
  - **success:** `parseSession` returns `replay-failed` for `activeMs` above 2^52 (E4) and a
    Session at exactly 2^52 parses and survives one `accrue` of a day's ms; `parseHistory` returns
    `contents-unreadable` for a `won` record with a negative `finalScore` and for a `longestWord`
    whose `letterCount` is below 3 or differs from `spelling.length` (E5); each new check has its
    own `*-invalid-*` fixture, a unique code in `errors.ts` and a `§2 …` test asserting code and
    reason; `statistics(...).longestWord` is not the record's object (E6); the Session and Move
    field lists, the field-set checker, the uint32 and safe-integer domain checks and the letter-count sum each exist
    once, and no engine comment cites "entry N" or a `CAP-n` of another epic; every existing
    engine test passes unchanged except where it asserts a moved helper's import path.

- **CAP-3** Game store, storage, seed and the clock module (AD-4, AD-5 seed, AD-7, AD-9 clock)
  - **intent:** A game is loaded from and saved to local storage after every change, through one
    store whose dispatch is the only way a player action reaches the engine.
  - **success:** `storage.ts` (stateless, the only `localStorage` user), `seed.ts` (AD-5) and a
    passive `clock.ts` (`resume`, `pause`, `take`, `peek`; Vitest covers the fractional carry)
    exist; the store implements AD-4's four states, the load (absent key → `createSession(seed)`
    written at once; parse not ok → `rejected`, nothing written), `dispatch` in AD-4's order with
    `DispatchResult` and `feedback.rejectedWord`, and New game/Replay per AD-4; the test hook
    exposes `loaded()` and `current()` (AD-17); the minimal board (E1) renders from `view` with
    Undo, Redo and the primary action; Playwright proves R-73's save after every change (each
    Undo, Redo and Confirm (from a seeded Place fixture) is in storage before the next action;
    CAP-8 adds Validate to the same test; the game-over New game is its own test from
    `session-gave-up.json`), the kill variant
    (CDP `Page.crash`, new page, Session as last written) and R-74's first-launch deal of a
    uint32 seed; the smoke and screenshot specs seed a fixture instead of assuming seed 1; the
    dispatch cost is measured and recorded (E8).

- **CAP-4** Fatal surface, rejected Session and single instance (AD-15, AD-4, Q-37, Q-38)
  - **intent:** Every failure the shell cannot recover from stops all writes and shows one
    blocking message, a stored Session the build cannot read is shown as rejected and kept
    until New game, and a second live window stops saving.
  - **success:** `main.ts`'s `error`/`unhandledrejection` handlers set the store `halted`
    (`haltCause` `'fatal'`) and show the Blocking message `Something went wrong.` with the error text and `Reload`, mounting a
    standalone component when the UI is not mounted; the boot font check (30 s timeout) routes
    there; Playwright covers a font that fails to load (fatal before mount, nothing written), a
    `localStorage.setItem` that throws on a dispatch (fatal, no further write), each of the three
    Session-rejected variants (its catalogue text, with the stored version in the unknown-version
    and replay-failed variants, only New game, stored bytes unchanged across a reload, New game
    writes a fresh Session at once), and Q-38 with two pages (the first seeded and `active`; the second
    then opens unseeded in the same context, and a dispatch in it (e.g. Undo) halts the first
    with `WordCell is open in another window.` and `Reload`, and the first writes nothing
    after); the store registers the `storage` listener at module creation (while booting), and
    once halted the load and every later boot step leave it halted (no fresh-Session write, no
    Board mounted over the blocking message; shell Vitest `AD-4` covers a halt before the load);
    the store exposes `haltCause: 'fatal' | 'another-window'` beside the AD-4 state; a fatal
    error always replaces the surface and a later another-window halt never replaces a shown
    fatal message (shell Vitest `AD-4`, both orders); every string comes from `src/ui/text.ts`.

- **CAP-5** Lifecycle and visible-time clock (AD-9, R-76)
  - **intent:** Active time grows only while the game is playing and the page is visible, and
    hiding the app flushes the Session.
  - **success:** the store is the only `visibilitychange`/`pagehide`/`pageshow` listener,
    registered after the load, with `clock.resume` iff visible; hide runs the registered
    before-hide callbacks, then `take` + `pause`, then `accrue` and an unconditional
    `wordcell:session` write while `active`; `registerBeforeHide` accepts several callbacks in
    order; Playwright (`page.clock`, `e2e/helpers/lifecycle.ts`) proves `hidePage` alone produces
    exactly one `wordcell:session` write, `pageHide(page)` alone writes it with the accrued
    `activeMs`, time accrues while visible and playing and not while
    hidden, won or given up, a page loaded hidden does not grow `activeMs` until `showPage`; the store's
    `whenVisible(): Promise<void>` resolves from its own listener (at once if visible); and
    New game starts at `activeMs = 0` with the discarded `take` (Replay's `activeMs = 0` and
    discarded `take` are shell Vitest `AD-4` here, Playwright in epic 6); on `pageshow` with
    `persisted` the store halts with the another-window message if any key owner's `isStale()`
    reports its `wordcell:` key changed since this instance last read or wrote it (Q-38;
    Playwright: the page under test sets a `wordcell:` key itself, is still `active`, then
    `pageShow(page, { persisted: true })` halts it; with nothing changed it stays `active`).

- **CAP-6** Score-history store and finish writes (AD-6 shell, R-84, Q-33, Q-39)
  - **intent:** Finishing or un-finishing a game updates the stored score history in the same
    task as the Session, and an unreadable history is never overwritten silently.
  - **success:** `history.svelte.ts` exports `scoreHistory` with AD-6's `ok | unreadable` state,
    `reconcile`, `reset`, derived `statistics` and `recorded`; a finish and an un-finish write
    history first, then Session; a failing Session write restores the previous history bytes, then
    throws to the fatal surface (Q-39); while unreadable a finish writes the Session only and the
    stored history bytes stay unchanged; `loaded()`/`current()` report the history per AD-17;
    Playwright (Undo/Redo on the won and given-up fixtures) proves the record appended and removed,
    that on a fresh launch `wordcell:history` stays absent after the load and after non-finishing
    dispatches and New game and is first written by a finish (AD-7),
    the Q-39 write-back, the unreadable no-overwrite, and that New game never touches the history
    (Q-29; Replay's untouched history is shell Vitest `AD-4` here, Playwright in epic 6);
    `scoreHistory.reset()` throws while the store is halted (shell Vitest `AD-15`).

- **CAP-7** Nav adapter, overlays core, History notice and Reset confirm (AD-13, E2, E3)
  - **intent:** Android back closes the topmost surface and otherwise leaves the app, and an
    unreadable score history is reported once per launch with a way to reset it.
  - **success:** `nav.ts` is the only History API user with AD-13's launch rewind, launch id,
    queued push/pop, pending-pop counting, stale-launch and Forward rules; `overlays.svelte.ts`
    holds the entry stack (E3); the History notice (catalogue text, its three version variants)
    pushes one entry at boot, after New game when the Session was rejected; `Not now` and back
    close it; `Reset history` opens the confirm dialog, `Keep it` returns to the notice and
    `Delete history` writes `{ version: 1, records: [] }` and closes both in order; Playwright
    covers each, back while the Reset confirm is open closing only the confirm (notice stays,
    `wc: 1`, as `Keep it`), AD-13's reload cases as they hold in epic 3 (the notice exists only
    while the history is unreadable, so boot re-pushes it: with the notice open, or the notice
    plus the confirm, reload → the rewind reaches the base entry, only the notice is re-pushed,
    `history.state` is `{ wc: 1, launch: <new> }`; the first back closes the notice leaving the
    Board at `wc: 0`, the next back leaves the app; stale entries of the old launch are not
    reachable by back; AD-13's literal plain-overlay reload wording is re-proven with the epic
    4/6 overlays), AD-13's win → New game → back leaves the app as a smoke check (Undo then
    Redo onto the winning commit from `session-won`, then the game-over New game; the
    discriminating case with the end sheet expanded is epic 6), and the Session-rejected
    root pushing no entry.

- **CAP-8** Dictionary load, retry and Validate (AD-8, R-38, Q-42) — needs CAP-3 only
  - **intent:** The dictionary loads after first paint, a failure is shown and retried without
    blocking play, and Validate is usable only when the word list is ready.
  - **success:** `dictionary.svelte.ts` exposes `state` and the `Set<string>`; the fetch starts
    after the double `requestAnimationFrame` following the first paint of whatever root is
    mounted (the rejected root included), and `main.ts` then awaits the store's `whenVisible()`,
    so a page loaded hidden starts it only once visible; times out after 30 s (`AbortController`), maps a
    non-OK response, network error or empty list to `failed`; `retry()` refetches in place; after
    any 404 the banner's next Reload performs `location.reload()`; the test hook exposes
    `dictionaryState()`; the primary action enables Validate iff `view.canValidate && state ===
    'ready'`, with the catalogue labels; Playwright (route `**/en*.txt`) covers loading, a valid
    and an invalid word from `session-composing.json` (`TAN`; the invalid case's route serves a
    list without `tan`) (the invalid-word line cleared by the next
    changing dispatch, the Validate dispatch stored before the next action in CAP-3's R-73 test),
    a failed load showing the banner with Undo and Redo into Place still working, retry success and repeat failure, the 30 s timeout with `page.clock`, and the 404 →
    reload tap.

- **CAP-9** Preferences and motion (AD-10, Q-36, spec §7.10) — needs CAP-3 only
  - **intent:** Animation speed and Show timer are stored apart from the game, survive New game
    and Replay, and drive one motion source for JS and CSS.
  - **success:** `prefs.svelte.ts` is the only `wordcell:prefs` user: `parsePrefs`, AD-7 defaults
    (`normal`, `false`), absent → not written, unreadable or unknown version → defaults with no
    message and overwritten on the next change (Q-36), writes on change only, a write while
    `halted` throws; `motion = { baseMs, reduced }` mirrors `--wc-base-ms` (`<n>ms`) and
    `--wc-reduced` (`1` or `0`) onto the root; `src/ui/motion.ts` is the only source of WAAPI durations and the 120 ms reduced
    fade; `loaded().prefs` per AD-17; Playwright proves seeded non-default prefs set
    `--wc-base-ms`, survive New game and reload, and unreadable prefs give 180 ms with the key
    untouched until a change.

- **CAP-10** Boot order and restore boundaries (AD-16 minus SW, AD-17)
  - **intent:** Launch runs one fixed sequence, and every restore boundary the brief names
    returns the player to the exact state they left.
  - **success:** `main.ts` runs AD-16's order (nav launch → font check → prefs → Session and
    history → lifecycle listeners and resume → boot surfaces → mount → dictionary after first
    paint), with a Playwright case per ordering promise (nothing written before the font check;
    rejected root before the History notice; dictionary requested only after first paint: with
    the `**/en*.txt` route held, `card-0` and `primary-action` are in the DOM when the request
    arrives, the double rAF itself being S; a `startHidden` page makes no `**/en*.txt` request
    until `showPage`); the
    restore-boundary suite runs each AD-17 fixture (Place with a free letter, a non-default order
    and a redo tail; `gaveUp`; a finish recorded then undone; non-default prefs) under "hidden then
    reloaded" and "reloaded without a hide", asserting `loaded().session` deep-equals the snapshot `current().session` except `activeMs`
    (not smaller), and `loaded().history`/`.prefs` deep-equal `JSON.parse` of
    `__wordcellBoot['wordcell:<key>']` (`null` when absent), equal to the snapshot only when the
    key was present before reload (`current()` reports in-memory values: defaults for
    never-written prefs, `{ version: 1, records: [] }` for never-written history).

- **CAP-11** Refactor sweep and shared Playwright config (B11, E9)
  - **intent:** The epic ends with its duplication folded and the three Playwright configs built
    from one base.
  - **success:** `playwright.base.ts` holds the settings the three configs share and each config
    imports it; `npm run test:all` and `npm run test:screens` pass; the sweep's findings are
    applied or recorded with a reason in its plan.

## Constraints

- One writer (AD-4): outside `src/engine/` and tests only `game.svelte.ts` calls `apply`,
  `accrue` or `createSession`; no component holds game state; New game and Replay go through the
  store, not `dispatch`.
- Single owners (AGENTS.md Conventions): `localStorage` only in `storage.ts`; the History API and
  `popstate` only in `nav.ts`; lifecycle listeners only in `game.svelte.ts`; `wordcell:prefs`
  only through `prefs.svelte.ts`; `wordcell:history` only from `reconcile`/`reset`;
  `wordcell:session` only from the game store; overlay open state only in
  `overlays.svelte.ts`; catalogue strings only in `src/ui/text.ts`; `console.error` only in
  `main.ts`'s handler. `src/architecture.test.ts` enforces what it scans; the rest is reviewed.
- Fail fast (rule 6): no try/catch below `main.ts` except where AD-4 (Q-39 write-back, then
  rethrow), AD-8 (fetch outcomes → `failed`) or Q-36 (`parsePrefs` catching `JSON.parse`)
  specify one; unreadable prefs are the one silent
  default (Q-36).
- A stored Session is never written while `rejected` or `halted`, and a stored history never
  while unreadable except by `reset` (spec §2, AD-4, AD-6).
- The deal never changes: the `R-02 golden deal` literals stay byte-identical; any ticket
  touching `deal.ts`, `buildDeck` or `lang/` runs it before and after (AGENTS.md Policy).
- `index.ts` exports exactly AD-2's list and its types after CAP-1 (the CAP-1 compiler-API
  test's literal list); nothing else crosses the boundary.
- Test split (AD-17): every `rule-coverage.md` row whose Kind includes P3 has a passing
  `android` Playwright test named with its id; P4–6 and P7 rows carry to those epics' specs; shell and UI Vitest tests are named `AD-n` and never count
  as R-id coverage; engine tests keep inline `Set` dictionaries and the unit suite stays under
  5 s.
- Seeding only through `e2e/helpers/seed.ts` `seedStorage` from root `fixtures/` (AD-17);
  `*-invalid-*` fixtures only in rejection tests.
- No new runtime dependency; test helpers stay in `e2e/helpers/` with tests in
  `e2e/helpers.spec.ts`.

## Non-goals

- Gestures, drag, tap-select, the pointer controller and its `cancel` registration, layout
  geometry and band anchoring, the top bar and action bar design, cards beyond the minimal board
  (epic 4).
- Tray, tiles, free-letter UI, the placement strip, FLIP and fly-to-cell animations (epic 5).
- Menu, New game/Replay confirm dialogs, end sheet (its history block and its boot push before
  the History notice, AD-16), Statistics,
  Preferences and How to play panels, the menu's history dot, keyboard map, timer display,
  screen-reader live region (epic 6).
- Service-worker registration, `swState()`, `precacheComplete()`, `requestPersistence()`, the
  offline test and device checks (epic 7).
- Reopening Q-43 (D3) or any AD beyond the amendments listed in `build-notes.md` Spine notes; a
  dictionary change; migration code.

## Success signal

`npm run test:all` is green with every `rule-coverage.md` row whose Kind includes P3 covered by
a passing `android` Playwright test named with its id (P4–6 and P7 rows carry to those epics'
specs); on the minimal board, a seeded Place Session with a
free letter, a non-default order and a redo tail survives a hide-and-reload, a plain reload and a
renderer crash with every field equal (and `activeMs` not smaller), on a won game Redo onto the win
appends its record (history written before Session) and Undo removes it, and a Session saved in format
version 3 shows the rejected message and is still stored byte for byte after a reload.

## Assumptions

- Shell Vitest tests run in node with `vi.stubGlobal` fakes for `localStorage`, `document`,
  `performance` and `requestAnimationFrame`; no DOM library is added. That Vitest
  `resolve.conditions: ['browser']` makes rune modules reactive there is `unverified`: the first
  CAP-3 shell test is a probe (a `$state` change updates a `$derived` read); if it fails, a
  separate Vitest project for `src/shell/**` and `src/ui/**` runs with the client transform.
- The minimal board is disposable: epics 4–6 may replace any of its markup, keeping the test ids
  and roles the specs locate.
- No owner question arose: every behaviour here is fixed by spec §2, R-38, R-73, R-74, R-76,
  R-84, Q-29, Q-33, Q-36–Q-43, AD-4–AD-17 and the EXPERIENCE.md catalogue; E2 moves two surfaces
  between epics without changing their text or behaviour.

## Decisions

Technical defaults under the owner's standing rule (2026-09-28); none changes functionality, UX
or gameplay. Rationale in `build-notes.md`.

| # | Question | Decision |
| --- | --- | --- |
| E1 | What does the "minimal board" hold? | `GameView` columns and WordCells with live card elements (AD-14 attributes), Undo and Redo (`data-testid` `undo`/`redo`, enabled by `canUndo`/`canRedo`), `primary-action` (Validate in Idle and Composing per AD-8 and the DESIGN.md labels; Confirm in Place per `canConfirm`; New game when status ≠ playing), the invalid-word line, the dictionary-failed banner, the Session-rejected root, the History notice and its Reset confirm, and the fatal and another-window Blocking messages, in the DESIGN.md components and tokens. No gestures, menu, end sheet or timer. |
| E2 | Spine row 6 lists the Session-rejected message and the History notice. | Epic 3 builds both complete per EXPERIENCE.md (owner prompt names them); epic 6 keeps the end-sheet history block, the Statistics message and the menu dot. |
| E3 | Overlay store is spine row 4, but nav needs a consumer. | Epic 3 creates `overlays.svelte.ts` with the entry stack, top-down `close`, `closedByBack`, the depth getter and `resetForNewSession`; epic 4 adds tail selection and end-sheet states. |
| E4 | B8: a parsed `activeMs` near 2^53 overflows on the first `accrue`, crashing on every launch. | `parseSession` rejects `activeMs > 2^52` as `replay-failed`: a headroom bound (≈ 142,000 years above it before the safe-integer limit), not a value `accrue` can never reach. History records keep the safe-integer domain. Spine note for AD-7. |
| E5 | B8: `checkRecord` accepts impossible records. | A `won` record needs `finalScore ≥ 0`; `longestWord.letterCount ≥ 3` and `= spelling.length` (English: `qu` is two characters and two letters, R-85); `= spelling.length` is v1-English-only and moves behind `LangData` when a second language arrives. |
| E6 | B8: `statistics` returns the record's own `longestWord`. | Return a copy. |
| E7 | CAP-1 removes `deal` before storage exists. | The first store cut boots `active` with `createSession(1)` and no storage; CAP-3 replaces it with the load and moves the smoke and screenshot specs to a seeded fixture (baselines regenerated in the container). |
| E8 | B9/D11: about five replays per dispatch. | CAP-3 measures dispatch time on a long scripted game in Playwright `android` with 4× CPU throttling (a standalone script under `scripts/` on Playwright's library API, no config edit), results in the ticket plan; a dispatch above 16 ms is recorded as a flag for the epic 7 device check, not a trigger to optimise in epic 3 (spine Deferred). |
| E9 | B11: shared Playwright config base. | `playwright.base.ts` in CAP-11, unless an earlier ticket must edit a config, which then does it first. |
| E10 | AD-9/AD-17 name the gesture `cancel` on hide. | Epic 4: `registerBeforeHide` exists and is tested with a stub callback; the gesture-cancel Playwright assertion comes with the controller. |
| E11 | AD-16's last steps. | Service worker and `requestPersistence()` stay epic 7; epic 3's boot ends when the dictionary fetch settles. |
