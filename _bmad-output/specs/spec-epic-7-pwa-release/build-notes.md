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
- `package.json` `version` `0.0.0`, no `dependencies` block; `workbox-window` 7.4.1 is installed
  as vite-plugin-pwa 1.3.0's dependency (`^7.4.1`). F2 imports it directly, so CAP-1 declares it
  in `package.json` `dependencies` pinned to that resolved version (no new package) and CAP-9
  records it in Scaffold deltas.
- `docs/device-testing.md` and `scripts/device-preview.mjs`: seed page unregisters workers and
  writes only `wordcell:session`.

## Worker module and state (CAP-1, CAP-2; F1–F5)

- State module (shell, e.g. `src/shell/sw-state.svelte.ts` or plain `.ts`): holds the
  `SwState` value, starts `unregistered`, exports a getter and a setter used by `sw.ts`, and by
  `main.ts` only for F17. It imports nothing from `workbox-window`, so `test-hook.ts` can import
  it statically.
- `sw.ts` (dynamic chunk): `new Workbox('/sw.js', { scope: '/' })` (the plugin's output names),
  `register()`; after it resolves, read the registration's `installing`, `waiting` and `active`
  and attach `statechange` listeners to each (an update found before `sw.ts` loaded is not
  missed), then follow Workbox's events for workers found later. State precedence: `failed`,
  once set this launch, stays; otherwise `registration.waiting` → `waiting`, else `installing` →
  `installing`, else `active` → `active`, else `unregistered`.
- Failure (Q-40): a rejected `register()`, or any worker `sw.ts` observes this launch
  (present at `register()` or found later; first install or update, an older worker staying
  active included) turning `redundant` before it reached `activated`, with no newer worker in any
  slot (installing, waiting or active); a replacement, or an activated worker later superseded by
  one that went straight to `active`, is not a failure (shell Vitest `AD-16` names that case). Absent `navigator.serviceWorker` (F5) is checked here, so
  never in dev. The attempt promise always resolves, after setting `failed`. In hook builds
  (`import.meta.env.DEV || VITE_TEST_HOOKS === '1'`) `sw.ts` reports it with `reportError(new
  Error(...))`, which reaches the AD-15 `error` handler and halts the store, so the tail's
  `halted()` check skips persistence; a redundant install reported later from a listener (after
  the attempt settled) halts the page too, but after persistence was requested. In production persistence is requested after a failed attempt. No
  `messageSkipWaiting`, no `messageSW`, no `controlling` reload.
- Rejected `import('./shell/sw')` (F17): `main.ts` sets the state module to `failed`, reports
  it in hook builds as above, then continues to the tail's `halted()` check (persistence only in
  production); the one specified catch (rule 6).
