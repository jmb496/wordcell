# Review log — story-hook-free-celebration-suite.md
State: pass 2: done
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
