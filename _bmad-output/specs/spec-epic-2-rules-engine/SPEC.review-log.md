# Review log — spec-epic-2-rules-engine/SPEC.md
State: pass 7: done

Target: _bmad-output/specs/spec-epic-2-rules-engine/SPEC.md (docs mode, thorough, max 7). Pre-loop HEAD bf42be9; pass 0 copy SPEC.review-log.passes/pass0.md, 1865 words.
Fixes are routed through bmad-spec (memlog entries, then re-derive), per owner instruction; companions may re-derive too.

## Pass 1 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref alignment  |  Findings: major 7, minor 17, decision-needed 0  |  Dropped in triage: 1
### Applied
- [major] CAP-9 / build-notes CAP-9 — no pre-replay schema/type check (missing or wrong-typed Session, cursor, Move fields, bad enums) so a TypeError escapes to AD-15 instead of `replay-failed` (AD-7 "schema or any replay violation") → fixer item 1
- [major] D2 / CAP-4 §8 / build-notes CAP-4 — no named internal seam for driving commands, replay and view from a hand-built position; `apply` only takes a seed-derived Session → item 2
- [major] CAP-7 — "flag true iff command neither no-op nor throw" is unsatisfiable for `canValidate` (structural, AD-3/AD-8) and has no flag → command/argument mapping for per-column/per-cell flags → item 3
- [major] build-notes CAP-7 — `kIfTapped` "cards outside D's column absent" would map S cards of a self-drop, which AD-2 makes a throw → item 4
- [major] CAP-1 / D1 — golden test calls the transitional `deal` that epic 3 removes, contradicting "stays green unchanged" → item 5
- [major] CAP-9 — `parseHistory` ok shape and container checks (missing/non-array `records`, extra keys) unspecified → item 6
- [major] rule-coverage R-23 — "one test per drop position" untestable: `drop` has no position field → item 7
- [minor] items 8–24 (see fixer list: fixture naming, EngineError import, statistics over all records, freeLetters order, DECK_SIZE contradiction, relative-band test, table rows per phase, table split CAP-4/CAP-5, CAP-9 split vs CAP-8, accrue precedence, draft/Place data presence, maxScore derived, R-74 replayed seed, isRecorded while playing, Letter type, deep-freeze inputs, single-field fixture derivation)
### Default applied (technical)
- all 24 items are technical; reviewer defaults taken
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- builder "public-API vs position tests" duplicate of item 2 (merged)
Fix: all 24 applied via bmad-spec (memlog entries 28–55, re-derived; new D8 freeLetters order). Item 3 narrowed: AD-3 has no removeFreeLetter flag, left to the command table. No commands touched.
Words (docs): SPEC 2139 (1.15x pass 0); rule-coverage 1491; build-notes 1620  |  Snapshot: SPEC.review-log.passes/pass1.md (+ companions), fix diff pass1.fix.diff

