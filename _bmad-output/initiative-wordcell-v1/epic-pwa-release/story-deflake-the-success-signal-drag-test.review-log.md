# Review log — story-deflake-the-success-signal-drag-test.md (ticket 7.13)

State: pass 1: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: 220 words, copy `story-deflake-the-success-signal-drag-test.review-log.passes/pass0.md` (HEAD 95b454c).

## Pass 1 — 2026-11-03
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 8, minor 6, decision-needed 0  |  Dropped in triage: 1 (about 20 duplicates merged)
Words (docs): 888 (4.0x pass 0; budget 1500)  |  Snapshot: story-deflake-the-success-signal-drag-test.review-log.passes/pass1.md, fix diff pass1.fix.diff
Fixer: all 14 applied, no conflicts; new `## Scope` items 1–6; Playwright 1.63.0 `npx playwright test --help` confirms `--grep`, `--project`, `--repeat-each`, `--retries`; suites not run. Noted: tickets.toml entry 13 description/verify not synced (outside the target; for the orchestrator).
### Applied
- [major] Description, edit boundary — `e2e/helpers/drag.ts` holds only the residue checks; the drag is driven by gestures.ts, touch.ts, board.ts, lifecycle.ts; scope of "its helpers" and of config unclear → fixer item 1
- [major] Description/AC — nothing forbids weakening the test (title, dragged steps, literals, per-step checks, skip/fixme/retries/slow, config timeouts) → fixer item 2
- [major] AC — no standard of proof for a cause; 0/50 after proves nothing when before is 0/50 → fixer item 3
- [major] Reproduction — every sighting was under full-suite load, only the isolated run is required; no CI-unset/retries-0 pin; 7.10's 0/3 counted-run rule dropped → fixer item 4
- [major] AC outcomes — no branch for reproduces-without-cause, for a `src/` cause (CAP-8 routes it to a fix ticket under technical defaults), or for an input-delivery/environment cause → fixer item 5
- [major] Evidence — "evidence examined" undefined; the one surviving failure output (.autopilot/20261014-2230/6.1-T-attempt1.log:1361, `validateAndRetarget` :383 via :475, cursor `composing` not `place` after step 4) omitted; where the record goes undefined → fixer item 6
- [major] AC `test:all` — no rule for a final run failing on the open D-64/D-71 flakes, nor for this test failing in a later `test:all` → fixer item 7
- [major] Fix path — a changed shared helper gets no `e2e/helpers.spec.ts` case or repeat count (AGENTS.md Files; 7.10 item 5); `test:screens` when a screens spec imports it → fixer item 8
- [minor] Frontmatter — `hitl: false` missing (tickets.toml entry 13) → fixer item 9
- [minor] Sightings — "0/3" understates 7.10's 0/15 across five trees → fixer item 10
- [minor] "the ticket closes" reads as the build marking done; plan reaches `built`, owner/autopilot marks done → fixer item 11
- [minor] No recurrence rule after a no-cause close → fixer item 12
- [minor] 13 and 14 may both touch `e2e/helpers/touch.ts`; order → fixer item 13
- [minor] References — constraint refs (methodology DoD, AGENTS.md Running and verifying, AD-17) → fixer item 14
### Default applied (technical)
- Edit boundary — the spec plus any `e2e/helpers/` module it imports, plus `e2e/helpers.spec.ts`; `src/` and Playwright config out
- Cause proof — temporary reverted test-side injection reproducing the sighted failure mode before the fix and passing after
- Load counts — three counted `npx playwright test --project=android` runs, CI unset, retries 0, before and after; 0/3 after a fix
- `src/` cause — no `src/` edit; plan stops short of `built` with a B8 fix-ticket proposal (CAP-8); owner only if the player would notice
- Final `test:all` — one rerun at the same commit when the only failures are D-64's or D-71's titled tests; any failure of this test after the fix counts against it; any other failure stops
### Dropped
- "No rerun at all for other flakes" (ref alignment) — superseded by the one-rerun default for the two named open flakes, which have their own tickets
