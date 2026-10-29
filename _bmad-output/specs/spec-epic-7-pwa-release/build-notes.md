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
  `register()`; after it resolves, read the registration's `installing`, `waiting` and `active`
  and attach `statechange` listeners to each (an update found before `sw.ts` loaded is not
  missed), then follow Workbox's events for workers found later. State precedence: `failed`,
  once set this launch, stays; otherwise `registration.waiting` → `waiting`, else `installing` →
  `installing`, else `active` → `active`, else `unregistered`.
- Failure (Q-40): a rejected `register()`, or this launch's own installing worker turning
  `redundant` without being superseded (a newer installing or waiting worker replacing it is not a
  failure). The attempt promise always resolves, after setting `failed`. In hook builds
  (`import.meta.env.DEV || VITE_TEST_HOOKS === '1'`) `sw.ts` reports it with `reportError(new
  Error(...))`, which reaches the AD-15 `error` handler and halts the store, so the tail's
  `halted()` check skips persistence; a redundant install reported later from a listener takes the
  same path. In production persistence is requested after a failed attempt. No
  `messageSkipWaiting`, no `messageSW`, no `controlling` reload.
- Rejected `import('./shell/sw')` (F17): `main.ts` sets the state module to `failed`, reports
  it in hook builds as above, then continues to persistence; the one specified catch (rule 6).
- `precacheComplete()`: AD-17's synchronous `boolean`. The hook-gated code recomputes it
  asynchronously (on worker activation and after each call) and the accessor returns the last
  computed value, so Playwright reads it with `expect.poll`. Value: the registration's active
  worker is `activated` and every URL of `/sw.js`'s inlined precache array (fetched, read by a
  small literal parser mirroring `e2e/helpers/precache.ts`) is a Workbox precache cache key once
  `__WB_REVISION__` is stripped. Never a hand list; no build-time list (the manifest's revisions
  hash the chunks). The code sits behind the hook's env gate, so it is absent from `dist/`.
- Boot (`main.ts`): after `dictionary.load()` settles, return if `halted()` (F4); in dev skip the
  import; otherwise `await import('./shell/sw')` (F17 on rejection) and await its registration
  attempt, which always resolves; then return if `halted()`, else `requestPersistence()`. Await
  the attempt's settle, not the worker's activation.

## Persistence (CAP-3)

- `requestPersistence()` in `storage.ts`: `navigator.storage` absent → return; `await
  persisted()` true → return; else `await persist()` and ignore the boolean. No catch.
