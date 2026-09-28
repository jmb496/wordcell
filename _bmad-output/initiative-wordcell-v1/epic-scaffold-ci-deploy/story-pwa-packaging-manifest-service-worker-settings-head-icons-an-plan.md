---
title: 'PWA packaging: manifest, service-worker settings, head, icons and palette'
type: 'feature'
ticket: '5'
created: '2026-09-28'
baseline_revision: 'e744fa80e79ad854e421ff3dfd335c2587367647'
status: 'built'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/story-pwa-packaging-manifest-service-worker-settings-head-icons-an.md'
warnings: ['oversized']
deferred:
  - summary: >-
      The epic-autopilot usage-limit stop rule names no match pattern and no order against the missing-JSON rule.
    evidence: |-
      Commit 7efec94 (after this plan's baseline, not ticket 1.5 work) added "If the log ends with a usage or session limit message, stop" to .claude/skills/epic-autopilot/SKILL.md without example text or precedence; the fix edits an agent-context skill file, so it is deferred.
    location: >-
      .claude/skills/epic-autopilot/SKILL.md
    severity: low
---

<intent-contract>

## Intent

**Problem:** The scaffold's PWA packaging is not the spine's shape: `registerType: 'autoUpdate'` auto-registers a worker, the manifest differs from DESIGN.md A-D5 (description, colours, `display_override`, no `purpose: 'any'`), the precache globs miss `webmanifest`, `build.manifest` is off (CAP-6 needs `dist/.vite/manifest.json`), `public/icons/` is empty, the head says `scaffold`, and `app.css` uses scaffold colours with `overflow: hidden` (AD-11 forbids clipping).

**Approach:** Set `vite.config.ts` and `index.html` to AD-16; add `scripts/build-icons.mjs` (Playwright Chromium renders committed SVG sources to three PNGs and copies the favicon source) with its Vitest tests; put the 18 DESIGN.md `colors` into `src/ui/app.css` as `--wc-*` and remap the scaffold colour literals by role; prove it all with `e2e/pwa/build-output.spec.ts`, an extended `e2e/pwa/precache.spec.ts`, and `e2e/app-shell.spec.ts`.

## Boundaries & Constraints

**Always:** The story file (in `context`) is the contract: its **Delta checks**, **Tests** and **Owner checks** bullets are normative word for word (expected manifest object, precache set rules and duplicate-revision rule, SVG source rules (a)–(f) and the favicon's no-text rule, `ICONS`/`FAVICON`/`readSources`/`readFont` exports and error order, the regeneration procedure, head and style assertions, test names starting `AD-16 …`/`AD-18 …`/`AD-11 …`). Rule 6 fail fast; cite ids in tests and comments. The regeneration procedure (a second run changing any output is a Halt recording the files) and the in-page font check (throw unless `document.fonts.load` yields one face with status `loaded`) are proven by the plan's run log and the gate-4 look, not by tests (story). Confirm ports 5173 and 4173 are free (`ss -ltn`) before every Playwright run; never start dev servers manually.

**Never:** everything in the story's **Never** line (registration code or `src/shell/sw.ts`, `beforeinstallprompt`/install UI, postbuild or size-budget script, `*.screens.spec.ts`, new npm dependency, AGENTS.md edit, `dontCacheBustURLsMatching`, `devOptions`, a console-error filter in `dist-smoke.spec.ts`); a new `package.json` script; changing `build.assetsInlineLimit`, `tsconfig.node.json`, `src/main.ts` or `.meta { opacity: 0.7 }`; restoring `overflow: hidden`; committing (build-auto's own commit step excepted); pushing.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Missing source | one of `icon.svg`, `icon-maskable.svg`, `favicon.svg` absent | `readSources` throws naming the first missing in `ICONS` then `FAVICON` order; no Chromium launched | throw, non-zero exit |
| Missing font | woff2 path absent | `readFont` throws naming the path | throw |
| Duplicate precache URL | icons/favicon/manifest listed by glob and plugin | each such URL ≤ 2 entries, all with one identical revision | revision mismatch is a Halt (plan records URLs and revisions) |

</intent-contract>

## Code Map

- `vite.config.ts` -- VitePWA: `registerType: 'prompt'`, `injectRegister: false`, manifest exactly the story's expected object minus plugin-added `start_url`/`scope`/`lang` (drop `display_override`; `purpose: 'any'` on the two `any` icons), `workbox.globPatterns: ['**/*.{js,css,html,txt,woff2,png,svg,webmanifest}']`, `maximumFileSizeToCacheInBytes: 4_000_000`; keep `includeAssets: ['favicon.svg']`; `build: { manifest: true, assetsInlineLimit: <unchanged> }`. vite-plugin-pwa is 1.3.0; no `devOptions`.
- `index.html` -- `<title>WordCell</title>`; viewport `width=device-width, initial-scale=1.0, viewport-fit=cover`; add `<meta name="theme-color" content="#15171B" />`; keep the favicon link and the font preload as they are. The plugin injects the manifest link at build only.
- `src/ui/app.css` -- keep `@font-face`. `:root`: `color-scheme: dark`, font-family unchanged, 18 `--wc-<key>: <DESIGN.md value verbatim>` in DESIGN.md `colors` order (`table` … `scrim` `#000000B3`), `color: var(--wc-ink-primary)`, no `background`. `html, body`: `margin: 0`, `overscroll-behavior: none`, `height: 100%`, `background: var(--wc-table)`; remove `overflow: hidden` and its comment. `#app { height: 100% }` stays.
- `src/ui/App.svelte` -- `.card` `background: var(--wc-card-face); color: var(--wc-card-ink)`; nothing else.
- `e2e/pwa/font.spec.ts` -- source of `distTest`, `readSite`, `linkTags`, `relOf` (move, names kept) and its inline `readdirSync` walk (replace with `walk(distTest())`; `walk` returns paths relative to its root, same as today's `path.relative(root, …)`). Keep `fontFaceBlocks`, `urls`, `sitePathname` local.
- `e2e/helpers/dist-test.ts` (new) -- exports `distTest()`, `readSite(sitePath)`, `tags(html, name)` (generalise the `linkTags` regex to `<name\b…>`, case-insensitive), `linkTags(html)` = `tags(html, 'link')`, `relOf(link)`, `walk(root)` (sorted POSIX relative paths; use `path.posix`/split-join so it is POSIX on any host). Root = `path.resolve(import.meta.dirname, '../../dist-test')`.
- `e2e/helpers/precache.ts` -- `readPrecacheManifest(request)` reuse as is (pwa project serves `dist-test` on 4173).
- `e2e/pwa/precache.spec.ts` -- keep both existing tests; add the story's `AD-16 …` precache-set case (walk filter: extension regex `/\.(js|css|html|txt|woff2|png|svg|webmanifest)$/`, drop paths with any segment starting `.`, root `sw.js`, root `/^workbox-[^/]+\.js$/`; comments per story).
- `e2e/pwa/build-output.spec.ts` (new, runs in the `pwa` project, no config change) -- `AD-16` manifest `toEqual`; `AD-16` no registration (no `registerSW.js`; `index.html` and every `assets/*.js` free of `registerSW`, `serviceWorker.register`, `vite-plugin-pwa:`, `virtual:pwa-register`; `sw.js` without `clientsClaim`; comments: no `skipWaiting` assertion, epic 7 narrows the `assets/*.js` scan); `AD-16` built head; `AD-16` icon sizes (exactly three PNGs in `icons/`, signature + `IHDR` + big-endian `readUInt32BE(16/20)`); `AD-18` `.vite/manifest.json` (`index.html` entry `isEntry: true`, `file` starts `assets/`).
- `e2e/app-shell.spec.ts` (new, default config: `android` + `desktop` against `vite dev`) -- `AD-16` head case (title, one theme-color, one viewport exact content, zero `link[rel~=manifest]`, zero `script[id^="vite-plugin-pwa:"]`); `AD-11` style case per story (loop dark/light via `page.emulateMedia`, 18-key list with length assert, overflow `visible`, overscroll `none`, backgrounds, colours, `color-scheme`). `tsconfig.e2e.json` lib has no `DOM.Iterable`: no `for…of` over DOM collections in `evaluate`.
- `scripts/build-icons.mjs` (new, `// @ts-check`) -- header comment: purpose, A-A7 host-only, `@playwright/test` 1.63.0, printed Chromium version, "editing an SVG requires a rerun and a commit of the PNGs and `public/favicon.svg`". Exports `ICONS`, `FAVICON`, `readSources(sourceDir)`, `readFont(fontPath)`; `main()` guarded like `scripts/build-dictionary.mjs` (`realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)`). Paths from `import.meta.dirname`. `main`: `readSources` + `readFont` → `mkdir public/icons` recursive → `const { chromium } = await import('@playwright/test')` → launch, print `browser.version()` → per icon: `newPage({ viewport: {width:size,height:size}, deviceScaleFactor: 1 })`, `setContent` wrapper (story's CSS + `@font-face` base64 `data:` URL), `page.evaluate` of a string that awaits `document.fonts.load('600 1em "WordCell Serif"', 'W')` and checks one face with status `loaded` (throw otherwise), `page.screenshot({ path, omitBackground: false })` → copy favicon bytes → close browser in `finally`. In-page code as strings (lib ES2023, no DOM).
- `scripts/build-icons.test.mjs` (new) -- story Tests: `ICONS`/`FAVICON` equality, `readSources` four temp-dir cases (`mkdtempSync(os.tmpdir())`), `readFont` missing path, rules (a)–(f) on the three committed sources with a hand-written tokenizer, `public/favicon.svg` byte-equal to `scripts/icons/favicon.svg`. Real-file reads are the recorded exception to the inline-fixtures rule. Must not import Playwright (the script's dynamic import keeps it out).
- `scripts/icons/icon.svg`, `scripts/icons/icon-maskable.svg`, `scripts/icons/favicon.svg` (new) -- art per Design Notes; `public/icons/icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `public/favicon.svg` generated.
- `playwright.pwa.config.ts`, `playwright.config.ts` -- no change needed (`pwa` runs every `e2e/pwa/*.spec.ts` but dist-smoke; default ignores `**/pwa/**`).

## Tasks & Acceptance

**Execution:**
- [x] `vite.config.ts`, `index.html` -- AD-16 settings and head per Code Map.
- [x] `src/ui/app.css`, `src/ui/App.svelte` -- palette, role remap, overflow removal per Code Map.
- [x] `scripts/icons/*.svg` -- draw the three sources per Design Notes and rules (a)–(f).
- [x] `scripts/build-icons.mjs` -- per Code Map; run it, `git add public/icons public/favicon.svg`, run again, `git diff --exit-code --stat public/icons public/favicon.svg` (quote command, output, exit code and printed Chromium version in Implementation Notes). Look at each PNG (Read tool) and fix the art if the W is not the serif, the card is clipped or the maskable card leaves the 204.8 px safe circle.
- [x] `scripts/build-icons.test.mjs` -- story's `AD-16 …` cases.
- [x] `e2e/helpers/dist-test.ts`, `e2e/pwa/font.spec.ts` -- move helpers, add `tags`, `walk`; font spec behaviour unchanged.
- [x] `e2e/pwa/precache.spec.ts`, `e2e/pwa/build-output.spec.ts`, `e2e/app-shell.spec.ts` -- story cases.
- [x] Plan `## Implementation Notes` -- quoted `vite.config.ts` diff (registerType, injectRegister, build.manifest beside unchanged assetsInlineLimit, globPatterns, size limit), `app.css` `:root` diff (18 declarations, overflow removed, height kept), `App.svelte` `.card` diff; the A-D5 reading ("no other authored fields"; plugin adds `start_url`, `scope`, `lang`); the inline-fixture exception; the flourish-on-card reading; the regeneration evidence; `test:all` and `npm run build && npm run test:e2e:dist` results; `test ! -e dist/registerSW.js && test -f dist/.vite/manifest.json && echo PASS` with its `PASS` line; markdown image links `../../../public/icons/icon-192.png`, `../../../public/icons/icon-512.png`, `../../../public/icons/icon-512-maskable.png`, `../../../public/favicon.svg`.

**Acceptance Criteria:**
- Given `npm run build:test`, when the `pwa` project runs, then `build-output.spec.ts` passes (manifest deep-equal to A-D5 plus plugin `start_url`/`scope`/`lang`; no registration; built head; three icon sizes; `.vite/manifest.json` entry) and `precache.spec.ts` passes (unique precache set = AD-16 glob set of `dist-test/`, duplicates carry one revision).
- Given `vite dev`, when `e2e/app-shell.spec.ts` runs in `android` and `desktop`, then the head case and the dark/light style case pass.
- Given the committed SVGs, when `node scripts/build-icons.mjs` runs twice with `git add` between, then `git diff --exit-code --stat public/icons public/favicon.svg` exits 0 with no output.
- Given the tree, when `npm run test:all` runs, then it is green (incl. `scripts/build-icons.test.mjs`); and `npm run build && npm run test:e2e:dist` is green with `dist/` holding no `registerSW.js` and holding `dist/.vite/manifest.json`.

## Implementation Notes

**`vite.config.ts` diff** (the only proof of `registerType: 'prompt'`; `build.manifest: true` sits beside the unchanged `assetsInlineLimit`; globPatterns and size limit per AD-16; no `dontCacheBustURLsMatching`, no `devOptions`):

```diff
diff --git a/vite.config.ts b/vite.config.ts
index 2e1cd13..fee7b2e 100644
--- a/vite.config.ts
+++ b/vite.config.ts
@@ -7,25 +7,29 @@ export default defineConfig({
   build: {
     // AD-18 Font: never inline the font as a data: URL, so the build holds it once and the
     // index.html preload matches the @font-face URL; other assets keep Vite's default.
+    // AD-18 (Scaffold deltas): dist/.vite/manifest.json for the CAP-6 size check.
+    manifest: true,
     assetsInlineLimit: (file) => (file.endsWith('.woff2') ? false : undefined),
   },
   plugins: [
     svelte(),
     VitePWA({
-      registerType: 'autoUpdate',
+      // AD-16: no automatic registration; epic 7's src/shell/sw.ts registers the worker.
+      registerType: 'prompt',
+      injectRegister: false,
       includeAssets: ['favicon.svg'],
+      // DESIGN.md A-D5; the plugin adds start_url, scope and lang.
       manifest: {
         name: 'WordCell',
         short_name: 'WordCell',
-        description: 'A solo FreeCell-style word game.',
+        description: 'A solo word card game in the spirit of FreeCell.',
         display: 'standalone',
-        display_override: ['fullscreen', 'standalone'],
         orientation: 'portrait',
-        background_color: '#1c2331',
-        theme_color: '#1c2331',
+        background_color: '#15171B',
+        theme_color: '#15171B',
         icons: [
-          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
-          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
+          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
+          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
           {
             src: 'icons/icon-512-maskable.png',
             sizes: '512x512',
@@ -35,9 +39,9 @@ export default defineConfig({
         ],
       },
       workbox: {
-        // Precache everything the build emits, including the dictionary.
-        globPatterns: ['**/*.{js,css,html,svg,png,txt,woff2}'],
-        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
+        // AD-16: precache everything the build emits, including the dictionary (AD-8).
+        globPatterns: ['**/*.{js,css,html,txt,woff2,png,svg,webmanifest}'],
+        maximumFileSizeToCacheInBytes: 4_000_000,
       },
     }),
   ],
