# Review loop — ticket 5.8 build (code mode, 875266c..44eda8b)
State: done

Target: `_bmad-output/implementation-artifacts/review-loop/5-8-build.passes/pass0.diff` (git diff 875266c..44eda8b)
Intent: `_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-free-letters-by-tap-and-by-drag-plan.md`
Depth: thorough (correctness, edge cases, verification gap, intent alignment; fix diff from pass 2) | max 7
Pre-loop: HEAD 44eda8b1b05c02df36e6cc046a4192fa23be5003, tree snapshot 0 b4b0814421f52aaa3f3265971c335b84630597b0

## Pass 1 — 2026-10-09
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 3, minor 5, decision-needed 1  |  Dropped in triage: 2
### Applied
- [major] controller.ts createParting `take()` — reads the current offset as face rect − slot, but a non-start block mirror face has `margin: 0` (Card.svelte `.block .face`), so it rests 2 px left of its slot; on a block of ≥ 2 mirrors the mirror animates (−2 px twitch, gate held, AD-14 breach) at caret/unaccepted changes, block-left gaps and every fly-back return; read the offset from the computed transform instead and add a k ≥ 2 Vitest → fixer item 1
- [major] controller.test.ts free-letter ender tests (F5 pointercancel/lostpointercapture/byBack; cancel()/same-id/detach) and P5 ends — the caret is never shown when a cancel-type end happens, so "hides the caret at every end" passes with `hideCaret` deleted; add caret-shown variants → fixer item 2
- [major] Card.svelte parted segment CSS — no browser check that under `wc-parted` the lock and segment ends follow `wc-part-start`/`wc-part-end` and ignore `.start`/`.end` (the only parted P5 has a one-mirror block); add a P5 on an existing k = 2 block setting the classes via `page.evaluate` (no new fixture) → fixer item 3
- [minor] e2e/free-letter.spec.ts back mid-drag test — plan says it asserts nothing selected and cell 7 unused; it does neither → fixer item 4
- [minor] controller.test.ts:4361, 4470 — caret-takeover return and mirror normal-motion animations only partly asserted (empty transform; last animation only) → fixer item 5
- [minor] e2e/free-letter.spec.ts reduced-motion mirror return P5 — moves outside the band before release, so the mirror is already at rest and `home()`'s reduced-motion mirror snap branch is never reached; end with pointercancel while parted → fixer item 6
- [minor] e2e/free-letter.spec.ts block-right P5 runs under emulated reduced motion without saying so in its name → fixer item 7
- [minor] DRAG_TILES lifts the `.tiles` clip at the crossing, so with ≥ 15 tiles the clipped third row shows for the whole drag and can receive a parted tile; ticket accepts clipping until CAP-9 — record for entry 12 in the plan's deferred list → fixer item 8
### Default applied (technical)
- createParting `take()` — current offset from the face's computed transform (includes a running WAAPI effect), not rect − slot
- parted CSS browser check — `page.evaluate` class writes on an existing k = 2 Composing block, no new fixture
### Decision needed (functionality / UX / gameplay)
- controller.ts perform() `addFreeLetter` — on desktop, clicking a WordCell to add its letter while that cell's hover preview is open leaves the preview open (now showing the letter used) until the mouse leaves the cell; EXPERIENCE.md closes the peek only for key commands — proposed default: keep as built (preview stays open and updates)
### Dropped
- plan Verification — `npm run test:all` never green as one command: environment (a stale owner-started `vite --host` on port 5173 that Playwright reuses); every step ran green separately; recorded for the owner, not a code defect
- (duplicate) edge-case reviewer's back-test finding merged into item 4

Owner answer (2026-10-09): the pass-1 decision-needed item takes the proposed default, keep as built (SPEC F26).

### Fix (pass 1)
Fixer (WIP 8d40dff, resumed and finished 2026-10-09): items 1–8 applied and verified. 1: `take()` reads the computed transform (8d40dff; Chromium probe: a paused WAAPI mid-flight reads `matrix(1, 0, 0, 1, 24, 0)`), k = 2 mirror Vitest present. 2: Vitest caret-shown variants for every ender (8d40dff), plus 3 Playwright caret-shown ends (pointercancel, Flip, hidePage); each `hideCaret` deletion fails a test; back has no browser variant (page leaves to about:blank; Vitest covers it). 3: Playwright AD-14 k = 2 parted-class CSS test on the redo-tail fixture. 4–7: back asserts, full animation asserts, reduced-motion return by pointercancel, name says reduced motion. 8: plan deferred entry for entry 12.
Checks (orchestrator): `npm test` 54 files / 2225 tests pass; lint pass; check 0 errors. Fixer: free-letter.spec android 22 passed 1 skipped, desktop 1 passed.
Snapshot: tree ebf3a5ae05b8ef99a191a22c86e13276b212c28e | fix diff `5-8-build.passes/pass1.fix.diff` (tree 0 → tree 1, includes 8d40dff) | full diff `5-8-build.passes/pass1.diff` (875266c → tree 1)

