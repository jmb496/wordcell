# Review log: story-dictionary-generation-and-url-wiring.md (ticket 1.2)

Mode: docs, depth thorough, max 7. Refs: epic-1 SPEC.md, build-notes.md, delta-checks.md, epic
file, ticket 1.1 plan (story-layer-layout-and-ad-1-purity-checks-plan.md), ARCHITECTURE-SPINE.md,
AGENTS.md, CLAUDE.md, docs/game-flow-spec.md, docs/requirements-carryover.md. Pre-loop state:
HEAD 45cd6c4.

## Pass 1 — 2026-09-27
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 7, minor 6, decision-needed 0  |  Dropped in triage: duplicates merged (~30 raw → 13)
### Applied
- [major] Description/hooks — CLI interface undefined → default mode staleness-gated for all pre* hooks, always checksum; `--force`; `build:dictionary` = `--force`.
- [major] Checksum-mismatch check unexercisable → pure `verifySource` + AD-8 flipped-byte test; CLI `--source` for plan evidence on a temp copy; never mutate data/enable1.txt.
- [major] Filter normalisation ambiguous → split on `\n`, keep only exact `^[a-z]{3,23}$`; fixtures for uppercase, padded, CR, empty.
- [major] tsconfig.node.json lacks allowJs → `allowJs`+`checkJs`, include `scripts/**/*.mjs`; scratch type error evidence.
- [major] main.ts import form → side-effect import (unused named import is tree-shaken, reviewer-verified); stub exports `dictionaryUrl`, no fetch/state/Set; halt if no asset.
- [major] Notes open question on drvfs mtime → `isStale` semantics (null = stale, tie = fresh, missing input throws); prove on /mnt/d; halt if unreliable.
- [major] Checks not classified → each labelled unit test vs plan evidence; `timeout 15 npm run dev`.
- [minor] Atomic write via tmp + rename.
- [minor] README hash test asserts containment of `EXPECTED_SHA256`; committed-source hash test.
- [minor] README replaces 3–10 sentence; "99 two-letter words" corrected to 96 (verified: `awk 'length<3'` = 96).
- [minor] `.gitattributes` `data/enable1.txt -text`.
- [minor] Dist-asset regression guard carried by CAP-6 budget and entry 3 pwa check.
- [minor] AGENTS.md stale pitfall/rule-5 text left for the D8 audit, listed in handoff.
### Default applied (technical)
- All 13 items above are technical defaults (no functionality/UX/gameplay effect).
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Duplicates across lenses merged; no finding disproved.

