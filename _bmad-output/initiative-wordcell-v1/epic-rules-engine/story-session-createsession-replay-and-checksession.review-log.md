# Review log — story-session-createsession-replay-and-checksession.md (ticket 2.3)
State: pass 3: done

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

## Pass 2 — 2026-09-28
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 6, minor 14, decision-needed 0  |  Dropped in triage: 1 (plus duplicates merged)
Words (docs): 1437 (6.1 x pass 0; budget 1500)  |  Snapshot: story-session-createsession-replay-and-checksession.review-log.passes/pass2.md
Fixer: all 20 items applied; added `DestinationSide` to the type list (referenced by Move); no commands.
### Applied
- [major] Inputs bullet vs Violable checks — "no test feeds out-of-domain/wrongly typed fields" contradicts AD-7 typed checks (seed, activeMs, gaveUp, cursor.index, unknown fields) owned by checkSession → fixer item 1
- [major] AC — no redo-tail violation case and no Q-41 below-committed last-element accepting case (SPEC CAP-3) → fixer item 2
- [major] R-60 scope — `cursor = {index + 1, idle}` and "never touches later moves" left unowned → fixer item 3
- [major] Accepting cases — no scenarios for R-12, R-30, R-32, R-34; R-12/R-32 not expressible as a Move → fixer item 4
- [major] R-61 — no exposure test; "not usable in the same word" handed to entry 4, which does not list R-61 (rule-coverage: R-61 CAP-3 only) → fixer item 5
- [major] AC — no test that a draft/redo tail leaves the returned position equal to the committed prefix (§4 preamble, §2 committed-prefix row) → fixer item 6
- [minor] items 7–20: code-literal mapping, test-id prefixes (R-02 kept, seam throws `§2`), R-52/R-41 shared Session, exact type list, message wording, §2 invariant two codes, QU upper R-40 boundary, `Object.hasOwn`, Start tuple types, deep-freeze scope, Infinity seed, checkSession signature, seed shared code, won-test wording, R-31/presence code counts → fixer items 7–20
### Default applied (technical)
- AD-7 typed checks tested with cast-built Sessions; schema stage owns only fields AD-7 does not type
- Cursor advance and "never touches later moves" → entries 5 (`confirm`) and 6 (`redo`)
- R-12, R-32 covered by construction (no Move field expresses them), named in the plan
- `checkSession(session)` = AD-7 pre-replay checks only; `replayFrom` runs the post-replay gaveUp check
- §2 invariant two codes; R-31 one range code; presence one code; one shared `seed-uint32` code
- `Start` columns/cells as fixed-length 8-tuples (compile-time), no runtime shape check
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- `-0` seed (again) — no ref basis, builder's call

## Pass 3 — 2026-09-28
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 17, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 1499 (6.3 x pass 0; budget 1500)  |  Snapshot: story-session-createsession-replay-and-checksession.review-log.passes/pass3.md
Fixer: all 18 items applied; tightened existing wording to stay within budget; no commands.
### Applied
- [major] R-60 scope — "never touches later moves" and "Redo performs the commit without discarding" handed to entry 6, which does not own R-60 (rule-coverage R-60 row: CAP 3, 4; tickets.toml entry 6 verify) → cover "never touches later moves" here via replay with a redo tail; Notes hand-off for the Redo sentence to entry 6 → fixer item 1
- [major] R-04 — "eight WordCells start empty" and "status playing" asserted only by a `§2` test → R-04 test asserts empty cells and playing → fixer item 2
- [major] R-60 — no concrete case; default placementOrder cannot tell placementOrder from word order; D leaving a non-source destination unasserted → fixer item 3
- [major] QU case — letter count could skip D cards; reword to QU as the D card (k = 1) → fixer item 4
- [major] D8 — no test that `freeLetters` order is free; extend the R-34 case → fixer item 5
- [minor] items 6–20 (code counts, R-31 self-drop case, dealIds guard-free, seam uniqueness/card-id-domain, committed-prefix cursor, R-32 wording, seam test prefix AD-2, Inputs reword, R-61 fixture shape, cursor-phase code, QU committed, cut messages sentence, trim opening paragraph, move-major order, status Idle clause) → fixer items 6–20
### Default applied (technical)
- Seam throw tests named `AD-2 …`; out-of-range id reuses `card-id-domain`
- `dealIds` guard-free (D1 unchanged); `replayFrom` validates the Start, then `checkSession`
- Per-move validation move-major; cursor-phase/reached one code; `sourceCount` range one code
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
