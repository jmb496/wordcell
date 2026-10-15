# Review log — story-surface-foundation-and-the-one-new-game-function

State: pass 5: done

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
Resumed 2026-10-14: owner recorded F6, F7, F8 (SPEC Decisions, .memlog.md); the diverging stop is lifted and F6-F8 are settled, not findings.
### Applied (to the fixer, pass 3, aligned with F6-F8)
- [major] Undo-over-a-surface paragraph and test deleted (F6); by-construction sentence restored
- [major] openers clear selections/close views and peeks first, pop then push; open throws on peek, clears hoverPeek; U cases (F8)
- [major] reduced motion: CSS opacity 120 ms via --wc-reduced, no WAAPI; e2e uses reducedMotion emulation (F7)
- [major] transition-rule tests added (close/removal, peek, peek-to-sticky, open-then-close, focus)
- [major] historyNotice legal tops (empty, endSheet), only resetConfirm stacks; U case
- [minor] confirm tops empty-only, depth-3 chain, Esc owner note, act() on scrim/action, 360x320 as Playwright, scan aliases
Words (docs): 1349 (4.7 x pass 0; budget 1500)  |  Snapshot: story-surface-foundation-and-the-one-new-game-function.review-log.passes/pass3.md

## Pass 4 — 2026-10-14
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 8 (merged), minor 8, decision-needed 0  |  Dropped in triage: 0
Words (docs): 1349 (4.7 x pass 0; no fix run in pass 4)  |  Snapshot: .review-log.passes/pass3.md
Majors rose 5 -> 8, so the loop stops (diverging) and does not fix again.
### Majors (not fixed; all technical, default proposed)
- [major] Reduced motion (4 reviewers): --wc-reduced is a 0/1 flag written by shell prefs, REDUCED_FADE_MS is an unexported ui const, shell cannot import ui; "literal fed through --wc-reduced" (F7 wording) is unbuildable. Default: keep flag; UI sets a 120 ms CSS property from an exported REDUCED_FADE_MS; surface CSS switches on it; U test pins agreement.
- [major] Pair guard / peek throw / hoverPeek clear applied to historyNotice and resetConfirm break existing overlays.svelte.test.ts cases (open historyNotice over peek, over sticky view, hoverPeek kept) that the ticket says stay green. Default: scope to the six new ids (+ resetConfirm tops), or list the tests as edited.
- [major] newGame scan stated two ways (alias/destructure vs literal `game.newGame(`); architecture-scan.ts lets aliasing pass. Default: textual `game.newGame(` check, drop alias claim, or AST check with positive controls.
- [major] Moving act() inside Dialog/Sheet breaks the AD-12 act scan (Dialog.svelte is in ACT_EXEMPT_FILES; HistoryNotice already passes ondismiss={act(...)}). Default: Dialog stays pass-through, callers wrap; Sheet/Panel wrap own close, scan accepts onscrim/onclose.
- [major] "Each new id at depth 0, 1 and max 3" untestable: only endSheet,statistics,resetConfirm and endSheet,historyNotice,resetConfirm reach depth 3. Default: per-id depth matrix.
- [major] 360x320 Playwright check has no page (primitives unmounted until entry 2) and contradicts Notes. Default: move to entry 2.
- [major] "Cover or inert" for Undo under a surface: Tab+Enter reaches a covered Undo with [endSheet, statistics]; build-notes "Bars live: per EXPERIENCE.md" does not say no. Default: bars inert unless top is empty/endSheet/wordcellView; U test.
- [major] Opener clear-then-pop-then-push (F8) has no owner in Interface; entry 10 owns the closeView-first helper. Default: this ticket's open() only guards; helper delivered in entries 2/10; expected outcome per U case.
### Minor (unapplied)
- historyNotice legal-top and chain U cases and transition-rule cases not in Tests list; close-then-reopen same id during exit; P6 spec covers open only (rule-coverage says open/close, peek); confirm style primary vs danger per DESIGN Buttons; entry 3 Esc proof depends on entry 10; confirm dismissal U case missing; confirm tops reachable only from empty; exit transition mechanism (class + transitionend; jsdom fires none); newGame sentence garbled.
Resumed 2026-10-14 (second resume): owner sharpened F6, F7, F8 (commit bb8f525); settled, not findings. They answer the pass-4 majors on reduced motion, bars inert, and the openSurface(id) helper owned by 6.1. The diverging stop is lifted; all pass-4 majors and minors go to the fixer (technical defaults), the F6-F8 ones applied to the ticket and build-notes.md.
### Applied (to the fixer, pass 4, aligned with F6-F8)
- [major] Reduced motion: motion.ts exported constant sets --wc-fade-ms, CSS on --wc-reduced, no WAAPI, U pin (F7)
- [major] Guard scope: new rules for the six new ids + resetConfirm tops; historyNotice keeps today's rules (existing tests unedited)
- [major] newGame scan: textual `game.newGame(`; aliasing not detected
- [major] act(): Dialog pass-through, callers wrap; Sheet/Panel wrap own close/onscrim; HANDLER_ATTRIBUTE gains `close`
- [major] per-id depth matrix; 360x320 moved to entry 2
- [major] top bar inert under menu/panel/dialog/History notice, U test; build-notes.md table rows updated (F6)
- [major] openSurface(id) owned by 6.1 with U outcomes (F8); tickets.toml entry 10 interface edited to reuse it
- [minor] Tests list additions, exit transition via transitionend, P6 spec scope, confirm style primary, Esc proof note, confirm dismissal U case
Words (docs): 1528 (5.3 x pass 0; budget 1500)  |  Snapshot: story-surface-foundation-and-the-one-new-game-function.review-log.passes/pass4.md
Note: tickets.toml entry 3 `verify` still lists Esc dismissal though entry 3 precedes entry 10 (mismatch, unedited).

