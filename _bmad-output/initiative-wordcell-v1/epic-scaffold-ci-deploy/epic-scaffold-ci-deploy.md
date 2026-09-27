---
type: epic
title: "Scaffold hardening, CI and deploy"
parent: initiative-wordcell-v1
covers: []
after: []
assignee: ""
risk: high
---

# Scaffold hardening, CI and deploy

## Description

Brings the scaffold at `785c0f6` to the spine's shape and puts the checks every later epic builds against in place: AD-1 purity, the 3–23-letter dictionary, the three Playwright configs and helpers, the font, PWA packaging, the 600 KB size budget, screenshots, CI and deploy. The epic spec `spec-epic-1-scaffold-ci-deploy` owns the capabilities (CAP-1…CAP-9), constraints, non-goals and decisions D1–D8; `delta-checks.md` maps every Scaffold delta to its CAP and acceptance check.

## Outcome

Every later epic writes code against enforced checks and ships through CI; the SPEC's Success signal is the measure.

## Requirements

The spec's capabilities replace this section: `_bmad-output/specs/spec-epic-1-scaffold-ci-deploy/SPEC.md`, CAP-1…CAP-9. The platform baseline has no parent ids; the source is spine Proposed epics row 1 and Scaffold deltas.

## Done when

1. On a fresh clone, `npm ci && npm run test:all` passes with no manual step.
2. Adding `Date.now()` to an engine source turns `npm run test:all` red; a `?url` dictionary over 600,000 gzip bytes turns `npm run build` red.
3. A push produces a green `ci.yml` run, screenshot job included, that uploads the tested `dist/` as an artifact.
4. A push to `main` puts that artifact live on `wordcell.<account>.workers.dev`, unrebuilt, with the AD-18 cache headers and 404s.

## Boundaries

Tooling, build, packaging, CI and deploy on the placeholder board. Not engine rules, `LangData` or the golden deal test (epic 2, D2), not shell stores or boot order (epic 3), not real UI (epics 4–6), not service-worker registration (epic 7), not `__APP_VERSION__` (epic 6, D7); SPEC.md Non-goals.

## References

- spec — _bmad-output/specs/spec-epic-1-scaffold-ci-deploy/SPEC.md, Capabilities, Constraints, Decisions
- spec — _bmad-output/specs/spec-epic-1-scaffold-ci-deploy/delta-checks.md, both tables
- spec — _bmad-output/specs/spec-epic-1-scaffold-ci-deploy/build-notes.md, per-CAP notes
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-1, AD-8, AD-16, AD-17, AD-18, Scaffold deltas, Proposed epics row 1
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, colors, A-D2, A-D5, App icon
- constraint — AGENTS.md, Architecture rules 1–7, Policy, Running and verifying, Conventions
- methodology — docs/development-methodology.md, Per-ticket loop, Definition of done

## Notes

- Decision: one ticket per capability in the SPEC's order, CAP-1 → CAP-9, each after the previous one; CAP-9 (deploy) is its own ticket and last (owner, 2026-09-27).
- Decision: epic branch `epic-1-scaffold`; every ticket's build precondition is a clean tree on it (owner, 2026-09-27).
- Decision: CI and deploy are verified locally by the build; post-push checks are the owner's at gate 4 (D6).
- Decision: each ticket drops its own AGENTS.md `TODO(epic 1)` items; after the last ticket one `bmad-project-context` audit removes the line and the resolved scaffold pitfalls (D8).
- Assumption: the chain CAP-1 → CAP-9 has no tracer-bullet slice and no parallel lanes; the owner's order stands in for both.
- Unknown: Docker is not reachable in the WSL distro (Docker Desktop's WSL integration is off, so the CLI cannot reach the server, 2026-09-27); entries 7 and 8 need it (screenshot container, actionlint).
- Decision: build-output checks (manifest, precache list, no `registerSW.js`, `.vite/manifest.json` read from disk, font preload) live in `e2e/pwa/` against `dist-test/` so `npm run test:all` runs them; `dist-smoke` keeps only what differs in `dist/` (no hook) (owner, 2026-09-27).
- Decision: no closing refactor sweep; one ticket per CAP, and the D8 audit plus the retrospective close the epic (owner, 2026-09-27).
- Decision: no `plan_checkpoint` / `done_checkpoint`; methodology gates 3 and 4 already stop after every ticket (owner, 2026-09-27).
- Decision: entry 3 stays one ticket, high risk, halting if the CDP touch helper fails under Pixel 7 emulation (owner, 2026-09-27).
- Decision: entry 3 names the precache check `AD-8 …` and the `dist-smoke` cases `AD-18 …` (owner, 2026-09-27).
- Decision: CI runs the Playwright `pwa` project directly after `build:test`, building `dist-test/` once (owner, 2026-09-27).
- Decision: `deploy.yml` takes the deployed URL from `wrangler deploy`'s output for its header checks (owner, 2026-09-27).
- Decision: before entry 1 the owner enables Docker Desktop's WSL integration and creates `epic-1-scaffold` (owner, 2026-09-27).
- Decision (owner, 2026-09-27): entry 1 owns the placeholder cards' AD-14 attributes and the `e2e/smoke.spec.ts` rename; entry 3's `dist-smoke` relies on them.
- Decision (owner, 2026-09-27): entry 8 uploads `dist/` with `include-hidden-files: true` so the artifact is the exact `dist/` CI tested; entry 9's `.assetsignore` excludes `.vite` at deploy.
