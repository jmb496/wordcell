# Review: ARCHITECTURE-SPINE.md (rubric pass)

- Reviewer: fresh-context rubric reviewer
- Date: 2026-09-27
- Inputs read: ARCHITECTURE-SPINE.md; `src/engine/{types,deal,deal.test}.ts`, `src/main.ts`,
  `vite.config.ts`, `playwright.config.ts`, `package.json`, `biome.json`, `tsconfig*.json`,
  `.gitignore`, `scripts/build-dictionary.mjs`, `data/README.md`; brief §6 and §9; spec §2, §4, §5;
  platform decision §5; installed `node_modules` versions; `workbox-precaching` 7.4.1 and
  `vite-plugin-pwa` 1.3.0 sources.

## Verdict

Strong spine, close to ready. Paradigm, layering, the engine API, the one-writer store, the
persistence and versioning rules, the dictionary and precache single-download scheme, CI and
deploy are all decided and mostly enforceable. The stack table matches the installed versions
(svelte 5.57.1, vite 8.3.1, vitest 5.0.2, typescript 6.0.3, playwright 1.63.0, biome 2.5.14,
vite-plugin-pwa 1.3.0 / workbox 7.4.1, plugin-svelte 7.3.1, svelte-check 4.7.6). The AD-8 Workbox
claim checks out: `PrecacheController.js:103` uses `cache: 'default'` for entries without a
revision, and vite-plugin-pwa sets `dontCacheBustURLsMatching` to `^assets`. Brief §9 duties
are all covered. The measured gzip size of the 3–23 dictionary is 452,971 bytes, which leaves
about 147 KB for HTML, JS, CSS and font under the 600,000-byte budget, so the budget is
feasible.

No critical findings. Two high findings in the test seams (AD-17) would make the brief §6.2
restore tests either fail at random or check the wrong thing. Several medium findings are
real divergence points: two epics or tickets would resolve them differently.

## Findings

### H-1 (high): `addInitScript` fixture seeding re-seeds on reload and breaks the restore tests
- **Location:** AD-17, first bullet.
- **Problem:** `page.addInitScript` runs before **every** navigation in the page, reloads
  included. A restore test that seeds a fixture, plays and then reloads gets its storage
  overwritten by the fixture before the app boots. Then `loaded()` equals the fixture, not the
  state the app last saved, and the §6.2 test fails, or it passes for the wrong reason when
  nothing changed after seeding. Each ticket author will invent a different workaround.
- **Fix:** Put the guard in the rule. `e2e/helpers/seed.ts` exports
  `seedStorage(page, {session, history, prefs})`. It installs an init script that writes the keys
  only when a `sessionStorage` flag `wc-seeded` is absent, then sets the flag, or it seeds with
  `page.evaluate` followed by one `page.reload()`. Every seeding test must use this helper.

### H-2 (high): the restore comparison races the `pagehide` write
- **Location:** AD-17, second bullet, and AD-7's writes on `visibilitychange` and `pagehide`.
- **Problem:** The test "snapshots the three keys before reload and compares `loaded()` after
  reload". But reload fires `pagehide`, and `pagehide` runs `accrue` and then writes. So the
  stored `activeMs` changes after the snapshot, and `loaded().session.activeMs` exceeds the
  snapshot by the ms between snapshot and unload. The result is flaky or always failing. The same
  race affects the brief's "hidden then reloaded" variant.
- **Fix:** Compare against what is in storage at the moment the next document starts, not a
  snapshot taken before unload. Add an init script (guarded as in H-1) that copies the raw
  `wordcell:*` values into `window.__wcRawAtBoot` at document start. The test then asserts
  `loaded()` deep-equals the parsed raw values. Also assert that the fields other than `activeMs`
  equal the pre-reload snapshot, and that `activeMs` is ≥ the snapshot. Alternatively, pin time
  with Playwright's `page.clock`, which also fakes `performance.now`, and say so in AD-9 and
  AD-17.

