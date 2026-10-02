# Review log — story-tap-select-foot-pads-and-tap-drop.md (ticket 4.7)

State: pass 5: done

Mode: docs, thorough, max 7, budget default (2.5x pass 0). Pass 0: HEAD cfe9343, copy story-tap-select-foot-pads-and-tap-drop.passes/pass0.md, 373 words. Intent includes tickets.toml entry 7 fields unknown, interface, tests, owns, risk, references (not copied at pull; fixer adds them to the Description in pass 1).

## Pass 1 — 2026-10-02
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 7, minor 7, decision-needed 0  |  Dropped in triage: 1
Words (docs): 1199 (3.21 x pass 0)  |  Snapshot: story-tap-select-foot-pads-and-tap-drop.passes/pass1.md (fix diff pass1.fix.diff)
### Applied
- [major] Description — nothing-selected taps on a column's empty space, placeholder or foot pad, and presses on a card of a column with canPickUp false, unspecified (SPEC CAP-6, rule-coverage R-14 transient row) → fixer item 1
- [major] Acceptance Criteria — Verify omits most R-14 tap rows, AD-13 pops (drop, deselect, Undo, Redo), the blocking.spec.ts case and fixtures → fixer item 2
- [major] Description/AC — desktop hover outlines named but not their conditions (source column only over empty space/placeholder/Here, nothing on selected top, grab only Idle playing nothing selected, media gate, pointerover DOM classes) → fixer item 3
- [major] Description — F25 path lacks its exclusions (column hit rects, [data-wordcell], view sheet and scrim, enabled controls) and the trailing-click rule; a scrim tap with a view above a selection would make deselect() throw → fixer item 4
- [major] References — terms and literals (wash, Here, F25, F26, four fixture renders) defined only in unreferenced docs → fixer item 5
- [major] Notes/Description — disabled-control fallback undefined and untested → fixer item 6 (default applied)
- [major] Description/AC — selected-state visuals (lift, outline, Here, wash) unverified; baseline clause → fixer item 7 (default applied)
- [minor] canDropOn wording → item 8; deselect location for Undo/Redo/Reload → item 9; foot touch-action AC literal viewport-dependent → item 10; F26 expected outcomes → item 11; Here non-button + text.ts → item 12; WordCell tap with nothing selected → item 13; held press on column card is a tap → item 14
### Default applied (technical)
- disabled controls — probe first; if Chromium does not deliver pointer events to a disabled button, `button:disabled { pointer-events: none }` so the press resolves to the enclosing background; result recorded in the plan
- selected visuals — computed-style P4 asserts, existing four baselines expected unchanged, no new screenshot
- Redo-with-selection fixture — session-idle-pending-draft; Undo — session-idle-empty-column; scrolling-viewport pan — entry 4's scrolling viewport
- Undo/Redo/Reload deselect — in each control's handler after `cancel()`
- Here pad — non-button label in the existing data-foot element, string in text.ts
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- source column empty space keeps --wc-pan while selected (adversarial stretch) — AD-11 row assigns none only to the foot row; spec scope

