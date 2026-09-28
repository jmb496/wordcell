---
id: SPEC-epic-1-scaffold-ci-deploy
companions:
  - delta-checks.md
  - build-notes.md
  - ../../planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md
  - ../../planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md
  - ../../../AGENTS.md
  - ../../../docs/development-methodology.md
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# Epic 1 — Scaffold hardening, CI and deploy

## Why

Mandate plus foundation. The scaffold at `785c0f6` does not match the spine (Scaffold deltas),
enforces none of AD-1's purity rules, ships a 3–10 dictionary that misses reachable words (R-37),
and has no CI, size gate or deploy. Every later epic writes engine, shell and UI code against
checks this epic creates, and brief §6.5, §6.7 and §6.8 (purity, no manual deploy-to-test,
600 KB) are only testable once they exist. Scope is spine Proposed epics row 1; Scaffold deltas,
AD-1, AD-8 (build part), AD-16 (manifest, icons, font), AD-17 and AD-18 are authoritative and
not reopened.

## Capabilities

Listed in build order; each depends on those above it unless noted. `delta-checks.md` maps every
Scaffold delta to the capability and acceptance check that proves it; `build-notes.md` holds the
how.

- **CAP-1** Layer layout and AD-1 purity checks
  - **intent:** The repository enforces AD-1's three checks and the AGENTS.md layer table, so an
    engine file cannot reach the DOM, clock, randomness or I/O and no layer imports across the
    table; the placeholder board lives in `src/ui/`.
  - **success:** `npm run check` runs `tsc -p src/engine/tsconfig.json`; `src/architecture.test.ts`
    passes on the tree and its fixture cases (each forbidden token, `Math[`, the
    `` `${Date.now()}` `` template case, a non-relative engine import, a UI value import from the
    engine, a `history.pushState` and a `popstate` outside `nav.ts`, `localStorage` outside
    `storage.ts`, the `*.test.ts` exemptions) each fail or pass as AD-1 says; Biome reports
    `noRestrictedGlobals` on an engine source and not on an engine test; the placeholder board
    still renders 52 cards; `src/App.svelte` and `src/app.css` no longer exist.

- **CAP-2** Dictionary generation (AD-8 build part)
  - **intent:** Every entry point (dev, unit, e2e, build, test build) produces the 3–23-letter
    word list (R-37) in `generated/dictionary/en.txt` from a checksum-verified source, and the
    app bundles it as one content-hashed asset.
  - **success:** Output is 172,713 words, source order, LF, trailing newline; a changed
    `data/enable1.txt` checksum fails the script; hooks regenerate only when the output is missing
    or older than either input; `vite build` emits exactly one `dist/assets/en-<hash>.txt` and no
    `dictionary/en.txt`; `scripts/build-dictionary.test.mjs` passes under `npm run test`.

- **CAP-3** Test harness (AD-17)
  - **intent:** The three Playwright configs, the test-build and hook gating, and the shared
    seed, touch and lifecycle helpers exist, so later epics only add specs.
  - **success:** `npm run test:all` runs lint, check, unit, `build` (with the size budget),
    `test:e2e:dist`, `test:e2e` (`android`, `desktop`) and `test:e2e:pwa` green, screenshots
    staying container-only (`npm run test:screens`) (ticket 1.10, 2026-09-28); `window.__wordcell` exists under `vite dev` and `dist-test/`, and is
    absent from `dist/` (no `__wordcell` string in `dist/`); helper self-tests (`AD-17 …`) prove
    `seedStorage` seeds once and survives reload unseeded, `captureBoot` copies raw keys, and
    `hidePage`/`showPage`/`pageHide`/`pageShow`/`touchDrag`/`longPress` dispatch the events AD-17
    names; `dist-smoke` passes against `vite preview` of `dist/`; the `pwa` and `dist-smoke`
    projects assert the precache manifest lists the dictionary with `revision: null`.

- **CAP-4** Card-letter font (AD-18 font, DESIGN.md A-D2)
  - **intent:** The app ships the Fraunces static instance subset as `WordCell Serif`,
    precached, preloaded and loaded with `font-display: block`.
  - **success:** `uv run scripts/build-font.py` reproduces the committed
    `src/ui/assets/wordcell-serif.woff2` byte-for-byte from the checksum-pinned source; the woff2
    covers A–Z and `u` only; `OFL.txt` is committed; `dist/` holds the font once, the built
    `index.html` preload `href` equals the `@font-face` URL; the `pwa` precache check also finds
    the font with `revision: null`.

