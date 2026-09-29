# Review log — story-undo-redo-give-up-and-accrue.md (ticket 2.6)
State: pass 4: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: HEAD d4fb67e, copy `story-undo-redo-give-up-and-accrue.review-log.passes/pass0.md`, 197 words.
Refs: SPEC.md, build-notes.md, rule-coverage.md (spec-epic-2-rules-engine), epic-rules-engine.md, ARCHITECTURE-SPINE.md, AGENTS.md; done-ticket plans: story-golden-deal-test-and-r-id-test-names-plan.md, story-langdata-en-and-lettercount-plan.md, story-session-createsession-replay-and-checksession-plan.md, story-composing-commands-and-the-command-table-plan.md, story-validate-and-place-commands-with-the-8-worked-example-plan.md.

## Pass 1 — 2026-09-29
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 6, minor 7, decision-needed 0  |  Dropped in triage: 0 (duplicates merged across the four lenses)
Words (docs): 817 (4.1 x pass 0)  |  Snapshot: story-undo-redo-give-up-and-accrue.review-log.passes/pass1.md
Fixer: all 13 items applied; only command touched is the existing `npm run test:all` (not run, design statement); new check codes are names, nothing to run.
### Applied
- [major] AC/Description — R-60 hand-off from entries 3 and 5 missing ("Redo performs the commit without discarding", Redo path of "never touches later moves") → fixer item 1
- [major] AC R-71 — same-letter swap edit (deferred by entry 4) and failed Validate keeping both kinds of redo data not named → fixer item 2
- [major] Description, command table — rows, check codes and order unlisted; the SAMPLE-driven gaveUp status generator would emit an `undo` throw row contradicting R-75 → fixer item 3
- [major] accrue — module, AD-2 export from index.ts (index.test.ts pins exports), check order and case matrix unspecified; "all three statuses" misreads the overflow case → fixer item 4
- [major] won helper — module, name, signature unspecified though entries 8–11 import it; AD-1 scans non-test engine files → fixer item 5
- [major] R-75/R-70 — giveUp leaving pending draft and redo tail untouched, undo clearing only the flag at index 0 and > 0, not redoable, index-0 undo throw while playing not named (rule-coverage R-70, R-75) → fixer item 6
- [minor] AC R-39 — observation for "returns S, D and free letters" unstated (no `view` before entry 8) → fixer item 7
- [minor] Notes — open question answerable from refs (inline set built from each column's own letters) → fixer item 8
- [minor] Description — "entries 9, 10 and 11" omits entry 8 and is a later-ticket obligation → fixer item 9
- [minor] References — omit SPEC CAP-5, rule-coverage rows, AD-2, done-ticket plan hand-offs → fixer item 10
- [minor] Description — `Command` union widening and deep-freeze of inputs not stated → fixer item 11
- [minor] accrue `0` — return the input before any replay (build-notes order) → fixer item 12
- [minor] redo into a winning commit (undo then redo from the won Session) not tested → fixer item 13
### Default applied (technical)
- check codes → `r70-nothing-to-undo` (undo at Idle index 0 while playing), `r71-no-redo-data` (redo with no redo data in Idle, Composing, Place); giveUp in Composing/Place → `command-phase`; redo/giveUp while not playing → `command-status`; undo skips the status check; listed in errors.ts
- status rows → generated from an explicit list excluding `undo`, for gaveUp and won (won helper); undo from won/gaveUp are named success tests
- accrue → `src/engine/commands.ts`, exported from index.ts, `AD-2 index exports …` test gains `accrue`
- won helper → `src/engine/win-seed.ts` exporting `winSeed(seed: number): Session`, pure, relative engine imports only, no vitest, not exported from index.ts, own `win-seed.test.ts` (seeds 1 and 4294967295 reach won at {8, idle})
- R-39 observation → internal `replay` position deep-equals the pre-drop position, draft kept at moves[index]
### Decision needed (functionality / UX / gameplay)
- none

## Pass 2 — 2026-09-29
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 4, minor 11, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 1147 (5.8 x pass 0)  |  Snapshot: story-undo-redo-give-up-and-accrue.review-log.passes/pass2.md
Fixer: all 15 items applied; no commands touched.
### Applied
- [major] AC accrue — no success case: while playing (Idle and Composing) a positive safe ms returns a new Session with activeMs + ms, all else equal; boundary MAX_SAFE_INTEGER − 5 + 5 succeeds, + 6 throws (all four lenses) → fixer item 1
- [major] AC "R-72 cases." — names no case → fixer item 2
- [major] AC R-71 — Redo success transitions (R-71 first sentence; §2 "Redo from Idle enters its Composing") not named → fixer item 3
- [major] AC R-70 — Idle → previous Place named only for one pending-draft shape; plain, never-committed (Q-41) and committed-with-tail variants → fixer item 4
- [minor] AC R-71 failed Validate — already covered by commands.test.ts `R-37 R-38 a failed Validate …` on WITH_TAIL; rename with R-71 instead of a duplicate → fixer item 5
- [minor] AC R-75 "redo does not set gaveUp" — setup undefined (no redo data throws) → fixer item 6
- [minor] AC R-75 undo while gaveUp — assert status derives back to playing → fixer item 7
- [minor] AC undo/redo/giveUp tests — assert whole Session toStrictEqual (only cursor/flag changes; moves, reached, activeMs untouched) → fixer item 8
- [minor] AC R-71 Redo into Place ignoring the dictionary — observation (ctx without dictionary and with `new Set()`) → fixer item 9
- [minor] AC accrue invalid ms — list values (−1, 1.5, NaN, Infinity, 2**53) per status → fixer item 10
- [minor] Description check order — state replay first for undo/redo/giveUp (as the prelude), undo's own order → fixer item 11
- [minor] AC R-39 — position assert cannot fail (replay returns the committed prefix); keep cursor/draft asserts, hand the view check to entry 8 → fixer item 12
- [minor] AC R-71 same-letter swap — name it a D2 edge test (crafted tail via `applyFrom`) per SPEC D2 → fixer item 13
- [minor] Description winSeed — lang (EN), imports from `./index`, columns 1 → 8 → fixer item 14
- [minor] AC — undo from won/gaveUp required twice; command-table sub-bullet points to R-70/R-75 → fixer item 15
### Default applied (technical)
- undo own-check order → replay, then gaveUp → clear flag; Idle index 0 → `r70-nothing-to-undo`; otherwise the phase step
- same-letter swap → D2 edge test via `applyFrom`
- winSeed → `EN`, `apply`/`EN` from `./index`, columns 1 → 8
### Decision needed (functionality / UX / gameplay)
- none

## Pass 3 — 2026-09-29
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 4, minor 10, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 1341 (6.8 x pass 0)  |  Snapshot: story-undo-redo-give-up-and-accrue.review-log.passes/pass3.md
Fixer: all 14 items applied; no commands touched.
### Applied
- [major] AC R-71 — "discard cases already covered by entries 4 and 5's R-71 tests" is false for drop (`§2 a drop in Idle …`, commands.test.ts:941) and Confirm (`R-60 confirm discards the redo tail …`, :1233); rename both to carry R-71 (three lenses) → fixer item 1
- [major] AC R-39 / Notes — pass 2 item 12 left R-39 "returns S, D and the free letters" with no failing observation and handed it to entry 8, whose scope lacks it (rule-coverage R-39 and tickets.toml assign it here) → fixer item 2
- [major] AC R-71 same-letter swap — pass 2 item 13 routed it through the seam; SPEC D2 / build-notes CAP-3 put redo semantics on public `apply` → fixer item 3
- [major] AC R-70 Place → Composing, Composing → Idle — not required on tail fixtures, so an undo that drops the tail or lowers `reached` passes (R-72) → fixer item 4
- [minor] AC R-75 redo while gaveUp — name the check code `command-status` → fixer item 5
- [minor] AC R-75 — giveUp on a fresh `createSession` Session (index 0); the index-0 undo test builds on it → fixer item 6
- [minor] Description — `AD-2 index exports …` test name and list both gain `accrue` → fixer item 7
- [minor] Description — `SAMPLE` (typed by `Command['type']`) gains undo, redo, giveUp; status generator iterates the explicit list → fixer item 8
- [minor] AC — status observed via internal `status(s, replay(s, EN))` → fixer item 9
- [minor] AC rows — giveUp wrong-phase rows id `R-75`, redo status rows `R-71 R-75` → fixer item 10
- [minor] AC whole-Session sentence — scope to the undo/redo/giveUp step's own input and output → fixer item 11
- [minor] Description winSeed — spelling source: `deal(seed)` letters lowercased (`QU` → "qu") → fixer item 12
- [minor] Description — redo order (replay → status → `r71-no-redo-data`, no phase check), giveUp (replay → status → phase Idle) → fixer item 13
- [minor] AC R-70 — use the Place-reached PENDING fixture as a never-committed variant too → fixer item 14
### Default applied (technical)
- R-39 observation → after undo from Composing, the same drop and the same addFreeLetter re-applied through public `apply` succeed (S and the free letter are back), plus cursor and kept-draft asserts; the entry 8 hand-off note is removed
- same-letter swap → public `apply` on a hand-built Session (`sessionOf` pattern, seed chosen by the plan); the seam only as a D2 exception the plan names if no dealt seed offers two same-letter cards
- winSeed spelling → from `deal(seed)`
- row ids → giveUp wrong phase `R-75`; redo status `R-71 R-75`
### Decision needed (functionality / UX / gameplay)
- none

## Pass 4 — 2026-09-29
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 2, minor 14, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 1432 (7.3 x pass 0)  |  Snapshot: story-undo-redo-give-up-and-accrue.review-log.passes/pass4.md
Fixer: all 16 items applied; no commands touched.
### Applied
- [major] Description winSeed — pass 3 default read spellings from the D1 `deal` export, which SPEC D1 says epic 3 removes; entries 8–11 depend on the helper → internal `dealIds(seed)` + `spelling(card, EN)` → fixer item 1
- [major] AC rows — undo index-0 and redo no-redo-data rows have no id, yet they are R-70 "index 0 disabled" and R-71 enablement's only coverage (id-named coverage gate) → fixer item 2
- [minor] AC R-70 — "three variants" now lists four → fixer item 3
- [minor] AC status rows — won rows' ids unstated → fixer item 4
- [minor] AC accrue — "each in playing, won and gaveUp" applies to the invalid-ms throw too → fixer item 5
- [minor] AC win-seed.test.ts — id `R-62` → fixer item 6
- [minor] AC accrue — add/overflow/not-playing cases `R-76`, invalid-ms throw `AD-2` → fixer item 7
- [minor] Description check order — `apply` resolves the seed before the type dispatch; cite the existing `apply` order → fixer item 8
- [minor] AC R-71 Redo Composing → Place — on reached place and reached committed (WITH_TAIL) → fixer item 9
- [minor] AC R-72 — redo returns the pre-undo Session → fixer item 10
- [minor] AC R-39 — also D back (same default `destinationCount`) → fixer item 11
- [minor] AC status list — derive as `Object.keys(SAMPLE)` filtered to exclude `undo` → fixer item 12
- [minor] AC rows — AD-2 wording as precondition text ("nothing to undo", "no redo data") → fixer item 13
- [minor] Description accrue — positive ms derives status via replay, as `apply` does → fixer item 14
- [minor] AC R-71 swap — `sessionOf` is seed 1; seed 1 offers same-letter pairs → fixer item 15
- [minor] AC R-71 — k = 0 flip and k = 1 top-of-D tap rows (id R-31) gain R-71 per rule-coverage → fixer item 16
### Default applied (technical)
- winSeed spellings → internal `dealIds(seed)` and `spelling(card, EN)`; `apply` stays public; no D1 `deal`
- row ids → undo index-0 rows `R-70`, redo no-redo-data rows `R-71`, won status rows reuse the gaveUp rows' ids (`R-75`; redo `R-71 R-75`), since R-75 covers every status ≠ playing
- accrue positive ms → status via `replay`
### Decision needed (functionality / UX / gameplay)
- none
