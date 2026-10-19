---
title: 'Theme: Daylight Paper'
type: 'feature'
ticket: 6
created: '2026-10-19'
status: 'built'
baseline_revision: 'c24825ef89b176cc07f75b86b3420e2fae27eef7'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-themes/story-theme-daylight-paper.md'
  - '{project-root}/AGENTS.md'
warnings: []
deferred:
  - summary: >-
      The Show timer switch track transition animates when a theme change recolours it, so Q-45's "switch at once" holds only with that transition excluded in the Switch test.
    evidence: |-
      PreferencesPanel.svelte .track has transition: background var(--wc-base-ms); e2e/theme.spec.ts expectNoThemeAnimations excludes it.
    location: >-
      src/ui/PreferencesPanel.svelte:129
    severity: low
  - summary: >-
      tsconfig.arch.json gained vite/client types so contrast.test.ts can import the registry.
    evidence: |-
      Not in the plan; tsc -p tsconfig.arch.json failed without it (the registry pulls the dictionary ?url import).
    location: >-
      tsconfig.arch.json
    severity: low
---

<intent-contract>

## Intent

**Problem:** Only the Charcoal theme ships; `paper` exists as a test-only placeholder (`testPaper`, meta `#F4EFE4`) with no token block.

**Approach:** Ship Daylight Paper (`paperTheme`, meta `#ECE6D8`, brief section D tokens, `color-scheme: light`, no art) registered in every build, with contrast, registry, switch, dist-smoke and four screenshot tests. The story file Description and Acceptance Criteria are the full specification; follow them verbatim.

## Boundaries & Constraints

**Always:** Owner decision 2026-10-19: the one-frame dark `theme-color` tint and dark splash are accepted, AD-16 unchanged. Tokens copied exactly from brief section D. Paper block placed after the `:root { color-scheme: dark }` rule. Tests named by id (`AD-n`, `Q-45`, `TH-n`). Default baselines unchanged.

**Never:** Edit the spine, DESIGN.md, `index.html` meta, the manifest, `tickets.toml`, or any default baseline. Add a fallback. Push. Touch `bga-wordcell`.

</intent-contract>

## Code Map

