# Review loop — ticket 7.3 (Two-build update proof)

State: pass 2: done

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

## Pass 2 — 2026-10-30
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 7, minor 11, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 932 (2.60x pass 0, over the ~900 budget: from here additions are minors unless a major)  |  Snapshot: story-two-build-update-proof.review-log.passes/pass2.md (fix diff pass2.fix.diff)
Fixer: all 12 items applied; Playwright 1.63.0 typings declare `serviceWorkers(): Array<Worker>`; unverified (marked): `self.serviceWorker` in a worker with no page, the `waiting === serviceWorker` identity, the CDP fallback, activation timing.
### Applied
- [major] AC — "A-side steps always pass; only the all-closed step can fail" narrows SPEC Assumptions: B activating early (reload, one of two pages open) with every open page controlled has no route (G3: an owner question about AD-16/A-A15) → fixer item 1
- [major] AC/Verify — after Jared accepts a D gap the spec's shape and the row are unspecified; "passes the update spec" contradicts a red all-closed step → fixer item 2
- [major] step 2 — no reload while B is already waiting, so A-A15 "a reload does not activate a waiting worker" (rule-coverage Q-40 row) is untested → fixer item 3
- [major] step 3 — `swState()` `waiting` read at an unstated time; a page halted by the expected Q-38 before registering stays `unregistered` (main.ts `halted()` return) → fixer item 4
- [major] step 4 — "newest of `context.serviceWorkers()`" may pick A's restarted worker (same `/sw.js`), passing the poll early → fixer item 5
- [major] step 4/AC — a poll timeout cannot tell "Chromium never activated" (D) from an observation fault (test fix); no allowed fix when neither route observes → fixer item 6
- [major] helper cases — no-prompt check's failing cases miss `alert` and can be met by one `dialog` case (New game confirm is `dialog`) → fixer item 7
- [minor] step 2 — "B's `sw.js` served" not checkable from a path/status log → "a `/sw.js` 200 logged after the B write" → fixer item 8
- [minor] helper cases — `remove` → 404 needs a non-navigation request → fold into the in-page `fetch` case → fixer item 9
- [minor] step 1 — marker B write (replace A's) has no exactly-once check; two `wc-build` metas possible → fixer item 10
- [minor] step 1 — "every open page controlled" needs a reload (no `clientsClaim`) → fixer item 11
- [minor] step 1 — `swap` (the helper) should own the temp-file + `rename` write → fixer item 12
- [minor] step 4 — poll timeout unstated → folded into fixer item 6
### Default applied (technical)
- D route → B activating while every open page is controlled at any step, or still waiting after every page closed, is Chromium's timing differing: record and stop for Jared
- D shape → two tests now (A-side; all-closed), both named `Q-40 AD-16 A-A15 …`; on acceptance only the failing test is removed (comment citing the epic Notes) and the row's kind follows
- step 2 → a second reload with B waiting: marker A, `waiting`
- step 3 → each page polls `swState()` to `waiting` right after it opens, before any close; after a close, markers only
- step 4 → identify B's handle while a page is open (`self.registration.waiting === self.serviceWorker`), poll that handle (or CDP version) with a generous timeout stated in the plan; on timeout open one page: marker A → timing (stop), marker B → observation fault (test fix); no route observes → record and stop (rule 7); no fixed sleeps
- no-prompt cases → one failing case per role
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (unapplied over-budget plan-level minors listed below)
### Unapplied minors (for the build plan)
- static server MIME map for every build extension, unknown → `application/octet-stream`
- `stop()` calls `server.closeAllConnections()` before `close()`
- no-prompt check is a snapshot count after the state poll settles (comment in the helper)
- step 3: which page closes (default: the original) and assertions after each open/close
- update spec `test.setTimeout` sized from a measured run
