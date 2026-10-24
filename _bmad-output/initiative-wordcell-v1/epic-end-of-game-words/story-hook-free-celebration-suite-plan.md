---
title: 'Hook-free celebration suite'
type: 'feature'
ticket: '8'
created: '2026-10-24'
status: 'built'
route: 'oneshot'
route_source: 'auto'
review: 'quick'
review_source: 'auto'
lenses_ran: [quick]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-hook-free-celebration-suite.md'
warnings: []
baseline_revision: '131df48184cd163deaa5542244639d7c68494f75'
deferred:
  - summary: >-
      Entry 9: sync AD-17 Celebration seam ("every dist-smoke spec that wins a game ends the run by a press outside the bars"), SPEC CAP-6 and F12 to "ends the run early by a skip (a press outside the bars or back)", as rule-coverage.md's R-87 hook-free row and this entry's test (b) read it.
    evidence: |-
      Ticket 10.8 Notes (spine reading); the R-87 hook-free row names press and back; test (b) skips by back in dist-smoke.
    location: >-
      ARCHITECTURE-SPINE.md AD-17 Celebration seam; epic-end-of-game-words SPEC.md CAP-6, F12
    severity: low
  - summary: >-
      Entry 9: AD-19 says the run "writes transform directly to the groups"; the build writes opacity to each [data-celebration-group] and transform to each shown [data-celebration] copy (SPEC F21/F26), which the start proof here reads.
    evidence: |-
      src/ui/celebration/celebration.svelte.ts render(): face.style.transform per shown copy, el.style.opacity per group.
    location: >-
      ARCHITECTURE-SPINE.md AD-19
    severity: low
---

<intent-contract>

## Intent

**Problem:** No test shows that a real win in the hook-free production build (`dist/`, real rAF) starts the celebration and that it can be skipped there (10.5 deferral; win-trigger plan Deferred 1: moving `setCelebrationEnabled(false)` out of the main.ts hook gate would ship R-87 disabled with `test:all` green); rule-coverage.md's R-87 hook-free row (plays, a press skips, back skips) has no test.

**Approach:** Exactly as the ticket (story file; read it fully) states: two tests in `e2e/pwa/dist-smoke.spec.ts`, (a) "R-87 hook-free build: a real win plays and a press skips it to the expanded end sheet" and (b) "R-87 hook-free build: a real win plays and back skips it to the expanded end sheet, the app still open", sharing one local setup + start-proof function, DOM-only helpers, no `window.__wordcell`; plus the negative control. The review log's open items are resolved as in Implementation Notes → Review-log resolutions.

</intent-contract>

## Implementation Notes

Route oneshot: one spec file, about 80 added lines, no product code; reuses `openFixture`, `skipByPress`, `watchAdded`, `animationFrames` (e2e/helpers/board.ts, celebration.ts, lifecycle.ts).

Shape (in `e2e/pwa/dist-smoke.spec.ts`, after the R-87 relaunch test):
- `errorsOf(page)` local: the `pageerror`/console-error listeners of the AD-18 load test, returning the array (the AD-18 test may reuse it).
- `winIntoRealRun(page)`: `page.emulateMedia({ reducedMotion: 'no-preference' })`; `openFixture(page, 'session-won-words', { booted: false, steps: ['undo'] })`; `await expect(page.getByTestId('primary-action')).toHaveText('Confirm')`; `const added = await watchAdded(page, '[data-celebration-root]')`; click Confirm; start proof: `expect.poll(groups count) > 0`; `expect(await added()).toBe(true)` (the 10.5 deferral's literal assertion: a root added after a real winning Confirm); the exact "Every column cleared." dialog count 0; one `expect.poll` callback: read the first shown copy (first `[data-celebration]` with `style.visibility !== 'hidden'` and a non-empty `style.transform`; its index and transform), `animationFrames(page, 2)` (a run's first frame has dt 0), read that index's transform again, return `a !== '' && a !== b`, `.toBe(true)`; then `await expect(page.locator('[data-celebration-root]')).toHaveCount(1)` right before the skip.
- (a) `skipByPress(page)` (touch tap: Pixel 7 has `hasTouch`; the mouse branch stays covered by the dev-server helper self-test, e2e/helpers.spec.ts "AD-17 skipByPress ends a run by a band press, by touch and by mouse"); then the exact-name won dialog visible, root count 0, its `getByRole('button', { name: 'Replay this deal', exact: true })` `toBeFocused()`.
- (b) `page.goBack()`; the exact-name won dialog visible `{ timeout: 1000 }`; root count 0; `page.url()` not `about:blank` and the WordCell heading visible; Replay focused as in (a). Back ending the run is AD-19's `end()` bullet (`closedByBack`) and the AD-13 celebration entry. A second back collapsing the sheet (AD-13 depth) is owned by e2e/celebration.spec.ts "R-87 back skips the run: … back again collapses the sheet"; not repeated here.
- Both: `await page.waitForLoadState('networkidle'); expect(errors).toEqual([])` at the end (AD-15).

