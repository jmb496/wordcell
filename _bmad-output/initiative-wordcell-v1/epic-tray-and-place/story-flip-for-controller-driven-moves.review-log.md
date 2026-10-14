# Review log — story-flip-for-controller-driven-moves (ticket 5.16)

State: pass 2: done
Pre-loop: HEAD 9b30ac0, copy .passes/pass0.md, 261 words. Mode docs, thorough, max 7.

## Pass 1 — 2026-10-14 10:55
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 8 (merged), minor 5, decision-needed 0  |  Dropped in triage: 1
Words: 629 (2.4 x pass 0)  |  Snapshot: .passes/pass1.md
Fixer note: item 2 - code shows end() clears before pointerup dispatch; selection clear and capture both now ordered ahead of clearDrag.
### Applied (to fix)
1. [major] Description dispatch list — enumerate every `game.dispatch` site in controller.ts (applyTile swap/remove, perform drop/tapDestinationCard/addFreeLetter/setTarget/tap-add, tail drag drop, drag-as-tap tapDestinationCard, tile and free-letter release command); Verify covers tapDestinationCard and setTarget (setTarget: capture/play pair, empty animated set).
2. [major] Release order — capture only when the release will dispatch (tail `highlighted !== null`, tile/free letter `releaseCommand !== null`), after `deselect`/`clearTile`, before `clearDrag`; then clearDrag, gate.leave, dispatch, play, in the same pointerup; no non-dispatching end (longPress, sheet/scrim, null command, pointercancel, lostCapture, cancel, byBack) leaves a capture pending; AD-14 order test pins it.
3. [major] Seam — default applied: extend `ControllerDeps` with `capture`/`play`, wired in main.ts like `finishGlides`; "no new exports" reworded (no new module exports).
4. [major] No-edit flyBack — existing `flight.flyBack`, no dispatch, no flip capture; regression coverage only.
5. [major] Parted tiles and shifted tray faces glide from their parted offsets (CAP-8) on an edit release; Verify asserts it.
6. [major] "Released point" defined (dragged face's viewport rect at last move before release; settled rect + first-keyframe translate equals it within 1 px, getKeyframes in the same evaluate), tail drop included.
7. [major] P5 concrete scenario (Slow, release with edit, press a card mid-glide; getAnimations empty after press, gate idle, press acts on the settled/post-edit view); what is new vs entry 10.
8. [major] Open question — resolution criterion (face rect in the last pre-clear frame vs first animated frame within 1 px, Playwright) and fallback (stop and report; no silent workaround).
### Default applied (technical)
- Seam (item 3): ControllerDeps capture/play. Parted-face glide (5) follows CAP-8. 
### Minor (applied only if no extra words)
- test:screens: state that no baselines change; reduced-motion release (fade, first-keyframe scoped to non-reduced); evaluate timing asserts running/positive remaining; `after` extra entries (dropped: 7/8 precede 10 transitively).
### Decision needed
- none
### Dropped
- `after: [10]` should list tile/free-letter drag entries — transitive via 9→8→7.

## Pass 2 — 2026-10-14 11:10
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 3 (merged), minor ~12, decision-needed 0  |  Dropped in triage: 3 (circular open-question note, hover/refreshHover, setFlip seam: stretch/obvious)
### Applied (to fix)
1. [major] Release order vs `parting.finishAll()` — edit-release branch runs `parting.finishAll()` before `clearDrag`; state capture runs before it so the parted faces' rendered (mid-animation) offsets are the previous rects (default applied; CAP-8 previous rects).
2. [major] end()/pointerup split — capture is taken in `end()` on kind 'up' with a dispatching outcome; `end()` records that it captured and pointerup dispatches iff captured, play follows; the 'will dispatch' predicate is computed once; invariant test: capture count equals play count for every EndReason variant (incl. sameId, detach, cancel without byBack).
3. [major] Bracket invariant — a test asserts every `game.dispatch` site is bracketed (capture directly before, after any deselect/clearTile; play directly after, unconditionally including a no-op result), at least one tap site (perform drop with a selection) in the order test.
### Minor (word-neutral only; document over its 2.5x budget)
- reduced-motion release case; released-point compares top-left only; drag drop vs tap drop wording in Verify; multi-card tail first/last faces.
### Default applied (technical)
- all three above.
### Decision needed
- none
Words: 702 (2.7 x pass 0)  |  Snapshot: .passes/pass2.md
