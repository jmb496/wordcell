---
title: 'FLIP module and button-driven glides'
type: 'feature'
ticket: 10
created: '2026-10-10'
status: done
baseline_revision: '033770be87f3fb51d8fb1f9dad4cd9257b7209df'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-flip-module-and-button-driven-glides.md'
  - '{project-root}/_bmad-output/specs/spec-epic-5-tray/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-epic-5-tray/build-notes.md'
warnings: ['oversized']
deferred:
  - summary: >-
      Reduced-motion FLIP wiring (main.ts reduced getter to the opacity fade) is verified only through Vitest fakes.
    evidence: |-
      e2e/flip.spec.ts runs at normal motion only; flip.test.ts injects reduced and duration. The ticket AC assigns the reduced fade to S; entry 11's reduced-motion Confirm P5 runs the same getter.
    location: >-
      src/main.ts createFlip deps
    severity: low
  - summary: >-
      The controller's finishGlides/glidesRunning wiring in main.ts is not exercised end to end (a press, back or hide during a FLIP glide).
    evidence: |-
      controller.test.ts covers the call order with fakes only; no e2e presses, goes back or hides mid-glide. The ticket Notes hand the press-path P5 to entry 16.
    location: >-
      src/main.ts:149-150, src/ui/gestures/controller.ts pointerdown/cancel
    severity: medium
---

<intent-contract>

## Intent

**Problem:** Cards jump between places on every button-driven move (Validate, Undo, Redo, Flip, `−`/`+`); AD-14 and SPEC CAP-8 (F6, F7, F17, F22, F27) require one FLIP module that glides the `.face` inside each live element, gate-counted, with the kind from the command and its `DispatchResult`.

**Approach:** New `src/ui/flip.ts` exactly as the ticket Description specifies (`createFlip(deps)`, install setter, `capture()`, `play()`, `finishAll()`, `running()`, the pure kind function and pure planner); main.ts creates and installs it and passes `finishGlides`/`glidesRunning` to the controller; ActionBar, TopBar and ControlRow wrap `game.dispatch` in capture/play.

## Boundaries & Constraints

**Always:** The ticket Description and Acceptance Criteria are the contract; this plan only resolves what they leave open. Wrappers (`[data-card-id]`) and mirrors (`[data-mirror-of]`) are never animated or classed by flip. Durations only through the injected `duration` (motion.ts). Every throw is a plain `Error` with an `AD-14 …` message (rule 6). Test names start with the id (`AD-14 …`, `R-70 …`); UI Vitest never counts as R-id coverage. Every Svelte handler stays an `act(…)` call (AD-12 scan, `src/architecture-ad2-ad12-ad17.test.ts:117-263`; named functions inside `act()` pass).

**Never:** No controller release capture/play (entry 16), no fly-to-cell animation or winning guard (entries 11, 13), no tray-row re-layout or F24 `scrollReset` in capture (entry 12), no engine or shell source change, no new `data-testid`, no change to New game/Replay/restore paths (they never call capture/play), no screenshot baseline change.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Validate | Composing → Place | D faces glide column → strip (band change, tile area `wc-drag-tiles`), S faces glide if their tray index changed; block mirrors vanish at once | — |
| Undo Place → Composing | `undoRedo` | D faces glide strip → column, block mirrors reappear at once | — |
| `+` block right | k 1 → 2 | no live face moves → no animation | — |
| Failed Validate / setTarget / giveUp | `changed: false` validate, or empty-set command | kind `null`, no animation | — |
| Confirm / committing Redo | `flyToCell` | capture consumed, no animation, no gate count (entry 11) | — |
| Reduced motion | any animated face | opacity 0 → 1 at settled rect over `duration(kind)`, no translate, no `wc-glide` | — |
| Second press mid-glide | Undo during Undo glide | `act()` → `cancel()` → `finishGlides()`; capture's own `finishAll()`; first glide's late `onfinish` is a no-op | — |
| Misuse | capture twice, play without capture, before install, second install, null root, no view, missing/duplicate CardId, unknown `data-place`, `cancel` event | — | throws `Error('AD-14 …')` |

</intent-contract>

## Code Map

