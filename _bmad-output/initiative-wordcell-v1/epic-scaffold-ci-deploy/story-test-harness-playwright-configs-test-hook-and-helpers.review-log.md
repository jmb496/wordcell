# Review log: story-test-harness-playwright-configs-test-hook-and-helpers.md (ticket 1.3)

Mode: docs, depth thorough, max 7. Refs: epic-1 SPEC.md, build-notes.md (CAP-3 Harness),
delta-checks.md, epic file, ARCHITECTURE-SPINE.md (AD-8, AD-17, AD-18, Scaffold deltas), AGENTS.md,
CLAUDE.md, ticket 1.1 and 1.2 plans, hardened ticket 1.2. Carried facts from 1.2: `prebuild:test`
no-flag mode; pwa precache check doubles as 1.2's deferred dist-asset guard; dist-smoke on 1.1's
`card-<CardId>` ids and `vite preview`; /mnt/d dev-server/port-5173 caveat; two stale AGENTS.md
lines left for D8; CDP touch halt. Pre-loop state: HEAD 1256c32.

## Pass 1 — 2026-09-27
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 13, minor 5, decision-needed 0  |  Dropped in triage: ~37 raw duplicates merged (~55 raw → 18)
### Applied
- [major] Notes — CDP touch open question → epic's halt condition (pointer sequence on a probe element, no workaround).
- [major] Scripts — exact text for `prebuild:test` (no flag), `build:test`, `test:e2e:pwa`, `test:e2e:dist`, `test:all`; fresh-clone evidence.
- [major] pwa config (D5) — throw unless `PW_PREVIEW` ∈ {dist, dist-test}; register only the matching project; Pixel 7; `vite preview --port 4173 --strictPort`, `reuseExistingServer: false`.
- [major] `--list` evidence contradicted the unset throw → listed with `PW_PREVIEW` set per target; unset/bogus exit non-zero.
- [major] Spec files and per-project split named (`precache`, `test-hook`, `dist-smoke` under `e2e/pwa/`; `e2e/test-hook.spec.ts`, `e2e/helpers.spec.ts`); AD-17 vs AD-18 naming resolved.
- [major] Test hook wiring — guarded plain assignment of a frozen `{}`, `declare global`, side-effect import in `main.ts`; grep non-empty → halt.
- [major] Precache check — `readPrecacheManifest` via `node:vm`, exactly one `assets/en-*.txt`, `revision === null`; import-removal red evidence (1.2's deferred guard).
- [major] `seedStorage` / `captureBoot` contract (string values, omitted keys, `__wordcellSeeded` flag, `__wordcellBoot` shape, standalone export).
- [major] Seed self-tests made observable (overwrite-then-reload, new page unseeded, captureBoot on both loads, standalone capture).
- [major] Touch helper signatures and self-test on a `touch-action: none` probe element.
- [major] Lifecycle helper targets, `persisted`, and self-test assertions.
- [major] Server ownership and 5173/4173 port-free checks before Playwright runs.
- [major] testIgnore evidence via an uncommitted scratch screens spec; `[ASSUMPTION]` tag dropped.
- [minor] dist-smoke console-error definition, no allow-list; pre-entry-5 icon/SW error → halt.
- [minor] `tsconfig.e2e.json` added to `check` so helpers and configs are type-checked.
- [minor] Deferred AD-17 sentences listed (epics 2, 3, 7).
- [minor] AGENTS.md TODO resulting text; stale lines left for D8.
- [minor] Description rewritten as a short summary.
### Default applied (technical)
- All 18 items above are technical defaults (no functionality/UX/gameplay effect).
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Duplicates across lenses merged; `seedStorage` second-call throw not adopted (AD-17 does not ask for it; over-specification); distinct preview ports per target not adopted (single port + only matching project + no reuse suffices).

## Pass 2 — 2026-09-27
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 6, minor 8, decision-needed 0  |  Dropped in triage: ~18 raw duplicates merged (~32 raw → 14)
### Applied
- [major] Touch self-test vs halt disagreed on pointermove count → count coalesced events (`getCoalescedEvents().length || 1`) ≥ `steps`; shortfall is a halt, no delay/rAF workaround.
- [major] Halt applied the drag pattern to `longPress` (which has no move) → per-helper halt conditions.
- [major] `Window.__wordcell` / `__wordcellBoot` untyped for `tsconfig.e2e.json` → `e2e/globals.d.ts`; `export {}` in `test-hook.ts`; "literal only in branch" reworded to runtime occurrences.
- [major] pwa `webServer` lacked `url` (Playwright 1.63 then doesn't wait, reviewer-verified in runner source) → `url` + `timeout: 60_000`; CI options copied from the default config.
- [major] `tsconfig.e2e.json` "same style" ambiguous (`nodenext` forces extensions) → exact options, `module: esnext`, `moduleResolution: bundler`, `strict`.
- [major] Touch coordinates → interpolated moves ending at `to`, `touchEnd` with empty points, 1 CSS px tolerance (DPR 2.625).
- [minor] `longPress` `ms = 600`, timestamp tolerance, no pointercancel.
- [minor] Probe element style, no `data-testid`, styling not "extra setup".
- [minor] Lifecycle override via configurable `defineProperty`; hide/show/hide sequence case.
- [minor] Seed self-test (e): omitted keys untouched, others not cleared.
- [minor] `dist-smoke` listeners before `goto`, load = heading visible, `networkidle` before asserting errors.
- [minor] Precache parse: one `precacheAndRoute(`, bracket-depth scan, array check.
- [minor] `AD-18` fs scan of `dist/` for `__wordcell` as a permanent CI guard.
- [minor] Handoff: seed self-tests move to `fixtures/*.json` once the store reads `wordcell:session`.
### Default applied (technical)
- All 14 items above are technical defaults (no functionality/UX/gameplay effect).
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Duplicates merged. Alternative "rAF wait between moves" not adopted (coalesced counting needs no change to the helper's timing and keeps the no-extra-setup halt meaningful).

## Pass 3 — 2026-09-27
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 3, minor 9, decision-needed 0  |  Dropped in triage: ~16 raw duplicates merged (~28 raw → 12); 3 reviewer "majors" reclassified minor (double-seed guard, value serialisation, dev-hook assertions: obvious handling)
### Applied
- [major] `visibilitychange` must bubble (a real one reaches `window`; AD-17 "exercising the store's real listener") → `bubbles: true`, window-listener assertion; `pageHide`/`pageShow` leave visibility unchanged.
- [major] `readPrecacheManifest` shared by entries 4/5 had no signature → `(request) => Promise<{url, revision}[]>`, `Array.isArray` (cross-realm), plain-object copy, whitespace/escape-aware scan.
- [major] Touch self-test points unspecified; a bad guess (tiny steps) could trip the halt falsely → fixed points, `steps` integer ≥ 1, `longPress` Node-side wait clarified vs "no delays", `contextmenu` diagnostic.
- [minor] `seedStorage` via `addInitScript(fn, arg)`, `!== undefined`, once per page before first `goto` (WeakSet guard).
- [minor] Seed self-test (e) ordered across two pages; new (f) round-trips quotes/backslash/newline and `''`.
- [minor] Self-test (b) uses `context.newPage()` (not `window.open`, which clones sessionStorage).
- [minor] "Self-tests run after goto" reworded: seed tests register before first `goto`.
- [minor] Dev-hook case asserts frozen / no own keys like the pwa case.
- [minor] dist fs scan: path from `import.meta.dirname`, non-vacuous.
- [minor] `tsconfig.e2e.json` duplicate flag dropped; root `tsconfig.json` reference added.
- [minor] Deferred list completed (font → 4, screens → 7, CI → 8, clock → epic 3, `page.mouse`, Split/Speed exempt).
- [minor] testIgnore `--list` also shows the default specs (guards the `**/pwa/**` glob against the checkout path).
### Default applied (technical)
- All 12 items above are technical defaults.
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Duplicates merged; none disproved.

## Pass 4 — 2026-09-27
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 3, minor 11, decision-needed 0  |  Dropped in triage: ~12 raw duplicates merged (~26 raw → 14)
### Applied
- [major] Seed call rules stated but neither enforced nor tested → throw on repeat/conflict/`page.url() !== 'about:blank'`/no keys; self-test (g).
- [major] `document.hidden` override untested → recorded and asserted; same-state `hidePage`/`showPage` throw; `pageHide` `persisted: false`, target `window`.
- [major] Touch read-back could race the queued pointerup (CDP resolves on compositor ack) and trip a false halt → `waitForFunction` until pointerup/pointercancel (5 s), not a banned delay.
- [minor] Coordinate mismatch is a helper bug, not a halt; tolerance kept.
- [minor] Probe's recorded event types and fields listed.
- [minor] `longPress` `ms` validation and event sequence; CDP session detached in `finally`.
- [minor] Init function self-contained (source-serialised by Playwright).
- [minor] Self-tests (b), (d) spelled out.
- [minor] Direct `page.evaluate` writes are stand-ins for app writes, not seeding; only in `e2e/helpers.spec.ts`.
- [minor] Positive-only helper guards listed as exempt in the mapping.
- [minor] `e2e/helpers/precache.ts` noted as an intended fourth helper.
- [minor] Deferred: boot-order half of the one-download proof (epics 3, 7).
- [minor] Handoff: epic 3 updates both `__wordcell` declarations together.
- [minor] dist-smoke halt scoped to `/icons/`, `registerSW.js`, `sw.js` errors; others are defects.
### Default applied (technical)
- All 14 items above are technical defaults.
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Duplicates merged; none disproved.

## Pass 5 — 2026-09-27
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 1, minor 11, decision-needed 0  |  Dropped in triage: ~13 raw duplicates merged (~25 raw → 12); builder's (g) sub-case isolation reclassified minor (folded into the major)
### Applied
- [major] Stated helper guards (captureBoot twice/after goto/before seedStorage, seedStorage with no keys, showPage while visible) had neither a test nor an exemption → (g) extended, one fresh page per sub-case, distinct guard messages; exempt list made complete.
- [minor] Validation precedes WeakSet tracking.
- [minor] All helpers `async`, guards surface as rejections.
- [minor] Seed (a) asserts the seeded value first; (c) inputs fixed; (b) renamed to the Seeding clause it proves (not the `Page.crash` kill variant).
- [minor] `pageShow` constructor and both `persisted` values; visibility-unchanged case run both ways.
- [minor] Android-only skip via `test.beforeEach` + `test.info()` (Biome `noEmptyPattern`-safe).
- [minor] Touch pointerType/coords criteria scoped to pointer events; `contextmenu` diagnostic only; `from === to` throws.
- [minor] `readPrecacheManifest` checks `response.ok()` and entry shapes.
- [minor] dist-smoke hook absence via `'__wordcell' in window`; page-scope console only, source from `msg.location().url`.
- [minor] Handoff: seed self-tests reworked when boot starts writing `wordcell:*`.
- [minor] Test-hook import placement (first side-effect import; outside AD-16 sequence).
- [minor] `dist-test/` in Vite dev's dep scan is harmless; no workaround.
### Default applied (technical)
- All 12 items above are technical defaults.
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Duplicates merged; none disproved.

## Pass 6 — 2026-09-27
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 1, minor 13, decision-needed 0  |  Dropped in triage: ~5 raw duplicates merged (~19 raw → 14)
### Applied
- [major] dist-smoke halt-vs-defect split matched only `msg.location().url`; Chromium's manifest-icon error names the icon only in its text, so the most likely pre-entry-5 error would be misfiled as a defect to fix (entry 5's scope) → match location URL or text/stack.
- [minor] `captureBoot` lives in `seed.ts` sharing the `WeakSet`.
- [minor] Deferred: AD-18 "no fatal surface" (epic 3, AD-15).
- [minor] Recorded dist run is `npm run build && npm run test:e2e:dist`.
- [minor] Handoff rework list includes (b).
- [minor] Probe listener target and `window.__probeEvents`; unprevented-`contextmenu` diagnostic in the halt report.
- [minor] pageHide/pageShow call order per run; `persisted` type-only; visible precondition.
- [minor] Seed (e) fixture origin.
- [minor] Precache scan: no comments/regex in Workbox output; surprises throw.
- [minor] testIgnore glob is absolute-path matched; CI checkout path must not contain `pwa`.
- [minor] `networkidle` excludes SW; no SW waits in epic 1.
- [minor] POSIX-shell scripts, no `cross-env`.
- [minor] Accept Biome reordering of adjacent bare imports in `main.ts`.
- [minor] Non-flow spec names left for D8's AGENTS.md audit.
### Default applied (technical)
- All 14 items above are technical defaults.
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Duplicates merged; none disproved.

## Pass 7 — 2026-09-27
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 1, minor 11, decision-needed 0  |  Dropped in triage: ~10 raw duplicates merged (~22 raw → 12)
### Applied
- [major] Nothing said `touchDrag` and `longPress` self-tests are separate; sharing one probe/array lets the longPress wait return on the drag's pointerup and judge mixed events (false halt or false pass) → two tests, each with a fresh probe and empty `__probeEvents`. (Builder lens rated it minor; kept major because a false halt stops the unattended build.)
- [minor] Probe `contextmenu` listener calls `preventDefault()` (a 600 ms press passes Blink's long-press threshold; as the app's cards will for AD-12), so a halt reflects only CDP/pointer behaviour; halt text updated so this is not "extra setup".
- [minor] `__probeEvents` / new `__lifecycleEvents` typed by local alias + cast, not a global augmentation.
- [minor] `hidePage`/`showPage` guard, override and dispatch in one `page.evaluate`.
- [minor] Seed-case `page1`/`context` defined once; (g) one test per sub-case; guard substrings required; guard check order fixed; `AD-17` titles name the helper.
- [minor] Touch guards: viewport set, points finite and inside, `maxTouchPoints > 0` (exempt list).
- [minor] pwa-config `testIgnore`/`testMatch` on the project objects, none at config level.
- [minor] Evidence: empty `PW_PREVIEW` case; the 1.2-guard run must fail on the dictionary count (0 vs 1) with other pwa tests passing.
- [minor] `tsconfig.e2e.json` `tsBuildInfoFile` under `node_modules/.tmp/`.
- [minor] Precache helper targets `generateSW` output; a parse throw signals revisiting.
- [minor] Handoff: heading owner updates the dist-smoke load criterion; entry 8 reports flaky retries; the direct-write carve-out is recorded in the plan.
- [minor] `e2e/<flow>.spec.ts` drift is outside D8's scope → routed by the owner at gate 4 (the ticket no longer claims D8 covers it).
### Default applied (technical)
- All 12 items above are technical defaults.
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Duplicates merged; none disproved.

## Result — capped at 7 passes
Majors per pass: 13 → 6 → 3 → 3 → 1 → 1 → 1. Every item applied was a technical default (96 in total across passes 1–7); no functionality, UX or gameplay decision arose. Passes 5–7 each found one real major, and each was narrower than the one before: untested guard throws, then the halt-vs-defect match on error text, then touch self-test isolation. The pass 7 fix was not re-reviewed, because the cap was reached; the orchestrator re-read the final ticket and found no contradictions it introduced. The refs are not the cause: the late majors came from the ticket's own growing harness detail (helper guards, halt scoping), not from gaps in AD-17 or build-notes.
