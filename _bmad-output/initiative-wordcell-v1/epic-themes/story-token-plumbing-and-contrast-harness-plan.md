---
title: 'Token plumbing and contrast harness'
type: 'feature'
ticket: 'story-token-plumbing-and-contrast-harness'
created: '2026-10-18'
status: done
baseline_revision: '1e8ea3fb408e4d78c6f32111707dc9b5176a2a9e'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-themes/story-token-plumbing-and-contrast-harness.md'
  - '{project-root}/AGENTS.md'
warnings: []
deferred:
  - summary: >-
      Token sites (4 drag-layer shadows, Scene .ghost) are proven only by source-text assertions.
    evidence: |-
      No baseline or e2e reads their computed style; a Playwright computed-style check would settle it.
    location: >-
      src/ui/theme/colour-literals.test.ts
    severity: low
---

<intent-contract>

## Intent

**Problem:** Seven colour literals in `src/**` sit outside the `--wc-*` tokens, the default theme has no `[data-theme]` block, and nothing checks DESIGN.md contrast ratios or stops new literals.

**Approach:** Move the 7 literals onto 4 new tokens, restructure app.css so the default token block is `:root, [data-theme="default"]`, and add a contrast test plus a pure literal scan with a real-tree run. No visible change.

## Boundaries & Constraints

**Always:** The story file (`_bmad-output/initiative-wordcell-v1/epic-themes/story-token-plumbing-and-contrast-harness.md`) Description is the full specification: inventory, token names and exact values, Scene.svelte edit, scan scope and rules, contrast table, theme data format, test names (AD-14/AD-17 prefixes, never R-ids), placement under `src/ui/theme/`. Follow it verbatim. Token values equal the old literal text. Unit suite stays under the AD-17 budget.

