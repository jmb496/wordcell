# Review log — story-refactor-sweep.md (ticket 2.12)
State: pass 1: done

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
