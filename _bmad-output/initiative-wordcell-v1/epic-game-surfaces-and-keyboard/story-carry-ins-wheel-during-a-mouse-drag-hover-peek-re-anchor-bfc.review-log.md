# Review log — story-carry-ins-wheel-during-a-mouse-drag-hover-peek-re-anchor-bfc

State: pass 5: done

Pre-loop: HEAD d994852, pass0.md 210 words, budget 1500 words (epic precedent for fleshed-out tickets; caller gave none). Ticket intent also includes tickets.toml entry 14 fields: unknown, interface, tests, owns (and consumers, already partly absent).

## Pass 1 — 2026-10-15 22:40
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 7 (merged), minor 5, decision-needed 0  |  Dropped in triage: 0 (many duplicates merged)
### Majors (triaged, merged)
1. Wheel clause undefined: mechanism (scroll delta added to drag offset / re-run face update, highlight and drop-target pick against post-scroll rects and re-clipped AD-12 band with no pointermove), scrolling element (window vs `[data-view-scroll]`), release straight after scroll, no-op wheel at page end, mouse only, tile and free-letter drags too.
2. Interface conditional ("listener only if the repro needs it") untestable: the code gap is certain (retro F3); write the failing test first, listener allowed, removed on drop/cancel, no defensive fallback (rule 6), gate.ts busy semantics stated.
3. Hover-peek "after layout shifts" undefined: name shifts (width/resize, dictionary banner, card-count change), anchor above the cell per DESIGN.md (line ~530) with a pixel tolerance, kind desktop P6, outcome when the cell leaves the band/pointer.
4. bfcache item: define "swallows a real back" (hide → pageshow persisted → next Back/Esc must pop the top surface; nav pending-back counter zero), ordered attempts (AD-17 pageHide/pageShow({persisted}) first, then a real bfcache navigation), what the non-reproduction build-notes line records, fix confined to AD-9/AD-13 contract.
5. Tests unmapped: kind, project and AD-n name prefix per case, CAP-12/A8 citation, failing-first run recorded in the plan (never a committed red test), rule-coverage P6 row.
6. Consumers dropped: the plan lists every existing drag test (controller.test.ts describes, e2e drag specs) as the regression set kept green.
7. Source fields unknown/interface/tests/owns/consumers not in the ticket (caller directive); Verify names test:screens with no screens spec: state baselines unchanged (regression gate).
### Minors
- WordCellRow label move was done in 6.13: state A8 owns only the three items. Touch drags unchanged; modal-overlay wheel not a drag case; a drag start closes the peek. Link open question to SPEC Assumption (resolves at build time, no owner input).
### Default applied (technical)
- all seven majors: reviewers' proposed defaults.
### Decision needed
- none
### Dropped
- none
Words (docs): 760 (3.6x pass 0, within the 1500 budget)  |  Snapshot: story-carry-ins-wheel-during-a-mouse-drag-hover-peek-re-anchor-bfc.review-log.passes/pass1.md
### Applied
- [major] all seven → fixer items 1–7 (2 px peek tolerance is a technical default chosen by the fixer; real-bfcache attempt unverified until build)

## Pass 2 — 2026-10-15 23:05
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 4 (merged), minor 8, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
### Majors (triaged, merged)
1. Wheel model: scroll delta measured as live `scrollY` change (no double count with the next pointermove), the drop path re-reads the live offset at pointerup even if no `scroll` event fired; listener only for `pointerType` mouse (touch press adds none; unit assertion); own-write scrolls (`layout.svelte.ts` scrollTo) are scroll too; stored last transform/origin carry the delta so fly-back and parting read the same state; target now outside the band or over a sticky bar clears (fly-back, no dispatch).
2. Wheel tests' minimum assertions (faces = pointer + scroll delta; highlight and drop target equal the non-scrolled drag at that screen position; release with no pointermove drops on the recomputed target; Vitest fakes the offsets; Playwright seeds overflow, `mouse.wheel`, page-end case scrolls to bottom first).
3. Hover-peek assertion: peek bottom vs the label top (placeHoverPeek anchors exactly there; tolerance ≤1 px rounding, replacing 2 px), above branch kept by fixture (flip below is legal, not a failure), width change by setViewportSize with the pointer staying on the cell, wait for layout to settle; viewport-height and page-scroll with an open peek out of scope (board-root-relative).
4. Bfcache case cannot fail as written: preconditions (surface open so nav depth ≥ 1; idle with the menu open, a drag in progress, stale-owner halt where Back does not pop and Reload shows), flush calls `cancel()` without `byBack`, helper step 1 only catches cancel side effects, step 2 (real bfcache) mandatory if step 1 does not reproduce, build-notes names the attempts run.
### Minors
- "expected to fail" wording; android run uses a real Back, Esc variant desktop only; row 3 exists only if reproduced (written failing first); scroll listener neither reads nor changes gate state.
### Default applied (technical)
- all four majors: reviewers' proposed defaults.
### Decision needed
- none
### Dropped
- none
Words (docs): 1096 (5.2x pass 0, within the 1500 budget)  |  Snapshot: story-carry-ins-wheel-during-a-mouse-drag-hover-peek-re-anchor-bfc.review-log.passes/pass2.md
### Applied
- [major] all four → fixer items 1–4; minors folded in

