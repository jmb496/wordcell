---
id: 1
type: story
title: "Layer layout and AD-1 purity checks"
parent: epic-scaffold-ci-deploy
covers: [CAP-1]
risk: high
---

# Layer layout and AD-1 purity checks

## Description

Adds src/engine/tsconfig.json to npm run check, src/architecture.test.ts, the Biome engine override and src/engine/index.ts (D1), moves App.svelte and app.css into src/ui/ with main.ts passing deal(1) columns as a prop, and gives the placeholder cards their AD-14 attributes with e2e/smoke.spec.ts renamed and relocated onto them.

## Acceptance Criteria

Verify: npm run test:all is green, the AD-1 fixture cases fail and pass as AD-1 says, a scratch document.title in an engine source fails npm run check, and the renamed smoke spec finds 52 card-<CardId> elements rendered from src/ui/App.svelte.

**Build precondition:** clean tree on `epic-1-scaffold`.

**Delta checks (delta-checks.md rows for CAP 1):**

- `App.svelte`, `app.css` → `src/ui/` (move part): both files absent at the `src/` root; the AD-1 scan is green on the tree.
- `check` gains `tsc -p src/engine/tsconfig.json`: script text; a scratch `document.title` in an engine source fails `npm run check` (shown in the plan, reverted).
- `src/engine/tsconfig.json` (`lib: ["ES2023"]`, `types: []`, tests excluded): as the `check` row; an engine `*.test.ts` using `vitest` still type-checks under the app config.
- `src/architecture.test.ts`: `AD-1` fixture cases per SPEC CAP-1 success (each forbidden token, `Math[`, the `` `${Date.now()}` `` template case, a non-relative engine import, a UI value import from the engine, a `history.pushState` and a `popstate` outside `nav.ts`, `localStorage` outside `storage.ts`, the `*.test.ts` exemptions); the scan passes on the tree.
- Biome `noRestrictedGlobals` for `src/engine/**`: `npx biome lint` on a scratch engine source using `window` reports the rule; the same in a `*.test.ts` does not (shown in the plan, reverted).
- SPEC CAP-1 success: the placeholder board still renders 52 cards.

**Tests:** `AD-1 …` in `src/architecture.test.ts` (matcher cases on inline fixture strings first, then the tree scan). `AD-17 …` for the renamed `e2e/smoke.spec.ts` (`android`, `desktop`), locating `card-<CardId>` and `column-<n>` test ids, never `.card`. This ticket owns the AD-14 attributes on the placeholder cards (`data-testid="card-<CardId>"`, `data-card-id`, `data-place="column"`) and the smoke rename, because it moves `App.svelte`; entry 3's `dist-smoke` relies on them.

**Owner checks at gate 4:** none beyond reading the plan's result.

**AGENTS.md `TODO(epic 1)` items removed:** none (this capability has no item on that line).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/epic-scaffold-ci-deploy.md
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-1, AD-14, Scaffold deltas
- spec — _bmad-output/specs/spec-epic-1-scaffold-ci-deploy/build-notes.md, Scaffold facts that bite, CAP-1 Purity checks

## Notes

- Open question: Whether a regex extraction of .svelte script blocks is enough for the AD-1 scan or a parser is needed.