- `precacheComplete()`: AD-17's synchronous `boolean`. The hook-gated code recomputes it
  asynchronously only when the accessor is called (never at boot or on activation) and the
  accessor returns the last computed value, so Playwright reads it with `expect.poll`. Value: the
  registration's active worker is `activated` and every URL of `/sw.js`'s inlined precache array
  is a Workbox precache cache key once `__WB_REVISION__` is stripped. A recompute returns `false` without fetching unless
  `navigator.serviceWorker.getRegistration()` has an `activated` active worker (none in dev); only
  then is the array fetched, once,
  while online, parsed by finding the single `precacheAndRoute([` call and extracting every
  `url:"…"` string inside that array by regex (failing fast if none; `e2e/helpers/precache.ts`
  uses Node `vm`, unusable in the page) and kept, so a
  later recompute reads only Cache Storage (an offline `/sw.js` fetch would reject to AD-15).
  Never a hand list; no build-time list (the manifest's revisions hash the chunks). The code sits behind the hook's env gate, so it is absent from `dist/`.
- Boot (`main.ts`): after `dictionary.load()` settles, return if `halted()` (F4); in dev skip the
  import; otherwise `await import('./shell/sw')` (F17 on rejection), return if `halted()` (a halt
  during the import), then await its registration attempt, which always resolves; then return if
  `halted()`, else `requestPersistence()`. Await the attempt's settle, not the worker's
  activation. The F4 Playwright case must reach the check after `dictionary.load()` (a halt
  before the dictionary request returns at the earlier checks, so passes vacuously): init script
  and dictionary route on the first page only; the route handler holds the request and the test
  asserts it was received, then halts the page (a Q-38 write from a second page, which records
  nothing, or `reportError(new Error(...))` via `page.evaluate`), then fulfils; poll
  `dictionaryState()` until it leaves `loading`, let one macrotask pass, then assert no
  `register`, `persisted` or `persist` call. A second case covers the post-import check: a
  `page.route` (first launch, uncontrolled) holds the `sw.ts` chunk request, the test asserts it
  was received, halts the page as above, fulfils, waits for the import to settle plus one
  macrotask, then makes the same three assertions.

## Persistence (CAP-3)

- `requestPersistence()` in `storage.ts`: `navigator.storage` absent → return; `await
  persisted()` true → return; else `await persist()` and ignore the boolean. No catch.
- Order proof in Playwright: an init script wraps `navigator.storage.persisted`/`persist` and
  `ServiceWorkerContainer.prototype.register` and records each call, `dictionaryState()` when
  `register` is called, and when the `register` promise settles; assert dictionary settled →
  `register` called → `register` settled → one `persisted` call, then one `persist` call; the
  script stubs `persisted()` to resolve false, wherever a case asserts persistence. Cases: first
  launch; dictionary 404 by `page.route` (the worker's precache fetch is unaffected); dictionary
  timed out (`pwa`: `page.clock.install()` before `goto`, dictionary route held and asserted hit,
  `page.clock.fastForward` past `dictionary.svelte.ts`'s 30 s `TIMEOUT_MS`); dev server (F3, in
  `e2e/test-hook.spec.ts`): no `register` call, no `/src/shell/sw.ts` request, one `persisted` then one
  `persist` call after `dictionaryState()` settles.

## Playwright mechanics (CAP-4, CAP-5; F6–F8)

- Playwright Chromium runs service workers by default (`serviceWorkers: 'allow'`); `page.route`
  does not see worker-served responses, `context.route` sees requests the worker makes.
  `block` replaces `navigator.serviceWorker.register` with a stub resolving `undefined`, so
  `workbox-window`'s `register()` rejects (a Q-40 failure): `block` only in `dist-smoke` specs,
  where it is silent. Audit every existing `pwa` and `dist-smoke` spec that routes and reloads; a
  `pwa` spec keeps `allow` and routes with `context.route` set before the first `goto`, or, for
  a non-precached URL only, waits for `precacheComplete()` before a routed reload (a controlled
  page answers precached URLs from the cache, so routes never fire), or, for a precached URL,
  deletes its precache entry first (F7), with a comment; or show it
  still holds. Every audited spec that routes asserts its handler was hit. `context.route` never
  sees an updated worker's main-script fetch (microsoft/playwright#14711; unverified for 1.63),
  so `/sw.js` changes and absences use F8's static server (`e2e/helpers/static-server.ts`: copy a
  build dir, swap or remove files, serve with an SPA fallback; tests in `e2e/helpers.spec.ts`); `context.route` stays for
  worker-originated precache fetches and page-level requests. Before
  the first install `context.route` also intercepts the worker's precache fetches, so there it
  answers only with responses that succeed; a failed precached URL turns the install redundant
  and halts a `pwa` spec, so a spec failing one (other than the Q-40 cases) uses `page.route` on
  an uncontrolled page, or waits for `precacheComplete()` first.
- `swState()` `active` is not control (no `clientsClaim`): specs that need control (Q-42,
  update) reload and check `navigator.serviceWorker.controller` first.
- Offline: make a move, wait for `precacheComplete()` (no polling after it),
  `context.setOffline(true)`, `page.reload()`, assert the game restored, then deal/validate
  through existing helpers; assert `dictionaryState()` `ready`. `dist-smoke` offline case (in
  `dist-smoke.spec.ts`, `allow`): poll `page.evaluate` until the registration's active worker is
  `activated` and every `readPrecacheManifest` URL is a key in `caches` (`__WB_REVISION__`
  stripped, as `precacheComplete()`), then the same steps minus the hook reads.
- No-prompt checks (offline, update): App.svelte's `role="status"` live region is visually
  hidden but Playwright-visible (1 px box), so the check excludes it by locator.
- Update (F8): copy `dist-test/` to a temp dir, insert `<meta name="wc-build" content="A">` into
  its `index.html`, serve it from `e2e/helpers/static-server.ts` (`index.html` also for
  navigations), `goto` its URL. After A is `active` and every open page shows a non-null
  `navigator.serviceWorker.controller` (an early activation with an uncontrolled page open is a
  test-setup error, never grounds for G3), write B on disk: `sw.js` with the `index.html` precache revision changed
  and `index.html` with marker B; reload (update check); assert `swState()` `waiting` and marker
  A. With B waiting, open a second page, close one, open another: marker A. Close every page of
  the context, poll until B is activated (e.g. `self.serviceWorker.state` evaluated in the newest
  of `context.serviceWorkers()`, unverified), open one: marker B,
  `navigator.serviceWorker.controller` non-null, `swState()` polls to `active`. Only if
  Chromium's own activation timing differs, record that in the plan and rely on G3 (SPEC
  Assumptions).
