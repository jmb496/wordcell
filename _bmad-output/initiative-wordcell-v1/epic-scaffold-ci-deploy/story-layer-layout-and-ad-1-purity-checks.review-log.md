# Review log — story 1.1 Layer layout and AD-1 purity checks

Target: `story-layer-layout-and-ad-1-purity-checks.md`. Refs: epic 1 SPEC.md, build-notes.md,
delta-checks.md, epic file, ARCHITECTURE-SPINE.md, AGENTS.md, CLAUDE.md, game-flow-spec.md,
requirements-carryover.md. Pre-loop copy kept in the session scratchpad.

## Pass 1 — 2026-09-27 19:02
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 8, minor 6, decision-needed 1  |  Dropped in triage: 1 (plus ~20 duplicates merged)
### Applied
- [major] Delta checks, architecture.test.ts — SPEC fixture list omits AD-1 clauses (`history` binding, deep engine import, engine relative escape, engine-test vitest/fixtures JSON, stray `src/foo.ts`) → list marked a minimum; fixture sub-list added.
- [major] Description / Delta checks — AGENTS.md layer table (shell never imports `src/ui/`) unenforced → "Layer table" fixture bullet; Description cites SPEC CAP-1 intent.
- [major] Delta checks — import forms undefined (inline `type`, re-export, dynamic import, index spellings) → "Import forms" bullet with fail fixtures.
- [major] (absent) — `node:fs` in `architecture.test.ts` vs app tsconfig types; build-notes `[ASSUMPTION]` → pinned: excluded from `tsconfig.app.json`, own `tsconfig.arch.json` run by `check`; `process.env` in shell/UI still fails.
- [major] Delta checks — stripper untested beyond the template case → comment/string/regex pass cases, division fail case.
- [major] Delta checks — "`*.test.ts` exemptions" ambiguous → each exemption spelled out from AD-1.
- [major] Delta checks — `popstate` match undefined (`onpopstate`) → substring match on comment-stripped, string-kept source, with fixtures.
- [major] Tests — `src/App.svelte` `data-testid="app"` violates AGENTS.md Conventions → moved file drops it.
- [minor] Description — "renamed and relocated" ambiguous → file path stays, title gets `AD-17`, locators move.
- [minor] Tests — smoke assertions unnamed → 52 `/^card-\d+$/`, attributes, column-1 = 7, column-8 = 6, heading kept.
- [minor] Verify — "rendered from src/ui/App.svelte" unobservable → dropped.
- [minor] Description D1 — main.ts imports from `./engine/index`, passes seed and columns.
- [minor] `Math[` — whitespace and `?.[` variants → fixtures added.
- [minor] engine tsconfig — `moduleResolution: "bundler"` without `module` → `module: "esnext"`, `target: "es2023"`.
- Notes open question (regex vs parser for `.svelte`) → replaced by an acceptance fixture (instance + module script blocks both fail).
### Decision needed
- Notes, Open questions #1 — should the ownership checks (History API, `popstate`, `localStorage`) also scan `.svelte` markup, contrary to the SPEC Assumptions "script blocks" line? — proposed default: yes, whole file minus `<style>`; import and token checks stay on script blocks; SPEC Assumptions updated to match.
### Dropped
- Adversarial: Vitest guard asserting `src/engine/tsconfig.json` / `biome.json` contents — beyond what the refs ask (stretch).

## Pass 2 — 2026-09-27 19:40
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 8, minor 8, decision-needed 1  |  Dropped in triage: 1 (plus duplicates merged)
### Applied
- [major] Layer table — read as an allow-list; would reject `svelte`, own-layer, assets and the CAP-2 `?url` stub (all four reviewers) → shell/UI a deny-list of cross-layer imports per AGENTS.md; `?query` stripped; pass fixtures added.
- [major] `history` binding — forms undefined (AGENTS.md: shorthand, destructuring fail) → nine fail forms, pass forms listed.
- [major] Import forms — source text for specifiers unstated → comment-stripped, string-kept; plus non-literal `import(x)` / `import.meta.glob` fail, `…/engine/` = index, UI `export *` fails, `src/main.ts` deep import passes.
- [major] Engine tsconfig — omitted `strict`, `noEmit`, include (build-notes) → full field set.
- [major] Stripper — no single-pass fixtures → `'//'`, `"/*"`, nested template cases.
- [major] Engine tokens — property names/keys unspecified → regex on stripped source; `x.process`, `{ fetch: 1 }` fail.
- [major] `*.test.ts` exemptions — shell/UI tests also exempt from `popstate` and `history` binding (AGENTS.md) → stated with fixtures; engine test with `history.pushState` / `'popstate'` fails.
- [major] Scan scope — `.mjs/.mts/.cts/.cjs/.tsx/.jsx` escaped → fail; engine `*.d.ts` token-scanned; root `main.ts`, `x.d.ts` pass.
- [minor] `Math.random` and History API whitespace / `?.` variants → fixtures.
- [minor] Engine tests — exact `vitest`; JSON needs `with { type: 'json' }`; `../shell/x`, `node:fs` fail.
- [minor] `popstate` substring — basis cited (AGENTS.md Known pitfalls).
- [minor] `tsconfig.arch.json` — pinned: root, extends app config, `types: ["node"]`, own include; `check` appends it; root `references` gains it and the engine config (fixer verified TS 6.0.3 accepts non-composite noEmit refs).
- [minor] Verify line — "as AD-1 and this ticket's delta-check bullets say".
- [minor] D1 — index exports exactly `deal`, `Card`, `Letter`; cites D1, not AD-2.
- [minor] Smoke — ids exactly 0–51.
- [minor] `.svelte` — legacy `<script context="module">` fixture.
### Decision needed
- Notes, Open questions #2 — widen AD-1's literal matchers to aliasing/destructuring/bracket bypasses (`const { random } = Math`, `const M = Math`, `history['back']()`, `window['localStorage']`)? — proposed default: no; known limitation in the plan result; code review catches deliberate aliasing (rule 7: spine change).
### Dropped
- Adversarial: `new URL('../engine/deal.ts', import.meta.url)` as an import form — not an import; stretch.

