---
title: 'WordCell Serif card-letter font'
type: 'feature'
ticket: '4'
created: '2026-09-28'
status: 'built'
baseline_revision: 'e061d92ea95a2d5635438d9b8da4b064c3684b9a'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/story-wordcell-serif-card-letter-font.md'
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** Card letters render in the system font; DESIGN.md A-D2 and AD-18 Font require a committed, reproducible Fraunces-instance subset ("WordCell Serif") that is precached, preloaded once and used by the card letters.

**Approach:** A uv inline script `scripts/build-font.py` downloads the checksum-pinned Fraunces variable TTF and OFL.txt, instances (wght 600, opsz 48, SOFT 0, WONK 0), subsets to A–Z + `u`, writes `src/ui/assets/wordcell-serif.woff2` and `src/ui/assets/OFL.txt` (both committed); `@font-face` in `src/ui/app.css`, preload in `index.html`, `.card` uses the face; tests prove hash parity, preload = `@font-face` URL, font once, face in use and precache `revision: null`.

## Boundaries & Constraints

**Always:** The story file (in `context`) is the contract: its **Script contract**, **Wiring** and **Tests** bullets are normative word for word (constants format, README bullet shape, cache/`.part` rules, output write order, regexes, test names and assertions). Pinned source (bootstrap done at planning): google/fonts commit `4024282d9b0cffcdb8e3024560862746178d741f` (last commit touching `ofl/fraunces`, 2026-02-27);
`TTF_URL = "https://raw.githubusercontent.com/google/fonts/4024282d9b0cffcdb8e3024560862746178d741f/ofl/fraunces/Fraunces%5BSOFT%2CWONK%2Copsz%2Cwght%5D.ttf"`, `TTF_SHA256 = "177ff6c0f14e5550a3c624247cd1189611d4eb65d000b14944c63d967958abbb"`;
`OFL_URL = "https://raw.githubusercontent.com/google/fonts/4024282d9b0cffcdb8e3024560862746178d741f/ofl/fraunces/OFL.txt"`, `OFL_SHA256 = "bdf4c22802eaf804f998195871c6b8938aac2ac14b2d78a8bd66a6f1eced833b"`; download date 2026-09-28. Header pins: `fonttools==4.66.0`, `brotli==1.2.0`, `exclude-newer = "2026-09-27T00:00:00Z"`, `requires-python = ">=3.12"`. Rule 6 fail-fast; cite ids in tests/comments.