```

**`src/ui/app.css` diff** (18 `--wc-*` declarations in DESIGN.md `colors` order, values verbatim; `background` moved off `:root` to `html, body` as `var(--wc-table)`; `overflow: hidden` and its comment removed; `height: 100%` kept on `html`, `body`, `#app`):

```diff
diff --git a/src/ui/app.css b/src/ui/app.css
index 5023310..11987f8 100644
--- a/src/ui/app.css
+++ b/src/ui/app.css
@@ -9,15 +9,33 @@
 :root {
   color-scheme: dark;
   font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
-  background: #1c2331;
-  color: #f7f3e8;
+  /* DESIGN.md colors, in order. */
+  --wc-table: #15171b;
+  --wc-surface: #1e2127;
+  --wc-surface-raised: #282c34;
+  --wc-hairline: #363b45;
+  --wc-outline: #6e7480;
+  --wc-card-face: #23262c;
+  --wc-card-edge: #6a707c;
+  --wc-card-ink: #f3eee4;
+  --wc-ink-primary: #f3eee4;
+  --wc-ink-secondary: #a9a398;
+  --wc-ink-disabled: #6b675f;
+  --wc-ink-on-accent: #15171b;
+  --wc-accent-teal: #3dbdb5;
+  --wc-accent-orange: #ef7a3d;
+  --wc-destination: #7fa2d6;
+  --wc-destination-fill: #2e3a52;
+  --wc-error: #f08a84;
+  --wc-scrim: #000000b3;
+  color: var(--wc-ink-primary);
 }
 html,
 body {
   margin: 0;
-  overflow: hidden; /* the board never scrolls; prevents pull-to-refresh on Android */
   overscroll-behavior: none;
   height: 100%;
+  background: var(--wc-table);
 }
 #app {
   height: 100%;
```

