# Review log — story-surface-foundation-and-the-one-new-game-function

State: pass 1: done

Pre-loop: HEAD d04dbfe, copy at story-surface-foundation-and-the-one-new-game-function.review-log.passes/pass0.md, 290 words (budget 1500 words).
Ticket intent fields from tickets.toml entry 1 (verify, risk, unknown, interface, tests, owns, consumers): .review-log.passes/intent.md

## Pass 1 — 2026-10-14
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 11 (merged), minor 7, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
### Applied (to the fixer, pass 1)
- [major] Intent fields (verify, risk, unknown, interface, tests, owns, consumers) added to the Description/AC as the ticket's intent
- [major] Esc: CAP-10 owns the key handler; scope entry 1 to the store close-topmost path
- [major] six ids vs MODAL_TOP/OWN_OPERATION, legal stack pairs, F5 inert/bars/focus table
- [major] CAP-1 rule dropped: menu item closes sheet first, pop completes before push (+ AD-13 test)
- [major] newGame single-site scan target undefined
- [major] motion mechanism (CSS --wc-base-ms; 120 ms source), WordCellView/peek current no-transition, interrupted transition
- [major] screens specs list and the open question (resolve: UI Vitest mounts; two-overlay reload is another entry's P6)
- [major] act() ownership in Sheet/Panel/Dialog
- [major] Dialog extension unspecified (danger style; ☰ focus return is CAP-3)
- [major] resetForNewSession over stacks of new ids (one pop per entry)
- [major] tests-field R-74 P6 row not in CAP-1 scope; P6 observable and test id
- [minor] scrim per surface; small-viewport scroll; consumers list; peek has no entry; build order
### Default applied (technical)
- all of the above are technical defaults proposed by reviewers
### Decision needed (functionality / UX / gameplay)
- none
Words (docs): 1003 (3.5 x pass 0)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-surface-foundation-and-the-one-new-game-function.review-log.passes/pass1.md
Fixer note: onUnfinished close('endSheet') throws unless endSheet is on top; menu may sit over endSheet with Undo bar live — to re-check in pass 2.
