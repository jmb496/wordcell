# Review log — story-wordcell-serif-card-letter-font.md

Mode: docs, depth thorough, max 7. Pre-loop copy: /tmp/rl/review-loop/font.pass0.md

## Pass 1 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 6, minor 7, decision-needed 0  |  Dropped in triage: ~20 duplicates across lenses
### Applied
- [major] AC byte-for-byte — fontTools timestamps and unpinned tools make reruns differ → recalcTimestamp=False, == pins, requires-python; git diff --exit-code evidence
- [major] Script contract missing (build-notes CAP-4, AD-18, SPEC fail-fast) → Script contract block (source, cache, hash constant = README line, mismatch exits non-zero, instance axes)
- [major] "font once" untested; Vite may inline a small woff2 → assetsInlineLimit never inlines .woff2; AD-16 font-once test
- [major] Preload attributes (as/type/crossorigin) missing → element stated; AD-16 test asserts attributes and href equality
- [major] @font-face descriptors unspecified (weight 600) → full descriptor list
- [major] No element uses the face → placeholder .card letters use 'WordCell Serif' 600 (DESIGN.md card-letter)
- [minor] cmap definition, OFL.txt path + name IDs 13/14, precache test shape and regex, dist-test sentence, Notes wording, plan screenshot evidence, AGENTS.md uv gap noted for D8
### Default applied (technical)
- vite.config.ts — woff2 inlining → assetsInlineLimit function returning false for .woff2
- build-font.py — expected-hash source → script constant equal to data/README.md line (ticket 1.2 format)
- build-font.py — cache → reuse only on hash match
- tests — font precache test name → keep ticket's AD-16, new test beside AD-8
- App.svelte — face use → placeholder card letters per DESIGN.md card-letter
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- duplicates across the four lenses (merged into the items above)

## Pass 2 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 6, minor 8, decision-needed 0  |  Dropped in triage: duplicates across lenses
### Applied
- [major] Script contract — recalcTimestamp is a TTFont option, not a save() arg → set on the TTFont objects before save
- [major] Preload test — literal CSS match breaks on minified output → isolate @font-face, quote/whitespace-insensitive regexes
- [major] Tests — "the built CSS" unlocatable (no build.manifest yet) → via index.html stylesheet links; paths from repo root
- [major] OFL.txt — production/verification unspecified → script downloads, second hash constant + README bullet, write only after all checks
- [major] Wiring — AD-15 citation invited boot font check → explicitly out of scope, main.ts unchanged
- [major] Tests — no check the cards render in the face → AD-16 face-in-use test (fonts.check, computed family/weight 600)
- [minor] assetsInlineLimit exact function + labelled addition beyond Scaffold deltas; crossorigin anonymous; upright TTF filename + percent-encoding; name IDs default+13,14; plan evidence (mismatch method, cache rerun, constant=README grep, byte size); QU placeholder note; tray word line note; Verify line; delta-check bullet relabelled
### Default applied (technical)
- OFL.txt → fetched and hash-checked by the script
- CSS lookup → via stylesheet links in dist-test/index.html
- assetsInlineLimit → (file) => file.endsWith('.woff2') ? false : undefined
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- duplicates across lenses

## Pass 3 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 3, minor 13, decision-needed 0  |  Dropped in triage: 1 + duplicates
### Applied
- [major] Tests, Face in use — fonts.check can pass without a load; computed family is quoted → AD-15 fonts.load length 1, FontFace status loaded, first family quotes-stripped
- [major] Wiring — "dist-smoke still passes" unverified (not in test:all) → build + test:e2e:dist in plan evidence
- [major] Script contract — cached hash mismatch silently re-downloaded (SPEC fail-fast, rule 6) → exit non-zero; temp-file download renamed only on match
- [minor] fresh-download + cache-hit reproduction evidence; requires-python >=3.12; repo-root paths; .gitattributes for OFL.txt/woff2; e2e/pwa/font.spec.ts with import.meta.dirname; data: URL definition; order-independent link parsing; AD-17 font-half note; size flag ≥ 20,480 B; OFL Reserved Font Name check; assetsInlineLimit recorded as spine addition; References AD-15/AD-17; Notes wording
### Default applied (technical)
- cache mismatch → fail fast, user deletes cache
- test file → e2e/pwa/font.spec.ts; dist-test path via import.meta.dirname (dist-smoke convention)
- .gitattributes → OFL.txt -text, *.woff2 binary
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Build precondition vs uncommitted ticket edits — orchestration concern (autopilot commits the hardened ticket), not a ticket defect

