---
id: 7
type: story
title: "Screenshot pipeline in the Playwright container"
parent: epic-scaffold-ci-deploy
covers: [CAP-7]
after: [6]
hitl: true
risk: medium
---

# Screenshot pipeline in the Playwright container

## Description

Adds playwright.screens.config.ts, test:screens (docker run of the pinned image, node_modules in a named volume) and test:screens:run, and one placeholder-board screenshot spec on android and desktop with committed baselines (D4).

## Acceptance Criteria

Verify: npm run test:screens generates the baseline inside mcr.microsoft.com/playwright:v1.63.0-noble, a second run compares green, and npx playwright test --list under the default config shows no screens spec.

**Build precondition:** clean tree on `epic-1-scaffold`.

**First step (hitl):** run `docker version`; halt the build if the server is unreachable. The owner enables Docker Desktop's WSL integration before starting this ticket.

**Delta checks (delta-checks.md rows for CAP 7):**

- `test:screens`: runs the container; generates, then on a second run compares, the baseline.
- `playwright.screens.config.ts` (CAP 7 part): exists; `--list -c playwright.screens.config.ts` shows only the screens spec under `android` and `desktop`.
- Screenshot container (SPEC CAP-7 success): `npm run test:screens` generates and then compares the first baseline inside `mcr.microsoft.com/playwright:v1.63.0-noble`; the default config never collects `*.screens.spec.ts` (`npx playwright test --list`).

**Tests:** `AD-17 placeholder board screenshot` in `e2e/placeholder.screens.spec.ts` (D4), `android` and `desktop`, baselines committed. `test:screens` = `docker run --rm --ipc=host` of the pinned image with the repo mounted and `node_modules` in a named volume, running `npm ci && npm run test:screens:run` [ASSUMPTION per build-notes]; `test:screens:run` = `playwright test -c playwright.screens.config.ts`. The dev server inside the container regenerates the dictionary through `predev`. Never generate or compare baselines on the host.

**Owner checks at gate 4:** none beyond reading the plan's result; the baseline image is replaced by epic 4.

**AGENTS.md `TODO(epic 1)` items removed:** `test:screens`, `playwright.screens.config.ts`, and the sentence "Until `playwright.screens.config.ts` exists, add no `*.screens.spec.ts`". The remaining shell of the line waits for the D8 audit.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/epic-scaffold-ci-deploy.md
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-17 Projects, Screenshots
- spec — _bmad-output/specs/spec-epic-1-scaffold-ci-deploy/build-notes.md, CAP-7 Screenshots

## Notes

- Open question: Docker Desktop's WSL integration is off (the CLI cannot reach the server, 2026-09-27); the owner enables it before the build, and the ticket halts if docker version fails.