**Never:** Change `src/main.ts` (boot font check is epic 3); touch other `vite.config.ts` deltas, title/`viewport-fit`/`theme-color`; add a `Qu` treatment or change card sizes/layout; run `build-font.py` from any test or CI; edit the AGENTS.md managed block; start dev servers manually; commit (build-auto's own commit step excepted); push.

Script error paths (cache/download mismatch, network error, cmap assertion) follow the story Script contract; they are proven by the story's Plan evidence runs, not tests (A-A5: no test runs `build-font.py`).

</intent-contract>

## Code Map

- `scripts/build-dictionary.mjs` / `.test.mjs` -- ticket 1.2 precedent: README bullet parsing (`- \`enable1.txt\` ` prefix, span to next `^- `, indented `SHA-256:` line) and "committed source matches" test. Reuse the parsing shape; the font test also ends a span at `^#`.
- `data/README.md` -- append `## Font sources` after the enable1 bullet: two bullets (`` - `Fraunces[SOFT,WONK,opsz,wght].ttf` `` and `` - `OFL.txt` ``): licence SIL OFL 1.1, downloaded 2026-09-28 from, raw URL alone on an indented line (no trailing punctuation), last line indented `SHA-256: <hex>`.
- `vite.config.ts` -- only add `build: { assetsInlineLimit: (file) => (file.endsWith('.woff2') ? false : undefined) }`. `workbox.globPatterns` already includes `woff2`. Vitest `include` already covers `scripts/**/*.test.mjs`; `tsconfig.node.json` type-checks `scripts/**/*.mjs` (use `// @ts-check`).
- `index.html` -- add `<link rel="preload" as="font" type="font/woff2" crossorigin href="/src/ui/assets/wordcell-serif.woff2">` in `<head>` only.
- `src/ui/app.css` -- prepend `@font-face` per story Wiring (double quotes; Biome checks this file via `src/**`).
- `src/ui/App.svelte` -- `.card`: `font-family: "WordCell Serif", serif; font-weight: 600` (was 700). Keep `data-testid`/`data-card-id`/`data-place` (AD-14). Heading and `.meta` unchanged.
- `src/architecture.test.ts` -- tree scan skips non-code extensions, so `src/ui/assets/*` is safe; do not edit.
- `e2e/helpers/precache.ts` `readPrecacheManifest(request)` -- reuse; `e2e/pwa/precache.spec.ts` keep AD-8 test unchanged, add the AD-16 font test.
- `e2e/pwa/dist-smoke.spec.ts` -- `path.resolve(import.meta.dirname, '../../dist')` pattern; `readdirSync(..., { recursive: true, withFileTypes: true })`.
- `playwright.pwa.config.ts` -- `pwa` project (Pixel 7, `dist-test` preview on 4173) runs every `e2e/pwa/*.spec.ts` except dist-smoke; new `font.spec.ts` needs no config change.
- `tsconfig.e2e.json` lib is `ES2023, DOM` (no `DOM.Iterable`): in `page.evaluate` iterate `document.fonts` with `forEach`, not `for…of`.
- `.gitattributes` -- currently `data/enable1.txt -text`; add two lines.
- `.gitignore` -- `generated/` already ignored (covers `generated/font/`).

## Tasks & Acceptance

**Execution:**
- [x] `.gitattributes` -- add `src/ui/assets/OFL.txt -text` and `src/ui/assets/*.woff2 binary` -- first, before outputs exist (evidence order).
- [x] `scripts/build-font.py` -- implement the story Script contract with the constants above; repo root via `Path(__file__).resolve().parent.parent`; `urlopen(..., timeout=60)`; instancer `instantiateVariableFont(font, {"wght":600,"opsz":48,"SOFT":0,"WONK":0})`; `Subsetter(Options(name_IDs=[*defaults, 13, 14]))` with `unicodes` A–Z + `u`; assert cmap union; set `flavor="woff2"`, `recalcTimestamp=False`; write both output `.part` siblings then `os.replace` both; print cmap and byte size.
- [x] `data/README.md` -- `## Font sources` section as in Code Map.
- [x] `scripts/build-font.test.mjs` -- two `AD-18 …` Vitest cases per story Tests (hash + URL parity against README bullets; sha256 of committed `src/ui/assets/OFL.txt` = `OFL_SHA256`). Constant regexes exactly as the story gives.
- [x] `src/ui/assets/wordcell-serif.woff2`, `src/ui/assets/OFL.txt` -- generated by the script; staged with `git add`.
- [x] `src/ui/app.css`, `index.html`, `vite.config.ts`, `src/ui/App.svelte` -- wiring per Code Map.
- [x] `e2e/pwa/precache.spec.ts` -- `AD-16 …` font precache test (`/^assets\/wordcell-serif-[^/]+\.woff2$/` once, revision null).
- [x] `e2e/pwa/font.spec.ts` -- `AD-16 …` preload test, `AD-18 …` font-once test, `AD-18 …` face-in-use test, exactly per story Tests (disk tests throw a clear message if `dist-test/` missing).
- [x] Plan `## Implementation Notes` -- all story **Plan evidence** items in order, the woff2 size (flag ≥ 20,000 B), deviations (the `assetsInlineLimit` addition for the spine Scaffold-deltas update; font-once and face-in-use extending the epic Decision's `dist-test/` list), `OFL.txt` has no Reserved Font Name (confirmed at planning: header is the copyright line only), host screenshot path.

**Acceptance Criteria:**
- Given the committed outputs, when `generated/font/` is deleted and `uv run scripts/build-font.py` runs, then it prints "downloaded" and `git diff --exit-code` on both outputs is clean; a second run prints "cache hit" and is clean.
- Given `TTF_SHA256` edited, when the script runs with a cached TTF, then it exits non-zero naming the cached path; with no cache, it exits non-zero leaving no cache or `.part` file; outputs unchanged both times.
- Given `npm run build`, then `find dist -name '*.woff2'` prints one line and no `@font-face` in `dist/assets/*.css` uses a `data:` url.
- Given `npm run test:all`, then lint, check, unit (incl. both `AD-18` parity cases), e2e and `pwa` (incl. `AD-16` preload, `AD-16` precache, `AD-18` font once, `AD-18` face in use) pass; `npm run build && npm run test:e2e:dist` passes.

## Implementation Notes

Plan evidence, in story order (run 2026-09-28, uv 0.10.1, Python 3.13.12 via uv, fonttools 4.66.0, brotli 1.2.0):

1. Bootstrap `sha256sum` of the pinned raw URLs (curl to a scratch dir):
   `177ff6c0f14e5550a3c624247cd1189611d4eb65d000b14944c63d967958abbb  Fraunces[SOFT,WONK,opsz,wght].ttf`,
   `bdf4c22802eaf804f998195871c6b8938aac2ac14b2d78a8bd66a6f1eced833b  OFL.txt` (both equal the pinned constants).
2. `.gitattributes` written first (`src/ui/assets/OFL.txt -text`, `src/ui/assets/*.woff2 binary`), before `src/ui/assets/` existed.
3. First `uv run scripts/build-font.py`: "downloaded" ×2, exit 0, outputs generated.
4. `git add .gitattributes scripts/build-font.py src/ui/assets/wordcell-serif.woff2 src/ui/assets/OFL.txt`; `git ls-files --stage`:
   `100644 22fa7ce5733434d0c634f6e55116f410858e938c 0 src/ui/assets/OFL.txt`,
   `100644 b2d865933dd9246df1d1dd1362c30bc3d1a99551 0 src/ui/assets/wordcell-serif.woff2`.
5. `generated/font/` deleted, rerun: "downloaded" ×2, exit 0; `git diff --exit-code` on both outputs → 0.
6. Cache rerun: "cache hit" ×2, exit 0; `git diff --exit-code` → 0.
7. Cache mismatch (`TTF_SHA256` edited, then `git checkout -- scripts/build-font.py`): exit 1,
   `build-font: cached /mnt/d/CodeProjects/wordcell/generated/font/Fraunces[SOFT,WONK,opsz,wght].ttf has SHA-256 177ff6…abbb, expected 077ff6…abbb; delete … and run again`; `git diff --exit-code` → 0.
8. Download mismatch (`generated/font/` deleted, `TTF_SHA256` edited, restored the same way): exit 1 naming the URL and cache path; `generated/font/` empty (no cache file, no `.part`), `src/ui/assets/` holds only the two outputs; `git diff --exit-code` → 0.
9. `git status --porcelain`: `M  .gitattributes`, `A  scripts/build-font.py`, `A  src/ui/assets/OFL.txt`, `A  src/ui/assets/wordcell-serif.woff2` (no unstaged changes).
10. Printed sorted cmap: `U+0041 … U+005A U+0075` (27 code points, A–Z and u). woff2 size: **4,284 bytes** (under 20,000; no deviation). Note it is just above Vite's 4,096-byte inline default, so the `assetsInlineLimit` guard is load-bearing on any future glyph change.
11. `npm run build`: `find dist -name '*.woff2'` → one line (`dist/assets/wordcell-serif-C6H6CwWY.woff2`); `grep -c 'data:' dist/assets/*.css` → 0. Built CSS: `@font-face{font-family:WordCell Serif;src:url(/assets/wordcell-serif-C6H6CwWY.woff2)format("woff2");font-weight:600;font-style:normal;font-display:block}`; built preload href `/assets/wordcell-serif-C6H6CwWY.woff2`.
12. `npm run test:e2e:dist`: 2 passed.
13. `npm run test:all`: pass (unit 268 incl. both `AD-18` parity cases; e2e 27; pwa 6 incl. `AD-16` preload, `AD-16` precache, `AD-18` font once, `AD-18` face in use).
14. Host screenshot (scratch Playwright spec under the pwa config, deleted after the run; Pixel 7, `dist-test`): `/tmp/wordcell-serif-cards.png` — card letters in the Fraunces serif, heading and meta in the system font.

`OFL.txt`: no Reserved Font Name declared (header is the copyright line only; the only "Reserved Font Name" mentions are the licence's definitions).

Deviations:
- `vite.config.ts` `build.assetsInlineLimit` (woff2 never inlined) is an addition beyond the spine Scaffold deltas; record it in the spine Scaffold-deltas update at the epic retrospective.
- The `AD-18` font-once and face-in-use tests run against `dist-test/`, extending the epic Decision's `dist-test/` list (`VITE_TEST_HOOKS` changes only JS).
- The script re-verifies cached hashes right before building (after downloads); harmless extra check within the Script contract.

## Plan Change Log

## Review Triage Log

### 2026-09-28 — Review pass
- verdicts: 18 findings — high 0, medium 0, low 6, false 12, maybe-false 0
- findings:
  - `false` `reject` (blind) `src/ui/assets/OFL.txt` absent from the review diff — the diff excluded the verbatim licence on purpose; the committed file is byte-identical to the pinned download (`cmp`) and the `AD-18` case checks its SHA-256; it declares no Reserved Font Name.
  - `low` `reject` (blind) no recorded hash/test for the committed woff2 — git already records the blob and any rerun shows as a diff; the story assigns the output check to plan evidence (A-A5); a new constant and test adds surface.
  - `false` `reject` (blind) uv/Python versions not durably recorded — they are in this plan's Implementation Notes, which is committed with the change (the story's "recorded" versions).
  - `false` `reject` (blind) double download not counted at runtime — AD-17 says not to count requests under preview; the story prescribes the `crossorigin` attribute check.
  - `false` `reject` (blind) face-in-use test triggers its own load — the story prescribes exactly AD-15's query; computed `font-family`/`font-weight` prove the card uses the face; rendering evidence is the screenshot.
  - `false` `reject` (blind) `data:` scan limited to CSS — Vite emits CSS `url()` assets to `.css` files in build; the same test asserts exactly one `.woff2` in all of `dist-test/`.
  - `low` `reject` (blind) only heading and `.meta` checked for not using the face — the story names these two; the placeholder has no other text; fix widens the test beyond the contract.
  - `low` `reject` (blind) HTTP errors surface as raw tracebacks — exit is still non-zero naming the URL (`HTTPError`/`URLError` message), which the Script contract requires; wrapping adds branches.
  - `false` `reject` (blind) stale `.part` reused — `.part` is opened `wb` (truncating) and deleted in `finally`, as the Script contract requires.
  - `low` `reject` (blind) parity test does not assert TTF and OFL URLs share one commit — both constants and bullets are asserted pairwise; editing one pair to another commit is unlikely and the fix adds a new assertion.
  - `false` `reject` (blind) `assetsInlineLimit` not flagged for the spine — Implementation Notes Deviations records it for the spine Scaffold-deltas update at the retrospective.
  - `low` `reject` (edge) second `os.replace` failing after the first leaves mixed outputs — the Script contract prescribes this exact order; a same-directory rename failing between two renames is very unlikely and restore logic adds complexity.
  - `low` `patch` (edge) docstring claims every error exits before either output is written — reworded to cover only source hash mismatch, download error and cmap assertion (implementation subagent); `build-font.test.mjs` green, full verification re-run green.
  - `false` `reject` (intent) byte-for-byte reproduction evidence-only — the story assigns it to plan evidence (A-A5: the script is not run by tests or CI).
  - `false` `reject` (intent) A–Z+u checked in memory, not on the committed file — story: in-script assertion, printed cmap and byte-for-byte `git diff` are the proof.
  - `false` `reject` (intent) tests read `dist-test/`, not `dist/` — epic Decision (2026-09-27); `dist/` checked by the manual `find`/grep and `dist-smoke`.
  - `false` `reject` (intent) runtime single fetch untested — same as the blind finding: AD-17 forbids request counts under preview.
  - `false` `reject` (intent) dev-app rendering untested — the story says no android/dev-server copy is required.

## Design Notes

Why `assetsInlineLimit`: a 27-glyph subset may fall under Vite's 4096-byte inline default and become a `data:` URL, breaking "font once" and the preload. Why `crossorigin` on the preload: font fetches are CORS-mode; without it the preload is not reused and the font downloads twice. Face-in-use reads `FontFace.family` with quotes stripped (Chromium may return it quoted).

## Verification

**Commands:** (confirm ports 5173 and 4173 free with `ss -ltn` before Playwright runs)
- `uv run scripts/build-font.py` -- expected: exit 0, cmap `[0x41..0x5A, 0x75]`, size printed
- `npm run build && find dist -name '*.woff2' | wc -l` -- expected: `1`
- `npm run test:e2e:dist` -- expected: pass
- `npm run test:all` -- expected: pass

**Manual checks:**
- Host screenshot (Playwright script or `page.screenshot` in a scratch run, not committed) of the placeholder cards in the new face; path recorded in Implementation Notes.

## Auto Run Result

- **Summary:** WordCell Serif (Fraunces instance wght 600/opsz 48/SOFT 0/WONK 0, A–Z + `u`, 4,284-byte woff2) built reproducibly by `scripts/build-font.py` from google/fonts `4024282d9b0cffcdb8e3024560862746178d741f`, committed with `OFL.txt`, declared in `app.css`, preloaded in `index.html`, used by the placeholder `.card` letters, precached with `revision: null`.
- **Files:** `scripts/build-font.py` (uv font builder); `scripts/build-font.test.mjs` (AD-18 hash/URL parity, OFL hash); `src/ui/assets/wordcell-serif.woff2`, `src/ui/assets/OFL.txt` (generated outputs); `data/README.md` (Font sources); `.gitattributes` (binary/-text); `src/ui/app.css` (`@font-face`); `index.html` (preload); `vite.config.ts` (`assetsInlineLimit` for woff2); `src/ui/App.svelte` (`.card` face, weight 600); `e2e/pwa/precache.spec.ts` (AD-16 font precache); `e2e/pwa/font.spec.ts` (AD-16 preload, AD-18 font once, AD-18 face in use).
- **Review:** 18 findings; 1 patch (low, docstring wording); 0 deferred; 17 rejected (reasons in the triage log).
- **Follow-up review recommended:** false (patched: high 0, medium 0, low 1).
- **Verification:** `uv run scripts/build-font.py` cache hit + `git diff --exit-code` on both outputs clean; `npm run build` → one `.woff2`, preload href = `@font-face` URL, no `data:`; `npm run test:e2e:dist` 2 passed; `npm run test:all` exit 0 (268 unit, 27 e2e, 6 pwa) after the patch; ports 5173/4173 free before each Playwright run.
- **Residual risks:** the woff2 (4,284 B) is just above Vite's 4,096 B inline default, so `assetsInlineLimit` is load-bearing; `assetsInlineLimit` needs adding to the spine Scaffold deltas at the retrospective; host screenshot `/tmp/wordcell-serif-cards.png` is not committed.