**Never:** Regenerate or touch any screenshot baseline. Change `index.html` theme-color, the `vite.config.ts` manifest colour, or `color-scheme: dark`. Reuse a near-match token or round an alpha. Set a `data-theme` attribute (TH-3). Duplicate the default block. Push or modify `bga-wordcell`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Real tree | current src/** | scan reports zero violations | a .svelte parse error throws |
| Literal added | hex in a component style | scan returns a violation | n/a |
| Default theme | app.css default block | every ratio >= floor and round1 equals figure | fail with the pair |
| Low-contrast or comma-form record | inline record | contrast check fails | unparseable-value failure |

</intent-contract>

## Code Map

- `src/ui/app.css` -- token block in `:root` (lines ~10-30) moves to `:root, [data-theme="default"]`; `color-scheme`, `font-family`, `color` stay in a separate `:root` rule; add 4 tokens.
- `src/ui/Card.svelte`, `src/ui/Column.svelte`, `src/ui/WordCellRow.svelte`, `src/ui/tray/TileRows.svelte` -- one `box-shadow: 0 6px 16px #0008` each -> `var(--wc-shadow-drag)`.
- `src/ui/scenes/Scene.svelte` -- `fill`, `stroke`, drop-shadow literals -> tokens per the story.
- `src/architecture-scan.ts` -- model for loading the CJS `svelte/compiler` via `createRequire`; do not edit.
- `src/ui/theme/colour-literals.ts` (+ `.test.ts`), `src/ui/theme/contrast.test.ts` -- new.

## Tasks & Acceptance

**Execution:**
- [ ] `src/ui/app.css` -- restructure default block, add 4 tokens -- TH-2
- [ ] the 5 component files -- replace the 7 literals -- no visible change
- [ ] `src/ui/theme/colour-literals.ts` -- pure `scan(path, text, knownTokens)` and the runtime allowlist -- TH-4
- [ ] `src/ui/theme/colour-literals.test.ts` -- inline positives/negatives, per-site token assertions, real-tree run -- TH-4
- [ ] `src/ui/theme/contrast.test.ts` -- parser, ratio table, negative cases -- TH-5 ratio half

**Acceptance Criteria:**
- Given the repo, when `npm run test:all` runs, then it passes.
- Given the screenshot container, when `npm run test:screens` runs, then it passes and `git diff --exit-code` over `e2e/*.screens.spec.ts-snapshots` is empty.
- Given a hex literal added to a component, when the scan test runs, then it fails.

## Implementation Notes

Full route (about 180 lines of new test and scan code). Deviation: `tsconfig.app.json` excludes and `tsconfig.arch.json` includes the three `src/ui/theme/` files because they import `node:fs`, `node:path`, `node:module`; without it `npm run check` fails. Later theme test files need the same two entries.

## Plan Change Log

## Review Triage Log

### 2026-10-18 — Review pass
- verdicts: findings grouped by claim below (lens reports counted individually in the groups) — high 0, medium 0; patches 0; 2 deferred; rest false or rejected low
- findings:
  - `[false]` `[reject]` Scene `.ghost path` rule may not match or lose fill/stroke — the `<path>` is a descendant of `<svg class="ghost">` in the same component, so the scoped rule matches; test:all e2e passes; no other CSS targets the path.
  - `[low]` `[defer]` Token-site tests are source-text checks, not computed style (blind hunter, verification-gap, intent-alignment) — the story's Proof paragraph prescribes exactly this for the 4 drag-layer sites and `.ghost`; a computed-style Playwright check would settle it.
  - `[low]` `[reject]` Hand-rolled CSS/script scanning could miss unusual syntax (nested CSS, regex literals with quotes, `light-dark()`, system colours, markup expressions, short hex in script) — the story fixes the scan scope and the real tree scans clean; hardening is not worth the added complexity.
  - `[low]` `[reject]` Named-colour words like `tan` or `gold` as keyframe idents may false-positive — the story prescribes the standalone-identifier rule; the real tree has no such case.
  - `[false]` `[reject]` `[data-theme]` rule inside an at-rule wrapper goes unverified, and empty `it.each` — the story says wrappers are scanned and flagged; a missing default record already fails its own test.
  - `[false]` `[reject]` Percentage alpha in `rgb()` is unparseable — the story says any other rgb form is an unparseable-value failure.
  - `[low]` `[reject]` Rounding boundary, unrounded `${r}` in failure text, 0.03928 threshold, allowlist staleness, uncovered contrast pairs — the ratio set is fixed by the story's table; values are not at a boundary.
  - `[low]` `[defer]` tsconfig.app.json and tsconfig.arch.json list the 3 theme files, which later theme test files must also join — recorded in Implementation Notes; the deviation was needed so `npm run check` passes with node types.
  - `[false]` `[reject]` Plan file sections empty, AGENTS.md "Where things are" lacks `src/ui/theme/`, docs not updated — docs are TH-7 per the story; plan sections are filled at finalize.

## Verification

**Commands:**
- `npm run test:all` -- expected: exit 0
- `npm run test:screens` -- expected: exit 0, baselines unchanged (`git status` clean on snapshot dirs)

## Auto Run Result

**Summary:** The 7 colour literals now read 4 new `--wc-*` tokens, the default token block is `:root, [data-theme="default"]` in `src/ui/app.css`, and a contrast test plus a pure literal scan with a real-tree run were added. No visible change.

**Files changed:**
- `src/ui/app.css` -- default token block restructured, 4 tokens added
- `src/ui/Card.svelte`, `src/ui/Column.svelte`, `src/ui/WordCellRow.svelte`, `src/ui/tray/TileRows.svelte` -- drag shadow reads `--wc-shadow-drag`
- `src/ui/scenes/Scene.svelte` -- pointer fill, stroke and shadow read tokens
- `src/ui/theme/colour-literals.ts`, `colour-literals.test.ts`, `contrast.test.ts` -- new scan and contrast harness
- `tsconfig.app.json`, `tsconfig.arch.json` -- the 3 theme files moved to the node-types project

**Review:** patches applied 0; deferred 1 (computed-style check for the token sites without a baseline); every other finding rejected as false or low with its reason in the Review Triage Log.

**Follow-up review recommended:** false (no high, no medium patched).

**Verification:**
- `npm run test:screens` passed (42 passed, 18 skipped) and `git status` shows no snapshot change.
- `npm run test:all`: lint, check, unit (78 files, 2955 tests), build and the dist and PWA suites passed. The dev e2e suite had load-dependent flakes in two runs: 5 failures in the first, 2 in the second (`board-keys.spec.ts` Q-24 focus tests, `wordcell-view.spec.ts` AD-14 fade tests). Each failing spec passed when re-run alone, and the whole `board-keys.spec.ts` file passed (41 passed), so no clean single `test:all` exit 0 was observed. The owner should re-run `test:all` on an idle machine.

**Residual risks:** the scan is regex-based and does not scan markup expressions; later theme test files must also be added to the two tsconfig lists.
