# Code review loop — ticket 6.11 build (dd013d3..4bbf09d)

State: pass 2: done
Pre-loop: HEAD 4bbf09d, tree snapshot 0 10bd112d8494982e4badbc10bfed0ab592ff696f; target diff `6-11-build.passes/pass0.diff`.
Intent: story-keyboard-board-keys-focus-moves-and-tooltips-plan.md. Depth thorough, max 7.

## Pass 1 — 2026-10-15
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 4, minor 7, decision-needed 1  |  Dropped in triage: 1 (drag-start focus test as major: plan records the pointer-press native focus as a reviewed deferral, "no programmatic focus" reading; kept as minor test)
### Applied (sent to fixer)
- [major] e2e/board-keys.spec.ts, focus-follow.ts — no test of Undo/Redo inside Composing and Place (focus loss without phase change); no unit test of createFocusFollow.sync/recover → fixer 1
- [major] keys.ts match ' '/'Enter' — Shift+Space / Shift+Enter act; ticket: a Shift chord with no row is a no-op → fixer 2
- [major] controller.test.ts — peek stays open on column select/re-select/deselect, closes on phase/word-data change; the 'a select leaves none to close' test asserts the opposite → fixer 3
- [major] keys.test.ts — Enter on a column card taps in Composing and Place, canValidate/canConfirm true and false → fixer 4
- [minor] keys.test.ts / text.test.ts — tautological label assertions (use literals) → fixer 5
- [minor] board-keys.spec.ts — Tab walk through tray and strip, one stop each → fixer 6
- [minor] keys.test.ts — ArrowUp/Down wait while pop pending; Space on WordCell in Composing/Place during pending pop pinned → fixer 7
- [minor] focus-board.ts — remove unused focusCell; keys.test only-blocks boundary; cancel-first test presets tileSelection → fixer 8
- [minor] e2e: drag start steals no programmatic focus assertion; unit test parsing SESSIONS.flow6 literals → fixer 9
### Default applied (technical)
- all of the above test additions and the Shift guard (Shift+M/N/? left as 6.10 had them)
### Decision needed (functionality / UX / gameplay)
- Card.svelte .card:focus-visible — the card focus ring is drawn inside the card (offset −2px) while DESIGN.md says 2px offset with a table gap. Player-visible: ring look on column cards. Proposed default: keep (the inside ring avoids clipping by neighbouring cards); owner reviews screenshots.
### Dropped
- see header
Snapshot: tree d0162160b30690979ec5a35b8cb615d9da69f82b (fix: focus-follow.test.ts new, controller.ts settle(keepHover) bug fix, keys.ts Shift guard; npm test/lint/check pass)

## Pass 2 — 2026-10-15
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 5, decision-needed 0  |  Dropped in triage: 0 (the view-row crash was reported by two reviewers; merged with the "reimplements the controller path" minor)
### Applied (sent to fixer)
- [major] keys.ts view row run — overlays.deselect() runs before the open sticky view is closed; stack [tailSelection, wordcellView] (long-press peek released to sticky) makes Space throw AD-13 → close view first, then deselect (order of Controller.activate); keys.test + e2e case → fixer 1
- [minor] keys.ts view row — duplicates the controller view-open sequence; reuse a shared helper where it fits without churn → fixer 1
- [minor] e2e: `+`/`-`/Flip focus stays on a live tile (not body) → fixer 2
- [minor] e2e expectNoop also compares selection/tileSelection → fixer 3
- [minor] e2e Tab order continues past cell 10 to primary-action → fixer 4
- [minor] literal assertion that Give up has no tooltip/key row (deleted in pass 1) → fixer 5
### Default applied (technical)
- all of the above
### Decision needed (functionality / UX / gameplay)
- none (open sub-question, not blocking: Space on a cell whose view is already open closes and reopens it — kept)
Snapshot: tree 6e57ddb49834439641a700bfde2030ac0efe1efe (fix: view row closes sticky view before deselect; tests; npm test/lint/check pass; Tab test asserts disabled primary-action in Idle instead of focusing it)
