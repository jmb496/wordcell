# Review log — story-carry-ins-wheel-during-a-mouse-drag-hover-peek-re-anchor-bfc

State: pass 1: done

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
