# Review loop log — ticket 6.6 build (code mode)
State: pass 1: done
Range: 889ca36..dbbf83a (HEAD dbbf83a); tree snapshot 0: 9f5ca2b476fb9e9519e5620dbe4b31bf8412bc28
Intent: _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-end-sheet-result-collapse-give-up-and-relaunch-plan.md

## Pass 1
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 7, minor ~17, decision-needed 1  |  Dropped in triage: 0
### Majors (to fix)
1. e2e/end-sheet.spec.ts R-62 win by Confirm: no proof sheet opens after glide settles (add no-flyToCell-animation assertion at first frame); fixture substitution (session-won+Undo vs scripted one-move-from-won) — default applied: keep substitution (equivalent), report to owner in result.
2. Six bands: add view-level unit test mapping finished GameView per band incl. Perfect Deck 530; assert all six messages.
3. e2e: WordCell view closed before sheet opens (Undo from session-won, open sticky view, Redo).
4. e2e R-75 scrim tap consumed: tap a word-bearing WordCell on session-won instead of a column card.
5. e2e Undo from expanded sheet: assert board focus.
6. AD-16 boot order sheet before History notice: no test (nav.spec with history-invalid + session-won).
### Decision needed (functionality / UX / gameplay)
- src/ui/text.ts endCollapse 'Collapse result', endBar 'Show result: …', 'Longest word', 'Words placed' — wording not in EXPERIENCE.md catalogue — proposed default: keep as built, owner confirms wording.
### Default applied (technical)
- Minors folded into the fix: stale overlays comment, Tray guard consistency, focusBoard unit test, back-title, Undo inert under Statistics, giveUp clears tile selection, focusOnMount only when top.
- Unapplied minors: deferred open throws if overlay on stack at settle; Undo during win glide opens/closes sheet; onUnfinished close() throws with overlay above; bar overlaps tray tiles at narrow widths; penalty alignment; transition-duration test; history.length asserts; test-name ids.
Fix summary: 6 majors applied (6 majors, not 7: fixture substitution merged into item 1; accepted default). Deviations: item 3 e2e opens the view over the collapsed board then Undo/Redo by dispatched clicks (a view cannot open after Undo); item 4 taps a column card on session-gave-up (WordCell tap hits Replay under the sheet), asserts no view sheet and unchanged wc/launch; focus-board test uses a fake document (no jsdom). Snapshot: tree 936dfbc5889dae7f38b34c0d0e31a489ad7f4414. npm test/lint/check: pass.
