# Review log — story-engine-word-list-and-its-fixture

State: pass 2: done
Pre-loop: HEAD 0e29c02, 337 words, copy at story-engine-word-list-and-its-fixture.passes/pass0.md

## Pass 1 — 2026-10-20
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 4, minor 8, decision-needed 0  |  Dropped in triage: 4 (spine AD-3 already amended; Give-up Undo not in scope; search fallback already stated in Notes; seedStorage criterion duplicates a later ticket)
### Majors (default applied, technical)
1. Description ordering/spelling — `spelling` is the R-37 lowercase string (AD-3), ascending = plain code-unit compare, equal entries keep move order (stable)
2. Verify — add redo tail, equal-entries move order, gaveUp with empty list and with a pending draft
3. Fixture — final move is the Confirm of the last word, no redo tail, gaveUp false; expected `wordList` literal asserted in the fixture's serialize.test.ts entry; Undo of the finish gives playing without the key, Confirm restores the list
4. Absence — key omitted while playing (`'wordList' in view` false), `[]` for won/gaveUp with no word
### Minors applied
- long word exactly 10 letters (WordCell 10); name the widened replay function, not exported, longestWord/history unchanged; VALID/REBUILDS same index; correct count wording; reword AD-2 list clause; ticket fields copied into Description
Words: 660 (1.96 x pass 0)  |  Snapshot: story-engine-word-list-and-its-fixture.passes/pass1.md
Fixer applied items 0-10 (majors 1-4 and the minors above, plus the ticket fields); no commands run (none added).

## Pass 2 — 2026-10-20
Reviewers: fix-diff, edge-case, adversarial, ref-alignment  |  Findings: major 0, minor 6, decision-needed 0  |  Dropped in triage: 0
Words: 660 (1.96 x pass 0; unchanged, no fix pass)

## Result — converged after 2 passes

Unapplied minors:
- Long word: say whether it contains QU (default: no, QU covered by the unit test) and say "exactly 10" in tickets.toml entry 1 too (it still says "at least 10") (3 reviewers).
- QU unit test: assert `cards.length` one less than `letterCount`.
- State `WordListEntry` field types (`readonly cards: readonly CardId[]`, cell type) and that `view()` builds a new array per call.
- Fixture: duplicate in different cells and non-adjacent; tie pair played in reverse-alphabetical move order.
- Replay widening: prefer a separate internal type extending `CommittedWord`; assert history key set unchanged.