## Pass 3 — 2026-09-27 20:15
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 12, decision-needed 2  |  Dropped in triage: 0 (duplicates merged)
### Applied
- [major] `tsconfig.arch.json` — extending the app config inherits its `exclude` of the same file → TS18003, `check` red (reproduced by two reviewers, TS 6.0.3) → `files` + `exclude: []`, own `tsBuildInfoFile`.
- [major] Engine tests — "only `vitest` and fixtures" rejected relative engine imports, failing `deal.test.ts` in the tree scan → "besides relative paths inside `src/engine/`"; pass fixtures `./deal`, `../../fixtures/a.json`.
- [major] Source text per check unstated → token, History API, `history` binding, `localStorage` on fully stripped source; `popstate` and specifiers on comment-stripped, string-kept; pass fixture `'history.back()'`.
- [major] `/`-rooted specifiers bypass the deny-list → resolve from repo root; UI `/src/engine/deal` fails.
- [major] Typed parameter `(history: Foo)` vs pass case `history: x` → key passes only in object literals; typed params, renaming destructuring, method shorthand fail; `typescript` parser allowed.
- [minor] UI rule written out; code/JSON outside `src/` passes for shell/UI; engine `?query` / non-code imports fail.
- [minor] `?.` / whitespace variants marked "per OQ #2"; OQ #2 cell says so.
- [minor] Scan scope noted as tightening the build-notes `[ASSUMPTION]`; engine `.js`/`.svelte` fail; root/shell/UI `*.d.ts` get ownership checks.
- [minor] Index spellings: `…/engine`, `…/engine/`, `…/engine/index` only; no-`${}` template counts as literal.
- [minor] Fixtures are (virtual path, source) pairs; none written under `src/`.
- [minor] "entry 3" → CAP-3 test-harness story.
- [minor] Notes: D8 audit rewrites AGENTS.md's "Enforced once epic 1 adds…" sentence and clears resolved pitfalls.
### Decision needed
- Open questions #3 — fail non-literal `import()` and `import.meta.glob` under `src/**` (beyond AD-1)? — proposed default: yes, because unresolvable specifiers escape the layer checks.
- Open questions #4 — fail `/// <reference lib|types>` and `@ts-nocheck` / `@ts-ignore` / `@ts-expect-error` in engine sources (they disable check 1)? — proposed default: yes, with fixtures; else a known limitation.
### Dropped
- none

## Pass 4 — 2026-09-27 20:50
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 4, minor 10, decision-needed 2  |  Dropped in triage: 0 (duplicates merged)
### Applied
- [major] `tsconfig.arch.json` — `files` without `include` inherits the app's `include`, so all of `src/` is checked with Node types and no `vite/client` (`TS2882 './ui/app.css'`); the pass-3 TS18003 rationale was wrong (`exclude` never filters `files`). Orchestrator verified with TS 6.0.3 → `files` + `include: []`; acceptance: `--listFilesOnly` lists only the file; ineffective `process.env` check dropped.
- [major] `history` binding — "object-literal key only" would fail type members AD-17's `loaded()` needs → only binding positions fail; interface/type members, class field, `o.history = x` pass; method shorthand stays fail (AGENTS.md "never shorthand").
- [major] Scan scope — pass-3 tightening changed a SPEC Assumption without asking (rule 7), and D8 does not edit the SPEC → moved to OQ #5; dependent fixtures marked "per OQ #5".
- [minor] "(editors pick them up)" dropped; D8 line reworded as a request; lexical resolution stated; engine `./deal.js`/`./deal.ts` fail; root `*.d.ts` follows the shell column; UI `import('../engine').Card` type expression fails; `const seed = 1`, `columns = deal(seed)`; Biome `noTemplateCurlyInString` note; `fixtures/` top-level only.
### Decision needed
- Open questions #5 — scan-scope tightening (other script extensions under `src/`, engine `.js`/`.svelte`, engine `?query`/non-code imports) beyond build-notes/SPEC Assumptions? — proposed default: yes; SPEC Assumptions and build-notes updated by owner edit.
- Open questions #6 — AD-1 lets engine tests import only `vitest` + fixtures JSON, but AD-8/AD-17/AGENTS.md expect named dictionary repro cases to read the generated file; how? — proposed default: one named exception, a `?raw` import of `generated/dictionary/en.txt` in repro-case files; AD-1 amended by the owner; not blocking epic 1.
### Dropped
- none

## Result — capped at 4 passes
Majors per pass: 8 → 8 → 5 → 4. Pass 4's fixes were not re-reviewed. The majors kept moving to finer AD-1 scan details rather than repeating; the recurring root cause is that AD-1 specifies the scan as regexes plus prose, leaving lexer, binding-position and tsconfig mechanics to the ticket. Six owner questions are open in the ticket's Notes.
- Owner accepted all six defaults (2026-09-27); ticket statuses set to ACCEPTED, SPEC Assumptions, build-notes CAP-1 scan scope and spine AD-1 (+ Map Core row) amended; AGENTS.md Core row left to the D8 audit (managed block).