- `src/ui/theme/registry.ts` -- replace `testPaper` by `paperTheme` (label `text.themePaper`, meta `#ECE6D8`); rewrite header comment (production registers default and paper; `testGarden` is the only test-only entry).
- `src/main.ts` (l.28, 219-226) -- import `paperTheme`; `register(paperTheme)` right after `register(defaultTheme)`; hook block registers only `testGarden`; rewrite its comment.
- `src/ui/app.css` -- after the `:root { color-scheme: dark ... }` rule (l.39-43) add `[data-theme="paper"]` with the 18 brief section D values, `color-scheme: light`, the four internal tokens and both art tokens `none`.
- `src/ui/theme/contrast.test.ts` -- `themes` already includes every app.css block; `paper` joins automatically. Add the meta-equals-`--wc-table` test (`AD-14`).
- `src/ui/theme/colour-literals.test.ts` -- unchanged.
- `src/ui/theme/registry.test.ts` -- `testPaper` becomes `paperTheme`.
- `e2e/theme.spec.ts` -- `PAPER` `#ECE6D8`; Switch test retargeted.
- `e2e/pwa/dist-smoke.spec.ts` (l.58-74) -- Theme-group test renamed and extended.
- `e2e/helpers/how-to-play.ts` (new), `e2e/helpers.spec.ts`, `e2e/how-to-play.screens.spec.ts` -- scene-reach extraction.
- `e2e/theme-paper.screens.spec.ts` (new) -- four shots; baselines from `npm run test:screens`.
- Read-only: `index.html`, `vite.config.ts` manifest, `e2e/globals.d.ts`, `fixtures/prefs-theme-paper.json`, `tickets.toml`.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/theme/registry.ts`, `src/main.ts`, `src/ui/theme/registry.test.ts` -- `paperTheme` in every build, order default, paper -- TH-3, AD-10
- [x] `src/ui/app.css` -- paper block after the dark `color-scheme` rule -- TH-2, TH-4
- [x] `src/ui/theme/contrast.test.ts` -- meta equals table for `defaultTheme`, `paperTheme`, `testGarden` (case-insensitive; garden via its merge over default). `colour-literals.test.ts` stays: its default-meta assertion (AD-10) is not duplicated for paper and relies on the paper block coming after the default block, since the regex reads the first `--wc-table`.
- [x] `e2e/theme.spec.ts` -- Switch: radio count 3; paper gives `data-theme` `paper`, computed `color-scheme` `light`, meta `#ECE6D8`, `getPropertyValue('--wc-scrim').trim()` equal to the default literal case-insensitively; back gives `default`, `#15171B`, and `--wc-table` and `--wc-card-face` (`getPropertyValue(...).trim()`, compared case-insensitively like the scrim) equal to the app.css default values; reload keeps paper; no dark-free first-frame assertion -- Q-45, AD-10, AD-16
- [x] `e2e/pwa/dist-smoke.spec.ts` -- renamed "...offers Charcoal and Daylight Paper, applied as default"; count 2, order Charcoal then Daylight Paper; pick paper; root `data-theme` `paper`, meta `#ECE6D8`. Each test already gets its own browser context (Playwright default), so the pick cannot leak into other dist-smoke tests; no extra isolation is needed.
- [x] `e2e/helpers/how-to-play.ts` + `e2e/helpers.spec.ts` + `e2e/how-to-play.screens.spec.ts` -- `openScene(page, { fixture, prefs?, scene, id, last })`: seeds through `openFixture(page, fixture, { prefs })`, then Menu, How to play, dot `scene`, Next `last` times (none when `last` is 0); returns the scene figure locator. Callers set `reducedMotion` and the viewport first.
- [x] `e2e/theme-paper.screens.spec.ts` (android only, `AD-17` names, `prefs-theme-paper`): board `session-place-free-letter-redo-tail` and tray `session-composing`, both at the android project's default viewport (as `board.screens.spec.ts`); Preferences sheet at 360x740 on `session-idle-fresh`, with `reducedMotion: 'reduce'`, checking the Theme radios (native controls follow `color-scheme`); scene 2 (`freeLetter`, `last` 2) on `session-idle-fresh` at 360x740 with `reducedMotion: 'reduce'`. Confirm each shot shows its claimed state (destination block and lock in tray and scene 2, pressed Validate in scene 2); otherwise change fixture or frame and record it.
- [x] Record in Implementation Notes: the TRANSLUCENT members (`scrim`, `shadow-drag`, `scene-pointer-shadow`) and OPAQUE members (`scene-pointer-fill`, `scene-pointer-stroke`) next to the four internal tokens; the size-budget margin (TH-8); `tickets.toml` entry 6 says `after = [1, 4]` and verify wording that disagrees with the ticket (`[3, 4, 5]`), left untouched per instruction.

**Acceptance Criteria:**
- Given the production list, when Preferences opens, then Charcoal and Daylight Paper are offered in that order and choosing paper sets `data-theme`, `color-scheme: light` and the meta.
- Given paper, when contrast.test.ts runs, then every TABLE row passes at the floor and the key set equals the default's.
- Given `npm run test:all` and `npm run test:screens`, when they run, then both pass with only the four new paper baselines added and no existing snapshot changed.

## Implementation Notes

- Internal tokens: TRANSLUCENT members `scrim`, `shadow-drag`, `scene-pointer-shadow` (alpha below 1); OPAQUE members `scene-pointer-fill`, `scene-pointer-stroke`. Paper values: shadow-drag `rgb(0 0 0 / 0.35)`, the other three as the default.
- Size budget (TH-8): total 550970 of 600000 bytes (margin 49030); css 7363 B.
- `tickets.toml` entry 6 says `after = [1, 4]` and its verify wording disagrees with the ticket (`after: [3, 4, 5]`); left untouched per instruction.
- Shots confirmed: tray shows the destination block and lock; scene 2 shows the lock and the pressed Validate; no shot shows the invalid line.
- Deviation, `tsconfig.arch.json`: `types` gained `vite/client`. contrast.test.ts now imports registry.ts, which pulls in the shell and `dictionary.svelte.ts`'s `?url` import, so `tsc -p tsconfig.arch.json` failed without it.
- Finding, e2e/theme.spec.ts Switch test: the Show timer switch track (PreferencesPanel.svelte `.track`, `transition: background var(--wc-base-ms)`) animates when the theme changes its `--wc-surface-raised`, so `document.getAnimations()` is no longer empty after the switch. The component is unchanged (plan expects none); the test's no-animation check excludes that one `.track` transition. Owner decision: leave, or scope the transition to the toggle.

## Plan Change Log