- Q-40 (`dist-smoke`, in `e2e/pwa/dist-smoke.spec.ts`, no config change): serve a `dist/` copy
  with `sw.js` removed from F8's static server (assert it answered `/sw.js` 404), or at context
  level route, during the first install, one precached URL the page does not load (e.g.
  `icons/icon-192.png`) to 404 (assert the handler was hit by the worker,
  `request.serviceWorker()` non-null); then boot, deal, validate; the precache case waits
  until `navigator.serviceWorker.getRegistration()` shows no `installing` before asserting no
  surface; the `/sw.js` case's init script also shows `persisted`/`persist` called after the
  failed `register` settles. F17: route the `sw.ts` chunk to 404; assert the route hit; boot,
  deal, validate, no surface; CAP-3's init script shows `persisted`/`persist` called after it. Q-40 (`pwa`, in `e2e/pwa/sw-failure.spec.ts`: the `pwa` project ignores only `dist-smoke.spec.ts`
  and `dist-smoke`'s `testMatch` omits it, so it runs under `pwa` only): the same two cases (a `dist-test/` copy for the missing `sw.js`); expect the AD-15 fatal surface
  and `swState()` `failed`. F17 (`pwa`, same file): the `sw.ts` chunk to 404, route hit, AD-15 fatal
  surface, `swState()` `failed`, no `persisted`/`persist` call (CAP-3's init script).
- Q-42 (F7): with the page controlled, delete the dictionary entry from the precache cache and
  answer the network request with 404 via `context.route`; tap Reload and hold the retry request
  pending; assert the banner visible and no `load` event (`page.on('load')`); then fulfil it and
  assert the banner hides.

## Packaging and budget (CAP-6)

- Build-output: no `registerSW.js`; `serviceWorker.register` passes the content check below. The generated `sw.js` calls `skipWaiting()` only on the
  `SKIP_WAITING` message and has no `clientsClaim`; "never sent" is proven by shell Vitest and the
  source scan (CAP-1), not here, since the `sw.ts` chunk bundles `workbox-window`'s
  `messageSkipWaiting` and its `SKIP_WAITING` literal.
- Size budget: `size-budget.mjs` (postbuild) fails when the manifest has a `src/shell/sw.ts` key
  that no dynamic edge reaches, shown by a `size-budget.test.mjs` case on a synthetic manifest
  (it runs before `build` in `test:all`, so it stays on synthetic manifests). `workbox-window`,
  imported only by `sw.ts`, is inlined into the `sw.ts` chunk (no manifest key of its own): an
  `e2e/pwa/build-output.spec.ts` case reads `.vite/manifest.json`, shows the `src/shell/sw.ts`
  key is a dynamic entry outside the counted set, and that a Workbox marker (e.g.
  `messageSkipWaiting`) and `serviceWorker.register` occur in no file of `computeBudget`'s counted
  `rows` and do occur in `manifest['src/shell/sw.ts'].file` (or a file of its static-import
  closure outside the counted rows; the F1 state module puts the entry chunk in that closure, but
  it is counted); record the margin
  (560,553 / 600,000 at epic 11, `c2f1fe7`).

## Device tooling (CAP-7; F9)

- `device-preview.mjs [session-fixture] [--history <history-fixture>] [--no-build]`: a seed page
  is written when either fixture is given and writes `wordcell:history` when `--history` is;
  `--history` consumes its value (today's `args.find((a) => !a.startsWith('--'))` would take it as
  the session fixture); `device-preview.test.mjs` covers the history-only case. Once a worker
  controls the origin, its `NavigationRoute` answers `/seed.html` with `index.html`, so the seed
  page never runs: the doc's steps and the printed hint say clear the origin's site data before a
  seed, a re-seed or a fresh-install read (replacing "Repeat step 3"); the hint (today, line 106:
  "After a new build, clear the site data on the phone first.") is printed when a seed page is
  written (session or `--history` fixture); a no-fixture run prints two lines instead: "fresh
  install: clear site data first; update read (G3): keep it". After seeding, the doc says close
  the Chrome tab and launch the installed app (G4–G6; G4 seeds
  `fixtures/session-place-free-letter-redo-tail.json` and `fixtures/session-gave-up.json`). The seed page's unregister stays only as
  a guard for an uncontrolled first visit; `dist/sw.js` unchanged.
- Update read on the tailnet (the one read that keeps site data): build A with
  `WORDCELL_APP_VERSION='A'`, install, run G2's readiness step for A (A active), then stop A's
  server; build B with `'B'`, serve; the footer shows which build runs; a read whose first cold
  launch already shows B is spoiled and redone, not a fix ticket (a second consecutive one is a
finding, G3); the steps follow G3's order: close every WordCell window (app swiped from recents,
  tabs on the origin closed), launch cold (it fetches B; a resume fetches nothing, A-A15), then the
  readiness step (about a minute on Wi-Fi, or B seen waiting in chrome://serviceworker-internals
  (unverified)) before the close-all step.
