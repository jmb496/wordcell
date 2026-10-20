---
title: 'Refactor sweep: docs, budget and cleanup'
type: 'chore'
ticket: 11
created: '2026-10-19'
status: done
baseline_revision: 'e701292090e471b2de503732e8fc47bb052dd7a4'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-themes/story-refactor-sweep-docs-budget-and-cleanup.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-themes/story-refactor-sweep-docs-budget-and-cleanup.review-log.md'
  - '{project-root}/_bmad-output/implementation-artifacts/autopilot/epic-themes-20261018-1343.md'
  - '{project-root}/AGENTS.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** Epic 9 (themes) leaves carry-overs, possibly dead `--wc-*` tokens or scaffolding, unchecked docs, an unrecorded bundle margin and scattered deferred findings.

**Approach:** Execute ticket 9.11 Scope 1-8 exactly as written in the ticket file (the intent source; do not restate it here), recording every report table in this plan's Implementation Notes. Resolve the review log's open major: the Scope 4 / Verify dependency comparison must compare both `dependencies` and `devDependencies` between `0f295f2^` and HEAD and list added entries (the 600,000-byte gzip total stays the real weight gate). Consider the earlier-ticket minors (steampunk art-token assertion, DESIGN.md texture %, sixth radio in view at 360 px) as Scope 1(a)-(c) define them.

## Boundaries & Constraints

**Always:** AGENTS.md rules 1-7; cite rules by id; test names start with the id; commit cleanup edits locally before the final size build; stop at `built`.

**Never:** edit DESIGN.md, EXPERIENCE.md, spec, spine (owner edits go in the plan as proposals); edit tsconfigs or tickets.toml; loosen contrast floors; change production code, timeouts, workers or retries for flakiness; change any screenshot baseline; push; mark done.

</intent-contract>

## Code Map