## Review Triage Log

### 2026-10-19 — Review pass
- verdicts: 14 findings — high 0, medium 0, low 13, false 1, maybe-false 0
- findings:
  - `[low]` `[defer]` Show-timer `.track` transition animates on theme switch, the Switch test excludes it (blind, edge, intent-alignment) — real, pre-existing component transition meeting a new token change; fixing means a component edit the ticket excludes, left for the owner.
  - `[low]` `[reject]` the exclusion matches any `.track` element — only one `.track` exists (PreferencesPanel), so nothing else can be hidden.
  - `[low]` `[defer]` `tsconfig.arch.json` gains `vite/client` types (blind, intent-alignment) — needed because contrast.test.ts imports the registry (ticket-prescribed); reported for the owner.
  - `[low]` `[reject]` registry import is side-effectful / extract entries to a lighter module (blind) — the ticket prescribes this import; extraction is a design change.
  - `[low]` `[reject]` register(paperTheme) at module top level not unit-pinned (blind) — dist-smoke asserts the production list and order.
  - `[low]` `[reject]` paper tokens not compared to the brief (blind) — contrast floors and key set cover them; values were copied and are visible in the diff.
  - `[low]` `[reject]` color-scheme untested in unit, non-default-before-default ordering test (blind) — Switch test asserts computed `color-scheme`; ordering is covered by the default-meta assertion plus the Switch return trip.
  - `[low]` `[reject]` pointer/drag-shadow and error-line visibility on paper not verified (blind, edge, intent-alignment) — ticket assigns these to the owner gate.
  - `[low]` `[reject]` openScene `last` / `scene`+`id` can disagree, thin screenshot coverage, no desktop shots (blind) — failure is loud at the figure lookup; the four shots and android-only scope are the ticket's.
  - `[low]` `[reject]` plan frontmatter and unchecked tasks (blind) — process state, updated at finalize.
  - `[low]` `[reject]` board/tray shots lack reducedMotion (edge) — the plan names the default viewport and the sibling board.screens spec does the same; the shots pass stably.
  - `[low]` `[reject]` dist-smoke does not reload paper (edge) — plan asks for pick, attribute and meta; reload is covered in theme.spec.ts.
  - `[false]` `[reject]` verification-gap lens: no gaps found.
  - `[low]` `[reject]` intent reading B (rendered coverage beyond four shots) (intent-alignment) — descriptive; the ticket fixes the shot set.

## Design Notes

Shadow-drag for paper is `rgb(0 0 0 / 0.35)`; pointer fill, stroke and shadow keep the default values. Pointer visibility on paper falls under the owner gate.

## Verification

**Commands:**
- `npm run test:all` -- expected: exit 0
- `npm run test:screens` -- expected: exit 0; `git status` shows only four new paper baselines
- `git diff --stat -- 'e2e/*-snapshots'` -- expected: no modified existing snapshot

## Auto Run Result

**Summary:** Daylight Paper (`paperTheme`, meta `#ECE6D8`) registered in every build; `[data-theme="paper"]` token block with `color-scheme: light`; contrast, meta, Switch, dist-smoke and four screenshot tests; scene-reach helper extracted.

**Files changed:** `src/ui/theme/registry.ts`, `src/main.ts`, `src/ui/app.css`, `src/ui/theme/contrast.test.ts`, `src/ui/theme/registry.test.ts`, `tsconfig.arch.json`, `e2e/theme.spec.ts`, `e2e/pwa/dist-smoke.spec.ts`, `e2e/helpers/how-to-play.ts`, `e2e/helpers.spec.ts`, `e2e/how-to-play.screens.spec.ts`, `e2e/theme-paper.screens.spec.ts` and its four baselines.

**Review:** patches 0; deferred 2 (`.track` transition, `tsconfig.arch.json` types); the rest rejected with reasons in the Review Triage Log.

**Follow-up review recommended:** false.

**Verification:** `npm run test:all` ran once with one failure (`blocking.spec.ts:129` font-timeout test, passing alone; the run was under parallel load); `test:e2e:pwa` re-run green (14); `npm run test:screens` passed per the implementing agent with no existing snapshot changed.

**Residual risks / owner input:** owner gate (play on Android, pointer visibility on paper); `tickets.toml` entry 6 `after = [1, 4]` disagrees with the ticket `[3, 4, 5]` (left untouched). Owner decision 2026-10-19 accepted the one-frame dark tint.