### M-1 (medium): the R-31 tap-to-k mapping ends up in UI code
- **Location:** AD-2 command union (`setDestinationCount { k }`) and AD-3.
- **Problem:** R-31 is an untagged engine sentence: tapping a card sets k so that the card is the
  top of D, and tapping the current top sets k − 1, clamped at 1. With only
  `setDestinationCount { k }`, the UI must compute k from the tapped card and apply the
  "current top → k−1, clamp" rule. That puts a rule in `src/ui/`, outside Vitest, which breaks
  CLAUDE.md rule 1 and brief §6.4. It is also the kind of drift AD-3 exists to prevent.
- **Fix:** Add the engine command `tapDestinationCard { card: CardId }`, keeping
  `setDestinationCount` for plus/minus, or expose `GameView.draft.kOnTap: Record<CardId, number>`.
  State that the engine owns this mapping and that it is tested under R-31.

### M-2 (medium): GameView lacks the interaction-mode flags, so components will derive inertness
- **Location:** AD-3 enablement list.
- **Problem:** R-39 says columns other than the destination are inert in Composing, and all
  columns and WordCells except target selection are inert in Place. R-75 says no selection or
  drop while status ≠ playing. R-12 says WordCells are not tail sources. These determine which
  elements the pointer controller (AD-12) arms, yet `GameView` has no flag for them. Epics 4 and 5
  would each re-derive them from `phase` and `status`, which AD-3 forbids.
- **Fix:** Add to `GameView` per-column `canPickUp` (tail source), `canDropOn`, `canSetK` (tap in
  destination column), per-cell `canTarget`, and `canConfirm`. Also add a rule to AD-12: the
  controller arms a gesture only when its GameView flag is true.

### M-3 (medium): engine repro tests cannot import e2e fixtures under AD-1's import rule
- **Location:** AD-1 check 2 versus AD-17 ("Vitest reuses them for engine repro cases") and
  brief §6.6.
- **Problem:** AD-1 allows engine files to import only relative paths inside `src/engine/`,
  with tests allowed `vitest` as well. An engine test that loads `e2e/fixtures/*.json` breaks
  that rule. So either the scan is weakened ad hoc or fixtures get duplicated.
- **Fix:** Move shared fixtures to a neutral `fixtures/` at the repo root (or
  `src/engine/fixtures/`). Have AD-1 explicitly allow `*.test.ts` in the engine to read them,
  through a JSON import or through `node:fs` in tests only. Then list the allowed test imports
  exactly.

### M-4 (medium): no decision for two live instances (installed PWA plus a browser tab)
- **Location:** AD-4 and AD-7 (absent).
- **Problem:** The same origin can run in the installed PWA and a desktop or mobile tab at the
  same time. Both hold a Session, and both write `wordcell:session` and `wordcell:history` on
  every dispatch and on hide. The last writer wins: one tab's moves are silently lost, and
  history reconcile can double-record or un-record the other instance's game. That is the "second
  state holder" that brief §6.6 rules out, and each shell ticket would handle it differently or
  not at all.
- **Fix:** Decide it in AD-7. Recommended: listen to the `storage` event for `wordcell:*` in
  `storage.ts`. When another instance writes, show a blocking "Game open elsewhere, Reload"
  surface (AD-15 style) and stop writing. Alternatively, take a Web Locks `navigator.locks`
  single-instance lock at boot. Add an OQ for the message text.

### M-5 (medium): deploy builds a different artifact from the one CI tested, and the pwa project needs its own build
- **Location:** AD-17 (third Playwright project) and AD-18 CI and deploy.
- **Problem:** The `pwa` project runs against a `VITE_TEST_HOOKS=1` build, while the size budget
  and deploy use a build without hooks. The spine doesn't say how many builds CI makes, which one
  is measured, or whether `deploy.yml` rebuilds. If it rebuilds, the bytes that ship were never
  tested, and a rebuild with a different Node or npm state can differ.