## Pass 2 — 2026-10-09
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 6, decision-needed 0  |  Dropped in triage: 1 (duplicate)
### Applied
- [major] controller.ts startFreeLetterDrag `full = run.tileCount + 1 > perRow × rows` — no test on the exact boundary (tile count + 1 = perRow × rows: parts, no caret); `>=` passes the suite; add a Vitest boundary case → fixer item 1
- [minor] e2e/free-letter.spec.ts back mid-drag test — `expectSelected(page, null)` cannot fail: no tile selected first, unlike its siblings → fixer item 2
- [minor] e2e/free-letter.spec.ts k = 2 parted-class CSS test and the k = 1 block-right P5 — face width and badge `right` rules under `wc-parted` (and a mirror both part-start and part-end) are not read → fixer item 3
- [minor] plan l. 146 — still says the reduced-motion mirror P5 is "moved outside and released"; add the 4 new Playwright tests to the AD-12/AD-14 verification rows → fixer item 4
- [minor] plan frontmatter deferred[0], l. 157 and Auto Run Result residual risk — still say the parted CSS is browser-checked only with a one-mirror block; narrow to the row-break case still open (entry 12) → fixer item 5
- [minor] controller.test.ts free-letter describe — every drag presses the top card; none presses the `[data-wordcell]` element outside it (the ticket's "any press the controller resolves as the WordCell's hit") → fixer item 6
### Default applied (technical)
- full boundary — Vitest case on the compact perRow-4 harness (inner 188) with 3 tiles: parts, caret hidden, release dispatches `addFreeLetter`
- parted CSS widths — computed face width and badge `right` added to the existing k = 2 test's tuple
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- (duplicate) edge-case reviewer's full-boundary finding merged into item 1
### Fix (pass 2)
Fixer: items 1–6 applied (tests and plan only; no production change). 1: Vitest `AD-12 F16 a layout with room for exactly one more tile …` (inner 188, perRow 4, 3 tiles); fails with `>=`. 2: back test selects tile 42 first, renamed. 3: `blockEnds()` helper reads lock, face width − `--tile-w`, edges and badge `right` (probe badge span on non-QU mirrors); k = 2 test adds middle and start-and-end mirror class writes; k = 1 block-right P5 asserts the single parted mirror closed both sides. 4–5: plan review record, AD-12/AD-14 rows, deferred[0] and residual risk narrowed to the row-break case (entry 12). 6: Vitest press on `[data-wordcell]` outside the top card.
Checks (orchestrator): `npm test` 54 files / 2227 tests pass; lint pass; check 0 errors. Fixer: free-letter.spec android 22 passed 1 skipped, desktop 1 passed.
Snapshot: tree 46b443ad991eb6e2513615da4dc488b095cc9a11 | fix diff `5-8-build.passes/pass2.fix.diff` | full diff `5-8-build.passes/pass2.diff`

## Pass 3 — 2026-10-09
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 3, decision-needed 0  |  Dropped in triage: 0
### Applied
- [major] controller.test.ts `AD-12 F16 the caret marks the end gap of M … a parting gap hides it …` — goes parting → caret only; no test shows the caret and then moves to a parting gap or out of the band and asserts it hides (an implementation hiding only on unaccepted passes) → fixer item 1
- [minor] e2e/free-letter.spec.ts back mid-drag — `expectSelected(page, null)` runs after goBack/goForward, which reloads (no bfcache under Playwright), so it still cannot fail; assert it while the page is live, before leaving → fixer item 2
- [minor] controller.test.ts `AD-12 an under-25 % or out-of-band release …` — only the under-25 % release runs; loop over both release points → fixer item 3
- [minor] plan Verification / Auto Run Result — counts stale (unit 2224, free-letter 17 + 1, 14-case describe) and no full `test:all` on record since pass 1's `take()` change (shared with entry 7's tile drag); rerun and refresh → fixer item 4
### Default applied (technical)
- back test — selection asserted between `expectHeld` and `expectLeaves`
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
### Fix (pass 3)
Fixer: items 1–4 applied (tests and plan only; controller.ts unchanged). 1: the F16 end-gap test now moves caret → parting gap (hidden, tiles parted, mirror parted classes) → caret → out of band (hidden) → caret → release; fails with `hideCaret` deleted and with hide-only-when-unaccepted. 2: back test asserts nothing selected while held, before leaving; renamed `AD-12 F5 F18 …`. 3: fly-back test loops y 586.5 and y 300. 4: plan Verification and Auto Run Result refreshed from a one-command `npm run test:all` (exit 0): lint, check, unit 2227, build 513,501 / 600,000, e2e:dist 14, e2e 478 passed 434 skipped, e2e:pwa 12; screenshots not rerun by the review.
Checks (orchestrator): `npm test` 54 files / 2227 tests pass; lint pass; check 0 errors.
Snapshot: tree 9125adc617e5925a79033c98d1aa8ee72ecc8ce9 | fix diff `5-8-build.passes/pass3.fix.diff` | full diff `5-8-build.passes/pass3.diff`

## Pass 4 — 2026-10-09 (verify-only)
Reviewers: fix diff (pass3.fix.diff only)  |  Findings: major 0, minor 0, decision-needed 0  |  Dropped in triage: 0
Note: the stopping rule (two consecutive passes with at most one major: passes 2 and 3) should have ended the loop at pass 3's triage with its major recorded open; the orchestrator applied it instead, so this verify-only pass reviewed that fix before closing. No open major remains.

## Result — converged after 4 passes
Majors per pass: 3, 1, 1, 0. Decision needed: none open (pass 1's item answered by the owner: keep as built, SPEC F26). Technical defaults applied: 5.
Final checks (tree 9125adc, HEAD 1382c32): `npm test` 54 files / 2227 tests pass; lint pass; check 0 errors; `npm run test:all` one command exit 0 (pass 3 fixer: build 513,501 / 600,000, e2e:dist 14, e2e 478, e2e:pwa 12). Screenshots (`npm run test:screens`) not rerun by the review.
Unapplied minors:
- plan triage rows at l. 152 and l. 155 still use the older "never rendered with a multi-mirror block" wording (pass 2 fixer note; the deferred entry and residual risk are already narrowed).
