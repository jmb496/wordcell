# WordCell agent instructions

## Architecture rules

Hand-maintained, outside the managed block so refreshes keep them. Rules 1–7 are what the spine, spec, UX docs and tickets cite as "CLAUDE.md rule N"; keep the numbers. "CLAUDE.md Testing expectations" means the test lines of the managed block below under Running and verifying and Conventions; "CLAUDE.md Commands" means the `package.json` scripts as AD-17 Scripts defines them; any other "CLAUDE.md" rule citation in docs (e.g. the methodology's Definition of done) means this file. Edits to the managed block go through `bmad-project-context`; hand edits belong in rules 1–7 above.

1. `src/engine/` is pure: no DOM, Svelte, I/O, timers, clock, `crypto` or `Math.random`. Every engine rule of the spec lives there with a unit test. The deal is seeded (`deal(seed)`). (Engine sources, not `*.test.ts`; AD-1's scan list, including `console`, `globalThis`, `process`, `fetch`, is the authority.)
2. State is event-sourced: a game is the spec §2 `Session` (`version`, seed, moves including draft and redo tail, cursor (`cursor.index` is the former `undoIndex`), `gaveUp`, `activeMs`); every position is derived by replay, nothing else about the game is stored in the Session. Undo, redo and persistence never touch the UI layer; the store's one sanctioned hook into the UI is `registerBeforeHide` (AD-9); `nav.ts` receives callbacks registered by the UI and `main.ts` (AD-9, AD-13); shell never imports `src/ui/`.
3. The UI is a thin renderer: components read `GameView` (plus shell state for non-engine concerns, AD-3) and dispatch commands. During a drag, write `transform` to the dragged elements directly and commit on drop.
4. Drag-and-drop is hand-rolled with Pointer Events + `setPointerCapture`, `touch-action: none` on cards, drop targeting by card overlap (dragged card vs whole hit rect, AD-12). No DnD library.
5. The dictionary is `data/enable1.txt` filtered by `scripts/build-dictionary.mjs` into `generated/dictionary/en.txt` (generated, git-ignored), imported with Vite `?url` so it ships content-hashed under `dist/assets/`, loaded as a `Set<string>` (AD-8).
6. No fallbacks or defensive code that hides errors: fail fast to the AD-15 surface and fix the cause. Any handling the spine or spec prescribes is a specified outcome, not a fallback (e.g. AD-15: parse results, `rejectedWord`, dictionary `failed`; SW/precache failures per Q-40 (`swState()` `failed`; thrown to the AD-15 handler in dev and test builds); `persist()` false or `navigator.storage` absent per AD-7; AD-7 absent-key defaults); the one silent default for unreadable stored data is prefs (Q-36).
7. Ask before deviating from the spec, the spine or an agreed pattern; do not commit unless asked (invoking `bmad-build-auto` or `bmad-build` is the ask for their local commits).

<!-- bmad:context -->
<!-- Verified 2026-10-01 against 0bbe299. Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## WordCell

Solo FreeCell-style word card game: 52 letter cards in 8 columns, words placed on WordCells 3–10.
Android installed PWA first, also desktop and mobile browsers; static hosting, no backend. Vite 8,
TypeScript 6, Svelte 5 (runes), Vitest 5, Playwright 1.63, Biome 2, vite-plugin-pwa. The rules
source is `docs/game-flow-spec.md`; planning artifacts live in `_bmad-output/planning-artifacts/`;
the architecture spine is the build contract.

## Policy

- Never implement behaviour that contradicts a confirmed answer in spec §9 or reopen an AD; stop and ask instead. If the spec and the spine disagree, the spec wins; stop and report the spine bug. Game-design intent is the owner's, never the agent's (`docs/development-methodology.md`).
- Never modify `D:\CodeProjects\bga-wordcell` (`/mnt/d/CodeProjects/bga-wordcell`, the old BGA version); read it for reference only.
- Never change the dealt layout for any seed (PRNG, deck order, shuffle, deal; AD-5) without the owner. Any change touching `deal.ts`, `buildDeck` or the distribution data keeps the AD-5 `R-02 golden deal` test in `src/engine/deal.test.ts` (seeds 1 and 4294967295) green with its literals unchanged; once v1 ships, a layout change bumps `SESSION_VERSION`.
- In tests, tickets, specs and code comments, cite rules by id (R-xx, Q-xx, §n, AD-n) instead of restating them.

## Where things are

- Rules and decisions: `docs/game-flow-spec.md` (R-xx, §9 Q-xx). Inherited requirements: `docs/requirements-carryover.md`. Stack rationale: `docs/platform-decision.md`. Roles, owner gates, per-ticket loop: `docs/development-methodology.md`.
- Architecture: `_bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md` — AD-1…AD-18, Consistency Conventions, Scaffold deltas. Before editing a file, read every AD whose `Binds:` line or Capability → Architecture Map row covers it (Map paths under engine/, shell/, ui/ are relative to `src/`; e.g. AD-14 binds `src/ui/**`, AD-15 all layers, AD-17 `e2e/**`); for root config files (`package.json`, `playwright*.config.ts`, `vite.config.ts`, `biome.json`, `.gitignore`), also read Scaffold deltas; then the epic spec.
- UX: `_bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md` (look, layout, tokens) and `EXPERIENCE.md` (behaviour, message catalogue).
- Layers (AD-1), enforced by `src/architecture.test.ts` (`npm run test`) and `src/engine/tsconfig.json` (`npm run check`).

| Layer | Directory | May import |
| --- | --- | --- |
| Core | `src/engine/` | only relative paths inside `src/engine/`; engine tests also `vitest` and `fixtures/*.json` via `import … with { type: 'json' }` |
| Shell | `src/shell/` | `src/engine/index.ts`, browser APIs |
| UI | `src/ui/` | `src/shell/**`; `import type` only from `src/engine/index.ts` |
| Entry | `src/main.ts` | everything; boot order (AD-16), global error handler (AD-15) |

- The column restricts cross-layer imports only; outside `src/engine/`, own-layer modules, npm packages and assets are allowed; shell never imports `src/ui/`.
- `src/architecture.test.ts` is a root-level Vitest file outside the layer table.
- Shell modules (`src/shell/`): `game.svelte.ts` the game store (`dispatch`, `newGame`/`replay`, lifecycle listeners, hide flush, `halt`/`haltCause`, `isStale`, AD-4, AD-9, AD-15); `history.svelte.ts` the score-history store (`reconcile`/`reset`, the Q-39 rollback, AD-6); `prefs.svelte.ts` prefs (AD-10, Q-36); `dictionary.svelte.ts` the dictionary (`load`/`retry`/`showBanner`, AD-8); `nav.ts` the History API (AD-13); `storage.ts` `localStorage` (AD-7); `seed.ts` seeds (R-74, AD-5); `clock.ts` the visible-time clock (AD-9); `test-hook.ts` the AD-17 test hook, whose type `e2e/globals.d.ts` also declares: change both together. Overlay state: `src/ui/overlays.svelte.ts`.

## Running and verifying

- Node ≥ 22.12 (WSL2 has Node 24). Keep TypeScript on 6.x (`~6.0`): svelte-check 4.7 peers `^5 || ^6`, so do not take npm-latest 7.
- Playwright needs system libraries once: `sudo npx playwright install-deps chromium`.
- Screenshot specs (`*.screens.spec.ts`) use `toHaveScreenshot`; generate and compare baselines only inside `mcr.microsoft.com/playwright:v1.63.0-noble` (`npm run test:screens`, Docker in WSL2); never on the host.
- `npm run test:all` (lint, check, unit, `build` with the size budget, `test:e2e:dist`, `test:e2e`, `test:e2e:pwa`; every suite except the screenshots) must pass before a ticket's plan goes to `built`; the rest of done is `docs/development-methodology.md` §Definition of done, and only the owner marks a ticket done.
- `npm run test:e2e` covers only the dev-server specs (`e2e/` minus `e2e/pwa/` and `*.screens.spec.ts`). `npm run test:e2e:pwa` builds `dist-test/` with test hooks (`build:test`) and runs `e2e/pwa/` against `vite preview`; `npm run test:e2e:dist` runs only the hook-free `dist-smoke` project (`dist-smoke.spec.ts` plus the hook-free precache, build-output and font specs) against `dist/` and does not build, so run `npm run build` first. `test:screens:run` works only inside the screenshot container (CI calls it there); on the host use `npm run test:screens`.
- The card font is built with `uv run scripts/build-font.py`, not by any npm script, test or CI.
- Keep engine tests exhaustive, the unit suite under 5 s on the dev machine and a watch re-run under 1 s (AD-17): engine tests use small inline `Set` dictionaries; only tests named as dictionary repro cases load the generated file, once per file.
- The 5 s unit budget is the warm-cache median (`fsModuleCache`, cached in `node_modules/.vitest-cache`); a cold first run takes about 7.5 s and is not budgeted.
- On the `/mnt/d` drvfs checkout `npm run test:watch` gets no file events and polling starves the suite: re-run `npm test`, or use a checkout on the Linux filesystem for watch.

## Conventions that differ from defaults

- Test names start with the id: `it('R-31 …')`, `test('R-14 …')`; a §/Q-id where no R-id exists; AD-n where no R-, §- or Q-id applies, and always for shell and UI Vitest tests even when an R-id relates (never R-id coverage). A rule is done when each of its sentences is covered, by the test kind the split below assigns, by a passing test whose name carries the id.
- Test split (AD-17): untagged engine sentences → Vitest. `(UI)`-tagged sentences (every sentence of a rule whose id carries (UI)) and app-shell sentences (R-38 load, R-73, R-74 seed, R-76 clock, §2 storage and version rejection) → Playwright, `android` project first (flows: pick up stack tail → tray → place → undo), `desktop` too for desktop-only behaviour. Shell Vitest tests never count as R-id coverage. The ticket plan lists the sentence → test mapping and exempt sentences (spec preamble: ownership, provenance, versioning process).
- `src/engine/index.ts` is the only engine surface (AD-2). The `TABLE` in `src/engine/commands.test.ts` (its first `describe`, "AD-2 command table") is the single source of truth for every command × precondition → no-op (same reference) or throw (`EngineError`); specs and tickets link to it, never copy it.
- A UI-level no-op is the UI not dispatching, gated by a `GameView` flag; an engine throw always means a bug, never a flow to catch.
- `GameView` from `view()` is the only derived game state (AD-3): no component re-derives columns, legality, enablement, score or k, or holds a letter table, rule constant or phase → legality map. Combine a `GameView` flag only with non-engine state (dictionary state, selection, overlays).
- One writer (AD-4): outside `src/engine/` and tests, only `src/shell/game.svelte.ts` calls `apply`, `accrue` or `createSession`, and `dispatch(command)` is the only way a player action reaches the engine; New game and Replay go through the store per AD-4, not `dispatch`. No second store or component-held game state.
- Single owners, in `src/**`: `localStorage` only in `src/shell/storage.ts` and the History API only in `src/shell/nav.ts` (shell/UI `*.test.ts` and `src/architecture.test.ts`, excluded from its own scan, exempt from these two, AD-1); `visibilitychange`, `pagehide` and `pageshow` listeners only in `src/shell/game.svelte.ts` (AD-9); `wordcell:prefs` only through `src/shell/prefs.svelte.ts` (AD-10); `wordcell:history` is written only as a result of `src/shell/history.svelte.ts` `reconcile`/`reset` (AD-6, AD-9), including AD-4's history-first write and its Q-39 write-back; `wordcell:session` written only by `src/shell/game.svelte.ts` (AD-4, AD-9); `storage.ts` is called only by the shell stores (AD-7); the hide flush writes only `wordcell:session` (AD-9). Overlay open state only in `src/ui/overlays.svelte.ts`; WAAPI animation durations only from `src/ui/motion.ts`; CSS transitions use `--wc-base-ms` (AD-10); every EXPERIENCE.md message-catalogue string only in `src/ui/text.ts` (words uppercase, `QU` as `QU`, minus sign U+2212); in `src/**`, `console.error` only in the `src/main.ts` error handler. Every Undo, Redo, menu (opening it and its items), key command and back, and the store's hide/pagehide flush (AD-9), calls the pointer controller's `cancel()` first (AD-12).
- Files: engine and shell modules kebab-case `.ts`; rune modules `*.svelte.ts`; components PascalCase `.svelte`; unit tests beside the file as `*.test.ts`; e2e: dev-server specs as `e2e/<flow>.spec.ts`, specs against a production build (`dist-test/`, `dist/`) as `e2e/pwa/<flow>.spec.ts`, screenshot specs as `e2e/<flow>.screens.spec.ts`, helper modules in `e2e/helpers/` with their tests in `e2e/helpers.spec.ts`; shared fixtures in root `fixtures/*.json`, seeded only through `e2e/helpers/seed.ts` `seedStorage`.
- Ids: `CardId` 0–51, columns 1–8, cells 3–10; 0-based only inside engine arrays. Commands are imperative camelCase, one per player intent; no generic `update`. Numbers: scores integers; time integer ms; seeds uint32.
- `data-testid` only for `column-<n>`, `foot-<n>`, `wordcell-<n>`, `card-<CardId>`, `primary-action`, `undo`, `redo`; locate every other control by role and name.
- One live element per card (AD-14) carries `data-card-id`, `data-testid="card-<CardId>"` and `data-place`; every other copy is a mirror (see Known pitfalls).
- `SESSION_VERSION` bumps when the Session schema, the deal (once v1 ships, AD-5) or a replay rule changes, never for dictionary changes; `HISTORY_VERSION` only when the record shape changes (Q-43); no migration code.
- Never override vite-plugin-pwa's `dontCacheBustURLsMatching`; the dictionary must download once (AD-8).

## Known pitfalls

- In `src/**` (shell/UI `*.test.ts` and `src/architecture.test.ts`, excluded from its own scan, exempt, AD-1), never declare a variable or import binding named `history` outside `src/shell/nav.ts`; object keys such as `loaded().history` are fine (write such keys explicitly (`history: value`), never shorthand or destructure them), but never followed by a History API member in AD-1's regex (`pushState`, `replaceState`, `back`, `forward`, `go`, `state`, `length`), and no `popstate` literal outside `src/shell/nav.ts`. The score history is `scoreHistory`, `reconcileHistory`, `wordcell:history` (the AD-1 scan fails otherwise).
- Mirrors carry `data-mirror-of`, never `data-card-id` or `data-testid`, and never animate; a duplicate breaks FLIP and test locators.
- Engine throws are `EngineError` with a kebab-case `check` code unique per check; every code is listed in `src/engine/errors.ts`. A new check adds its code there, and tests assert the code (`expectEngineError`), never the message.
- The D2 start-position seam (`Start`, `checkStart`, `replayFrom`, `replayWords`, `dealtStart`, `applyFrom`, `viewFrom`) is engine-internal for tests: never export it, `EngineError` or any new name from `src/engine/index.ts` beyond AD-2's list (`index.test.ts` pins the runtime keys; `src/architecture.test.ts` checks every export, types included, against AD-2's list with the TypeScript compiler API).
- `fixtures/` holds valid Sessions and histories and, beside them, one rejecting `session-invalid-*` / `history-invalid-*` file per parser check (AD-17 Seeding); seed Playwright from a `*-invalid-*` file only in a §2 rejection test or, for `history-invalid-*`, a History-notice flow (a notice test that needs an unreadable history), and name a new one `<key>-invalid-<reason>.json`.
- `src/engine/test-helpers.ts` is an engine source, not a test file, so it cannot import `vitest`: helpers that call `expect` (e.g. `expectEngineError`) stay local to each `*.test.ts`.
- `parseHistory` returns `{ ok: true, history }`: read it as `result.history`, never destructure it (the `history` pitfall above).
- Under Vitest, `*.svelte.ts` stores compile for the server, so `$derived` re-derives on every read: assert the reference of the underlying `$state`, never the identity of a derived getter such as `game.view`.

<!-- /bmad:context -->
