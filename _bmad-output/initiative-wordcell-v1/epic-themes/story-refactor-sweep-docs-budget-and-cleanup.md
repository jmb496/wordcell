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

Removes dead tokens and temporary theme scaffolding, confirms the docs match what was built, measures the bundle against the 600,000-byte budget, and lists findings deferred during the epic.

Unattended build (`hitl: false`); it stops at built, only the owner marks it done.

## Scope

1. Carry-overs from 9.9 and the digest ("five themes" = the default plus five, six ids):
   - (a) Steampunk contrast (9.9 minor: "art-token test covers garden only"). The per-theme `it.each` in contrast.test.ts already covers steampunk's floors. Steampunk declares both art tokens in app.css, so add a case "AD-14 steampunk sets both art tokens in app.css" asserting `parseArt` is non-null for each, as the garden case does. Floors only; a failing pair goes to the owner, floors are never loosened.
   - (b) Compare all six theme records' table-art and card-texture opacity with the DESIGN.md sentence "flat tiled patterns at 6 % opacity or less" (cite the sentence, not the line); contrast.test.ts already enforces the 6 % ceiling. A mismatch is a proposed corrected figure for the owner, and a row in item 3's table.
   - (c) Plum Dusk radio at 360 px: a new case in theme.spec.ts (`android`, named by AD-10) sets the viewport width to 360 first, scrolls the radio into view once, then asserts its box lies within [0,360] horizontally and, vertically, inside the sheet body and clear of the sticky bars. No screenshot baseline.
   - (d) The retired Halted-on-unregistered-theme boot path (item 5).
   - (e) Board-keys / win-guard load-dependent desktop flakiness (digest 9.3-9.8): run the two specs 10 times on desktop (scripts/flaky-report.mjs or a loop); record failures/10 and the failing names. A test-only fix (wait/locator) is allowed. Production-code, timeout, worker-count or retry changes are an owner call (rules 6, 7). "Leave it" needs that evidence. A rerun counts as green only with the failing test names recorded.
