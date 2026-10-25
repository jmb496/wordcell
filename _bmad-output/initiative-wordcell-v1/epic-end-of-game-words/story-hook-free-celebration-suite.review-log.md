# Review log — story-hook-free-celebration-suite.md
State: pass 3: done
Pre-loop: HEAD 5cf7d71; pass0.md 156 words; growth budget stated 1500 words; tickets.toml entry 8 fields tests, owns, consumers passed as intent, added to Description in pass 1; 10.5 deferral (a real win in the hook-free production build starts the celebration) passed as intent.

## Pass 1 — 2026-10-24
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 6, decision-needed 0  |  Dropped in triage: 3
Words (docs): 675 (4.3x pass 0; budget 1500)  |  Snapshot: story-hook-free-celebration-suite.passes/pass1.md
### Applied
- [major] Description / AC — one run can be skipped once; "the new hook-free test" (singular) vs press and back → two tests, fresh page each, names start `R-87` → fixer item 1
- [major] Description "plays … in real time" / AC — no hook-free observable proves the run started (10.5 deferral; 10.5 plan line 22 asks to assert `[data-celebration-root]` added after a real Confirm) → state the start proof, name the deferral closed, plan records a negative control → fixer item 2
- [major] whole ticket — tickets.toml entry 8 tests/owns/consumers not copied; no rule-coverage row → test-name mapping → fixer item 3
- [major] Description "and by back" vs AD-17 Celebration seam ("every `dist-smoke` spec that wins a game ends the run by a press outside the bars") and SPEC CAP-6/F12 (press only); rule-coverage R-87 hook-free row adds back → Note: spec companion row wins, spine read as "ends the run early by a skip (press or back)", 10.9 syncs AD-17 / CAP-6 wording → fixer item 4
- [major] AC Verify — omits `npm run test:all` (AGENTS.md, methodology DoD, tickets.toml header) → fixer item 5
- [minor] Description setup — "seedStorage (or openFixture …)" offers two routes; hook readers not forbidden → one route, DOM-only helpers → fixer item 6
- [minor] Description — real-time conditions implicit (Normal speed, reduced motion off; a natural finish could stand in for the skip) → fixer item 7
- [minor] Description back — back trigger and post-assertions unstated → fixer item 8
- [minor] Description — no AD-15 / pageerror check during the real rAF run → fixer item 9
- [minor] References — missing SPEC CAP-6, rule-coverage row, AD-19, AD-13, helpers, fixture, 10.5 deferral → fixer item 10
- [minor] Description audit — audited set unnamed → fixer item 11
### Fixer outcome
- All 11 applied (no conflicts). Unverified (left to the build): `page.goBack()` from the celebration entry keeps the app URL; a group's transform changes between two reads in `dist/`. Script/helper names checked against package.json and e2e/helpers. Out of scope: tickets.toml entry 8 `verify` still reads build + test:e2e:dist (ticket wins).
### Default applied (technical)
- Description — test count → two tests (press, back), fresh page each
- Description — setup → `openFixture(page, 'session-won-words', { booted: false, steps: ['undo'] })` (Undo acts with the relaunch sheet expanded, EXPERIENCE.md End sheet), then `primary-action` reads Confirm, then click
- Description — start proof → `watchAdded` before Confirm true; groups mounted while END_SHEET count 0; a group's transform changes across real frames
- Notes — back skip in a winning dist-smoke spec → allowed, 10.9 sync note for AD-17 / SPEC CAP-6, F12
- Description — speed → no prefs seeded (Normal), Playwright default reducedMotion `no-preference` stated
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- builder's reading #3 (Undo over the relaunch's expanded sheet fails / must collapse first) — disproved: EXPERIENCE.md End sheet "Expanded, the top bar (with Undo) … stay above the scrim and usable"; e2e/pwa/test-hook.spec.ts:36 and celebration.spec.ts use `steps: ['undo']` the same way; the remainder merged into item 6
- edge #4 / adversarial #5 / ref #2 back-assertion duplicates — merged into items 1 and 8
- builder's reading minor "seed prefs-non-default (Slow)" — Normal cap 6 s with a skip on first group mount is ample margin; covered by item 7