- **Fix:** Specify the flow. `ci.yml` builds `dist/` without hooks, runs the size budget, and
  uploads `dist/` as a workflow artifact. It then builds `dist-test/` with hooks for the `pwa`
  project, using a second Playwright `webServer` entry that runs `vite preview --outDir dist-test`
  on a fixed port. `deploy.yml` downloads the `dist/` artifact from the triggering run and runs
  `wrangler deploy` with no rebuild.

### M-6 (medium): screenshot baselines from WSL2 against CI on `ubuntu-latest`
- **Location:** AD-18 CI ("Screenshot baselines are Linux-generated").
- **Problem:** WSL2 Ubuntu and the GitHub runner differ in system fonts and font rendering.
  Any UI text not in the bundled Fraunces subset (DESIGN.md UI text) will diff, and
  `maxDiffPixelRatio: 0.01` will fail CI. Tickets will then either regenerate baselines in CI or
  loosen thresholds, each in its own way.
- **Fix:** Pin one rendering environment. Either run Playwright in CI and locally inside
  `mcr.microsoft.com/playwright:v1.63.0-noble` and generate baselines with that container, or
  make screenshot tests CI-generated through an `--update-snapshots` workflow dispatch. Record
  the choice in AD-17 or AD-18.

### M-7 (medium): AD-1's text scan will false-positive on comments and English words
- **Location:** AD-1 check 2 token list.
- **Problem:** `process`, `window`, `document`, `console`, `Date` and `fetch` are ordinary
  words in doc comments ("process the move", "the Place window", "update"). The scaffold's own
  engine comments are prose-heavy. A raw substring scan fails on them, and ticket authors will
  either reword comments or loosen the regex, differently each time.
- **Fix:** Specify the matcher: strip `//` and `/* */` comments and string literals, then match
  `\b(token)\b` on identifiers, with `Date` as `\bDate\b` and not a substring. Or better, walk the
  TypeScript AST (`ts.createSourceFile`) for identifier references to those globals. State
  which one.

### M-8 (medium): store behaviour when the Session is rejected is undefined
- **Location:** AD-4 and AD-7 (launch with rejected Session).
- **Problem:** AD-4 holds `Session` in a `$state.raw` rune with `GameView` derived. AD-7 says a
  rejected Session is not written until New game. It is not decided what the store holds
  meanwhile (null or a sentinel), whether the clock runs, or whether the hide or pagehide writes
  are suppressed. A naive `pagehide` flush would write the rejected key or crash on a null
  Session. Epic 3 and epic 6 (Session-rejected message) could diverge.
- **Fix:** Add to AD-4: the store state is
  `{ kind: 'ready', session } | { kind: 'rejected', reason }`. In `rejected`, `dispatch` throws,
  the clock is stopped, the hide or pagehide handlers write nothing, and only `newGame()` leaves
  the state.

### L-1 (low): scaffold divergences not flagged as changes
- **Location:** preamble ("where the scaffold diverges, the AD says what changes"), AD-2, AD-5,
  AD-16.
- **Problem:** The spine only partly names these changes:
  - The scaffold's `Card {id, letter}` objects, `deal()` returning `Card[][]`, and
    `ENGLISH_DISTRIBUTION`/`STUCK_PENALTY_PER_CARD` in `types.ts` become `CardId` and `LangData`
    (`EN`).
  - `vite.config.ts` has `registerType: 'autoUpdate'`, which makes vite-plugin-pwa set
    `skipWaiting` and `clientsClaim` (`dist/index.js:875`), and has no `injectRegister: false`.
  - The manifest colours `#1c2331` and `display_override: fullscreen` differ from DESIGN.md's
    `#15171B` and standalone.
  - `package.json` `check` doesn't yet run the engine tsconfig.
  - The existing deal tests carry no R-ids.
  - `data/README.md` still says "filter to 3–10".
- **Fix:** Add a short "Scaffold deltas" list under the preamble, or mark each affected AD with
  `[CHANGES SCAFFOLD: …]`, so epic 1 and epic 2 tickets see them as required changes.

