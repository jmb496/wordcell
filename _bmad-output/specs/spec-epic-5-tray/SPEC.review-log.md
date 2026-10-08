# Review log — spec-epic-5-tray SPEC.md (run 2)

State: pass 7: done

Target: `_bmad-output/specs/spec-epic-5-tray/SPEC.md` (docs mode, thorough, max 7). Second run after run 1 (`SPEC.review-log-run1.md`) diverged at pass 3; its upstream gaps were fixed in 972c4e2.
Pre-loop: HEAD 972c4e2; copies `SPEC.review-log.passes/pass0.{SPEC,build-notes,rule-coverage}.md`; SPEC.md 5805 words (build-notes 3235, rule-coverage 2270). Growth budget ~14 500 words (2.5x).

## Pass 1 — 2026-10-08
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 10, minor 17, decision-needed 1  |  Dropped in triage: 2 (duplicates merged across reviewers: cells lookup ×2, deferred-play ×3, inert drag ×3, CAP-9 add ×2, caret ×2, F7 win ×2; auto-repeat folded into the guard major; "gate held at release" claim disproved: `end()` leaves the gate before the dispatch, kept as a note in item 4)
Findings handed to the fixer: `SPEC.review-log.passes/p1-findings.md`
Words (docs): SPEC 6579 (1.13 x pass 0; build-notes 3792, rule-coverage 2364)  |  Snapshot: SPEC.review-log.passes/pass1.{SPEC,build-notes,rule-coverage}.md; fix diff pass1.fix.diff
### Applied
- [major] build-notes CAP-1 Tags — free-letter tag looked up `cells` by cell number → lookup by `cell` field via CAP-3 helper → item 1
- [major] Capabilities build order — CAP-2 tile-selection clear moved to CAP-4; F17 landings moved from CAP-5 to CAP-8 → item 2
- [major] F7/CAP-8 — drag-release capture runs before the controller clears drag transforms → item 3
- [major] CAP-9/AD-11 — deferred play: invert applied in the move's update, play waits; tray mode/rows latched with the band; guard installs at dispatch → item 4
- [major] CAP-5/F3 — reorder: parting opening is the gap's only mark; gap rects hit-test only → item 5
- [major] CAP-10/F8 — guard window defined by events (first click, key repeats, other pointers, backstop) → item 6
- [major] CAP-8 P5 — F17 moves (tap-add, removal, tap-swap, k change, edit release, no-edit flyBack) tested → item 7
- [major] CAP-8/CAP-10 P5 — Slow seed and `getAnimations()` in the triggering evaluate → item 8
- [major] CAP-6/AD-14 — mirror parting shift vs AGENTS.md pitfall and epic Done when 4: close-out edits → item 9
- [major] F18/F5 — drag ends leave no tile selection, platform interrupts included; EXPERIENCE.md close-out → item 10
- [minor] items 11–27 (inert drag generalised, CAP-6 side right, CAP-10 P5 split, F7 Redo/win wording, CAP-9 viewports, R-41/R-61 two tests, caret capacity, OQ-5→F21, disabled taps, CAP-9 add, Done when 3 outside band, target cell visibility, translate-only, hover peek during guard, long-press release, success signal, CAP-1 Place order)
### Default applied (technical)
- CAP-9 deferred play — invert in the move's update, play after the gate idles
- CAP-10 guard — event-defined window with a 1 × base backstop
- CAP-8 — translate-only FLIP; target cell's previous cards visible until first landing
- CAP-10 — hover-peek timer suppressed while the guard is installed
- CAP-8/CAP-10 P5 — Slow seed, same-evaluate `getAnimations()`
### Decision needed (functionality / UX / gameplay)
- CAP-8/F17/AD-14 (OQ-6) — on Validate (and Undo to Composing) the destination letters glide from (to) the destination column while their tray-block copies vanish/reappear without motion; should they instead appear to glide from the tray block? — proposed default: from/to the column, as AD-14 implies
### Dropped
- "gate still counts the gesture at release" — disproved (`controller.ts` `end()` calls `gate.leave()` before the drop dispatch); kept as an as-built note
- duplicates merged (see header)

