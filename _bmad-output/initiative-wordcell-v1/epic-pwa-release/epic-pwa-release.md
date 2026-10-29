---
type: epic
title: "PWA and release"
parent: initiative-wordcell-v1
covers: []
after: [epic-place-preview]
assignee: ""
risk: high
---

# PWA and release

## Description

Every Proposed epic except spine row 7 is built, merged and deployed, yet the live app registers no service worker: it does not install as an offline app, its storage is not protected, and brief §6.8's offline criterion is unproven. Earlier epics deferred their real-phone checks here. This epic registers the generated worker under the decided update policy (AD-16, Q-40: no prompt, no skip-waiting, a broken worker never shown to the player), adds the `swState()` and `precacheComplete()` test hooks (AD-17) and the persistent-storage request (AD-7), proves offline play, the update rule and the failure paths in Playwright, adapts the device-read tooling to a registered worker, sweeps, then has Jared run every deferred device check on his Android phone and, after the merge, install from production and declare v1 released. The epic spec is the requirement source; the spine, spec Q-40 and Q-42 and brief §6 are the rule text.

## Outcome

WordCell installs on Jared's Android phone from the production URL, launches and plays in airplane mode, takes a new version only after every window has closed, and v1 is declared released with every brief §6 criterion carrying its evidence in `release-checklist.md`; the signal is the SPEC Success signal: `npm run test:all` and `npm run test:screens` green with the offline, update, Q-40 and Q-42 tests passing, and Jared's device and production reads recorded.

## Requirements

The numbered source is the epic spec, `_bmad-output/specs/spec-epic-7-pwa-release/SPEC.md`; entries cite its capability ids. Rule-to-test map: `rule-coverage.md`; deferred device checks: `device-checks.md`; release evidence: `release-checklist.md`; the how and the technical defaults: `build-notes.md` and SPEC Decisions F1–F17.

