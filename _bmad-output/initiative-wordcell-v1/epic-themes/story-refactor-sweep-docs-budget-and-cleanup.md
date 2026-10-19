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

1. Carry-overs from 9.9 and the digest:
   - (a) Steampunk contrast assertion (unapplied minor of 9.9): add it to the contrast harness over the same pairs and floors as the contrast.test.ts TABLE. A failing pair goes to the owner; floors are never loosened.
   - (b) DESIGN.md line 243 texture %: read the as-built texture opacities in the theme art data; if "flat tiled patterns at 6 % opacity or less" disagrees, propose the corrected figure for owner approval.
   - (c) Sixth theme radio (Plum Dusk) in view at 360 px on the `android` project, test named by AD-n/Q-n.
   - (d) The retired Halted-on-unregistered-theme boot path (item 5).
   - (e) Board-keys / win-guard load-dependent desktop flakiness (digest 9.3-9.8): investigate and record the cause or the decision to leave it. "Green" means one clean run, any rerun recorded.
2. Dead tokens and scaffolding. Pass condition: every `--wc-*` token declared in the theme/token files is read in `src/**` (CSS, `.svelte` markup and style blocks, inline style strings) or by the contrast tests, apart from a short allow-list of deliberately art-only tokens. Scaffolding means temporary registry entries, test-only theme hooks and dev-only probes the epic introduced; the build names what it finds. An empty result is valid but is recorded with the search used. A kept unit test or a one-off search is the build's choice (default: a one-off search recorded in the plan, unless a cheap permanent test fits the existing architecture tests).
3. Doc confirmation against the built code: DESIGN.md (A-D1, Colors, Avoid list, Themes), EXPERIENCE.md Preferences, spec §7.10, AD-10, AD-7, AD-16. Pass condition: each describes the five themes and the theme preference as built (TH-7, epic Done-when 5). The build only proposes edits; edits to the spec, spine and UX docs go to the owner (AGENTS.md rule 7). A spec/spine disagreement is reported, not resolved.
4. Budget (TH-8): the measure is the gzip-9 total that `npm run build` prints via scripts/size-budget.mjs (AD-18, `dist/`). The plan records total, the 600,000 limit and the margin. Over budget: stop and report to the owner; do not trim themes. Also confirm `dependencies` in package.json is unchanged since the epic's first commit (by diff).
5. Halted-on-unregistered-theme boot path (9.10 retired its e2e test). First read src/shell/prefs.svelte.ts and the 9.10 plan. As read, `parsePrefs` rejects any theme outside `THEMES` as contents-unreadable, a silent default (Q-36, tests in prefs.svelte.test.ts, lines ~183 and ~390), so Halted is reachable only if `ThemeId` gains an id the registry lacks. Record Q-36 as the covering behaviour with those tests; if the build finds a path to the AD-15 Halted surface, add a unit/boot test (a `*-invalid-*` fixture e2e only if cheap).
6. Deferred findings: a table in the plan (source ticket, finding, disposition: fixed here / deferred with reason / owner call). Sources: the epic digest, the plans and review logs of 9.1-9.10, and `_bmad-output/implementation-artifacts/review-loop/9-*-build.md`. It includes the digest items: `#15171B` status bar vs `#17121C` page (9.10), scene pointer colours on plum, Epic 8 retro not yet marked done. Only items in this Scope are fixed; nothing that changes UX is applied without the owner.
7. The TH-2 scan and the per-theme contrast tests stay green; theme test files are still in tsconfig.app.json and tsconfig.arch.json (digest 9.3).
8. Check the board dependency data for entries 6-10 (`after`, e.g. entry 6 `after=[1,4]`, digest 9.6) against the epic note; report, do not hand-edit the board.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green, the build size is under 600,000 bytes with the margin recorded, and no unused token or theme scaffolding remains (item 2).

- `npm run test:screens` runs only in Docker (AGENTS.md). No committed baseline may change in this ticket (TH-4); a changed baseline means the cleanup altered visuals, so revert it.
- Owner checkpoint after built: the owner reads the doc-edit proposals and the deferred table before it is marked done (docs/development-methodology.md, Definition of done).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-themes/epic-themes.md
- constraint — docs/development-methodology.md, Definition of done