Hex case: the values were written in DESIGN.md's uppercase, but Biome's CSS formatter (run by `npm run lint`, `biome check .`) lowercases hex literals, so the committed values are DESIGN.md's lowercased; the `AD-11` case compares lowercased values as the story prescribes, so the tokens are equal case-insensitively. Keeping uppercase would need a Biome ignore; recorded here instead.

**`src/ui/App.svelte` `.card` diff** (role mapping proof: `var(--wc-card-ink)`, not `ink-primary`; `.meta { opacity: 0.7 }` untouched):

```diff
diff --git a/src/ui/App.svelte b/src/ui/App.svelte
index 3ea2957..93258db 100644
--- a/src/ui/App.svelte
+++ b/src/ui/App.svelte
@@ -34,7 +34,7 @@ const cardCount = $derived(columns.flat().length);
   .column { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
   .card {
     aspect-ratio: 3 / 4; display: grid; place-items: center;
-    background: #f7f3e8; color: #1c2331; border-radius: 6px;
+    background: var(--wc-card-face); color: var(--wc-card-ink); border-radius: 6px;
     font-family: "WordCell Serif", serif; font-weight: 600;
     touch-action: none; user-select: none;
   }
```

**A-D5 reading.** "Exactly per A-D5" (AD-16) is read as "no other authored fields": the config authors only the A-D5 fields (`display_override` dropped, `purpose: 'any'` explicit on the two `any` icons); vite-plugin-pwa 1.3.0 adds `start_url: '/'`, `scope: '/'` and `lang: 'en'`, which `build-output.spec.ts` deep-equals.

