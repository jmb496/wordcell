# Code review loop — ticket 6.11 build (dd013d3..4bbf09d)

State: pass 1: done
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