## Pass 3 — 2026-10-15 23:30
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 3 (merged), minor 6, decision-needed 0  |  Dropped in triage: 0 (duplicates merged; two adversarial majors reclassified minor: helper-only bfcache coverage is already gated by "exists only if reproduced", listener-cleanup assertions are test precision)
### Majors (triaged, merged)
1. Bfcache variants contradict the pass sentence and one precondition is unreachable: pass per variant (idle: Back pops the menu, depth −1, no pending back left; halt: Back not consumed, Reload shows, depth unchanged, no leftover pending back); a drag cannot coexist with the modal menu, so the drag variant is "drag live before pagehide, no surface, nav depth 0, next Back not swallowed"; halt staleness is produced by writing a `wordcell:` key between `pageHide` and `pageShow`; starting history stated for goBack.
2. Hover-peek shift mechanisms unnamed: card count via Undo/Redo key with the pointer parked (peek assert open before and after, counts ≥ 1, 0 cards out of scope), banner by forcing a dictionary load failure, peek-open assertion before measuring.
3. Wheel oracle can pass on a wrong implementation: Vitest fake rects translate with the scroll offset, the asserted target differs from the pre-scroll target, negative assertion that the pre-scroll target is no longer highlighted.
### Minors
- Listener on window (passive), removed after drop, cancel, pointercancel and lostpointercapture, none from a mouse press that never becomes a drag; tray row container scroll (check Tray.svelte, say in or out); helper-only (1) test not committed as bfcache coverage unless it failed first; non-overlap with the cell as a second peek assertion and cite the Components paragraph, not a line number.
### Default applied (technical)
- all three majors: reviewers' proposed defaults.
### Decision needed
- none
### Dropped
- none
Words (docs): 1366 (6.5x pass 0, within the 1500 budget)  |  Snapshot: story-carry-ins-wheel-during-a-mouse-drag-hover-peek-re-anchor-bfc.review-log.passes/pass3.md
### Applied
- [major] all three → fixer items 1–3; minors folded in (tray rows closed: overflow hidden)

## Pass 4 — 2026-10-15 23:55
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 2, minor 3, decision-needed 0  |  Dropped in triage: 0
### Majors (triaged)
1. Hover-peek card-count shift unreachable: `commands.ts` `undo()`/`redo()` call `closeTransient()` → `closeHoverPeek()`, so Undo/Redo always closes the peek and the ticket's claim "keys.ts does not call closeHoverPeek" is false (verified). Default: drop the card-count shift (two shifts remain: width, banner); the effect trigger stays untested by this ticket, noted.
2. Wheel scroll baseline moment unspecified (press vs drag start): default baseline is the live `scrollY` at drag start; a scroll between press and drag start is absorbed into the origin read at drag start with no recompute; one Vitest assertion.
### Minors (applied only if no or few words)
- Drag variant starts from a fresh press on an unselected tail (a selected-tail drag has depth 1); failing-first applies per variant (passing variants dropped, noted in build-notes.md); listener removal and layout-originated scroll assertions in the wheel minimum list.
### Default applied (technical)
- both majors.
### Decision needed
- none
### Dropped
- none
Words (docs): 1421 (6.8x pass 0, within the 1500 budget)  |  Snapshot: story-carry-ins-wheel-during-a-mouse-drag-hover-peek-re-anchor-bfc.review-log.passes/pass4.md
### Applied
- [major] both → fixer items 1–2; minors 3–4 folded in

## Pass 5 — 2026-10-16 00:20
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 0, minor 2, decision-needed 0  |  Dropped in triage: 0
Words (docs): 1421 (6.8x pass 0, within the 1500 budget)  |  Snapshot: unchanged from pass4.md (no fix pass)
### Minors (not applied)
- `dictionary.showBanner` is a getter (wait until it is true), not an action.
- Name the e2e observable for nav depth / pending-back counter in the plan (test-hook field or Back behaviour only).

## Result — converged after 5 passes
Majors per pass: 7, 4, 3, 2, 0. No decision-needed items. Technical defaults applied: all majors (incl. 1 px peek tolerance; peek card-count shift dropped because Undo/Redo closes the peek, F39).
