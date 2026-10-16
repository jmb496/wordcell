# Review log — story-carry-ins-wheel-during-a-mouse-drag-hover-peek-re-anchor-bfc

State: pass 2: done

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
