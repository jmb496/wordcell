# Review loop — ticket 7.2 (Worker failure split and no-skip-waiting guards)

State: pass 1: done

Target: `_bmad-output/initiative-wordcell-v1/epic-pwa-release/story-worker-failure-split-and-no-skip-waiting-guards.md` (docs mode, thorough, max 7)
Pre-loop: HEAD 1f59086; pass 0 copy `story-worker-failure-split-and-no-skip-waiting-guards.review-log.passes/pass0.md`, 282 words (growth budget ~705).
Intent also includes tickets.toml entry 2 fields not copied into the ticket: interface, tests, owns, consumers, plan_checkpoint = true (fixer adds them to the Description in pass 1).
Refs: SPEC.md and companions (build-notes, rule-coverage, device-checks, release-checklist) of `_bmad-output/specs/spec-epic-7-pwa-release/`, epic-pwa-release.md, ARCHITECTURE-SPINE.md, AGENTS.md, docs/game-flow-spec.md, ticket 7.1 plan and its code review log `_bmad-output/implementation-artifacts/review-loop/7-1-build.md`.

## Pass 1 — 2026-10-30
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 8, minor 10, decision-needed 0  |  Dropped in triage: 0 (duplicates merged across lenses)
### Applied
- [major] Description, hook-build report — F17 `&& !halted()` guard (7.1 unapplied minor 1) left open; sw.ts and main.ts would follow two rules → fixer item 1
- [major] Description, "no newer worker in any slot" — "newer" undefined; slot occupancy cannot separate the update-failure (older active stays) from a replacement → fixer item 2
- [major] AC case list — second-update-found-later has no expected outcome; no replacement (not `failed`) case; present-at-`register()` path not named → fixer item 3
- [major] Description, F5 — check must run before `new Workbox(...)` (7.1 residual risk; the mocked constructor hides it) → fixer item 4
- [major] Description, "always resolves" — sw.ts's `registration === undefined` throw contradicts it; SPEC F6 calls the `block` stub's `undefined` a Q-40 failure → fixer item 5
- [major] Description, "always resolves" — readable as a catch-all, against rule 6 / SPEC Constraints → fixer item 6
- [major] Description/AC, sticky `failed` — number of hook-build reports for a second failure unspecified, so the sticky case has nothing to assert → fixer item 7
- [major] AC — S scan and B test names not recorded though rule-coverage.md says tickets record them (AD-16 no-prompt row) → fixer item 8
- [minor] Description, "the boot tail's `halted()` check" — no such check after the attempt yet; it is entry 5's → fixer item 9
- [minor] References — wrong scan file (ad2-ad12-ad17); missing main.ts, sw-state.ts, sw.test.ts, architecture-ad1/tree-scan tests, F6, F17, rule-coverage rows → fixer item 10
- [minor] Description, build-output — existing test already asserts no `clientsClaim` and carries a "no skipWaiting assertion" comment; no matcher for minified output → fixer item 11
- [minor] AC, split — Vitest runs `environment: 'node'` (no `navigator.serviceWorker`, `reportError`); gate expression and how both branches run unstated → fixer item 12
- [minor] AC — 7.1 unapplied minors 3–4 (invalid fake states, updatefound case never fires `statechange`) not carried → fixer item 13
- [minor] AC — F6 audit re-run has no evidence line → fixer item 14
- [minor] Description, "AD-1 tree-scan exclusions" — ambiguous vs nav/storage exclusions; use SPEC's three-item list → fixer item 15
- [minor] Description, scan — Svelte markup not said to be scanned → fixer item 16
- [minor] Description — tickets.toml entry 2 interface/tests/owns/consumers/plan_checkpoint not copied → fixer item 17
- [minor] AC — non-failure cases have no meaning for "checking the split" → folded into fixer item 3
### Default applied (technical)
- F17 guard → drop `&& !halted()`; every Q-40 hook-build report unconditional (AD-15: a later fatal replaces the text)
- "newer" → first observed later by sw.ts; one slot read ranks active < waiting < installing; the redundant worker itself and other redundant workers never count; "reached `activated`" = any observation saw `activated`
- report count → once per launch, on the transition into `failed` (F17 included)
- `register()` resolving `undefined` → same as a rejected `register()` (Workbox itself rejects first in production, it reads `.waiting`)
- hook-build gate → `import.meta.env.VITE_TEST_HOOKS === '1'` read at call time (sw.ts never loads in dev, F3), driven with `vi.stubEnv`
- build-output matcher → exactly one `skipWaiting(` and it follows a `"SKIP_WAITING"===` guard
- scan → also Svelte markup; test names carry `AD-16`
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
### Fix
Fixer applied all 17 items (no conflicts); Description now five bullets (Failure, Report, Scan, Build output, F6) plus the tickets.toml Interface/Tests/Owns/Consumers/Plan checkpoint block; AC case list with outcomes. Item 11 claim checked against current `dist/sw.js` and `dist-test/sw.js` (one `skipWaiting(`, `e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()`); `vi.stubEnv`/`vi.stubGlobal` named as design, marked `unverified` by the fixer.
Words (docs): 713 (2.53 x pass 0)  |  Snapshot: story-worker-failure-split-and-no-skip-waiting-guards.review-log.passes/pass1.md; fix diff pass1.fix.diff
