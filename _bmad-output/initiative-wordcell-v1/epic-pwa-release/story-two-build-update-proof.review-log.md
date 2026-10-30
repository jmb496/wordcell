# Review loop — ticket 7.3 (Two-build update proof)

State: pass 1: done

Target: `_bmad-output/initiative-wordcell-v1/epic-pwa-release/story-two-build-update-proof.md` (docs mode, thorough, max 7)
Pre-loop: HEAD 4e0f0bc; pass 0 copy `story-two-build-update-proof.review-log.passes/pass0.md`, 359 words (growth budget ~900).
Intent also includes tickets.toml entry 3 fields not copied into the ticket: interface, tests, owns, consumers, unknown, plan_checkpoint = true (fixer adds them to the Description in pass 1).
Refs: SPEC.md and companions (build-notes, rule-coverage, device-checks, release-checklist, SPEC.review-log) of `_bmad-output/specs/spec-epic-7-pwa-release/`, epic-pwa-release.md, ARCHITECTURE-SPINE.md, AGENTS.md, EXPERIENCE.md, ticket 7.1 and 7.2 plans and 7.2's code review log `_bmad-output/implementation-artifacts/review-loop/7-2-build.md`.

## Pass 1 — 2026-10-30
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 8, minor 11, decision-needed 0  |  Dropped in triage: 0 (duplicates merged across lenses)
Words (docs): 840 (2.34x pass 0)  |  Snapshot: story-two-build-update-proof.review-log.passes/pass1.md (fix diff pass1.fix.diff)
Fixer: all 17 items applied, no conflicts; checked against Playwright 1.63.0 typings: `context.serviceWorkers()`, `browser.newBrowserCDPSession()`, CDP `ServiceWorker.workerVersionUpdated`; unverified (browser behaviour, marked in the ticket): worker evaluate with no page open, CDP events with no page, `Sec-Fetch-Mode` to the local server, activation timing.
### Applied
- [major] AC, D-gap clause — no owner gate (SPEC Assumptions: Jared accepts explicitly in the epic Notes) and the spec's content in that case unspecified → fixer item 1
- [major] Description, static server — interface has no request log or origin; entry 7 must assert the server's `/sw.js` 404 (CAP-5, build-notes Q-40) → fixer item 2
- [major] Description/tests — the no-prompt check (and swap/remove/`/`) has no self-test in `e2e/helpers.spec.ts` (AGENTS.md Files); a vacuous check would pass here and in entry 6 → fixer item 3
- [major] AC, helper cases — `e2e/helpers.spec.ts` runs under the dev config where `buildRoot()` throws; source dir for the cases unstated → fixer item 4
- [major] Description, final step — how B's activation is observed with every page closed unspecified (build-notes "e.g. …, unverified"; SPEC "(polled)"); an observation failure could be misread as D → fixer item 5
- [major] Description, reload step — `waiting` read once races the async update check; no evidence B's `sw.js` was served; no-prompt check not ordered after the state → fixer item 6
- [major] Description, B write — order/atomicity of B's two files unspecified (a `sw.js` seen before B's `index.html` precaches marker A) → fixer item 7
- [major] Description/Notes, `Sec-Fetch-Mode` — unverified with no outcome if Chromium omits it → fixer item 8
- [minor] multi-page step — SPEC's "markers only" (Q-38 may show, AD-9) dropped → fixer item 9
- [minor] static server — F8's "query string ignored" dropped with the rationale; F8/build-notes wording needs CAP-9 sync → fixer item 10
- [minor] tests field — AD-16 no-prompt row's P7 update part not listed → fixer item 11
- [minor] update spec — worker mode (`allow`, F6) unstated → fixer item 12
- [minor] static server — port/host/MIME/per-request disk read/teardown unstated → fixer item 13 (with item 2)
- [minor] B rewrite — no fail-fast when the revision or marker substitution matches nothing → fixer item 14
- [minor] "the review log" ambiguous → SPEC.review-log.md → fixer item 15
- [minor] multi-page step — a page halted by a late failure still passes a markers-only check → fixer item 16
- [minor] tickets.toml entry 3 interface/tests/owns/consumers/unknown/plan_checkpoint not copied → fixer item 17
### Default applied (technical)
- D gap → spec keeps the A-side steps passing; only the all-closed step can fail on timing; build stops for Jared's §6.4 acceptance in the epic Notes before `built`; no skip/fixme; rule-coverage kind unchanged until accepted
- static server → `serve()` on 127.0.0.1 port 0 returns `{ url, requests(), stop() }`; log of path, `Sec-Fetch-Mode`, status; MIME by extension; reads disk per request; `stop()` removes the copy
- helper cases → synthetic temp dir, never `buildRoot()`, pass under `npm run test:e2e`
- activation poll → newest of `context.serviceWorkers()` `self.serviceWorker.state`; else a CDP `ServiceWorker` session; an observation limit is a test fix, never D
- reload → `expect.poll` `swState()` to `waiting`, server log shows B's `sw.js` served, then no-prompt check; a missing update check may use `registration.update()` from the test (plan records it), never D
- B write → `index.html` first, `sw.js` last, each via temp file + `rename`
- `Sec-Fetch-Mode` → real `page.goto` case; if absent, record and stop (rule 7), no other heuristic
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
