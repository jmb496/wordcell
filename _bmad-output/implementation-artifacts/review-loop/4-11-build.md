# Review loop — ticket 4.11 build (code mode, 69bf8b2..f97c288)
State: pass 4: done (result written)

Target: `_bmad-output/implementation-artifacts/review-loop/4-11-build.passes/pass0.diff` (git diff 69bf8b2..f97c288)
Intent: `_bmad-output/initiative-wordcell-v1/epic-board-and-gestures/story-wordcell-peek-and-sticky-view-plan.md`
Depth: thorough (correctness, edge cases, verification gap, intent alignment; fix diff from pass 2) | max 7
Pre-loop: HEAD f97c288, tree snapshot 0 1da11474616f4a697ee06eb3518187c6703c1794

## Pass 1 — 2026-10-07
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 6, decision-needed 0  |  Dropped in triage: 1
Snapshot: tree 58a6231e43eff80ed6413789b65ffaebe55d3aff  |  Fix: items 1–5 applied. Fixer: one complete `npm run test:all` green (exit 0; unit 1988, dist 14, e2e 349, pwa 12); e2e/wordcell-view.spec.ts 17 passed / 17 skipped. Orchestrator: npm test 46 files, 1988 passed; lint clean (169 files); check 0 errors, 0 warnings. Fixer note: ticket text and an earlier plan triage note still say `scrollHeight > clientHeight` (left untouched).
### Applied
- [major] plan frontmatter `status: 'built'` / Auto Run Result Verification — `npm run test:all` never passed in one complete run (each of two runs hit the pre-existing layout.spec.ts:250/272 scroll flake); AGENTS.md requires a green test:all before `built` → fixer item 1 (re-run test:all until one complete green run, record it; precedent 4-5 loop)
- [minor] src/ui/gestures/controller.ts releasePeek — integer-rounded `scrollHeight > clientHeight` can turn a fitting peek sticky at a 1 px rounding excess → fixer item 2 (default applied: `scrollHeight - clientHeight > 1`, controller.test case at +1)
- [minor] e2e/wordcell-view.spec.ts 'R-65 R-33 the used cell's peek…' — title count and order checked against the board row DOM, not engine data → fixer item 3 (default applied: derive from fixture/test hook)
- [minor] same test — carries R-33 but asserts the view mirror is not hatched → fixer item 4 (default applied: drop R-33 from the name, or assert the board row's used mirror keeps the hatch)
- [minor] src/ui/gestures/controller.test.ts AD-13 before-hide test — unasserted `vi.fn()` padding → fixer item 5
### Default applied (technical)
- releasePeek overflow threshold → 1 px tolerance
### Decision needed (functionality / UX / gameplay)
- none
### Not applied (minor, UX-adjacent; left for owner/next build)
- controller.ts contextmenu — a still long touch (≥ 400 ms) on the scrim/sheet is not `preventDefault`ed, so whether it closes the view (tap) or keeps it (pointercancel) is browser-defined
- WordCellView.svelte .scrim — desktop mouse-wheel over the scrim scrolls the board behind the sticky view
### Dropped
- intent: `npm run test:screens` never run (Docker unreachable from this WSL2 distro) — environment limit, already disclosed in the plan's Verification and Residual risks; not fixable by the loop; the screenshot gate stays with CI/owner before done

## Pass 2 — 2026-10-07
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 3, minor 5, decision-needed 0  |  Dropped in triage: 2 (duplicates of the 1 px revert)
Snapshot: tree 4f6fa30c029289c0c724662f615e94129423b9b5  |  Fix: items 1–7 applied (item 1: the new 1 px case deleted, an equal-heights case already existed; item 3: only `.title` converted, the `top` tag is part of the card face and stays px; item 4: fixer traced every press end, no legitimate longPress release without a peek). Fixer: e2e/wordcell-view.spec.ts 17 passed / 17 skipped. Orchestrator: npm test 46 files, 1987 passed; lint clean (169 files); check 0 errors, 0 warnings.
Majors rose 1 → 3, but not from unclear refs: one is a regression introduced by pass 1 (the refs, SPEC F14 and the ticket, are explicit), the other two are pre-existing defects the pass-1 lenses missed (DESIGN A-D9 and the ticket's P4 case are explicit). The diverging rule's premise (refs unclear) does not hold, and stopping would leave the pass-1 regression committed, so the loop continues.
### Applied
- [major] src/ui/gestures/controller.ts releasePeek + plan Always line + controller.test.ts '1 px rounding excess' — pass-1 tolerance `scrollHeight - clientHeight > 1` contradicts SPEC F14 / CAP-9 and the ticket (`scrollHeight > clientHeight`); plan triage l.134 had already rejected it → fixer item 1 (revert to strict `>`; unit cases: equal heights close, 1 px excess turns sticky); supersedes pass-1 item 2 (my triage error: F14 pins the condition). Also resolves fix-diff minor (e2e `overflows` helper mismatch) and edge minor (plan l.134 contradiction)
- [major] e2e/wordcell-view.spec.ts 'R-65 R-75 a tap and a long-press on an empty WordCell open nothing' — the long-press half asserts only after release, so a peek opened during the hold passes → fixer item 2 (assert no sheet/scrim while held)
- [major] src/ui/WordCellView.svelte `.title` — 20px/28px fixed px; DESIGN.md Text size / A-D9 requires rem in sheets → fixer item 3 (1.25rem/1.75rem like BlockingMessage; check other sheet text)
- [minor] controller.ts pointerup `outcome === 'longPress' && overlays.peek !== null` — guard hides an impossible state (rule 6) → fixer item 4
- [minor] e2e/wordcell-view.spec.ts `top` tag checked only on the last mirror → fixer item 5 (count 1)
- [minor] controller.test.ts 'AD-12 a scrim or sheet drag ≥ 8 px keeps the view…' — swallower not asserted unarmed → fixer item 6
- [minor] plan triage note on click-swallow "reaches its handler" misstates the test's evidence (`cancelBubble`) → fixer item 7
### Default applied (technical)
- none new
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- fix diff minor: e2e `overflows` helper uses strict `>` — moot after the revert (item 1)
- edge minor: plan l.134 contradicts the tolerance — moot after the revert (item 1)

## Pass 3 — 2026-10-07
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 5, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree 2794145c4f2dce345d40b875767709cbe3a9ef55  |  Fix: items 1–5 applied (item 1: `svelte` mocked in controller.test.ts so `flushSync` runs a hook; the new case fails at `not.toThrow` with the fix stashed). Fixer: e2e/wordcell-view.spec.ts 17 passed / 17 skipped. Orchestrator: npm test 46 files, 1988 passed; lint clean (169 files); check 0 errors, 0 warnings.
### Applied
- [major] src/ui/gestures/controller.ts pointerdown same-id path — `end({ kind: 'sameId' })` closes a held peek, but the scrim/sheet stay in the DOM until Svelte flushes, so `elementFromPoint` in the same handler hits the stale full-viewport scrim; released as a tap, `overlays.close('wordcellView')` throws (no view entry) → fixer item 1 (default applied: `flushSync()` after a same-id end that closed a peek, as layout.svelte.ts already does; controller.test case releasing that press as a tap)
- [minor] e2e/wordcell-view.spec.ts empty-WordCell held check waits only 450 ms (50 ms past LONG_PRESS_MS) → fixer item 2 (600 ms)
- [minor] controller.test.ts 'AD-12 the 300 ms expiry armed at pointerup disarms it' cannot tell pointerup arming from pointerdown arming → fixer item 3 (time between down and up)
- [minor] e2e/wordcell-view.spec.ts session-won deepest-cell overflow test never counts the 24 mirrors → fixer item 4
- [minor] src/ui/Card.svelte `.top-tag` line height 14px vs DESIGN `card-badge` lineHeight 1 → fixer item 5 (default applied: 11px/1, pill kept 14 px, text centred)
### Default applied (technical)
- same-id peek close → `flushSync()` before hit-testing
- `.top-tag` → `11px/1` with centring
### Decision needed (functionality / UX / gameplay)
- none
### Not applied (minor, UX-adjacent; left for owner/next build)
- WordCellView.svelte .sheet — below ~320 px viewport (board `wide`), the fixed sheet is wider than the viewport and cannot pan, so edge cards clip (R-65 "every card viewable"); candidate default `max-width: 100vw`, but it reflows the sheet's cards-per-row below 360 px, so it is left for the owner/epic 7 device pass
### Dropped
- none

## Pass 4 — 2026-10-07
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 2, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree 2794145c4f2dce345d40b875767709cbe3a9ef55 (no fix pass; stopping rule met)
### Applied
- none (passes 3 and 4 each yielded at most one major: converged; the pass-4 major is recorded as open, not fixed)
### Open major
- plan `status: 'built'` / Auto Run Result Verification — the recorded complete `npm run test:all` run predates passes 2–3, which changed shipped code (controller.ts same-id `flushSync()`, pointerup branch, WordCellView `.title` rem, Card.svelte `.top-tag`); AGENTS.md gate needs a green test:all on the current tree recorded in the plan
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Result — converged after 4 passes
open major: the plan's `status: 'built'` Verification line records a complete `npm run test:all` from the pass-1 state, not the final tree. The orchestrator then ran a complete `npm run test:all` on the final tree (041af96, tree 2794145): exit 0; lint clean, check 0 errors, unit 46 files / 1988 passed, build within size budget, dist 14 passed, e2e 349 passed, pwa 12 passed. The gate is met, but the plan's Verification line still needs that run recorded (a plan edit, outside the loop's no-unreviewed-fix rule).
Majors per pass: 1, 3, 1, 1. Technical defaults applied: 3 (strict F14 overflow restored after a pass-1 regression; `flushSync()` before hit-testing after a same-id peek close; `.top-tag` 11px/1). Decision-needed: none.
Final state (orchestrator run at 041af96): `npm test` 46 files, 1988 passed; `npm run lint` clean (169 files); `npm run check` 0 errors, 0 warnings.
Not run: `npm run test:screens` (Docker unreachable from this WSL2 distro); the screenshot gate stays with CI/owner before done.

Unapplied minors (for the next build or loop):
1. src/ui/gestures/controller.ts contextmenu — a still long touch (≥ 400 ms) on the scrim/sheet is not `preventDefault`ed, so whether it closes the view (tap) or keeps it (pointercancel) is browser-defined (UX-adjacent).
2. src/ui/WordCellView.svelte .scrim — desktop mouse-wheel over the scrim scrolls the board behind the sticky view (UX-adjacent).
3. src/ui/WordCellView.svelte .sheet — below ~320 px viewport (board `wide`) the fixed sheet is wider than the viewport and cannot pan, so edge cards clip (R-65); candidate `max-width: 100vw`, left for the owner/epic 7 device pass.
4. e2e/tap.spec.ts 'R-14 a non-empty WordCell long-press peeks while held and keeps the selection' — the only P4 proof of R-65's "peek in Idle with a tail selected" lacks R-65/Q-21 in its name and the Session/storage/Undo-Redo unchanged and wc-while-held checks.
5. e2e/wordcell-view.spec.ts 'R-65 a 20 px scrim drag keeps the sticky view' — does not assert the drag starts on the scrim (elementFromPoint has `data-view-scrim`).
