# Review loop — ticket 3.5 build (code, 53f3e13..cf4c0b6)

State: pass 2: done

Target: `_bmad-output/implementation-artifacts/review-loop/3-5-build.passes/pass0.diff` (53f3e13..cf4c0b6)
Intent: `_bmad-output/initiative-wordcell-v1/epic-app-shell/story-fatal-surface-rejected-session-and-single-instance-plan.md`
Depth: thorough, max 7. Pre-loop HEAD cf4c0b6, tree snapshot 0 3dd7c99e2b714ca185a0c997f60fd2e973434138.

## Pass 1 — 2026-09-30
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 3, minor 9, decision-needed 1  |  Dropped in triage: 2
Snapshot: tree 261d6bbaf113581477901981a81ed39d802ed414  |  Fix diff: 3-5-build.passes/pass1.fix.diff  |  After fix: npm test 1504 passed (fixer 4.61–4.76 s standalone; orchestrator rerun 5.35 s — budget marginal on /mnt/d, 69 % transform), lint clean, check 0 errors; fixer ran e2e/blocking.spec.ts + helpers.spec.ts 41 passed
### Applied
- [major] src/ui/BlockingMessage.svelte `.card` — fill is `--wc-surface`; DESIGN.md `components.dialog` and Colors give dialogs `surface-raised` → fixer item 1
- [major] src/ui/BlockingMessage.svelte h2/p/button — fixed px text; DESIGN.md A-D9 puts dialog text in rem (the Blocking message replaces the Board, outside the height rule) → fixer item 2
- [major] plan AC "unit suite stays under 5 s" — recorded 4.78–5.14 s standalone after the build; cut the new `game store halt` fresh-module cost and re-measure → fixer item 3
- [minor] src/main.ts `textOf`/`fatal` — text can be blank (`''`, empty Error) or `String()` can throw (null-prototype reason) before `halt`; make it total and non-blank → fixer item 4
- [minor] src/main.ts `fontCheck` — after the 30 s timer fires, a later font rejection/`[]` replaces the fatal text; stop following the load once timed out → fixer item 5
- [minor] e2e/blocking.spec.ts font timeout — bounded only from above; assert still booting at 29 999 ms → fixer item 6
- [minor] e2e/blocking.spec.ts — no test of the fatal-text fallback chain (non-Error reason) → fixer item 7
- [minor] e2e/blocking.spec.ts 404 font test — body unpinned → fixer item 8
- [minor] rule-coverage.md AD-15 row — Kind `P3` should be `P3 + S` with the shell Vitest no-write note → fixer item 9
- [minor] src/shell/game.svelte.test.ts — ticket's AD-15 "load writes nothing" half has no AD-15-named test → fixer item 10
- [minor] build-notes.md — AD-15 primary Reload vs DESIGN.md Buttons secondary Reload not recorded for reconciliation → fixer item 11
### Default applied (technical)
- unit-suite budget — consolidate the new halt cases onto shared setup rather than relax the budget
- `textOf` — `Object.prototype.toString.call` for non-stringifiable objects; ErrorEvent `message`/type tag when blank
- font timeout — `timedOut` flag so only the first font failure reaches AD-15
### Decision needed (functionality / UX / gameplay)
- src/ui/BlockingMessage.svelte — when the board is replaced by the Blocking message (fatal, rejected save, another window), should keyboard focus move to its one button? Today focus drops to the page and keyboard players must Tab to reach Reload / New game. EXPERIENCE.md is silent — proposed default: focus the primary button when the message appears.
### Dropped
- src/main.ts half-mounted App on a throwing `mount(App)` — Svelte returns no instance from a throwing `mount`, so the proposed unmount is not possible; `replaceChildren` already removes its DOM; improbable path
- (duplicate) intent-alignment unit-suite finding merged into the verification-gap one

## Pass 2 — 2026-09-30
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 7, decision-needed 0  |  Dropped in triage: 1 (duplicate)
Snapshot: tree 261d6bbaf113581477901981a81ed39d802ed414 (no fix pass)  |  Final: npm test 1504 passed, lint clean, check 0 errors
### Applied
- none (converged)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none new
### Dropped
- duplicate: verification-gap "timedOut guard untested" merged into the fix-diff one

## Result — converged after 2 passes

Majors per pass: 3, 0. Decision needed: Blocking message keyboard focus (pass 1).

Unapplied minors (for the next build or loop):
- plan Design Notes 3 — still describes a throwing timer; code uses `reportError` (rewrite the snippet)
- e2e/blocking.spec.ts font-timeout test — `timedOut` guard untested: release held routes with 404 after the fatal and assert the text stays the timeout text
- e2e/blocking.spec.ts — ErrorEvent with null `error` (body = `event.message`) untested: dispatch `new ErrorEvent('error', { message })`
- plan Tests mapping — halted-boot "no App mount" is proven only through entries 6 and 9; say so rather than claim the Q-38 halted-boot test covers it
- src/main.ts `fatal` — `console.error` runs before `game.halt`; AD-15 says halt first (swap the order)
- rule-coverage.md rows R-74 New game / R-74 Q-29 — CAP column should read `3, 4` for the rejected-root half now proven in CAP 4
- unit-suite duration — fixer measured 4.61–4.76 s standalone; orchestrator rerun 5.35 s: the 5 s AD-17 budget is marginal on /mnt/d (69 % transform); consider `fsModuleCache` upstream

## Owner decision applied — 2026-09-30

Decision (pass 1 decision-needed): YES — the Blocking message's one button (Reload / New game) takes keyboard focus when the message appears (standalone mount before the UI and the in-App switch) and again when its cause changes.
- Change: `src/ui/BlockingMessage.svelte` — `{@attach focusOnCause}` on the button; the attachment reads `title`, so it re-runs (and refocuses) when the cause changes. No new dependency.
- Tests (android, `e2e/blocking.spec.ts` describe `Blocking message focus`): `AD-15 a fatal after mount focuses Reload`, `§2 the rejected root focuses New game`, `Q-38 another window focuses Reload, and a later fatal focuses it again` (blurs before the fatal so the refocus is observed).
- Plan: dated `Decision: owner …` line in Implementation Notes.
- Verification: `npx playwright test e2e/blocking.spec.ts --project android` 16 passed; `npm test` 1504 passed (4.65 s); lint clean; check 0 errors.