## Pass 2 — 2026-10-08
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 9, minor 13, decision-needed 0  |  Dropped in triage: 0 (merged: guard window/listeners/held Enter/backstop → 1; deferred play ×2; interim render ×2; free-letter append preview reclassified decision-needed → major, DESIGN.md "the insertion point is previewed" supplies the intent)
Findings handed to the fixer: `SPEC.review-log.passes/p2-findings.md`
Words (docs): SPEC 7091 (1.22 x pass 0)  |  Snapshot: SPEC.review-log.passes/pass2.*.md; fix diff pass2.fix.diff
### Applied
- [major] F8/CAP-10 — guard rule stated once in F8: six capture listeners, triggering and later gestures consumed (key repeats, keyup), `duration('snap')` backstop after settle → item 1
- [major] CAP-8/CAP-9 — a gate-deferred FLIP play is part of `finishAll()` → item 2
- [major] CAP-9 — interim render while deferred: overflow row at latched size, band and hit rects unchanged → item 3
- [major] Constraints AD-14 — amendment overrides AGENTS.md pitfall / Done when 4 until their edits land (due before CAP-5 is ticketed) → item 4
- [major] CAP-6 — parted block mirrors' segment ends and locks from parted slots → item 5
- [major] CAP-6/F16 — caret marks an accepted free-letter gap that moves no tile (DESIGN.md "the insertion point is previewed"); F16 extended, outcome kept → item 6
- [major] CAP-8/CAP-10 P5 — same-evaluate only for click/key actions; pointer cases read right after release → item 7
- [major] CAP-10 P5 — guard WordCell tap on non-empty cell 6 with a post-settle control → item 8
- [major] CAP-10 — hover-peek suppression test → item 9
- [minor] items 10–22 (tapAt move, `idle` phase, R-38 exempt, reduced-motion P5, badge before commit, wrapper width close-out, latched rows, success-signal drags, `setTarget` kind, double-tap fixture, long-press vs drag order, Constraints wording, R-75 kind)
### Default applied (technical)
- F8 — backstop `duration('snap')`, counted from install if the triggering gesture already ended
- CAP-9 — interim overflow row at latched size
- CAP-2 — double-tap P5 on `session-composing`
### Decision needed (functionality / UX / gameplay)
- none new (OQ-6 open)
### Dropped
- none

## Pass 3 — 2026-10-08
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 13, decision-needed 0  |  Dropped in triage: 0 (merged: overflow row ×3, New game "dispatches" ×2, backstop wording folded into the guard major; free-letter own-cell flight reclassified major → minor)
Findings handed to the fixer: `SPEC.review-log.passes/p3-findings.md`
Words (docs): SPEC 7473 (1.29 x pass 0)  |  Snapshot: SPEC.review-log.passes/pass3.*.md; fix diff pass3.fix.diff
### Applied
- [major] F8 — the triggering gesture's remaining events are consumed but never complete the animation; keydown after settle in the backstop window passes through → item 1
- [major] CAP-9 — interim overflow row drawn below the last latched row over the control row, no hit rect; post-`finishAll` reflow is a settled jump → item 2
- [major] F5/CAP-5 — back mid-drag in Composing/Place follows the bare-Board rule (leaves the app); hide flush settles the drag; P5 via `page.goBack()` → item 3
- [major] CAP-8 P5 — controller-classified presses (taps and drags) read after touch end; same-evaluate click only for `act()` buttons → item 4
- [major] CAP-1 P5 — origin tag from a cell other than 3 seeded by `session-place-compact`'s `QU` free letter → item 5
- [minor] items 6–18 (own-cell used mirror in flight, build-notes heading, four `tapAt` copies, F17–F21 preambles, New game wording, R-73 reload split to CAP-4/CAP-7, busy-at-dispatch invariant, caret wording, R-32 P5 items, 8–14 tiles, OQ-6 default in CAP-8, root tap path, `↩` assertion moved to CAP-4)
### Default applied (technical)
- CAP-9 — overflow row geometry during deferral
- F5 — back mid-drag tested as leaving the app (`page.goBack()`)
### Decision needed (functionality / UX / gameplay)
- none new (OQ-6 open)
### Dropped
- none