- `src/ui/flip.ts` (new) -- the module. Imports only: `import type { Command, Phase } from '../engine/index'`, `import type { DispatchResult } from '../shell/game.svelte'`, `flushSync` from `svelte`, `import type { MotionKind } from './motion'`, `import type { Gate } from './gestures/gate'`, `DRAG_TILES`, `GLIDE` from `./gestures/classes`, `translate` from `./gestures/fly-back`. Model the settle/oncancel/finish pattern on `src/ui/gestures/fly-back.ts` (`createFlyBack`: `settled` flag, `finish()` then synchronous settle, `oncancel` throws) and the install setter on `src/ui/act.ts` (`setController`).
- `src/ui/gestures/classes.ts` -- add `export const GLIDE = 'wc-glide';` with a one-line comment; extend the header list.
- `src/ui/Card.svelte` -- `.face` gains `isolation: isolate` (so `.mark`/`.lock` z-index 1 stay inside their face); the `wc-glide` CSS is not here but beside each `wc-drag-layer` rule (next item).
- `src/ui/Column.svelte:220`, `src/ui/WordCellRow.svelte:116`, `src/ui/tray/TileRows.svelte:103` -- beside each `.face.wc-drag-layer` rule add the `.face.wc-glide { z-index: 1; }` rule (no shadow) with the same selector prefix; comment points to gestures/classes.ts. `.tiles:global(.wc-drag-tiles) { overflow: visible; }` (TileRows.svelte:102) is reused as is.
- `src/main.ts` -- after `createGate` and before `createController`: `const flip = createFlip({ gate, root: () => target.querySelector('main'), reduced: () => prefs.motion.reduced, phase: () => game.view?.phase, duration })`; `setFlip(flip)`; pass `finishGlides: () => flip.finishAll()`, `glidesRunning: () => flip.running()` in the controller deps. Extend the AD-11 boot comment.
- `src/ui/gestures/controller.ts` -- `ControllerDeps` (line 191) gains `finishGlides(): void` and `glidesRunning(): boolean` (doc comments citing SPEC F6, AD-14); `pointerdown` (line ~1188): `const inFlight = flight.running() || parting.running() || deps.glidesRunning();` and inside `if (inFlight)` add `deps.finishGlides();` after `parting.finishAll()`; `cancel()` (line ~1513): `deps.finishGlides();` right after `flight.finishFlight();`. Update the two comments. Keep the `event.button !== 0 || press !== null` early return before `inFlight` (Design Notes).
- `src/ui/gestures/controller.test.ts` -- the one harness (`createController(gate, {...})`, line ~593) gains `finishGlides: () => order.push('finishGlides')` and `glidesRunning: () => glides.running` (a harness-local mutable `{ running: false }` returned from setup). `order` (line 32) already logs gate enter/leave.
- `src/ui/ActionBar.svelte` -- `validate()`: `capture(); const result = game.dispatch(command); flushSync(); play(command, result);` (keep the existing `flushSync`, F15/F21); `confirm()`: capture/dispatch/play (kind `flyToCell`, no animation yet). `newGame` untouched.
- `src/ui/TopBar.svelte` -- `undo()`/`redo()`: `overlays.deselect()` first, then capture/dispatch/play.
- `src/ui/tray/ControlRow.svelte` -- the three inline `act(() => game.dispatch(…))` handlers become script functions (`setK(k)`, `flipBlock()`) that capture/dispatch/play; keep `act()` in markup.
- `src/ui/flip.test.ts` (new) -- UI Vitest (node env). Mock `svelte` `flushSync` as controller.test.ts:55-66 does (a hook the test sets, run then cleared). Fake root: `querySelectorAll('[data-card-id]')` returns fake wrappers with `getAttribute('data-card-id'|'data-place')` and `querySelector('.face')` → fake face (`getBoundingClientRect`, `classList`, `animate()` returning a fake Animation with `finish()`, `onfinish`, `oncancel`, `effect`/keyframes and options recorded); `querySelector('[data-band="…"]')` → band fakes; `querySelector('[data-band="tray"] .tiles')` → fake tiles. Fake gate counting enter/leave. Install tests use a fresh module per test (`vi.resetModules()` + dynamic import, as act.test.ts `load()`).
- `e2e/flip.spec.ts` (new) -- the P5 tests (android; `test.skip` on other projects as the other android-only specs do). Reuse `openFixture` (`e2e/helpers/board.ts:22`, with `prefs: 'prefs-non-default'`), `trayIds` (board.ts:82), `tapAt`/`centre`.
- Read only, do not change: `src/ui/act.ts`, `src/ui/motion.ts`, `src/ui/gestures/fly-back.ts`, `src/ui/gestures/gate.ts`, `src/shell/game.svelte.ts` (`dispatch` returns `DispatchResult`; `game.view` is `GameView | undefined`), `src/ui/new-game.ts`, the controller's release path (`end()`, entry 16).

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/gestures/classes.ts` -- add `GLIDE` -- shared class name.
- [x] `src/ui/flip.ts` -- implement per Design Notes -- the module.
- [x] `src/ui/Card.svelte`, `src/ui/Column.svelte`, `src/ui/WordCellRow.svelte`, `src/ui/tray/TileRows.svelte` -- `isolation: isolate` on `.face`; `.face.wc-glide { z-index: 1 }` beside each `wc-drag-layer` rule -- layer order (DESIGN.md: cards → glide 1 → sticky bars 2).
- [x] `src/ui/gestures/controller.ts` + `src/ui/gestures/controller.test.ts` -- deps, `cancel()`, `pointerdown`; harness fakes; two new tests -- F6.
- [x] `src/main.ts` -- create, install, pass to the controller -- wiring.
- [x] `src/ui/ActionBar.svelte`, `src/ui/TopBar.svelte`, `src/ui/tray/ControlRow.svelte` -- capture/dispatch/play -- the act() callers.
- [x] `src/ui/flip.test.ts` -- the Vitest list below.
- [x] `e2e/flip.spec.ts` -- the P5 chain and the second-load test below.
- [x] `e2e/helpers/board.ts`, `e2e/helpers.spec.ts`, `e2e/tile-tap.spec.ts`, `e2e/tile-drag.spec.ts`, `e2e/success-signal.spec.ts` (and `e2e/drag-interruptions.spec.ts` only if it fails) -- `glidesSettled(page)` and its use per Design Notes "Existing e2e reads" -- no face read races a glide.

**Acceptance Criteria:**
- Given `src/ui/flip.test.ts`, when `npm test` runs, then these pass (`AD-14 …` names): the kind table over every command in the ticket AC (incl. `validate` `changed: false` → `null`, `giveUp`/`setTarget` → `null`, `confirm` and a `finished: 'won'` confirm → `flyToCell`, `undo` with and without `unfinished` → `undoRedo`, committing and `finished: 'won'` redo (phase `idle`) → `flyToCell`, non-committing redo → `undoRedo`, all others → `snap`); `flyToCell` play starts no `animate()` and no `gate.enter()`; at normal motion a `flip` play and an `undo` play call the `duration` spy with `'snap'` / `'undoRedo'` and pass its value as the animation duration with `easing: 'ease-out'`; under reduced motion the same two produce `[{ opacity: 0 }, { opacity: 1 }]` keyframes over the spy's value (120), no transform, no `wc-glide`; the planner cases (a) and (b) of the ticket AC, equal rects → none, different sizes → top-left delta, different sizes with equal top-lefts → none, a released (transformed) captured rect → first keyframe from it; finish-all: gate count 0 and `running()` false when `capture()` returns, a second capture/play during the first glide then the first glide's late `onfinish` leaves the second's gate count and classes untouched, `wc-glide` and `wc-drag-tiles` removed at the last settle by `onfinish` and by `finishAll()`, a same-band-only play adds no `wc-drag-tiles`; capture flushes before measuring (the mocked `flushSync` drops a fake lift: the captured rect is the unlifted one, so a deselect-before-Undo face gets no keyframes); every throw: `capture`/`play`/`finishAll` before install, second install, pending capture, play without capture, null root at capture and at play, no view at play, a CardId missing from or duplicated in either measurement, an unmapped `data-place`, a `cancel` event.
- Given controller.test.ts, when `cancel()` runs while attached, then `order` holds `finishGlides` right after the fly-back finish; given only `glidesRunning()` true, when a primary pointerdown arrives, then `order` holds `enter` before `finishGlides` and no second `enter`.
- Given `e2e/flip.spec.ts` on android with `session-composing` and `prefs-non-default`, when the chain Validate → Undo → Undo → Redo and the second-load `+` (block right) → Flip → `+` run, then every assertion of the ticket AC P5 bullet holds, read in the `page.evaluate` that clicks the button.
- Given the full suite, when `npm run test:all` and `npm run test:screens` run, then both are green with no baseline change.

## Implementation Notes

- Entry 12 (review-log item 4): `TRAY_ROWS = 1` (layout.svelte.ts:67) stays; while a band-changing glide lifts the `.tiles` clip (`wc-drag-tiles`), a word wider than one row shows its overflow rows below the tile area for the glide. Accepted interim; entry 12 (tray growth) removes it.
- controller.test.ts: the fake `finishGlides` logs into `order`, so the two existing F13 press-during-fly-back order assertions gain `'finishGlides'` after the flight's finish and settle (`'finish', 'leave'`); `cancel()` likewise logs `finish`, `leave`, `finishGlides` (the fly-back settles synchronously inside `finishFlight()`).
- flip.ts reads `data-card-id` itself (an `AD-14` throw on a non-integer) rather than lookup.ts `attribute()` (whose throw is `AD-12`), so every flip throw starts `AD-14`; the place → band map is a `Map` (no prototype keys).
- e2e/flip.spec.ts: the second `+` with the block left adds card 1 (`['1m', '9m', '28m', '42', '0']`, read from the running app). `drag-interruptions.spec.ts` F13 (Undo during a fly-back) stayed green unchanged. Its two R2 tests (Undo during a held drag, android and desktop) failed: from `session-idle-empty-column` the Undo glides the committed word from its WordCell back to the strip (a band change), so the tile area carries `wc-drag-tiles` right after the click and `dragResidue` counted it. Kept the "drag gone at once" intent with a local `expectDragGoneUnderGlide`: at once no `wc-drag-*` class anywhere but `[data-band="tray"] .tiles` and no inline face transform, then after `glidesSettled` a zero `dragResidue`.
- Verification: `npm run test:all` green; `npm run test:screens` green in Docker with no baseline change; the flip import grep lists only ActionBar, TopBar, ControlRow, main.ts and flip.test.ts; unit suite warm median 2.87 s (three runs after a discarded warm-up, a Linux-filesystem copy in /tmp).

- Review fixes (2026-10-10): F27 free-letter Undo test, Redo clip check, `−` step, narrowed `expectDragGoneUnderGlide`, exhaustive `motionKind`, comment rewraps (Review Triage Log). The R-70 P5 test is named `R-70 AD-14 F22 …`, not `R-70 (UI) …`: R-70 carries no (UI) tag in docs/game-flow-spec.md (rule-coverage: V + P5 supp.); Design Notes updated to match.

## Plan Change Log

## Review Triage Log

### 2026-10-10 — Review pass
- verdicts: 21 findings — high 0, medium 3, low 12, false 6, maybe-false 0 (lenses: blind-hunter 12, edge-case-hunter 0, verification-gap 4, intent-alignment 5)
- findings:
  - `[medium]` `[patch]` (blind) the owner's F27 free-letter Undo glide into its WordCell is untested — grouped with the verification-gap F27 row; added `AD-14 F27 …` to e2e/flip.spec.ts (session-place-free-letter-two-cards + one Undo, then Undo Composing → Idle: card 28 glides tray → cell, 320 ms, z-index 1, from its recorded top-left; 32, 42, 45 back to the column).
  - `[low]` `[patch]` (blind) `expectDragGoneUnderGlide` exempted every `wc-drag-*` class on `.tiles` — now exempts only `wc-drag-tiles`, and only with a `.face.wc-glide` present at that moment.
  - `[low]` `[patch]` (blind) the clip assertion missed the Redo Idle → Composing step, where S faces glide into `.tiles` — added `tilesOverflow` `visible` there.
  - `[false]` `[reject]` (blind) `wc-drag-tiles` lifted for glides out of the tray too — the ticket Description specifies the tile area for any band-changing translate ("while a band-changing translate runs"), so this is the specified behaviour; the overflow-row side effect is the accepted TRAY_ROWS = 1 interim (Design Notes item 4).
  - `[low]` `[patch]` (blind) `motionKind` `default: 'snap'` was not exhaustive — every command now listed, `never` check that throws `AD-14 FLIP unknown command type`; behaviour unchanged.
  - `[low]` `[reject]` (blind) the capture/play bracket repeated in six handlers with no helper or scan — the ticket prescribes the per-caller pattern and entry 16 wires the controller callers; a helper/scan adds public surface for a low, unlikely harm.
  - `[low]` `[reject]` (blind) throws not named by the Description (no face, band missing, tile area missing, non-integer id) untested — the AC asks for every throw the Description names, all covered; the extra ones guard DOM states App never renders.
  - `[low]` `[reject]` (blind) `planGlides` repeats play's CardId check — the planner is exported and tested directly, so its own guard is reachable from its callers; cosmetic.
  - `[low]` `[reject]` (blind) flip.ts imports `translate` from fly-back.ts, pulling prefs/motion into the module graph — reuse is the plan's choice; only cost is a test mock; moving it touches fly-back and controller for no user-visible gain.
  - `[false]` `[reject]` (blind) `glidesSettled` waits on every document animation — intended and documented in its comment (fly-backs and parting must settle too before face reads); no infinite animation exists.
  - `[low]` `[reject]` (blind) no browser test of the flyToCell / empty-set kinds or the `phase` wiring; `snap` and `undoRedo` share 1 × base so P5 durations cannot tell them apart — the ticket assigns the kind table to Vitest (S) and P5 durations to 320 only; entry 11's Confirm P5 runs the flyToCell path.
  - `[low]` `[patch]` (blind) comment lines over 100 columns (classes.ts:7, flip.spec.ts:7) — rewrapped in classes.ts, flip.ts, flip.spec.ts.
  - `[medium]` `[patch]` (verification-gap) Undo of a free-letter add into the WordCell band unverified — same group and fix as the first row.
  - `[low]` `[defer]` (verification-gap) reduced-motion FLIP wiring (main.ts `reduced` getter → fade) checked only through Vitest fakes — the ticket AC assigns the reduced fade to S; entry 11's reduced-motion Confirm P5 exercises the same getter. Deferred.
  - `[low]` `[patch]` (verification-gap) the `−` button's glide untested — added a `−` step after the block-left `+` (S faces 42, 0 glide back; tray `['9m', '28m', '42', '0']`).
  - `[medium]` `[defer]` (verification-gap) main.ts `finishGlides`/`glidesRunning` wiring never run end to end (press, back or hide during a glide) — the ticket Notes hand the press-path P5 to entry 16. Deferred.
  - `[false]` `[reject]` (intent) the controller's own dispatches (drop, arrange, taps) are not wrapped in capture/play — the ticket says "entry 16 wires the controller's callers".
  - `[false]` `[reject]` (intent) kinds indistinguishable at the P5 surface — the AC asks P5 for running animations at 320 ms only; kinds are the Vitest table's (same evidence as the blind row above).
  - `[false]` `[reject]` (intent) reduced motion, finish-all, `cancel()` and `pointerdown` only in Vitest — the AC tags them S.
  - `[false]` `[reject]` (intent) rect-delta (D1) rather than logical container/index change — the Description's planner rule is rect-based (band-relative delta, under 0.5 px none).
  - `[low]` `[reject]` (intent) `running()` has no module-level export — only main.ts needs it, through the instance (`flip.running`), as the Description says; no caller is missing.

## Design Notes

**Shapes (flip.ts).**

```ts
export type BandKey = 'columns' | 'tray' | 'wordcells';  // data-place column | tray,strip | cell
export type Box = { left: number; top: number; width: number; height: number };
export type Placed = { readonly band: BandKey; readonly rect: Box };          // viewport rect
export type Glide = { id: CardId; keyframes: Keyframe[]; translate: boolean; bandChange: boolean };
export function motionKind(c: Command, r: DispatchResult, phase: Phase): MotionKind | null;
export function planGlides(i: { before, after: ReadonlyMap<CardId, Placed>;
  bandsBefore, bandsAfter: Readonly<Record<BandKey, Box>>; kind: MotionKind | null; reduced: boolean }): Glide[];
