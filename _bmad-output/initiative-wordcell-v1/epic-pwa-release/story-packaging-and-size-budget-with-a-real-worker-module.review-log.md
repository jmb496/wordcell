# Review log — story-packaging-and-size-budget-with-a-real-worker-module.md (ticket 7.8)

State: pass 2: done

Mode: docs, thorough, max 7, budget=1500 words. Pass 0: 212 words, `story-packaging-and-size-budget-with-a-real-worker-module.review-log.passes/pass0.md`, HEAD 5f59fba.
Intent carried from `epic-pwa-release/tickets.toml` entry 8 (not copied at pull; the fixer adds them to the Description in pass 1):
- tests: AD-16 `serviceWorker.register` placement and AD-18 counted-set rows of rule-coverage.md (B, postbuild).
- owns: The size-budget gate's unreachable-key failure and the manifest content check.
- consumers: Entry 10 (re-measures the margin), entry 11 (AD-18 Size sync).
Refs: `_bmad-output/specs/spec-epic-7-pwa-release/` SPEC.md, rule-coverage.md, device-checks.md, release-checklist.md, build-notes.md; epic-pwa-release.md; ARCHITECTURE-SPINE.md; AGENTS.md; done-ticket plans `epic-pwa-release/*-plan.md` (7.1–7.7).

## Pass 1 — 2026-10-31
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 12, decision-needed 0  |  Dropped in triage: 0
Words (docs): 754 (3.6x pass 0; budget 1500)  |  Snapshot: story-packaging-and-size-budget-with-a-real-worker-module.review-log.passes/pass1.md  |  Fix diff: pass1.fix.diff
Fixer: all 14 items applied, no conflicts; Description split into Gate / Content case / Budget / A3 re-check bullets plus Tests/Owns/Consumers line and a Notes "Spine gap" bullet; `allowJs` claim verified with the pinned TypeScript 6.0.3 on a scratch tsconfig + spec (strict e2e config: exit 0 with `allowJs: true`, TS7016 without), scratch removed; full `npm run check` with the new `collectSizes` export unverified (left to the build); A3 items and manifest shape checked against HEAD and dist/.
### Applied
- [major] Description — tickets.toml entry 8 tests/owns/consumers missing (carried intent; adversarial) → fixer item 1
- [major] Description gate clause — which dynamic edges count is undefined; a static-only reach must now fail, contradicting the passing `size-budget.test.mjs` case "sw.ts statically imported by a counted chunk…" (`errors` `[]`) and build-notes' "with no edge it counts everything" (all four) → item 2
- [major] Description gate clause — throw vs `errors` entry, message and order unstated; existing cases pin exact `errors` arrays (builder, adversarial; edge minor) → item 3
- [major] Description content case — the TS e2e spec cannot reach `computeBudget`'s rows: tsconfig.e2e.json has no `allowJs` (TS7016 under `npm run check`), `collectSizes` is private, the sw.ts static-closure walk is private (builder, ref, adversarial, edge) → item 4
- [major] Description — AD-18 Size lists only the 600,000/font/dictionary failures; an unattended build may stop on the spine/spec gap; owner of the sync (entry 11, SPEC CAP-9) unstated (adversarial; edge minor) → item 5
- [minor] pin the marker `messageSkipWaiting`; say which counted rows are searched (all four) → item 6
- [minor] entry 1's AD-16 test stays unchanged as the AD-16 row's proof; new cases named `AD-18 …` (builder, ref, adversarial, edge) → item 7
- [minor] content case runs under `pwa` and `dist-smoke`, placement only; the total is postbuild on `dist/` (adversarial, edge) → item 8
- [minor] A3 items listed with evidence (F13's three + G28 `includeAssets`) (all four) → item 9
- [minor] margin record form (adversarial) → item 10
- [minor] whole `size-budget.test.mjs` stays synthetic (ref, adversarial) → item 11
- [minor] absent sw.ts key passes the gate (edge) → item 12
- [minor] sw.ts static closure includes the entry chunk; keys mapped to files before comparing (edge) → item 13
- [minor] static-plus-dynamic reach passes the gate, counted; the content case is its guard (adversarial, edge) → folded into item 2
- [minor] split the run-on Description into bullets; add code refs (adversarial, edge) → item 14
- [minor] size-budget.mjs header comment gains the new failure (edge) → folded into item 5
### Default applied (technical)
- Gate rule — fails when the `src/shell/sw.ts` key exists and no chunk reached from the entry has a `dynamicImports` edge to it (`main.swDynamic` false): orphan, static-only and sw-subtree-only edges fail; static-plus-dynamic passes (counted)
- Failure style — an `errors` entry after the dictionary error, before the 4 MB errors (table still prints, exit 1)
- E2E access — export `collectSizes` from size-budget.mjs, `allowJs: true` in tsconfig.e2e.json; sw.ts static-closure walk as an `e2e/helpers/dist-test.ts` helper with a self-test in `e2e/helpers.spec.ts`
- Spine gap — SPEC wins; entry 11 syncs AD-18 Size; this ticket edits no spine/spec doc
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 2 — 2026-10-31
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 1, minor 11, decision-needed 0  |  Dropped in triage: 0
Words (docs): 946 (4.5x pass 0; budget 1500)  |  Snapshot: story-packaging-and-size-budget-with-a-real-worker-module.review-log.passes/pass2.md  |  Fix diff: pass2.fix.diff
Fixer: all 12 items applied, no conflicts; no runnable commands or config values added; case names, `swChunkFile` signature/throws and the 560,702 figure checked against code and entry 5's plan.
### Applied
- [major] Gate bullet — the stated static-plus-dynamic pass rule has no `size-budget.test.mjs` case (edge, adversarial) → fixer item 1
- [minor] Content case — "`latin1`, so the binary font row cannot throw" is false (utf8 decode never throws); latin1 is a byte-faithful decode (fix diff, edge, adversarial) → item 2
- [minor] Consumers — entry 11 must also record the `tsconfig.e2e.json` `allowJs` Scaffold delta; nothing entry 11 reads carries it (fix diff, adversarial, ref) → item 3
- [minor] Content case — each marker checked on its own: in no counted row and in at least one uncounted closure file (edge, adversarial) → item 4
- [minor] Closure helper — `(root = buildRoot())`, `imports` only, throws naming the key on a missing key or no `file` (rule 6), self-test named `AD-17 …` as `swChunkFile`'s (edge, adversarial) → item 5
- [minor] Budget — "at <commit>" cannot name the build's own commit; baseline 560,662 is stale (entry 5 recorded 560,702) (edge, adversarial) → item 6
- [minor] Gate — "(e.g. only inside sw.ts's own subtree)" reads two ways when sw.ts is also statically reached (adversarial) → item 7
- [minor] Gate — "no key passes" vs the existing dangling-edge throw (adversarial) → item 8
- [minor] Gate — the amended static-import case is the static-only proof, no duplicate (adversarial) → item 9
- [minor] Gate — an orphan key's `file` is not validated; the same error is pushed (adversarial) → item 10
- [minor] Content case — the `index.html` closure layout is today's; assert over the manifest's closure (adversarial) → item 11
- [minor] Verify — add the helper self-test and `npm run check` with `allowJs` (adversarial) → item 12
### Default applied (technical)
- Static-plus-dynamic test — `AD-18 sw.ts reached both statically and dynamically passes and is counted` (`errors` `[]`, sw file/css/imports in rows)
- Margin baseline — the plan measures at the start commit (`npm run build` before changes) and records the delta from it, citing entry 5's 560,702 as the last recorded figure
- Orphan key — the gate pushes its error without validating the orphan's `file`
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
