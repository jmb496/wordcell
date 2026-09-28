# Delta → acceptance checks

Every spine Scaffold delta and every item of Proposed epics row 1, with the capability that lands
it and the check that proves it. A ticket plan names these checks in its sentence → test mapping.
"e2e" = default config; "pwa" / "dist-smoke" = `playwright.pwa.config.ts` projects.

## Scaffold deltas

| Delta (spine) | CAP | Acceptance check |
| --- | --- | --- |
| `build-dictionary.mjs` 3–10 → 3–23, writes `generated/` | 2 | `AD-8` script tests on inline fixtures: 2- and 24-letter words dropped, 3 and 23 kept, non-`a–z` dropped, order kept, LF + trailing newline. Real run: 172,713 lines, file at `generated/dictionary/en.txt`. |
| `data/README.md` text and checksum | 2 | README states 3–23 and 172,713 words and SHA-256 `3f16130220645692ed49c7134e24a18504c2ca55b3c012f7290e3e77c63b1a89`; `AD-8` test asserts the script's expected hash equals the README's; a one-byte-changed copy makes the script exit non-zero. |
| `.gitignore`: add `generated/`, `dist-test/`; drop `public/dictionary/` | 2 (`generated/`), 3 (`dist-test/`) | `git check-ignore generated/dictionary/en.txt dist-test/x` succeeds; `public/dictionary/` absent from disk and from `dist/`. |
| `vite.config.ts` `registerType` → `'prompt'`, `injectRegister: false` | 5 | No `registerSW.js` in `dist/`; built `index.html` contains no SW registration script; config diff. |
| Manifest per A-D5 | 5 | Build-output test reads `dist/manifest.webmanifest` and deep-equals A-D5: name, short_name, description, `#15171B` ×2, `standalone`, `portrait`, icons 192 `any`, 512 `any`, 512 `maskable`; no `display_override`. |
| `globPatterns`, size limit (AD-16) | 5 | `dist/sw.js` precache list contains `index.html`, JS, CSS, the dictionary, the font, the icons and `manifest.webmanifest`; config has `maximumFileSizeToCacheInBytes: 4_000_000` and no `dontCacheBustURLsMatching`. |
| `build.manifest: true` | 5 | `dist/.vite/manifest.json` exists after `npm run build`. |
| `App.svelte`, `app.css` → `src/ui/`; drop `overflow: hidden`; keep `overscroll-behavior: none`; DESIGN.md palette | 1 (move), 5 (styles) | CAP-1: files absent at `src/` root, AD-1 scan green. CAP-5: e2e `AD-11` case reads computed `overflow` ≠ `hidden` on `html`/`body`, `overscroll-behavior` `none`, `body` background `rgb(21, 23, 27)`; DESIGN.md `colors` exist as custom properties in `src/ui/app.css`. |
| `index.html`: title, `viewport-fit=cover`, `theme-color`, font preload | 5 (head), 4 (preload) | e2e `AD-16` case reads `document.title`, the viewport and theme-color metas; build-output check: preload `href` in `dist/index.html` equals the hashed font URL in the CSS. |
| `public/icons/` generated | 5 | `node scripts/build-icons.mjs` writes `icon-192.png`, `icon-512.png`, `icon-512-maskable.png` at those pixel sizes from committed SVGs; all three committed; maskable art inside the central 80 % (visual, owner at gate 4). |
| `package.json` `predev`/`pretest`/`pretest:watch`/`pretest:e2e` | 2 | Fresh clone (`rm -rf generated`) then each of `npm test`, `npm run test:e2e`, `npm run dev` creates the file; a second run with an up-to-date file does not rewrite it (mtime unchanged); touching `data/enable1.txt` or the script makes the next hook regenerate. `AD-8` script test covers the staleness function. |
| Dictionary generation `build` → `prebuild` | 2 | `build` script is `vite build` only; `npm run build` on a fresh clone succeeds. |
| `postbuild` | 6 | `npm run build` prints the size table; `AD-18` script tests (see CAP-6). |
| `build:test` with `prebuild:test` | 3 | `npm run build:test` on a fresh clone writes `dist-test/` with hooks (pwa sees `window.__wordcell`). |
| `test:e2e:pwa`, `test:all` per AD-17 | 3 | `test:all` = lint + check + unit + `build` (size budget) + `test:e2e:dist` + `test:e2e` + `test:e2e:pwa`, green; screenshots stay container-only (`npm run test:screens`) (ticket 1.10, 2026-09-28). |
| `test:screens` | 7 | Runs the container; generates, then on a second run compares, the baseline. |
| `check` gains `tsc -p src/engine/tsconfig.json` | 1 | Script text; a scratch `document.title` in an engine source fails `npm run check` (shown in the plan, reverted). |
| `wrangler` devDependency | 9 | `package.json` pins `wrangler` `4.141.0` exactly. |
| `playwright.config.ts` `testIgnore` `*.screens.spec.ts` | 3 | `npx playwright test --list` shows no screens or `e2e/pwa/` spec. |
| `playwright.pwa.config.ts`, `playwright.screens.config.ts` | 3, 7 | Both configs exist; `--list` per config shows only their projects' specs. |
| CLAUDE.md rule 5 / Commands / Testing lines | — | Already done with the spine and AGENTS.md; AGENTS.md `TODO(epic 1)` items dropped per D8. |
| `types.ts` → `LangData`; `STUCK_PENALTY_PER_CARD` → R-81 | — | Moved to epic 2 (D2). |

## Other epic-1 items (Proposed epics row 1)

| Item | CAP | Acceptance check |
| --- | --- | --- |
| `src/engine/tsconfig.json` (`lib: ["ES2023"]`, `types: []`, tests excluded) | 1 | As the `check` row; an engine `*.test.ts` using `vitest` still type-checks under the app config. |
| `src/architecture.test.ts` | 1 | `AD-1` fixture cases per SPEC CAP-1 success; the scan passes on the tree. |
| Biome `noRestrictedGlobals` for `src/engine/**` | 1 | `npx biome lint` on a scratch engine source using `window` reports the rule; the same in a `*.test.ts` does not. |
| `?url` wiring | 2 | One `dist/assets/en-*.txt`, byte-equal to `generated/dictionary/en.txt`; pwa check finds it in the precache list with `revision: null`. |
| Font subset | 4 | CAP-4 success. |
| Test hook module and gating | 3 | pwa: `window.__wordcell` defined; dist-smoke: undefined; `grep -r __wordcell dist/` empty. |
| seed / touch / lifecycle helpers | 3 | `AD-17` helper self-tests (e2e, `android`). |
| `pwa` project | 3 | Precache manifest check (dictionary, later font) passes; since ticket 1.10 the precache check also runs under `dist-smoke`, with exactly one entry per URL. |
| `dist-smoke` project | 3 | Load, 52 live cards, no errors, no hook; since ticket 1.10 also the hook-free precache, build-output and font specs against `dist/`. |
| Screenshot container | 7 | CAP-7 success. |
| `ci.yml` | 8 | actionlint clean; every step's npm script passes locally; first pushed run green (owner). Since ticket 1.11 (2026-09-28): the `actionlint` step runs in CI; `scripts/flaky-report.test.mjs` `AD-18` tests pass and the pushed run shows the flaky-report summary. |
| `deploy.yml`, `wrangler.jsonc`, `_headers`, `.assetsignore` | 9 | CAP-9 success. Since ticket 1.11 (2026-09-28): `scripts/deploy-check.test.mjs` and `scripts/deploy-config.test.mjs` `AD-18` tests pass; the Deploy run's post-deploy log shows every check `ok:`, including the dictionary and woff2. |