- **CAP-5** PWA packaging, manifest and icons (AD-16, DESIGN.md A-D5)
  - **intent:** The build's manifest, service-worker generation settings, `index.html` head,
    icons and global styles match AD-16, A-D5 and the DESIGN.md palette.
  - **success:** the built `manifest.webmanifest` deep-equals the A-D5 field set (no
    `display_override`); generated `sw.js` precaches per AD-16 `globPatterns` and nothing
    registers a worker (no `registerSW.js`, `injectRegister: false`, `registerType: 'prompt'`);
    `dist/.vite/manifest.json` exists; `index.html` has title `WordCell`, `viewport-fit=cover`,
    `theme-color` `#15171B`; `node scripts/build-icons.mjs` regenerates the three committed PNGs
    at 192, 512, 512 maskable; an e2e case reads `body` background `rgb(21, 23, 27)`, `overflow`
    not `hidden` on `html`/`body`, `overscroll-behavior` `none`.

- **CAP-6** Size budget (AD-18, AD-16 file limit)
  - **intent:** `npm run build` fails when the AD-18 counted set exceeds 600,000 gzip bytes,
    when the font or dictionary is missing from it, or when any precache-glob file exceeds
    4,000,000 bytes.
  - **success:** `postbuild` prints the per-file table and passes on the tree;
    `scripts/size-budget.test.mjs` covers over-budget, missing font, missing dictionary, the
    `src/shell/sw.ts` chunk exclusion (fixture manifest) and the 4 MB file limit.

- **CAP-7** Screenshot pipeline (AD-17 Screenshots, A-A8)
  - **intent:** Screenshot specs run only in `mcr.microsoft.com/playwright:v1.63.0-noble`, locally
    through Docker in WSL2 and in CI, with committed baselines.
  - **success:** `npm run test:screens` generates and then compares the first baseline inside the
    container; the default config never collects `*.screens.spec.ts`.

- **CAP-8** CI (AD-18 CI)
  - **intent:** Every branch push (not tags) and every PR runs the AD-18 pipeline in order and
    publishes the tested `dist/` as an artifact; a newer run on the same ref cancels the older.
  - **success:** `.github/workflows/ci.yml` on Node 24 with `npm ci`: lint → check → unit →
    `build` (size budget) → `dist-smoke` → upload `dist/` → `build:test` → e2e (`android`,
    `desktop`, `pwa`) → screenshot job in the container; passes actionlint; the first pushed run
    is green (owner, gate 4).

- **CAP-9** Deploy (AD-18 Deploy and Rollback) — separate ticket
  - **intent:** A green `ci.yml` run on a push to `main` deploys that run's `dist/` artifact,
    unrebuilt, to Cloudflare Workers static assets with the AD-18 cache headers.
  - **success:** the ticket first confirms `origin` is `github.com/jmb496/wordcell` (ssh or
    https, with or without `.git`) and both secrets exist (verified present on 2026-09-27), and
    halts if the remote differs or a secret is missing; `wrangler deploy --dry-run` succeeds
    locally; after the owner's push the live site returns `immutable` on `/assets/*`, `no-cache`
    on `/`, `/sw.js`, `/manifest.webmanifest` and on the final response of `/index.html`
    (default `html_handling` answers 307 to `/`), and 404 on `/.vite/manifest.json`, on an
    unknown `/assets/` path, `/_headers` and `/.assetsignore`.

## Constraints

- AD-1 checks run in `npm run test:all` and CI; the Vitest scan is the authority, Biome is editor
  feedback only.
- No change to the dealt layout (AD-5, AGENTS.md Policy): epic 1 may move or re-export `deal`
  but not edit `deal.ts`, `buildDeck` or the distribution data.
- One dictionary download (AD-8): never override `dontCacheBustURLsMatching`; nothing under
  `public/` holds a dictionary copy; the stale on-disk `public/dictionary/` is deleted.
- `wrangler.jsonc` sets no `not_found_handling`: unknown paths must 404 (Q-42 needs a 404 on the
  old hashed dictionary URL).
- Deploy uploads the exact `dist/` CI tested; no rebuild in `deploy.yml`, no manual deploy, no
  preview environment and no preview URLs (`wrangler.jsonc` `preview_urls: false`, A-A6).
- Screenshots are generated and compared only in the container; never on the host.
- Unit suite stays under 5 s, including `scripts/*.test.mjs` (inline fixtures, no full-dictionary
  read outside a named repro case).
- Tests are id-named: shell, UI, script and harness tests start with the AD-n they verify
  (AGENTS.md Conventions); none counts as R-id coverage.
- Fail fast (rule 6): a missing input, checksum mismatch, missing budget file or unset
  `PW_PREVIEW` throws; no fallbacks.
- Build skills commit locally and never push (rule 7); CI and deploy proof that needs GitHub is an
  owner step at gate 4.

## Non-goals

- Engine rules, `LangData`, the golden deal test and the command table (epic 2, D2).
- Shell stores, dictionary load states, fatal surface, boot order, test-hook accessors (epic 3).
- Board, gestures, overlays and real UI (epics 4–6); the placeholder board stays a placeholder.
- Service-worker registration, `src/shell/sw.ts`, `swState()`, `precacheComplete()`, the offline
  test, `requestPersistence()` (epic 7).
