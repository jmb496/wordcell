---
id: 11
type: story
title: "Close-out: documents, audits and device read"
parent: epic-pwa-release
covers: [CAP-9]
after: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 14]
hitl: true
risk: low
done_checkpoint: true
---

# Close-out: documents, audits and device read

## Description

Brings the spine (SPEC CAP-9's sections, plus `allowJs` in `tsconfig.e2e.json` in Scaffold deltas (D-48); through `bmad-architecture`), EXPERIENCE.md's CAP-9 rows (through `bmad-ux`) and AGENTS.md (through `bmad-project-context`: CAP-9's two lines, the new shell modules) in line with the build, and SPEC F12 and `release-checklist.md` step 6 with the epic Notes decision (retrospective before the merge); maps this epic's `rule-coverage.md` rows in the plan, closes epic 3's Q-40 and Q-42 P7 rows; syncs `build-notes.md` (lines at ff84c95: :22-23 CAP-6 unreachable-key gate, failure added, counting statement kept (7.8 plan Implementation Notes (11)); :55 hook gate `VITE_TEST_HOOKS === '1'`; :112-115 and SPEC F6: dist-smoke runs in Playwright's default worker mode, not `block`; :123-124, :151 and SPEC F8, as built (7.3 Residual risks, 7.10 D-70): no `?__WB_REVISION__` install fetch, no browser-level CDP route, observation through B's handle and a recorder in A's scope, the all-closed test needs exactly one waiting and one active worker at identification); records 7.10's G9 (D-66) disposition in `device-checks.md`. Sources: 7.10 plan rows D-32, D-47, D-48, D-49; Entry-11 amendment D-43, D-50, D-61, D-62, D-63. The plan's sync checklist has one line per sync item (above and CAP-9): source (file:line, test title, Notes line), applying commit; build-notes' "As built at 4130fb4" section is an exempt snapshot, bar :22-23.

**Phase 1 (agent, unattended).** The syncs, the rule-coverage map, `npm run test:all` and `test:screens`, all committed locally on `pwa-release` (reads build from committed sources; the footer names only the SHA), and a plan handoff listing:

- every Device row of `device-checks.md` (tailnet preview) and Desktop row (desktop Chrome) with its command (fixture, or a no-fixture run, the rest by play; e.g. `session-one-letter-left` for G17) and the epic Notes line to fill; Optional (owner) rows G18/G19 only if reinstated;
- every `docs/device-testing.md` (unverified) step, for Jared to mark confirmed, differs (what he saw) or not exercised;
- the code-review leftovers for the epic retrospective (done plans stay unedited): `review-loop/7-13-build.md` (7.13 plan Item 3's failing-path file list omits `src/ui/overlays.svelte.ts` and some engine/shell files), `review-loop/7-10-build.md` and `review-loop/7-14-build.md` (run digest).

Jared's 2026-11-04 run authorisation covers exactly the listed syncs (Description and CAP-9), recorded in the epic Notes before the first sync commit; other skill-proposed edits are Owner stop items. A rule-coverage row with no passing test (bar a P7 row turned D) is a handoff fix ticket, not synced, landing before any row whose subject it touches is read; a build- or read–document contradiction beyond the listed syncs is an Owner stop item (a proposed sync or fix ticket). A failing run (here or final) records each failing title; a D-64 failure (`e2e/nav.spec.ts` "double tap on New game on the rejected root") logs its events (A7) in the plan for the retrospective; alone, its `test:all` run repeats once in full, a repeat failure stopping the plan `in-progress` for Jared; any other failing title is a fix ticket, no rerun. Phase 1 stops the plan `in-progress` (owner-wait note) for the read, not `built`; fix tickets route as at the Owner stop.

**Owner stop.** Jared reads each row and records pass, fail or a finding with its footer in the epic Notes, a readable row's finding as pass-with-note or fail, saying which. A failure becomes a fix ticket, or a §9 or owner question where the row says so. An answer accepting the as-built behaviour makes the row pass; one needing a change, a fix ticket and re-read; one leaving it failing, an accepted gap for entry 12's Done when 1 waiver. Resuming, the agent writes each fix-ticket proposal (row, finding, rows whose subject it touches, reproduction test or §6.6 gap) from the epic Notes, adds each §9 answer to `docs/game-flow-spec.md` as its next Q-id (answer, date; joins the §6.4 audit), with a fix-ticket proposal for a test carrying each behaviour-stating one (device-read-only behaviour: an owner question), applies each approved Owner stop sync (own checklist line), commits these with his Notes records (clean tree for fix builds and re-reads) and, if a proposal, row or question is pending, stops again (owner-wait note); the orchestrator or owner adds each proposal to tickets.toml ahead of entry 11 and to entry 11's `after`, as for 13 and 14. An unreadable row or sub-step is a finding with its reason: a procedure or tooling fault becomes a CAP-7 fix ticket (as G3 routes), otherwise an owner question; an "if reproducible" sub-step that does not reproduce (G7) is recorded so, the rest judged alone. The (unverified) marks route here too: a differs needing a script or procedure change is a CAP-7 fix ticket, the step keeping its tag until an F12 re-read using it confirms it. Fixed rows and those whose subject a landed fix diff touches (judged per diff on resume, listed in the plan) are re-read (F12) before Phase 2.

**Phase 2** (once every row is resolved and its fix tickets done). The (unverified) tags: confirmed drops the tag, a wording-only differs is reworded to what he saw and untagged, not exercised keeps it; the matching (unverified) text in `device-checks.md` G2–G4, `release-checklist.md` step 4 and `build-notes.md` (ff84c95 :213, :216) follows. Then the §6.4 and §6.6 audits (§6.6 lists each fix shipped with no reproduction test as a gap, and 7.13 and any fix-less ticket as no fix shipped, each with its plan's reason; 7.14 with its committed `e2e/helpers.spec.ts` case); audit-gap and final-run fix tickets (routed as above) land before the merge, the audit re-confirms only their deltas, and an F12 re-read they cause reopens the owner stop. A gap only Jared can accept (Acceptance Criteria) stops the plan `in-progress` (owner-wait note) until accepted in the epic Notes. Then the final re-check and runs (Acceptance Criteria; a sync line a landed fix made stale that only records the build is re-synced under the same authorisation, new commit on its line, else an owner-wait item (plan `in-progress`)), and the plan goes `built`.

Unknown: which device rows fail on the phone (notably G3 activation timing and A-A11 back behaviour in G5/G6) and so how many fix tickets land before the merge.

Done checkpoint: only Jared marks it done, after reading the plan's reads and audits.

## Acceptance Criteria

Verify:

- Every Description (Phase 2 tags included), CAP-9, approved Owner stop sync and new §9 Q-id has a checklist line with source and commit.
- The plan maps every `rule-coverage.md` row except A-A11, brief §6.2 and §6.3 to its passing test(s) of the row's Test kind, by file and a title carrying one of its ids (rule-coverage preamble) or, for a P7 row turned D under SPEC Assumptions, the §6.4 gap Jared accepted in the epic Notes; A-A11 and §6.2 cite their recorded reads (G5/G6, G4); §6.3 is left to entry 12.
- The epic 3 `rule-coverage.md` Q-40 and Q-42 rows name their passing CAP-5 tests by title (F15).
- Every Device, Desktop and reinstated Optional row records in the epic Notes a pass (any finding noted) with the footer it was read on (for G3, `A`/`B` with each build's commit), or is resolved: its fix ticket done and re-read as pass on builds carrying the fix (G3: A and B), or Jared's §9 or owner answer recorded there, the row then a pass under it or an accepted gap for entry 12; every row whose subject a later fix touches is re-read (F12); no §9 or owner question raised in this plan is left open (§6.9).
- The §6.4 and §6.6 audits are recorded in the plan, every gap a fix ticket landed or, only where `release-checklist.md` allows it (§6.4 P7 row turned D; §6.6 fix with no reproduction test), one Jared accepted in the epic Notes, before `built`.
- Jared's answers or explicit deferrals to the three SPEC Open Questions are recorded in the epic Notes (§6.9).
- `SESSION_VERSION`, `HISTORY_VERSION` and the Session and history shapes are unchanged against `4130fb4` (the branch cut, epic Notes).
- At the final tree (the last source commit, after any fix ticket), the sync checklist and rule-coverage map are re-checked and `npm run test:all` and `test:screens` are green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- spec — SPEC.md CAP-9, F4–F16, Open Questions; device-checks.md; release-checklist.md (§6.4, §6.6, §6.9); rule-coverage.md; build-notes.md; _bmad-output/specs/spec-epic-3-app-shell/rule-coverage.md (Q-40, Q-42 P7 rows)
- architecture — ARCHITECTURE-SPINE.md (Description sections)
- ux — EXPERIENCE.md ("New app version installed" row, A-E4)
- source — story-refactor-sweep-plan.md (D-table, Entry-11 amendment); story-two-build-update-proof-plan.md (Residual risks); run digest _bmad-output/implementation-artifacts/autopilot/epic-pwa-release-20261030-1141.md
- constraint — docs/device-testing.md; AGENTS.md (managed block: bmad-project-context); docs/development-methodology.md, Definition of done