- `src/ui/theme/{art,registry,colour-literals}.ts`, `src/ui/app.css`, `src/main.ts:229-234` -- token declarations and the six production `register()` calls.
- `src/ui/theme/contrast.test.ts` -- add steampunk art-token `it` beside the garden case (1a).
- `src/ui/theme/registry.test.ts` -- add 'AD-10 ThemeId, prefs themes and registry ids agree' (5); main.ts registration check via node:fs in contrast.test.ts or colour-literals.test.ts (both in tsconfig.arch.json `files`).
- `e2e/theme.spec.ts` -- add Plum Dusk radio at 360 px case (1c), `android` project.
- `src/shell/prefs.svelte.ts` -- private `THEMES`; do not export.
- `scripts/size-budget.mjs`, `package.json`, `tsconfig.app.json`, `tsconfig.arch.json` -- budget and type-check mapping (read only).

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/theme/contrast.test.ts` -- steampunk art-token case and main.ts registration check -- Scope 1(a), 5
- [x] `src/ui/theme/registry.test.ts` -- agreement test -- Scope 5
- [x] `e2e/theme.spec.ts` -- 360 px Plum radio case -- Scope 1(c)
- [x] this plan -- tables for 1(b), 1(e) flake runs, 2 (token pass + allow-list + greps), 3 (doc table), 4 (budget margin + dependency diff), 6 (deferred), 7 (file-to-config), 8 (board rows) -- Scope 1-8
- [x] source files -- remove proven-dead tokens/scaffolding, if any -- Scope 2

**Acceptance Criteria:**
- Given the build, when `npm run test:all` runs, then it passes; `npm run test:screens` passes (no Docker: record and stop) with `git status --porcelain` clean under screenshot directories.
- Given a clean-tree `npm run build`, then total is under 600000 and the margin is recorded.
- Given the dependency comparison, then added `dependencies`/`devDependencies` entries since `0f295f2^` are listed.

## Implementation Notes

Built on baseline e701292; code commit b1e9b12 (local, not pushed).

### Changes
- `src/ui/theme/contrast.test.ts`: 'AD-14 steampunk sets both art tokens in app.css' (1a); 'AD-10 main.ts registers the six theme records in §7.10 order' (node:fs read of src/main.ts, comment lines stripped, anchored `register(x);` lines) (5).
- `src/ui/theme/registry.test.ts`: 'AD-10 ThemeId, prefs themes and registry ids agree' (ids from the six exported records; real `parsePrefs` accepts each, rejects 'neon'; `Record<ThemeId, true>` literal is the exhaustive type check, gated by `npm run check`). `THEMES` not exported (rule 7).
- `e2e/theme.spec.ts`: 'AD-10 Plum Dusk radio at 360 px ...' (`android`): viewport 360x740, radio scrolled into view once, box inside [0,360], below the panel header and inside `.content`. Passed.
- Scope 2: no production code changed (see tokens below); no screenshot baseline changed.

### 1(b) Table art and card texture opacity vs DESIGN.md "flat tiled patterns at 6 % opacity or less"
The sentence names card-face textures; `TEXTURE_CAP = 0.06` (art.ts) is enforced on card texture only (at most 0.06 passes).

| Theme | Card texture opacity | Table art opacity | Match |
| --- | --- | --- | --- |
| default (Charcoal) | none | none | n/a |
| scifi | 0.06 | stroke 0.07 | texture yes (boundary); table art outside the sentence |
| garden | 0.03 | stroke 0.08 | texture yes; table art outside the sentence |
| steampunk | 0.04 | strokes 0.07 and 0.25 (black shade line) | texture yes; table art outside the sentence |
| paper | none | none | n/a |
| plum | none | none | n/a |

Observation, owner call: table art has no stated ceiling; the 0.25 shade line in Brass and Walnut is the strongest. Proposed DESIGN.md Avoid-list wording if the owner wants a limit: "the card-face textures ... are flat tiled patterns at 6 % opacity or less; table backgrounds are flat tiled line art, each theme's own opacity (at most 0.25) checked by the worst-point contrast test". No edit made.

### 1(e) Flakiness runs
`npx playwright test --project=desktop --repeat-each=10 e2e/board-keys.spec.ts e2e/win-guard.spec.ts`: 1200 passed, 0 failed, 440 skipped (android-only variants), 13.6 min. Failures 0/10, no names. Not reproduced in isolation (load was not simulated); the full `test:all` run also passed first time. No fix made; any production/timeout/worker/retry change is an owner call.

### 2 Dead tokens and scaffolding
Script `/tmp/tokens.mjs` (throwaway, not committed): collects every `--wc-*` name in src/ui/app.css and src/ui/theme/{art,registry,colour-literals}.ts, then looks for a non-comment, non-declaration reference in non-test `src/**/*.{css,ts,svelte}` and index.html. Result: every token has at least one read except one.

Allow-list (owner reads this):

| Token | Declaring file | Why kept |
| --- | --- | --- |
| `--wc-hairline` | src/ui/app.css (six records) | No production read. Read by name in tests only: e2e/app-shell.spec.ts COLORS (pins the DESIGN.md `hairline` colour) and contrast.test.ts key-set test. DESIGN.md Colors still lists it (a divider role). Removing it means editing DESIGN.md, the 18-name rule and the tests: owner call. |
| `--wc-table-art`, `--wc-card-texture` | app.css | read once each (`body`/Card.svelte), in the allow-list only as art-data tokens set per theme. |

Scaffolding search: `grep -rn "register(" src` (non-test: six production calls main.ts:229-234, `nav.register`, the registry function; none temporary), `grep -rn "__theme" src e2e` (only `__themeSeen/__themeFrames` in the e2e no-flash probe, e2e-local), `grep -rn "import.meta.env.DEV" src` (test-hook.ts AD-17, layout.svelte.ts band order: both pre-date the epic). Empty result for epic-introduced scaffolding.

### 3 Doc confirmation (no doc edited)
| Surface | As built | Matches | Old -> new text, reason |
| --- | --- | --- | --- |
| DESIGN.md A-D1 | six themes, hand-chosen, Charcoal default, no prefers-color-scheme | yes | none |
| DESIGN.md intro / Themes: order and ids | Charcoal, Deep Space `scifi`, Greenhouse `garden`, Brass `steampunk`, Paper `paper`, Plum `plum`; prefs `THEMES` and main.ts register order the same | yes (ids and order vs spec §7.10 line 406 and AD-7) | none |
| DESIGN.md Themes: "Until each theme ticket lands its values here, its token set is the one in research/brief.md" | all five landed in app.css | no | Delete the sentence (or: "Each theme's values are in `src/ui/app.css`; the research brief is history"), reason: stale after 9.6-9.10 |
| DESIGN.md Colors floors | prose gives 13.1, 3.8/3.4, 3.6/3.2, 6.4/5.6, 7/6.6, 6.4, 9.9, 6.7 as floors for every theme; contrast.test.ts TABLE floors are 4.5, 3, 3, 4.5 ...; the figures are pinned to the default theme only | no | The 9.5 owner decision (2026-10-18) is that TABLE floors govern. Proposed: "every theme meets these contrast floors: text pairs 4.5:1, outlines and card edge 3:1, accent teal 3:1 ... (the table in contrast.test.ts); Charcoal's own figures are 13.1 ..." |
| DESIGN.md 9.5 default-only sentence | "These figures describe the default theme only." sits after the "every theme meets" list, so the list reads as 13.1 for all | no (ambiguous, see previous row) | Fold into the corrected floors sentence above |
| DESIGN.md Avoid list | card textures: 0.06, 0.03, 0.04, all at most 6 % | yes (see 1(b)); "Deep Space, Greenhouse Dusk and Brass and Walnut" correct | none |
| EXPERIENCE.md Preferences (line 170, 106, 50) | Theme single-choice list below Animation speed, no animation, stored with prefs, survives New game/Replay/reload, pre-paint; names in the stated order | yes | none |
| spec §7.10 | Theme (Charcoal, Deep Space, Greenhouse Dusk, Brass and Walnut, Daylight Paper, Plum Dusk) | yes | none |
| AD-10 | theme in the prefs store, `data-theme` and `theme-color` meta from the UI theme module (`src/ui/theme/`) | yes | none |
| AD-7 | optional `theme`, six ids, unknown value `contents-unreadable` (Q-36) | yes (parsePrefs, THEMES) | none |
| AD-16 | inline head script sets `data-theme`; boot applies theme + meta before first await; manifest stays Charcoal | yes | none |

### 4 Budget and dependencies
Clean tree at b1e9b12 (only this untracked plan file present), `npm run build`: `total 551996 / 600000`, margin 48004 bytes. Under budget.
Dependency comparison `0f295f2^` vs HEAD for both `dependencies` and `devDependencies`: added [], removed [], changed [] (package.json and lockfile have no diff). The original `dependencies` check prints `null null` because package.json has no `dependencies` key; the bundle total is the weight gate.

### 5 Halted-on-unregistered-theme
`parsePrefs` rejects a theme outside `THEMES` as contents-unreadable (Q-36 silent default; unit tests and theme.spec 'Q-36 an unknown theme value boots the default theme ...'). The new agreement and main.ts registration tests close the only route to Halted (a `ThemeId` the registry lacks). No other path to the AD-15 Halted surface found.

### 6 Deferred findings
Counts: digest "Worth knowing" 12 lines + unapplied/minors mentions; 9-5..9-10 build logs.

| Source | Finding | Disposition |
| --- | --- | --- |
| 9.3 | Scene pointer colours became tokens; shared `--wc-shadow-drag` | informational, no action |
| 9.3 | deferred: computed-style check for token sites with no screenshot baseline | deferred: screenshots cover; owner call if wanted |
| 9.3 | later theme test files must be in tsconfig.app.json or tsconfig.arch.json | verified here, no change (item 7 mapping) |
| 9.4 | ticket has plan_checkpoint | informational |
| 9.4 | dev server probe saw one dark first frame before the stored theme | owner call (AD-16 edit not made; owner accepted 9.6 first-frame tint) |
| 9.4 / 9.5 / 9.7 / 9.8 | board-keys / win-guard load-dependent desktop timeouts | not reproduced: 1(e) 0/10 in 1200 runs, test:all green; no change, owner call if it recurs |
| 9.5 | review log committed through pass 6 | informational |
| 9.5 | unapplied minors: main.ts dev-await note, geometry required on rect/circle, alpha<1 fail-fast in overArt, data-URI scan corner case | deferred: test-hardening, no UX effect |
| 9.5 | Hooks grammar fill/stroke on `<g>` vs per shape | deferred: art grammar note for a later theme ticket |
| 9.6 | tickets.toml entry 6 `after=[1,4]` vs story file `[3,4,5]` | owner call (see 8) |
| 9.6 | `.track` transition animates on theme change (Q-45 exemption in theme.spec) | deferred: accepted exclusion recorded in expectNoThemeAnimations |
| 9.6 | `tsconfig.arch.json` types | verified here, no change (item 7: arch types node, app none) |
| 9.6 | paper screenshots pointer look is a human judgement | owner call |
| 9.6 minors | paper `--wc-table` assertion, `color-scheme` light in dist-smoke, paper screens pre-assertions, `.track` | deferred: extra test assertions |
| 9.7 | Daylight Paper Preferences baseline moved a place | informational (approved by baseline run; screens green) |
| 9.7 | outstanding Android play-test of Deep Space | owner call |
| 9.7 minors (5) | pixel ratio not recorded, art tokens not pinned, scrim/drag-shadow restore not checked, build-output substrings, AC3 wording | deferred: test-only |
| 9.8 | doubts about Deep Space baseline unchanged | informational: screens passed, still green now |
| 9.8 minors (5) | token values unpinned, garden pixel ratio not logged, build-output substrings, plan wording, scifi baseline claim | deferred: test-only |
| 9.9 | unapplied minors: steampunk contrast assertion | fixed here: 1(a) |
| 9.9 | DESIGN.md line 243 texture % | fixed here as a row: 1(b) and item 3 (no mismatch for textures) |
| 9.9 | Android play-test of Brass and Walnut | owner call |
| 9.9 minors (3) | pixel ratio, ARTS order, section C values unpinned | deferred: test-only |
| 9.10 | Halted-on-unregistered-theme path untested | fixed here: item 5 |
| 9.10 | `#15171B` status bar against `#17121C` page; scene pointer colours on plum | owner call (pre-assigned) |
| 9.10 | sixth radio in view at 360 px | fixed here: 1(c) |
| 9.10 | Epic 8 retro not marked done | owner action (pre-assigned) |
| 9.10 | Android play-test of Plum Dusk, Greenhouse Dusk | owner call (pre-assigned) |
| 9.10 minors (6) | plum dist-smoke selector, values unpinned, theme.spec parity, registration order only via e2e, plan figures | registration order: fixed here (item 5); rest deferred: test-only |
| 9.11 | `--wc-hairline` has no production read | owner call (item 2 allow-list) |
| 9.11 | DESIGN.md stale/ambiguous sentences | owner call (item 3 proposals) |