- `__APP_VERSION__` injection (D7), custom domain, preview deploys, Play Store/TWA.

## Success signal

On a fresh clone, `npm ci && npm run test:all` passes with no manual step; a push to `main`
produces a green CI run whose `dist/` artifact is live on `wordcell.<account>.workers.dev` with
the AD-18 headers, and adding `Date.now()` to an engine source, or a `?url` dictionary over
600,000 gzip bytes, turns `test:all` or `build` red.

## Assumptions

- The AD-1 scan covers `.ts`, `.js` and `.svelte` files (script blocks; the History API,
  `popstate` and `localStorage` checks also run on markup); any code file under `src/`
  outside `engine/`, `shell/`, `ui/`, `main.ts`, `architecture.test.ts` and `*.d.ts` fails it,
  as does any `.mjs`, `.cjs`, `.mts`, `.cts`, `.tsx` or `.jsx` file, and any `.js` or `.svelte`
  file under `src/engine/` (owner, 2026-09-27; ticket 1.1 OQ #1, #5).
- Epic 1's test hook installs an empty frozen `window.__wordcell` only when `DEV` or
  `VITE_TEST_HOOKS=1`; accessors arrive in epics 3 and 7.
- A stub `src/shell/dictionary.svelte.ts` exports the `?url` and `main.ts` imports it so the asset
  is emitted; load states are epic 3.
- `dist-smoke` in epic 1 asserts load, 52 live `card-<id>` elements, no `pageerror` or console
  error, and no `window.__wordcell` (`dist-smoke.spec.ts`), and since ticket 1.10 (2026-09-28)
  also runs the hook-free precache, build-output and font specs against `dist/`.
- pwa-config specs live in `e2e/pwa/`; the default config ignores that folder and
  `*.screens.spec.ts`.
- Fraunces source is the `google/fonts` variable TTF at a pinned commit, downloaded to
  `generated/font/`, not committed.
- Icon SVG sources are drawn from DESIGN.md's App icon description; the owner judges the look at
  gate 4.
- `test:screens` wraps `docker run` of the pinned image; CI's container job calls
  `test:screens:run` directly.
- `deploy.yml` curls the live headers after deploying and serialises deploys with a concurrency
  group.

## Decisions

Owner accepted every proposed default on 2026-09-27. Rationale in `build-notes.md` §Decisions.

| # | Question | Decision |
| --- | --- | --- |
| D1 | `src/App.svelte` value-imports `engine/deal`, which AD-1 forbids once it moves to `src/ui/`. How does the placeholder get its columns? | Epic 1 adds `src/engine/index.ts` exporting `deal` and its types (a subset of AD-2; epic 2 grows it). `main.ts` calls `deal(1)` and passes the columns as a prop; `src/ui/App.svelte` uses `import type` only. |
| D2 | Scaffold deltas list the `types.ts` → `LangData` move and the R-81 penalty change for the first epic, but they touch distribution data (golden test first, AGENTS.md Policy) and implement R-85/R-81. Which epic? | Epic 2, with the golden deal test. Epic 1 leaves `types.ts` untouched. |
| D3 | Where do `scripts/*.mjs` tests live and which runner collects them? | `scripts/<name>.test.mjs` beside the script; Vitest `include` adds `scripts/**/*.test.mjs` (node environment); names start with AD-n; scripts export pure functions and guard their CLI entry. |
| D4 | A screens config with no specs fails ("No tests found"). What does CAP-7 screenshot? | One placeholder-board spec (`android`, `desktop`); epic 4 replaces its baseline. |
| D5 | `playwright.pwa.config.ts` serves two targets (`dist-test/` for `pwa`, `dist/` for `dist-smoke`) but `webServer` is config-global and CI runs `dist-smoke` before `dist-test/` exists. | Env var `PW_PREVIEW=dist\|dist-test` picks the server; the config throws when unset. Scripts: `test:e2e:pwa` sets `dist-test`; new `test:e2e:dist` sets `dist`. |
| D6 | CI and deploy prove themselves only after a push; build skills never push. | Tickets verify locally (actionlint, `wrangler deploy --dry-run`, each step's npm script) and list post-push checks; the owner pushes and runs them at gate 4. |
| D7 | The spine's `__APP_VERSION__` convention has no epic. | Epic 6, with the menu footer that shows it. |
| D8 | AGENTS.md's `TODO(epic 1)` line sits in the managed block (edits via `bmad-project-context`) yet says "drop each item as epic 1 adds it". | Each ticket drops its own items in its diff; after the last ticket one `bmad-project-context` audit removes the line and the resolved scaffold pitfalls. |