## Pass 4 — 2026-10-08
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 15 (+2 folded into majors), decision-needed 1  |  Dropped in triage: 0 (late-pass bar applied; merged: guard trigger tracking + stuck guard → 1; overflow press ×2; mirrors-row ×2; reduced-motion fade reclassified major → minor: EXPERIENCE.md Motion and the epic 4 fly-back define the fade, only the "lands" moment was open)
Majors 5 → 5: neither rising nor ≤ 1; fix pass runs.
Findings handed to the fixer: `SPEC.review-log.passes/p4-findings.md`
Words (docs): SPEC 7990 (1.38 x pass 0)  |  Snapshot: SPEC.review-log.passes/pass4.*.md; fix diff pass4.fix.diff
### Applied
- [major] CAP-5/rule-coverage AD-12 — back mid-drag asserts the Session equal apart from `activeMs`, read via `storageState()` or `goForward()` → item 1
- [major] F8 — always-installed open-gesture tracker in `motion.ts`; hide and `blur` close consumed gestures; Undo pass-through keeps the triggering key consumed → item 2
- [major] CAP-9 — a press on the overflow row is a tray-background tap; overflow row counts as a row for gaps and parting → item 3
- [major] Constraints/build-notes — epic Boundaries "No engine change" edit due before CAP-1; Constraints name it → item 4
- [major] rule-coverage AD-14 row — mirrors take no part in the FLIP glide (D-block parting excepted) → item 5
- [minor] items 6–16 (reduced-motion "lands", fallback fixture, R-73 headings, CAP-6 acceptance, F3 free letter, double-tap outcome assertion, `session-idle-fresh`, D block across a row break, meta Vitest, F1 plain selection on cancel/hide, R-80 row)
### Default applied (technical)
- F8 — open-gesture tracker; hide/`blur` close consumed gestures
- CAP-9 — overflow-row presses resolve as tray-background taps
- F1 — plain tile selection kept on `pointercancel` and hide/show (epic 4 F24 analogy)
### Decision needed (functionality / UX / gameplay)
- F8/CAP-10/Done when 5 (OQ-7) — with reduced motion or Fast speed, a quick double tap on a winning Confirm can land on New game after the short win animation; block it for a minimum window whatever the speed? — proposed default: yes, guard at least 300 ms after the win
### Dropped
- none

## Pass 5 — 2026-10-08
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 3, minor 15 (+3 left to ticket plans), decision-needed 0  |  Dropped in triage: 0 (merged: overflow row 0-row/multi-row + pointer-events conflict ×3 → 1; band-shift invert + scroll-deferred viewport rects → 1 FLIP coordinate-frame major; main.ts hide registration folded into the tracker major)
Majors 5 → 3.
Findings handed to the fixer: `SPEC.review-log.passes/p5-findings.md`
Words (docs): SPEC 8274 (1.43 x pass 0)  |  Snapshot: SPEC.review-log.passes/pass5.*.md; fix diff pass5.fix.diff
### Applied
- [major] F8 — hide and `blur` clear every tracked gesture; `main.ts` registers the hide-clear via `registerBeforeHide` (AD-9) → item 1
- [major] CAP-9 — overflow rows wrap at `perRow` (from the tile area top at 0 latched rows), a transparent blocker resolves presses as tray-background taps → item 2
- [major] CAP-8 — FLIP coordinate frame: band-relative within a band, document coordinates across bands and for deferred plays → item 3
- [minor] items 4–18 (F8 completing gesture consumed, pending hover timer cleared, strip-tile swap, F17/CAP-5 no-edit release, F3 nearest rect, AD-12 close-out no restore, Done when 3 close-out, Place reload fixture, reduced-motion kinds, 52 live elements mid-animation, R-80 relabel, `goForward()` default, fixture fallback, R-71 state, line 67)
### Default applied (technical)
- CAP-9 — overflow rows and blocking element
- CAP-8 — FLIP coordinate frames
### Decision needed (functionality / UX / gameplay)
- none new (OQ-6, OQ-7 open)
### Dropped
- none; left to ticket plans: parted faces' return duration (CAP-5), the R-41/R-61 fixture's start phase and word (CAP-7), the Playwright held-Enter mechanism (CAP-10)

