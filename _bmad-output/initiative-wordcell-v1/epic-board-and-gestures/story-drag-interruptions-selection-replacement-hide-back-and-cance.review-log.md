# Review log — story-drag-interruptions-selection-replacement-hide-back-and-cance.md (ticket 4.9)

State: pass 1: done

Mode: docs, thorough, max 7, budget default (2.5x pass 0). Pass 0: HEAD c1c5974, copy story-drag-interruptions-selection-replacement-hide-back-and-cance.passes/pass0.md, 325 words. Intent includes tickets.toml entry 9 fields interface, tests, owns (and unknown, already in Notes), not copied at pull; fixer adds them to the Description in pass 1.

## Pass 1 — 2026-10-05
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 11, minor 10, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): pending  |  Snapshot: pending
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
