# Review loop log — EXPERIENCE.md

Target: `_bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md`
Mode: docs · max 4 · depth thorough · refs: brief, `docs/game-flow-spec.md`, `docs/requirements-carryover.md`,
`docs/platform-decision.md`, `CLAUDE.md` (DESIGN.md read as companion only). Pre-loop state: `e119791`, pass-0 copy in scratchpad.

## Pass 1 — 2026-09-27
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 30, minor 27 (merged to 23 fix items)  |  Decision needed: 0  |  Dropped in triage: 0 (duplicates merged)
### Applied
- [major] Keyboard — digit key removed a free letter, contradicting R-33 → add-only; removal via the focused tile
- [major] Flow 1 — failure path impossible with adjacent slots → release over the WordCell row; overlap note between columns
- [major] Word line / Flow 1 — `+36` preview wrong under R-80 → net change, `+30`
- [major] Placement strip — imported "return" let Place remove a free letter (R-39, R-71) → second tap only deselects in Place
- [major] WordCell view — closing tap and desktop hover collided with add/target clicks → hover is a non-modal peek (A-E15); sticky view consumes its closing tap
- [major] End sheet — relaunch into game over, Redo into win, back/Esc, reopen undefined → specified
- [major] IA — back could not clear a tap-selection → selection pushes a history entry
- [major] Validate — "always shows reason" vs Idle; precedence of reasons → reason is the label, precedence set, rule limited to Composing
- [major] Free-letter drag — no overlap criterion (CLAUDE.md rule 4) → 25 % overlap with the tray band
- [major] Tiles released outside tray/strip undefined → snap back, never a removal
- [major] Keyboard — focus after phase changes, overlay scope, Enter on buttons → rules added
- [major] Tray outside thumb reach (brief §9) → follows DESIGN A-D8
- [minor] ×11 — band thresholds as R-83 formula plus English cutoffs, ghost slots inert, Redo clears invalid line, commands during drag cancel it, Flow 2 swap wording, R-11 coverage, average rounding and longest-word tie, `—` and Show timer default, A-E10 inline, fixed-height exception, session-vs-history precedence, digit/↑ edge no-ops, modifier rule
### Decision needed
- none
### Dropped
- none

## Pass 2 — 2026-09-27
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 16, minor 34 (merged to 24 fix items)  |  Decision needed: 1  |  Dropped in triage: 0 (duplicates merged)
### Applied
- [major] Dictionary banner hid score and timer (R-82, R-76) → strip under the top bar
- [major] End sheet history line lacked the version (spec §2, Q-33) → repeats the history message with version and Reset
- [major] Taps on controls while a tail is selected unspecified (R-14) → any tap outside the columns deselects; enabled controls then act
- [major] End sheet scrim tap and focus undefined → scrim tap collapses; focus rules
- [major] Space/Enter on focused cards and WordCells undefined → tap equivalents per phase; Esc custom; case-insensitive keys
- [major] Modal sticky view vs active shortcuts → shortcut closes the view first
- [major] History entries for peeks and pop/push ordering → only the sticky view pushes; pop completes before push
- [major] Replaced selection released over no column → nothing selected
- [major] Unparseable Session and corrupt known-version history had no message → variants added; New game on rejection needs no confirm
- [minor] ×15 — Idle Validate label while dictionary loading/failed, tile-selection lifetime, empty WordCell no-op, insertion-gap range, pointercancel for WordCell drags and peeks, Redo-commit animation and Undo during win animation, singular penalty, tile snap-back criterion, hover scoping, flows now use WordCell view and Preferences, inline A-E11–A-E14, R-12/R-61 coverage and R-42 split, Flow 1 failure wording, text-size rule
### Decision needed
- Drop targeting / R-14 — a short drag released over its own source column is a self-drop that opens Composing; should a drag whose target never left the source column be a cancel instead? — proposed default: yes, cancel; needs a spec change to R-14 (added to Open questions, PROPOSED BY REVIEW)
### Dropped
- none

