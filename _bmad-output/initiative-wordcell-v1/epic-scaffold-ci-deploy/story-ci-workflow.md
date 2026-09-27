---
id: 8
type: story
title: "CI workflow"
parent: epic-scaffold-ci-deploy
covers: [CAP-8]
after: [7]
hitl: true
risk: medium
---

# CI workflow

## Description

Adds .github/workflows/ci.yml: on every push and PR, Node 24 and npm ci, lint → check → unit → build (size budget) → dist-smoke → upload dist/ with hidden files as artifact dist for entry 9's deploy.yml → build:test → e2e (android, desktop, pwa) → screenshot job in the container.

## Acceptance Criteria

Verify: actionlint reports nothing and each step's npm script passes locally; after the owner pushes, the first CI run is green (gate 4).

**Build precondition:** clean tree on `epic-1-scaffold`.

**Delta checks (delta-checks.md rows for CAP 8):**

- `ci.yml`: actionlint clean; every step's npm script passes locally; the first pushed run is green (owner).
- SPEC CAP-8 success: `.github/workflows/ci.yml` on Node 24 with `npm ci`, triggers `push` (all branches) and `pull_request`: lint → check → unit → `build` (size budget) → `dist-smoke` (`test:e2e:dist`) → upload `dist/` → `build:test` → e2e (`android`, `desktop`, `pwa`) → screenshot job in `container: mcr.microsoft.com/playwright:v1.63.0-noble` calling `npm run test:screens:run`.

**Build notes fixed here:** the upload uses `actions/upload-artifact` under the fixed name `dist` with `include-hidden-files: true`, so the artifact is the exact `dist/` CI tested, `.vite/` and `.assetsignore` included (entry 9's `.assetsignore` then excludes `.vite` at deploy). After `build:test`, the `pwa` step calls `PW_PREVIEW=dist-test playwright test -c playwright.pwa.config.ts --project pwa` directly, so `dist-test/` is built once. Playwright reports upload on failure. Actionlint runs through Docker `rhysd/actionlint` [ASSUMPTION per build-notes], which needs the Docker access entry 7 set up.

**Tests:** no new test ids; the workflow runs the existing suites.

**Owner checks at gate 4 (post-push, D6):** push `epic-1-scaffold`; the first `ci.yml` run is green in every job, screenshot job included, and the `dist` artifact is listed on the run.

**AGENTS.md `TODO(epic 1)` items removed:** none.

**Handoff:** entry 9's `deploy.yml` downloads the artifact `dist` from the `ci.yml` run that triggered it.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/epic-scaffold-ci-deploy.md
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-18 CI, AD-17 Scripts
- spec — _bmad-output/specs/spec-epic-1-scaffold-ci-deploy/build-notes.md, CAP-8 CI
