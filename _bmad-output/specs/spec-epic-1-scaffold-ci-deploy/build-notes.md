# Build notes — epic 1

How-level guidance per capability. The spine ADs are the rule; these notes fix the choices the
spine leaves open and name the traps found in the scaffold. `[ASSUMPTION]` marks inferences.

## Scaffold facts that bite

- `src/App.svelte` value-imports `./engine/deal`; after the move to `src/ui/` that violates AD-1
  (D1).
- An untracked `public/dictionary/en.txt` (3–10 build) is on disk. Once `.gitignore` drops
  `public/dictionary/`, it would be committed or shipped and precached. Delete the folder in CAP-2.
- `e2e/smoke.spec.ts` is not id-named and locates `.card`; rename to `AD-17 …` and locate
  `card-<CardId>` test ids (the placeholder's card elements get `data-testid`, `data-card-id`,
  `data-place="column"`, AD-14).
- `src/engine/deal.test.ts` names are not id-named; epic 1 does not touch them (epic 2 renames).
- Host Node is 24.1.0 and the floor is 22.12: no `import.meta.main`.

## CAP-1 Purity checks

- `src/engine/tsconfig.json`: `lib: ["ES2023"]`, `types: []`, `strict`, `noEmit`,
  `moduleResolution: "bundler"`, include `./**/*.ts`, exclude `./**/*.test.ts`.
- `src/architecture.test.ts` reads files with `node:fs`; the app tsconfig has no Node types, so
  give that file Node types without widening them for the rest of `src/` `[ASSUMPTION]`.
- Scan scope (owner, 2026-09-27; ticket 1.1 OQ #1, #5): `.ts`, `.js`, `.svelte` (script
  blocks; ownership checks also on markup minus `<style>`); `.mjs`, `.cjs`, `.mts`, `.cts`,
  `.tsx`, `.jsx` anywhere under `src/`, and `.js`/`.svelte` under `src/engine/`, fail. Any code file under `src/` outside `engine/`, `shell/`, `ui/`, `main.ts`,
  `architecture.test.ts`, `*.d.ts` fails, so a new top-level file cannot dodge the layer table.
- Matcher first, tree second: test the stripper and regexes on inline fixture strings, then scan
  the real tree. The file is excluded from its own scan (AD-1).
- Biome 2.5 override: `includes: ["src/engine/**", "!src/engine/**/*.test.ts"]`,
  `noRestrictedGlobals` with AD-1's identifier list (not `Math.random`, not `Math[`).
- D1: add `src/engine/index.ts` (exports `deal`, `Card`, `Letter` and what the placeholder types
  need); `main.ts` passes `deal(1)` columns as a prop; `src/ui/App.svelte` uses `import type`.

## CAP-2 Dictionary

- Pure exports: `filterWords(text) → string`, `isStale(outMtime, inputMtimes) → boolean`,
  `sha256(buffer)`; CLI entry guarded by `process.argv[1] === fileURLToPath(import.meta.url)`.
- Expected SHA-256 is a constant in the script; the test asserts `data/README.md` carries the same
  hash, so the two cannot drift.
- Hooks call one CLI mode that checks staleness; `prebuild` and `prebuild:test` use the same mode.
- `?url`: stub `src/shell/dictionary.svelte.ts` exports the URL from
  `../../generated/dictionary/en.txt?url`; `main.ts` imports it so the asset is emitted
  `[ASSUMPTION]`. No fetch in epic 1 (AD-16 boot order is epic 3).

## Tests of `scripts/*.mjs` (settles AGENTS.review-log D2; D3)

- Location: `scripts/<name>.test.mjs` beside the script.
- Runner: Vitest; `vite.config.ts` `test.include` becomes `['src/**/*.test.ts',
  'scripts/**/*.test.mjs']`, environment `node`. They run in `npm run test`, CI's unit step and the
  5 s budget.
- Names start with the AD they verify (`AD-8 …`, `AD-18 …`); never R-id coverage.
- Inline fixtures; the only real-file reads are `data/README.md` and a hash of
  `data/enable1.txt` (fast).
- Type-checking `[ASSUMPTION]`: `// @ts-check` in each `.mjs`, `tsconfig.node.json` includes
  `scripts/**/*.mjs` so `npm run check` covers them. `build-font.py` has no tests (A-A5: not run in
  CI).

## CAP-3 Harness

- `playwright.config.ts`: `android` (Pixel 7), `desktop`; `testIgnore: ['**/*.screens.spec.ts',
  '**/pwa/**']` `[ASSUMPTION]`.
- `playwright.pwa.config.ts` (D5): `testDir: 'e2e/pwa'`; projects `pwa` (Chromium, `dist-test/`)
  and `dist-smoke` (`dist/`); `webServer` chosen by `PW_PREVIEW`, throw when unset. Scripts:
  `build:test` = `VITE_TEST_HOOKS=1 vite build --outDir dist-test`; `test:e2e:pwa` =
  `npm run build:test && PW_PREVIEW=dist-test playwright test -c playwright.pwa.config.ts --project pwa`;
  `test:e2e:dist` = `PW_PREVIEW=dist playwright test -c playwright.pwa.config.ts --project dist-smoke`
  (needs a prior `npm run build`).
- `pwa` precache check: fetch `/sw.js`, extract the precache manifest, assert the `assets/en-*.txt`
  (and, from CAP-4, the font) entries have `revision: null`. Under preview there are no immutable
  headers; do not count requests (AD-17).
- `src/shell/test-hook.ts`: install a frozen empty `window.__wordcell` iff
  `import.meta.env.DEV || import.meta.env.VITE_TEST_HOOKS === '1'`, written so the production
  build drops it (`grep` check).
