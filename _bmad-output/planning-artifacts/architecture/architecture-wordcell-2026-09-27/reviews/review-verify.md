# Review: reality check of ARCHITECTURE-SPINE.md technical claims

Reviewer: fresh-context verifier, 2026-09-27. Scope: every committed technical claim in the spine
(versions, named technologies, relied-on behaviours). Method: `npm view`, inspection of
`node_modules`, throwaway builds and browser runs in the session scratchpad (nothing in the repo
was changed), and vendor docs.

**Verdict:** Sound. All eight behaviours the spine depends on hold. Two statements are wrong as
written and would break a ticket if followed literally: `.vite/manifest.json` is not emitted by
default, and Biome cannot restrict `Math.random`. A few others are imprecise. No finding needs a
design change.

## Summary table

| # | Claim | Status |
|---|---|---|
| V-1 | Stack versions | Confirmed (one note: TS 7 is `latest`) |
| V-2 | Workbox 7.4 precache cache modes `default` / `reload` | Confirmed |
| V-3 | vite-plugin-pwa default `dontCacheBustURLsMatching` covers `assets/` | Confirmed |
| V-4 | generateSW + `injectRegister:false` + `registerType:'prompt'`: new worker waits, activates on next launch; `registerSW` can be called late | Confirmed, but "next launch" is imprecise |
| V-5 | `?url` import of a large `.txt` gives a hashed `dist/assets` file listed in `.vite/manifest.json` | Confirmed; **wrong** that `vite build` emits the manifest by default |
| V-6 | Cloudflare Workers static assets `_headers`, assets-only `wrangler deploy` | Confirmed; `.vite/` would be uploaded |
| V-7 | CDP `Input.dispatchTouchEvent` touch drag in the Pixel 7 project | Confirmed by a live run |
| V-8 | Biome `noRestrictedGlobals` "mirrors the token list" | **Partly wrong**: member expressions such as `Math.random` cannot be listed |
| V-9 | `navigator.storage.persist()` semantics, coverage of localStorage | Silent grant confirmed; localStorage coverage unverified (sources disagree) |
| V-10 | fontTools instancer + subset of Fraunces at wght 600, opsz 48, SOFT 0, WONK 0 | Confirmed by a live run |
| V-11 | Size budget 600,000 B with the dictionary counted | Feasible; dictionary alone is about 453 KB of it |
| V-12 | Minor points (engine tsconfig, text scan tokens, dev server needs the generated file) | Notes |

---

## V-1 Stack versions: confirmed

The installed version in `node_modules` and the npm `latest` tag on 2026-09-27:

| Package | Spine | Installed | npm latest |
|---|---|---|---|
| typescript | 6.0.3 | 6.0.3 | **7.0.2** (released 2026-07-08) |
| vite | 8.3.1 | 8.3.1 | 8.3.1 |
| svelte | 5.57.1 | 5.57.1 | 5.57.1 |
| @sveltejs/vite-plugin-svelte | 7.3.1 | 7.3.1 | 7.3.1 |
| svelte-check | 4.7.6 | 4.7.6 | 4.7.6 |
| vitest | 5.0.2 | 5.0.2 | 5.0.2 |
| @playwright/test | 1.63.0 | 1.63.0 | 1.63.0 |
| @biomejs/biome | 2.5.14 | 2.5.14 | 2.5.14 |
| vite-plugin-pwa | 1.3.0 | 1.3.0 | 1.3.0 |
| workbox-precaching / -build / -window | 7.4.1 | 7.4.1 | 7.4.1 |
| wrangler | 4.141.0 | **not installed** | 4.141.0 (engines node >= 22) |

Node in WSL is v24.1.0.

- **TypeScript:** 6.0.3 is correct, and staying on 6 is right: `svelte-check@4.7.6` declares
  peer `typescript: ^5.0.0 || ^6.0.0`, so TS 7 is not supported yet. **Fix (minor):** add one
  line to the Stack table saying TS stays on 6.x until svelte-check supports 7, so nobody
  "upgrades to latest" by mistake.
- **wrangler:** it is not in `devDependencies`. **Fix:** epic 1 adds `wrangler@4.141.0` as a
  devDependency, or `deploy.yml` pins `npx wrangler@4.141.0`, so the version in the table is
  actually enforced.
- vite-plugin-pwa 1.3.0 peers: `vite ^3…^8`, `workbox-build ^7.4.1`, `workbox-window ^7.4.1`.
  Compatible.

