---
id: 4
type: story
title: "Controller seams"
parent: epic-tray-and-place
covers: [CAP-3]
after: [3]
risk: medium
---

# Controller seams

## Description

Behaviour-neutral split of src/ui/gestures/controller.ts along its seams before tile gestures land (retrospective A6, F14): the controller keeps the press machine; the visible band and clip move to gestures/visible-band.ts, the desktop hover-peek timer and suppress logic to gestures/hover-peek-timer.ts (src/ui/hover-peek.ts stays the render helpers; the cell-keyed timer and half-open suppress rects and their AD-12 Vitests kept, S17) and the fly-back to gestures/fly-back.ts, each behind the existing `deps` pattern (Seams below); one gestures/lookup.ts helper taking the caller's message replaces every cell/column lookup with its own throw (Lookup below) with every throw string unchanged; one gestures/classes.ts exports the class names controller.ts, Column.svelte and HoverPeek.svelte share (Classes below); and the per-ticket "Entry N" header paragraphs in controller.ts and the other src/ui files become one behaviour summary per module (Headers below); controller.test.ts stays one file (F41): every existing test, `vi.mock`/`vi.hoisted` block and the `setup()` harness stay in it, harness edits limited to import paths and mocks the new modules need (they import motion, prefs, game by specifiers the existing mocks cover); no new test files for the new modules.

Line numbers below are at HEAD; the build-notes line map is at f62a89a and has shifted by about one line, so the builder re-greps before editing.

- Seams: only the visible band/clip, the desktop hover-peek timer and suppress, and the fly-back move; drag, tap actions, hover classes and the touch long-press peek (onTimer/peek release, line map 597–618) stay in controller.ts (tile.ts comes with CAP-4–6). Each module is a factory (like click-swallow.ts's `createClickSwallower`) or pure function that `createController` builds internally from the deps it already receives plus getter hooks for the state the controller keeps (`press`, `root`, `lastPoint`); fly-back.ts owns `flying` and exposes whether a flight runs; hover-peek-timer.ts owns the cell-keyed timer and `suppressed`; no module-level state, so one `vi.resetModules()` per test still isolates them. Every existing call order is kept (settle → `gate.leave`, suppress, `refreshHover`; `cancel` → `finishFlight`, `closeHover`, suppress; pointerdown; detach); fly-back's two throws (`fly-back while one is running`, `fly-back animation cancelled`) move verbatim.
- Lookup: gestures/lookup.ts (build-notes tree), also imported by non-gesture files (HoverPeek.svelte, WordCellView.svelte, tray/tags.ts): `found<T>(value: T | null | undefined, message: string): T` throwing `new Error(message)` verbatim, plus `cellIn(cells, n, message)` and `columnIn(columns, n, message)` built on it (`columnIn` keeps today's index-plus-`column`-field check). Sites: controller.ts 230, 241, 470, 485, 557, 592, 847, 925; intent.ts 66, 104; HoverPeek.svelte 30; WordCellView.svelte 23; tray/tags.ts `originCard`, which keeps one message for both a missing and an empty cell. Every other throw stays as it is; every throw string unchanged (tests pin them with anchored regexes).
- Classes: controller.ts and the new gestures modules import from classes.ts the nine class names (`wc-hover-tail`, `wc-grab`, `wc-drop`, `wc-drop-self`, `wc-drag-ghost`, `wc-drag-layer`, `wc-drag-target`, `wc-selection-suppressed`, `wc-hover-peek-hidden`) and the `HOVER_FROM`/`HOVER_LEN` custom-property names, every value byte-identical. Column.svelte and HoverPeek.svelte use the names only in `<style>` `:global(...)` selectors, which cannot import TS: they keep their literals with one comment naming classes.ts.
- Headers: the top-of-file header comment of each non-test src/ui file carrying "Entry N" paragraphs (at HEAD: gestures/controller.ts, gestures/intent.ts, App.svelte, Board.svelte, Card.svelte, Column.svelte, HoverPeek.svelte, WordCellView.svelte, hover-peek.ts, layout/layout.svelte.ts, tray/tags.ts; re-grep) becomes one behaviour summary; inline "Entry N" tags in those files become the spec ids they stand for (CAP-x, F-x, AD-n, R-xx; AGENTS.md cite rules by id); tags.ts's forward reference to entry 4 is removed. Test files, src/shell and main.ts are out of scope.
- Interface: new gestures/visible-band.ts, hover-peek-timer.ts, fly-back.ts, lookup.ts, classes.ts; `createController(gate, deps)`, `ControllerDeps` and the returned `{ cancel, attach, refreshHover }` unchanged; main.ts and App.svelte untouched.
- Tests: no test renamed, no assertion changed, no new rule coverage (build-notes CAP-3); AD-17 unit median recorded before and after.
- Owns: the gestures/ split, lookup.ts and classes.ts every later gesture entry uses; S17.
- Consumers: the visible-band clip feeds epic 4 `pickTarget`, the drop-target registration (gestures/drop-target.ts), Q-34 `hasLeftSource` and entry 7's tray-band target; the class names are used by Column.svelte and HoverPeek.svelte CSS and hard-coded in e2e/drag.spec.ts, tap.spec.ts, column-phases.spec.ts, wordcell-view.spec.ts, drag-interruptions.spec.ts and helpers.spec.ts (e2e literals stay unchanged); the plan's ticket review lists both.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with no screenshot baseline change, every existing test passing with at most import and harness-path edits, and the plan recording the Linux-filesystem warm unit-suite median before and after the split. Median pass rule: before and after are each the median of 5 warm `npm test` runs on a Linux-filesystem checkout (AD-17); after stays under the 5 s budget and no more than ~5 % above before, with `vi.resetModules()` still called once per setup; otherwise the build fixes the cause (e.g. module state) before `built`. The plan's sentence → test mapping is "none; behaviour-neutral (CAP-3)".

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, As-built facts that bite (controller.ts line map, controller.test.ts), CAP-3, Sweep inventory S17
- spec — _bmad-output/specs/spec-epic-5-tray/SPEC.md, CAP-3, F14
- spec — _bmad-output/specs/spec-epic-4-board/SPEC.md, F41

## Notes

- Open question: Whether moving the hover-peek and fly-back code behind deps multiplies vi.resetModules() setups in controller.test.ts and slows the unit suite; the before/after median decides, by the AC's median pass rule.
