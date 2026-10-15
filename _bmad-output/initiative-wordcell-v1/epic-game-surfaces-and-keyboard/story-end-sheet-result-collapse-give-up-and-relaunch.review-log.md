# Review log — ticket 6.6 End sheet

State: pass 1: done
Pre-loop: HEAD a65c897babe48d472a29189390e7b13327407b27, 436 words, copy at _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-end-sheet-result-collapse-give-up-and-relaunch.review-log.passes/pass0.md
Docs mode, thorough, max 7. Growth budget default 2.5x (1090 words).

## Pass 1 — 2026-10-15
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 10 (merged), minor 6, decision-needed 0  |  Dropped in triage: 5
### Applied (accepted, sent to fixer)
- [major] Verify omits Esc/handle/scrim-consumed collapse, Give up at once, Redo win, bars above scrim, focus, singular penalty, `—`, words placed
- [major] Bands and fixtures: boundary tests via the pure band function (158/159 … 529/530), negative score with U+2212; band→fixture mapping
- [major] Deferred-open token: 6.6 wires open + cancel API; killed by boot and resetForNewSession; Undo-cancel and the 300 ms floor are entry 12's
- [major] Sheet states hidden/expanded/collapsed and history entry per transition (Undo expanded pops and awaits popstate, collapsed no pop; Redo after undone Give up does not reopen)
- [major] Replay/Statistics via openSurface, Replay pops the sheet entry first; focus targets (first action; board per EXPERIENCE Focus/CAP-10)
- [major] "No animation" needs an observable assertion
- [major] Singular/plural, lone QU, U+2212 title strings from text.ts
- [major] Longest word / words placed display format and QU spelling per DESIGN/EXPERIENCE
- [major] Relaunch boot nav state (AD-13/AD-16) and expected history.state
- [major] Live controls under the sheet per build-notes per-surface table
- [minor] add rule-coverage.md and build-notes.md refs; out-of-scope line (entries 7, 12); name the session-won fixture; collapsed bar has no scrim and sits over the tray band; sentence-to-test mapping via tests field
### Default applied (technical)
- Band tests at boundaries through the pure band function; no-animation assertion via getAnimations; token ownership split with entry 12
### Decision needed
- none
### Dropped
- History-unreadable block, Reset history, Game-over reload with history-invalid-* (3 reviewers): owned by entry 7 (CAP-4 split), out of scope here
- Statistics button has no panel to open: entry 5 (panel) is done and listed in `after`
- Undo-cancel and consumed inputs in the guard window (2 reviewers): entry 12
- Openers via openSurface for WordCell view/peek closing: kept only as a one-line item inside the state finding
Words: 1020 (2.3 x pass 0)  |  Snapshot: story-end-sheet-result-collapse-give-up-and-relaunch.review-log.passes/pass1.md
