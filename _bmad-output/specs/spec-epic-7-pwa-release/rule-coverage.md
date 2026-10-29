# Epic 7 rule coverage

P7 = Playwright in `e2e/pwa/` (`pwa` project on `dist-test/`, or `dist-smoke` on `dist/` where
noted). S = shell Vitest named `AD-n` (never rule coverage). B = build-output or script test.
D = device row in `device-checks.md` (owner check, not a test). The tickets record the test names;
CAP-9 checks every row has a passing test whose name carries the id, and closes the epic 3
`rule-coverage.md` P7 rows for Q-40 and Q-42 (F15). D-only rows (A-A11, brief §6.2, §6.3) are
device checks, not test rows. A P7 row turned D under SPEC Assumptions is not an exemption (brief
§6.4 exempts only ownership, provenance and versioning-process sentences): it is recorded as a
§6.4 gap with its reason, which Jared accepts explicitly in the epic Notes, and the §6.4 audit
lists it.

| Rule sentence / behaviour | Capability | Test kind |
| --- | --- | --- |
| AD-16 `sw.ts` loaded by dynamic import only after the dictionary settles (ready, failed, timed out); not in `vite dev` | CAP-1, CAP-4 | P7 (first-launch order; dictionary-404 launch, `dictionaryState()` at `register`); Playwright dev (`e2e/test-hook.spec.ts`, `unregistered`) |
| AD-16 no prompt UI, no `updateSW`, no skip-waiting message sent; generated `sw.js` skips waiting only on `SKIP_WAITING`, no `clientsClaim` | CAP-1, CAP-6 | S (faked `Workbox`: `messageSkipWaiting`/`messageSW` never called; architecture source scan of `src/`) + B (generated `sw.js` only) |
| Q-40 AD-16 A-A15 a waiting worker does not activate on reload or while any page stays open; "a new version activates only once every WordCell window has closed" (two pages, one closed, another opened: still A; all closed: B) | CAP-4 | P7; D (G3) (D only as a §6.4 gap, preamble, if Chromium cannot show it) |
| Q-40 worker or precache failure (`/sw.js` 404; one precached URL 404 during install): nothing shown, game works online, persistence requested after the failed `register` settles (`/sw.js` case) (`dist/`) | CAP-5 | P7 `dist-smoke` (`dist-smoke.spec.ts`) |
| Q-40 failure in a test build (both routes): `swState()` `failed`, AD-15 fatal surface | CAP-1, CAP-5 | S, P7 |
| Q-40 (F17) rejected `import()` of `sw.ts` (chunk 404, route hit): `failed`, nothing shown, boots, plays, validates (`dist/`); in a test build, AD-15 fatal surface, `swState()` `failed`, no `persisted`/`persist` call | CAP-1, CAP-5 | P7 `dist-smoke` (`dist-smoke.spec.ts`); P7 (`pwa`) |
| AD-16 AD-7 (F4) a halted launch registers no worker and requests no persistence | CAP-1, CAP-3 | P7 (the plan picks the halting mechanism) |
| Q-42 under a controlling worker, after a 404: Reload retries in place, banner kept, no page load | CAP-5 | P7 |
| Q-42 under a controlling worker: banner hides when the retry succeeds | CAP-5 | P7 |
| brief §6.8 offline: after `precacheComplete()`, reload with the network off, deal, validate, no fatal | CAP-4 | P7; D (G2) |
| AD-8 one download: dictionary once in the precache manifest, revision `null`; boot order | CAP-4 | P7 (existing `precache.spec.ts`), P7 |
| AD-7 `requestPersistence()`: `persist()` only when not persisted; `false` and absent ignored; rejection to AD-15 | CAP-3 | S |
| AD-7 once per launch after the registration attempt settles (first launch; dictionary-404 launch: `persisted`/`persist` called exactly once, after `register` settled) | CAP-3 | P7 |
| AD-17 `swState()` and `precacheComplete()`; frozen hook with exactly six keys; dev values | CAP-2 | P7 (`e2e/pwa/test-hook.spec.ts`), Playwright dev (`e2e/test-hook.spec.ts`) |
| AD-17 / AD-18 no `__wordcell` in `dist/` | CAP-2 | P7 `dist-smoke` (existing) |
| AD-16 the only `serviceWorker.register` is in the `sw.ts` chunk; no `registerSW.js` | CAP-6 | B |
| AD-18 `src/shell/sw.ts` key a dynamic entry outside the counted set; `workbox-window` (inlined in that chunk) outside it by content (a Workbox marker and `serviceWorker.register` only in the `sw.ts` closure); total ≤ 600,000 bytes | CAP-6 | `postbuild` (`size-budget.mjs` fails on a `sw.ts` key no dynamic edge reaches), B (`size-budget.test.mjs` synthetic-manifest case for that failure; `e2e/pwa/build-output.spec.ts` reads `.vite/manifest.json`) |
| A-A11 boot-pushed entries honoured by Android back | CAP-9 | D (G5, G6) |
| brief §6.2 force-stop restore | CAP-9, CAP-10 | D (G4) |
| brief §6.3 ten qualifying games | CAP-10 | D |

Exempt: AD-16's manifest, icons, `globPatterns` and size limit sentences (proven by epic 1's
`build-output.spec.ts` and `precache.spec.ts`, unchanged); AD-18 deploy and header sentences
(epic 1, `deploy-check`); A-A3's "its coverage of `localStorage` is not relied on" (provenance).