**Inline-fixture exception.** `scripts/build-icons.test.mjs` reads the committed `scripts/icons/icon.svg`, `icon-maskable.svg`, `favicon.svg` and `public/favicon.svg` directly: the committed SVGs are the artifact under test, not fixtures (story Tests; precedent `build-font.test.mjs` reading `OFL.txt`). The `readSources`/`readFont` cases use `mkdtempSync(os.tmpdir())` temp directories.

**Flourish reading.** DESIGN.md App icon's flourish "at the bottom" is drawn at the bottom of the card (two short round-capped strokes, teal then orange, under the `W`), not at the bottom of the field; owner judges at gate 4 (open-questions row 1).

**Icon art.** `icon.svg`: 512 field, card 260 x 350 `rx` 26 in `g rotate(-8 256 256)`, `W` 220 px WordCell Serif 600. `icon-maskable.svg`: the same group additionally scaled 0.8 about the centre (card 208 x 280, half-diagonal about 174 px plus a 2.4 px half-stroke, inside the 204.8 px safe circle). `favicon.svg`: 64 viewBox, tilted card, `W` as a round-joined `polyline`, same flourish, no text. Each source carries `<title>WordCell</title>` because Biome's `a11y/noSvgWithoutTitle` lints `scripts/**` (`title` is allowed by rule (e)).