### 7 File-to-config mapping (`tsc -p <config> --listFilesOnly`; no tsconfig edited)
| File | Checked by |
| --- | --- |
| src/ui/theme/art.ts, art.test.ts, registry.ts, registry.test.ts | tsconfig.app.json (`svelte-check`); art.ts and registry.ts are also reached from arch through imports |
| src/ui/theme/colour-literals.ts, colour-literals.test.ts, contrast.test.ts | tsconfig.arch.json `files` (excluded from app) |
No file in neither. `npm run check` clean.

### 8 Board dependency data (tickets.toml in epic-themes vs story files and epic-themes.md order)
| Entry | toml `after` | story file `after` | Result |
| --- | --- | --- | --- |
| 6 | [1, 4] | [3, 4, 5] | mismatch: owner call (digest 9.6; board not hand-edited) |
| 7 | [5, 6] | [5, 6] | clean |
| 8 | [5, 7] | [5, 7] | clean |
| 9 | [5, 8] | [5, 8] | clean |
| 10 | [6, 9] | [6, 9] | clean |
| 11 | [3..10] | [3..10] | clean |
(Entries 1-5 also agree: 2 [1], 3 [], 4 [2,3], 5 [3].)

### Verification results
- `npm run test:all`: passed (unit 3033/3033, build 551996/600000, e2e:dist 17, e2e 977 passed, pwa 14), on b1e9b12.
- `npm run test:screens` (Docker available): 62 passed, 38 skipped; `git status --porcelain` shows nothing under screenshot directories.

