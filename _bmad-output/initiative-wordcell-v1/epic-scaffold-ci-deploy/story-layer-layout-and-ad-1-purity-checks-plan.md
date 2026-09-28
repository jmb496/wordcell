---
title: 'Layer layout and AD-1 purity checks'
type: 'chore'
ticket: '1'
created: '2026-09-27'
status: done
baseline_revision: '63961000f3b26316f98d91b685c6efd5e46fac94'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'pinned'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: true
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/story-layer-layout-and-ad-1-purity-checks.md'
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md'
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** Nothing enforces AD-1 or the AGENTS.md layer table yet, and the placeholder board sits at `src/` root, value-imports `./engine/deal` and lacks AD-14 attributes.

**Approach:** Add the three AD-1 checks (engine tsconfig in `check`, `src/architecture.test.ts`, Biome engine override), add `src/engine/index.ts`, move the board into `src/ui/` fed by `main.ts` props, and retarget the smoke spec. The story file's Acceptance Criteria (every delta-check bullet and fixture) are the contract; read it in full — this plan does not repeat the fixture lists.

## Boundaries & Constraints

**Always:** Story file fixture lists pass/fail exactly as written, incl. OQ #1–#6 (all accepted). Fixtures are (virtual path, source) pairs through the same check function as the tree scan; resolution is path-lexical, never `fs`. Test names start `AD-1 …` / `AD-17 …`. The scan passes on the real tree. Rule 6: no try/catch that hides a failure.

**Never:** Change deal output, `deal.ts`, `types.ts` or `deal.test.ts` (AD-5; epic 2 renames tests). No `.css`/`overflow` style changes (CAP-5). No dictionary work (CAP-2). No new npm dependencies (`typescript` 6.0.3 and `svelte/compiler` are already installed). Do not edit AGENTS.md (managed block, D8), SPEC, spine or the story file. No commit (the workflow commits).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Tree scan | current tree after the move | `AD-1` tree test green | failures list `path: rule` |
| Engine token | `src/engine/x.ts` with `Date.now()` | fails | message names token |
| Stripped token | engine `// Date` or `'Date'` | passes | — |
| UI engine import | `import { type Card } from '../engine'` | fails (value import) | — |
| Shell asset | `../../generated/dictionary/en.txt?url` | passes | — |
| Markup | `.svelte` `onclick={() => history.back()}` outside nav.ts | fails | — |

</intent-contract>

## Code Map

- `src/App.svelte` → `src/ui/App.svelte` -- `git mv`; replace `deal(seed)` with `$props()` `{ seed, columns }` typed via `import type { Card } from '../engine'`; keep `h1` "WordCell" and the `Seed {seed}` line; `<li>` gets `data-testid="card-{card.id}"`, `data-card-id`, `data-place="column"`; drop `<main data-testid="app">`'s testid.
- `src/app.css` → `src/ui/app.css` -- `git mv` only, content unchanged.
- `src/main.ts` -- import `./ui/App.svelte`, `./ui/app.css`, `{ deal } from './engine/index'`; `const seed = 1`; `mount(App, { target, props: { seed, columns: deal(seed) } })`.
- `src/engine/deal.ts`, `types.ts` -- read-only; `Card`, `Letter`, `deal` live here. Current engine code is token-clean (`Math.imul`/`Math.floor` only).
- `e2e/smoke.spec.ts` -- the only e2e spec; `playwright.config.ts` has `android` + `desktop` projects on the dev server.
- `tsconfig.app.json` -- extends `@tsconfig/svelte` (`verbatimModuleSyntax`), includes `src/**/*.{ts,js,svelte}`, no `exclude` today.
- `tsconfig.json` -- `references` app + node only; `package.json` `check` = `svelte-check --tsconfig ./tsconfig.app.json && tsc -p tsconfig.node.json` (green today).
- `biome.json` -- one override for `**/*.svelte`; `noRestrictedGlobals` options shape in Biome 2.5 is `{ "level": "error", "options": { "deniedGlobals": { "<name>": "<message>" } } }` (a map, verified in the installed schema).
- `vite.config.ts` -- Vitest `include: ['src/**/*.test.ts']`, `environment: 'node'`; `src/architecture.test.ts` is picked up with no change.

## Tasks & Acceptance