**Regeneration evidence.** `@playwright/test` 1.63.0; printed Chromium `153.0.8010.12`.

```
$ node scripts/build-icons.mjs && git add public/icons public/favicon.svg && node scripts/build-icons.mjs && git diff --exit-code --stat public/icons public/favicon.svg; echo "exit $?"
build-icons: Chromium 153.0.8010.12
build-icons: wrote .../public/icons/icon-192.png
build-icons: wrote .../public/icons/icon-512.png
build-icons: wrote .../public/icons/icon-512-maskable.png
build-icons: wrote .../public/favicon.svg
build-icons: Chromium 153.0.8010.12
build-icons: wrote .../public/icons/icon-192.png
build-icons: wrote .../public/icons/icon-512.png
build-icons: wrote .../public/icons/icon-512-maskable.png
build-icons: wrote .../public/favicon.svg
exit 0
```

No diff output. The in-page `document.fonts.load` check passed on every render (the script throws otherwise). `public/icons/*` and `public/favicon.svg` stay staged for the ticket's commit.

**Precache duplicates.** `favicon.svg`, the three `icons/*.png` and `manifest.webmanifest` each appear twice in `dist-test/sw.js` with identical revisions (e.g. `favicon.svg` `746a04cb3c5e28ac97f112d0145b0403` both times); 15 entries, 10 unique URLs; no Halt.