2. Dead tokens and scaffolding. Pass condition: every `--wc-*` token declared in src/ui/app.css and the theme data modules (src/ui/theme/art.ts, registry.ts, colour-literals.ts) has a read: a reference outside declaration sites (`var(--wc-x)`, a string literal or `getPropertyValue`) in non-test `src/**/*.{css,ts,svelte}` or index.html. Comments, the declaring file's own key lists and reads inside an unread token's own declaration do not count (follow `var()` chains); iterating a token set or `check()` does not count. Test-only reads (a contrast test naming the token), art-data-only tokens and dynamic-name sites (e.g. `--wc-${x}`) go on an allow-list in the plan with a reason each. Scaffolding means temporary registry entries, test-only theme hooks and dev-only probes the epic introduced (grep `register(`, `__theme`, `import.meta.env.DEV` in src/); AD-17 hooks declared in e2e/globals.d.ts are not scaffolding. The plan records what is found, or an empty result with the search used (a one-off search is the default).
3. Doc confirmation against the built code: DESIGN.md (A-D1, Colors, Avoid list, Themes), EXPERIENCE.md Preferences, spec §7.10, AD-10, AD-7, AD-16. Pass condition: each describes the five themes and the theme preference as built (TH-7, epic Done-when 5). The plan records a per-surface table (surface, as built, matches yes/no, old -> new text, reason), including theme order and ids vs spec §7.10, Colors floors vs contrast.test.ts, the 9.5 default-theme-only sentence, and 1(b). The build edits none of these docs; edits go to the owner (rule 7). A spec/spine disagreement is reported, not resolved.
4. Budget (TH-8): the measure is the gzip-9 total that `npm run build` prints via scripts/size-budget.mjs (AD-18, `dist/`), taken from a build on a clean tree at the recorded commit (commit cleanup edits first, locally), margin = 600000 minus N in the printed `total N / 600000`. Over budget (negative margin): stop and report to the owner; do not trim themes. Also confirm `dependencies` is unchanged since the epic's first commit 0f295f2: `node -p "const d=(j)=>JSON.stringify(JSON.parse(j).dependencies??null);d(require('child_process').execSync('git show 0f295f2^:package.json'))+' '+d(require('fs').readFileSync('package.json','utf8'))"` must print two equal values  (both `null` today); report the output.
5. Halted-on-unregistered-theme boot path (9.10 retired its e2e test). First read src/shell/prefs.svelte.ts and the 9.10 plan. As read, `parsePrefs` rejects any theme outside `THEMES` as contents-unreadable, a silent default (Q-36, covered by the prefs.svelte.test.ts tests that reject an unknown theme, cited by title, and the theme.spec.ts e2e 'Q-36 an unknown theme value boots the default theme and leaves the key untouched until a setter', which covers the boot). Halted is reachable only if `ThemeId` gains an id the registry lacks. ThemeId, prefs `THEMES` (private, prefs.svelte.ts) and the registry ids are three lists: add 'AD-10 ThemeId, prefs themes and registry ids agree' to src/ui/theme/registry.test.ts: drive the real `parsePrefs` with every `entries()` id (accepted) and a foreign id (rejected), assert the ids equal the §7.10 order, and compare `ThemeId` to the ids by an exhaustive type check. Do not export or derive THEMES (rule 7). A divergence is a bug to fix (rule 6). If the build finds another path to the AD-15 Halted surface, add a unit/boot test.
6. Deferred findings: a table in the plan (source ticket, finding, disposition: fixed here / deferred with reason / owner call). Sources: the epic digest, the plans and review logs of 9.1-9.10, and the build logs. Every "Worth knowing:" line and unapplied-minor mention in the digest for 9.3-9.10 gets a row; the count is checked against `grep -n "Worth knowing\|unapplied\|minors" <digest>` (9.3-9.10 entries) and the 9.1-9.10 logs. "Fixed here" applies only to items already in items 1-5 or 7. Pre-assigned: `#15171B` status bar vs `#17121C` page and the scene pointer colours on plum = owner call; Epic 8 retro not yet marked done = owner action, no change here; outstanding Android play-tests of Deep Space, Greenhouse Dusk, Brass and Walnut and Plum Dusk = owner call. Nothing changing UX is applied without the owner.
7. The TH-2 scan and the per-theme contrast tests stay green; every `src/ui/theme/*.ts` and `*.test.ts` is type-checked by exactly one of tsconfig.app.json (include `src/**`, minus its exclude list) and tsconfig.arch.json (its `files` list, which mirrors that exclude list); the file-to-config mapping goes in the plan, a file in neither is a defect, and no tsconfig is edited.
8. Check the board dependency data for entries 6-10 (`after`, e.g. entry 6 `after=[1,4]`, digest 9.6) against epic-themes.md and its ticket order; a plan row per entry; a clean result is valid; report, do not hand-edit the board.

## Acceptance Criteria

Verify: npm run test:all is green, npm run test:screens is green or recorded as left to the owner (no Docker), the build size is under 600,000 bytes with the margin recorded, the item 4 `dependencies` comparison prints equal values, and no unused token or theme scaffolding remains (item 2).

- `npm run test:screens` runs only in Docker (AGENTS.md). No baseline may change (TH-4): `git status --porcelain` shows nothing under the screenshot directories after the run; a change means the cleanup altered visuals, so revert it.
- Owner checkpoint after built: the owner reads the doc-edit proposals and the deferred table before it is marked done (docs/development-methodology.md, Definition of done).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-themes/epic-themes.md
- constraint — docs/development-methodology.md, Definition of done
- evidence — _bmad-output/implementation-artifacts/autopilot/epic-themes-20261018-1343.md (digest)
- evidence — _bmad-output/implementation-artifacts/review-loop/9-*-build.md (build review logs)