## Plan Change Log

## Review Triage Log

### 2026-10-19 — Review pass
- verdicts: 32 findings (blind 11 bullets, edge-case 10, verification-gap 0, intent-alignment descriptive) — high 0, medium 0, low 5, false 6, maybe-false 0; remainder rejected as non-defects or already disclosed
- findings:
  - `[false]` `reject` e2e 360 px test runs on desktop too — `test.beforeEach(onAndroid)` at e2e/theme.spec.ts:9 gates the whole file to android.
  - `[low]` `reject` loose `header` / `.content` selectors — locators scoped to the Preferences dialog, pass; rewriting adds complexity.
  - `[low]` `reject` main.ts regex anchored at line start, block comments, conditional register — Biome formats main.ts at column 0; a reformat fails the test loudly (rule 6), not silently.
  - `[low]` `reject` registry test module reset / try-finally — afterEach already unstubs; only failure-message noise.
  - `[low]` `patch` plan wording: "fixed here" on rows where nothing was fixed (9.3, 9.4/5/7/8 flake, 9.6), stale "status left in-progress" note, unchecked tasks, mode 755 — corrected in the plan.
  - `[false]` `reject` dependency comparison vacuous — both `dependencies` and `devDependencies` compared (added/removed/changed empty); the review log's open major is resolved in Implementation Notes item 4.
  - `[reject]` token pass not reproducible, flake sample thin, table-art opacity unpinned, other themes' 360 px — already disclosed in the plan as owner calls or outside the ticket's scope.
  - `[reject]` intent-alignment divergences (audit, not removal; `--wc-hairline` kept; three DESIGN.md rows "no") — by design: ticket rule 7 and Scope 2/3 make these owner proposals.

