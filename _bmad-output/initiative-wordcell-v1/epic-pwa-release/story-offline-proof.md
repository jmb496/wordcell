---
id: 6
type: story
title: "Offline proof"
parent: epic-pwa-release
covers: [CAP-4]
after: [3, 4]
risk: low
---

# Offline proof

## Description

Adds CAP-4's offline proof (brief §6.8) to `dist-test/` (`pwa`) and `dist/` (`dist-smoke`).

- **Order.** SPEC CAP-4's order (move, precache complete, offline reload, restore, deal, validate) governs; AD-17 Projects' "deal, validate, reload offline" wording is the known gap entry 11 (CAP-9) syncs, already recorded in SPEC CAP-4/CAP-9, so the build does not stop for it.
- **Start and known deal.** `seedStorage` with `fixtures/session-idle-fresh.json` (seed 1, AD-17 Seeding). A page init script (`page.addInitScript`, registered before the first `goto` so it also runs on the offline reload) makes a one-element `Uint32Array` `crypto.getRandomValues` call return seed 1 (other calls pass through), in both builds; it pins only the browser's random source behind `src/shell/seed.ts` (R-74), an init-script stub of a browser API like ticket 7.5's, test-only, no production path (F7).
- **Steps (both builds).** Online, make one move that leaves the game in progress (`session-composing.json`'s move). Wait for the precache; on `pwa` stop polling `precacheComplete()` once it is true and never call it after `setOffline(true)` (a reloaded page's first recompute fetches `/sw.js`, which offline rejects to AD-15; build-notes Offline). Read the before-state, `context.setOffline(true)`, then `page.reload()` while waiting for the navigation and the dictionary (`isList`) responses; assert both came from the worker (`response.fromServiceWorker()`), then the restore assertion, then on `pwa` `waitForDictionary(page, 'ready')`, then `expectNoPrompt(page)` (entry 3's check, before the deal). Deal through Menu → New game → the confirm's `New game` button (`ConfirmDialogs.svelte`), asserting the confirm appeared (it opens only while `GameView.inProgress`). Compose TAN as `session-composing.json` records it on seed 1 and press Validate; validated means accepted: `primary-action` reads `Confirm`. No fatal surface: then `expectNoPrompt(page)` again (it rejects the AD-15 Halted `alertdialog`), and on `dist-test/` `current().kind` is `active`.
- **Restore assertion.** `pwa`: AD-17 Reading state's comparison, a `snapshot()` (`e2e/helpers/restore.ts`) taken before going offline vs `loaded().session` after the reload, every field equal except `activeMs`, which is not smaller (the AD-9 pagehide flush accrues it). `dist-smoke`: the stored `wordcell:session` read before going offline vs after the reload, every field equal except `activeMs`, plus the moved card's `data-place` (or tray membership) unchanged in the DOM.
- **`pwa` case.** `e2e/pwa/offline.spec.ts` (runs under `pwa` only: `dist-smoke`'s `testMatch` omits it, no config change), with a file-level `test.use({ serviceWorkers: 'allow' })` and an F6 comment, as `update.spec.ts` does.
- **`dist-smoke` case.** In `e2e/pwa/dist-smoke.spec.ts` the existing file-level tests stay unchanged; a new `test.describe` sets `test.use({ serviceWorkers: 'allow' })` with an F6 comment (never file level), and entry 7 adds its cases inside it. Same steps minus the hook reads (build-notes Offline). The precache wait polls from the spec, not the hook: read `readPrecacheManifest(request)` URLs while online, then poll until `precacheMissing(page, urls)` (`e2e/helpers/precache.ts`, built by ticket 7.4 for this poll) is `[]` and `(await navigator.serviceWorker.getRegistration())?.active?.state === 'activated'`, with the 15 s timeout of the `precacheComplete()` poll in `e2e/pwa/test-hook.spec.ts`. The accepted Validate stands in for `dictionaryState()` `ready`; `expectNoPrompt` runs after the dictionary response finished and the restore assertion.
- The existing `precache.spec.ts` one-download check stays green.
- **Tests:** AD-16 AD-17 offline row of rule-coverage.md (P7, P7 `dist-smoke`); AD-8 one download (P7, existing). The row's D (G2) is the device row, not this ticket's. **Owns:** the offline proof and the `allow` describe in `dist-smoke.spec.ts`. **Consumers:** entry 7 (adds its cases beside it).

## Acceptance Criteria

Verify: `npm run test:e2e:pwa` and `npm run build && npm run test:e2e:dist` pass the tests named `AD-16 AD-17 offline after the precache is complete …` on `dist-test/` and `dist/`, and `precache.spec.ts` (AD-8, dictionary once with revision `null`) passes; `npm run test:all` is green. Test-only: no `src/`, `playwright*.config.ts` or hook-key change; the diff touches only `e2e/pwa/` specs and, if a shared helper is added, `e2e/helpers/` with its cases in `e2e/helpers.spec.ts`.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- spec — SPEC.md CAP-4, F6; build-notes.md Playwright mechanics (Offline, No-prompt checks)
- architecture — ARCHITECTURE-SPINE.md AD-16, AD-17 (Reading state, Seeding, Projects)
- brief — brief.md §6.8
- code — e2e/pwa/dist-smoke.spec.ts, e2e/pwa/precache.spec.ts, e2e/helpers/precache.ts, e2e/helpers/live-region.ts, e2e/helpers/restore.ts, fixtures/session-idle-fresh.json, fixtures/session-composing.json, src/ui/ConfirmDialogs.svelte