**Verification.**
- `npm run test:all`: exit 0 (lint, check, Vitest 5 files / 280 tests incl. `scripts/build-icons.test.mjs` 12 cases, Playwright default 33 passed / 23 skipped (pre-existing android-only helper skips), pwa 12 passed incl. `build-output.spec.ts` 5 and the new precache case). Ports 5173/4173 checked free with `ss -ltn` before each Playwright run.
- `npm run build` exit 0, then:

```
$ test ! -e dist/registerSW.js && test -f dist/.vite/manifest.json && echo PASS
PASS
```

- `npm run test:e2e:dist`: 2 passed (dist-smoke, no console errors).

**Owner look (gate 4).**

![icon-192](../../../public/icons/icon-192.png)
![icon-512](../../../public/icons/icon-512.png)
![icon-512-maskable](../../../public/icons/icon-512-maskable.png)
![favicon](../../../public/favicon.svg)

## Plan Change Log

## Review Triage Log

### 2026-09-28 — Review pass
- verdicts: 19 findings — high 0, medium 0, low 11, false 8, maybe-false 0
- findings:
  - `[false]` `[reject]` blind: `.claude/skills/epic-autopilot/SKILL.md` in the diff is unrelated — it is commit 7efec94, landed on the branch after `baseline_revision` and before this build started; it is not ticket 1.5 work and is already committed.
  - `[low]` `[defer]` blind: autopilot usage-limit stop rule is vague — pre-existing (7efec94), fix edits an agent-context skill file; deferred.
  - `[low]` `[patch]` blind: `build-icons.mjs` reads favicon.svg in `readSources` then copies it from disk again — fixed: `main` writes `public/favicon.svg` from `sources.get(FAVICON.source)` with `writeFileSync`; regeneration still exits 0.
  - `[low]` `[reject]` blind: output PNGs not checked for alpha — screenshots use `omitBackground: false` over an opaque full-bleed rect (rule (b)); the story assigns the rendered look to gate 4; the fix adds a new pixel/colour-type check.
  - `[low]` `[reject]` blind: maskable safe circle untested — the story makes it a gate-4 look and plan manual check; an automated transform/geometry check is added complexity.
  - `[false]` `[reject]` blind: Design Notes geometry differs from the drawn art — Design Notes are "suggested geometry"; the fix is to edit this build's plan.
  - `[low]` `[reject]` blind: "no Chromium launched on a missing input" untested — `main` calls `readSources`/`readFont` before the dynamic `import('@playwright/test')` (visible order); testing it needs an injected loader.
  - `[false]` `[reject]` blind: hex-case deviation not in Plan Change Log — recorded in Implementation Notes; fix edits this build's plan. CSS hex is case-insensitive and the `AD-11` case compares lowercased values as the story prescribes.
  - `[low]` `[reject]` blind: the script does not validate SVGs before rendering — the in-page font check fails fast; rules (a)–(f) run in Vitest over the committed sources; duplicating them in the script is added complexity.
  - `[low]` `[reject]` blind: rule (b) test rejects omitted x/y or `100%` — stricter than SVG defaults but the committed sources pass and a failure is loud; no user or developer harm in normal edits.
  - `[false]` `[reject]` blind: dev head test misses favicon/preload — the story says the vite-dev case asserts exactly title, theme-color and viewport (plus no PWA injection); built favicon is in `build-output.spec.ts`, preload in `font.spec.ts`.
  - `[low]` `[reject]` blind: `readFont` success path untested — the story names only the missing-path case; a bad read fails the in-page font check loudly.
  - `[low]` `[reject]` edge: a mid-run render failure leaves a mix of old/new PNGs — host-only script (A-A7), rule 6 throw, `git diff` shows the partial state and a rerun fixes it; staging to a temp dir adds complexity.
  - `[low]` `[patch]` edge: favicon.svg may change between read and copy — same root cause as the favicon double read; fixed by the same `writeFileSync` change.
  - `[low]` `[patch]` edge: `tags()` `\b` after the name matches `<link-foo>` — fixed: lookahead `(?=[\s/>])`; pwa project 12/12.
  - `[false]` `[reject]` edge: PNG shorter than 24 bytes throws RangeError — the test still fails loudly on a malformed PNG; loud failure is correct behaviour.
  - `[false]` `[reject]` intent: diff includes the autopilot skill edit — same as the first row (commit 7efec94, not this build).
  - `[false]` `[reject]` intent: "overflow rules" implemented only as removing `overflow: hidden` — the story's Description says "overflow rule" and scopes it to that removal (AD-11); DESIGN.md scroll geometry belongs to later epics.
  - `[false]` `[reject]` intent: `registerType`, the 4 MB limit and `dist/` artifacts are proven by quoted diff/shell line rather than tests — the story prescribes exactly those proofs (config diff quoted in the plan; `PASS` line for `dist/`); `4_000_000` is the story's literal.

