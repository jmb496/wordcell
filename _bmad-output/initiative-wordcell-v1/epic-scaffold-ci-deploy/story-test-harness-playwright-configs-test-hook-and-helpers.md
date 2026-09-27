---
id: 3
type: story
title: "Test harness: Playwright configs, test hook and helpers"
parent: epic-scaffold-ci-deploy
covers: [CAP-3]
after: [2]
risk: high
---

# Test harness: Playwright configs, test hook and helpers

## Description

Adds testIgnore to playwright.config.ts, playwright.pwa.config.ts with PW_PREVIEW (D5), build:test with prebuild:test, test:e2e:pwa, test:e2e:dist and the AD-17 test:all, ignores dist-test/, the gated window.__wordcell hook, the seed, touch and lifecycle helpers with AD-17 self-tests, and the pwa and dist-smoke projects, dist-smoke relying on entry 1's card-<CardId> test ids.

## Acceptance Criteria

Verify: npm run test:all (lint, check, unit, test:e2e, test:e2e:pwa) is green, npm run build && npm run test:e2e:dist passes, grep -r __wordcell dist/ is empty, and the pwa precache check finds the dictionary with revision null.

**Build precondition:** clean tree on `epic-1-scaffold`.

**Delta checks (delta-checks.md rows for CAP 3):**

- `.gitignore` (CAP 3 part): add `dist-test/`; `git check-ignore dist-test/x` succeeds.
- `build:test` with `prebuild:test`: `npm run build:test` on a fresh clone writes `dist-test/` with hooks (the `pwa` project sees `window.__wordcell`).
- `test:e2e:pwa`, `test:all` per AD-17: `test:all` = lint + check + unit + `test:e2e` + `test:e2e:pwa`, green.
- `playwright.config.ts` `testIgnore` `*.screens.spec.ts` (and `e2e/pwa/`, [ASSUMPTION] per build-notes): `npx playwright test --list` shows no screens or `e2e/pwa/` spec.
- `playwright.pwa.config.ts` (CAP 3 part): exists; `--list -c playwright.pwa.config.ts` shows only `pwa` and `dist-smoke` specs; the config throws when `PW_PREVIEW` is unset (D5).
- Test hook module and gating: `pwa` sees `window.__wordcell` defined; `dist-smoke` sees it undefined; `grep -r __wordcell dist/` is empty; under `vite dev` it exists.
- seed / touch / lifecycle helpers: `AD-17` helper self-tests (e2e, `android`): `seedStorage` seeds once and a reload is unseeded; `captureBoot` copies raw `wordcell:*` values; `hidePage`/`showPage`/`pageHide`/`pageShow`/`touchDrag`/`longPress` dispatch the events AD-17 names. Stored values are raw strings; Session fixtures wait for epic 2.
- `pwa` project: the precache manifest check finds `assets/en-*.txt` with `revision: null` (the `?url` row's precache half).
- `dist-smoke` project: against `vite preview` of `dist/`: load, 52 live `card-<CardId>` elements (test ids from entry 1), no `pageerror` or console error, no `window.__wordcell`.

**Tests:** `AD-17 …` for the helper self-tests and the hook-presence cases; `AD-8 …` for the precache `revision: null` check and `AD-18 …` for the `dist-smoke` cases. New scripts: `build:test`, `prebuild:test`, `test:e2e:pwa`, `test:e2e:dist` (D5). `test:e2e:dist` is not part of `test:all` (AD-17); run it after `npm run build`.

**Owner checks at gate 4:** none beyond reading the plan's result.

**AGENTS.md `TODO(epic 1)` items removed:** `build:test`, `test:e2e:pwa`, `playwright.pwa.config.ts`, and the `testIgnore` for `*.screens.spec.ts`.

**Handoff:** entries 4 and 5 extend the `e2e/pwa/` precache spec this ticket creates; entry 8's CI calls `test:e2e:dist` and the `pwa` project.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/epic-scaffold-ci-deploy.md
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-17
- spec — _bmad-output/specs/spec-epic-1-scaffold-ci-deploy/build-notes.md, CAP-3 Harness

## Notes

- Open question: Whether CDP Input.dispatchTouchEvent drives pointer events under the Pixel 7 emulation without extra setup.