## Pass 2 — 2026-09-27
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 4, minor 6, decision-needed 0  |  Dropped in triage: 3 (+ duplicates)
### Applied
- [major] Exports bullet — missing `filterWords`, `sha256` and the CLI-entry guard (build-notes CAP-2, SPEC D3) → union export list; CLI guarded by `process.argv[1] === fileURLToPath(import.meta.url)`.
- [major] CLI paragraph — `--force` checksum unclear; staleness inputs, path resolution and bad args unspecified → every mode verifies first; inputs = chosen source + script; unknown/empty args throw; `build:dictionary` "becomes" `--force`.
- [major] "missing input throws" attached to numeric `isStale` → plain `statSync` in CLI throws; `isStale` throws on empty inputs; evidence with a nonexistent `--source`.
- [major] Hook evidence could not prove each hook (webServer's `predev` masks `pretest:e2e`; no `pretest:watch` evidence) → separate `rm -rf generated && <cmd>` per hook; `timeout --foreground -s INT`; port 5173 freed.
- [minor] Empty filter output is `""`.
- [minor] `.gitattributes` evidence (`git check-attr`), CRLF re-checkout note.
- [minor] Build row evidence: `rm -rf generated dist && npm run build`, dist asset 172,713 lines.
- [minor] README: BGA sentence reworded (99 fewer words; 96 two-letter), hash test anchored to the enable1 `SHA-256:` line.
- [minor] No R-37 coverage claimed; AD-8 script tests are never R-id coverage.
- [minor] Stub rationale marked as verified.
### Default applied (technical)
- All items above are technical defaults.
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Adversarial: "an unused named import also emits the asset" — disproved. Orchestrator scratch builds on Vite 8.3.1 with a 20 KB file: an unused named import of a pure `?url` stub emits no `en-*.txt`, a side-effect import emits it. (An 8-byte file is inlined as a data URL, which confounds small tests.)
- Edge-case: "record the stub rationale as an assumption" — superseded by the verification above.
- Adversarial: stale AGENTS.md pitfall handoff note — already in the ticket (listed in the plan's handoff).

## Pass 3 — 2026-09-27
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 5, minor 8, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
### Applied
- [major] Filter bullet vs fixture — zero matches gave `"\n"` vs fixture `""` → `""` when nothing matches; no-final-LF fixture added.
- [major] README `SHA-256:` line format and bullet span unpinned (CAP-4 adds a second) → literal indented `SHA-256: <hex>` line, span rule, exactly-one match.
- [major] Output/tmp path resolution unspecified → script-relative, `mkdirSync` recursive, per-pid tmp + rename.
- [major] `isStale` max-of-inputs untested → two-input cases in both orders, tie with larger input; empty-inputs throw checked first.
- [major] CLI arg throws and "output untouched on mismatch" unchecked → pure `parseArgs` with AD-8 throw cases; evidence that mtime/hash unchanged and no tmp left.
- [minor] CLI order parse → verify → stale → write.
- [minor] Output stat uses `throwIfNoEntry: false` (specified state); inputs plain `statSync`.
- [minor] `sha256` lowercase hex, exact compare.
- [minor] CLI guard via `realpathSync(process.argv[1])`.
- [minor] `.gitattributes` recovery `rm` + checkout.
- [minor] tsconfig include covers the test file; `checkJs` authoritative; 5 s duration evidence.
- [minor] `pretest:watch` banner evidence; per-hook sequence replaces the literal delta row check.
- [minor] Handoff: R-37 build-filter clause to an epic 2/3 `R-37` repro case; `build:test` TODO item covers `prebuild:test`.
### Default applied (technical)
- All items above are technical defaults.
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (duplicates merged across lenses)

## Pass 4 — 2026-09-27
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 0, minor 14, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Zero majors: converged. Per the stopping rule no fixer ran; these minors stay open for the builder (each has an obvious technical default):
### Open minors (not applied)
- CLI paragraph — "every mode runs … staleness check" vs "`--force` always regenerates": read as parse → verify → (unless `--force`) stale check → write.
- `parseArgs` return shape unpinned: default `{ force: boolean, source: string | null }` on `process.argv.slice(2)`, no path resolution inside; success cases `[]`, `['--force','--source','x']`; empty `--source ""` throws; repeated-flag cases are `--force --force` and `--source a --source b`.
- `verifySource(buffer, expectedHash)` compares with its argument; the CLI passes `EXPECTED_SHA256`.
- CLI guard: `process.argv[1] !== undefined && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)`; a stated refinement of build-notes CAP-2's form.
- README hash regex: `^[ \t]+SHA-256: ([0-9a-f]{64})$` per line (not `\s+`, which spans newlines); split on `/\r?\n/`; exactly one ``- `enable1.txt` `` line.
- README BGA sentence: say `enable1.txt` (172,823) explicitly; the 99 are the 96 two-letter words plus knickknack, razzmatazz, razzmatazzes (reviewer diffed the BGA list).
- `// @ts-check`: add it to both script files (build-notes) with `checkJs` enforcing; tsconfig.node.json is non-strict — accept or add JSDoc on exports.
- Watch re-run under 1 s (AD-17) not named; evidence from a `test:watch` re-run.
- Stub export form: pin the verified `import url from '…?url'; export const dictionaryUrl = url;`.
- Port-5173-free check command, e.g. `! ss -ltn 'sport = :5173' | grep -q 5173`.
- Orphaned `en.txt.<pid>.tmp` after a killed run: left alone (git-ignored); check none after a normal `--force` run.
- Handoff: asset is emitted but unreferenced until epic 3; CAP-6 is the permanent guard; list stale AGENTS.md lines under a heading for ticket 3's builder.
- svelte-check resolution of `./shell/dictionary.svelte` specifier: record `npm run check` clean.
### Decision needed (functionality / UX / gameplay)
- none

## Result — converged after 4 passes
Majors per pass: 7 → 4 → 5 → 0. All applied items were technical defaults (36 across passes 1–3); no functionality, UX or gameplay decisions arose.
