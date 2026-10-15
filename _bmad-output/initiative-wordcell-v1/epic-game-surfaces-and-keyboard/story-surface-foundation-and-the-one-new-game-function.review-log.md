# Review log — story-surface-foundation-and-the-one-new-game-function

State: pass 3: review (diverging, stopped)

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

## Pass 2 — 2026-10-14
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 4 (merged), minor 5, decision-needed 0 (1 possible, see below)  |  Dropped in triage: 0
### Applied (to the fixer, pass 2)
- [major] onUnfinished close('endSheet') throws when a new surface sits over endSheet and Undo is live (bars live, F5) → default: onUnfinished closes top-down through the new surfaces down to endSheet; test it
- [major] open() has no pair guard; legal-pair table incomplete (historyNotice→resetConfirm, endSheet→historyNotice) → default: table-driven throw for any other pair; define max depth
- [major] "a menu item closes the sheet first" ambiguous (menu vs endSheet); give stack sequences
- [major] openDeferred (deferred end-sheet open) throws when a new surface is on top
- [minor] R-74 P6 supplement moved to entry 3 (note); scan test is created by this ticket; screens spec name/assertion basis; focus returns at close; Dialog scrim wording
### Default applied (technical)
- onUnfinished closes the new surfaces above the end sheet; open() guarded by a pair table
### Decision needed (functionality / UX / gameplay)
- openDeferred with a new surface on top: only if SPEC does not rule it (fixer to check) — proposed default: the stale token is dropped and the end sheet stays reachable from its bar
Words (docs): 1210 (4.2 x pass 0)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-surface-foundation-and-the-one-new-game-function.review-log.passes/pass2.md
Note: the openDeferred item was resolved by SPEC CAP-5 / build-notes (input consumed in the guard window), so no decision-needed remains; ticket cites it.

## Pass 3 — 2026-10-14
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 5 (merged), minor 9, decision-needed 0  |  Dropped in triage: 0
Words (docs): 1210 (4.2 x pass 0; unchanged, no fix run in pass 3)  |  Snapshot: .review-log.passes/pass2.md
Majors rose 4 → 5, so the loop stops (diverging) and does not fix again.
### Majors (not fixed)
- [major] "Undo over a surface" paragraph (added in pass 2) rests on a false premise: bars are below every scrim except the end sheet's (DESIGN.md 442–443) and shortcuts are suspended while a menu/panel/dialog is open (EXPERIENCE), so Undo/Redo cannot reach onUnfinished or a deferred end-sheet open with a new surface on top. Technical default: delete the paragraph and its test, restore the by-construction sentence, no onUnfinished change. Upstream cause: build-notes F5 table says "Bars live: per EXPERIENCE.md" for menu/panel/confirm instead of stating no.
- [major] open(<new id>) vs the entry-less state: peek, hoverPeek, tile selection, tailSelection and wordcellView on top are illegal; ticket does not say openers clear/close first (pop then push) nor that open throws on peek and clears hoverPeek. Default: openers clear first; open throws on peek, clears hoverPeek; U cases.
- [major] Reduced-motion mechanism: ticket says CSS on --wc-base-ms and also duration('overlay') (a JS/WAAPI value); prefs only writes --wc-base-ms and --wc-reduced. Default: CSS opacity transition on var(--wc-base-ms), under reduced motion a CSS 120 ms opacity-only transition with the literal sourced next to REDUCED_FADE_MS; state how the e2e sets reduced motion. Upstream: AGENTS.md / AD-14 / motion.ts do not say how CSS-driven surfaces get the 120 ms.
- [major] Stated transition rules with no test: close then removal, peek, peek-to-sticky not replaying, open-then-immediate-close, focus at stack removal.
- [major] "historyNotice keeps today's rule (boot, over endSheet)" is false: open('historyNotice') has no pair guard today. Default: state its legal tops (empty, endSheet) and give it a U case.
### Minor (unapplied)
- newGameConfirm/replayConfirm tops can be restricted to the empty stack (menu closes first); depth-3 chain is endSheet, statistics, resetConfirm
- Esc: note the CAP-1 Esc clause is delivered by entry 10 (rule-coverage), entry 1's description narrowed
- R-74 P6 supplement: moved to entry 3 in the ticket Notes, but tickets.toml entry 3 `tests` lacks the row and entry 1 still lists it
- Sheet/Panel/Dialog should also wrap onscrim and the action button in act(); extend the AD-12 case
- 360 × 320 test: jsdom cannot measure layout; assert CSS rules in Vitest or move to Playwright; fix the viewport exactly
- scan regex: also catch aliases/destructured newGame; ActionBar/App check is a source scan for the ./new-game import
- Undo test at depth 3 (moot if the Undo paragraph is removed); halt with a surface open points to existing Halted behaviour
## Result — diverging at pass 3 (fix build-notes.md F5 per-surface table "Bars live" for menu/panel/confirm, and the reduced-motion rule for CSS surfaces in AD-14/motion.ts, then rerun)
