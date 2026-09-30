# Review log — story-refactor-sweep.md (ticket 2.12)
State: pass 4: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: HEAD 36d5bcb, copy `story-refactor-sweep.review-log.passes/pass0.md`, 108 words.
Refs: SPEC.md, build-notes.md, rule-coverage.md (spec-epic-2-rules-engine), epic-rules-engine.md, ARCHITECTURE-SPINE.md, AGENTS.md; build records: review-loop/2-1-build.md … 2-11-build.md, autopilot/epic-rules-engine-20260928-2138.md; done-ticket plans: all eleven `*-plan.md` in the epic folder.
Scope instruction (caller): the ticket's scope is set now from the build records (open majors and unapplied minors of the code review logs, the plans' deferred items, the digest's items carried to the 2.12 sweep); cleanup and missing tests only, no new behaviour; the AGENTS.md stale STUCK_PENALTY_PER_CARD pitfall goes through bmad-project-context or is recorded as a follow-up.

## Pass 1 — 2026-09-29
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 13, minor 5, decision-needed 0  |  Dropped in triage: ~45 (duplicates merged across lenses; per-log rows merged into groups)
Words (docs): 1216 (11.3x pass 0; stated budget 1500)  |  Snapshot: story-refactor-sweep.review-log.passes/pass1.md
Fixer: all 17 items applied as Scope rows S1–S37 plus Dropped/Excluded lists; every id/line checked against src/engine/, all gaps still open; no runnable commands added.
### Applied
- [major] Notes/Description — no concrete scope; stale open question → fixer item 1
- [major] Scope — 2-3 Pass 3 open major (redo-tail moves after REDO_T1 unpinned) → item 2
- [major] Scope — 2-4 open major (R-13 whole-column self-drop word, Q-30) → item 3
- [major] Scope — 2-6 open major (undo never-default command-domain row) → item 4
- [major] Scope — 2-11 open major (checkRecord order beyond first pair) → item 5
- [major] Scope — carried unapplied minors of 2-2, 2-3, 2-4, 2-5, 2-7, 2-8, 2-9, 2-10, 2-11 all missing → item 6
- [major] Scope — plans' entry-12 refactor items (redoAvailable/redo merge, shared test helpers, serialize version-stage helper, giveUpAvailable) → item 7
- [major] Scope — AGENTS.md two stale pitfall sentences not routed → item 8
- [major] Scope — no Dropped (already fixed) / Excluded (new behaviour) lists → item 9
- [major] Scope — JSON −0 "pin or normalise" choice open → item 10
- [major] Scope — production refactors lack a behaviour-neutral guard → item 11
- [major] AC — traceability anchored to the plan, not the ticket's rows → item 12
- [major] Description — "src/engine/ only" contradicts doc items (done plans, AGENTS.md follow-up) → item 13
- [minor] items 14–17 (sameDraftData residual check; id-first names and 5 s budget in AC; description wording; compact table for budget)
### Default applied (technical)
- −0: pin current behaviour inline for both parsers; normalising excluded (behaviour)
- shared test helpers: non-test module src/engine/test-helpers.ts, imported only by *.test.ts, no vitest import; if AD-1's scan or the spine rejects it, the item moves to Excluded with the reason
- done plans' stale text (2.2 Auto Run Result, 2.3 11-letter note, 2.8 it.each note, 2.9 AC wording): small dated edits in those plans
- AGENTS.md: not hand-edited; recorded as a follow-up for bmad-project-context (retrospective), unless the build runs that skill
- undo never-default: add the table row if checkSession accepts the session; else record exhaustiveness-only in the plan
- command-table "readability refactors" (2.4 ticket decision): no concrete finding recorded → Excluded
- dictionary: null TypeError (2.5 residual): Excluded (a guard adds behaviour; triaged false in 2.5)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- frontmatter covers CAP-1…9 (minor, harmless; left)
- duplicates across the four lenses