## Pass 2 — 2026-10-24
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 1, minor 10, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 859 (5.5x pass 0; budget 1500)  |  Snapshot: story-hook-free-celebration-suite.passes/pass2.md
### Applied
- [major] Description Start proof — "a group's transform changes": the run writes only `opacity` to `[data-celebration-group]` and `transform` to each shown `[data-celebration]` copy (celebration.svelte.ts render(); SPEC F21/F26; AD-19's "transform … to the groups" is stale, entry 9 syncs) → read a shown copy's `style.transform`, non-empty and different across `animationFrames` (lifecycle.ts) → fixer item 1 (all four reviewers)
- [minor] Real time — "first group mounts" is not observable (all groups mount at start) and conflicts with the multi-frame start proof → "skip right after the start proof" → fixer item 2
- [minor] Start proof — `added()` read right after Confirm reads false (run starts in whenSettled after the 300 ms guard) → poll first → fixer item 3
- [minor] Start proof — negative control procedure unstated → temporary main.ts gate move, build + test:e2e:dist, record, revert → fixer item 4
- [minor] Setup — error listeners must attach before `openFixture` (it calls goto); assert at end → fixer item 5
- [minor] Setup — helper list reads exhaustive; omits `openFixture`, `animationFrames` → fixer item 6
- [minor] (a) vs (b) — (a) lacks root count 0 and Replay focus → fixer item 7
- [minor] (a)/(b) — `END_SHEET` also matches "Game given up." → exact "Every column cleared." → fixer item 8
- [minor] AC (b) name — omits "plays" though mapped to both → rename → fixer item 9
- [minor] Real time — "(AD-17: …end the run early)" is a paraphrase → point to the Notes reading → fixer item 10
- [minor] Notes — entry 9 scope (tickets.toml) names the spine and rule-coverage, not SPEC.md; handoff only in this ticket → plan records it as a deferred item to entry 9 → fixer item 11
### Fixer outcome
- All 11 applied, no conflicts. Extra consistency edit: References board.ts list now `openFixture`, `glidesSettled`; lifecycle.ts (`animationFrames`) added. Negative-control commands not run (unverified; names checked: package.json scripts, src/main.ts:239).
### Default applied (technical)
- Start proof element → first group's first `[data-celebration]` copy, `style.transform`, two reads `animationFrames` apart
- Error assertion timing → listeners before `openFixture`; assert empty at the end after `waitForLoadState('networkidle')` (the AD-18 precedent)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- edge minor "check-then-act window before the press" — folded into item 7 (root count 0 after the skip); timing margin left to the plan

## Pass 3 — 2026-10-24
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 1, minor 11, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 859 (5.5x pass 0; budget 1500; no fix this pass)  |  Snapshot: story-hook-free-celebration-suite.passes/pass2.md (unchanged)
### Open (not fixed; stopping rule: passes 2 and 3 each at most one major)
- [major] Description (b) / Real time — after `page.goBack()` the won dialog has no time bound, so a natural finish inside Playwright's default 5 s expect timeout (playwright.pwa.config.ts sets none; the Normal run ends ≈5.8 s, step.test.ts) can stand in for the back skip; (a) is bounded only by skipByPress's 1 s (celebration.ts:87). Proposed fix: (b) asserts the exact-name dialog visible with `{ timeout: 1000 }` after `page.goBack()`; the Real time bullet says the 1 s bound plus the attached check rule out a natural finish.
### Minors (not applied; for the build)
- Start proof copy — the letter-order first copy leads only when its group drifts left (step.ts cardArc `behind`); for session-won-words group 0 is WordCell 10's word, side −1, so copy 0 leads (edge reviewer), but read the first shown copy (visibility not hidden, transform non-empty) to be layout-independent, or state why copy 0 leads.
- Start proof `n` — use `animationFrames(page, 2)` (a run's first frame has dt 0); one `expect.poll` callback: read, `animationFrames(page, 2)`, read, return `a !== '' && a !== b`, `.toBe(true)`.
- Setup reduced motion — "the project's default" is Playwright's context default (the project does not set it); pin with `page.emulateMedia({ reducedMotion: 'no-preference' })` before `openFixture`, or reword.
- Negative control — plan records `git diff --exit-code src/main.ts` after the revert, then `npm run test:all` (rebuilds dist/) as the green run.
- (a)/(b) focus — scope the locator: the "Every column cleared." dialog's `getByRole('button', { name: 'Replay this deal', exact: true })` `toBeFocused()`.
- Start proof `added()` — redundant once groups (children of the root) are counted; label it the 10.5 deferral's literal assertion or check it first.
- (a) — the hook-free press is a touch tap (Pixel 7, `hasTouch`); the mouse branch stays covered by the dev-server helper self-test; say so.
- (b) — optionally a second `page.goBack()` collapses the sheet (AD-13 "then back collapses the sheet"), or state e2e/celebration.spec.ts owns the depth check.
- Real time — plan records the measured Confirm-to-skip gap against the Normal run's natural length (fullyParallel, CI retries 2 would hide erosion).
- Setup — "primary-action reads Confirm" → `await expect(page.getByTestId('primary-action')).toHaveText('Confirm')`.
- (b) citation — back ending the run is AD-19's `end()` bullet (`closedByBack`) and the AD-13 celebration entry, not AD-19 Skip (capture listeners, Space/Esc).
### Decision needed (functionality / UX / gameplay)
- none

## Result — converged after 3 passes
open major: (b) has no 1 s bound on the won dialog after `page.goBack()`, so a natural run end inside the 5 s expect timeout could pass for the back skip (Pass 3 Open; proposed fix there).
Majors per pass: 5, 1, 1. Decision-needed: none. Technical defaults applied: 7. Words: 156 → 859 (budget 1500).
Unapplied minors: the 11 listed under Pass 3 Minors.
