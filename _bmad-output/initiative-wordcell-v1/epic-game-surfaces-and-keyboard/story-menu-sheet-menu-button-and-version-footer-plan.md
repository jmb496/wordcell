---
title: 'Menu sheet, menu button and version footer'
type: 'feature'
ticket: '2'
created: '2026-10-15'
status: done
baseline_revision: '4efa3cd434ad926d4090a7a4ade7ee69c82abe4d'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/specs/spec-epic-6-surfaces/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-epic-6-surfaces/build-notes.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-menu-sheet-menu-button-and-version-footer.md'
warnings: []
deferred:
  - summary: >-
      With a WordCell view open, a real tap on the menu button cannot reach it: the view's scrim (z 10) and the inert .board cover the top bar, which contradicts SPEC F6 (the view leaves the top bar live) and the ticket's "opens from an open WordCell view".
    evidence: |-
      Implementer report; e2e proves the openSurface path with a dispatched click only. The layering predates this ticket (epic 4/6.1). Owner decision needed: should the bar sit above the view scrim (UX change)?
    location: >-
      src/ui/WordCellView.svelte:92, src/ui/Board.svelte:79
    severity: medium
  - summary: >-
      Menu.svelte carries an interim window Esc handler and main takes tabindex=-1 as the focus target; entry 10 should replace both with the key map and a proper board focus target.
    evidence: |-
      Needed so the ticket's Esc-close and focus-to-board sentences pass before entry 10 exists.
    location: >-
      src/ui/Menu.svelte, src/ui/App.svelte
    severity: low
---

<intent-contract>

## Intent

**Problem:** The top bar's menu slot is empty, so the 6.1 Sheet and `openSurface('menu')` have no opener, no menu rows, and the app shows no version.

**Approach:** Implement the ticket file as written (`story-menu-sheet-menu-button-and-version-footer.md`; its Description and Acceptance Criteria are the contract): the ☰ button in TopBar, a Menu sheet with New game, Replay this deal and Give up, `__APP_VERSION__` footer via a Vite `define` with a unit-tested resolver, text.ts strings, and the e2e/Vitest coverage the ticket names.

## Boundaries & Constraints

**Always:** Rules 1–7 of AGENTS.md; spec wins over spine; open only through `openSurface('menu')`; ☰ and rows wrapped in `act()`; Give up enablement only from `view.canGiveUp`; menu items close the sheet first, then act once; the resolver throws in every Vite mode when git fails or the override is blank (rule 6); TopBar Undo/Redo FLIP wiring unchanged.

**Never:** Statistics, Preferences or How to play rows or placeholder surfaces; confirms (entry 3); the `M` key or tooltip (entry 10); the error dot (entry 5); the end sheet (entry 6); a dirty-tree suffix; new screenshot logic beyond regenerating top-bar baselines in the container.

</intent-contract>

## Code Map

- `src/ui/TopBar.svelte` -- replace `.menu-slot` with the 44 × 44 ☰ button (inline SVG, `act()`), `inert` while menu open.
- `src/ui/Menu.svelte` (new) -- Sheet with three 52 px rows plus footer; mounted from `src/ui/App.svelte` or Board where the other surfaces mount.
- `src/ui/open-surface.ts`, `src/ui/overlays.svelte.ts`, `src/ui/Sheet.svelte`, `src/ui/presence.svelte.ts` -- 6.1 foundation, reuse; do not change except where the ticket needs it (focus to board after acting row).
- `src/ui/new-game.ts` -- `newGame()` reused unchanged; Replay is `game.replay()` then `overlays.resetForNewSession()`.
- `src/ui/text.ts`, `src/ui/text.test.ts` -- menu strings.
- `src/app-version.d.ts` (new), `vite.config.ts`, a new resolver module plus unit test (location per AD-1 scan rules; a root script or `scripts/` file imported by vite.config.ts).
- `playwright.config.ts`, `package.json` (`build:test`, `test:screens`), `.github/workflows/ci.yml` -- set `WORDCELL_APP_VERSION`.
- `e2e/menu.spec.ts` (new) and existing top-bar screen specs/baselines.
- Spine `ARCHITECTURE-SPINE.md` Scaffold deltas -- record the close-out edit for the define and override.