## V-2 Workbox 7.4 precache cache modes: confirmed

`node_modules/workbox-precaching/PrecacheController.js:103`:
`const cacheMode = typeof entry !== 'string' && entry.revision ? 'reload' : 'default';` and
line 160 passes `cache: cacheMode` to the install fetch. Entries without a revision are fetched
with `default`, so a fresh HTTP-cache hit serves them. Revisioned entries use `reload`. The
generated worker's bundled runtime (`dist/workbox-<hash>.js`) contains the same logic.

Consequence the spine should know about: the one-download claim depends on the dictionary being
a **fresh** HTTP-cache hit when the worker installs. That holds in production because of the
`immutable` header (AD-18). It does not necessarily hold under `vite preview`, which has no
`_headers`. So the `pwa` Playwright project cannot prove "one download". It proves only that the
app works offline. **Fix (minor):** say in AD-17 that the offline test does not assert a single
download, or add a separate check against the deployed headers.

## V-3 Default `dontCacheBustURLsMatching`: confirmed

`node_modules/vite-plugin-pwa/dist/index.js:830`:
`new RegExp('^' + assetsDir)` with `assetsDir = build.assetsDir ?? 'assets'` plus `/`, i.e.
`/^assets\//`. It goes into `defaultWorkbox` and is merged with `Object.assign(defaultWorkbox,
options.workbox)`. The scaffold's `workbox` block does not override it. workbox-build's
`noRevisionForURLsMatchingTransform` sets `revision = null` for matching URLs.

The generated `sw.js` from a test build confirms it:
`{url:"assets/en-n6QSuDF0.txt",revision:null}`, `{url:"assets/index-….js",revision:null}`,
`{url:"index.html",revision:"4ed1…"}`.

Watch-out: if a future config sets `workbox.dontCacheBustURLsMatching`, it replaces the default.
The size cap is fine: the dictionary is 1,742,713 bytes, below workbox's 2 MiB default
`maximumFileSizeToCacheInBytes`, and the scaffold sets 4 MiB anyway. Keep `txt` in
`globPatterns`, as the scaffold already does.

## V-4 Prompt mode without `updateSW`, and a late `registerSW`: confirmed, with a wording fix

- `index.js:874`: `workbox.skipWaiting = true; clientsClaim = true` is set only when
  `injectRegister` is `auto`/unset **and** `registerType === 'autoUpdate'`. With `prompt`, the
  generated `sw.js` contains only
  `addEventListener("message", e => e.data?.type === "SKIP_WAITING" && self.skipWaiting())`.
  If `updateSW()` is never called, nothing sends that message, so a new worker stays waiting.
  Confirmed.
- With `injectRegister: false`, no `registerSW.js` is emitted (confirmed in the test build). The
  app imports `registerSW` from `virtual:pwa-register`.
- **Late call:** `registerSW` calls `wb.register({ immediate })`. workbox-window's
  `Workbox.register` (`Workbox.js:289`) waits for `load` only when
  `document.readyState !== 'complete'`. Called after load, it registers at once. Calling it
  after the dictionary fetch settles is fine. `workbox-window` is loaded as a dynamic-import
  chunk (`assets/workbox-window.prod.es5-<hash>.js`, `isDynamicEntry` in the manifest), so the
  AD-18 budget rule that excludes dynamic chunks does exclude it.
- **Imprecise:** "a new worker waits and activates on the next launch". Per the SW lifecycle, a
  waiting worker activates only when **no client** is controlled by the old worker. A reload does
  not do it, because the old client overlaps the navigation. A backgrounded Android PWA still
  counts as a live client. Also, the update check runs only at registration or navigation, which
  here is after the dictionary fetch. In practice: launch N downloads and installs the update, and
  the first launch after every WordCell window has been **fully closed** runs it. That is
  acceptable for A-E4. **Fix:** reword AD-16 to "activates once every open WordCell window has
  been closed (typically the launch after next)". Any Playwright update test must close all pages
  of the context, not reload.
- First install: without `clientsClaim`, the first page load is not controlled. Offline works only
  after a reload. The spine's offline test (reload with the network off after the precache
  completes) already accounts for this. Confirmed.
- Also confirmed: vite-plugin-pwa does not run the worker in `vite dev` unless
  `devOptions.enabled` is set.

## V-5 Vite 8 `?url` import of the dictionary: confirmed; manifest default is wrong

