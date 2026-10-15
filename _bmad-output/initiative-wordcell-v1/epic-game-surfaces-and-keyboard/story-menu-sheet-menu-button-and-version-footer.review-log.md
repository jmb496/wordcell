# Review log — ticket 6.2 (menu sheet, menu button and version footer)
State: done
Pre-loop: HEAD b461581; words 333; copy /mnt/d/CodeProjects/wordcell/_bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-menu-sheet-menu-button-and-version-footer.review-log.passes/pass0.md

## Pass 1
Reviewers: builder, edge-case, adversarial, ref alignment  |  Findings: major 8 (merged), minor 8, decision-needed 0  |  Dropped in triage: 2
### Applied (to fixer)
- [major] open path: ☰ opens only via `openSurface('menu')` (SPEC F8), top bar `inert` under the menu (F6); covers open view/peek/selections
- [major] Give up enablement = `GameView.canGiveUp` (AD-3), disabled-row look (DESIGN), tested phases
- [major] New game / Replay calls named (`newGame()`, `game.replay()` + `overlays.resetForNewSession()`), interim until entry 3, Give up closes then dispatches; Verify covers them
- [major] version define: override verbatim and git not consulted, empty override, where set (test:screens, ci screens job), unit test on the resolver
- [major] 360 x 320 scroll criterion may pass vacuously: assert close visible, sheet <= 80 % viewport, rows and footer reachable
- [major] Verify lacks tests from the tests key (AD-3, AD-14 52 elements, define unit, top-bar baselines/FLIP consumers)
- [major] menu strings: cite EXPERIENCE catalogue names, locate controls by role and name
- [major] byte-identical check for each close path (close control, Esc, back, scrim)
- [minor] M key is entry 10's; act() wrapping; `--short=7`; ambient declaration; Session-stored assertion; glyph source; Give up interim state; focus return per build-notes
### Default applied (technical)
- all of the above are technical defaults (8 majors)
### Decision needed
- none
### Dropped
- row entry numbers "5, 4, 9": match tickets.toml
- ☰ in rejected/halted roots: SPEC CAP-3 already says no menu there
Words: 720 (2.16 x pass 0)  |  Snapshot: story-menu-sheet-menu-button-and-version-footer.review-log.passes/pass1.md
Fixer notes: EXPERIENCE.md has no menu strings (text.ts has only newGame); ticket says wording from DESIGN.md/EXPERIENCE.md Menu sheet. src/app-version.d.ts check unverified (file not yet existing).

## Pass 2
Reviewers: fix-diff, edge-case, adversarial, ref alignment  |  Findings: major 1 (reported by 2 reviewers), minor 7, decision-needed 0  |  Dropped in triage: 1 (byte-identical flush noise: AD-9 flush only on hide, stretch)
### Applied (to fixer)
- [major] footer-value assertion cannot hold in dev-server Playwright project (override unset in playwright.config.ts webServer) → set env in webServer (default) and say the resolver applies in every Vite mode
- [minor] drop conditional "only if overflows" scroll clause; Game over case for New game/Replay; "status becomes gaveUp" wording; "checked against Scaffold deltas" (spine lacks the entry: close-out edit); focus after acting rows
### Default applied (technical)
- webServer env for the override
### Decision needed
- none
Words: 793 (2.38 x pass 0)  |  Snapshot: story-menu-sheet-menu-button-and-version-footer.review-log.passes/pass2.md

## Pass 3
Reviewers: fix-diff, edge-case, adversarial, ref alignment  |  Findings: major 0, minor 8 (merged: 7), decision-needed 0  |  Dropped in triage: 0
Words: 793 (2.38 x pass 0), unchanged (no fix pass)

## Result — converged after 3 passes
Majors per pass: 8, 1, 0. Technical defaults applied: 9. No decision-needed items.
### Unapplied minors (for the build plan)
- Override set but empty/whitespace throws and never falls through to git; empty git output throws; both in the resolver unit test.
- Focus starts on the first row (build-notes Menu row); add the assertion; focus return after close or acting row.
- ☰ during the winning-guard window follows the build-notes table (consumed, end sheet opens); test with entry 6.
- Top bar is already inert via 6.1 App.svelte INERT_UNDER: add no inert of its own.
- Every row first calls overlays.close('menu') (nav pop, async) then acts; Give up session-write assertion must await settle.
- vite preview (pwa, dist-smoke) also runs the resolver and relies on git being present.
- Playwright dev webServer has reuseExistingServer: !process.env.CI: local runs must not reuse a server started without the override.
- Menu strings are absent from the EXPERIENCE.md catalogue (text.ts has only newGame): wording from DESIGN.md/EXPERIENCE.md Menu sheet; Scaffold deltas lack the define/override: close-out spine edit.