## Verification

**Commands:**
- `npm run test:all` -- expected: all pass
- `npm run test:screens` -- expected: pass, no baseline change
- `node -e` comparison of `dependencies`/`devDependencies` at `0f295f2^` vs HEAD -- expected: added entries listed

## Auto Run Result

- Summary: tests added for steampunk art tokens, ThemeId/prefs/registry agreement, main.ts registration order, and Plum Dusk radio at 360 px; the plan holds the sweep tables (opacity, flake runs, token pass, doc confirmation, budget, deferred, tsconfig mapping, board rows). No production code, docs, tsconfig or board edited.
- Files changed: `src/ui/theme/contrast.test.ts`, `src/ui/theme/registry.test.ts`, `e2e/theme.spec.ts` (commit b1e9b12); this plan.
- Review: 0 high / 0 medium; 1 low patched (plan wording); the rest rejected with reasons in the triage log; none deferred.
- Follow-up review recommended: false.
- Verification: test:all green (3033 unit, 977 e2e, 17 dist, 14 PWA); test:screens 62 passed, no baseline change; build total 551996 / 600000, margin 48004; dependencies and devDependencies unchanged since 0f295f2^.
- Residual risks / owner items: `--wc-hairline` has no production read (owner call); DESIGN.md Colors floors and stale Themes sentence need owner edits (proposals in item 3); tickets.toml entry 6 `after=[1,4]` vs story `[3,4,5]` (not edited); outstanding Android play-tests, `#15171B` vs `#17121C`, Epic 8 retro.
