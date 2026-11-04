---
id: 11
type: story
title: "Close-out: documents, audits and device read"
parent: epic-pwa-release
covers: [CAP-9]
after: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 14]
hitl: true
risk: low
---

# Close-out: documents, audits and device read

## Description

Brings the spine (AD-16 boot tail and update policy, AD-17 six keys and Reading state, AD-7, AD-15, AD-1 scans, AD-16 `Binds:`, Structural Seed, Capability → Architecture Map, Scaffold deltas, AD-18 Size, AD-17 Projects; through `bmad-architecture`), EXPERIENCE.md's "New app version installed" row and A-E4 (through `bmad-ux`), AGENTS.md (through `bmad-project-context`: the `main.ts` `requestPersistence()` exception, `navigator.storage` only in `src/shell/storage.ts`, the new shell modules) and SPEC F12 and `release-checklist.md` step 6 (the retrospective runs before the merge) in line with the build; closes this epic's `rule-coverage.md` rows and the epic 3 P7 rows for Q-40 and Q-42; hands Jared the build for every Device row of `device-checks.md` on the tailnet preview and every Desktop row in desktop Chrome (`docs/device-testing.md`), each failure becoming a fix ticket (new entry before entry 12, with its reproduction test or an accepted §6.6 gap), a spec §9 question or an owner question where the row says so; then runs the §6.4 and §6.6 audits last, after every row is recorded and its fix tickets are done. Also syncs `build-notes.md` (:22-23 CAP-6 unreachable-key gate; :55 hook gate `VITE_TEST_HOOKS === '1'`; :112-115 and SPEC F6: dist-smoke runs in Playwright's default worker mode, not `block`; :123-124, :151 and SPEC F8: no `?__WB_REVISION__` install fetch or CDP route, observation through B's handle and a recorder in A's scope), records ticket 7.10's G9 disposition in `device-checks.md` G9, and updates `docs/device-testing.md`'s (unverified) tags from the device read (ticket 7.10 plan, Entry-11 amendment: D-43, D-50, D-61, D-62, D-63, D-66).

## Acceptance Criteria

Verify: No document contradicts the build; every row of `rule-coverage.md` names a passing test or a D gap Jared accepted in the epic Notes; Jared's read of every Device and Desktop row is recorded in the epic Notes with the footer it was read on; the §6.4 and §6.6 audits are recorded in the plan with every gap a landed fix ticket or one Jared accepted; Jared's answers or explicit deferrals to the three SPEC Open Questions are recorded in the epic Notes (§6.9); `SESSION_VERSION`, `HISTORY_VERSION` and the Session and history shapes are unchanged; `npm run test:all` and `npm run test:screens` are green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- spec — SPEC.md CAP-9, F10, F12, F14, F15, F16, Open Questions; device-checks.md; release-checklist.md (§6.4, §6.6, §6.9 audits); rule-coverage.md; _bmad-output/specs/spec-epic-3-app-shell/rule-coverage.md (P7 rows for Q-40 and Q-42)
- constraint — docs/device-testing.md; AGENTS.md (managed block edits go through bmad-project-context); docs/development-methodology.md, Definition of done

## Notes

- Open question: Which device rows fail on the phone (notably G3 activation timing and A-A11 back behaviour in G5/G6) and so how many fix tickets land before the merge.