## Pass 2 — 2026-09-29
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 6, minor 13, decision-needed 0  |  Dropped in triage: 12 (duplicates across lenses)
Words (docs): 1494 (13.8x pass 0; stated budget 1500)  |  Snapshot: story-refactor-sweep.review-log.passes/pass2.md
Fixer: all items applied; S36 deleted (ids stable); seed-uint32 residual cited to composing plan:90 and commands.ts `apply` doc (not 2-4 pass 1); S31 wording from 2-2 log; no runnable commands added. At budget: further minors only if they add no words.
### Applied
- [major] S35 — reversed: giveUp calling boolean giveUpAvailable loses command-status/command-phase codes → fixer item 1
- [major] S3/S32 — redo never-default has no table row, so S32's neutrality guard is empty → fixer item 2
- [major] AC bullet 2 — "only renames and fixture fixes" contradicts rows editing existing tests (S2, S12, S14, S15, S17–S21, S33) → fixer item 3
- [major] S36 — sameDraftData residual already resolved (composing plan:123, validate plan:129) → Dropped → fixer item 4
- [major] S10 — one parenthetical applied to both cases removes each case's own violation; split per case → fixer item 5
- [major] S33 — which helpers move unspecified; expectEngineError uses vitest `expect` → fixer item 6
- [minor] items 7–19 (S37 file/trigger; plan residuals seed-order and canSetTarget/canConfirm; S29 "round trips"; S31 state at bca5f0f; AC mutant source; Description "new story"; References; S4/S5 unbuildable pairs; S8 case shape; S30 accepted −0 note; S19 top-level flags; "engine exports" meaning; done-plan edits as dated corrections)
### Default applied (technical)
- S35: giveUp keeps prelude; giveUpAvailable becomes the non-throwing form of the same status→phase gates (shared predicate); else Excluded
- S3: add the matching redo row, landed before S32
- S33: only expect-free helpers move (win-seed.ts precedent); expectEngineError stays per file
- S4/S5: pairs where check n+1 cannot be broken alone are left out and named in the plan
- S19: top-level GameView boolean flags only
- S37: trigger moves from entry 12 to the retrospective (sweep does not run the skill); File(s) = 2.12 plan
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- duplicates across lenses

## Pass 3 — 2026-09-29
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 2, minor 14, decision-needed 0  |  Dropped in triage: 4 (duplicates)
Words (docs): 1494 (13.8x pass 0; stated budget 1500)  |  Snapshot: story-refactor-sweep.review-log.passes/pass3.md
Fixer: all 11 items applied at net zero words (trims to Description, S2/S4/S8/S37, Dropped/Excluded bullets, AC1/AC2 redundancies); sessionOf differs between commands/replay tests, so it stays local; no runnable commands added.
### Applied
- [major] S35 — rewritten row describes current code (giveUpAvailable already the non-throwing form; giveUp keeps prelude by design, gameview plan:99) → Dropped → fixer item 1
- [major] S33 — helper list wrong (seam/setTarget differ; sessionOf commands-only; play/drop/DICT/deepFreeze also in history/serialize/replay) → byte-identical copies only, all defining files → fixer item 2
- [minor] items 3–12 (plan residuals accounted for in one line; S3 redo row hits redoAvailable's default, "if replay rejects it first"; S32 leaves one never-default; S14 R-51 test default 5; S6 every `export type` of index.ts; behaviour-neutral guard ordering; S31 errata covers S37 trigger move; follow-up reviews done by 2-4..2-6 loops; AC mutant recorded as reverted mutation; S33 no own test file)
### Default applied (technical)
- S35 dropped (kept by design); S33 byte-identical helpers only, seam/setTarget/sessionOf stay local
- test rows land before the refactor rows S32, S34, whose commits touch no test file
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- duplicates across lenses

## Pass 4 — 2026-09-29
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 1, minor 15, decision-needed 0  |  Dropped in triage: 5 (duplicates; S19 constant-flag and S5 per-move placement left to the plan)
Words (docs): 1482 (13.7x pass 0; stated budget 1500)  |  Snapshot: story-refactor-sweep.review-log.passes/pass4.md
Fixer: all 14 items applied; S3 cite commands.ts:394; S1 case `{ ...REDO_T2, sourceCount: 2, arrangement: [X, Y] }` checked against replay.test.ts; no runnable commands added.
### Applied
- [major] S21 — fixture `play(COMMITTED, [UNDO, UNDO, UNDO])` has a committed pending draft but no redo tail (spec §2; COMMITTED has one move), so S19's labelled-property assertion would fail → drop "and redo tail" → fixer item 1
- [minor] items 2–13 (S3 cite commands.ts:394-396 and cut the unreachable fallback; S1 parenthetical; S4 "broken together"; S5 replaces the seed→activeMs test; S16 Z/z definitions; S32 = drop redo's unreachable default; "diffs" not "commits"; S26/S31 as errata; S33 cut win-seed precedent; "### Dropped" heading; S25 AD-15 not AD-6; residuals add table-vs-files completeness; S37 as a retrospective action item)
### Default applied (technical)
- S25 rename target AD-15 (fail fast), not AD-6 (2-9 log's "AD-6 id (rule 6)" pointed at the fail-fast rule)
- S32: redo's switch stays type-exhaustive; only its unreachable `never` default goes
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- duplicates across lenses
