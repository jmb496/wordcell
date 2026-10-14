# Review log — story-flip-for-controller-driven-moves (ticket 5.16)

State: pass 4: done
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

## Pass 3 — 2026-10-14 11:25
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (none)  |  Findings: major 2 (merged from 6), minor ~5, decision-needed 0  |  Dropped in triage: 0
### Applied (to fix)
1. [major] Tail drag drop: `overlays.deselect()` runs in pointerup after `end()`, so "capture in end() after the selection clear" cannot hold — default applied: the tail deselect moves into `end()`'s up branch ahead of the capture when the release will dispatch; `end()` stores the captured command/flag and pointerup consumes it without recomputing `releaseCommand`; order test adds a tail drag with a selection.
2. [major] Bracket invariant adjacency — per site class: tap sites capture is the previous statement and play the next; drag-release sites capture in `end()` and the dispatch is guarded by the recorded capture; the drag-as-tap tapDestinationCard captures only inside its `card !== null` branch (null-card case added to the capture=play count invariant).
### Minor (word-neutral only)
- halt: play still runs after a halting dispatch or the AD-15 surface wins; first-keyframe assertion scoped to translate glides; open-question observable = last pointermove rect vs first keyframe's rendered rect.
### Decision needed
- none
Words: 745 (2.9 x pass 0)  |  Snapshot: .passes/pass3.md

## Pass 4 — 2026-10-14 11:40
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 0, minor 8 (4 merged distinct), decision-needed 0  |  Dropped in triage: 0
No fix pass run (converged). Words: 745 (2.9 x pass 0).

## Result — converged after 4 passes
Majors per pass: 8, 3, 2, 0. Decision-needed: none. Technical defaults applied: ~9 (ControllerDeps seam, parted-face glide, capture before parting.finishAll, end() records capture, tail deselect into end(), per-site-class bracket test, etc.).
### Unapplied minors
- Description para 1 "(on a halt, play runs or AD-15 wins)" is ambiguous and wrong as written: a throwing dispatch gives no DispatchResult, so play cannot run; replace with "a throwing dispatch reaches AD-15 and play does not run" and limit the capture=play invariant to non-throwing dispatches (raised by 3 reviewers; fix next build/loop).
- Moved tail deselect: say it is a separate branch (highlighted !== null) ahead of the capture; the existing highlighted === null deselect stays.
- Zero-distance glide (face whose settled rect equals released rect) excluded from the running-animation assertion; single-card tail.
- No-op result after a non-null releaseCommand: play yields empty animated set.
- P5: name the pressed card as one whose post-edit position differs from its mid-glide position.
- Open question overlaps the Verify first-keyframe assertion; mark Verify as its resolution.