## Pass 6 — 2026-10-08
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 2, minor 13, decision-needed 0  |  Dropped in triage: 0 (merged: anchor-delta in document coordinates ×2, R-42 row ×2; multi-row overflow over WordCells reclassified major → minor: the window is the ~150 ms scroll-busy deferral)
Majors 3 → 2.
Findings handed to the fixer: `SPEC.review-log.passes/p6-findings.md`
Words (docs): SPEC 8485 (1.46 x pass 0)  |  Snapshot: SPEC.review-log.passes/pass6.*.md; fix diff pass6.fix.diff
### Applied
- [major] CAP-8 — band-changing cards start from the on-screen rect before the re-layout; the anchor `scrollTop` delta never counts as motion; 412 × 780 band-change Vitest → item 1
- [major] CAP-4/F1 — an inert-target drag acts on the selection only when it ends in `pointerup`; `pointercancel` keeps it → item 2
- [minor] items 3–15 (overflow clipped to the band, R-42 reload fixture, R-65 peek P5 owner, Boundaries edit due before CAP-10/CAP-11, OQ-6/OQ-7 gate CAP-8/CAP-10 tickets, hover-peek module split, lookup helper keeps messages, Idle word line, wrapper pitch both ways, dictionary-loaded precondition, Playwright repeat mechanism (checked in 1.63 source), k change with block left, F3 start-gap rect)
### Default applied (technical)
- CAP-8 — FLIP start rect excludes the anchor delta
- CAP-4 — inert-target drag acts at `pointerup` only
### Decision needed (functionality / UX / gameplay)
- none new (OQ-6, OQ-7 open)
### Dropped
- none

## Pass 7 — 2026-10-08 (verify-only)
Reviewers: fix diff (pass6.fix.diff only)  |  Findings: major 1, minor 1, decision-needed 0  |  Dropped in triage: 0 (the 14 → 15 `+` example in the major is wrong: the new D card stays live in its column and its tray copy is a mirror; the 0 → n Undo case holds)
Words (docs): SPEC 8485 (1.46 x pass 0); no fix pass (cap).
### Open major (not fixed)
- CAP-9 / build-notes CAP-9 — pass-6 item 3 clips the overflow rows to the tray band's rect, but during a scroll-deferred play the faces of band-changing cards (e.g. a 0 → n Undo from Idle into Place) are held at their captured rects outside the band, so the clip hides them until the gate idles — proposed fix: clip only the blocking element to the band; never clip a face held at its captured rect
### Unapplied minors
- CAP-9 "plays from the captured rects" → "… in CAP-8's coordinate frame" (pass 7)
- CAP-5 parted faces' return duration (left to the ticket plan, pass 5)
- CAP-7 R-41/R-61 scripted fixture's starting phase and validated word (left to the ticket plan, pass 5)
- CAP-10 Playwright held-Enter mechanism — later applied in pass 6 item 13; nothing left

## Result — capped at 7 passes (open majors: CAP-9 overflow-row clip hides held faces during a scroll-deferred play)
Majors per pass: 10, 9, 5, 5, 3, 2, 1. Decision needed (owner): OQ-6 (destination letters glide from the column on Validate/Undo), OQ-7 (minimum winning-guard window under reduced motion / Fast). Unapplied minors: 3 (above, the held-Enter item excluded).
Note for upstream: most late majors (passes 2–7) came from the AD-11 page-scroll deferral of a move's re-layout and glide (interim overflow rows, held faces, coordinate frames). If the architect resets scroll-busy at every dispatch (as `gate.scrollReset` already does on hide), that path and its CAP-9 machinery could go; this is a spine AD-11 change and needs the owner's say (AGENTS.md rule 7).

## Owner answers — 2026-10-08
- OQ-6 → F22 (D letters glide from/to the column; tray-block copies at once). OQ-7 → F23 (guard ≥ 300 ms after the win at any speed; double tap also under reduced motion and Fast; spine AD-14, EXPERIENCE.md Motion amended).
- Spine AD-11 amended (F24): every move clears page-scroll busy first; the scroll-deferred play, overflow rows and blocking element are gone from CAP-8/CAP-9, which closes the open major. Code change: CAP-9 (`flip.capture()` calls `gate.scrollReset()`). DESIGN.md Tray band amended.
- Unapplied minors: the pass-7 CAP-9 wording is obsolete (path removed); the CAP-5 and CAP-7 items stay with the ticket plans.
