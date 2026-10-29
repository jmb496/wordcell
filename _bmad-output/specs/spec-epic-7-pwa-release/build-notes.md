# Epic 7 build notes

The how behind SPEC.md's capabilities and its F-decisions, and the as-built facts at `4130fb4`
that tickets start from. Technical defaults; anything here that would change gameplay, UX or
offline/update behaviour is an owner question instead (SPEC Open Questions).

## As built at 4130fb4

- `vite.config.ts` VitePWA: `generateSW` default, `registerType: 'prompt'`, `injectRegister:
  false`, `includeManifestIcons: false`, manifest per A-D5, `globPatterns` and `globIgnores:
  ['manifest.webmanifest']`, `maximumFileSizeToCacheInBytes: 4_000_000`. The built `dist/sw.js`
  precaches the manifest, routes navigations to `index.html` (`NavigationRoute`) and calls
  `skipWaiting()` only on a `SKIP_WAITING` message.
- `src/main.ts` boot ends `await nextPaint()` → `halted()` → `await game.whenVisible()` →
  `halted()` → `await dictionary.load()`. The registration and persistence steps append here,
  each behind the same `halted()` check (F4).
- `src/shell/storage.ts` has `read`, `write`, `remove`, `isLocalArea`; no `navigator.storage` yet.
- `src/shell/test-hook.ts` freezes `loaded`, `current`, `dictionaryState`, `celebration`;
  `e2e/globals.d.ts` mirrors it.
- `src/shell/dictionary.svelte.ts` already branches on `navigator.serviceWorker?.controller` for
  Q-42 (shell Vitest only, epic 3); CAP-5 adds the Playwright proof, no code change expected.
- `scripts/size-budget.mjs` (`SW_KEY = 'src/shell/sw.ts'`) excludes the `sw.ts` static closure
  once a dynamic import edge to it exists; with no edge it counts everything.
- `e2e/pwa/build-output.spec.ts:40` asserts no registration anywhere in the build; CAP-6 narrows
  it.
- `package.json` `version` `0.0.0`; `workbox-window` is installed as a dependency of
  vite-plugin-pwa (CAP-1 adds it to `package.json` explicitly if imported directly, no new
  package).
- `docs/device-testing.md` and `scripts/device-preview.mjs`: seed page unregisters workers and
  writes only `wordcell:session`.

## Worker module and state (CAP-1, CAP-2; F1–F5)

- State module (shell, e.g. `src/shell/sw-state.svelte.ts` or plain `.ts`): holds the
  `SwState` value, starts `unregistered`, exports a getter and a setter used only by `sw.ts`.
  It imports nothing from `workbox-window`, so `test-hook.ts` can import it statically.
- `sw.ts` (dynamic chunk): `new Workbox('/sw.js', { scope: '/' })` (the plugin's output names),
  `register()`; map `installing`/`installed` (waiting when a controller exists)/`activated`/
  `redundant` events and the registration's current workers to the state; rejection or redundant
  while installing → `failed`, then in dev or test builds (`import.meta.env.DEV ||
  VITE_TEST_HOOKS === '1'`) throw so the `unhandledrejection` handler shows AD-15. No
  `messageSkipWaiting`, no `controlling` reload.
- `precacheComplete()`: the registration's active worker `state === 'activated'` and every URL
  of the generated precache manifest present in the Workbox precache cache (keys may carry
  `__WB_REVISION__`); the URL list comes from the generated manifest (e.g. fetched `sw.js` or a
  build-time list in test builds only), never hand-written. The code sits behind the hook's env
  gate, so it is absent from `dist/`.
- Boot (`main.ts`): after `dictionary.load()` settles and `halted()` is false: in dev skip the
  import; otherwise `await import('./shell/sw')` and await its registration attempt; then, if
  not halted, `requestPersistence()`. Await the attempt's settle, not the worker's activation.

## Persistence (CAP-3)

- `requestPersistence()` in `storage.ts`: `navigator.storage` absent → return; `await
  persisted()` true → return; else `await persist()` and ignore the boolean. No catch.
- Order proof in Playwright: wrap `navigator.storage.persist` and `ServiceWorkerContainer.register`
  in an init script that records call order, then assert dictionary state settled first.

## Playwright mechanics (CAP-4, CAP-5; F6–F8)

- Playwright Chromium runs service workers by default (`serviceWorkers: 'allow'`); `page.route`
  does not see worker-served responses, `context.route` sees requests the worker makes.
  Audit every existing `pwa` and `dist-smoke` spec that routes and reloads; set
  `test.use({ serviceWorkers: 'block' })` there with a comment, or show it still holds.
- Offline: wait for `precacheComplete()`, `context.setOffline(true)`, `page.reload()`, then
  deal/validate through existing helpers; assert `dictionaryState()` `ready`.
- Update (F8): after the first worker is `active` and controls the page, serve a byte-changed
  `sw.js` through `context.route` (e.g. an appended comment), trigger an update check (reload),
  assert `swState()` `waiting` and the same build marker; close every page of the context, open a
  new one, assert the new worker controls it. If Chromium under Playwright does not activate on
  last-page close, record that in the plan and rely on G3.
- Q-40 (`dist-smoke`): route `/sw.js` to 404 at context level; boot, deal, validate, no surface.
  Q-40 (`pwa`): same route; expect the AD-15 fatal surface and `swState()` `failed`.
- Q-42 (F7): with the page controlled, delete the dictionary entry from the precache cache and
  answer the network request with 404 via `context.route`; Reload keeps the banner and makes no
  navigation (`page.on('load')` not fired); then let the route succeed and assert the banner hides.

## Packaging and budget (CAP-6)

- Build-output: no `registerSW.js`; `index.html` and the entry chunk's static import closure
  (from `.vite/manifest.json`) contain no `serviceWorker.register`; exactly one chunk, the one
  for `src/shell/sw.ts`, contains it.
- Size budget: a test on the real `dist/.vite/manifest.json` (or a `postbuild` assertion) that
  the `sw.ts` file and `workbox-window`'s chunk are listed as excluded; record the margin
  (560,553 / 600,000 at epic 11, `c2f1fe7`).

## Device tooling (CAP-7; F9)

- `device-preview.mjs [session-fixture] [--history <history-fixture>] [--no-build]`: the seed
  page also writes `wordcell:history` when given; still unregisters workers first.
- Update read on the tailnet: build A with `WORDCELL_APP_VERSION='A'`, install, stop; build B with
  `'B'`, serve; the footer shows which build runs.
- Clear the origin's site data before a read that needs a fresh install; a worker otherwise keeps
  serving the previous build until every window closes.

## Close-out document edits (CAP-9)

- Spine: AD-16 boot tail and `sw.ts` as built; AD-17 Celebration seam key list → six (F14);
  AD-7 `requestPersistence()` as built; Capability → Architecture Map PWA row (`shell/sw.ts`,
  the state module); Scaffold deltas if `package.json` gains `workbox-window`.
- EXPERIENCE.md State Patterns "New app version installed": "activates once every WordCell window
  has closed" (A-E4 wording synced to AD-16, no behaviour change).
- `docs/device-testing.md` per CAP-7; AGENTS.md shell-module list gains `sw.ts` and the state
  module through `bmad-project-context`.