Review-log resolutions (Pass 3 open major + 11 minors):
- [major] (b) time bound → resolved: the won dialog is asserted with `{ timeout: 1000 }` after `page.goBack()`; with the root asserted attached right before the skip, a natural finish (Normal ≈5.8 s) cannot stand in. (a) is already bounded by skipByPress's 1 s.
- Start copy → resolved: read the first shown copy (visibility not hidden, transform non-empty), layout-independent.
- `n` → `animationFrames(page, 2)` in one `expect.poll` callback.
- Reduced motion → pinned by `page.emulateMedia({ reducedMotion: 'no-preference' })` before `openFixture`.
- Negative control → recorded below with `git diff --exit-code src/main.ts` after the revert, then `npm run test:all` as the green run.
- Focus → scoped to the won dialog's exact-name Replay button.
- `added()` → kept, labelled the 10.5 deferral's literal assertion, read after the groups poll.
- (a) touch → stated above.
- (b) second back → e2e/celebration.spec.ts owns it (stated above).
- Real time → measured Confirm-to-skip gap recorded below.
- Confirm → `toHaveText('Confirm')`.
- (b) citation → AD-19 `end()` bullet + AD-13 celebration entry.

Build log (2026-10-24):
- Files touched: `e2e/pwa/dist-smoke.spec.ts` only (+92/−6): `errorsOf` (the AD-18 load test now uses it), `winIntoRealRun`, `expectSkippedToSheet`, tests (a) and (b). No product code, helper or config change.
- Audit (dist-smoke testMatch: dist-smoke, precache, build-output, font specs): none wins a game by play; the R-87 relaunch test seeds a finished game and starts no run. No existing spec changed.
- Measured Confirm-to-skip gap (Confirm click → root asserted attached right before the skip), local, `dist/`, 3 workers: 942–985 ms over 14 runs (`--repeat-each 3` twice plus a full `test:e2e:dist`), against the Normal run's natural length ≈5.8 s from its start (which itself follows the commit glide and the 300 ms guard). The skip is then bounded to 1 s. Margin ≈4.8 s; fullyParallel or CI retries (2) would have to absorb a ~5× slowdown before a natural finish could pass.
- Negative control: moved `setCelebrationEnabled(false)` above its `DEV || VITE_TEST_HOOKS` gate in src/main.ts, `npm run build` (exit 0), `npm run test:e2e:dist -- -g "hook-free build"`: (a) and (b) both failed at the start proof (dist-smoke.spec.ts:74, `[data-celebration-group]` count `toBeGreaterThan(0)` timed out); the relaunch test passed. Reverted with `git checkout src/main.ts`; `git diff --exit-code src/main.ts` exit 0. Then `npm run test:all` rebuilt dist/ and was green.
- `npm run test:all`: exit 0 (unit 3581 passed; test:e2e:dist 21 passed incl. both new tests; test:e2e 1093 passed, 1035 project-skipped; test:e2e:pwa 17 passed).

## Plan Change Log

## Review Triage Log

### 2026-10-24 — Review pass
- verdicts: 0 findings — high 0, medium 0, low 0, false 0, maybe-false 0
- findings:
  - (none; the quick lens checked AC names, setup, DOM-only helpers, error listeners, start-proof order and copy choice against celebration.svelte.ts render(), the 1 s bounds, post-skip assertions, citations and AGENTS.md rules)

## Verification

**Commands:**
- `npm run build && npm run test:e2e:dist` -- expected: both new tests pass in `dist-smoke`.
- Negative control: move `setCelebrationEnabled(false)` in src/main.ts above its `if (import.meta.env.DEV || …)` gate, `npm run build && npm run test:e2e:dist` -- expected: (a) and (b) fail at the start proof; revert, `git diff --exit-code src/main.ts` exits 0.
- `npm run test:all` -- expected: green (rebuilds dist/).

## Auto Run Result

- Summary: two hook-free R-87 tests in `e2e/pwa/dist-smoke.spec.ts` against `dist/`: a real win (session-won-words, Undo, Confirm) starts the celebration on the real rAF loop (DOM start proof: groups mounted, root added, won sheet absent, the first shown copy's transform moving across two frames), then (a) `skipByPress` and (b) `page.goBack()` each end it within 1 s to the expanded "Every column cleared." sheet with Replay this deal focused, no root, no page or console errors; (b) also keeps the app open. Closes the 10.5 deferral (win-trigger plan Deferred 1).
- Files changed: `e2e/pwa/dist-smoke.spec.ts` — `errorsOf` helper (shared with the AD-18 load test), `winIntoRealRun`, `expectSkippedToSheet`, tests (a) and (b).
- Review: quick lens, 0 findings; 0 patches, 0 deferred, 0 rejected. Deferred (planning, addressed to entry 9): AD-17 Celebration seam / SPEC CAP-6, F12 press-or-back wording; AD-19 copies-not-groups `transform` wording.
- Follow-up review recommended: false (patched: high 0, medium 0, low 0).
- Verification: `npm run build` + `npm run test:e2e:dist` green (both new tests pass); negative control failed both tests at the start proof and was reverted (`git diff --exit-code src/main.ts` exit 0); `npm run test:all` exit 0. Confirm-to-skip gap 942–985 ms vs ≈5.8 s natural run.
- Residual risks: the margin against a natural finish depends on runner speed (≈5× headroom measured locally); no screenshot baseline involved.