- Order proof in Playwright: an init script wraps `navigator.storage.persisted`/`persist` and
  `ServiceWorkerContainer.prototype.register` and records each call, `dictionaryState()` when
  `register` is called, and when the `register` promise settles; assert dictionary settled →
  `register` called → `register` settled → `persisted`/`persist` called exactly once. Cases: first
  launch; dictionary 404 by `page.route` (the worker's precache fetch is unaffected).

## Playwright mechanics (CAP-4, CAP-5; F6–F8)

- Playwright Chromium runs service workers by default (`serviceWorkers: 'allow'`); `page.route`
  does not see worker-served responses, `context.route` sees requests the worker makes.
  `block` replaces `navigator.serviceWorker.register` with a stub resolving `undefined`, so
  `workbox-window`'s `register()` rejects (a Q-40 failure): `block` only in `dist-smoke` specs,
  where it is silent. Audit every existing `pwa` and `dist-smoke` spec that routes and reloads; a
  `pwa` spec keeps `allow` and routes with `context.route` set before the first `goto`, or waits
  for `precacheComplete()` before a routed reload, with a comment; or show it still holds.
- `swState()` `active` is not control (no `clientsClaim`): specs that need control (Q-42,
  update) reload and check `navigator.serviceWorker.controller` first.
- Offline: wait for `precacheComplete()`, `context.setOffline(true)`, `page.reload()`, then
  deal/validate through existing helpers; assert `dictionaryState()` `ready`.
- Update (F8): `context.route`, set before the first `goto`, serves `index.html` (with or without
  `__WB_REVISION__`) with `<meta name="wc-build" content="A">`. After A is `active` and controls
  the page, route `/sw.js` to A's with the `index.html` precache revision changed and `index.html`
  to marker B; reload (update check); assert `swState()` `waiting` and marker A. With B waiting,
  open a second page, close one, open another: marker A. Close every page of the context, open
  one: marker B. If Chromium under Playwright does not activate on last-page close, record that in
  the plan and rely on G3 (SPEC Assumptions).
- Q-40 (`dist-smoke`, in `e2e/pwa/dist-smoke.spec.ts`, no config change): at context level,
  route `/sw.js` to 404, or during the first install one precached URL the page does not load
  (e.g. `icons/icon-192.png`) to 404; assert the handler was hit, then boot, deal, validate, no
  surface; the `/sw.js` case's init script also shows `persisted`/`persist` called after the
  failed `register` settles. F17: route the `sw.ts` chunk to 404; boot, deal, validate, no surface.
  Q-40 (`pwa`): the same two routes; expect the AD-15 fatal surface and `swState()` `failed`.
- Q-42 (F7): with the page controlled, delete the dictionary entry from the precache cache and
  answer the network request with 404 via `context.route`; tap Reload and hold the retry request
  pending; assert the banner visible and no `load` event (`page.on('load')`); then fulfil it and
  assert the banner hides.

## Packaging and budget (CAP-6)

- Build-output: no `registerSW.js`; `index.html` and the entry chunk's static import closure
  (from `.vite/manifest.json`) contain no `serviceWorker.register`; exactly one chunk, the one
  for `src/shell/sw.ts`, contains it. The generated `sw.js` calls `skipWaiting()` only on the
  `SKIP_WAITING` message and has no `clientsClaim`; "never sent" is proven by shell Vitest and the
  source scan (CAP-1), not here, since the `sw.ts` chunk bundles `workbox-window`'s
  `messageSkipWaiting` and its `SKIP_WAITING` literal.
- Size budget: `size-budget.mjs` (postbuild) fails when the manifest has a `src/shell/sw.ts` key
  that no dynamic edge reaches; an `e2e/pwa/build-output.spec.ts` case reads `.vite/manifest.json`
  and shows the `sw.ts` chunk and `workbox-window`'s chunk outside the counted set
  (`size-budget.test.mjs` runs before `build` in `test:all`, so it stays on synthetic manifests);
  record the margin
  (560,553 / 600,000 at epic 11, `c2f1fe7`).

## Device tooling (CAP-7; F9)

- `device-preview.mjs [session-fixture] [--history <history-fixture>] [--no-build]`: the seed
  page also writes `wordcell:history` when given. Once a worker controls the origin, its
  `NavigationRoute` answers `/seed.html` with `index.html`, so the seed page never runs: the doc's
  steps and the printed hint make clearing the origin's site data the first step of every seed
  and re-seed (replacing "Repeat step 3"); the seed page's unregister stays only as a guard for an
  uncontrolled first visit; `dist/sw.js` unchanged.
- Update read on the tailnet: build A with `WORDCELL_APP_VERSION='A'`, install, stop; build B with
  `'B'`, serve; the footer shows which build runs; the steps follow G3's order.
- Offline readiness (G2): after the first online launch, keep the app open about a minute on
  Wi-Fi, close every window, relaunch once online (now controlled), or check
  chrome://serviceworker-internals shows the worker ACTIVATED; then airplane mode and relaunch.
- Clear the origin's site data before a read that needs a fresh install; a worker otherwise keeps
  serving the previous build until every window closes. Uninstall the tailnet-origin app before
  CAP-10's production install (two apps named WordCell otherwise).

## Close-out document edits (CAP-9)

- Spine: AD-16 boot tail and `sw.ts` as built; AD-17 Celebration seam key list → six (F14);
  AD-7 `requestPersistence()` as built, none after a halting launch; AD-15 boot returns at
  `halted()`, now including registration and persistence (F4); Capability → Architecture Map PWA row (`shell/sw.ts`,
  the state module); Scaffold deltas if `package.json` gains `workbox-window`.
- EXPERIENCE.md State Patterns "New app version installed": "activates once every WordCell window
  has closed" (A-E4 wording synced to AD-16, no behaviour change).
- `docs/device-testing.md` per CAP-7; AGENTS.md shell-module list gains `sw.ts` and the state
  module through `bmad-project-context`.
