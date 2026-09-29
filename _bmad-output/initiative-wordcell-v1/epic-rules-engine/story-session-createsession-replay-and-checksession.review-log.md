# Review log — story-session-createsession-replay-and-checksession.md (ticket 2.3)
State: pass 1: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: HEAD 187bd73, copy `story-session-createsession-replay-and-checksession.review-log.passes/pass0.md`, 235 words.
Refs: SPEC.md, build-notes.md, rule-coverage.md (spec-epic-2-rules-engine), epic-rules-engine.md, ARCHITECTURE-SPINE.md, AGENTS.md; done-ticket plans: story-golden-deal-test-and-r-id-test-names-plan.md, story-langdata-en-and-lettercount-plan.md.

## Pass 1 — 2026-09-28
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 12, minor 8, decision-needed 0  |  Dropped in triage: 1 (plus duplicates merged)
Words (docs): 990 (4.2 x pass 0; budget 1500)  |  Snapshot: story-session-createsession-replay-and-checksession.review-log.passes/pass1.md
Fixer: all 19 items applied; no commands added.
### Applied
- [major] Description/AC — R-52 missing (SPEC CAP-3, rule-coverage); add a test with the target equal to a used free letter's source cell → fixer item 1
- [major] AC — R-60 sentences needing confirm/redo (entries 5, 6) claimed here; scope to atomic commit via replay → fixer item 2
- [major] Description/AC — index.ts surface unstated (createSession, SESSION_VERSION, types; AD-2 index test) → fixer item 3
- [major] Description — fresh Session fields (version, gaveUp, activeMs) and SESSION_VERSION = 1 (D5) unstated; seed boundary cases → fixer item 4
- [major] Description — internal signatures of replay/replayFrom/status unstated; build-notes `replayFrom(start, moves)` lacks cursor and lang → fixer item 5
- [major] AC — golden test before/after, literals byte-identical, deal over dealIds (AGENTS.md Policy) → fixer item 6
- [major] AC — §2 status branches (gaveUp, playing, won) and AD-7 post-replay gaveUp-on-won rejecting case → fixer item 7
- [major] Description — R-62 won test "seam or hand-built" ambiguous; an empty seam start throws (D2); checkSession on the seam path → fixer item 8
- [major] Notes — open structural question with no default → fixer item 9
- [major] AC — violable-check list and inline-vs-fixture unstated; seam throws untested → fixer item 10
- [major] Description — schema-stage domain/type checks are parseSession's (entry 10); replay assumes schema-valid input → fixer item 11
- [major] AC — no QU replay case for R-36/R-40 letter counting → fixer item 12
- [minor] AC — replay-check rejection tests named `§2 …` (rule-coverage) → fixer item 13
- [minor] Description — check-code scheme vs errors.ts kebab-case → fixer item 14
- [minor] AC — which inputs are deep-frozen → fixer item 15
- [minor] References — SPEC CAP-3/D2/D5, rule-coverage rows, AD-2/AD-5/AD-7, game-flow-spec sections → fixer item 16
- [minor] Description — activeMs safe integer (build-notes) → fixer item 17
- [minor] AC — R-33 empty vs duplicate: two codes → fixer item 18
- [minor] AC — counter case: composing cursor with a Place-reached 2-letter draft throws R-36 → fixer item 19
### Default applied (technical)
- Notes open question — per-move guard functions in an internal engine module (e.g. `rules.ts`), reused by entries 4, 5, 8, never exported
- Signatures — `replay(session, lang)`, `replayFrom(start, session, lang)`, internal `status(session, position)`; deviation from build-notes noted
- Won test — seam start with a few column cards cleared by hand-built committed moves
- Rejecting cases — inline deep-frozen Sessions; fixture files are entry 10's
- Check codes — keep errors.ts kebab-case scheme, extend its list; R-33 two codes
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- `-0` seed normalisation (edge-case) — unlikely corner case, no ref basis; builder's call
