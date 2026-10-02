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
- Owns: the above and the main.ts controller step; entries 7–12 add press handling inside the controller only.
- classify: a pure step function over the press state and an event (down with target kind and WordCell emptiness from game.view at pointerdown, never the DOM (AD-3); move with dx/dy; the long-press timer firing; up) → pending | drag | longPress | tap. Drag latches at the first move ≥ 8 px Euclidean; 400 ms long-press on WordCells only, after which no drag; on an empty WordCell a fired long-press releases as tap (its deselect is entry 7's).
- Press: every button 0 pointerdown in the root not on an enabled button (F25), with no active press, becomes the active press and enters the gate; a pointerdown with button !== 0 and every event of any other pointerId are ignored without preventDefault or stopPropagation. It resolves from elementFromPoint at the press point, never event.target: a card by data-place (column, cell; tray/strip captured but inert, F23), a non-card press by closest data-column / data-wordcell / data-foot (build-notes CAP-4). With nothing selected a non-card column part (empty space, placeholder, foot pad; pan-y) is not captured; the browser's pointercancel ends it when a pan starts (entry 4's scroll test stays green, else stop and report, AGENTS.md rule 7, never narrowing gate entry); entry 7 adds the tail-selected case. Only a captured press calls setPointerCapture. The root's contextmenu is preventDefaulted while a captured press is active or, ended by cancel() or lostpointercapture, awaits its pointerup/pointercancel; no pointerId or target matching (AD-11's sole second-pointer exception).
- End: the first of pointerup, pointercancel, lostpointercapture (captured element only) or cancel() ends the press and leaves the gate once (gate.leave() throws at count 0); then its events start no gesture or gate change (its pointerup/pointercancel only end contextmenu suppression) until its next pointerdown, a new press; a same-id pointerdown during a press (end lost) first ends it (one leave(), no command). Here every gesture ends with no command or selection change; entries 7–12 add the handlers.
- cancel({ byBack? }) releases capture and clears the press at once, no command; each controller gate.enter() has its leave() before a cancel() without byBack returns (F13). cancel(), pointercancel and lostpointercapture close an open peek (closePeek() only if open), no other overlay entry (AD-13). Without an attached root or press it is a no-op, no nav or overlays call (rejected root, before mount, after a halt detach; build-notes CAP-4).
- attach: a `use:` action on App's active-branch `<main>` (wrapping Board) calls controller.attach(root) on every mount; its destroy calls the returned detach, which calls cancel() first (F8); attach while attached throws. App receives the controller as a prop beside layout.
- F24 press-only paths against the entry 5 store, a captured press held at hide: (a) overlays.select(...), pointerdown on another column's card, hide → selection kept, no nav call after select(), gate balanced, later pointerup is ignored; (b) a tap-selection, WordCell press held, then overlays.openView, hide → no throw, both kept, no nav call; drag and fly-back paths are entries 8 and 9.
- nav.registerBeforeBack(fn) (R1, F7): separate from register(); throws before launch() resolves or on a second call; runs before the Forward check and close callback; not on own pops, stale launches, Forward corrections or a missing wc; a back before registration runs no hook.
- main.ts: creates the controller right after createGate (after game.load()'s halted return, before registerLifecycle(), rejected root included); registers cancel with registerBeforeHide before gate.scrollReset (before-hide callbacks run in registration order) and cancel({ byBack: true }) with registerBeforeBack; passes the controller once to act.ts's setter (a second call throws) and to App.
- act(handler) returns a handler that calls controller.cancel() then handler; act() without a set controller throws (AGENTS.md rule 6). It wraps every App-owned button handler (Board, History notice and Reset confirm with onscrim, banner, the rejected root's New game; Dialog and BlockingMessage pass through unwrapped, so Halted Reload is exempt in both mounts) (R2, F9).

## Acceptance Criteria

Verify: npm run test:all green (entry 4's scroll test included) with:

- S (fake root; fake events with capture, preventDefault and stopPropagation spies; counting fake Gate): AD-12 classify (10 px then 2 px → drag; exactly 8 px → drag, under 8 px → tap; a WordCell held 400 ms → long-press, 399 ms not; no drag after a long-press; empty WordCell long-press then move → tap; a column press held past 400 ms released → tap); AD-12 one pointer (a button !== 0 pointerdown, a second pointer and an enabled button never enter the gate; the second pointer's preventDefault and stopPropagation never called); AD-12 press ends (pointerup→lostpointercapture, pointercancel→lostpointercapture, cancel() or cancel({ byBack: true })→lostpointercapture each end once, gate balanced, no command; same-id lostpointercapture from another element → press active; uncaptured foot-pad press then pointercancel → balanced; mouse id 1 pressed and released twice → each ends once, balanced; new pointer after cancel(); same-id pointerdown after cancel() → new press ends once on its pointerup; uncaptured press, no pointerup, same-id pointerdown → balanced, new press active; captured press, cancel(), contextmenu → defaultPrevented; WordCell press held, overlays.openPeek(cell), then cancel() or cancel({ byBack: true }), pointercancel or lostpointercapture (captured element) → peek closed, no nav call; cancel() and cancel({ byBack: true }) before attach and after detach call no nav or overlays); AD-12 act() calls cancel() first (spy); AD-13 F24 cases (a) and (b).
- AD-12 scan in src/architecture.test.ts: every on(click|action|dismiss|scrim)= value in src/ui/**/*.svelte except ActionBar's onclick={primary.onclick}, and each defined onclick: branch of its derived primary, is an act( call; Dialog, BlockingMessage and Halted are excluded and contain no act( call.
- Shell S: AD-13 before-back hook, the build-notes Spine close-out AD-13 cases.
- P4 (android): AD-12 tap and drag on a static tray tile leave the Session reference and storage unchanged; AD-11 during a touchHold on a column card and on a tray tile, page.evaluate dispatches a cancelable bubbling contextmenu (no pointerId) at the held element → defaultPrevented true, on a foot pad with nothing selected → false; the Notes probe.
- e2e/lifecycle.spec.ts 'R-73 AD-17 hidePage alone writes exactly one wordcell:session entry' and '§2 rejected: the hide flush writes nothing' already pass: the first gains clock resumes only after showPage; the second gains the AD-16 id, no AD-15 halted surface and the rejected message kept after hidePage; controller-before-lifecycle is a reviewed main.ts step. The gesture-cancel half of AD-9/AD-17/AD-16 and the AD-12 inert foot-pad drag with a tail selected land in entry 9.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/SPEC.md, CAP-4
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, CAP-4; Spine close-out edits (AD-13 R1/F7, AD-12 R2/F9)
- spec — _bmad-output/specs/spec-epic-4-board/rule-coverage.md, AD-11 contextmenu, AD-12, AD-13, AD-9/AD-17 and AD-16 rows
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Pointer thresholds

## Notes

- Open question: Whether a Svelte action on the active-branch root sees pointer events from sticky bars and the banner with one listener set (F25 assumes it spans the viewport). Probe: a P4 assertion that the action's element contains the top bar, banner band and action bar and its rect covers the viewport; if not, stop and report (AGENTS.md rule 7) rather than adding listeners elsewhere.
- Owner decision 2026-10-02 (spec F30): on `desktop` the root stops ~15 px short of the right edge at the `scrollbar-gutter: stable` strip; accepted as built (relaxed probe, deviation in the plan). No listeners outside the root; a mouse press released over the strip stays held until the next click, which recovers.