## Pass 2 — 2026-09-28
Reviewers: fix diff, edge-case, adversarial, ref alignment  |  Findings: major 6, minor 20, decision-needed 0  |  Dropped in triage: 3 (duplicates merged)
### Applied
- [major] Constraints / Success signal vs CAP-1 — "golden test byte-identical/unchanged" contradicts CAP-3's call repoint (pass-1 item 5 side effect) → item 1
- [major] build-notes CAP-9 schema — lists nonexistent Move field `k`, omits `destinationCount` → item 2
- [major] build-notes/SPEC CAP-9 — schema check duplicates AD-7 checks (field set, gaveUp, seed, activeMs, presence-iff) so AD-7 fixtures cannot name their rule; no rule id for schema failures; no domain ranges (column 1–8, cell 3–10, CardId 0–51) so replay can still TypeError → item 3
- [major] CAP-9 — history round trip (serializeHistory → parseHistory) untested despite the intent → item 4
- [major] build-notes CAP-9 — history fixtures cannot assert an EngineError message (parseHistory yields reason values) → item 5
- [major] rule-coverage R-31/R-33 — UI-level no-ops (press at a bound, tap on used/empty cell) have no test form; risk of same-reference tests contradicting AD-2 throw rows → item 6
- [minor] items 7–26 (kIfTapped wording, R-23 (UI) label, P3 vs P4–6 split, §2 unmapped sentences, STUCK_PENALTY replacement constant, null/[] per parser, isRecorded positive/mismatch, lettersLeft definition, watch re-run 1 s, statistics counts/longestWord absent, letterCount range throw, single checkSession, R-39 (UI) claim, "never seeds" wording, Start invariants, synthetic LangData via constructor, replay applies committed draft before tail, round-trip fixture set, "first code commit")
### Default applied (technical)
- all items technical; reviewer defaults taken
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- duplicates: golden-test contradiction (ref alignment = fix diff), schema overlap (3 reviewers), `k` field (edge = fix diff), STUCK_PENALTY (2 reviewers) merged
Fix: all applied via bmad-spec (memlog lines 61–89). PENALTY_PER_LETTER placed in types.ts. Spine note recorded: AD-17 Seeding says fixtures/*.json are "valid" while AD-7 requires a rejecting fixture per check (spine owner fix, not blocking).
Words (docs): SPEC 2354 (1.26x pass 0); rule-coverage 1680; build-notes 1989  |  Snapshot: SPEC.review-log.passes/pass2.md (+ companions), fix diff pass2.fix.diff

## Pass 3 — 2026-09-28
Reviewers: fix diff, edge-case, adversarial, ref alignment  |  Findings: major 6, minor 16, decision-needed 0  |  Dropped in triage: 3 (duplicates merged)
### Applied
- [major] CAP-3 "apply, view and parseSession reject the same Sessions" false: schema stage runs only in parseSession (pass-2 item 3 side effect) → item 1
- [major] build-notes CAP-9 — `cursor.index` lost its integer check in pass 2 (AD-7 gives only a range) → item 2
- [major] schema stage — `moves` elements and `cursor` not required to be non-null plain objects; `records` elements likewise in parseHistory → TypeError → item 3
- [major] rule-coverage R-76 — "It is always recorded for statistics (R-84)" unmapped → item 4
- [major] rejection tests cannot prove which check fired (shared `§2 schema` tag, shared rule ids); history proof optional → item 5
- [major] rule-coverage R-71 — "bound press is not an edit" as an engine test contradicts AD-2 throw row and R-31 row → item 6
- [minor] items 7–22 (null/[] rationale false, checkSession-runs-twice wording, R-84 "one game in progress", §2 V rows supplementary, CAP heading rule ids vs rule-coverage, GameView word-string case, non-integer sourceCount/index table rows, pending-draft Q-41 wording, validation order, letterCount 1.5, accrue all statuses, D6 QU wording, undefined-valued keys, fixture generation, EN.letters case)
### Default applied (technical)
- all items technical; reviewer defaults taken (item 1: narrow the claim; schema stage belongs to parseSession; apply/view take engine-produced Sessions)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- duplicates merged: entry-point claim (fix diff = adversarial), cursor.index (fix diff = edge), checkRecord may→is merged into item 5
Fix: all 21 applied via bmad-spec (memlog lines 90–113). CAP-3 heading now §2, R-04, R-52, R-60–R-62; CAP-4 range ends R-60.
Words (docs): SPEC 2417 (1.30x pass 0); rule-coverage 1781; build-notes 2228  |  Snapshot: SPEC.review-log.passes/pass3.md (+ companions), fix diff pass3.fix.diff

## Pass 4 — 2026-09-28
Reviewers: fix diff, edge-case, adversarial, ref alignment (late-pass bar)  |  Findings: major 3, minor 18, decision-needed 0  |  Dropped in triage: 2 (duplicates merged)
### Applied
- [major] CAP-1/CAP-2 — CardId→letter mapping (distribution order and counts) is pinned by no test that can fail; the renamed R-01 test compares against EN itself, so a reorder changes every deal's letters with all gates green (AGENTS Policy, AD-5) → item 1
- [major] CAP-3 / rule-coverage §2 — the "only" half of per-`reached` validation is untested; an over-checking replay would reject valid saves → item 2
- [major] CAP-9 history round trip uses hand-built records; nothing proves `gameRecord` output passes `parseHistory` → item 3
- [minor] items 4–21 (history fixture split, CAP-8 heading R-76, null/[] as fixture files, §2 V kind, won-Session test helper, per-move check codes owner, R-71 "etc.", used/isLegalTarget per phase, empty spelling, 52-card constructor, headings R-39/R-74, untagged UI sentences R-50/R-83, replay-failure granularity per rule id, word count = moves before cursor, parseHistory stage order, longest-word shape shared with gameRecord, command throw codes)
### Default applied (technical)
- all items technical; reviewer defaults taken
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- merged: letter pin (ref alignment = adversarial), 52-card synthetic language (edge = adversarial)
Fix: all 20 applied via bmad-spec (memlog lines 114–136). #6 supersedes pass-3 item 7 (null/[] now fixture files); #8 supersedes the "won via seam" source (shared won-seed helper).
Words (docs): SPEC 2490 (1.34x pass 0); rule-coverage 1895; build-notes 2543  |  Snapshot: SPEC.review-log.passes/pass4.md (+ companions), fix diff pass4.fix.diff

## Pass 5 — 2026-09-28
Reviewers: fix diff, edge-case, adversarial, ref alignment (late-pass bar)  |  Findings: major 2, minor 18, decision-needed 0  |  Dropped in triage: 4 (duplicates merged)
### Applied
- [major] CAP-9 / rule-coverage §2 / build-notes CAP-9 — "one rejecting replay fixture per rule id" (pass-4 item 16) is unsatisfiable: R-11, R-12, R-20, R-22, R-30, R-32, R-34, R-41 are permissions or unrepresentable/schema-caught, and R-21/R-31 reject the same condition → item 1
- [major] CAP-9 / build-notes CAP-3 — "one field changed" cannot reach some checks first (R-36 at reached ≥ place trips presence-iff, freeLetters or R-35 first); per-move check order (rule-id order, §2 freeLetters unplaced) is unspecified → item 2
- [minor] items 3–20 (2-letter Composing fixture missing from CAP-9 list, spelling fixture split, won helper letter order, unknown-fields scope per object, negative .5 average test, AD-17 Place fixture with free letter + non-default order, reconcile on empty history, validate dictionary-check precedence, R-39 "no Cancel" test form, CAP-3 claim vs version, cells index wording, CAP-6 "Σ over 52 cards" wording, seam start with no column card, golden letter assertion surviving D1 removal, accrue safe-integer, D4 cite R-84/Q-28 for all-records statistics, canValidate negative direction)
### Default applied (technical)
- all items technical; reviewer defaults taken. Statistics over all records (won and gaveUp) kept: R-84/AD-6 list the six values over the score history, which holds every finished game; noted for the owner summary, not a decision-needed item.
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- merged: replay-fixture-per-rule-id (4 reviewers), per-move order folded into item 2
Fix: all 19 applied via bmad-spec (memlog lines 137–158).
Words (docs): SPEC 2570 (1.38x pass 0); rule-coverage 1963; build-notes 2841  |  Snapshot: SPEC.review-log.passes/pass5.md (+ companions), fix diff pass5.fix.diff

## Pass 6 — 2026-09-28
Reviewers: fix diff, edge-case, adversarial, ref alignment (late-pass bar)  |  Findings: major 2, minor 17, decision-needed 0  |  Dropped in triage: 5 (duplicates merged)
### Applied
- [major] build-notes CAP-3/CAP-9, rule-coverage §2 — duplicate free-letter cell owned by both R-33 and the §2 freeLetters check (pass-5 item 2 side effect), so the §2 fixture can never be first → item 1
- [major] CAP-9 — Session rejecting fixtures never assert `parseSession` returns `replay-failed { version }` (only the stage's code), so a leaking or mis-mapping parser passes → item 2
- [minor] items 3–19 (accrue: SPEC wording, overflow only while playing, own tests not table rows, safe-integer spine note; golden letter "may"→"asserts" and one literal only; history record-version fixture + longestWord null; R-40 QU case and R-85 "never counts cards" mapping; status-before-phase order; JSON.parse failure and primitive-root cases; "fails exactly one" → "first violation"; CAP-7 creates longest-word function reused by CAP-8; §2-named replay tests on purpose; success-signal ends spelled out; §8 CardId choice + drop/tap k=1 assertions)
### Default applied (technical)
- all items technical; reviewer defaults taken
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- merged: duplicate cell (fix diff = edge), accrue table row (3 reviewers), accrue statuses (edge = adversarial)
Fix: all 15 applied via bmad-spec (memlog lines 159–176). Spine note added to build-notes (safe-integer domain for activeMs/elapsedMs).
Words (docs): SPEC 2637 (1.41x pass 0); rule-coverage 2046; build-notes 3045  |  Snapshot: SPEC.review-log.passes/pass6.md (+ companions), fix diff pass6.fix.diff

## Pass 7 — 2026-09-28 (verify-only)
Reviewers: fix diff  |  Findings: major 0, minor 2, decision-needed 0  |  Dropped in triage: 0
Majors per pass: 7, 6, 6, 3, 2, 2, 0.

## Result — converged after 7 passes
Words: SPEC 1865 → 2637 (1.41x); rule-coverage 1441 → 2046; build-notes 984 → 3045. Every fix went through bmad-spec (memlog lines 28–176). No decision-needed items. Spine notes for the spine owner (not blocking): AD-17 Seeding calls fixtures/*.json "valid" while AD-7 needs rejecting fixtures; safe-integer domain for AD-7 activeMs / AD-2 elapsedMs; R-50 and R-83 display sentences lack a (UI) tag in the rules spec.

Unapplied minors (for the build):
- build-notes CAP-9: the "Session rejecting fixture tests assert replay-failed" bullet must be limited to schema, AD-7 and replay-check fixtures; session-invalid-null/-array assert only version-unreadable (SPEC CAP-9 already scopes it correctly).
- rule-coverage R-85 cites "the QU cases of R-80" but the R-80 row lists no QU word-score case; add one (a word containing QU scores by letter count) in the R-80 test.
