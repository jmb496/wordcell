# Review log: story-refactor-sweep-code

State: pass 5: done (converged)

Pre-loop: HEAD 0aabff067f72e04a4342a375028c4689ef4f6c40; words 109; copy /mnt/d/CodeProjects/wordcell/_bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-refactor-sweep-code.review-log.passes/pass0.md
Budget: 1500 words.

## Pass 1 — 2026-10-16
Reviewers: builder's reading, edge-case, adversarial, ref alignment  |  Findings (merged): major 7, minor 6, decision-needed 0  |  Dropped in triage: 1 (Docker-unavailable major: docker 29.8 is installed here)
### Applied (to fixer)
- [major] no sweep inventory exists (build-notes has none) → item 1
- [major] deferred set not closed/sources unnamed → item 2
- [major] "no behaviour change"/"no baseline change" untestable → item 3
- [major] AD-1/AD-2 scans: must not weaken, AD-2 export list unchanged → item 4
- [major] "comment history paragraphs" undefined → item 5
- [major] controller/overlays/duplicated surface code guards (F5 table, single owners, controller.test.ts one file) → item 6
- [major] shared e2e helpers constraints → item 7
- [minor] copy risk/tests/owns/consumers; 6.17 boundary; References; per-row checks → items 8-10
### Default applied (technical)
- All of the above are technical; defaults taken as proposed by reviewers.
Words (docs): 733 (6.7x pass 0, within budget 1500)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-refactor-sweep-code.review-log.passes/pass1.md
Fixer: all 10 items applied.

## Pass 2 — 2026-10-16
Reviewers: fix diff, edge-case, adversarial, ref alignment  |  Findings (merged): major 7, minor 8, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
### Applied (to fixer)
- [major] outcome vocabulary lacks "handed to 6.17"/"recorded for owner"; done test accepts any reason; mid-build behaviour change → item 1
- [major] deferred set misses implementation-artifacts/review-loop/6-*-build.md Results and the autopilot log; Carry-ins already satisfied; behaviour-fix item (AD-13 throw) unplaced → item 2
- [major] no-rename wording contradictory → item 3
- [major] surface probe lacks equality/surfaces/mismatch rule → item 4
- [major] comment trim not bounded to inventory rows → item 5
- [major] unit-median/size "do not grow" unmeasurable → item 6
- [major] widened scan may flag existing code; run all architecture tests → item 7
- [minor] items 8-10 (category names, planted violation per token, "affected" defined, mixed rows split, Owns/Consumers named, drop duplicate risk line, per-pass Minors source)
### Default applied (technical)
- all; behaviour-fix rows recorded for the owner/retrospective, not swept (AGENTS.md rule 7).
Words (docs): 1156 (10.6x pass 0, within stated budget 1500)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-refactor-sweep-code.review-log.passes/pass2.md
Fixer: all 10 items applied.

## Pass 3 — 2026-10-16
Reviewers: fix diff, edge-case, adversarial, ref alignment  |  Findings (merged): major 5, minor 7, decision-needed 0  |  Dropped in triage: 0
### Applied (to fixer)
- [major] "one of the five below" lists four categories (introduced by pass 2) → item 1
- [major] `recorded for owner` reasons exclude bug fixes, test-quality rows (rename/new assertion), newly flagged scan hits; "(or retrospective)" is not an outcome → item 2
- [major] "sorted set of test titles identical" contradicts allowed new helper/scan tests → item 3
- [major] widened scan "must pass on current tree" vs "newly flagged hit becomes a row" → item 4
- [major] Owns narrower than the surface components the rows touch → item 5
- [minor] References separator, unit-median wording, not-done-ticket carry-ins, direct importers, probe settled, id-citation multiset → item 6
### Default applied (technical)
- all; proposed reviewer defaults taken.
Words (docs): 1326 (12.2x pass 0, within stated budget 1500)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-refactor-sweep-code.review-log.passes/pass3.md
Fixer: all items applied.

## Pass 4 — 2026-10-16
Reviewers: fix diff, edge-case, adversarial, ref alignment  |  Findings (merged): major 2, minor 7, decision-needed 0  |  Dropped in triage: 0
### Applied (to fixer)
- [major] Tests line allows "unit or helper test for a moved helper"; AC says only scan tests may be new Vitest tests (contract contradiction) → item 1
- [major] Owns "a file outside it needs a named inventory row" vs Deferred set "outside Owns is recorded for owner" → item 2
- [minor, word-neutral] `none` outcome; scan "no token/regex removed or narrowed"; Owns includes rows' specs; flaky drag tests plural; not-done-ticket entries get no row; reducedMotion mechanism left to plan → item 3
### Default applied (technical)
- all; reviewer defaults taken. Dropped nothing; "no text change" ref item (A8 row) needs none.
Words (docs): 1365 (12.5x pass 0, within stated budget 1500)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-refactor-sweep-code.review-log.passes/pass4.md
Fixer: all items applied.

## Pass 5 — 2026-10-16
Reviewers: fix diff, edge-case, adversarial, ref alignment  |  Findings: major 0, minor 11, decision-needed 0  |  Dropped in triage: 0
No fix pass (converged). Words: 1365 (12.5x pass 0, within budget 1500).

## Result — converged after 5 passes
Majors per pass: 7, 7, 5, 2, 0. No decision-needed, no open major.

### Unapplied minors (for the next build or loop)
- "entries of a not-done ticket" exclusion should cover every deferred source, not only carry-ins/`deferred:`.
- "outside the categories or Owns" → say "outside Owns" only (keeps the comment-edit exception).
- `recorded for owner` trigger "new assertion" → "new assertion in an existing test, or a new P6 row" (scan/helper cases stay allowed).
- 6.17 rows derived from applied rows are not part of the closed deferred set.
- A comment holding only an id citation is kept as is.
- Probe: record raw getBoundingClientRect and computed-style strings; any textual difference is a mismatch.
- `none` row only when the category has no row at all.
- `already satisfied` check applies to every deferred item, not only carry-ins.
- Merge spec-local helpers only if behaviourally identical, else record for owner.
- Size budget is AD-18 (size) and unit median AD-17; optionally name the 600,000-byte limit.
- At publish, sync tickets.toml entry 16 owns/tests text to the ticket.