## Design Notes

Icon art (DESIGN.md App icon; owner judges at gate 4). Palette only: `table #15171B` field, `card-face #23262C`, `card-edge #6A707C` stroke, `card-ink #F3EEE4` letter, `accent-teal #3DBDB5`, `accent-orange #EF7A3D`. Suggested geometry (viewBox `0 0 512 512`):

- `icon.svg`: full `rect` 512 `#15171B`; a `g transform="rotate(-8 256 256)"` holding a rounded card `rect` (about 260 × 350, centred, `rx` ≈ 26, fill `#23262C`, stroke `#6A707C` ≈ 6), a `<text>` `W` (x 256, `text-anchor="middle"`, font-size ≈ 220, `font-family="WordCell Serif"`, `font-weight="600"`, fill `#F3EEE4`), and the flourish near the card's bottom: two short flat rounded strokes (`path`/`line` with `stroke-linecap="round"`, fill `none` explicitly per rule (d)), one teal and one orange. The `rotate` sits on the `g`, not on the first `rect` or its ancestors (rule (b)).
- `icon-maskable.svg`: same composition scaled so the rotated card's corners stay inside a circle of radius 204.8 centred at 256 (a 0.55 × 0.72-ish card of ~220 × 300 rotated 8° has a half-diagonal ≈ 186).
- `favicon.svg`: small viewBox (e.g. `0 0 64 64`), `#15171B` field rect, upright or slightly tilted card rect, the `W` drawn as one `path`/`polyline` (stroke `#F3EEE4`, fill `none`) with no `<text>`; still no `class`/`href`.

