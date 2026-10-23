# Review log — story-win-trigger-and-celebration-test-seam.md
State: pass 5: done
Pre-loop: HEAD 8d5147f; pass0.md 373 words; growth budget 2.5x (~930 words); tickets.toml entry 5 fields interface, tests, owns, consumers, unknown, plan_checkpoint passed as intent, added to Description in pass 1.

## Pass 1 — 2026-10-23
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 13 (merged from ~30 raw), minor 7, decision-needed 0  |  Dropped in triage: 2
Words (docs): 929 (2.49 x pass 0)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-win-trigger-and-celebration-test-seam.passes/pass1.md
Fixer: all 20 applied; lead paragraph trimmed where bullets replace it; nothing run (no commands touched); names checked against code (`cancelGesture()` in act.ts, `setManual`, `game.whenVisible()`).
### Applied
- [major] Description — tickets.toml entry 5 interface, tests, owns, consumers, plan_checkpoint not copied → fixer item 1
- [major] Description "off by default" — owner and per-build default of the enabled flag unstated; hook-free `dist/` must always play (F12), Vitest end-sheet win tests would hit `startCelebration` → fixer item 2
- [major] Description no-start cases / Notes — whether reduced-motion and seam-disabled paths push/pop the entry unstated (the Notes unknown) → fixer item 3
- [major] Description start/`done` — start preconditions (still won, live token) and what `done` runs (token-guarded open, `announceOutcome`) unstated → fixer item 4
- [major] Description start — entry 4's deferred press-timer halt (cancel the controller press before `startCelebration`) dropped → fixer item 5
- [major] Description `done` — entry 4 owner-checkpoint default (`done` waits for `whenVisible()` when hidden) dropped → fixer item 6
- [major] Description hook — late-bound methods before registration, second registration, `setEnabled` mid-run, nested freeze unstated → fixer item 7
- [major] Description helper — one helper cannot enable and advance; name, file, signatures, helpers.spec.ts tests unstated (consumed by 6, 7) → fixer item 8
- [major] AC no-start rows — pass trivially with the seam off; rule-coverage requires the seam enabled; relaunch row cannot fail as written → fixer item 9
- [major] AC — no UI Vitest `AD-19` wiring tests (tickets.toml tests, AD-19 Tests) → fixer item 10
- [major] AC default-off — must be proven on the dev server and `dist-test/` (rule-coverage) → fixer item 11
- [major] AC cap — no pass condition; `advance(cap)` stops short (16 ms sub-steps); scaling unproven → fixer item 12
- [major] AC order / fresh mount / first launch — "registered", "fresh" not observable; fixed advance goes stale at entry 6 tuning → fixer item 13
- [minor] AC — test-name ids (R-87, AD-17, AD-19) → fixer item 14
- [minor] AC "no screenshot baseline changes" — reword to no snapshot file modified → fixer item 15
- [minor] Notes — ☰ during a run throws until entry 7; no merge before entry 7 → fixer item 16
- [minor] Description mount — which App.svelte branch hosts the mount → fixer item 17
- [minor] References — missing code paths and AD-9, AD-16 → fixer item 18
- [minor] AC copy count — "card counts" means `cards.length` (QU) → fixer item 19
- [minor] AC finish row — assert the entry was popped (one history entry, the sheet's) → fixer item 20
### Default applied (technical)
- enabled flag — `celebration.svelte.ts` flag, default on (hook-free and Vitest); `main.ts` calls `attachOverlays()` in every build and, only under the DEV/VITE_TEST_HOOKS gate, turns it off and registers the seam; `setEnabled(on)` sets the flag and `setManual(on)`
- no-start paths — no `startCelebration`/`start`; the callback runs today's open unchanged
- start precondition — status won and a live token (non-consuming token query on `overlays`)
- hook — methods throw before registration; second registration throws; `setEnabled` throws mid-run; nested object frozen
- helper — `e2e/helpers/celebration.ts` `enableCelebration(page)`, `finishCelebration(page)`, tested in `e2e/helpers.spec.ts`
- cap — advance by the cap rounded up to a 16 ms step; at Slow still running after the Fast cap
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- adversarial: dev server never shows a real-time run (manual viewing note) — owner viewing is entry 6's device read on `dist/`; not this ticket's contract
- builder: tickets.toml header says entry 5 changes end-sheet baselines — with the seam off in hook builds nothing visible changes; kept "no baseline modified" (item 15)

## Pass 2 — 2026-10-23
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 6, decision-needed 0  |  Dropped in triage: 4
Words (docs): 1004 (2.69 x pass 0)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-win-trigger-and-celebration-test-seam.passes/pass2.md
Fixer: all 11 applied; majors +75 words, minors net −4 (cut a duplicate consumer line and a duplicate Notes clause); item 11 corrected: the e2e constant is `WON_ROWS` in `e2e/end-sheet.spec.ts` (`WON_WORDS_LIST` is in `src/engine/serialize.test.ts`); nothing run (no commands touched).
### Applied
- [major] Start bullet / AC AD-19 — `done` on a hidden page then `announceOutcome()` speaks on return, against EXPERIENCE.md Win celebration row ("a return from hidden is silent", epic 6 SPEC F16) → fixer item 1
- [major] AC AD-17 default-off — end-state check passes even with the flag left on (a real rAF run removes its copies before the sheet opens) → fixer item 2
- [major] AC R-87 relaunch — still cannot fail (reload resets the seam to off before `openAtBoot`); pass-1 item 9 unresolved → fixer item 3
- [major] Hook bullet / AC AD-17 — nested freeze and keys, throw before registration, second-registration throw, `setEnabled` mid-run throw untested → fixer item 4
- [major] AC R-87 run — R-87 "the end sheet opens only after the celebration" not asserted in P6 (Vitest is never R-id coverage) → fixer item 5
- [minor] Start bullet — `isLiveToken` is new; say so and list it in Interface → fixer item 6
- [minor] Start bullet — "as `act()` does" ambiguous (act also clears the tile); name `cancelGesture()` → fixer item 7
- [minor] Hook bullet — `setEnabled` check before any change → fixer item 8
- [minor] Description — `attachOverlays()` boot position → fixer item 9
- [minor] Helper bullet — `finishCelebration` advance amount unbounded → fixer item 10
- [minor] AC copies — source of the expected list in e2e (`WON_WORDS_LIST`) → fixer item 11
### Default applied (technical)
- default-off — a MutationObserver installed before Confirm records that no `[data-celebration]` node was ever added
- relaunch — P6 proves the sheet expanded at boot after a mid-run reload (`running()` true before it); the no-start guard is the U `openAtBoot` case
- hook throws — shell Vitest `AD-17` in a new `src/shell/test-hook.test.ts`; hook specs assert the nested freeze and keys
- hidden `done` — opens after `whenVisible()` without `announceOutcome()`
- `attachOverlays()` — right after `nav.register(...)` in `boot()`
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- edge: second-run check does not prove `{#key}` — the check is a valid Redo-restart check; `{#key}` stays as design
- adversarial: how `end-sheet.ts` reads visibility / Vitest env node — plan detail
- adversarial (stretch): reduced/disabled path keeps entry 4's pre-existing press hazard — today's behaviour, plan residual risk
- adversarial (stretch): `finishCelebration` bound — merged into item 10

## Pass 3 — 2026-10-23
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 7, decision-needed 0  |  Dropped in triage: 3
Words (docs): 1116 (2.99 x pass 0)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-win-trigger-and-celebration-test-seam.passes/pass3.md
Fixer: all 12 applied; majors ~+115 words, minors net −3 (cut the screens parenthetical and a Notes restatement); nothing run (no commands touched).
### Applied
- [major] Start bullet — a page already hidden when the winning callback runs (the hide flush's `finishGuard()` drains `whenOpenAllowed`; the floor timer fires in the background) would start a run that survives the hide, against AD-19 Hide and EXPERIENCE.md → fixer item 1
- [major] Hook bullet / AC AD-17 — the mid-run `setEnabled` throw sits on the UI side, which a shell test cannot import (AD-1); the shell test would only test a stub → fixer item 2
- [major] AC AD-17 default-off — the observer sees the added `[data-celebration-root]`, not the nested `[data-celebration]` copies, so the pass-2 check can still pass with the flag on → fixer item 3
- [major] AC R-87 copies — `WON_ROWS` is a non-exported const in a spec file (Playwright rejects spec-to-spec imports); no R-87 spec file named; copy total unreadable at runtime → fixer item 4
- [major] AC R-87 relaunch — still has no P6 check that can fail (pass-1 item 9, pass-2 item 3 unresolved; U is never R-id coverage) → fixer item 5
- [minor] Enabled flag bullet — `main.ts` has no gate today; `registerBeforeBack` is unconditional → fixer item 6
- [minor] Hook bullet — the hook object is created inside test-hook.ts's existing gate (AD-18 scan) → fixer item 7
- [minor] Helper bullet — `finishCelebration` advances past the Slow cap; `enableCelebration` waits for `active` → fixer item 8
- [minor] AC R-87 run — measure the pop as `history.length` = before Confirm + 1 → fixer item 9
- [minor] AC R-87 run — Replay this deal focused after the run (EXPERIENCE.md Skip "exactly as a normal finish") → fixer item 10
- [minor] AC last row — cut "(screens run with the seam off)"; test:screens does not run for entry 5 → fixer item 11
- [minor] AC copies — read the copies' `.glyph` texts → fixer item 12
### Default applied (technical)
- hidden at settle — joins the no-start list (today's open unchanged); AD-19 U case
- seam contract — `registerCelebrationSeam` takes the controller's `running`, `advance`, `setManual` and a flag setter; test-hook.ts builds `setEnabled` (throws if `running()`, else sets flag and manual)
- observers — watch for `[data-celebration-root]`
- R-87 rows — new `e2e/celebration.spec.ts`; `WON_ROWS` moves to `e2e/helpers/` (end-sheet.spec.ts imports it, assertions unchanged); copy total literal 55 (QU one copy)
- relaunch P6 — hook-free check in `e2e/pwa/dist-smoke.spec.ts` (flag on, real rAF): seeded won session, observer via `addInitScript`, no `[data-celebration-root]` ever added, sheet expanded; the dev-server mid-run reload stays as the outcome check
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- adversarial: relaunch limit to entry 8 — merged into the item 5 major
- edge: copy count via `cards.length` — merged into item 4 (literal 55)
- adversarial: hook-free relaunch belongs to entry 8 — entry 8 owns the real-win suite; a seeded relaunch is CAP-3 (rule-coverage R-87 no-start row), kept here

## Pass 4 — 2026-10-23
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 1, minor 10, decision-needed 0  |  Dropped in triage: 2
Words (docs): 1106 (2.97 x pass 0)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-win-trigger-and-celebration-test-seam.passes/pass4.md
Fixer: all 7 applied; major +5 words, minors −15; the close-out marker sits at the end of the Start no-start sentence (entry 9 syncs AD-19 Start and EXPERIENCE.md "Never plays"); nothing run (no commands touched).
### Applied
- [major] AC R-87 run — pass-3 item 9's "`history.length` = before Confirm + 1" fails on correct code and passes on the bug: `nav.pop` is `history.back()`, the fixture's Undo leaves a forward slot, so a correct run leaves the length unchanged (e2e/nav.spec.ts "Undo then Redo into won … history.length as at boot, wc 1") → fixer item 1
- [minor] AC AD-19 — "today's open, no push" reads as no nav push at all (today's open pushes `endSheet`) → fixer item 2
- [minor] AC Verify line — "every existing win-and-sheet spec unchanged" vs the `WON_ROWS` move: "assertion unchanged" → fixer item 3
- [minor] Start bullet — the no-push reduced/disabled path and the hidden-at-settle no-start refine AD-19 Start / EXPERIENCE.md "Never plays"; mark for the close-out sync (SPEC Constraints, rule 7) at zero net words → fixer item 4
- [minor] AC no-start — name the hook-free relaunch check `R-87` (rule-coverage needs the id in the name) → fixer item 5
- [minor] AC copies — name the `WON_ROWS` home `e2e/helpers/celebration.ts` → fixer item 6
- [minor] AC — cut two unrun tool claims ("Playwright rejects spec-to-spec imports", "Celebration.svelte fills the root before inserting it"); the checks do not depend on them → fixer item 7
### Default applied (technical)
- pop-before-push check — `history.length` after the sheet opens equals its value while `running()`; `history.state.wc` is 1 at both
### Decision needed (functionality / UX / gameplay)
- none
### Unapplied minors (over budget; for the build plan)
- end-sheet.test.ts: disable the flag after each `load()` (`vi.resetModules()`), check the flag before `document.visibilityState`, stub `document` per case (Vitest `environment: 'node'`)
- the hook's `advance` throws `AD-17 …` when `running()` is false (rule 6), built in test-hook.ts like `setEnabled`
- the Slow-cap "still running after the Fast cap" check depends on entry 6 keeping the last Slow launch after 3 s
- References: add `Celebration.svelte`, `e2e/end-sheet.spec.ts`, `e2e/pwa/dist-smoke.spec.ts`, `src/shell/game.svelte.ts`
### Dropped
- adversarial: the second-run disconnect check does not prove `{#key}` — already dropped in pass 2; `{#key}` stays as design
- adversarial (stretch): `pagehide` before `visibilitychange` on other engines — Android Chrome fires `visibilitychange` first; plan note at most

## Pass 5 — 2026-10-23
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 1, minor 11, decision-needed 0  |  Dropped in triage: 1
Words (docs): 1106 (2.97 x pass 0), unchanged (no fix pass)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-win-trigger-and-celebration-test-seam.passes/pass4.md
### Open (not fixed; stopping rule: passes 4 and 5 each ≤ 1 major)
- [major] AC R-87 cap row — at Fast the check (`running()` false and sheet expanded after the cap advance) also passes when no run started (the controller's `advance` silently returns with no run); only Slow asserts a live run. Fix for the build: assert `running()` true before the cap advance at both speeds ("once `running()` is true, after advancing by the cap …").
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- edge: "non-exported" duplicate of the fix-diff minor (kept once below)

## Result — converged after 5 passes
open major: AC R-87 cap row — at Fast the post-advance check passes on a run that never started; assert `running()` true before the cap advance at both speeds.

Majors per pass: 13, 5, 5, 1, 1. Words 373 → 1106 (over the ~930 budget; pass-4 and pass-5 minors held back for the plan).

### Unapplied minors (for the build plan)
- AC copies: "non-exported" reads as describing `e2e/helpers/celebration.ts`; the helper exports `WON_ROWS` (`GAVE_ROWS` in end-sheet.spec.ts depends on it).
- Start bullet: the hidden-at-settle no-start is justified by R-87 "the app being hidden … ends it the same way"; list it, with the reduced/disabled no-push path, as plan-checkpoint items (rule 7); entry 9 syncs AD-19 Start and EXPERIENCE.md "Never plays".
- Start / AD-19 U: hidden at settle runs today's open, whose `announceOutcome()` is silent only because `say()` returns on `document.hidden`; the U case asserts the open, not the announce call.
- Flag API: name the module exports in the plan, e.g. `celebrationEnabled()` / `setCelebrationEnabled(on)` in celebration.svelte.ts (not `setEnabled`, which the hook owns).
- AD-19 U start case: "enabled, visible and not reduced"; stub `document.visibilityState` per case (Vitest `environment: 'node'`); disable the flag after each `load()` (`vi.resetModules()`); check the flag before visibility.
- `src/shell/test-hook.test.ts`: stub `window` (`vi.stubGlobal`) and import a fresh module per case (one-shot registration).
- The hook's `advance` throws `AD-17 …` when `running()` is false (rule 6), built in test-hook.ts like `setEnabled`.
- Observers: install before the finishing action (Give up has no Confirm); observe `document` with `subtree: true` and test `matches(sel) || querySelector(sel)` per added element.
- R-87 copies P6: also count zero `[data-celebration]:is([data-card-id],[data-testid],[data-mirror-of])` (rule-coverage AD-19 copies row, P6).
- `enableCelebration` relies on no `await` between `game.load()` and the seam registration in `main.ts`; record the invariant or poll until the hook stops throwing.
- Relaunch: the failable check runs in `dist-smoke` (same Pixel 7 emulation as `android`); entry 9's rule-coverage audit records it as row "none … on relaunch" coverage.
- Hidden-at-settle P6 coverage: entry 7's hide row or a `hidePage` during the guard window (`e2e/helpers/lifecycle.ts`) gives it a P6 test name.
- R-87 run history check: poll until nav settles (wc back to 1 after 0) before comparing lengths.
- The Slow "still running after the Fast cap" check depends on entry 6 keeping the last Slow launch after 3 s.
- References: add `Celebration.svelte`, `e2e/end-sheet.spec.ts`, `e2e/pwa/dist-smoke.spec.ts`, `src/shell/game.svelte.ts`.