## Pass 2 — 2026-10-02
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 9, minor 7 (+3 unapplied, over budget), decision-needed 1  |  Dropped in triage: 1
Words (docs): 1226 (3.29 x pass 0)  |  Snapshot: story-tap-select-foot-pads-and-tap-drop.passes/pass2.md (fix diff pass2.fix.diff)
### Applied
- [major] Inert bullet / AC — "card of a column with canPickUp false" cannot occur in Idle (view.ts canPickUp = idle && …); test belongs to entry 10 → fixer item 1
- [major] F25 bullet / Controller Vitest — sheet and scrim do not exist until entry 11; no DOM marker → fixer item 2 (default applied)
- [major] Disabled controls — `button:disabled { pointer-events: none }` drops F3 title tooltips and contradicts build-notes' wrapper → fixer item 3 (default applied)
- [major] Disabled probe/AC — locator.tap() waits for enabled; cannot test a disabled button → fixer item 4 (default applied)
- [major] Desktop hover — classes set only on pointerover/pointerout go stale after select/drop/Undo/Redo with a still mouse → fixer item 5 (default applied)
- [major] AC — source-column empty-space self-drop untested (only Here) → fixer item 6
- [major] AC android — "desktop side margins" cannot run on android → fixer item 7
- [major] Tap-drop — entry 6 left the tail-selected capture of non-card column presses to this ticket; unspecified → fixer item 8 (default applied)
- [major] Inert bullet — "entry 10 adds the view" is entry 11 (wrong cross-reference, raised major by one reviewer) → fixer item 9
- [minor] foot styling per DESIGN.md Column slot (Here fill, dashed border) → 10; WordCell long-press wording → 11; eight baselines → 12; source placeholder unhoverable → 13; Game-over hover is entry 10's → 14; re-select outline is the tail → 15; F26/other none
### Default applied (technical)
- F25 sheet/scrim exclusion — gate the outside-tap deselect on overlays' top entry being tailSelection; sheet and scrim DOM classification left to entry 11
- disabled fallback — build-notes wrapper (non-button element carrying title receives the press), tooltip kept
- disabled taps — page.touchscreen.tap / page.mouse.click at the box centre, never locator.tap()
- hover — controller recomputes hover classes for the last pointer position after every select, re-select, deselect and dispatch
- tail-selected non-card column press — captured like a card press (setPointerCapture, contextmenu suppressed); tap drops
### Decision needed (functionality / UX / gameplay)
- Desktop hover, whole column tap-selected — when the player selects an entire column by tapping and hovers that same column's empty space or Here pad, which element shows the drop-target highlight? DESIGN.md defines it only for a drag (placeholder under the ghosts) and for a partial tail (lowest non-tail card). — proposed default: the Here pad takes the teal outline and wash
### Unapplied minors (over budget, add words)
- banner Reload setup (route abort of the dictionary URL) — leave to the plan
- non-pointer click activation path untested — controller Vitest case in the plan
- fixture for the canPickUp-false case — moot after item 1
### Dropped
- source column 7 cards may leave no empty space (edge) — merged into item 6's fixture choice

## Pass 3 — 2026-10-02
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 6, minor 8 (+4 unapplied, over budget), decision-needed 0  |  Dropped in triage: 1
Words (docs): 1312 (3.52 x pass 0)  |  Snapshot: story-tap-select-foot-pads-and-tap-drop.passes/pass3.md (fix diff pass3.fix.diff)
### Applied
- [major] Disabled controls — wrapper cannot receive the press while the disabled button stays the hit target; title placement unstated → fixer item 1 (default applied)
- [major] Select / P4 — lifted tail's soft shadow and selection/lift layer above the sticky bars (DESIGN.md Elevation & Depth) missing → fixer item 2
- [major] P4 — selection outline encloses the whole lifted tail (DESIGN.md Focus ring), not each face → fixer item 3
- [major] AC — tail-selected capture of empty-space/placeholder/foot presses untested (AD-11 contextmenu row) → fixer item 4
- [major] Desktop hover — recompute must also follow deselects outside the controller (Undo, Redo, Reload, back via closedByBack); untested → fixer item 5 (default applied)
- [major] Tap-drop / hover — "Here" read as the label, not the whole source foot pad (DESIGN.md Column slot) → fixer item 6
- [minor] locator.tap claim unverified → 7; whole-column fixture binding → 8; canDropOn reorder → 9; --wc-pan otherwise → 10; primary-action by test id → 11; probe step folded into the AC tap → 12; baseline reason "wrap fallback included" → 13; every foot's desktop number replaced → 14
### Default applied (technical)
- disabled fallback — the button gets pointer-events none only while disabled; a same-box non-button wrapper carries the title; role, name and data-testid stay on the button; baselines and locators unchanged
- hover recompute — from one reaction to overlays.selection and game.view (wired where the controller is wired), not per call site
### Decision needed (functionality / UX / gameplay)
- none new (pass 2 item still open)
### Unapplied minors (over budget, add words; for the plan)
- hover classes only for pointerType 'mouse' (match CAP-9)
- capture element for non-card presses: resolved [data-foot] for foot presses, [data-column] otherwise
- a drag with a tail selected in this ticket ends with no command and keeps the selection (entries 8–9 add drag)
- whole-column lift from column 1 drawing over the bar above — a plan check
### Dropped
- cut the non-pointer click clause (adversarial) — build-notes CAP-6 and F25 state it; the ticket mirrors the ref

