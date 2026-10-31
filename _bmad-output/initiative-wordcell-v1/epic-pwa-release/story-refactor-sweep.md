---
id: 10
type: story
title: "Refactor sweep"
parent: epic-pwa-release
covers: [CAP-8]
after: [1, 2, 3, 4, 5, 6, 7, 8, 9]
risk: low
hitl: false
done_checkpoint: true
---

# Refactor sweep

## Description

Closing cleanup of epic 7 before the owner's device read (CAP-8; the sweep runs before entry 11, epic Notes 2026-10-29): one table row per deferred finding of entries 1–9, each with a disposition; the 4.6 "main.ts controller-registration order has no test" item (`device-checks.md` G9) fixed by a test or declined with a reason; the unit suite's warm median, a watch re-run on a Linux-filesystem checkout and the AD-18 margin re-measured; the sweep itself changes only comments, tests, test helpers and tooling (item 3). Done checkpoint (tickets.toml entry 10): the build stops at `built`; Jared settles the owner-call rows and proposed fix tickets, then marks it done.

## Scope

1. Deferred-findings table, in this ticket's plan, one row per finding (duplicates merged into one row citing every source). Columns: source file:line (every source), finding, live at HEAD (yes/no, file:line or test-name evidence), disposition. Sources: the 7.1–7.9 plans (`deferred` frontmatter, Residual risks, Review Triage Log rows deferred or rejected as refactor or low); the `## Result` unapplied minors and open majors of `_bmad-output/implementation-artifacts/review-loop/7-1-build.md` … `7-9-build.md` (7-4-build.md's Result points at its Pass 1 minors); ticket `*.review-log.md` Results only where the matching plan left them open; every Worth knowing and Close-out docs line of the digest for 7.1–7.9. The plan names its grep and counts per source; a source with nothing live gets a "none" row naming the search. A "closed by <commit>" cite must cover every clause of the finding at HEAD; a cite that does not hold makes the row live.
2. Dispositions: fixed here (item 3's boundary, item 5's pass); closed by <commit>; declined, with the reason; fix ticket (technical default for a finding that needs a `src/` change); owner call (functionality or UX only); handed to entry 11, for a close-out document sync (e.g. 7.8 plan `deferred` :23, "Entry 10's sweep logs this row as handed to entry 11"; digest: build-notes `VITE_TEST_HOOKS === '1'`, F8 static-server wording, F6 `block` wording, the AGENTS.md storage exception, AD-18 Size and `allowJs`), citing the tickets.toml entry 11 or SPEC CAP-9 clause that covers it; rows no clause names (e.g. build-notes.md, SPEC F6 and F8 text) go in one plan group, listed for entry 11 to add. Fix tickets: the build never edits tickets.toml or the epic file; a fix-ticket row proposes the entry (title, finding, `src/` files, reproduction test) for the owner or orchestrator to add before entry 11 starts, which then waits on it (CAP-8 settles findings before the device read). Pre-assigned, already closed (check the cite): the 7.1 F17 `&& !halted()` code-review minor (7-1-build.md Result minor 1), closed by 7.2 e340aee (src/main.ts:276; pin `AD-16 src/main.ts reports the F17 chunk failure on the hook gate alone, halted or not`, src/architecture-tree-scan.test.ts:54); the 7.1 boot-order deferral (7.1 plan :22), closed by 7.5 1259a50 (e2e/pwa/boot-order.spec.ts:42); the 7.5 F17-to-persistence runtime gap (7.5 plan :21, :183), closed by 7.7 bdf477e (e2e/pwa/dist-smoke.spec.ts:494, e2e/pwa/sw-failure.spec.ts:112). Declined: the 7.2 residual "external unregister or site-data clear while installing reported as Q-40" (7.2 plan :121, :126, :187), SPEC CAP-1's literal rule.
3. Edit boundary. Editable: `*.test.ts` and `*.test.mjs`, the `src/architecture-*` scans, `e2e/**` specs and helpers (a new or changed helper gets an `e2e/helpers.spec.ts` case, AGENTS.md Files), `scripts/device-preview.mjs` and `docs/device-testing.md` (CAP-7 tooling: their 7-9-build.md minors land here, before entry 11's device read), comments anywhere, and this ticket's plan. Not editable, each an owner-call or fix-ticket row: any non-comment change to a non-test file under `src/` (the "`src/` change" a fix ticket covers), `vite.config.ts`, `package.json` and the lockfile, size-budget limits, Playwright timeout, retry or worker settings, and loosening any gate or assertion. The sweep edits no spec, spec companion (`rule-coverage.md`, `device-checks.md`, `build-notes.md`, `release-checklist.md`), spine, EXPERIENCE.md, DESIGN.md or AGENTS.md. Done tickets' plans, logs and ticket files are not edited: their errata are one declined row group.
4. G9. The contract is the `main.ts` bullet of `_bmad-output/initiative-wordcell-v1/epic-board-and-gestures/story-pointer-controller-core-and-cancel-wiring.md:24` (its plan's `deferred`, :38), re-read against `src/main.ts` at HEAD (:170–256). The existing pin `AD-14 src/main.ts starts the tracker before the controller and registers the hide-clear after controller.cancel and gate.scrollReset` (src/architecture-tree-scan.test.ts:38, ticket 5.13 a6bb2c2) already fails when `registerBeforeHide(() => controller.cancel())` is dropped or swapped with `gate.scrollReset`'s registration; the bullet's other clauses (`createController` right after `createGate`, before `registerLifecycle()`; `nav.registerBeforeBack` calling `cancel({ byBack: true })`; `setController` once, before `mount`) get a test-only source-order pin beside the F17 pin (:54), named with its AD id, that fails when a pinned registration is dropped or two are swapped. A decline must cite an existing test that fails on that drop or swap.
5. "Fixed here" pass: each new or tightened test passes at HEAD and fails on the mutation its finding names (or one the plan names), recorded in the plan; each new or changed e2e test, or one calling a changed helper, passes `--repeat-each=5` on its project. A row that cannot meet this is declined with the evidence or becomes a fix-ticket row.
6. Flakes (7.9 plan :108, Residual risks :205). `e2e/nav.spec.ts:163`: declined per SPEC Non-goals (follows epic 11 retrospective A7, outside this epic). `e2e/success-signal.spec.ts:440`: record failures out of three `npx playwright test --project=android` runs at the sweep commit; a test-only fix if a cause is found (re-run to 0/3), otherwise a fix-ticket or owner-call row with the counts; timeout, retry or worker-count changes are owner calls.
7. Budgets (AD-17 Speed, AD-18), on a fresh Linux-filesystem clone of the sweep's last commit: the `npm test` median of three runs after a discarded warm-up (under 5 s), a watch re-run of the slowest engine test file (under 1 s), and the AD-18 margin as 600,000 minus the `npm run build` total; all recorded with the commit in the plan. Over budget: profile per AD-17, then stop and report.

## Acceptance Criteria

Verify: Every deferred finding has its row with a disposition, G9 is resolved, the warm median under 5 s, the watch re-run under 1 s and the AD-18 margin are recorded with the commit, and `npm run test:all` and `npm run test:screens` are green.

- `npm run test:screens` runs only inside the Playwright container (AGENTS.md; no Docker: stop and report); afterwards `git status --porcelain` shows nothing under `e2e/*-snapshots`.
- Invariants: against 4130fb4 (branch cut, epic Notes) `git diff --exit-code 4130fb4 -- fixtures/ src/engine/deal.test.ts` and `git diff --exit-code -G'_VERSION =' 4130fb4 -- src/engine/session.ts src/engine/history.ts` (`SESSION_VERSION`, `HISTORY_VERSION`) are empty; `package.json` and `package-lock.json` changed after 4130fb4 (7.1, `workbox-window`, F2), so `git diff --exit-code <build start commit> -- package.json package-lock.json` is empty instead.
- Owner checkpoint per Description (docs/development-methodology.md, Definition of done).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- spec — SPEC.md CAP-8, CAP-9, Non-goals; device-checks.md G9
- architecture — ARCHITECTURE-SPINE.md AD-17 Speed, AD-18
- contract — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/story-pointer-controller-core-and-cancel-wiring.md:24 and its plan (G9)
- constraint — docs/development-methodology.md, Definition of done; AGENTS.md Running and verifying (unit budget, Linux-filesystem checkout)
- evidence — _bmad-output/implementation-artifacts/autopilot/epic-pwa-release-20261030-1141.md (digest)
- evidence — _bmad-output/implementation-artifacts/review-loop/7-*-build.md
- evidence — _bmad-output/initiative-wordcell-v1/epic-pwa-release/*-plan.md and *.review-log.md
