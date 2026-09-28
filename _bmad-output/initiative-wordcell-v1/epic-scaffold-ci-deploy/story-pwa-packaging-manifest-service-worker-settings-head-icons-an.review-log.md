# Review log — story-pwa-packaging-manifest-service-worker-settings-head-icons-an.md (ticket 1.5)

Mode: docs, thorough, max 7. Pre-loop copy: /tmp/rl/review-loop/1.5.pass0.md

## Pass 1 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 8, minor 7, decision-needed 1  |  Dropped in triage: ~10 duplicates, 1 disproved
### Applied
- [major] Manifest bullet — A-D5-only deep-equal cannot pass (plugin adds start_url/scope/lang); icons unspecified → exact expected object, whole-file toEqual
- [major] globPatterns bullet — precache check vague; glob literal missing → AD-16 literal; URL set == matching dist-test files; duplicate public entries allowed with identical revision
- [major] registerType bullet — 'no SW registration script' not checkable → string scan of index.html + assets/*.js, manifest link once
- [major] Verify line — ambiguous '.vite/manifest.json' → rewritten
- [major] Styles bullet — palette untested, scope open, body background on :root → every DESIGN colors key as --wc-<key>, e2e token read, literals to tokens, html/body background
- [major] Icons bullet — build-icons contract missing (sources, font, DPR, rerun) → defaults
- [major] Tests — icon pixel sizes untested → IHDR case
- [major] Verify — dist-smoke (console-error halt) not in test:all → build + test:e2e:dist required in Verify
- [minor] spec file names / projects; 4_000_000; overflowX/Y not hidden/clip; head literals; light-scheme check; Never line; maskable safe-zone circle
### Default applied (technical)
- purpose 'any' explicit; scripts/icons/icon.svg + icon-maskable.svg; W from committed woff2 via @font-face; deviceScaleFactor 1; new e2e/pwa/build-output.spec.ts and e2e/app-shell.spec.ts in both projects
### Decision needed (functionality / UX / gameplay)
- Icons bullet — browser tab/bookmark icon is still the Vite logo; should it become the W card art? — proposed default: yes, build-icons writes favicon.svg as a simplified W card, judged at gate 4
### Dropped
- sw.js 'no skipWaiting' assertion — generateSW keeps a SKIP_WAITING message handler that calls skipWaiting, so the check would be wrong

## Pass 2 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 4, minor 9, decision-needed 0  |  Dropped in triage: ~12 duplicates, 1 (link-tag parser refactor, not needed)
### Applied
- [major] Styles bullet — literal→token mapping ambiguous (scaffold colours swapped by role) → role mapping; placeholder cards dark face / ivory ink per DESIGN.md; tokens in src/ui/app.css
- [major] Icons bullet — fonts.ready resolves on failed load; file:// font may be blocked → data: URL @font-face in setContent page, fonts.load + fonts.check throw
- [major] Icons bullet vs Verify — contradictory byte-stability outcome → unstable rerun is a Halt
- [major] Tests — missing-source throw untested; SPEC D3 not applied → scripts/build-icons.test.mjs, pure exports, CLI guard
- [minor] card-0/html/color-scheme assertions; height 100% kept; SVG viewBox and zero-margin page, mkdir; PNG signature/IHDR check; file-walk definition; dist/ command evidence; epic-7 comment; built head asserted; maskable card-in-circle
### Default applied (technical)
- Chromium from @playwright/test; in-page code passed as strings (tsconfig.node.json has no DOM lib); Halt on non-reproducible PNGs
### Decision needed (functionality / UX / gameplay)
- none new
### Dropped
- shared linkTags helper for the manifest link — the literal check is sufficient

## Pass 3 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 3, minor 12, decision-needed 0  |  Dropped in triage: ~6 duplicates
### Applied
- [major] registerType bullet — nothing distinguishes 'prompt' from 'autoUpdate' → config diff quoted in the plan + sw.js has no 'clientsClaim' (checked: the current autoUpdate dist/sw.js contains it)
- [major] Icons — undefined exports; a top-level @playwright/test import would load the runner into Vitest → ICONS + readSources(sourceDir), dynamic import after the source check
- [major] Icons font guard — fonts.check true for an unknown family → load() returns one face with status 'loaded'
- [minor] built-head case named, exact viewport, favicon link; shared e2e/helpers/dist-test.ts; wrapper CSS, literal hex, W text font, import.meta.dirname; SVG source test; icons dir exactly three; git add + porcelain procedure, Playwright version recorded; trim compare + body color; echo PASS; circle note; revision comment; no devOptions
### Default applied (technical)
- ICONS/readSources API; shared dist-test helper; sw.js clientsClaim discriminator
### Decision needed
- none new

## Pass 4 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 3, minor 9, decision-needed 0  |  Dropped in triage: ~8 duplicates, 1 (runtime getRegistrations check; string scans suffice)
### Applied
- [major] Icons 'regenerates' — porcelain after git add lists new files, so a correct build would Halt → git diff --exit-code against the index
- [major] SVG colour test — hex-only scan misses named colours and gradients, and matches #id → colour-bearing attributes, case-insensitive, no gradients/filters
- [major] Icon colours — card-edge missing though DESIGN.md gives every card a 1 px edge → six allowed tokens
- [minor] ICONS basenames / readSources Map / woff2 pre-check; staleness explicitly unguarded (A-A7); overflow == visible, overscroll X/Y; 18-key token list; single background rule, card-ink diff quoted; manifest link parsed once, linkTags shared; revision-mismatch Halt; dist-smoke no allow-list + Halt; flourish on card; plan embeds all three PNGs
### Default applied (technical)
- git diff --exit-code procedure; shared linkTags helper
### Decision needed
- none new

## Pass 5 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 3, minor 8, decision-needed 0  |  Dropped in triage: ~6 duplicates, 1 (gate-4 blocking rule: process belongs to methodology/autopilot, not the ticket)
### Applied
- [major] Icons — no full-bleed opaque field; wrapper background unset → full-viewBox table rect first, wrapper background #15171B, test
- [major] Icons — W text font-family untested → <text>/<tspan> font-family exactly 'WordCell Serif', weight 600, subset chars test
- [major] Colour case — implicit black fill and <style> bypass → explicit fill per element, no <style>/class/opacity<1
- [minor] backgroundColor property + light-emulation repeats; tag-attribute parser for meta; duplicates only for public files + named members; .vite/manifest case named AD-18; assetsInlineLimit kept; ICONS-order check, no package.json script; manifest 'exactly' reading recorded; app.css :root diff quoted
### Default applied (technical)
- full-bleed rect; tags(html, name) helper; AD-18 test id for build.manifest
### Decision needed
- none new

## Pass 6 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 3, minor 8, decision-needed 0  |  Dropped in triage: ~7 duplicates
### Applied
- [major] Tests — script tests read committed SVGs against the build-notes inline-fixture rule → explicit exception (1.4 OFL.txt precedent), recorded in the plan
- [major] registerType bullet — clientsClaim does not distinguish prompt/autoUpdate when injectRegister is false (pass 3 claim was wrong) → reworded; the config diff is the only proof of 'prompt'
- [major] Styles — Playwright's default scheme is already light → assertions run under both dark and light emulation
- [minor] SVG source rules consolidated (viewBox 0 0 N N, first-shape definition, no defs/clipPath/mask/use/symbol, no rx/ry/transform); font-family/text normalisation; three readSources cases; dist-test helper exports; dev head same as built; height proof by diff, scroll note, .meta unchanged; plan-relative image links, flourish clause; no beforeinstallprompt
### Default applied (technical)
- test-fixture exception; both-scheme loop
### Decision needed
- none new

## Pass 7 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 2, minor 9, decision-needed 0  |  Dropped in triage: ~8 duplicates, 2 (runtime getRegistrations check; card-ink/ink-primary guard deferred)
### Applied
- [major] Head, dev case — 'same assertions as built' included the manifest link, which the plugin injects only at build → title/theme-color/viewport only, plus zero manifest link and zero vite-plugin-pwa script in dev
- [major] Icons — missing-woff2 throw untested → pure readFont(fontPath) + Vitest case; in-page font status proven by the run log
- [minor] SVG property-reading rule stated once; (e) element allow-list, no href; text equals `W`; tokenizer; title scan; at-most-twice duplicates, dot-segment exclusion comment; .vite/manifest.json isEntry check; version sources, PNGs staged for the commit; wrapper background as hygiene, not a fallback; flourish placement as the builder's reading; SPEC.md Constraints cited for the fixture rule; 18-token v1-limit comment
### Default applied (technical)
- readFont export; SVG element allow-list; tokenizer approach
### Decision needed
- none new

## Result — capped at 7 passes
Majors per pass: 8, 4, 3, 3, 3, 3, 2 (pass 7 fixes applied; no pass 8 review by cap). Majors in passes 5–7 were progressively finer test-spec precision (SVG validation rules, dev-vs-build head, font proof), not the same defect persisting. Open for the owner: the favicon question (Notes table, PROPOSED BY REVIEW).

## Owner answer — 2026-09-28
Jared answered the favicon question (Notes open-questions row 2, PROPOSED BY REVIEW): yes. `scripts/build-icons.mjs` also writes `public/favicon.svg`, a simplified `W` card on the table colour, judged with the other icons at gate 4. Changes: Description and Verify name the favicon; the `public/icons/` delta bullet adds the committed source `scripts/icons/favicon.svg` copied byte-for-byte to `public/favicon.svg`, rules (a)–(e) with a no-text rule in place of (f) (an SVG favicon loads no web font, so the `W` is drawn as shapes), a `FAVICON` export, `readSources` covering it, and the regenerate check, header comment and commit list extended to `public/favicon.svg`; `includeAssets: ['favicon.svg']` kept; Tests add the `FAVICON`, missing-favicon, favicon source-rule and committed-copy byte-equality cases (the existing built-head favicon link and precache `favicon.svg` checks stay); Owner checks at gate 4 judge the favicon with the icons and the plan embeds it; the answered row is removed from the Notes table.
