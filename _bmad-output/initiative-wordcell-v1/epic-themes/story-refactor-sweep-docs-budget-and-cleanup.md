---
id: 11
type: story
title: "Refactor sweep: docs, budget and cleanup"
parent: epic-themes
covers: [TH-7, TH-8]
after: [3, 4, 5, 6, 7, 8, 9, 10]
risk: low
hitl: false
done_checkpoint: true
---

# Refactor sweep: docs, budget and cleanup

## Description

Removes dead tokens and any temporary theme scaffolding, confirms the spec, UX docs and spine match what was built, measures the bundle against the 600,000-byte budget and records the margin, and lists review findings deferred during the epic.

Entry 11 fields: `risk: low`, `done_checkpoint: true`, `hitl: false` (the build runs unattended). The build stops at built; only the owner marks it done.

## Scope

1. Carry-overs from 9.9 and the digest ("five themes" = the default plus five, six ids):
   - (a) Steampunk contrast (9.9 minor: "art-token test covers garden only"). The generic per-theme `it.each` in contrast.test.ts already covers steampunk's floors. The build either adds a steampunk case to the test titled "AD-14 the default theme declares both art tokens none; garden sets both art tokens in app.css", or records the loop as the coverage. Floors only; a failing pair goes to the owner, floors are never loosened.
   - (b) Compare all six theme records' table-art and card-texture opacity with the DESIGN.md sentence "flat tiled patterns at 6 % opacity or less" (cite the sentence, not the line); contrast.test.ts already enforces the 6 % ceiling. A mismatch is a proposed corrected figure for the owner, and a row in item 3's table.
   - (c) Plum Dusk radio at 360 px: in the existing theme.spec.ts, `android` project, named by AD-10, assert its bounding box lies inside the 360 px viewport width and the preferences sheet and it is reachable (visible, or after at most one scroll of the sheet body, not clipped by the sticky bars). No screenshot baseline.
   - (d) The retired Halted-on-unregistered-theme boot path (item 5).
   - (e) Board-keys / win-guard load-dependent desktop flakiness (digest 9.3-9.8): gather evidence with scripts/flaky-report.mjs or repeated desktop runs; record the failure rate and the failing specs. A test-only fix (wait/locator) is allowed. Any production-code, timeout, worker-count or retry change is an owner call (rules 6, 7). "Leave it" needs that evidence. A rerun counts as green only with the failing test names recorded.
2. Dead tokens and scaffolding. Pass condition: every `--wc-*` token declared in src/ui/app.css and the theme data modules (src/ui/theme/art.ts, registry.ts, colour-literals.ts; verify) has a read: a reference outside declaration sites (`var(--wc-x)`, a string literal or `getPropertyValue` in non-test `src/**`). Iterating a token set or `check()` does not count; a contrast-test read counts only if the test names the token. Allow-list entries (art-data-only tokens) and dynamic-name sites (e.g. `--wc-${x}`) are listed in the plan with a reason each; the owner reads that list at the checkpoint. Scaffolding means temporary registry entries, test-only theme hooks and dev-only probes the epic introduced; AD-17 hooks declared in e2e/globals.d.ts are not scaffolding. The build names what it finds; an empty result is valid but recorded with the search used. A one-off search recorded in the plan is the default, unless a cheap permanent test fits the architecture tests.
3. Doc confirmation against the built code: DESIGN.md (A-D1, Colors, Avoid list, Themes), EXPERIENCE.md Preferences, spec §7.10, AD-10, AD-7, AD-16. Pass condition: each describes the five themes and the theme preference as built (TH-7, epic Done-when 5). The plan records a per-surface table (surface, as built, matches yes/no, proposed old text -> new text, reason), including theme order and ids vs spec §7.10, Colors floors vs contrast.test.ts, the 9.5 default-theme-only sentence, and 1(b) as a row. The build edits none of these docs; edits go to the owner (rule 7). A spec/spine disagreement is reported, not resolved.
4. Budget (TH-8): the measure is the gzip-9 total that `npm run build` prints via scripts/size-budget.mjs (AD-18, `dist/`), taken from a build run after the last cleanup edit and recorded with the commit hash, with the 600,000 limit and the margin. Over budget (negative margin): stop and report to the owner; do not trim themes. Also confirm `dependencies` is unchanged: `git diff 0f295f2^ -- package.json`, `dependencies` key only (the epic's first commit is 0f295f2); report the output or mark `unverified`.
5. Halted-on-unregistered-theme boot path (9.10 retired its e2e test). First read src/shell/prefs.svelte.ts and the 9.10 plan. As read, `parsePrefs` rejects any theme outside `THEMES` as contents-unreadable, a silent default (Q-36, covered by the prefs.svelte.test.ts tests that reject an unknown theme; cite them by name, not line). Halted is reachable only if `ThemeId` gains an id the registry lacks. ThemeId, prefs `THEMES` and the registry ids are three lists: add one unit test that they agree (default; do not derive THEMES from the registry, that needs owner approval, rule 7). A divergence is a bug to fix (rule 6), not a fallback. If the build finds a path to the AD-15 Halted surface, add a unit/boot test (a `*-invalid-*` fixture e2e only if cheap).
6. Deferred findings: a table in the plan (source ticket, finding, disposition: fixed here / deferred with reason / owner call). Sources: the epic digest, the plans and review logs of 9.1-9.10, and the build logs. Every digest "Worth knowing" and unapplied-minor entry for 9.3-9.10 gets a row; the row count is checked against a grep of those sources. "Fixed here" applies only to items already in items 1-5 or 7. Pre-assigned: `#15171B` status bar vs `#17121C` page and the scene pointer colours on plum = owner call; Epic 8 retro not yet marked done = owner action, no change here; outstanding Android play-tests of Deep Space, Greenhouse Dusk, Brass and Walnut and Plum Dusk (epic Done-when 5) = owner call. Nothing that changes UX is applied without the owner.
7. The TH-2 scan and the per-theme contrast tests stay green; every `src/ui/theme/*.test.ts` is covered by tsconfig.app.json and tsconfig.arch.json (digest 9.3); the result is recorded in the plan.
8. Check the board dependency data for entries 6-10 (`after`, e.g. entry 6 `after=[1,4]`, digest 9.6) against epic-themes.md and its ticket order; a plan table row per entry; a clean result is valid; report, do not hand-edit the board.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green, the build size is under 600,000 bytes with the margin recorded, and no unused token or theme scaffolding remains (item 2).

- `npm run test:screens` runs only in Docker (AGENTS.md). No committed baseline may change in this ticket (TH-4): `git status` shows no change under the screenshot directories after the run; a change means the cleanup altered visuals, so revert it. If the build cannot run Docker, record that and leave the run to the owner.
- Owner checkpoint after built: the owner reads the doc-edit proposals and the deferred table before it is marked done (docs/development-methodology.md, Definition of done).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-themes/epic-themes.md
- constraint — docs/development-methodology.md, Definition of done
- evidence — _bmad-output/implementation-artifacts/autopilot/epic-themes-20261018-1343.md (digest)
- evidence — _bmad-output/implementation-artifacts/review-loop/9-*-build.md (build review logs)
