---
title: 'D-block controls, Validate and Confirm states'
type: 'feature'
ticket: '3'
created: '2026-10-08'
status: done
route: 'full'
route_source: 'auto'
baseline_revision: '50caa60afe067fc49f50c086e0c0c5ec95931984'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-d-block-controls-validate-and-confirm-states.md'
  - '{project-root}/_bmad-output/specs/spec-epic-5-tray/SPEC.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md'
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** The Composing control row's left slot is empty (no `−`/`+`, k or `⇄ Flip`, no k = 0 caption), Validate has no `flushSync` (F15/F21 guard) and its label ellipsizes at 16 px instead of shrinking to 14 px first (A9 4.2-m1), the tray control strings are missing from text.ts, and four specs carry private `tapAt` copies.

**Approach:** ControlRow.svelte gains the D-block controls and the caption (props from Tray in Composing only); ActionBar.svelte gains `flushSync` in `validate()` and a fitted label span; text.ts the strings; `tapAt` moves to e2e/helpers/board.ts; a new android spec e2e/tray-controls.spec.ts carries the story's AC. The story file (context) is the contract; this plan resolves the review log's open major and every unapplied minor (Design Notes).

## Boundaries & Constraints

**Always:** UI reads `GameView` (`draft.k`, `canDecK`, `canIncK`, `canFlip`, `canValidate`, `canConfirm`) plus dictionary state; every new button `onclick={act(…)}` dispatching through `game.dispatch` exactly once; strings only in text.ts (`−` U+2212); fail fast, no try/catch; tests named by id; no text-dependent px literals in tests (epic 4 F11), widths measured in-page, rect tolerance ≤ 0.5 px; Validate → Confirm stays one `<button>` node (no `{#key}`/`{#if}` swap).

**Never:** engine or shell source change; a re-entrancy flag for Validate (F15: if the F21 tests fail, stop and report in Implementation Notes); `flushSync` in Confirm; FLIP glides (entry 10); tile-selection clearing in `act()` (entry 5); moving any e2e helper other than `tapAt` (entry 14); editing the story, tickets.toml or spec files; pushing.

## I/O & Edge-Case Matrix

| Scenario | State | Expected |
|---|---|---|
| D-block | session-composing, list ready | `−` disabled at k 1, `+` enabled, k `1`, Flip enabled; `+` → k 2 (`destinationCount` 2); Flip → side `left`; Flip → `right`; `−` → k 1; stored `wordcell:session` deep-equals `current().session` after each; phase composing throughout |
| `+` bound | session-composing | presses until disabled; final k = `cards(page, 6)` count; coordinate `tapAt` on disabled `+` → stored text byte-identical |
| Validate saved (open major) | session-composing, real list | one click → exactly one `wordcell:session` write after it, its parsed value deep-equals `current().session`, phase `place`, `current().kind` active |
| Invalid line kept / cleared | cat/dog stub, fresh failure each | `tapAt` disabled `−` keeps line + byte-identical store; `+` clears; Undo, Redo → Composing, no line |
| Failure with redo tail | session-place + Undo, stub | store equal masking `activeMs` (`storedGame` pattern), Redo enabled; Redo, Undo → no line |
| k = 0 | session-idle-empty-column; tap column 2's last card, then column 1's empty placeholder | caption `Empty column: no cards join the word`, no −/+/Flip; nowrap/hidden/ellipsis; narrowed row → caption overflows, count whole |
| F21 | session-composing, list ready, spy armed | two sync `el.click()` in one `page.evaluate` → writes `[Place, commit]`, last move committed at cell 3, no halt; android double tap same |
| Label shrink | dictionary failing (`Word list unavailable`) | default width 16 px; content width between natural 15/16 → 15 px, no overflow; content = natural14 − 10 → 14 px, primary scrollWidth > clientWidth |

</intent-contract>

## Code Map