- CAP-1: service-worker registration and state (AD-16, AD-15, Q-40, A-A15).
- CAP-2: test hook `swState()` and `precacheComplete()` (AD-17).
- CAP-3: persistent-storage request (AD-7, A-A3).
- CAP-4: offline and update proofs (brief §6.8, AD-16, AD-17, A-A15, A-E4).
- CAP-5: failure and controlled-branch proofs (Q-40, Q-42).
- CAP-6: packaging and size budget with a real worker module (AD-16, AD-18).
- CAP-7: device-read tooling for a registered worker (`docs/device-testing.md`, `scripts/device-preview.mjs`).
- CAP-8: refactor sweep.
- CAP-9: close-out documents and device read (hitl).
- CAP-10: v1 release (hitl; after the owner's merge).

## Done when

1. On `dist-test/` and `dist/`, after a move and a complete precache, a reload with the network off restores the game with no prompt, deals and validates a word (brief §6.8, CAP-4); every row of this epic's `rule-coverage.md` has a passing test (or a D gap Jared accepted in Notes) and the epic 3 P7 rows for Q-40 and Q-42 are closed.
2. A waiting build B never activates on a reload or while any page stays open and takes over only once every page has closed, with no prompt at any point; a missing worker script, a precache 404 and a rejected `sw.ts` chunk leave the hook-free build playable with nothing shown and reach the AD-15 surface in the test build (CAP-1, CAP-4, CAP-5).
3. `npm run test:all` and `npm run test:screens` are green, `workbox-window` and `sw.ts` stay out of the counted set at or under 600,000 bytes with the margin recorded, and no Session or score-history shape or version changed.
4. The spine, EXPERIENCE.md and AGENTS.md match the build, and Jared has run every Device and Desktop row of `device-checks.md` on the tailnet preview and in desktop Chrome, each recorded in Notes with the footer it was read on, its failures fixed or answered (CAP-9).
5. After the owner's merge, CI deploys to production, Jared installs from the production URL, the 1.0.0 release commit arrives only after every window closed, ten consecutive qualifying games are played on 1.0.0, every row of `release-checklist.md` carries its evidence, and Jared declares v1 released (CAP-10).

## Boundaries

`src/shell/sw.ts` and a worker-state shell module, `src/main.ts`'s boot tail, `requestPersistence()` in `src/shell/storage.ts`, the AD-17 hook, the architecture scans, `scripts/size-budget.mjs`, `scripts/device-preview.mjs`, `e2e/pwa/` specs and helpers (including a static-server helper), `docs/device-testing.md`, the close-out document edits and the release. Not the generated `sw.js` policy (still skip-waiting only on a message, no `clientsClaim`), the deal, the Session or history shape, rules, scoring, layout or look, any engine change, an update prompt or "new version" notice, an offline indicator, a custom install prompt, runtime caching, Play Store or TWA, a custom domain or a second environment (SPEC Non-goals).

## References

- spec — _bmad-output/specs/spec-epic-7-pwa-release/SPEC.md, CAP-1…CAP-10, Constraints, Open Questions, Decisions F1…F17; rule-coverage.md; device-checks.md; release-checklist.md; build-notes.md; SPEC.review-log.md (Result: unapplied minors for the build plans)
- rules — docs/game-flow-spec.md, §9 Q-38, Q-40, Q-42
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-1, AD-7, AD-8, AD-9, AD-15, AD-16, AD-17, AD-18, Scaffold deltas, Proposed epics row 7
- brief — _bmad-output/planning-artifacts/briefs/brief-wordcell-2026-09-26/brief.md, §6 Success criteria, §7 Scope, §8
- ux — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, State Patterns ("New app version installed"), Assumptions A-E4; DESIGN.md A-D5
- code — src/main.ts, src/shell/test-hook.ts, src/shell/storage.ts, src/shell/dictionary.svelte.ts, src/architecture-scan.ts, vite.config.ts, scripts/size-budget.mjs, scripts/device-preview.mjs, e2e/globals.d.ts, e2e/pwa/, e2e/helpers/precache.ts, playwright.pwa.config.ts
- constraint — AGENTS.md, Architecture rules 1–7, Policy; docs/development-methodology.md, Definition of done; docs/device-testing.md

## Notes

- Decision (2026-10-29): branch `pwa-release` is cut from `main` at `4130fb4` (epic 11 merged and deployed); the hardened spec is committed on it (`4e648af`) before entry 1 starts.
- Decision (2026-10-29): epic 7 takes `after` epic 11 (`epic-place-preview`, done; initiative Notes 2026-10-25) so the release device checks see the Place preview; entry 1 carries the epic gate.
- Decision (2026-10-29): tracer bullet is entry 1: the production build registers the generated worker after the dictionary settles and `swState()` reaches `active` in the `pwa` project, through `main.ts`, the dynamic `sw.ts` chunk, the state module and the hook. After it, the failure split (entry 2), then the slice least certain, the two-build update proof (entry 3), which owns F8's static-server helper and the no-prompt check that entries 6 and 7 reuse.
- Decision (2026-10-29): CAP-1 is split in two (entry 1 registration, state and boot tail; entry 2 failure split and no-skip-waiting guards); CAP-2 is split (entry 1 `swState()`, entry 4 `precacheComplete()`, the sixth key); CAP-4 is split (entry 1 the F6 audit, entry 3 update, entry 5 the first-launch order test, entry 6 offline). Entry 1 also narrows `build-output.spec.ts` "registers no service worker automatically" (CAP-6's first clause), owns the `sw.ts` chunk helper entries 5, 7 and 8 reuse, and runs the F6 audit, because these break as soon as a worker registers; entry 2 re-runs the audit for specs its hook-build halt breaks; entry 8 owns the rest of CAP-6. Entry 5 owns CAP-3's call-recording init script (hook-free on `dist/`) and the boot-order P7 tests, including CAP-1's F4 halt cases, which entry 7 reuses.
- Decision (2026-10-29): one lane through `src/main.ts`, `src/shell/sw.ts`, the state module, `src/shell/test-hook.ts`, `e2e/pwa/dist-smoke.spec.ts` and `e2e/pwa/build-output.spec.ts`; entries 2 and 4 can run beside each other after entry 1 (no shared file), and entry 9 (device tooling: `scripts/device-preview.mjs`, `docs/device-testing.md`) beside anything after entry 1.
- Decision (2026-10-29, user direction): the refactor sweep (entry 10, CAP-8) runs before the close-out and device read (entry 11, CAP-9), unlike epics 10 and 11, so the sweep's findings are settled and the budgets re-measured before Jared's device read.
- Decision (2026-10-29, user direction): order of release work: entry 11 (close-out documents, audits and the tailnet/desktop device read) → the epic retrospective → the owner merges `pwa-release` into `main` and pushes → entry 12 (CAP-10, the owner's post-merge release step on production). Agents never merge or push (rule 7); entry 12's release commit and any post-merge fix are committed locally after the agent fast-forwards `pwa-release` to `main` (F11), and Jared merges and pushes each.
- Source conflict: SPEC F12 and `release-checklist.md` Production sequence step 6 — "the retrospective follows CAP-10" vs the user's direction (2026-10-29) that the retrospective runs after CAP-9's ticket and before the merge. Settled by the Decision above; entry 11 syncs SPEC F12 and `release-checklist.md` step 6 to it.
- Decision (2026-10-29): no ticket implements a "new version" prompt or notice; AD-16 and Q-40 stand unless Jared answers the open question below otherwise.
- Decision (2026-10-29): Jared's answers or explicit deferrals to the three open questions below are recorded in these Notes (brief §6.9, `release-checklist.md`); the Firefox answer is wanted before entry 5 starts (an "installed app only" answer changes `requestPersistence()`), the ten-game answer before entry 12 (otherwise its proposed default applies), and entry 11 checks all three are recorded.
- Open (owner question, SPEC Open Questions): New-version prompt — keep AD-16's silent update with no prompt, or add a visible "new version" prompt that applies on a tap (reopens AD-16, adds UX)? Proposed default: keep AD-16, no prompt; entries 11 and 12 check the silent behaviour instead.
- Open (owner question, SPEC Open Questions): Ten-game run across a fix — does the brief §6.3 run restart when a fix ships mid-run? Proposed default: it restarts only when the deploy changes drop targeting or drag rendering (`src/ui/gestures/`, `src/ui/layout/`, the tray, card hit-rect CSS); other fixes keep the count.
- Open (owner question, SPEC Open Questions): Firefox persistent-storage prompt — keep AD-7's once-per-launch request in every browser (desktop Firefox may show its own permission prompt) or request only in the installed app (changes A-A3)? Proposed default: keep AD-7 as is.
- Assumption (2026-10-29): Playwright's Chromium activates a waiting worker once every page of the context has closed (SPEC Assumptions); if its own activation timing differs, entry 3's plan says so and the update row becomes a D gap Jared accepts (G3), never an exemption.
- Assumption (2026-10-29): fix tickets that the device read (entry 11) or the audits turn up are added as new entries before entry 12 and land before the merge; post-merge fixes during entry 12 follow F11 and F12.
- Risk (high): a registered worker keeps serving cached code on installed clients and cannot be reverted by a commit; the check outside each ticket's own criteria is Jared's device read on the tailnet preview (entry 11) and his production install and update read (entry 12).
- Waits on epic 11 because: it builds on the merged baseline (Place preview, fly-to-cell hold, scenes, baselines) that the release device checks read.