export type FlipDeps = { gate: Gate; root(): HTMLElement | null; reduced(): boolean;
  phase(): Phase | undefined; duration(kind: MotionKind): number };
export function createFlip(deps: FlipDeps): Flip;  // { capture, play, finishAll, running }
export function setFlip(next: Flip): void;          // + module-level capture/play/finishAll
```

`null` from `motionKind` is the empty animated set (review-log item 1: kept out of `MotionKind`, so motion.ts is unchanged): `setTarget`, `giveUp`, a `changed: false` `validate`. `undo` → `undoRedo`; `redo` → `phase === 'idle' ? 'flyToCell' : 'undoRedo'`; `confirm` → `flyToCell`; every other command → `snap`.

**Planner.** `kind` `null` or `flyToCell` → `[]`. Per id of `after` (play has already checked both maps hold the same id set): same band → `dx = (before.left − bandsBefore[band].left) − (after.left − bandsAfter[band].left)`, `dy` likewise with `top`; band change → `dx = before.left − after.left`, `dy = before.top − after.top`. `|dx| < 0.5 && |dy| < 0.5` → no glide (sizes ignored: card ↔ compact is top-left only). Reduced → `[{ opacity: 0 }, { opacity: 1 }]`, `translate: false`; else `[{ transform: translate(dx, dy) }, { transform: translate(0, 0) }]` (fly-back.ts `translate`), `translate: true`, `bandChange` = bands differ.

**createFlip.** State: `pending` (the capture) and `running: Set<{ animation; settled }>`, plus the faces given `wc-glide` and whether `.tiles` took `wc-drag-tiles`. Measure = every `[data-card-id]` under the root → id, band from `data-place` (else throw), `:scope > .face` rect (`found()` from gestures/lookup.ts), a duplicate id throws; bands = `[data-band="columns"|"tray"|"wordcells"]` rects. `capture()`: pending → throw; `finishAll()`; `flushSync()`; root (null → throw); store measure + bands. `play()`: no pending → throw; take and clear it; `flushSync()`; root (null → throw); measure again; id sets differ → throw; phase (undefined → throw); kind; plan; if any glide: `ms = duration(kind)` once, then per glide `gate.enter()`, `face.animate(keyframes, { duration: ms, easing: 'ease-out' })`, translate → `wc-glide` on the face, translate && bandChange → `wc-drag-tiles` on `[data-band="tray"] .tiles` (`found()`); `onfinish` → settle; `oncancel` → throw `AD-14 FLIP animation cancelled`. Settle is idempotent per animation (`settled` flag), deletes it from `running`, `gate.leave()`; when `running` empties, remove `wc-glide` from the recorded faces and `wc-drag-tiles` from `.tiles`. `finishAll()`: per running animation `finish()` then settle (synchronous). `running()`: `running.size > 0`. Messages start `AD-14 `. Header comment cites SPEC F6, F7, F17, F22, F27, AD-14, AD-10, AD-11 by id.

**Callers.** One pattern, e.g. ControlRow: `function setK(k: number): void { const command = { type: 'setDestinationCount', k } as const; capture(); play(command, game.dispatch(command)); }` (TopBar: `overlays.deselect()` first; ActionBar validate: `flushSync()` between dispatch and play).

**Review-log plan-level items.**
1. Empty-set type: `MotionKind | null` (above).
2. `pointerdown`'s `event.button !== 0 || press !== null` return stays before `inFlight`: such a press resolves and measures nothing, as with a fly-back today; the glide settles by `onfinish` or the next primary press / `act()`.
3. Desktop column hover outline (z 3) painting over a z-1 glide: accepted, cosmetic for ≤ 1 × base; no change.
4. `TRAY_ROWS = 1` (layout.svelte.ts:67): while a band-changing glide lifts the `.tiles` clip, a word wider than one row shows its overflow rows below the tile area for the glide; accepted interim, entry 12 (tray growth) removes it. Recorded in Implementation Notes for entry 12.
5. New game, Replay and restore are exempt by construction: they go through `game.newGame`/`replay`/`load` (`new-game.ts`, App, main.ts boot) and never call capture/play; verified by grep (Verification), no test.
6. TopBar tail-deselect lift: the createFlip Vitest case via the mocked `flushSync` (Tasks AC); the order `deselect → capture` in TopBar is covered by P5 `R-70 AD-14 F22 …`'s Redo step (column 1's tail tap-selected before Redo stays out of the animated set; selection cleared after).
7. Second-load `+` with the block right: no live face moves (`trayLayout` tile width is count-independent; 3 → 4 tiles stays card mode), so the e2e asserts no running animation on any `[data-card-id] > .face`, the tapped tile's included.
8. Existing e2e reads after act() clicks: see "Existing e2e reads" below.

**Existing e2e reads** (survey; Normal 180 ms unless noted; android). After an act() click these read a `.face` that may now be gliding:
- `e2e/drag-interruptions.spec.ts:447-486` (F13 Undo during a fly-back, Slow): asserts the dragged face has 0 running animations and `transform: none` after Undo. Expected to stay green (Undo from `session-idle-empty-column` should not move column 2's last face); if the Undo does move it, keep the F13 intent by asserting the fly-back's own animations (recorded in the hook) are `finished` and poll the face to settle, recorded in Implementation Notes.
- `e2e/tile-tap.spec.ts:436-451` (Undo via the local `open(…, ['undo'])`, then face box and lift look), `e2e/tile-drag.spec.ts:336-365`, `:389-411` (Undo via `open`, then `holdTile` face centres), `:478-501` (Flip at `:482`, then `holdTile` at `:486`), `:435-458` (`+` at `:439`, then `holdTile`), `e2e/success-signal.spec.ts:449-500` (Validate via `tapPrimary`, later `holdTile(28)` at `:490`).
- Fix: add `glidesSettled(page)` to `e2e/helpers/board.ts` (`expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0)`) with one test in `e2e/helpers.spec.ts`; `openFixture` awaits it after each `steps` click; the specs above await it after their direct Flip/`+`/Validate clicks before reading faces. Local `settled(locator)` helpers (tile-drag.spec.ts:270, free-letter.spec.ts:363) stay.
- Constraints the new code must keep (no change expected): mirror faces never animate (`tile-drag.spec.ts:452`, `:495`; `free-letter.spec.ts:562`, `:571`, `:597`); `nav.spec.ts:224` already waits for `document.getAnimations()` to empty. `board.screens.spec.ts` clicks no buttons, so `test:screens` baselines are unaffected.

**P5 details (e2e/flip.spec.ts).** D ids = the tray block mirrors' `data-mirror-of` before Validate. Before each click, wait until `document.getAnimations()` is empty (no running glide), then record the needed face top-lefts. In the click evaluate: click, then for each moving face `getAnimations()` running with `getTiming().duration === 320`, `getComputedStyle(face).zIndex === '1'` for translating faces, `.tiles` `overflow` `visible` (Validate), face `getBoundingClientRect()` top-left within 1 px of the recorded one (animation time 0), wrapper `closest('[data-band]')`/`data-place` as the AC states, `[data-card-id]` count 52, `getAnimations()` empty on every `[data-card-id]` and `[data-mirror-of]` element and on every mirror's `.face`, block mirrors present/absent at once. After each step wait for settle and assert `trayIds` against the expected contents. Name: `R-70 …` for the Undo chain (P5 supp.), `AD-14 …` for the rest.

**Sentence → test** (rule-coverage rows this ticket touches; P5 = `e2e/flip.spec.ts`, android; S = UI Vitest `src/ui/flip.test.ts`, C = `src/ui/gestures/controller.test.ts`, never R-id coverage; V = engine Vitest `src/engine/commands.test.ts`):

| Sentence | Test(s) |
|---|---|
| R-70 Undo Place → Composing keeps the arrangement (animated back) | V `R-70 undo from Place goes to Composing keeping targetCell and placementOrder` (R-id coverage); P5 supp. `R-70 AD-14 F22 Validate → Undo → Undo → Redo …` first Undo (D faces strip → column 6, `trayIds` `['42', '0', '28m']`) |
| R-70 Undo Composing → Idle returns the cards (animated back) | V `R-70 R-72 undo from Composing goes to Idle keeping the draft and the redo tail` (R-id coverage); P5 supp. the same chain's second Undo (S 42, 0 → column 3, tray empty) and Redo back; P5 `AD-14 F27 Undo Composing → Idle on session-place-free-letter-two-cards …` (free letter 28 → WordCell 4, no used mirror of 28 held, SPEC F27) |
| AD-14 F22 D faces glide from and to the column; block copies vanish and reappear at once | P5 `R-70 AD-14 F22 …` Validate and first Undo (`place`/`column`, `blockMirrors`, `tilesOverflow` `visible`, `zIndex` `1`); S `AD-14 a same-band-only play adds no wc-drag-tiles`, `AD-14 wc-glide and wc-drag-tiles stay until the last settle by onfinish` |
| AD-14 one live element per card during every animation | P5 `expectGlides` (`live` 52) in all three tests, the Validate glide included |
| AD-14 faces animate; wrappers never | P5 `wrapperAnimations` 0 in all three tests; S `AD-14 at normal motion a flip play and an undo play …` (animations on faces only) |
| AD-14 mirrors take no part in the FLIP glide | P5 `mirrorAnimations` 0 (each mirror and its face) in all three tests, the destination column's during Validate included |
| AD-14 FLIP kinds from the command and its `DispatchResult` (act()-button moves) | S `AD-14 motionKind: …` table, `AD-14 the kind reads the phase after the move (F7) …`, `AD-14 a flyToCell play (confirm, winning confirm, committing redo) …`, `AD-14 the empty animated set (failed validate, setTarget) …`; P5 Validate, Undo, Redo (`R-70 AD-14 F22 …`, `AD-14 F27 …`), Flip, `+`, `−` (`AD-14 F17 on a fresh session-composing …`) |
| AD-14 every card whose band-relative position changed, none on a pure band shift | S `AD-14 (a) + 14 → 15 with the block left and a band shift …`, `AD-14 (b) a band change at 412 × 780 …`, `AD-14 equal captured and next rects → no keyframes`, `AD-14 the 0.5 px cut-off …`, `AD-14 different sizes → the top-left delta …`, `AD-14 a dropped face starts its first keyframe …`; P5 `expectGlides` exact moving set (`+` block right: none) |
| AD-14 durations from motion.ts | S `AD-14 at normal motion a flip play and an undo play pass their kind to duration() …`; P5 320 ms (Slow) on every moving face |
| AD-14 reduced motion 120 ms fade | S `AD-14 under reduced motion a flip play and an undo play fade …`, `AD-14 under reduced motion a band-changing undo fades …` |
| AD-14 input during an animation completes it and acts on the settled state | S `AD-14 the gate is idle and running() false when capture() returns …`, `AD-14 two same-band glides on the same face nodes …`, `AD-14 finishAll() finishes every glide …`; C `AD-14 cancel() while attached calls finishGlides() …`, `AD-14 cancel() while attached with only glidesRunning() true …`, `AD-14 a primary pointerdown with only glidesRunning() true …`, the two `AD-12 F13 …` order assertions |

Handed to other entries: the pure-band-shift P5 (no running animation on column faces after `+` 14 → 15) → entry 12; `flyToCell` playback for Confirm and a committing Redo, its 30 ms stagger, each flying card visible, 52 live elements during a Confirm fly-to-cell and the reduced-motion Confirm P5 → entry 11; the winning guard (F8) → entry 13; the controller-driven kinds (drop, tap-add, removal, tap-swap, a release with an edit gliding from its released point, `flyBack` on no edit) and the press-path P5 (a press, back or hide during a glide) → entry 16. Exempt: none (these rows hold no ownership, provenance or versioning sentence); the D-block parting shift exception to "mirrors take no part" is entry 8's.

## Verification

**Commands:**
- `npm run test:all` -- expected: lint, check, unit, build (size budget), `test:e2e:dist`, `test:e2e`, `test:e2e:pwa` all green.
- `npm run test:screens` -- expected: green in Docker, no baseline written or changed.
- `grep -rn "from './flip'\|from '../flip'\|from './ui/flip'" src` -- expected: only ActionBar.svelte, TopBar.svelte, tray/ControlRow.svelte, main.ts (and flip.test.ts).
- Unit suite warm median on a Linux-filesystem checkout (e.g. `~/wordcell-watch`) -- expected: under 5 s (AD-17).

## Auto Run Result

**Summary.** New `src/ui/flip.ts` (AD-14, SPEC CAP-8 F6/F7/F17/F22/F27): `createFlip(deps)` installed once from main.ts through `setFlip`, `capture()`/`play()`/`finishAll()`/`running()`, the pure `motionKind` (null = empty animated set) and `planGlides` (band-relative delta for a card that stays in its band, captured − next viewport rect for a band changer, under 0.5 px none, reduced motion → 0 → 1 opacity fade). Each glide holds one gate count until its idempotent settle; `wc-glide` (z-index 1) on translating faces and `wc-drag-tiles` on the tile area for a band-changing translate come off at the last settle. ActionBar (Validate, Confirm), TopBar (Undo, Redo) and ControlRow (`−`, `+`, Flip) capture before and play after `game.dispatch`; the controller's `cancel()` and primary `pointerdown` finish glides (`finishGlides`/`glidesRunning`). Confirm and a committing Redo map to `flyToCell` and animate nothing yet (entry 11).

**Files changed.**
- `src/ui/flip.ts` (new): the FLIP module, kind function and planner.
- `src/ui/flip.test.ts` (new): kind table, coordinate frame, finish-all path, flush-before-measure, every Description throw.
- `src/main.ts`: creates and installs flip; passes `finishGlides`/`glidesRunning` to the controller.
- `src/ui/gestures/controller.ts`: two new deps; `cancel()` and `pointerdown` finish glides.
- `src/ui/gestures/controller.test.ts`: harness fakes, two order assertions extended, two new tests.
- `src/ui/ActionBar.svelte`, `src/ui/TopBar.svelte`, `src/ui/tray/ControlRow.svelte`: capture/dispatch/play inside `act()`.
- `src/ui/gestures/classes.ts`: `GLIDE`.
- `src/ui/Card.svelte`: `.face` `isolation: isolate`.
- `src/ui/Column.svelte`, `src/ui/WordCellRow.svelte`, `src/ui/tray/TileRows.svelte`: `.face.wc-glide { z-index: 1 }` beside each `wc-drag-layer` rule.
- `e2e/flip.spec.ts` (new): R-70 Validate → Undo → Undo → Redo chain; `+`/Flip/`+`/`−` test; F27 free-letter Undo into its WordCell.
- `e2e/helpers/board.ts`, `e2e/helpers.spec.ts`: `glidesSettled(page)`; `openFixture` waits after each step.
- `e2e/tile-drag.spec.ts`, `e2e/success-signal.spec.ts`: wait for settled faces after direct Flip/`+`/Validate clicks.
- `e2e/drag-interruptions.spec.ts`: the two "Undo during a held drag" residue checks tolerate only the Undo glide's own `wc-drag-tiles` (with a `wc-glide` face present) until it settles.

**Review findings.** 21 findings (high 0, medium 3, low 12, false 6). Patches applied: 6 entries (1 medium: the F27 free-letter Undo glide test, grouped with its verification-gap twin; 5 low: narrowed residue exemption, Redo clip check, exhaustive `motionKind`, `−` step, comment rewraps). Deferred: 2 (reduced-motion FLIP wiring e2e → entry 11's reduced-motion Confirm P5; controller glide wiring end to end → entry 16's press-path P5). Rejected with reasons in the Review Triage Log: clip lift on outbound band changes (specified), bracket helper/scan, unnamed throws untested, planner's duplicate guard, `translate` import, `glidesSettled` scope, browser test of the no-animation kinds, controller callers unwrapped (entry 16), kinds at P5, Vitest-only S items, rect-delta reading, module-level `running()`.

**Follow-up review recommended:** false (first pass; patched entries at entry verdict: 1 medium, 5 low, 0 high).

**Verification.** After the patches: `npm run test:all` exit 0 (lint, check, 2282 unit tests, build within the size budget, dist smoke, `test:e2e` 500 passed, `test:e2e:pwa` 12 passed); `npm run test:screens` exit 0 (10 passed, no baseline written or changed); the flip import grep lists only main.ts, ActionBar.svelte, TopBar.svelte, tray/ControlRow.svelte (and flip.test.ts); unit warm median 2.87 s on a Linux-filesystem copy (implementer's measurement before the e2e-only and switch-only patches).

**Review-log plan-level items (all resolved in Design Notes).** Empty-set type `MotionKind | null`; `pointerdown`'s early return kept before `inFlight`; desktop hover outline over a z-1 glide accepted; TRAY_ROWS = 1 overflow rows during a band-changing glide accepted until entry 12; New game/Replay/restore exempt by construction (grep); TopBar tail-deselect lift covered by the createFlip flush Vitest and the P5 Redo step with column 1's tail selected; second-load `+` with the block right asserts no running animation on any face; e2e specs reading faces after act() clicks listed and fixed via `glidesSettled`.

**Residual risks.** No P5 yet for a press, back or hide mid-glide (entry 16) or reduced motion through the real wiring (entry 11). During a band-changing glide a word wider than one row shows its overflow rows until entry 12 grows the tray. Close-out items (not this build): the epic file's CAP-8 split Decision and tickets.toml entry 16 need the `finishAll` move folded in; entry 12 gains the pure-band-shift P5.