## Pass 4 — 2026-10-02
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 1, minor 6 (+9 unapplied, over budget or plan-level), decision-needed 0  |  Dropped in triage: 0
Words (docs): 1337 (3.58 x pass 0)  |  Snapshot: story-tap-select-foot-pads-and-tap-drop.passes/pass4.md (fix diff pass4.fix.diff)
### Applied
- [major] Disabled controls / AC — probe and deselect test run only on android touch; SPEC CAP-6 makes a disabled control an outside region on desktop too and mouse input on disabled controls is handled separately → fixer item 1 (default applied: probe and test on both projects, page.mouse.click on desktop; disabled Undo added)
- [minor] AC desktop "and Here only" → source foot → 2; "cancel() never deselects" contradicts the AD-13 row → 3; "selected top" → "selected card" → 4; desktop stale-highlight check: Undo cannot run with a still mouse, keep back only → 5; R-11/R-20/R-22 tags inline on existing AC clauses (DoD) → 6; contextmenu clause covers empty-space and placeholder presses too → 7
### Default applied (technical)
- disabled-control probe — page.touchscreen.tap on android and page.mouse.click on desktop at the box centre; wrapper fallback if either gets no pointer events
### Decision needed (functionality / UX / gameplay)
- none new (pass 2 item still open)
### Unapplied minors (plan-level)
- hover reaction location: an $effect in App.svelte calling a controller hover refresh (a Controller member is allowed)
- "last pointer position" means inside the root; none after a pointerout to outside it
- desktop hover asserts computed style per DESIGN.md Card states, not class presence only
- deselect-before-dispatch/retry order: one UI Vitest per handler (spy order)
- disabled banner Reload during a held retry: a tap deselects
- top-bar outside taps include the score text
- another column's foot counts as "hovered anywhere"
- column and WordCell deselect paths are unreachable under a view in this ticket (entry 11's scrim)

## Pass 5 — 2026-10-02
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 1, minor 4 (+7 plan-level), decision-needed 0  |  Dropped in triage: 0
Words (docs): 1337 (3.58 x pass 0), no fix pass  |  Snapshot: story-tap-select-foot-pads-and-tap-drop.passes/pass4.md
### Open (not fixed; second consecutive pass with ≤ 1 major)
- [major] Description, Here bullet; AC P4 — "replacing the desktop column numbers" can be read as reusing the foot's `.number` span, which Column.svelte hides outside (hover: hover) and (pointer: fine), so Here would not show on android; the android Here tap is made off the label and P4 checks only the fill, so no AC catches it. Fix: "Here shown on touch and desktop (replacing the desktop number)" and "Here visible" in the android P4 feet clause (SPEC CAP-6 android success, DESIGN.md Column slot).
### Decision needed (functionality / UX / gameplay)
- none new (pass 2 item still open)

## Result — converged after 5 passes
open major: Here bullet / P4 — Here must be visible on android too (not the desktop-only `.number` span); assert "Here visible" in the android P4 feet clause.

Majors per pass: 7, 9, 6, 1, 1. Words 373 → 1337 (over the 2.5x budget from pass 1; later fixes kept terse). Technical defaults applied: 14. Decision-needed: 1 (pass 2, whole-column tap-selection hover highlight).

### Unapplied minors (for the build plan)
- Disabled controls: "in either project" → "in any project" (wrapper if any one project gets no pointer events)
- Foot-row AC: "a held non-card press" → "a held non-card column press" (outside presses are not captured)
- Select bullet: start "With nothing selected, …" (a tap on another column's card with a tail selected is a drop; overlays.select would throw); AC taps another column's upper card, not only its bottom card (R-20)
- Inert bullet: "with nothing selected" also governs the WordCell clause
- Wrapper carries the title only while the button is disabled (F3 tooltips unchanged)
- Banner Reload's full-reload path relies on AD-13's launch rewind
- Whole-column self-drop column: default column 5 (same as the partial case)
- Disabled primary-action tap waits for the dictionary to be ready
- Faces keep pointer-events none under the lift class (F26)
- Pass 4 plan-level list above (hover reaction in App.svelte $effect; last pointer position inside the root; hover computed-style asserts; deselect-before-act spy order; disabled Reload during a held retry; score text as a top-bar outside point; another column's foot counts as hovered; column/WordCell deselect unreachable under a view)
- Pass 3 list above (pointerType 'mouse' only for hover; capture element; drag with a tail selected keeps it in this ticket; whole-column lift over the bar above)

Owner decision (2026-10-02, spec F31): pass 2 decision-needed item answered: the Here pad gets the teal drop-target outline and wash.
