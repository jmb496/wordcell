# Review log — story-golden-deal-test-and-r-id-test-names.md (ticket 2.1)
State: pass 2: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: HEAD 26a56b1, copy `story-golden-deal-test-and-r-id-test-names.review-log.passes/pass0.md`, 141 words.
Refs: SPEC.md, build-notes.md, rule-coverage.md (spec-epic-2-rules-engine), epic-rules-engine.md, ARCHITECTURE-SPINE.md, AGENTS.md; done-ticket plans: none.

## Pass 1 — 2026-09-28
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 4, minor 6, decision-needed 0  |  Dropped in triage: 2 (+ duplicates merged)
### Applied
- [major] Acceptance Criteria — "git diff touches only deal.test.ts" fails for every bmad-build-auto commit (it commits the plan and ticket files under `_bmad-output/`) → fixer item 1
- [major] Description / covers CAP-1 — no R-03-named test covers R-03's round-robin and "first dealt is the column top" sentences (rule-coverage R-03 row, AGENTS Conventions) → fixer item 2
- [major] Description / References — rename mapping, exact golden test name, assertion shape and "never compute the expected value" live only in build-notes CAP-1, which the ticket does not reference → fixer item 3
- [major] Acceptance Criteria — "swapping two entries of ENGLISH_DISTRIBUTION" / "the PRNG constant" is ambiguous; swapping equal counts leaves the deck unchanged, so the gating mutation check can false-fail → fixer item 4
- [minor] Description — literal generation leaves no committed generator, console call or snapshot file → fixer item 5
- [minor] Description — letter literal format (uppercase, `'QU'` one entry in the Q slot) and cross-check against carryover §1 → fixer item 6
- [minor] Notes / Verify — re-check `git diff --quiet 785c0f6 HEAD -- src/engine/deal.ts src/engine/types.ts` before generating (AGENTS Policy) → fixer item 7
- [minor] Verify — mutation output and revert recorded in the plan → fixer item 8
- [minor] Verify — every test in deal.test.ts starts with an R-id; `-t "R-02 golden deal"` matches exactly one test → fixer item 9
- [minor] Description — note later tickets only repoint calls, literals byte-identical and the only copy (SPEC CAP-1) → fixer item 10
### Default applied (technical)
- R-03 coverage → add an R-03 round-robin test comparing `deal(seed)` with `shuffle(buildDeck(), seed)` indexed `i % 8` / `Math.floor(i / 8)`, test-only in deal.test.ts
- Diff scope → no file outside `_bmad-output/` other than `src/engine/deal.test.ts`
- Mutations → reorder A before/after B (different counts) for the letter half; change `0x6d2b79f5` for the CardId half; revert both
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- `after: [1.10]` → `[1.11]`: 1.11 is done, no effect, and the fix would desync tickets.toml (outside the target)
- Rename/reference finding raised as minor by two reviewers: merged into the major (fixer item 3)
### Fix outcome
Fixer applied items 1–10; item 1's pathspec corrected to `':(exclude)_bmad-output'` (the `':!_bmad-output'` form fails: "Unimplemented pathspec magic"); ran item 7 (exit 0), `npx vitest --version` (5.0.2) and a non-matching `-t` (exit 0, all skipped); the positive `-t "R-02 golden deal"` run is `unverified` until the build adds the test.
Words (docs): 480 (3.4 x pass 0; budget 1500)  |  Snapshot: story-golden-deal-test-and-r-id-test-names.review-log.passes/pass1.md

## Pass 2 — 2026-09-28
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 3, minor 7, decision-needed 0  |  Dropped in triage: 2 (+ duplicates merged)
### Applied
- [major] Acceptance 3 — `HEAD~1` inspects only the last commit; bmad-build-auto may make several commits and later commits may follow → fixer item 1
- [major] Acceptance 5(b) — one `it` with hard `expect`s stops at the first failure, so "both seeds' CardId columns fail" is unobservable → fixer item 2
- [major] Description — inline literals may be re-wrapped by Biome when later tickets repoint the call, breaking epic Done-when 2 byte-identity → fixer item 2 (same fix)
- [minor] Acceptance 4 — "test name" means `it` titles; describes stay; new tests go in `describe('deal')` → fixer item 3
- [minor] Description — rename targets end in "…"; spell out full names → fixer item 4
- [minor] Description — R-03 round-robin seed unspecified → seed 1 → fixer item 5
- [minor] Description — carryover §1 mismatch → stop and report, edit nothing (AGENTS Policy) → fixer item 6
- [minor] Description — generation method: temporary `it` printing `JSON.stringify`, removed before commit → fixer item 7
- [minor] Acceptance 1 — plan records command, exit code and HEAD sha → fixer item 8
- [minor] Notes — AGENTS.md Known pitfall on unnamed deal.test.ts tests goes stale; left for bmad-project-context / retro, not edited here → fixer item 9
### Default applied (technical)
- Commit scope → `git diff --name-only <B>..HEAD -- . ':(exclude)_bmad-output'` lists exactly deal.test.ts, B = commit before the build's first commit, recorded in the plan
- Golden literals → named top-level consts; one `toEqual` of a combined object so every differing part shows in one failure
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Optional mutation (c) on the shuffle bound: stretch, beyond SPEC CAP-1 and AD-5's test contract; the plan may add it
- R-03 case "only relational, not a pin": correct as designed, the golden literal is the pin
### Fix outcome
Fixer applied items 1–9; ran item 1's range diff with B = HEAD~1 and HEAD~3 (exit 0, empty, docs-only history) and `npx biome format src/engine/deal.test.ts` (Biome 2.5.14, exit 0, read-only check).
Words (docs): 647 (4.6 x pass 0; budget 1500)  |  Snapshot: story-golden-deal-test-and-r-id-test-names.review-log.passes/pass2.md