- `src/ui/tray/ControlRow.svelte` -- add optional prop `controls?: { k; canDecK; canIncK; canFlip }`; left slot: `k === 0` → caption `<span class="caption">`; else `<button class="round">{text.minus}</button><span class="k">{k}</span><button class="round">{text.plus}</button><button class="flip"><span aria-hidden="true">{text.flipGlyph}</span> {text.flip}</button>`; each `onclick={act(…)}` calling `game.dispatch({ type: 'setDestinationCount', k: k ∓ 1 })` / `{ type: 'flip' }`; `disabled` from the flags (keep `disabled={!canFlip}` though never true while rendered). Header comment updated.
- `src/ui/Tray.svelte:66-72` -- pass `controls` only when `place === undefined` (`draft.k`, `view.canDecK/canIncK/canFlip`).
- `src/ui/ActionBar.svelte` -- `validate()`: `game.dispatch(...)` then `flushSync()` (svelte); label `<span class="label" bind:this style:font-size>`; fit like `src/ui/tray/WordLine.svelte` `refit`/`measure` (temporary inline font-size on the span, inline box width) with `fitSize(measure, box, 16)` (`src/ui/layout/fit.ts`), box = button `getBoundingClientRect().width` − computed padding-left/right (fractional, S19); triggers: mount, label change (`$effect` on `primary.label`), ResizeObserver on the button, `document.fonts.ready`. Span inline, inherits line-height and weight 600.
- `src/ui/text.ts`, `text.test.ts` -- `minus: '−'`, `plus: '+'`, `flipGlyph: '⇄'`, `flip: 'Flip'`, `emptyColumn: 'Empty column: no cards join the word'`; AD-3 case pinning U+2212.
- `src/architecture-ad2-ad12-ad17.test.ts:116-250` -- AD-12 scan already covers ControlRow (all `src/ui/**/*.svelte`); no change expected.
- `src/shell/game.svelte.test.ts:619` -- add sibling `AD-4 feedback.rejectedWord is cleared on a changed dispatch (Redo)`: `active(JSON.stringify(place))`, `UNDO`, `VALIDATE` → `{ changed: false, rejectedWord: 'tan' }`, `REDO` changed → cleared (the `feedback` describe's dictionary mock lacks `tan`).
- `e2e/helpers/board.ts` -- export `tapAt(page, p: Point)` (android `touchscreen.tap`, else `mouse.click`; import `test`).
- `e2e/tap.spec.ts:54`, `column-phases.spec.ts:61`, `drag-interruptions.spec.ts:58`, `wordcell-view.spec.ts:31` -- delete local `tapAt`, import it; local `Point` types stay (entry 14).
- `e2e/helpers.spec.ts:345` `board helpers` -- add `AD-17 tapAt …` case (both projects): a fixed-position injected button, one tap at its centre → one click with that button as target.
- `e2e/game-store.spec.ts:138-167` -- `Row` gains optional 6th `ids` element; name prefix `${ids ?? 'R-38'} AD-3 …`; Need 3+ letters row `'R-36 R-38'`.
- `e2e/tray.spec.ts:35-58` `expectComposing` -- replace the empty-`.left` checks with: `−`, k text, `+`, Flip present; check callers (R-33 compact etc.) still pass. R-38 stub: test `R-38 (UI) a failed Validate replaces the word line…` (`LIST`, body `cat\ndog\n`).
- `e2e/tray-controls.spec.ts` -- new, android-only (`test.skip` as tray.spec.ts:13); local `expectSaved(page)` (stored parsed deep-equals `current().session`, pattern `e2e/board-phases.spec.ts:30`) and `storedGame` (column-phases.spec.ts:155). Helpers: `openFixture`, `cards`, `centre`, `tapAt`, `waitForDictionary`, `armStorageSpy`/`storageWrites`. Placeholder selector: as `column-phases.spec.ts` `placeholder()`.
- `e2e/board.screens.spec.ts` + `board-composing-{android,desktop}-linux.png` -- regenerate only these.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/text.ts`, `src/ui/text.test.ts` -- strings and AD-3 case.
- [x] `src/ui/tray/ControlRow.svelte`, `src/ui/Tray.svelte` -- D-block controls and caption (Design Notes styles).
- [x] `src/ui/ActionBar.svelte` -- `flushSync`, fitted label span.
- [x] `src/shell/game.svelte.test.ts` -- Redo sibling.
- [x] `e2e/helpers/board.ts`, the four specs, `e2e/helpers.spec.ts` -- move `tapAt`, add its case.
- [x] `e2e/game-store.spec.ts`, `e2e/tray.spec.ts` -- R-36 row id; `expectComposing` update.
- [x] `e2e/tray-controls.spec.ts` -- the tests of Design Notes "Tests".
- [x] baselines -- `npm run test:screens -- --update-snapshots` (or `=all -g "composing"` under the 1 % ratio) in the container; name each changed file in Implementation Notes; all others unchanged.

**Acceptance Criteria:**
- Given each matrix state on android, when the step runs, then the listed outcome holds.
- Given `npm run test`, when run, then the AD-12 act() scan has zero violations, `act.test.ts` cancel-before-handler stays green and both `rejectedWord` clear tests (Undo, Redo) pass.
- Given `rg -n "(function|const|let) tapAt" e2e`, when run, then the only hit is in `e2e/helpers/`.
- Given `npm run test:all` and `npm run test:screens`, when run, then both are green with only the board-composing baselines changed.

## Design Notes

**Styles:** `.round` 44 × 44 secondary circle (TopBar `.icon` look: surface-raised, 1 px outline border, ink-primary, ink-disabled when disabled, `touch-action: none`); `.flip` 44 px secondary pill, padding 0 12 px, button-label font; `.k` and `.caption` ui-label (500 14/20) ink-secondary; `.k` min-width so 1–2 digits don't shift (centred); `.left` `display:flex; align-items:center; gap:8px` (Flip after an extra 8 px); `.caption` `white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0`.

**Tests (e2e/tray-controls.spec.ts, android; names by id):**
1. `R-30 R-31 R-38 R-73 (UI)` D-block row of the matrix: locators `getByRole('button', { name: '−', exact: true })` / `'+'` / `'Flip'`; k = `.controls .k` textContent, asserting DOM order − < k < + (`compareDocumentPosition`); Flip asserts stored `destinationSide` and word line / tile order (`trayIds`) as `view()` gives them (record literals); `waitForDictionary(page, 'ready')` before the first edit; primary-action click last → `place`.
2. `R-31 R-73 (UI)` `+` bound row.
3. `R-73 R-38 (UI)` Validate-saved row (resolves the review-log open major: content equality, not only a count).
4. `R-38 R-71 R-31 (UI)` the four invalid-line rows, one test each, each opening its fixture fresh.
5. `R-31 (UI)` k = 0 row; narrowing via `page.addStyleTag` on `.controls .row` to count width + 48 px measured in-page; count `scrollWidth ≤ clientWidth`, right edge ≤ row right + 0.5.
6. `AD-11 (A9 4.2-m1)` label-shrink row plus a label-change trigger: session-composing with the list route held until released (`page.route` awaiting a promise, then `route.continue()`); narrowed so `Loading words…` sits between its natural 15/16 widths → 15 px; release → `Validate` at 16 px with the width unchanged. Natural widths from a clone or temporary inline font-size on the span; button width forced with `page.addStyleTag` (`!important`).
7. `R-38 F21 (UI)` both F21 rows; filter writes to `wordcell:session`, count those after the clicks; stored last move `reached: 'committed'`, `targetCell: 3`.
8. `R-31 R-30 (UI)` sizes: `−`/`+` boxes 44 × 44, Flip height 44, width ≥ 44 (±0.5).

**Review-log items:** open major → test 3. Minors (Result list): Redo sibling from session-place + Undo → Code Map; below-14 check on primary-action, 10 px under, exact 15 px, label-change trigger → test 6; 44 px sizes → test 8; Notes (sync two-click is the only reproducible race; Confirm has no flushSync) → Never; `tapAt` definition grep, R-38 test cited by name → AC, Code Map; k = 0 source column 2 and placeholder locator, count stays whole → matrix, test 5; LABELS id column → Code Map. Pass 3/4: caption/k typography, inline span inheriting line-height, one button node, ≤ 0.5 px, act() scan matches onclick-style attributes (ControlRow uses `onclick={act(…)}`), count read from the rendered `.count` (QU = 2 via `text.letters`), Flip `disabled` binding kept, failing-Validate double dispatch unobservable (success path counts writes), caption width measured in-page, k as its own `.k` element → Styles, Always, tests 1, 5.

## Verification

**Commands:**
- `npm run test:all` -- expected: all green.
- `npm run test:screens` (Docker) -- expected: green after one update run of the board-composing baselines.

## Implementation Notes

- All Execution tasks done; no engine or shell source changed (shell: test file only).
- Label span class is `primary-label`, not `label`: `.label` collided with the existing `.label` region selector in `e2e/layout.spec.ts` `AD-11 touch-action and user-select regions` (expects pan-y on every `.label`). Technical rename, no behaviour change.
- `−`/`+` use the button-label font (600 16/24) — the plan left their glyph size open; `.k` `min-width: 2ch`.
- `ControlRow` binds k through `{@const k = controls.k}` so the handlers read the rendered k (no `??` fallback).
- F21: both F21 tests pass. Found during verification: they also pass with `flushSync()` commented out, because Svelte 5's delegated `onclick` reads the re-derived `primary.onclick` at event time, so the second synchronous click already sees Confirm. `flushSync` stays as specified (F15); the tests guard the F21 outcome, not the `flushSync` line itself.
- Baselines: `npm run test:screens` was green without updating (the composing diff is under the 1 % ratio), so the two were regenerated explicitly with `-- --update-snapshots=all -g composing`. Changed: `e2e/board.screens.spec.ts-snapshots/board-composing-android-linux.png`, `board-composing-desktop-linux.png`; no other baseline changed.
- Verification: `npm run test:all` exit 0 (415 passed e2e, 12 pwa, 14 dist-smoke); `npm run test:screens` 10 passed; `rg -n "(function|const|let) tapAt" e2e` → only `e2e/helpers/board.ts`.
- Review fix: the F21 synchronous test now reads primary-action's `textContent` between the two `el.click()` calls and asserts `Confirm`; with `flushSync()` commented out it fails (verified, then restored), so the earlier note that the F21 tests do not guard `flushSync` no longer holds.
- Review fix: the same evaluate asserts the button after the first click is the same node (`querySelector(...) === el`), proving Validate → Confirm keeps one `<button>`.
- Review fix: in `src/ui/text.ts` the D-block comment and its five keys moved after `returnGlyph`, so the Placement strip comment sits back above the keys it describes.
- Review fix: the first AD-11 label-shrink test polls the label back to 16 px after removing the narrowing style tag (ResizeObserver growth).
- Review fix: the D-block test presses Flip (both times) and `−` with `tapAt(centre(...))` (a touch tap on android) instead of `locator.click()`.

## Plan Change Log

## Review Triage Log

### 2026-10-08 — Review pass
- verdicts: 20 findings — high 0, medium 2, low 8, false 8, maybe-false 2
- findings:
  - `[medium]` `[patch]` blind: no test fails without `flushSync` in `validate()` — F21 sync test now reads `textContent` = `Confirm` between the two clicks; fails with flushSync removed (verified, restored)
  - `[low]` `[patch]` blind: one `<button>` node across Validate → Confirm untested — same evaluate asserts `querySelector(…) === el`
  - `[low]` `[patch]` blind: text.ts D-block keys orphaned the Placement strip comment — block moved after `returnGlyph`
  - `[low]` `[patch]` blind: ResizeObserver growth back to 16 px untested (fonts.ready trigger too) — width-growth poll added; fonts.ready rejected (not reproducibly triggerable in Playwright, mirrors WordLine's untested trigger)
  - `[maybe-false]` `[reject]` blind: k = 0 caption may be cut at default width — ~36 chars at 14 px plus the count fits the 396 px row by estimate; settling needs a default-width scrollWidth read; if true only low
  - `[low]` `[patch]` blind: enabled `−`/Flip pressed only by mouse `click()` on android — D-block test presses them with `tapAt` (touch)
  - `[low]` `[reject]` blind: `.k` min-width (no shift) untested — cosmetic; k ≤ 6 here, one digit
  - `[false]` `[reject]` blind: plan logs empty and Code Map says `.label` — fix is a plan edit; the rename is recorded in Implementation Notes and logs fill at review
  - `[low]` `[reject]` blind: tapAt helper case has no disabled-probe case; listener left attached — tray-controls.spec.ts's disabled `−`/`+` taps exercise it; listener lives only in that test's page
  - `[low]` `[reject]` blind: k has no live region for screen readers — epic Boundaries put screen-reader labels in epic 6 (F9)
  - `[false]` `[reject]` edge: two −/+ clicks in one task reuse a stale k closure — Svelte 5 flushes in a microtask after each event task, so separate taps always see the new k; a same-task repeat sends the same `setDestinationCount` value, an engine no-op by value, never a throw
  - `[medium]` `[patch]` intent: F21 test does not prove flushSync is needed — grouped with the first row (same root cause); fixed by its patch
  - `[false]` `[reject]` intent: invalid-line clear proven in shell Vitest, not the browser — the AC assigns the per-dispatch proof to the shell `(Undo)`/`(Redo)` tests by design
  - `[false]` `[reject]` intent: disabled-`−` coordinate tap exercises the browser, not the app — the AC prescribes exactly that observation (R-31 "a press there dispatches nothing")
  - `[false]` `[reject]` intent: k read from `.k` instead of "text between − and +" — review-log minor chose `.k`; DOM order − < k < + asserted
  - `[low]` `[reject]` intent: exact 15 px vs [14,16) and shared measuring method — per review-log minor; an independent oracle adds machinery for no named harm
  - `[maybe-false]` `[reject]` intent: no test that only WordLine's triggers re-measure — "no extra triggers" is not observable without instrumentation; if true only low
  - `[false]` `[reject]` intent: behavioural tests android-only — AGENTS.md test split: (UI) on android first, desktop only for desktop-only behaviour
  - `[false]` `[reject]` intent: Confirm-throughout-Place a single-moment check — the AC says LABELS rows "kept green"; `canConfirm` is engine-tested
  - `[false]` `[reject]` intent: one button node untested — fixed by the second row's patch

## Auto Run Result

**Summary:** Composing control row now holds `−` k `+` (44 × 44 secondary circles, `setDestinationCount` k ∓ 1, disabled from `canDecK`/`canIncK`) and `⇄ Flip` (`flip`, glyph aria-hidden), each through `act()`; at k = 0 the ellipsizing caption `Empty column: no cards join the word`. ActionBar `validate()` calls `flushSync()` (F15/F21) and the primary label shrinks 16 → 14 px against the fractional content width before ellipsizing (A9 4.2-m1). Tray strings in text.ts; `tapAt` moved to e2e/helpers/board.ts.

**Files changed:** `src/ui/tray/ControlRow.svelte` (controls, caption); `src/ui/Tray.svelte` (Composing-only props); `src/ui/ActionBar.svelte` (flushSync, fitted `.primary-label`); `src/ui/text.ts`, `text.test.ts` (strings, AD-3 case); `src/shell/game.svelte.test.ts` (`(Redo)` rejectedWord clear); `e2e/helpers/board.ts`, `e2e/helpers.spec.ts` (`tapAt` + case); `e2e/tap.spec.ts`, `column-phases.spec.ts`, `drag-interruptions.spec.ts`, `wordcell-view.spec.ts` (import `tapAt`); `e2e/game-store.spec.ts` (R-36 row id); `e2e/tray.spec.ts` (`expectComposing` controls); `e2e/tray-controls.spec.ts` (new, 13 android tests); board-composing android/desktop baselines.

**Review-log items:** open major resolved (test `R-73 R-38 (UI) a successful Validate saves once…` deep-equals the one write to `current().session`); every unapplied minor resolved in Design Notes "Review-log items" (none left open).

**Review:** 20 findings; 5 patch entries (1 medium entry grouping 2 medium findings, 4 low), 0 deferred, rest rejected with reasons above. Follow-up review recommended: false (first pass, one medium patched, no high).

**Verification:** after patches `npm run test:all` exit 0 (unit 2085, e2e:dist 14, e2e 415 passed / 371 desktop skips, pwa 12; build in budget); `npm run test:screens` (Docker) 10 passed, only the two board-composing baselines changed.

**Residual risks:** the F21 Android double-tap timing is covered by Playwright's emulated touch, not a real device (epic 7 device checks); `document.fonts.ready` refit untested.