### L-2 (low): `vite dev`, Playwright and svelte-check need the generated dictionary
- **Location:** AD-8 (`generated/dictionary/en.txt` imported with `?url`).
- **Problem:** `npm run dev`, which Playwright's `webServer` calls, fails on a fresh clone
  because only `build` runs `build:dictionary`. CI's order happens to work; local and fresh
  worktrees for `bmad-build-auto` won't.
- **Fix:** Add `predev` and `pretest` hooks (or `prepare`) that run `build:dictionary` when the
  output is missing or older than the source, and state it in AD-8.

### L-3 (low): no rollback procedure under a service-worker-cached app
- **Location:** AD-18 and Deferred (operations).
- **Problem:** Operations are otherwise decided. A bad deploy reaches clients once, and with
  `prompt` and no `skipWaiting` a fix reaches them only after the next full close and relaunch.
  Nothing says how to roll back.
- **Fix:** Add one line. Rollback is `git revert` on `main`, which triggers a green deploy, or
  `wrangler rollback`. Clients pick it up on their second launch after the fix. No kill-switch
  worker in v1 (deferred).

### L-4 (low): AD-15's font-load check may not detect failure
- **Location:** AD-15.
- **Problem:** `document.fonts.load()` can resolve with an empty list or with faces in status
  `error` rather than rejecting, depending on the browser. A plain `await` will not reach the
  fatal surface.
- **Fix:** Specify the check: `const faces = await document.fonts.load('600 1em WordCellSerif')`,
  and fail when `faces.length === 0` or any `face.status !== 'loaded'`.

### L-5 (low): who owns the `visibilitychange` and `pagehide` listeners
- **Location:** AD-4, AD-7, AD-9.
- **Problem:** Only the store may call `accrue`, yet AD-7 and AD-9 describe the hide and pagehide
  flushes without naming a module. `clock.ts` needs visibility for timing, and the store needs it
  for flushing. Two modules could register their own listeners in either order.
- **Fix:** State that `clock.ts` owns the listeners and calls one store callback `onHide()`,
  registered at boot, which runs accrue and then write. Alternatively, the store owns them and
  calls `clock.pause()`.

### L-6 (low): Deferred "animation implementation, epic 5 decides" arrives after epic 4 animates
- **Location:** Deferred, and the epic 4 and 5 table.
- **Problem:** Epic 4 already moves cards (drop → Composing, return-on-cancel drag). It will
  choose an animation mechanism before epic 5 "decides", which can leave two mechanisms.
- **Fix:** Either decide now (FLIP with the Web Animations API, durations from `--wc-base-ms`),
  or move the decision to epic 4.

## Checklist summary

| Check | Result |
| --- | --- |
| Fixes the real divergence points | Mostly; gaps M-1, M-2, M-4, M-5, M-6, M-8 |
| Each AD rule is enforceable and prevents its divergence | Yes, except AD-17 (H-1, H-2), AD-1 matcher (M-7), AD-1 vs AD-17 (M-3) |
| Deferred items cannot cause divergence | One risk (L-6) |
| Named tech is current | Yes; matches installed versions; Workbox claim verified |
| Ratifies the scaffold | Yes in substance; deltas under-flagged (L-1) |
| Deployment, environments, operations | Decided; rollback missing (L-3); build artifact flow (M-5) |
| Brief §9 duties | All covered (stack, boundaries, R-84 boundary, PRNG, dictionary build/load/precache, failed-load surfacing, persistence/versioning, PWA, CI and deploy, Cloudflare, ENABLE provenance, R-74/R-76/§7.10 shell duties, `storage.persist`, purity check, size script, touch helper) |
| Brief §6 duties | §6.2 read-back defined but flawed (H-1, H-2); §6.5 decided; §6.6 fixtures conflict (M-3); §6.7 and §6.8 covered; budget feasible (dictionary 452,971 B gzip) |
