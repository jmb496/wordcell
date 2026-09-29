# Review log — story-composing-commands-and-the-command-table.md (ticket 2.4)
State: pass 4: done

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

## Pass 2 — 2026-09-29
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 8, minor 11, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 1319 (6.9 x pass 0; budget 1500)  |  Snapshot: story-composing-commands-and-the-command-table.review-log.passes/pass2.md
Fixer: all 19 items applied; no commands added.
### Applied
- [major] Description "Domain vs rule" vs AC "Domain" — contradictory codes for out-of-range sourceCount/k/index (introduced by pass 1) → fixer item 1
- [major] Description "No-op by value"/"Check codes" — empty-destination `setDestinationCount` and `addFreeLetter` index have no existing guard/code; `r31-destination-count` accepts k = 0 at n = 0 → fixer item 2 (default applied: new codes `r31-set-count-empty-destination`, `r33-free-letter-index`)
- [major] AC row naming — fallback skips §-id (wrong-phase/status rows → §4); R-31/R-71 double attribution → fixer item 3
- [major] Notes — "describe per command" contradicts build-notes' single `it.each` (introduced by pass 1) → fixer item 4
- [major] AC R-71 — Place-reached Composing draft with a redo tail violates §2 last-only (`s2-last-only`) → fixer item 5
- [major] AC no-op rows — inputs need redo data or they cannot catch lowering before comparison (R-71 non-edit) → fixer item 6
- [major] Description Inputs/D2 split — positions with WordCell cards or an emptied column (needs committed moves) not covered; applyFrom-only reading contradicts public-apply rows → fixer item 7
- [major] AC — D8 freeLetters/arrangement order claimed but untested → fixer item 8
- [minor] Public surface — `never` switch default throws `EngineError` `command-type`, one unknown-type row (reclassified from major: rule 6 already implies it) → fixer item 9
- [minor] Check codes — export individual `rules.ts` guards internally; reducers call the one guard for their precondition → fixer item 10
- [minor] Notes — entry 6 adds only won status rows and its own commands' rows → fixer item 11
- [minor] Idle wrong-phase rows on an Idle Session with a pending draft → fixer item 12
- [minor] `addFreeLetter` with a present `index: undefined` → domain throw (`Object.hasOwn`) → fixer item 13
- [minor] R-23 test per rule-coverage R-23 row → fixer item 14
- [minor] R-30 helper builds its string via existing `spelling` → fixer item 15
- [minor] wrong-phase/status row names append the phase/status → fixer item 16
- [minor] arrange throw cases: missing S card, a D card (R-32), duplicate → fixer item 17
- [minor] R-12 `@ts-expect-error` on an annotated `Command` literal → fixer item 18
- [minor] No-op by value compares AD-2 fields excluding `reached` and the redo tail → fixer item 19

## Pass 3 — 2026-09-29
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 3, minor 7, decision-needed 0  |  Dropped in triage: 0 (duplicates merged; 3 stretch minors left for the plan)
Words (docs): 1450 (7.6 x pass 0; budget 1500)  |  Snapshot: story-composing-commands-and-the-command-table.review-log.passes/pass3.md
Fixer: all 9 items applied; no commands added.
### Applied
- [major] AC row naming — ids that miss coverage: status rows → R-75 (rule-coverage R-75 "every command except undo throws while not playing"), `setDestinationCount` equal-to-k no-op → R-71 (not R-31), D-card arrange row → R-32, `drop` `sourceColumn` 0/9 rows → R-12 → fixer item 1
- [major] AC fixed cases — range bounds collapse to one row: k = 0 and k = n + 1 rows, index −1 and |M| + 1 rows; the empty-destination row uses k = 0 (the ordering the Description calls out) → fixer item 2
- [major] AC R-23 — test asserts only k; rule-coverage R-23 also requires side left, no free letters, `arrangement` = S top-to-bottom → fixer item 3
- [minor] Check codes — rule-scheme prefixes on examples (`r31-tap-not-in-destination`, `r33-free-letter-absent`); `card`/`arrangement` elements reuse `assertCardId`'s `card-id-domain`; one `command-status`, `command-phase`, `command-domain` code → fixer item 4 (default applied)
- [minor] R-12 — the annotated literal is `const _c: Command` (Biome `noUnusedVariables` warns on `c`, checked by the reviewer against Biome 2.5.14) → fixer item 5
- [minor] Inputs — committed moves are part of the hand-written literal; only the command under test goes through `apply` → fixer item 6
- [minor] Wrong-phase rows — valid phases: `drop` Idle, the six others Composing → fixer item 7
- [minor] "including …" parentheticals (whole-column self-drop flip, S-card tap) are separate rows → fixer item 8
- [minor] Equal-value no-op rows exist only for `arrange`, `setDestinationCount` and the R-31 flip/tap cases; `drop` never (cursor changes) → fixer item 9
### Left for the plan (stretch minors, not applied)
- Named success-path tests for R-31 tap mapping, flip, R-21 draw order (covered by the CAP-4 sentence line and the plan's mapping).
- R-71 edit tests assert the whole `ApplyResult` via `toStrictEqual` (no `rejectedWord`).
- No runtime unknown-key check; non-array `arrangement` is a domain throw; each row has exactly one violation.

## Pass 4 — 2026-09-29
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 1, minor 9, decision-needed 0  |  Dropped in triage: 0 (7 stretch minors left for the plan)
Words (docs): 1498 (7.8 x pass 0; budget 1500)  |  Snapshot: story-composing-commands-and-the-command-table.review-log.passes/pass4.md
Fixer: all 9 items applied; trimmed two duplicated phrases (entry 5/8 ownership already stated) to stay in budget; no commands added.
### Applied
- [major] AC arrange throw rows — no row for a missing chosen free letter; R-33 "removed only by removeFreeLetter" untested (and a full `checkMove` would throw `s2-free-letters-set` first) → fixer item 1
- [minor] AC Domain — "the domain code" vs `command-domain`/`card-id-domain` split → fixer item 2
- [minor] AC row names — R-75 example uses AD-2 wording "while status ≠ playing" → fixer item 3
- [minor] Check codes — `command-type` missing from the new-codes list → fixer item 4
- [minor] Notes — row shape needs an `id` field for the row name → fixer item 5
- [minor] Check codes — "k outside 1…n on a non-empty destination" so the empty-destination check runs first → fixer item 6
- [minor] AC fixed cases — k = n + 1 row on a partial self-drop (n after R-21); first k = 0 flip row drops onto another empty column → fixer item 7
- [minor] Check codes — `arrange` builds F from the `freeLetters` cells' top cards and calls only `checkArrangement` → fixer item 8
- [minor] AC R-30 — add a k = 0 draft (word = M) → fixer item 9
### Left for the plan (stretch minors, not applied)
- Ids for tap/empty-source/destinationColumn domain rows (default R-31, R-13, AD-2).
- R-71/D8/R-23 results also pass `replay(result.session, EN)`.
- R-13 destination-only word via empty column: an `R-13 …` success test.
- addFreeLetter guards: build the candidate move, then rules.ts order, then the index check.
- Place-reached/committed no-op inputs need a ≥ 3-letter word and a legal target (R-36/R-40).
- Same-letter swap edit stays in entry 6 (SPEC CAP-5); optional extra assertion.
- Entry 6's tickets.toml text should narrow to won status rows when pulled (outside this ticket).
