# Epic 7 rule coverage

P7 = Playwright in `e2e/pwa/` (`pwa` project on `dist-test/`, or `dist-smoke` on `dist/` where
noted). S = shell Vitest named `AD-n` (never rule coverage). B = build-output or script test.
D = device row in `device-checks.md` (owner check, not a test). The tickets record the test names;
CAP-9 checks every row has a passing test whose name carries the id, and closes the epic 3
`rule-coverage.md` P7 rows for Q-40 and Q-42 (F15).

| Rule sentence / behaviour | Capability | Test kind |
| --- | --- | --- |
| AD-16 `sw.ts` loaded by dynamic import only after the dictionary settles (ready, failed, timed out); not in `vite dev` | CAP-1, CAP-4 | S, P7 |
| AD-16 no prompt UI, no `updateSW`, no skip-waiting message sent; generated `sw.js` skips waiting only on `SKIP_WAITING` | CAP-1, CAP-6 | B |
| AD-16 / A-A15 a waiting worker does not activate on reload; activates once every page has closed | CAP-4 | P7; D (G3) |
| Q-40 worker or precache failure: nothing shown, game works online (`dist/`) | CAP-5 | P7 `dist-smoke` |
| Q-40 failure in a test build: `swState()` `failed`, AD-15 fatal surface | CAP-1, CAP-5 | S, P7 |
| Q-40 "a new version activates only once every WordCell window has closed" | CAP-4 | P7; D (G3) |
| Q-42 under a controlling worker, after a 404: Reload retries in place, banner kept, no page load | CAP-5 | P7 |
| Q-42 under a controlling worker: banner hides when the retry succeeds | CAP-5 | P7 |
| brief §6.8 offline: after `precacheComplete()`, reload with the network off, deal, validate, no fatal | CAP-4 | P7; D (G2) |
| AD-8 one download: dictionary once in the precache manifest, revision `null`; boot order | CAP-4 | P7 (existing `precache.spec.ts`), P7 |
| AD-7 `requestPersistence()` once per launch after the registration attempt settles; `persist()` only when not persisted; `false` and absent ignored; rejection to AD-15 | CAP-3 | S, P7 (order) |
| AD-17 `swState()` and `precacheComplete()`; frozen hook with exactly six keys; dev values | CAP-2 | P7 (`e2e/pwa/test-hook.spec.ts`), Playwright dev (`e2e/test-hook.spec.ts`) |
| AD-17 / AD-18 no `__wordcell` in `dist/` | CAP-2 | P7 `dist-smoke` (existing) |
| AD-16 the only `serviceWorker.register` is in the `sw.ts` chunk; no `registerSW.js` | CAP-6 | B |
| AD-18 `sw.ts` chunk and `workbox-window` outside the counted set; total ≤ 600,000 bytes | CAP-6 | B (`scripts/size-budget.test.mjs` on the real build), `postbuild` |
| A-A11 boot-pushed entries honoured by Android back | CAP-9 | D (G5, G6) |
| brief §6.2 force-stop restore | CAP-9, CAP-10 | D (G4) |
| brief §6.3 ten qualifying games | CAP-10 | D |

Exempt: AD-16's manifest, icons, `globPatterns` and size limit sentences (proven by epic 1's
`build-output.spec.ts` and `precache.spec.ts`, unchanged); AD-18 deploy and header sentences
(epic 1, `deploy-check`); A-A3's "its coverage of `localStorage` is not relied on" (provenance).