- Helpers per AD-17 (`e2e/helpers/seed.ts`, `touch.ts`, `lifecycle.ts`). Self-tests use raw
  strings as stored values; valid Session fixtures (`fixtures/*.json`) wait for epic 2's
  serialiser. `touch.ts` uses CDP `Input.dispatchTouchEvent`; self-test on `android`.

## CAP-4 Font

- `scripts/build-font.py`: uv inline-script header pins fontTools and brotli; source
  `[ASSUMPTION]` `google/fonts` `ofl/fraunces` variable TTF at a pinned commit, downloaded to
  `generated/font/`, SHA-256 checked against `data/README.md` (URL and hash recorded there).
  Instance wght 600, opsz 48, SOFT 0, WONK 0; subset A–Z and `u`; woff2.
- `@font-face` `'WordCell Serif'` in `src/ui/app.css`, `font-display: block`; preload in
  `index.html` with `as="font" type="font/woff2" crossorigin`, pointing at the source path so Vite
  rewrites it to the same hashed file as the CSS.

## CAP-5 Packaging

- Manifest exactly A-D5; keep `includeAssets: ['favicon.svg']`.
- `scripts/build-icons.mjs`: Playwright Chromium renders committed SVG sources
  (`scripts/icons/*.svg` `[ASSUMPTION]`) at 192 and 512, maskable art inside the central 80 %;
  run on the host, not in CI (A-A7). Art per DESIGN.md App icon; owner judges it at gate 4.
- Palette: DESIGN.md `colors` as `--wc-<token>` custom properties `[ASSUMPTION]`.

## CAP-6 Size budget

- Counted set per AD-18 from `dist/.vite/manifest.json`: `index.html`, the entry's JS and CSS
  and every chunk reachable from it, excluding the dynamic-import chunk of `src/shell/sw.ts` and
  static imports reachable only through it (none exist until epic 7; the fixture test covers
  it), plus the font and the dictionary. Gzip level 9; 600,000-byte limit; fail if font or
  dictionary absent from the set.
- Separately fail on any file matching AD-16 `globPatterns` over 4,000,000 bytes.
- Pure `computeBudget(manifest, sizes)`; `postbuild` only after `build` (not `build:test`).
- Expect ≈ 454,262 B for the dictionary (measured 2026-09-27).

## CAP-7 Screenshots

- `test:screens` `[ASSUMPTION]`: `docker run --rm --ipc=host` of
  `mcr.microsoft.com/playwright:v1.63.0-noble`, repo mounted, `node_modules` in a named volume
  (host and container binaries must not mix), running `npm ci && npm run test:screens:run`;
  `test:screens:run` = `playwright test -c playwright.screens.config.ts`.
- First spec (D4): `e2e/placeholder.screens.spec.ts`, test `AD-17 placeholder board screenshot`,
  `android` and `desktop`; baselines committed.

## CAP-8 CI

- Triggers: `push` (all branches) and `pull_request`. Node 24, npm cache, `npm ci`,
  `npx playwright install --with-deps chromium` on the runner jobs.
- Job order per AD-18; upload `dist/` with `actions/upload-artifact` under a fixed name (`dist`)
  for `deploy.yml`. The screenshot job runs in `container: mcr.microsoft.com/playwright:v1.63.0-noble`
  and calls `npm run test:screens:run`; upload Playwright reports on failure.
  The screenshot job sets `env: WORDCELL_SCREENS_CONTAINER: '1'` (ticket 1.7: `playwright.screens.config.ts` throws at load otherwise).
- Local proof (D6): actionlint (Docker `rhysd/actionlint`) `[ASSUMPTION]` plus each step's npm
  script.

## CAP-9 Deploy

- First step: `git remote get-url origin` = `github.com/jmb496/wordcell`; `gh secret list` shows
  `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (both present 2026-09-27). Halt only if
  absent.
- `deploy.yml`: `on: workflow_run` of `ci.yml`, `types: [completed]`; run only when
  `conclusion == 'success'`, `event == 'push'`, `head_branch == 'main'`; `permissions:
  actions: read, contents: read`; `actions/download-artifact` with `run-id` and `github-token`;
  `npm ci`; `npx wrangler deploy` with the two secrets as env; `concurrency: deploy` `[ASSUMPTION]`;
  then `curl -sI` the AD-18 header checks against the deployed URL `[ASSUMPTION]`.
- `wrangler.jsonc`: `name: "wordcell"`, a pinned `compatibility_date`, `workers_dev: true`,
  `assets: { directory: "./dist" }`, no `main`, no `not_found_handling`.
- `public/_headers` per AD-18; `public/.assetsignore` lists `.vite`. Both are copied into `dist/`
  by Vite.
- Rollback per AD-18: revert on `main` or `wrangler rollback`.

## Decisions (rationale; accepted by the owner 2026-09-27)

- **D1** Entry may import everything, UI only types: passing data from `main.ts` is the one shape
  that satisfies AD-1 without inventing a shell store epic 3 owns.
- **D2** AGENTS.md Policy requires the golden test before any distribution-data change, and the
  golden test plus R-85/R-81 are epic 2's; doing it in epic 1 would pull engine rules forward.
- **D3** Vitest is already installed, fast and the runner `test:all` calls; a second runner
  (`node --test`) adds a script and a report format for two files.
- **D4** Pipeline proof needs a real compare; the placeholder is the only UI until epic 4.
- **D5** AD-17 puts both projects in one config; CI (AD-18) runs `dist-smoke` before `dist-test/`
  exists, so a static `webServer` array would fail.
- **D6** Rule 7 and the build skills forbid pushing.
- **D7** Nothing shows the version before the epic 6 menu.
- **D8** The TODO line's own text asks for per-item removal; the managed-block rule asks for the
  skill; both are honoured.
