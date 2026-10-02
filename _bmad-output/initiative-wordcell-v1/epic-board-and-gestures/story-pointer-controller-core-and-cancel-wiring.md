---
id: 6
type: story
title: "Pointer controller core and cancel wiring"
parent: epic-board-and-gestures
covers: [CAP-4]
after: [4, 5]
risk: high
---

# Pointer controller core and cancel wiring

## Description

- Interface: new src/ui/gestures/controller.ts (createController(gate, deps) with deps { elementFromPoint, setTimer, clearTimer }, browser defaults built in main.ts as for createGate → { cancel(opts?: { byBack?: boolean }), attach(root) }), src/ui/gestures/classify.ts (classify), src/ui/act.ts (controller setter, act(handler)); src/shell/nav.ts gains registerBeforeBack(fn); main.ts wires it (below).
- Owns: controller.ts, classify, act.ts, nav.registerBeforeBack and the main.ts controller step; entries 7–12 add press handling inside the controller only.
- classify: a pure step function over the press state and an event (down with target kind and whether the WordCell is empty; move with dx/dy; the long-press timer firing; up) → pending | drag | longPress | tap. Drag latches at the first move ≥ 8 px Euclidean; 400 ms long-press on WordCells only, after which no drag; on an empty WordCell a fired long-press releases as tap (deselect, SPEC CAP-4).
- Press: every button 0 pointerdown in the root not on an enabled button (F25), with no active press, becomes the active press; button !== 0 and any other pointerId are ignored without preventDefault or stopPropagation. It resolves from elementFromPoint at the press point, never event.target: a card by data-place (column, cell; tray/strip captured but inert, F23), a non-card press by closest data-column / data-wordcell / data-foot (build-notes CAP-4). With nothing selected a non-card column part (empty space, placeholder, foot pad; pan-y) is not captured (entry 4's scroll test stays green); entry 7 adds the tail-selected case. Only a captured press calls setPointerCapture, enters the gate and has contextmenu preventDefaulted; uncaptured presses are tracked for tap classification only.
- End: the first of pointerup, pointercancel, lostpointercapture or cancel() ends the press and leaves the gate exactly once (gate.leave() throws at count 0); later terminal events of that pointerId are ignored. In this entry a tap, drag or long-press on a column, cell or tile ends with no command and no selection change; entries 7–12 add the handlers.
- cancel({ byBack? }) releases capture and clears the active press at once, with no command; the gate is idle before a cancel() without byBack returns (F13); it closes an open peek (closePeek only when one is open) and no other overlay entry (AD-13). Only the cancelled pointerId's remaining events are dropped until its pointerup/pointercancel; any new pointerdown (same pointerId included) starts a new gesture. With no attached root or no press it is a no-op with no nav or overlays call (rejected root, before mount, after a halt detach; build-notes CAP-4).
- attach: a Svelte action on App's active-branch root on every mount; attach(root) returns a detach that calls cancel() first (F8); attach while attached throws. App receives the controller as a prop beside layout.
- F24 press-only paths against the entry 5 store: hide keeps a tap-selection with no nav call; hide under a sticky view opened through overlays.openView does not throw; drag and fly-back paths land in entries 8 and 9.
- nav.registerBeforeBack(fn) (R1, F7): separate from register(); throws before launch() resolves or on a second call; runs before the Forward check and close callback; not on own pops, stale launches, Forward corrections or a missing wc; a back before registration runs no hook.
- main.ts: creates the controller right after createGate (after game.load()'s halted return, before registerLifecycle(), rejected root included); registers cancel with registerBeforeHide before gate.scrollReset (before-hide callbacks run in registration order) and cancel({ byBack: true }) with registerBeforeBack; passes the controller once to act.ts's setter (a second call throws) and to App.
- act(handler) returns a handler that calls controller.cancel() then handler; act() without a set controller throws (AGENTS.md rule 6). It wraps every App-owned button handler (Board, History notice, Reset confirm, Dialog scrim, banner, the rejected root's New game; Halted Reload exempt in both mounts) (R2, F9).

## Acceptance Criteria

Verify: npm run test:all green (entry 4's scroll test included) with:

- S (fake root; fake events with capture, preventDefault and stopPropagation spies): AD-12 classify (10 px then 2 px → drag; exactly 8 px → drag, under 8 px → tap; a WordCell held 400 ms → long-press, 399 ms not; no drag after a long-press; empty WordCell long-press then move → tap; a column press held past 400 ms released → tap); AD-12 one pointer (button !== 0, a second pointer and an enabled button never enter the gate; the second pointer never preventDefaulted); AD-12 press ends (pointerup→lostpointercapture, pointercancel→lostpointercapture, cancel()→lostpointercapture each end once, gate count 0, no command; new pointer after cancel(); same-id pointerdown after cancel() with no pointerup; cancel() and cancel({ byBack: true }) before attach and after detach call no nav or overlays); AD-12 act() calls cancel() first (spy), Halted exempt; AD-13 F24 press-only cancel paths (drag paths in entries 8 and 9).
- AD-12 scan in src/architecture.test.ts: every onclick in App, TopBar, ActionBar, HistoryNotice, Dialog callers (the scrim included) and DictionaryBanner goes through act(; Halted.svelte none.
- Shell S: AD-13 before-back hook, the build-notes Spine close-out AD-13 cases.
- P4 (android): AD-12 tap and drag on a static tray tile leave the Session reference and storage unchanged, and its held contextmenu is defaultPrevented; AD-11 during a touchHold on a column card and on a tray tile, page.evaluate dispatches a cancelable bubbling contextmenu at the held element → defaultPrevented true, on a foot pad with nothing selected → false; the Notes probe.
- e2e/lifecycle.spec.ts 'R-73 AD-17 hidePage alone writes exactly one wordcell:session entry' and '§2 rejected: the hide flush writes nothing' already pass: kept and extended (AD-16 id, clock resumes only after showPage); controller-before-lifecycle is a reviewed main.ts step. The gesture-cancel half of AD-9/AD-17/AD-16 and the AD-12 inert foot-pad drag with a tail selected land in entry 9.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/SPEC.md, CAP-4
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, CAP-4; Spine close-out edits (AD-13 R1/F7, AD-12 R2/F9)
- spec — _bmad-output/specs/spec-epic-4-board/rule-coverage.md, AD-11 contextmenu, AD-12, AD-13, AD-9/AD-17 and AD-16 rows
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Pointer thresholds

## Notes

- Open question: Whether a Svelte action on the active-branch root sees pointer events from sticky bars and the banner with one listener set (F25 assumes it spans the viewport). Probe: a P4 check that a pointerdown on the top-bar and banner backgrounds reaches the root listener; if it does not, stop and report (AGENTS.md rule 7) rather than adding listeners elsewhere.
