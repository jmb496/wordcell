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

Brings the spine (AD-16 boot tail and update policy, AD-17 six keys and Reading state, AD-7, AD-15, AD-1 scans, AD-16 `Binds:`, Structural Seed, Capability → Architecture Map, Scaffold deltas (`workbox-window` in `dependencies`; `allowJs` in `tsconfig.e2e.json`, D-48), AD-18 Size (the gate's failure on a `sw.ts` key reached by no dynamic import from the entry, and the build-output content check, D-49), AD-17 Projects; through `bmad-architecture`), EXPERIENCE.md's "New app version installed" row and A-E4 (through `bmad-ux`) and AGENTS.md (through `bmad-project-context`: the `main.ts` `requestPersistence()` exception, `navigator.storage` only in `src/shell/storage.ts`, the new shell modules) in line with the build, and SPEC F12 and `release-checklist.md` step 6 (the retrospective runs before the merge) in line with the epic Notes decision; closes this epic's `rule-coverage.md` rows and the epic 3 P7 rows for Q-40 and Q-42; syncs `build-notes.md` (lines at ff84c95: :22-23 CAP-6 unreachable-key gate, failure added, counting statement kept (7.8 plan Implementation Notes (11)); :55 hook gate `VITE_TEST_HOOKS === '1'`; :112-115 and SPEC F6: dist-smoke runs in Playwright's default worker mode, not `block`; :123-124, :151 and SPEC F8, per 7.3 Residual risks: no `?__WB_REVISION__` install fetch, no browser-level CDP route, observation through B's handle and a recorder in A's scope, the all-closed test needs exactly one waiting and one active worker at identification); records ticket 7.10's G9 (D-66) disposition in `device-checks.md` G9. Sources: 7.10 plan rows D-32, D-47, D-48, D-49; Entry-11 amendment D-43, D-50, D-61, D-62, D-63. The plan's sync checklist has one line per sync item (above and SPEC CAP-9) with its as-built source (file:line or test title) and applying commit; build-notes' "As built at 4130fb4" section is an exempt snapshot, bar :22-23.

**Phase 1 (agent, unattended).** The syncs, the rule-coverage closure, `npm run test:all` and `npm run test:screens`, all committed locally on `pwa-release` so each read's and re-read's build comes from a clean committed tree (the footer cannot show a dirty tree), and a handoff in the plan listing:

- every Device row of `device-checks.md` (tailnet preview) and Desktop row (desktop Chrome) with its `docs/device-testing.md` command (fixture, or a no-fixture run, the rest by play; e.g. `session-one-letter-left` for G17) and the epic Notes line to fill; Optional (owner) rows G18/G19 only if Jared reinstates them (default: not run);
- every `docs/device-testing.md` (unverified) step, for Jared to mark confirmed, differs (what he saw) or not exercised;
- the code-review leftovers for the epic retrospective (done plans are not edited): `review-loop/7-13-build.md` (7.13 plan Item 3's failing-path file list omits `src/ui/overlays.svelte.ts` and some engine/shell files), `review-loop/7-10-build.md` and `review-loop/7-14-build.md` (run digest).

Jared's 2026-11-04 authorisation of this run approves exactly these spine, EXPERIENCE.md and AGENTS.md syncs (recorded in the epic Notes); other skill-proposed edits are Owner stop items. A rule-coverage row with no passing test (bar a P7 row turned D) or a build contradicting the SPEC is not synced but a handoff fix ticket, landing before any row whose subject it touches is read. A failing run (here or final) records each failing title; a D-64 recurrence (`e2e/nav.spec.ts`, owner backlog) is noted there and the run repeated once; any other failure is a fix ticket, no rerun. Fix tickets route as at the Owner stop; the plan then stops `in-progress` with an owner-wait note, not `built`.

**Owner stop.** Jared reads each row and records pass, fail or a finding with its footer in the epic Notes, a readable row's finding as pass-with-note or fail, saying which. A failure becomes a fix ticket, a spec §9 question or an owner question where the row says so. An answer accepting the as-built behaviour makes the row pass; one needing a change, a fix ticket and re-read (a new §9 Q-id joins the §6.4 audit); one leaving it failing, an accepted gap for entry 12's Done when 1 waiver. The plan proposes each fix ticket (row, finding, rows whose subject it touches (re-checked against its landed diff before Phase 2), reproduction test or §6.6 gap); the orchestrator or owner adds it to tickets.toml ahead of entry 11 (so before entry 12) and to entry 11's `after`, as for entries 13 and 14. An unreadable row or sub-step is a finding with its reason: a procedure or tooling fault becomes a CAP-7 fix ticket (as G3 routes), otherwise an owner question; an "if reproducible" sub-step that does not reproduce (G7) is recorded as not reproduced, the rest judged on its own. The (unverified) marks route here too: a differs needing a script change is a CAP-7 fix ticket, the step keeping its tag until an F12 re-read using it confirms it. Fixed rows and rows whose subject a later fix touches are re-read (F12).

**Phase 2** (once every row is resolved and its fix tickets done). The (unverified) tags: confirmed drops the tag, differs gets its wording fix, not exercised keeps it; the matching (unverified) text in `device-checks.md` G2–G4, `release-checklist.md` step 4 and `build-notes.md` (:213, :216) changes the same way. Then the §6.4 and §6.6 audits (§6.6 lists a no-code fix ticket (7.13) as "no fix shipped" with its plan's reason, not a gap; 7.14 with its committed `e2e/helpers.spec.ts` case); audit-gap fix tickets (routed as above) land before the merge, the audit re-confirms only their deltas, and an F12 re-read they cause reopens the owner stop. A gap only Jared can accept (Acceptance Criteria) stops the plan `in-progress` (owner-wait note) until his acceptance is in the epic Notes. Then the final re-check and runs (Acceptance Criteria), and the plan goes `built`.

Unknown: which device rows fail on the phone (notably G3 activation timing and A-A11 back behaviour in G5/G6) and so how many fix tickets land before the merge.

Done checkpoint: only Jared marks the ticket done, after reading the plan's recorded reads and audits.

## Acceptance Criteria

Verify:

- Every Description and CAP-9 sync item has a checklist line with as-built source and commit.
- The plan maps every `rule-coverage.md` row except A-A11, brief §6.2 and §6.3 to its passing test(s) by full title and file (rule-coverage preamble), green at the final commit, or, for a P7 row turned D under SPEC Assumptions, the §6.4 gap Jared accepted in the epic Notes; A-A11 and §6.2 cite their recorded reads (G5/G6, G4); §6.3 is left to entry 12.
- The epic 3 `rule-coverage.md` Q-40 and Q-42 rows name their passing CAP-5 tests by title (F15).
- Every Device and Desktop row records in the epic Notes a pass (any finding noted) with the footer it was read on (for G3, `A`/`B` with the commit each was built from), or is resolved: its fix ticket done and the row re-read as pass on a footer carrying the fix, or Jared's §9 or owner answer recorded in the epic Notes, the row then a pass under it or an accepted gap for entry 12; every row whose subject a later fix (device-read or audit-gap) touches is re-read (F12); no §9 or owner question raised by the read is left open (§6.9).
- The §6.4 and §6.6 audits are recorded in the plan, every gap a fix ticket landed before the merge or, only where `release-checklist.md` allows it (§6.4 P7 row turned D; §6.6 fix with no reproduction test), one Jared accepted in the epic Notes before `built`.
- Jared's answers or explicit deferrals to the three SPEC Open Questions are recorded in the epic Notes (§6.9).
- `SESSION_VERSION`, `HISTORY_VERSION` and the Session and history shapes are unchanged against `4130fb4` (the branch cut, epic Notes).
- At the final tree (Phase 2's last commit, after any fix ticket), the sync checklist and rule-coverage map are re-checked and `npm run test:all` and `npm run test:screens` are green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- spec — SPEC.md CAP-9, F4–F16, Open Questions; device-checks.md; release-checklist.md (§6.4, §6.6, §6.9 audits); rule-coverage.md; build-notes.md; _bmad-output/specs/spec-epic-3-app-shell/rule-coverage.md (P7 rows for Q-40 and Q-42)
- architecture — ARCHITECTURE-SPINE.md (the sections listed in the Description)
- ux — EXPERIENCE.md ("New app version installed" row, A-E4)
- source — story-refactor-sweep-plan.md (D-table, Entry-11 amendment); story-two-build-update-proof-plan.md (Residual risks); run digest _bmad-output/implementation-artifacts/autopilot/epic-pwa-release-20261030-1141.md
- constraint — docs/device-testing.md; AGENTS.md (managed block edits go through bmad-project-context); docs/development-methodology.md, Definition of done

## Notes

- Unknown and done checkpoint: in the Description (tickets.toml entry 11).