## Pass 4 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 1, minor 12, decision-needed 0  |  Dropped in triage: duplicates
### Applied
- [major] Plan evidence — git diff --exit-code vacuous on the new (untracked) outputs; git checkout fails on untracked script → stage outputs after first run, then fresh/cache/mismatch runs diff against the index
- [minor] download bullet (.part temp file, 60 s timeout, "before either output"); download-mismatch evidence run; recursive single-woff2 check; CSS snippets in double quotes (Biome CSS formatter); AD-18 hash-parity Vitest test (scripts/build-font.test.mjs); data/README.md "Font sources" format, plural URLs/SHA-256s; OFL.txt binary write; heading not in the face; assetsInlineLimit rationale + listed as deviation; test:all and dist/ evidence; font-once extends the epic Decision list; index.html preload-only scope; boot font check → epic 3
- [minor, reclassified from major] Biome quotes (builder would hit lint immediately); hash-parity test (plan evidence existed)
### Default applied (technical)
- hash parity → Vitest test reading script constants vs data/README.md (ticket 1.2 precedent)
- temp file → generated/font/<name>.part; timeout 60 s
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- duplicates across lenses

## Pass 5 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 2, minor 11, decision-needed 0  |  Dropped in triage: duplicates
### Applied
- [major] Plan evidence vs cache rule — download-mismatch run's "no cache file left" contradicted "verified file may stay" with unfixed order → TTF downloads first; run edits TTF_SHA256
- [major] Hash parity test — constant names / bullet prefixes unspecified → TTF_URL/TTF_SHA256/OFL_URL/OFL_SHA256, fixed bullet prefixes, URL parity too; plus committed OFL.txt hash case
- [minor] font.flavor/recalcTimestamp attributes; hash bootstrap via sha256sum; cache file names, .part wb, socket timeout; atomic output writes; .gitattributes before first git add, re-stage script; face-in-use wording + .meta check + Decision-list note; size flag 20,000 B (A-A4); Verify line quote-free; dist/ evidence via find + data: grep; AD-16 name rationale; References AD-14 (+AD-1, AD-3 by Binds)
### Default applied (technical)
- constant names TTF_URL/TTF_SHA256/OFL_URL/OFL_SHA256; download order TTF then OFL.txt; size flag in decimal KB
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- duplicates across lenses

## Pass 6 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 1, minor 13, decision-needed 0  |  Dropped in triage: duplicates
### Applied
- [major] Hash parity — URL extraction from the README bullet unspecified (1.2 shape wraps the URL and ends it with '.') → URL alone on its own indented line, fixed regexes for bullet and Python constants, span ends at ^- or ^#
- [minor] cache verify-then-download order; mkdir of output dirs; both output .part then both os.replace, cleanup; cmap union over Unicode subtables; other fontTools options at defaults; evidence names files and TTF_SHA256; "WordCell Serif" quotes; cmap coverage proven by plan evidence; .meta locator, single status read, no android copy; Biome checks app.css only; exclude-newer; font-once/face-in-use named AD-18; README check met via constants + parity test; assetsInlineLimit under technical delegation
### Default applied (technical)
- README URL line format; test ids AD-16 (preload, precache) / AD-18 (font once, face in use); exclude-newer = pin date
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- duplicates across lenses

## Pass 7 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 0, minor 20, decision-needed 0  |  Dropped in triage: 1 + duplicates
Stopping rule met (zero major); per the skill no fixer ran this pass. The open minors below are left for the builder or a later touch-up:
### Open minors (not applied)
- uv header — "pin date" for exclude-newer undefined → default: RFC 3339 UTC timestamp on the bootstrap day, not earlier than the pinned fonttools/brotli releases
- Source/Hash parity — no automated check that TTF_URL/OFL_URL name a 40-hex google/fonts commit and the upright TTF (reviewer said major; reclassified minor: the rule is stated plainly, the URL is written once and seen in plan evidence and code review, the same verification level the ticket accepts for cmap coverage) → optional regex case in the AD-18 parity test
- Hash parity — "same parsing as 1.2" vs the ticket's own ^-/^# span rule → the new test uses this ticket's span rule; build-dictionary.test.mjs unchanged
- subset input → Subsetter(options).populate(unicodes=[*range(0x41,0x5B),0x75])
- OFL bullet "downloaded bytes on every run" → written on every run from the verified cached bytes
- Face in use — card and heading locators (card-0, heading role 'WordCell'); read status after fonts.ready before the explicit load; assert style 'normal'
- Preload — rel as a token list; href → path.join(distTest, pathname)
- Output .part naming and wb mode; printed status/cmap/size line formats
- Description omits vite.config.ts, .gitattributes, scripts/build-font.test.mjs
- requires-python range vs reproducibility → record the exact interpreter or pin ==3.12.*
- 60 s socket timeout is per read, not a wall-clock cap (wording only)
- optional WOFF2_SHA256 committed-woff2 check
- e2e/helpers/precache.ts comment cites only AD-8 → add AD-16
- tickets.toml entry 4 description/verify narrower than the hardened ticket → sync from the .md
### Dropped
- Build precondition vs uncommitted ticket edits — orchestration (autopilot commits the hardened ticket), not a ticket defect

## Result — converged after 7 passes
Majors per pass: 6, 6, 3, 1, 2, 1, 0. Decision-needed: none.
