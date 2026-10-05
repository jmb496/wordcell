# Review log — story-drag-interruptions-selection-replacement-hide-back-and-cance.md (ticket 4.9)

State: pass 3: done

Mode: docs, thorough, max 7, budget default (2.5x pass 0). Pass 0: HEAD c1c5974, copy story-drag-interruptions-selection-replacement-hide-back-and-cance.passes/pass0.md, 325 words. Intent includes tickets.toml entry 9 fields interface, tests, owns (and unknown, already in Notes), not copied at pull; fixer adds them to the Description in pass 1.

## Pass 1 — 2026-10-05
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 11, minor 10, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 943 (2.90 x pass 0)  |  Snapshot: story-drag-interruptions-selection-replacement-hide-back-and-cance.passes/pass1.md (fix diff pass1.fix.diff)
### Applied
- [major] Description — plain cancel() (before-hide, act()) ending a selection-replacing drag unspecified (F24: snap back, deselect, one queued nav.pop(); plain tap-selection or sub-threshold press survives hide with no nav call) → fixer item 1
- [major] Acceptance Criteria — no S cases for F24/F28 paths and no P4 synthetic-pointercancel restore case (tests field) → fixer item 2 (default applied: pointerId recipe)
- [major] Description — when the restored selection visuals return relative to the fly-back unstated (lift and fly-back share face transform) → fixer item 3 (default applied)
- [major] Description — selection visuals are partly Svelte-rendered (inline --wc-lift, outline element, Here content), so "removes classes by DOM" is ungessable → fixer item 4 (default applied: one suppression class)
- [major] Description — "a drag from any column" includes inert drags that must keep the selection (CAP-4) → fixer item 5
- [major] Description/AC — press during fly-back (F13) has no test and no order → fixer item 6
- [major] AC — AD-16 Board half and main.ts registration proof deferred here by the 4.6 plan dropped → fixer item 7
- [major] AC — back case missing "from another column", "nothing selected", fly-back → fixer item 8
- [major] AC — Undo during fly-back untestable as written (fixture, recipe) → fixer item 9
- [major] AC — release-over-nothing deselect of a replacing drag untested; "one lifted tail" undefined → fixer item 10
- [major] AC — the tickets.toml interface/tests/owns fields not copied → fixer item 11
- [minor] References (SPEC CAP-4/CAP-7/F13/F24/F28, rule-coverage rows) → 12; touchDrag→touchHold → 13; foot pad = another column's, Session unchanged in hide/back cases, clock resumes only after showPage, later end() no-op after Undo held → 14; deselect before drop dispatch → 15; source-column press position (card above the selected) → 16; same-id pointerdown / detach end paths → 17 (default applied); entry-8 existing paths (act() finish, plain-cancel snap) marked existing → 18; plan records C-E4b test name → 19; hide-vs-pointercancel order note → 20
### Default applied (technical)
- suppression — controller toggles one class on the old selection's column root at threshold; CSS cancels lift/outline/Here/foot state; restore removes it
- restore timing — at fly-back settle (onfinish, finish(), reduced-motion immediately)
- synthetic pointercancel — record pointerId from a capturing pointerdown listener, dispatch PointerEvent('pointercancel', { pointerId, bubbles: true }) on the captured element
- same-id pointerdown mid-replacing-drag → restore as a real pointercancel; detach → plain cancel() (deselect)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 2 — 2026-10-05
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 8, decision-needed 0  |  Dropped in triage: 1 (+ duplicates merged)
Words (docs): 933 (2.87 x pass 0)  |  Snapshot: story-drag-interruptions-selection-replacement-hide-back-and-cance.passes/pass2.md (fix diff pass2.fix.diff)
### Applied
- [major] Description Replacement — suppression class on the old column root cannot cancel the other columns' selecting/target foot wash (SPEC CAP-7 "foot states") → fixer item 1 (default applied: class on the Board root)
- [major] Description end paths — class removal unstated for drop and release over nothing → fixer item 2
- [major] Description end paths/AC S — pass 1 default gave a same-id pointerdown a fly-back, contradicting F13 and entry 8's snap → fixer item 3 (default applied: snap + restore at once)
- [major] AC one lifted tail — press above the selected card cannot fail (inline drag transform overrides the lift) → fixer item 4 (default applied: press below the selected top card, selection ≥ 2)
- [major] AC back case — "running animation right after back" races the fly-back → fixer item 5 (default applied: entry 8 animate spy)
- [minor] synthetic pointercancel recipe marked unverified, captured element by hasPointerCapture, visuals asserted after settle → 6; "detach on halt" → "detach", AC plain cancel incl. detach → 7; drop "at once on reduced motion" → 8; gate balanced when a fly-back press resolves to nothing → 9 (default applied); WordCell in the inert list → 10; Undo held "then" → "and" → 11
### Default applied (technical)
- suppression class on the Board (controller attach) root, CSS cancels lift, outline, Here and every foot's selecting/target state
- same-id pointerdown mid-replacing-drag: snap back (entry 8), restore old selection at once (class removed, no nav call), then the new press resolves on the settled layout
- one-lifted-tail P4: selection of ≥ 2, press below its top card, the selected cards left in the column show no lift
- back-case fly-back evidence: the entry 8 Element.prototype.animate spy (__flyBack log)
- fly-back press resolving to nothing leaves the gate at once
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- 8 px lift jump at settle for a source-column restore — accepted outcome of the pass 1 restore-timing default; plan-level note, not ticket

## Pass 3 — 2026-10-05
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 1, minor 10, decision-needed 0  |  Dropped/deferred in triage: 5 (+ duplicates merged)
Words (docs): 975 (3.00 x pass 0)  |  Snapshot: story-drag-interruptions-selection-replacement-hide-back-and-cance.passes/pass3.md (fix diff pass3.fix.diff)
### Applied
- [major] Description restore bullet/AC S — a plain cancel() (hide, act()) or press during a restoring fly-back (after pointercancel/lostpointercapture ended a replacing drag) unspecified and untested: finishes it, removes the class, keeps the selection, no deselect, no nav call (F24: the replacing drag already ended) → fixer item 1 (merged edge-case majors 1+2, adversarial and ref minors)
- [minor] class timing on release over nothing (at end()) → 2; byBack "stay throughout"/"lost-end recovery" wording vs closedByBack → 3; "Board root (its attach root)" is App's `<main>` → 4; computed face transform `none` → 5; plain cancel nav.pop queued only on hide → 6; "primary" press (F13) → 7; entry-8 tests cover existing paths, only the press-order S case is new → 8; inert foot pad on a drop-target column → 9; select-drag-hide then end() changes nothing → 10; __flyBack spy source named → 11
### Default applied (technical)
- cancel()/press during a restoring fly-back: finish, class removed, selection and entry kept, no nav call
- class on release over nothing removed at end() with the deselect
### Decision needed (functionality / UX / gameplay)
- none
### Dropped / deferred to the plan
- lift transition flake under --wc-base-ms (plan: expect.poll or no transition)
- inline --wc-lift beats stylesheet overrides (plan implementation detail)
- deselect() throws under a sticky WordCell view (CAP-9 ticket owns it; no sticky view yet)
- same-id new press sees the restored selection (covered by "resolves on the settled layout"; plan)
- fixture for a ≥ 2-card pickable tail (plan names it)
