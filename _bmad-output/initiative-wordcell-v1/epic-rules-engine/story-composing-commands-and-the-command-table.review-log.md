# Review log — story-composing-commands-and-the-command-table.md (ticket 2.4)
State: pass 1: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: HEAD 9159a33, copy `story-composing-commands-and-the-command-table.review-log.passes/pass0.md`, 191 words.
Refs: SPEC.md, build-notes.md, rule-coverage.md (spec-epic-2-rules-engine), epic-rules-engine.md, ARCHITECTURE-SPINE.md, AGENTS.md; done-ticket plans: story-golden-deal-test-and-r-id-test-names-plan.md, story-langdata-en-and-lettercount-plan.md, story-session-createsession-replay-and-checksession-plan.md.

## Pass 1 — 2026-09-29
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 8, minor 10, decision-needed 0  |  Dropped in triage: 1 (plus duplicates merged)
Words (docs): 923 (4.8 x pass 0; budget 1500)  |  Snapshot: story-composing-commands-and-the-command-table.review-log.passes/pass1.md
Fixer: all 18 items applied; no commands added.
### Applied
- [major] Description/AC — public surface unstated: `apply`, `Command`, `ApplyContext`, `ApplyResult` exports, index.test.ts list, union scope before entries 5/6 → fixer item 1 (default applied: union of the seven only, exhaustive `never` switch; entries 5/6 widen it; no not-implemented branch per rule 6)
- [major] AC — row set undefined ("self-drop throw and no-op rows" ambiguous; domain rows per field; wrong-phase per command per phase) → fixer item 2
- [major] Description/AC — how Place-phase and status≠playing inputs are built before validate/giveUp exist → fixer item 3 (default applied: replay-valid Session literals; gaveUp rows now, won rows entry 6)
- [major] AC — R-71 edit/advance lowering and §2 drop-in-Idle truncation implemented but untested → fixer item 4
- [major] AC — R-30 has no observable surface in this entry → fixer item 5 (default applied: internal word-card/word-string helper in rules.ts, tested via D2 seam)
- [major] AC — R-12 test unnamed → fixer item 6
- [major] AC — table row naming vs AGENTS.md id-named coverage → fixer item 7
- [major] Description — no-op-by-value comparison ordering vs throw checks (empty-destination `setDestinationCount {k:0}` must throw) → fixer item 8
- [minor] Description — check codes: reuse rules.ts guards/codes, new kebab-case codes listed in errors.ts → fixer item 9
- [minor] Description — domain vs rule boundary and addFreeLetter index = |M| → fixer item 10
- [minor] References — add SPEC CAP-4/D2/D8, rule-coverage rows, AD-2, game-flow-spec §2/§4, ticket 3 plan → fixer item 11
- [minor] AC — scope R-31/R-33/R-39 to CAP-4 sentences; R-39 Undo-from-Composing is entry 6's → fixer item 12
- [minor] Description — D2 split: table and one test per command through public `apply` → fixer item 13
- [minor] Description — check order restated without dictionary step; cite build-notes CAP-4 → fixer item 14
- [minor] Notes — open question on row shape; fix to build-notes shape → fixer item 15
- [minor] AC — "same reference" on ApplyResult: `result.session === input`, no `rejectedWord` → fixer item 16
- [minor] Description — deep-freeze Session, command and ctx per row (EN already frozen at construction) → fixer item 17
- [minor] AC — run-on sentence; split into bullets → fixer item 18
### Dropped
- Adversarial: deep-freeze EN once at top of test file — EN is already `Object.freeze`d by the LangData constructor (lang-data.ts:44); folded remainder into item 17.