- Offline readiness (G2): after the first online launch, keep the app open about a minute on
  Wi-Fi, close every window, relaunch once online (now controlled), or check
  chrome://serviceworker-internals shows the worker ACTIVATED (unverified); then airplane mode
  and relaunch.
- Except for the update read, clear the origin's site data before a read that needs a fresh
  install; a worker otherwise keeps serving the previous build until every window closes. Uninstall the tailnet-origin app before
  CAP-10's production install (two apps named WordCell otherwise).

## Close-out document edits (CAP-9)

- Spine: AD-16 boot tail and `sw.ts` as built; AD-17 Celebration seam key list → six (F14);
  AD-7 `requestPersistence()` as built, none after a launch halted before the attempt settles;
  AD-15 boot returns at `halted()`, now including registration and persistence (F4); AD-1's scan
  list gains `navigator.storage` only in `src/shell/storage.ts` and no `messageSkipWaiting`,
  `SKIP_WAITING`, `updateSW` or `virtual:pwa-register` in non-test `src/` (CAP-1, CAP-3);
  Capability → Architecture Map PWA row (`shell/sw.ts`, the state module), and the state module
  in AD-16's `Binds:` line and the Structural Seed `shell/` list; Scaffold deltas: `workbox-window`
  in `package.json` `dependencies`; AD-18 Size: the gate also fails on a `sw.ts` manifest key no
  dynamic edge reaches, plus the `build-output.spec.ts` content check; AD-17 Projects: the update,
  Q-40 (`sw-failure.spec.ts`) and Q-42 cases, F8's `e2e/helpers/static-server.ts` and the
  `dist-smoke` offline case.
- EXPERIENCE.md State Patterns "New app version installed" and Assumptions row A-E4: "activates
  once every WordCell window has closed" (A-E4 wording synced to AD-16, no behaviour change).
- `docs/device-testing.md` per CAP-7; AGENTS.md, through `bmad-project-context`: the shell-module
  list gains `sw.ts` and the state module, and "`storage.ts` is called only by the shell stores"
  names `main.ts`'s boot `requestPersistence()` call (AD-16, AD-7) as the one exception; Single
  owners gains "`navigator.storage` only in `src/shell/storage.ts`".