**Execution:**
- [x] `src/engine/index.ts` -- `export { deal } from './deal'; export type { Card, Letter } from './types';` and nothing else -- D1 surface.
- [x] `src/engine/tsconfig.json` -- story file row: `lib ["ES2023"]`, `types []`, `strict`, `noEmit`, `module esnext`, `target es2023`, `moduleResolution bundler`, include `./**/*.ts`, exclude `./**/*.test.ts`; standalone (no `extends`) -- AD-1 check 1.
- [x] `tsconfig.arch.json` (new, root) -- `extends ./tsconfig.app.json`, `compilerOptions { types: ["node"], tsBuildInfoFile: "./node_modules/.tmp/tsconfig.arch.tsbuildinfo" }`, `files ["src/architecture.test.ts"]`, `include []` -- verified to list only that file and pass `tsc`.
- [x] `tsconfig.app.json` -- add `exclude: ["src/architecture.test.ts"]`. `tsconfig.json` -- `references` gains `./tsconfig.arch.json` and `./src/engine/tsconfig.json`.
- [x] `package.json` -- `check` appends `&& tsc -p src/engine/tsconfig.json && tsc -p tsconfig.arch.json`; no other script changes.
- [x] `biome.json` -- override `includes: ["src/engine/**", "!src/engine/**/*.test.ts"]`, `noRestrictedGlobals` with AD-1's plain identifiers (`Date, performance, crypto, setTimeout, setInterval, requestAnimationFrame, fetch, localStorage, sessionStorage, globalThis, window, document, process, console`), message citing AD-1.
- [x] App move + `main.ts` -- per Code Map.
- [x] `src/architecture.test.ts` -- the scanner and its `AD-1 …` tests: fixture cases first (every pass/fail case in the story file's delta-check sub-bullets, grouped by sub-bullet), then one tree-scan test over `src/**` excluding itself. See Design Notes.
- [x] `e2e/smoke.spec.ts` -- one test titled `AD-17 …`: heading visible; `getByTestId(/^card-\d+$/)` count 52; each has `data-card-id` equal to its testid number and `data-place="column"`; collected ids = set 0–51; `column-1` holds 7, `column-8` 6 `card-` elements; no `.card` locator.
- [x] Scratch proofs (then revert, record output in Implementation Notes): `document.title` in an engine source fails `npm run check`; `window` in a scratch engine source is reported by `npx biome lint`, not in a scratch engine `*.test.ts`; `npx tsc -p tsconfig.arch.json --listFilesOnly | grep -v node_modules` lists only `src/architecture.test.ts`.

**Acceptance Criteria:**
- Given the finished tree, when `npm run test:all` runs, then lint, check, unit (incl. every `AD-1` fixture and the tree scan) and both Playwright projects pass.
- Given `src/App.svelte` and `src/app.css`, when listing `src/`, then neither exists and both are in `src/ui/`.
- Given a scratch `document.title` in `src/engine/deal.ts`, when `npm run check` runs, then it fails; reverted afterwards.
- Given the dev server, when the smoke spec runs on `android` and `desktop`, then it finds 52 `card-<CardId>` live elements with AD-14 attributes and no `data-testid="app"`.

## Implementation Notes

- Scratch proof, engine tsconfig: `export const scratchTitle = document.title;` appended to `src/engine/deal.ts` → `npm run check` exit 2 with `src/engine/deal.ts(51,29): error TS2584: Cannot find name 'document'. Do you need to change your target library? Try changing the 'lib' compiler option to include 'dom'.`; reverted (`git diff --quiet src/engine/deal.ts` clean).
- Scratch proof, Biome: `export const w = window;` in `src/engine/scratch.ts` and `src/engine/scratch.test.ts` → `npx biome lint` reports `src/engine/scratch.ts:1:18 lint/style/noRestrictedGlobals` ("AD-1: engine sources are pure; …") and nothing for the `*.test.ts`; both files deleted.
- Scratch proof, arch tsconfig: `npx tsc -p tsconfig.arch.json --listFilesOnly | grep -v node_modules` → `/mnt/d/CodeProjects/wordcell/src/architecture.test.ts` only.
- Tree-scan mutation: a temporary `src/foo.ts` made the tree test fail with `src/foo.ts: stray-file (…)`; removed.
- `src/ui/App.svelte` computes `cardCount` with `$derived` (svelte-check `state_referenced_locally` warning on a plain `const` from props).
- Fixture sources needing a backtick or `${` go through a small `js()` helper (`~` → backtick, `@{` → `${`) instead of `String.raw` (a tagged `String.raw` would interpolate `${…}` and keeps backslashes), so `noTemplateCurlyInString` stays quiet.
- `.svelte` markup checks (History API, `popstate`, `localStorage`, and a `history` markup-binding regex for `{#each … as history}`, `{@const history …}`, `{#snippet f(history)}`, `{:then/:catch history}`) run on the file minus `<script>`, `<style>` and `<!-- -->` blocks; scripts are scanned stripped like `.ts` (review fix).
- Review fixes: identifier boundaries `(?<![\w$])…(?![\w$])` (so `$window` passes); `enum`/`namespace`/`module history` are bindings; only `src/*.d.ts` is a declaration file (`src/lib/x.d.ts` is stray); fixture cases assert the exact rule list; tree scan asserts key files were walked; an `AD-1` test type-checks a virtual engine source under `src/engine/tsconfig.json` (fails when `DOM` is added to `lib`, checked and reverted); smoke spec also asserts `Seed 1`, 52 `[data-card-id]`, no `[data-mirror-of]`; engine tsconfig has its own `tsBuildInfoFile`.
- Choices beyond the story's fixture list: `/`-rooted and bare specifiers fail in engine sources (only `./`/`../` is relative); engine-test exceptions (`fixtures/*.json`, `generated/dictionary/en.txt?raw`) must be relative specifiers; a dynamic `import()` of `fixtures/*.json` counts the attribute only from a literal `{ with: { type: 'json' } }` option; `*.d.ts` outside the layer dirs (anywhere under `src/`) follows the shell import column; `import.meta.glob*` (any member starting `glob`) fails; `history` bindings also cover class names, `import x = require()` and `const [history]`.
- Known limitation (OQ #2): aliasing/destructuring (`const { random } = Math`, `const M = Math`, `history['back']()`, `const h = window.history`, `window['localStorage']`) passes the scan; recorded in the test file header.
- For D8's AGENTS.md audit: rewrite the Layers sentence "Enforced once epic 1 adds `src/architecture.test.ts` and `src/engine/tsconfig.json`; until then this table is the rule", and add OQ #6's `generated/dictionary/en.txt?raw` exception to the Core row.
- Verification: `npm run lint` clean; `npm run check` 0 errors/0 warnings (svelte-check, node, engine, arch); `npm test` 183 passed in ~1.2 s; `npm run test:e2e` `AD-17 …` passed on `android` and `desktop`; `npm run test:all` green.

## Plan Change Log

## Review Triage Log

### 2026-09-27 — Review pass
- verdicts: 31 findings — high 0, medium 8, low 19, false 4, maybe-false 0
- findings:
  - `[medium]` `patch` (intent-alignment) Engine tsconfig gate proven only by the reverted scratch run — grouped with verification-gap #1; fixed by the new `AD-1` engine-tsconfig test.
  - `[low]` `reject` (intent-alignment) Biome override proven only by a scratch run — the token fixtures and tree scan cover the same 14 names; a regression costs only editor feedback; fix would add a config-parsing test.
  - `[low]` `reject` (intent-alignment) `tsconfig.arch.json` `--listFilesOnly` proven only in the plan — a widened arch program fails `npm run check` loudly (TS2882 on the css import); no silent harm.
  - `[false]` `reject` (intent-alignment) Fixtures prove `check()` rather than the tsc/Biome gates — descriptive; the gates are separate checks by design (AD-1), and check 1 now has a test.
  - `[false]` `reject` (intent-alignment) `index.ts` export surface not enforced — the story asks for the file's contents, not a check.
  - `[low]` `reject` (intent-alignment) HTML comments stripped from markup though OQ #1 says "minus `<style>`" — comments are not executable; no harm named.
  - `[medium]` `patch` (intent-alignment) `.svelte` script text re-scanned unstripped by the markup checks — grouped with blind-hunter #12 and edge-case #1; markup variant now also cuts `<script>` blocks; passing fixture added.
  - `[low]` `reject` (intent-alignment) `@ts-` directive regex also matches strings — unlikely in engine code, fails loudly, fix adds branching.
  - `[low]` `patch` (intent-alignment) Any nested `*.d.ts` treated as a declaration file — grouped with blind-hunter #9 and edge-case #4; only `src/*.d.ts` is a declaration now; `src/lib/x.d.ts` fixture fails.
  - `[false]` `reject` (intent-alignment) Extras (class/function-expression names, `globEager`) — stricter than the story, no conflict with intent.
  - `[medium]` `patch` (verification-gap) AD-1 check 1 has no standing test — new `AD-1` test parses `src/engine/tsconfig.json`, asserts fileNames, and type-checks a virtual engine source using `navigator`, `document`, `Buffer` (fails when `DOM` is added to lib, checked and reverted).
  - `[low]` `patch` (verification-gap) Seed wiring / `Seed {seed}` line unobserved — smoke now asserts `Seed 1`.
  - `[low]` `reject` (blind-hunter) Ambient `declare const navigator` in an engine source bypasses check 1 — deliberate circumvention, same class as OQ #2 aliasing that the owner assigned to code review; failing `declare` would be a new rule; listed under residual risks.
  - `[medium]` `patch` (blind-hunter) `history` bindings in Svelte markup unchecked — grouped with edge-case #2; markup binding regex for `each … as`, `@const`, `snippet`, `:then`, `:catch`, with fixtures.
  - `[low]` `patch` (blind-hunter) `enum`/`namespace`/`module history` missed — grouped with edge-case #3; added to the binding list with fixtures (plus class, array destructuring, catch, for-of, import-equals).
  - `[low]` `reject` (blind-hunter) JSDoc `import()` types in `.js` shell/UI files skip layer checks — the project writes no `.js` under `src/`; fix needs a JSDoc walk.
  - `[medium]` `patch` (blind-hunter) Failing fixtures assert only `toContain` — cases now assert the exact rule list; no false positives surfaced; six cases list their legitimate extra rules.
  - `[low]` `patch` (blind-hunter) Implemented behaviour without fixtures — added dynamic JSON import with/without option, `import = require` deep, `globEager`, engine test `?url`, shell deep `export *`, shell test importing ui.
  - `[low]` `reject` (blind-hunter) Token list in three places, Biome list unchecked — drift only loses editor hints; the scan is the authority (AD-1); fix adds a config test.
  - `[low]` `patch` (blind-hunter) Tree scan only checks `files.length > 0` — now asserts key files were walked.
  - `[low]` `patch` (blind-hunter) Stray-dir `*.d.ts` never flagged — same root cause as intent-alignment #9; shared fix.
  - `[low]` `patch` (blind-hunter) `\b` lets `$window` match — boundaries now `(?<![\w$])…(?![\w$])`; passing fixture.
  - `[low]` `patch` (blind-hunter) Smoke does not prove one live element per card — asserts 52 `[data-card-id]` and 0 `[data-mirror-of]`.
  - `[medium]` `patch` (blind-hunter) `.svelte` script comments held to a stricter rule — same root cause as intent-alignment #7; shared fix.
  - `[low]` `patch` (blind-hunter) Engine tsconfig lacks `tsBuildInfoFile` — added `../../node_modules/.tmp/tsconfig.engine.tsbuildinfo`.
  - `[medium]` `patch` (edge-case) Markup checks see unstripped script text — shared fix with intent-alignment #7.
  - `[medium]` `patch` (edge-case) Markup `history` bindings — shared fix with blind-hunter #2.
  - `[low]` `patch` (edge-case) `enum`/`namespace history` — shared fix with blind-hunter #3.
  - `[low]` `patch` (edge-case) Stray-dir `*.d.ts` — shared fix with intent-alignment #9.
  - `[low]` `patch` (edge-case) `tsc -b` writes `src/engine/tsconfig.tsbuildinfo` — shared fix with blind-hunter #13.
  - `[false]` `reject` (edge-case) Symlinked directory under `src/` crashes the walk with EISDIR — loud failure on a state never shown reachable (no symlinks in the repo); correct fail-fast behaviour.

## Design Notes

Use the installed `typescript` API, not a hand-rolled lexer: `ts.createSourceFile(path, text, Latest, true, TS)` per script. Build stripped text by replacing with spaces (keep newlines/offsets) the ranges of comments (scanner trivia), `StringLiteral`, `NoSubstitutionTemplateLiteral`, the literal parts of `TemplateHead/Middle/Tail`, and `RegularExpressionLiteral`; a comments-only variant feeds `popstate`. Run the story's regexes on the right variant (story: Stripper sub-bullet names which). Imports, bindings and `import.meta.glob` come from the AST: `ImportDeclaration`/`ExportDeclaration` (`isTypeOnly` on the clause/declaration), `ImportCall` args (`StringLiteral` or no-substitution template, else fail), `ImportTypeNode` (not type-only per story), `with` attributes. `history` bindings: fail on binding names (`VariableDeclaration`, `Parameter`, `FunctionDeclaration`, import names, `BindingElement` incl. `{ history: h }`, `ShorthandPropertyAssignment`, object-literal `MethodDeclaration`); pass `PropertySignature`, `PropertyDeclaration`, `PropertyAssignment`, property access.

`.svelte`: extract every `<script …>` block (instance, `module`, `context="module"`) with a regex and parse each as TS; for OQ #1 run the History/`popstate`/`localStorage` regexes on the file minus `<style>` blocks and `<!-- -->` comments, with no JS string stripping (markup text is not JS; an apostrophe would break a string stripper).

One pure function `check(path, source): Violation[]` plus a path classifier; the tree test walks `src/` with `node:fs` and asserts the combined list is empty. Write fixture sources containing `${…}` with `String.raw` so Biome `noTemplateCurlyInString` stays quiet.

## Verification

**Commands:**
- `npm run lint` -- expected: clean.
- `npm run check` -- expected: 0 errors across svelte-check, node, engine and arch configs.
- `npm test` -- expected: all `AD-1 …` and existing deal tests pass, suite under 5 s.
- `npm run test:e2e` -- expected: `AD-17 …` passes on `android` and `desktop`.
- `npm run test:all` -- expected: green.

## Auto Run Result

**Status:** built.

**Summary:** AD-1's three checks are in place (engine tsconfig in `npm run check`, `src/architecture.test.ts` scanner with 200+ fixture cases and a tree scan, Biome `noRestrictedGlobals` for engine sources), `src/engine/index.ts` is the D1 surface, the placeholder board lives in `src/ui/` fed by `main.ts` props with AD-14 card attributes, and the smoke spec is `AD-17 …` on test ids.

**Files changed:**
- `src/architecture.test.ts` — new: TypeScript-parser-based AD-1 scanner, fixture suites per story bullet, engine-tsconfig test, tree scan.
- `src/engine/index.ts` — new: exports `deal`, `Card`, `Letter` (D1).
- `src/engine/tsconfig.json` — new: ES2023-only, no types, tests excluded (check 1).
- `tsconfig.arch.json` — new: Node types for the scanner file only (`files` + `include: []`).
- `tsconfig.app.json` — excludes `src/architecture.test.ts`; `tsconfig.json` — references the two new configs.
- `package.json` — `check` also runs the engine and arch configs.
- `biome.json` — engine-only `noRestrictedGlobals` override (tests excluded).
- `src/App.svelte` → `src/ui/App.svelte` — props, type-only engine import, AD-14 attributes, no `data-testid="app"`; `src/app.css` → `src/ui/app.css` unchanged.
- `src/main.ts` — `const seed = 1`, `deal` from `./engine/index`, props.
- `e2e/smoke.spec.ts` — `AD-17 …`: 52 `card-<id>` ids 0–51 with attributes, column counts, `Seed 1`, no mirrors, heading.

**Review (thorough: blind-hunter, edge-case-hunter, verification-gap, intent-alignment):** 31 findings. Patched: 19 rows in 12 root-cause groups (medium: markup re-scan of script text, markup `history` bindings, exact fixture assertions, engine-tsconfig standing test; low: stray-dir `.d.ts`, enum/namespace bindings, missing fixtures, tree-scan anchors, `$` boundaries, smoke uniqueness and seed, engine `tsBuildInfoFile`). Deferred: none. Rejected: 12 — Biome/arch gates proven by scratch runs only (low, no silent harm), export surface not enforced (false), HTML comments stripped in markup (low, not code), `@ts-` in strings (low), extras beyond the story (false), fixtures-vs-gates (false), ambient `declare` bypass (low, deliberate circumvention per OQ #2 stance), JSDoc imports in `.js` (low, no `.js` under `src/`), Biome token list drift (low), symlink EISDIR (false, loud fail on unreachable state).

**Follow-up review recommended:** true — four medium entries were patched (0 high, 4 medium, 8 low groups). Unverified risk: the markup `history`-binding regex and the new script-cutting in `svelteMarkup` were written after the review and have only their own fixtures; the exact-assertion change touched every failing case.

**Verification:** `npm run test:all` green after patches — Biome clean (21 files), svelte-check 0 errors / 0 warnings, node/engine/arch `tsc` clean, Vitest 208 passed (~1.4 s), Playwright `AD-17 …` passed on `android` and `desktop`. Scratch proofs in Implementation Notes (engine `document.title` → TS2584; Biome `window` flagged in source not test; arch program lists only the scanner; `DOM` in engine lib fails the new test).

**Residual risks:**
- Deliberate bypasses pass the scan: aliasing/destructuring (OQ #2) and an ambient `declare const navigator` in an engine source (not in the token list, and it satisfies tsc). Code review is the guard.
- Markup checks are regexes over the template, not a Svelte parse; unusual template syntax could slip past or false-positive.
- AGENTS.md is stale until the D8 audit: the Layers "Enforced once epic 1 adds…" sentence and the Core row's `generated/dictionary/en.txt?raw` exception (OQ #6).
- Implementation Notes' line "`*.d.ts` outside the layer dirs (anywhere under `src/`)…" predates the review fix; only root `src/*.d.ts` is a declaration file now.
