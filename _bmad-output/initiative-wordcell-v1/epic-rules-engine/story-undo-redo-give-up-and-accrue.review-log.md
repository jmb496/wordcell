# Review log — story-undo-redo-give-up-and-accrue.md (ticket 2.6)
State: pass 1: done

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