Test build (Vite 8.3.1, `generated/dictionary/en.txt` filtered 3–23 letters from the repo's
`enable1.txt`: 172,713 words, 1,742,713 bytes):

- Emitted as `dist/assets/en-n6QSuDF0.txt`, not inlined. It is well above `assetsInlineLimit`.
- `.vite/manifest.json` lists it **in two places**: as a top-level key
  `"generated/dictionary/en.txt": { "file": "assets/en-n6QSuDF0.txt", "src": … }`, and in the
  entry chunk `"index.html": { …, "isEntry": true, "assets": ["assets/en-n6QSuDF0.txt"] }`. A
  size script can walk `isEntry` → `imports` (static) → `css` + `assets`, and skip
  `dynamicImports`. That matches AD-18.
- **Wrong:** "`vite build` emits `.vite/manifest.json`". Vite emits it only with
  `build.manifest: true`. The default is `false`, and the scaffold's current `dist/` has no
  `.vite/`. **Fix:** AD-18 must say "`vite.config.ts` sets `build.manifest: true`".
- Side effect: with the manifest on, `dist/.vite/manifest.json` is published (V-6). It is not
  precached, because workbox's glob skips dot-directories and `json` is not in `globPatterns`.

## V-6 Cloudflare Workers static assets: confirmed, one gap

- `_headers` is supported for Workers static assets. The file goes in the assets directory, so
  `public/_headers` is copied to `dist/`. It "will not itself be served as a static asset". Limits
  are 100 rules and 2,000 characters per line. The default without a rule is
  `Cache-Control: public, max-age=0, must-revalidate`. Source:
  developers.cloudflare.com/workers/static-assets/headers/.
- Assets-only deploy: a `wrangler.jsonc` with `name`, `compatibility_date` and
  `assets.directory` and no `main` is Cloudflare's documented static-site shape (their examples
  and workers-sdk #10563). Confirmed.
- `.assetsignore` exists ("Wrangler will not upload asset files that match lines in this file").
  **Fix:** add `public/.assetsignore` with `.vite` so the build manifest is not published.
  Wrangler's built-in treatment of dot-directories is unverified.
- The `no-cache` rules on `/` and `/index.html` add little over the default
  (`max-age=0, must-revalidate`), but they are harmless.
- The generated Workbox runtime `workbox-<hash>.js` sits at the root, not under `/assets/`. It is
  content-hashed and gets the default revalidating header. Fine.
- `/sw.js`: Chrome's update check bypasses the HTTP cache for the SW script by default
  (`updateViaCache: 'imports'`), so the rule is belt-and-braces. Fine.

## V-7 CDP touch drag in the Pixel 7 project: confirmed by a live run

- Playwright 1.63 descriptor `Pixel 7`: chromium, `isMobile`, `hasTouch`, viewport 412×839,
  screen 412×915. These match the geometry reference sizes in AD-11. `Touchscreen` still has
  only `tap()`, so a CDP helper is needed.
- Run: `ctx.newCDPSession(page)`, then `Input.dispatchTouchEvent` touchStart, 5× touchMove,
  touchEnd, on a `touch-action:none` element that calls `setPointerCapture` on `pointerdown`.
  Result: `pointerdown:touch`, `gotpointercapture:touch`, 5× `pointermove:touch`,
  `pointerup:touch`. This works as AD-17 requires. `newCDPSession` is Chromium-only, so the
  helper must not be used in a non-Chromium project. None is planned.

## V-8 Biome 2.5 restricted rules: partly wrong

- `lint/style/noRestrictedGlobals` exists in 2.5.14. Its options are
  `{ deniedGlobals: { [name]: message } }`, a record (the Biome 1 array form is gone). A test
  override on `src/engine/**` flagged `Date`, `performance`, `console`, `window` and
  `globalThis`.
- **Wrong:** "mirrors the token list". A `deniedGlobals` key `"Math.random"` does **not**
  fire. The rule matches only global identifiers, and denying `Math` would ban `Math.floor`,
  which `deal.ts` needs (AD-5). **Fix:** AD-1 check 3 should say "mirrors the identifier tokens
  (all except `Math.random`)". The Vitest scan, already the authority, covers `Math.random`.
- `noRestrictedImports` exists (options `paths`, gitignore-style `patterns`). The spine does not
  use it, and the import rule is enforced by the Vitest scan, so this is fine.

## V-9 `navigator.storage.persist()`: partly confirmed

