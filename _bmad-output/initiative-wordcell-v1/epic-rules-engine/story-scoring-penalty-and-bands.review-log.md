# Review log — story-scoring-penalty-and-bands.md (ticket 2.7)
State: pass 1: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: HEAD 63f8b84, copy `story-scoring-penalty-and-bands.review-log.passes/pass0.md`, 138 words.
Refs: SPEC.md, build-notes.md, rule-coverage.md (spec-epic-2-rules-engine), epic-rules-engine.md, ARCHITECTURE-SPINE.md, AGENTS.md; done-ticket plans: story-golden-deal-test-and-r-id-test-names-plan.md, story-langdata-en-and-lettercount-plan.md, story-session-createsession-replay-and-checksession-plan.md, story-composing-commands-and-the-command-table-plan.md, story-validate-and-place-commands-with-the-8-worked-example-plan.md, story-undo-redo-give-up-and-accrue-plan.md.

## Pass 1 — 2026-09-29
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 6, minor 10, decision-needed 0  |  Dropped in triage: 0 (duplicates merged across the four lenses)
Words (docs): 571 (4.1 x pass 0)  |  Snapshot: story-scoring-penalty-and-bands.review-log.passes/pass1.md
Fixer: all 14 items applied; only command named is the existing `npm run test:all` (design statement, not run).
### Applied
- [major] References — only the parent epic cited; rule text, CAP-6/D3, build-notes CAP-6, rule-coverage rows, AD-2/AD-3 and `makeLangData` unreachable → fixer item 1
- [major] Description — signatures and input shapes of liveScore, lettersLeft, penalty, finalScore, band unspecified (cell index → WORD_CELL_NUMBERS, committed replay Position, lettersLeft = Σ letterCount over column cards) → fixer item 2
- [major] Description/AC R-81 — penalty only when the game ended by give-up; won → final = live; tests missing → fixer item 3
- [major] AC synthetic LangData — no expected boundaries (161/162, 269/270, 384/385, 477/478, 539/540; one score banded differently under EN) → fixer item 4
- [major] AC R-83 — integer comparison / count-of-thresholds formula and expected band per EN boundary value not stated → fixer item 5
- [major] Description — scoring.ts export status unstated; index.test.ts pins AD-2 exports → fixer item 6
- [minor] Description — "entry-2 constructor", "D3" undefined → fixer item 7
- [minor] Description — threshold/denominator constants placement → fixer item 8
- [minor] AC R-80 — at least two different cells incl. QU, empty cells → 0 → fixer item 9
- [minor] AC R-81 — empty columns → lettersLeft 0; give-up at the deal −530 band 0 → fixer item 10
- [minor] Description — band input domain: no new check → fixer item 11
- [minor] Scope — R-83 longest-word (V) sentence to CAP-7, (UI) sentences exempt; no view.ts/GameView/text → fixer item 12
- [minor] Description — PENALTY_PER_LETTER already in types.ts; add only the band constants to types.ts; lang/ untouched → fixer item 13
- [minor] AC — test file and id-prefixed names → fixer item 14
- [minor] Description — liveScore over committed cells only (AD-3) → fixer item 2
### Default applied (technical)
- scoring.ts internal: not exported from index.ts, index.test.ts unchanged, tests import `./scoring`
- signatures: `liveScore(cells, lang)`, `lettersLeft(columns, lang)`, `penalty(columns, lang)`, `finalScore(position, gaveUp, lang)`, `band(finalScore, lang)`
- constants `BAND_THRESHOLDS = [156, 260, 370, 460, 520]`, `BAND_DENOMINATOR = 520` in types.ts beside PENALTY_PER_LETTER (rule constants live there)
- band: no domain check (engine-internal integer callers)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