Rule (d) means every shape and `tspan` carries `fill` itself, including stroke-only shapes (`fill="none"`).

## Verification

**Commands:** (check `ss -ltn` shows nothing on 5173/4173 before each Playwright run)
- `node scripts/build-icons.mjs && git add public/icons public/favicon.svg && node scripts/build-icons.mjs && git diff --exit-code --stat public/icons public/favicon.svg` -- expected: exit 0, no diff output, Chromium version printed
- `npm run test:all` -- expected: exit 0
- `npm run build && test ! -e dist/registerSW.js && test -f dist/.vite/manifest.json && echo PASS && npm run test:e2e:dist` -- expected: `PASS`, dist-smoke green

**Manual checks:**
- Read the three PNGs and the favicon: serif `W` on a tilted dark card with a teal/orange flourish; maskable card inside the safe circle.

## Auto Run Result

**Summary:** AD-16 PWA packaging: `vite.config.ts` (`registerType: 'prompt'`, `injectRegister: false`, A-D5 manifest, AD-16 globPatterns, `4_000_000` limit, `build.manifest: true`), the `index.html` head, the 18 DESIGN.md colours as `--wc-*` with the role remap and `overflow: hidden` removed, `scripts/build-icons.mjs` with three committed SVG sources, three generated PNGs and `public/favicon.svg`, and the `AD-16`/`AD-18`/`AD-11` build-output, precache and app-shell tests.

**Files changed:**
- `vite.config.ts` — AD-16 plugin settings and A-D5 manifest; `build.manifest: true`.
- `index.html` — title, viewport-fit, theme-color.
- `src/ui/app.css`, `src/ui/App.svelte` — `--wc-*` palette, role remap, clipping removed.
- `scripts/build-icons.mjs`, `scripts/build-icons.test.mjs` — icon renderer and its tests.
- `scripts/icons/*.svg`, `public/icons/*.png`, `public/favicon.svg` — icon art (owner judges at gate 4).
- `e2e/helpers/dist-test.ts` (new), `e2e/pwa/font.spec.ts` — shared dist-test helpers.
- `e2e/pwa/build-output.spec.ts`, `e2e/pwa/precache.spec.ts`, `e2e/app-shell.spec.ts` — story test cases.

**Review:** 19 findings. Patches applied: 3 rows, 2 entries (favicon written from the read source; `tags()` name boundary), both `low`. Deferred: 1 (autopilot usage-limit rule, pre-existing). Rejected: 15 (8 false, 7 low not worth the added complexity), reasons in the triage log.

**Follow-up review recommended:** false (patched: high 0, medium 0, low 2 entries).

**Verification:** after the patches — icon regeneration twice with `git add` between: exit 0, no diff, Chromium 153.0.8010.12; `npm run test:all` exit 0 (Vitest 280 passed; default Playwright 33 passed, 23 skipped by existing android-only guards; pwa 12 passed); `npm run build && test ! -e dist/registerSW.js && test -f dist/.vite/manifest.json && echo PASS` printed `PASS`; `npm run test:e2e:dist` 2 passed. Ports 5173/4173 checked free before each Playwright run. Manually viewed `icon-512.png` and `icon-512-maskable.png`: serif W on a tilted dark card, teal/orange flourish, maskable card inside the safe circle.

**Residual risks:** icon art and the favicon need the owner's gate-4 look; `--wc-*` hex values are lowercased (Biome formatter) rather than DESIGN.md's uppercase, equal case-insensitively; no automated guard ties the committed PNGs to later SVG edits (A-A7).
