---
id: 9
type: story
title: "Device-read tooling for a registered worker"
parent: epic-pwa-release
covers: [CAP-7]
after: [1]
risk: low
---

# Device-read tooling for a registered worker

## Description

Adds CAP-7: `scripts/device-preview.mjs [session-fixture] [--history <history-fixture>] [--no-build]` (F9; `--history` consumes its value; a seed page written when either fixture is given, storing `wordcell:history` when `--history` is; the seed page's unregister kept only as a guard for an uncontrolled first visit); a seed run prints the clear-site-data hint, a no-fixture run prints "Fresh install: clear site data first." and "Update read (G3): keep site data."; `docs/device-testing.md` replaces "Repeat step 3" with clearing the origin's site data before a seed, re-seed or fresh-install read, says to close the Chrome tab and launch the installed app after seeding (G4–G6, naming G4's fixtures `session-place-free-letter-redo-tail.json` and `session-gave-up.json`), gives the Desktop-row line (G20–G22), the two-build update read in `device-checks.md` G3's order with A's and B's readiness steps and the spoiled read (redone once; a second consecutive one routes as G3 says), the offline readiness step and launch (G2), and uninstalling the tailnet-origin app before entry 12's production install; nothing new ships in `dist/` and `dist/sw.js` is unchanged.

## Acceptance Criteria

Verify: `scripts/device-preview.test.mjs` passes cases for a history-only run, a session-plus-history run and the two printed-hint variants; `docs/device-testing.md` covers each step CAP-7 lists (checked against `device-checks.md` G2–G6 and G20–G22); `npm run build` leaves `dist/` without the seed page; `npm run test:all` is green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- spec — SPEC.md CAP-7, F9; build-notes.md Device tooling; device-checks.md G2–G6, G20–G22
- code — scripts/device-preview.mjs, scripts/device-preview.test.mjs, docs/device-testing.md, fixtures/history-invalid-*.json
