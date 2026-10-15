# Code review loop — ticket 6.11 build (dd013d3..4bbf09d)

State: done
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

## Pass 3 — 2026-10-15
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 2, minor 4, decision-needed 0  |  Dropped in triage: 0 (Tab-past-cell-10 "not run": the pass-2 fixer ran board-keys on desktop, 46 passed)
Note: majors 4, 1, 2 — not a divergence of refs (pass 3's are a new restore-path gap and a test gap), the loop continues; pass 4 bar tightens.
### Applied (sent to fixer)
- [major] focus-follow.ts sync — first sync only records the phase, so a restore into Composing or Place leaves focus on body; ticket: "whatever the cause", only the first Idle paint moves no focus → on the first sync follow the phase when it is composing/place and no surface owns focus (Idle and Game over stay no-ops; the sheet owns Game over) + unit and e2e restore tests → fixer 1
- [major] focus-target.ts readFocus untested (keys.test mocks it) → focus-target.test.ts with a fake document, and an e2e: Enter/Space on a focused Undo/Menu button in Composing does not fire a board row → fixer 2
- [minor] focus-follow.test.ts — surfaceOwnsFocus yield and column-card recovery branch; drop/retitle the +,-,F e2e that cannot fail on recovery → fixer 3
- [minor] keys.test.ts — Enter on a non-empty cell with a tail selected (deselect, no view) and with stack [tailSelection, wordcellView] → fixer 4
- [minor] keys.ts view row — duplicate view-open sequence kept inline: add a comment citing Controller.activate (log correction: no shared helper was extracted in pass 2) → fixer 5
### Default applied (technical)
- all of the above
### Decision needed (functionality / UX / gameplay)
- none
Snapshot: tree 5a93b13aedba4d7c60e176fa0d5d3d23d5bde0f6 (fix: first-sync phase follow on restore, focus-target.test.ts, tests; npm test/lint/check pass)

## Pass 4 — 2026-10-15
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 1, decision-needed 0  |  Dropped in triage: 0
Note: pass 3 e2e run is recorded here: the pass-3 fixer ran board-keys + tooltips on desktop and android (50 passed, 40 skipped), including the four new tests.
### Applied (sent to fixer)
- [major] Card.svelte focusable/tabindex — ticket "Only the live element per card is focusable, never a mirror" has no proving test → add a test (UI Vitest or desktop e2e) that every [data-mirror-of] has no tabindex and exactly one element per data-card-id is focusable, in a state with mirrors (drag parting shift, ghost) → fixer 1
### Default applied (technical)
- the above
### Decision needed (functionality / UX / gameplay)
- none
Snapshot: tree 28af484dbd43feedcd8ec9cd1a0c8287376365ca (fix: mirror-focus e2e; npm test/lint/check pass; e2e desktop+android pass)

## Pass 5 — 2026-10-15
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 2, decision-needed 0  |  Dropped in triage: 0
### Applied
- none (converged)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none new (carried from pass 1)

## Result — converged after 5 passes
Majors per pass: 4, 1, 2, 1, 0. Final: npm test 2667 passed, lint clean, check 0 errors (state unchanged since pass 4 checkpoint).
Carried decision-needed (pass 1): Card.svelte card focus ring drawn inside the card (offset −2px) vs DESIGN.md 2px offset with a table gap; proposed default keep.
Unapplied minors:
- e2e Mirrors test selects `[data-mirror-of]`; static mirrors (`.card.static`, no data-mirror-of) are not asserted tabindex-free.
- keys.test.ts Enter/Space on a column card in Composing/Place runs against a mocked controller; no e2e presses them for the real outcome (ticket line says "taps it ... canValidate true and false"; code treats Place/Composing column-card as inert except destination card with k) — reword ticket or add an e2e.
- keys.ts view row duplicates Controller.activate's view-open sequence (comment added, no shared helper).
- Pointer press natively focuses a card (plan deferral).
- Space on a WordCell whose view is open closes and reopens it.
- Flow 6 stand-in session (owner reviews).