## Pass 5 — 2026-10-14
Reviewers: fix diff, builder's reading, edge-case hunter, ref alignment  |  Findings: major 6 (merged), minor 6, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Majors fell 8 -> 6, loop continues.
### Applied (to the fixer, pass 5; all technical, default applied)
- [major] openSurface(id): no module, signature or wait mechanism → src/ui/open-surface.ts, synchronous, wait = nav's op queue (no new nav API), pre-checks modal-notice and throws before clearing; double call during pending pop covered by the queue + U case
- [major] act() ownership of Sheet/Panel vs HANDLER_ATTRIBUTE `close` contradictory → one model, stated once
- [major] top bar `inert` (F6) assigned to no component or test → Sheet/Panel/Dialog set inert on Board and bars per build-notes table; mount U per component; HistoryNotice stays green
- [major] open(newId) over a tile selection unspecified → open does not touch tile selection; only openSurface clears it; reword Tests line
- [major] reduced-motion pin untestable in jsdom → assert documentElement style `--wc-fade-ms` equals constant + source scan of surface CSS (no literal 120ms)
- [major] 360x320 check moved to entry 2 but tickets.toml entry 2 tests/verify lack it → add to entry 2
### Minor (applied only if no added words)
- resetConfirm gets only the legal-top rule (no peek throw, no hoverPeek clear)
- exit also ends on transitioncancel; confirm over confirm throws U case
### Minor (unapplied)
- line-150 MODAL_TOP early return for new ids; screenshot specs wait for transition end
Fixer outcome: all six applied; minors resetConfirm-only rule, transitioncancel, confirm-over-confirm U applied. Deviation (technical): top-bar inert assigned to App.svelte (`main` inert while any new id/resetConfirm/historyNotice is on the stack) instead of per component; initMotion() added to motion.ts, called from main.ts after prefs.load(). tickets.toml entry 2 tests/verify edited.
Words (docs): 1535 (5.4 x pass 0; budget 1500)  |  Snapshot: story-surface-foundation-and-the-one-new-game-function.review-log.passes/pass5.md
