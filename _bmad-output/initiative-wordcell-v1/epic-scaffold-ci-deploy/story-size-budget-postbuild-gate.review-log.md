# Review log — story-size-budget-postbuild-gate.md (docs mode, thorough, max 7)

Pre-loop copy: /tmp/rl/pass0.md

## Pass 1 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 9, minor 4, decision-needed 0  |  Dropped in triage: ~16 duplicates merged
### Applied
- [major] Description/Tests — font and dictionary lookup unspecified; the dictionary is a separate top-level manifest key the entry walk never reaches → identified by manifest source keys; absent key = missing error
- [major] Counted set — traversal (imports, dynamicImports, css, other assets, dedupe) unspecified → rule spelled out with tests
- [major] Counted set — `index.html` is the dist HTML file, not the manifest key (which maps to entry JS) → stated and tested
- [major] Tests — sw.ts exclusion fixture missed the "not otherwise reachable" clause → fixture shape with excluded and shared chunk
- [major] Tests — `computeBudget` contract (sizes shape, return, boundaries, raw vs gzip for 4 MB) → defined; boundary tests 600,000/600,001 and 4,000,000/4,000,001
- [major] Description — glob source and drift with vite.config.ts → exported constant + AD-16 literal test; Never: new dependency, vite.config.ts change
- [major] Description — fail-fast for missing manifest/index.html/counted file/entry (rule 6, SPEC Constraints) → throws + tests
- [major] AC — forced over-budget procedure and revert (git-ignored generated file, staleness check) → prescribed
- [major] Tests — CLI untested, test:all never builds → AD-18 child-process test
- [minor] script conventions (// @ts-check, CLI guard, postbuild entry); table contents; AD-16 naming for 4 MB tests; dictionary figure informational
### Default applied (technical)
- all of the above are technical choices; reviewer defaults taken
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- duplicates across lenses only

## Pass 2 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 4, minor 8, decision-needed 0  |  Dropped in triage: duplicates merged
### Applied
- [major] Forced over-budget build — 150,000 B of random lines gzips to ≈ 90–114 KB, under the ≈ 128 KB headroom → 300,000 B base64 lines; plan records dictionary row > 600,000, repeat if still green
- [major] AD-16 drift test ambiguous → `PRECACHE_GLOB` exported; test builds expected literal from the constant and pins the constant to AD-16
- [major] Glob matching with no dependency unspecified → hand-rolled extension match, dot segments skipped; tests
- [major] CLI throws (missing manifest / index.html) untested → AD-18 CLI cases
- [minor] sw.ts key itself excluded and asserted; dangling import / cycles / two entries / empty manifest; rows sort and POSIX keys; stdout/stderr and CLI assertions; dist arg resolution; reachable-set reading cites build-notes; 1.2 deferred guard closed; dictionary figure variance
### Default applied (technical)
- all of the above
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- duplicates across lenses only

## Pass 3 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 2, minor 9, decision-needed 0  |  Dropped in triage: duplicates merged
### Applied
- [major] Delta checks 1.2 guard bullet contradicted Build choices (missing dictionary file: error vs throw) → split: absent key = missing-dictionary error; absent file = counted-file throw; both tested
- [major] Error strings unspecified → one string per condition; tests assert exact `errors` list
- [minor] throws print no table; chunk key without `file` throws; cycle / key-without-file / dot-dir tests; CLI assertions on counted paths and stderr; paths from import.meta.url; PRECACHE_MAX_BYTES drift check; sw.ts subtree and assets exclusion stated as deliberate reading, recorded for retro spine update; forced-build retry on dictionary row; unit suite < 5 s recorded; gzip only used for counted files
### Default applied (technical)
- all of the above
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- duplicates across lenses only

## Pass 4 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 2, minor 8, decision-needed 0  |  Dropped in triage: duplicates merged
### Applied
- [major] Counted set — pass-3 exclusion of the whole sw.ts subtree (dynamic included) went below AD-18 / build-notes CAP-6 → only the sw.ts dynamic-import chunk and its static-only closure excluded; dynamic imports inside it counted; test added; retro spine note reworded
- [major] Missing dictionary file on disk: CLI throw path untested, 1.2 guard evidence unclear → AD-18 CLI case; evidence = CLI cases, no real-build reproduction
- [minor] errors order; existence check before sw.ts skip; CSS dedup test; 4 MB boundary on uncounted file, extension definition, superset wording; CLI arg validation and process.exitCode; fixture lifecycle and timing measure; AC "missing file" wording; forced-build revert evidence
### Default applied (technical)
- all of the above
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- duplicates across lenses only

## Pass 5 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 4, minor 8, decision-needed 0  |  Dropped in triage: duplicates merged
### Applied
- [major] Counted set traversal order-dependent with one visited set → closures C (entry, sw.ts dynamic edge skipped), X (sw.ts static closure), plus closure of X's dynamic targets; S/D test
- [major] sw.ts reached by a counted chunk's static import is counted — untested → AD-18 test
- [major] CLI usage error untested → two CLI cases
- [major] AD-17 watch re-run < 1 s dropped → plan records watch re-run (polling on drvfs) < 1 s and Duration < 5 s; concurrent async execFile
- [minor] existence/`file` checks in every closure, throw messages name key/path; total = sum rows; combined ordered-errors test; shared CSS in sw.ts fixture; 4 MB CLI path covered via shared stderr path; missing key vs throw reading of SPEC; inline-fixture exception recorded; spine wording bug in handoff
### Default applied (technical)
- all of the above
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- font-key-only detection (no change; head checks from 1.5 cover preload) — noted, no edit

## Pass 6 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 0, minor ~18, decision-needed 0  |  Dropped in triage: duplicates merged
### Applied
- none (zero majors; stopping rule met, minors recorded below for the builder's discretion)
### Minor (not applied)
- Font key present without `file` has no own test (reviewer called it major; reclassified minor: the check is shared with the tested dictionary case)
- X trigger wording could state "compute X whenever any manifest key dynamically imports `src/shell/sw.ts`" (avoids the C↔X circular reading)
- "a chunk imported only by sw.ts is dangling" → "sw.ts statically imports a key absent from the manifest → throws naming it"
- `(vite.config.ts imports nothing new)` is a constraint, not an assertion
- JSDoc manifest typedef with optional fields so malformed fixtures pass `npm run check` (checkJs covers scripts/**/*.mjs)
- Watch re-run polling via a scratch Vitest config (as 1.2), deleted afterwards
- No-entry / two-entry throw messages: state count / name both keys
- Font file absent from `sizes` test symmetric to dictionary
- Walk: skip only top-level `<dist>/.vite/`, regular files only; POSIX keys via `split(sep).join('/')`
- build-notes CAP-6 "reachable only through it" also gets the C/X rewording at the retro; counting S is the conservative choice
- Usage message prefix `usage:`; timing-over action (merge CLI cases, then halt and record)
- Drift test failure message says constant and config change together
- Passing CLI case asserts `.vite/manifest.json` not in stdout; plan notes `npm run build` exercised the default dist path
- Forced build: record en.txt hash before append and after restore
- Spine bug: the plan should surface it to the owner in the handoff (AGENTS.md Policy "stop and report"); technical wording, no player-visible effect
### Decision needed (functionality / UX / gameplay)
- none

## Result — converged after 6 passes
Majors per pass: 9, 4, 2, 2, 4, 0. Technical defaults applied: 21 majors plus about 40 minors, all technical.