- Confirmed: Chrome never prompts. It grants or denies silently from engagement, installed or
  bookmarked status, and notification permission (web.dev "Persistent storage"; MDN). An
  installed PWA is a positive signal. Not showing the result (A-A3) is consistent with that.
- **Unverified / conflicting:** whether it protects `localStorage`. web.dev lists "DOM Storage
  (Local Storage)" among the types persistence covers. MDN says Web Storage has a fixed 5 MiB
  limit outside the quota and eviction system, and that eviction applies to IndexedDB, Cache API
  and OPFS. Either way, the Session and history in `localStorage` do not depend on the call.
  What persistence does protect for certain is the **SW precache (Cache API)**, which is what
  the offline launch depends on. **Fix:** in AD-7 or A-A3, state the purpose as "protect the
  precache (and localStorage where the browser includes it) from eviction", not as a guarantee
  for the save. Nothing protects against the user clearing site data. That is out of scope.
- Minor inconsistency: AD-7 says "at launch", AD-16 and A-A3 say after SW registration.
  Harmonise to AD-16's order.

## V-10 Fraunces instancing and subset: confirmed by a live run

`google/fonts` `ofl/fraunces/Fraunces[SOFT,WONK,opsz,wght].ttf`, fontTools 4.66.0 via
`uv run` (inline deps `fonttools`, `brotli`):

- `fvar` axes: `opsz` 9–144 (default 9), `wght` 100–900 (**default 900**), `SOFT` 0–100
  (default 0), `WONK` 0–1 (**default 1**). All four exist, and the chosen values are in range.
  Because the defaults are wght 900 and WONK 1, all four axes must be pinned explicitly, which the
  spine does.
- The GSUB table has `FeatureVariations` (the WONK substitutions).
  `instancer.instantiateVariableFont(f, {wght:600, opsz:48, SOFT:0, WONK:0})` gives a static
  font with no `fvar`. `Subsetter` on `A–Z` + `u` with woff2 flavour gives **4,192 bytes**.
- **Fix (minor):** the script header must declare `brotli`, because woff2 output needs it.
  "Pinned in the script header" should pin fonttools (e.g. `fonttools==4.66.0`) plus brotli, and
  record the source font's commit, not `main`.

## V-11 Size budget feasibility: note

`gzip -9` of the 3–23-letter dictionary is **453,405 bytes**. Vite's own reporter shows
463.89 kB. That leaves about 146 KB of the 600,000-byte budget for HTML, entry JS, CSS and the
font (about 4 KB). Svelte 5 plus the engine should fit, but the margin is smaller than the spine
suggests. **Fix (optional):** add "dictionary ≈ 453 KB gz, the rest ≈ 146 KB" to AD-18 or A-A4 so
epic 4–6 tickets know the real headroom.

## V-12 Other notes

- Engine tsconfig `lib: ["ES2023"], types: []`: `console`, `setTimeout`, `window`, `document`,
  `performance`, `fetch` and `localStorage` are not in the ES libs, so they are type errors.
  `Date`, `Math.random` and `globalThis` are in ES2023, and only the Vitest scan catches them.
  The spine's wording ("any DOM or Node global") is accurate. Noted so nobody reads check 1 as
  sufficient.
- The Vitest text scan tokens (`Date`, `process`, `window`, `console`, `fetch`) will hit
  identifiers and comments such as `processMove` or "window of cards" unless the scan uses word
  boundaries and strips comments. **Fix:** specify `\b<token>\b` on comment-stripped source, or
  accept that engine comments avoid those words.
- `?url` import from `generated/` outside `src/` works in build (tested). In `vite dev`, and so
  in every Playwright project against the dev server, the import fails if the file has not been
  generated. The scaffold only regenerates in `npm run build`. **Fix:** make `dev`, `test:e2e`
  and CI run `build:dictionary` first (e.g. a `predev` script), or say so in AD-8.
- `$state.raw`, `$derived` and `import.meta.env.DEV` are Svelte 5 and Vite features and exist.
  No issue.
- Scaffold commit `785c0f6` exists ("initial"). The spine's references to it are valid.

## Evidence artefacts (scratchpad, not in the repo)

- Vite + PWA test build: `/tmp/claude-1000/-mnt-d-CodeProjects-wordcell/6df36758-4c26-4c59-aeab-0eb92ceaf323/scratchpad/viteexp/`
- Biome rule test: `.../scratchpad/biomeexp/`
- CDP touch script: `.../scratchpad/cdp.mjs`
- Font script and output: `.../scratchpad/font.py`, `out.woff2`