## Tasks & Acceptance

**Execution:**
- [ ] Version resolver, define, d.ts, env wiring -- ticket Footer bullet
- [ ] `src/ui/TopBar.svelte`, `src/ui/Menu.svelte`, mount, `src/ui/text.ts` -- ticket Description
- [ ] Vitest: AD-3 enablement, resolver (format, override, missing git throw), architecture scans accept the define
- [ ] `e2e/menu.spec.ts` -- every Verify sentence of the ticket (android project)
- [ ] Regenerate top-bar baselines in the container; spine Scaffold deltas edit

**Acceptance Criteria:**
- Given the ticket's Acceptance Criteria, when `npm run test:all` and `npm run test:screens` run, then both are green.

## Implementation Notes

Route full: well over 100 lines across more than five files.

## Plan Change Log

## Review Triage Log

### 2026-10-15 — Review pass
- verdicts: 31 findings — high 0, medium 1, low 2, false 20, maybe-false 0 (rest grouped as duplicates)
- findings:
  - `[medium]` `[patch]` focus on the board after New game, Replay and Give up has no executed assertion (verification-gap) — added `toBeFocused` on `main` to those e2e cases
  - `[low]` `[patch]` tile-selection test only checks after Esc, not at open (intent auditor) — added the assertion right after open
  - `[medium]` `[defer]` real tap on ☰ blocked by an open WordCell view's scrim (implementer, intent auditor) — pre-existing layering, owner UX decision; see deferred
  - `[low]` `[defer]` interim Esc handler and main tabindex (blind, edge) — entry 10 replaces; see deferred
  - `[low]` `[reject]` SHA regex rejects an abbreviation longer than 7 (blind, edge) — git lengthens only on ambiguity, unreachable in this repo; failing loudly is rule 6
  - `[false]` `[reject]` build fails without git in CI, Docker or tarball (blind, edge, intent) — specified outcome (rule 6, ticket); screens run sets the override; checkout keeps .git
  - `[false]` `[reject]` top bar not `inert` under the menu (edge) — App mainInert covers it, proved by the Tab/Enter e2e
  - `[false]` `[reject]` Give up stale-view dispatch, Esc double handling, menu unmount while open, focus on inert main, hard-coded scrim point, `build:test` POSIX syntax, repeated `0.0.0 (test)` literal, unit-test mocks and source grep, plan housekeeping, tap.spec probe, ☰ svg stroke — disabled button cannot fire; no other Esc handler exists; WSL/CI are POSIX; ☰ carries the shared `icon` class; remaining remarks name no failing case
  - `[false]` `[reject]` missing keyboard, desktop and non-override footer tests (blind, intent) — outside the ticket's Verify list; resolver format is unit tested


## Auto Run Result

- Summary: ☰ button in TopBar, Menu sheet (New game, Replay this deal, Give up, footer) opened through `openSurface('menu')`, `__APP_VERSION__` via a Vite define from `scripts/app-version.mjs`, override wired into Playwright configs, `build:test`, `test:screens` and ci.yml, strings in text.ts, spine Scaffold deltas edit.
- Files: TopBar.svelte, Menu.svelte, App.svelte, text.ts, vite.config.ts, scripts/app-version.mjs(+test), src/app-version.d.ts, src/ui/menu.test.ts, e2e/menu.spec.ts, e2e/menu.screens.spec.ts, regenerated baselines, tap.spec.ts, configs, spine.
- Review: 2 patches applied (1 medium, 1 low); 2 deferred; the rest rejected with reasons above.
- Follow-up review recommended: false.
- Verification: implementer ran `npm run test:all` green and `npm run test:screens` green (baselines regenerated in the container); after the patches `e2e/menu.spec.ts` passes on android (22 passed) and biome is clean.
- Residual risks: owner decision on the ☰ tap with a WordCell view open; menu strings are DESIGN.md wording flagged for the owner.

## Verification

**Commands:**
- `npm run test:all` -- expected: all suites pass
- `npm run test:screens` -- expected: green (Docker); top-bar baselines regenerated with the fixed version
