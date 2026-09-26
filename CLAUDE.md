# CLAUDE.md – WordCell

WordCell is a solo FreeCell-style word card game: 52 letter cards in 8 columns, words are formed
and placed on WordCells numbered 3–10. Primary target Android (installed PWA), also desktop and
mobile browsers. Rewrite of a stalled Board Game Arena implementation
(`D:\CodeProjects\bga-wordcell`, reference only, do not modify).

## Read first

- `docs/game-flow-spec.md` – numbered rules (R-xx) and open questions (Q-xx). Cite rule ids in
  tests and tickets. Do not implement behaviour that contradicts a confirmed answer in §9.
- `docs/requirements-carryover.md` – requirements inherited from the BGA version.
- `docs/platform-decision.md` – why this stack, what was rejected, the BMAD workflow.
- `AGENTS.md` (when present) – rules recorded by `bmad-project-context`.

## Stack

Vite 8 · TypeScript 6 · Svelte 5 (runes) · Vitest 5 · Playwright 1.63 · Biome 2 · vite-plugin-pwa.
Node ≥ 22.12 (WSL2 has Node 24). Static hosting; no backend.

## Architecture rules

1. **`src/engine/` is pure.** No DOM, no Svelte, no I/O, no timers, no `Math.random`. Every rule
   in the spec lives here and has a unit test. Deal is seeded (`deal(seed)`).
2. **State is event-sourced.** A game is `{seed, moves, undoIndex}`; positions are derived by
   replay. Undo/redo/persistence never touch the UI layer.
3. **UI is a thin renderer.** Svelte components read engine state and dispatch engine commands.
   During a drag, write `transform` to the dragged elements directly and commit on drop.
4. **Drag-and-drop is hand-rolled** with Pointer Events + `setPointerCapture`; `touch-action:
   none` on cards; drop targeting by card overlap. No DnD library.
5. **Dictionary** is `data/enable1.txt` filtered by `scripts/build-dictionary.mjs` into
   `public/dictionary/en.txt` (generated, git-ignored) and loaded as a `Set<string>`.
6. No fallbacks or defensive code that hides errors. Fail fast, fix the cause.
7. Ask before deviating from the spec or from an agreed pattern; do not commit unless asked.

## Commands

```bash
npm run dev            # Vite dev server on :5173
npm test               # Vitest, engine/unit tests (src/**/*.test.ts)
npm run test:watch
npm run test:e2e       # Playwright (e2e/), boots the dev server; projects: android (Pixel 7), desktop
npm run lint           # Biome check
npm run format         # Biome format --write
npm run check          # svelte-check + tsc
npm run test:all       # lint + check + unit + e2e
npm run build          # regenerates dictionary, then vite build (PWA)
```

Playwright needs system libraries once: `sudo npx playwright install-deps chromium`.

## Testing expectations

- A rule is done when its R-id appears in a test name and the test passes.
- Engine tests are exhaustive and fast; UI tests cover flows (pick up run → tray → place → undo)
  in the android project first.
- Screenshot tests use `toHaveScreenshot`; generate baselines in WSL2/Linux only.

## BMAD

Skills are installed in `.claude/skills/bmad-*`; runtime in `_bmad/`; artifacts in
`_bmad-output/` (planning-artifacts, implementation-artifacts, specs). Legacy inputs are in
`_bmad-output/planning-artifacts/legacy/`. Workflow: product brief → ux → architecture spine →
project-context → spec per epic → preview-ticketing → one `bmad-build` per ticket in a fresh chat
→ code-review → retrospective. Skip PRD. Ask `bmad` for help or status.
