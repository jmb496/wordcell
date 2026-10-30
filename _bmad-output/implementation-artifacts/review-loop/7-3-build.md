# Review loop — ticket 7.3 build (code mode)

State: pass 1: done

Target: commit range `f45add3..HEAD` (build commit 26b0fae), staged as `7-3-build.passes/pass0.diff`
Intent: `_bmad-output/initiative-wordcell-v1/epic-pwa-release/story-two-build-update-proof-plan.md`
Depth: thorough  |  Max: 7
Pre-loop: HEAD 26b0fae137b36a7a7bbb8b318cc0524c986a1fea, tree snapshot 0 d1cc36588e32c68a6e29a833ebb5f51be79ca8ee

## Pass 1 — 2026-10-30
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 10, decision-needed 0  |  Dropped in triage: 0 (2 duplicate rows merged)
Snapshot: tree a2c6a4b3d96da17a1f9bcb0a15c2d5bcc8a6331f (7-3-build.passes/pass1.diff, fix diff pass1.fix.diff)
Fixer: all 11 applied; lint clean, check 0 errors, unit 3684 passed; helpers static-server/no-prompt 15 passed; update.spec --repeat-each 2 10 passed (fixer ran with `--project=pwa`: the plan Verification form `--project pwa <spec>` reads the path as a project name). Orchestrator rerun: lint, check, unit pass.
### Applied
- [major] e2e/pwa/update.spec.ts A-side test step 3 — after page 1 closes nothing holds: page 2's marker read is its old DOM and page 3's `waiting` poll returns on the first read, so an activation ~1 s after a non-last close (planning probe: ~1.0 s after the last close) would pass green → fixer item 1
- [minor] e2e/helpers.spec.ts root case — only a navigation, so it cannot tell the `/` → `index.html` mapping from the navigate fallback → fixer item 2
- [minor] e2e/pwa/update.spec.ts header / plan — the `redundant` and `SKIP_WAITING` AD-17 self-tests call `setup()` but the ticket AC's G3 removal rule names only the two `Q-40 AD-16 A-A15` tests; Plan Change Log empty → fixer item 3 (reviewer said major; reclassified minor: no G3 acceptance happened, a wording/record gap)
- [minor] e2e/pwa/update.spec.ts `setup` first `waiting` poll — an early activation on the reload that finds B reads as a generic timeout, not the timing label (correctness + intent, merged) → fixer item 4
- [minor] e2e/pwa/update.spec.ts `waitingHandle`/`pollActivated` — the A-scope `statechange` recorder and the one-active-worker precondition are not recorded as a deviation from ticket step 4 → fixer item 5
- [minor] e2e/pwa/update.spec.ts `pollState` — `window.__wordcell?.swState()` turns a missing hook into a 15 s timeout instead of failing at once → fixer item 6
- [minor] e2e/pwa/update.spec.ts `setup` step 2 — page 1's `expectMarkerA` after each reload runs without a `controlled` check, so an uncontrolled reload would read as D → fixer item 7
- [minor] e2e/pwa/update.spec.ts SKIP_WAITING self-test — unbounded `controllerchange` wait → fixer item 8
- [minor] plan Implementation Notes vs Auto Run Result — 7 vs 8 no-prompt cases → fixer item 9
- [minor] e2e/helpers/static-server.ts request parse — `new URL(request.url, base)` reads `//sw.js` as host `sw.js` → fixer item 10
- [minor] e2e/pwa/update.spec.ts `withSite` finally — `site.stop()` skipped if a page close throws → fixer item 11
### Default applied (technical)
- A-side hold — after page 3's checks, poll page 3's `swState()` (and B's handle state) every 100 ms for a named `HOLD_MS` (5 s, ~5× the measured activation delay), throwing the timing label on `active`/`activated`
- Step-2 early activation — on that poll's timeout with last `active`, reload once; controlled + marker B throws the timing label, otherwise the existing timeout message
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