## Pass 3 — 2026-09-27
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 6, minor 27 (merged to 18 fix items)  |  Decision needed: 0 new  |  Dropped in triage: 0 (duplicates merged)
### Applied
- [major] WordCell — the pass-2 empty-cell no-op blocked setting an empty target in Place (R-40) → scoped to viewing only
- [major] Keyboard — `Enter`/`Space` on a WordCell with a tail selected ignored R-14 → Enter is exactly the tap; Space and every key-opened overlay clear the selection first
- [major] D-block controls — disabled (here) vs hidden (DESIGN) → hidden, caption replaces them, keys no-op
- [minor] ×15 — shortcuts only act when their control is enabled, one history entry per selection and per expanded end sheet, tile selection ends on control presses, Reload retries in place, drags from elsewhere inert, overflowing peek stays open, reset-from-end-sheet outcome, Flow 4 explicit score, gestures during the win animation, focus after key edits, hover k−1 preview, Flow 2 and Flow 6 wording, A-E14 wording, column rects stable between gestures
### Decision needed
- none new (the self-drop question from pass 2 remains open)
### Dropped
- none

## Pass 4 — 2026-09-27
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 6, minor 30 (merged to 22 fix items)  |  Decision needed: 0 new  |  Dropped in triage: 0
### Applied
- [major] Tile selection — "a no-op tap keeps it" contradicted the phase matrix → explicit keep list; every other tap clears
- [major] History — entries not popped when a surface closes by a non-back path; stale entries after reload; overflowing peek turning sticky had no entry → pop on any close, replaceState at launch, ignored orphan popstate, sticky-peek entry stacked above a kept selection
- [minor] ×20 — keys during a drag cancel it, preview/spoken formats, focus targets, column/tray exception wording (leftover first), long stationary press is a tap, R-35 row, invalid line not restored, Flow 4 final score, same-letter swap is an edit, key-selected foot pads, Space on empty cell deselects, reduced-motion scope, Place tray contents and Flow 1 meta, longest-word string flagged for architecture (A-E16), Flow 2 position and swaps, hover only while playing, "at most one command", end-sheet longest-word tie, Esc vs back for tile selections, focus after key selection
### Decision needed
- none new; the pass-2 self-drop question stays open

## Result — capped at 4 passes
Majors fell 30 → 16 → 6 → 6 but did not reach zero. The pass-4 fixes were applied and are not re-reviewed. The late majors were interaction-state bookkeeping (history entries, selection lifetime), not ref contradictions; no ref needs fixing.

## Owner answers — 2026-09-27
- Short drag: a drag whose target never left the source column is a cancel. Added to the spec as Q-34 (R-14 amended, spec v0.7); open question removed.
- Tray position: directly under the WordCell row; action bar stays at the bottom.
- All other assumptions confirmed; A-E16 (longest word's spelling in the record) moved into the spec as Q-35 (R-84).

## Pass 5 (requested by the owner, beyond the cap) — 2026-09-27
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 5 (3 distinct after merge), minor 30  |  Decision needed: 0  |  Dropped in triage: 0
### Applied
- [major] Hover peek differed from DESIGN.md → aligned; `+n older cards` in the catalogue
- [major] Hover drop highlight on source-column cards → limited to where a click drops
- [major] Flow 1 Q-34 variant was below the drag threshold (would be a tap) → 20 px drag, plus the sub-8 px counter-case
- [minor] ×18 — A-E16 replaced by R-84/Q-35, back during a drag, keys close peeks, relaunch order with unreadable history, overlap clause informative, arrow-key ends, U+2212 scores, long press on empty cell, history-notice dialog stacking and back, uppercase `QU` strings, destination-card drag timing, score change wording, winning-animation key handling, shortcut enable rule scope, Flow 6 position, score reset on new game, focus after a winning commit, R-84 coverage row

## Result — finalized after pass 5
All pass-5 majors fixed; no open questions. Status set to final.
