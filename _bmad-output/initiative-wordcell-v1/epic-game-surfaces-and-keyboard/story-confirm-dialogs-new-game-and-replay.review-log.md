# Review log — ticket 6.3

State: pass 2: done

Pre-loop: HEAD 65d6df3da4d3afec885f9a86565cf2e481c0d163, 319 words (story-confirm-dialogs-new-game-and-replay.review-log.passes/pass0.md)

## Pass 1 — 2026-10-15
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 10 (merged), minor 5, decision-needed 0  |  Dropped in triage: 0 (many duplicates merged)
### Majors (triaged, merged)
1. tickets.toml tests/consumers/interface/owns/risk missing from ticket (AD-4 U test, R-74/Q-29 P6 ids, consumers list)
2. Action bar New game only shows when status≠playing/rejected root, so it never reaches the confirm; ticket reads as if it does
3. Focus: ☰ after menu-originated dismiss (Menu focuses main on close; top bar inert under dialog); confirm accept focuses main; non-menu opener
4. Esc: Dialog has no keydown handler; entry 10 keymap comes later → interim window handler like Menu's
5. Opening/accepting order: openSurface, menu closes first, accept pops confirm then acts; act() wrap; one shared replay helper beside newGame() + scan
6. I-68 "leaves the app (or bare-Board rule)" disjunction → one exact expected history state
7. Rejected root has no GameView: how the gate decides
8. Redo-tail Idle boundary: fixture and inProgress precondition
9. Screens specs not listed
### Default applied (technical)
- all of the above: reviewers' proposed defaults
### Decision needed (functionality / UX / gameplay)
- none
Words: 814 (2.55 x pass 0)  |  Snapshot: story-confirm-dialogs-new-game-and-replay.review-log.passes/pass1.md
### Applied
- all 10 majors and minors 10-13 → fixer items 1-13; unverified: post-New-game history.state {wc:0,launch:new} (from SPEC), entry-6 end-sheet clause

## Pass 2 — 2026-10-15
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 8 (merged), minor ~8, decision-needed 0  |  Dropped in triage: 0
### Majors
1. Action-bar/key focus-return AC unreachable in this ticket (3 reviewers) → delete clause
2. Gate unnamed/unlocated; "action bar through same gate / unchanged" contradicts; rejected root is BlockingMessage with no view → requestNewGame/requestReplay(view|undefined), newGame()/replayDeal() stay ungated
3. Focus mechanism vs Menu focus-main effect and presence restoreFocus; Keep playing focus on open untested
4. Accept sequence: resetForNewSession already closes; state single pop, double tap during exit
5. Q-29 Replay AC drops empty moves / history unchanged
6. I-68 `launch: new` not a literal; back observable
7. Redo-tail fixture unnamed
8. Replay helper name + enforcement (source scan), delete Menu's inline copy
### Default applied (technical)
- all; reviewers' defaults. Minors with no word cost applied (no-dispatch wording, via action bar, text keys, ConfirmDialogs mount, reload clause, AD-13 dedupe)
### Decision needed
- none
Words: 823 (2.58 x pass 0)  |  Snapshot: story-confirm-dialogs-new-game-and-replay.review-log.passes/pass2.md
### Applied
- all 8 majors + minors 9-12 → fixer items 1-12; unverified: entry-6 end-sheet clause
