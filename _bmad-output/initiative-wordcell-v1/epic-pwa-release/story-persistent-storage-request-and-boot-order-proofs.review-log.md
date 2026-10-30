# Review loop — ticket 7.5 (Persistent-storage request and boot-order proofs)

State: pass 3: done

Target: `_bmad-output/initiative-wordcell-v1/epic-pwa-release/story-persistent-storage-request-and-boot-order-proofs.md` (docs mode, thorough, max 7)
Pre-loop: HEAD c791c0b; pass 0 copy `story-persistent-storage-request-and-boot-order-proofs.review-log.passes/pass0.md`, 410 words (growth budget about 1025 words, 2.5x default).
Intent also includes tickets.toml entry 5 fields not copied into the ticket: interface, tests, owns, consumers (copy at `.passes/entry5.toml`; fixer adds them to the Description in pass 1). The Notes' Firefox question is settled by the epic Notes (owner, 2026-10-29): keep AD-7, request once per launch in every browser (A-A3 unchanged), so `requestPersistence()` is unchanged; fixer records it in Notes.
Refs: SPEC.md and companions rule-coverage, device-checks, release-checklist, build-notes, SPEC.review-log of `_bmad-output/specs/spec-epic-7-pwa-release/`, epic-pwa-release.md, ARCHITECTURE-SPINE.md, AGENTS.md, CLAUDE.md, plans of done tickets 7.1–7.4.

## Pass 1 — 2026-10-30 18:55
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 8, minor 12, decision-needed 0  |  Dropped in triage: 1 (plus duplicates merged across lenses)
Words (docs): 1004 (2.45x pass 0; budget about 1025)  |  Snapshot: story-persistent-storage-request-and-boot-order-proofs.review-log.passes/pass1.md (fix diff pass1.fix.diff)
Fixer: all 20 items applied, no conflicts; item 9 says "the clock run past `TIMEOUT_MS` … as `e2e/dictionary.spec.ts` does in dev" (that spec uses `page.clock.runFor`, not `fastForward`); scan regex checked with node against sample strings (not written into the ticket); no runnable commands added.
### Applied
- [major] Description, call site — `requestPersistence()` tied only to "entry 1's attempt"; could land inside `if (sw !== undefined)`, skipping the F17 and dev paths → fixer item 1
- [major] Description init script / AC dev clause — snapshots only at `register`; dev has none, so F3 "after `dictionaryState()` settles" is untestable and dropped from the AC → fixer item 2
- [major] Description — tickets.toml entry 5 interface, tests, owns, consumers not copied → fixer item 3
- [major] AC test names — the first-launch order test must carry AD-8 (rule-coverage "AD-8 … boot order" P7) and the dev test AD-7 (7.1 plan: entry 5 extends and renames it) → fixer item 4
- [major] F4 dictionary-held case — vacuous: without the pre-import check the import fetch outlasts one macrotask; also assert the `sw.ts` chunk never requested → fixer item 5
- [major] F4 chunk-held case — "import settled" has no observable point → fixer item 6
- [major] trailing `halted()` before `requestPersistence()` — no test in this ticket reaches it (both F4 cases return earlier) → fixer item 7
- [major] init script `register` wrapper — rejection handling unspecified; a `then(record)` without a reject handler makes an unhandled rejection (AD-15 surface on entry 7's hook-free `dist/` cases) → fixer item 8
- [minor] Notes — Firefox answer settled (owner, 2026-10-29); `page.clock` unknown has no default → fixer item 9
- [minor] AC first-launch — "hit only after release" and `dictionaryState()` not `loading` in the chunk handler dropped → fixer item 10
- [minor] F4 supersedes AD-15 "later steps still run" / AD-7 wording until CAP-9 — not a spine bug to stop on → fixer item 11
- [minor] scan — match form, markup, rule id and fixture cases unstated → fixer item 12
- [minor] AC Vitest — positive branch and both rejection points (`persisted()`, `persist()`) unnamed → fixer item 13
- [minor] AC "exactly one" — no point where the call log is final → fixer item 14
- [minor] first-launch "not hit while held" — no hold duration → fixer item 15
- [minor] F4 — init script and dictionary route page-level on the first page only; halt by `reportError` → fixer item 16
- [minor] dictionary routes page-level (`page.route`), the worker's precache fetch unaffected → fixer item 17
- [minor] exactly one `register` call unasserted → fixer item 18
- [minor] spec file for the `pwa` cases unnamed; init-script helper per page with an `e2e/helpers.spec.ts` case → fixer item 19 (with items 3, 8)
- [minor] no catch at the `main.ts` call site either (rule 6) → fixer item 20
### Default applied (technical)
- call site → one `if (halted()) return; await requestPersistence();` after the whole `if (!import.meta.env.DEV)` block (dev skip, settled attempt, F17 catch)
- init script → snapshot `dictionaryState()` with every logged event (`register` call and settle, `persisted`, `persist`), skipped when `__wordcell` is absent; `page.addInitScript` per page; `register` wrapper records via `then(onFulfil, onReject)` on the original promise and returns it unchanged
- F4 pre-import case → also route the `sw.ts` chunk; assert never requested after `networkidle`
- F4 post-import settle → `page.evaluate` of `import(chunkUrl)` then a macrotask
- trailing check → third `pwa` halt case: the wrapper holds `register`'s settle on a test flag, the test halts by `reportError`, releases, asserts no `persisted`/`persist`
- `page.clock` → `install()` before `goto`, held route asserted hit, `fastForward` past 30 s; if it cannot drive the timeout, the build stops `blocked` with evidence (no test-only seam, no row change)
- scan → `navigator` then `.`/`?.` then `storage` on string-stripped source and markup, `storageCheck` exclusions, new rule id, fixtures mirroring `localStorage`'s
- test files → `e2e/pwa/boot-order.spec.ts`; dev test in `e2e/test-hook.spec.ts` renamed `AD-16 AD-7 AD-17 …`
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- adversarial: dev Playwright case for a rejected `persist()` reaching AD-15 — the Vitest proves propagation; reduced to a no-catch-at-call-site wording (item 20)

## Pass 2 — 2026-10-30 19:10
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 2, minor 11, decision-needed 0  |  Dropped in triage: 0 (3 minors left for the plan: over budget and they add words)
Words (docs): 1024 (2.50x pass 0; budget about 1025)  |  Snapshot: story-persistent-storage-request-and-boot-order-proofs.review-log.passes/pass2.md (fix diff pass2.fix.diff)
Fixer: all 12 items applied, no conflicts; "Entry 5 fields" block compressed to pointers to stay in budget; `page.clock.fastForward` and `route.continue` checked in playwright-core 1.63.0 typings; worker-clock claim marked `(unverified)`.
### Applied
- [major] F4 dictionary-held case — settle point `networkidle` alone drops the rule-coverage F4 anchor (poll `dictionaryState()` out of `loading`, one macrotask) → fixer item 1
- [major] scan — the stated match rules (`?.`, `window.` prefix, whole identifier `storageBuckets`) have no fixture case, so a wrong regex passes the AC → fixer item 2
- [minor] init script hold option — contradicts "returns that promise unchanged"; release mechanism, logged settle under hold, and a `helpers.spec.ts` hold case unstated → fixer item 3
- [minor] AC — "asserted once the `persist` entry appears, then `networkidle` …" reads as assert-then-wait → fixer item 4
- [minor] timeout case — "as `e2e/dictionary.spec.ts` does" (`runFor`) contradicts build-notes `fastForward`; "worker runs outside the page clock" unverified → fixer item 5
- [minor] chunk-held case — fulfil with what; a stub makes the case vacuous → fixer item 6
- [minor] AC F4 — read point per case ambiguous (chunk-held case has no `networkidle`) → fixer item 7
- [minor] F4 — the two pre-registration cases unnamed; rule-coverage counts names carrying AD-16 AD-7 → fixer item 8
- [minor] F4 — held dictionary (and chunk) route asserted hit before the halt (rule-coverage F4 row) → fixer item 9
- [minor] routes — the `sw.ts` chunk route kind unstated (`page.route`, build-notes) → fixer item 10
- [minor] AC Vitest "absent → no call" cannot fail → fixer item 11
- [minor] "the one case reaching the trailing check" — true within this ticket only (entry 7's hook-build Q-40 cases also reach it) → fixer item 12
### Default applied (technical)
- F4 dictionary-held settle → fulfil, poll `dictionaryState()` out of `loading`, one macrotask, `networkidle`, then assert
- scan fixtures → add `navigator?.storage` and `window.navigator.storage` flagged, `navigator.storageBuckets` not flagged
- hold option → off: original promise returned; on: a new promise the test releases through a helper-exposed release, settling as the original did; the logged `register` settle is the original's; `helpers.spec.ts` covers hold and release
- held chunk released with the real response (`route.continue()`)
- timeout → `page.clock.fastForward` past `TIMEOUT_MS` (build-notes); worker clock claim marked `(unverified)`
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none; left unapplied for the plan (over budget, fixes add words): init-script details (`ServiceWorkerContainer.prototype.register`, `persist` calls through, hook check per event; build-notes already says the first); `helpers.spec.ts` page and assertions; `\s*` around `.`/`?.` in the scan regex (mirror `MATH_RANDOM`)

## Pass 3 — 2026-10-30 19:20
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 2, minor 3, decision-needed 0  |  Dropped in triage: 0 (fix diff and ref alignment returned none; 8 stretch minors left for the plan)
Words (docs): 1025 (2.50x pass 0; budget about 1025)  |  Snapshot: story-persistent-storage-request-and-boot-order-proofs.review-log.passes/pass3.md (fix diff pass3.fix.diff)
Fixer: all 5 items applied (item 5 word-neutral: "CAP-3's trailing `halted()` check"); additions offset by cuts (AC chunk sentence merged to "hit only after the dictionary's release"; scan/fixture/helpers AC merged); `swState()` leaving `unregistered` checked in `src/shell/sw.ts` (only via `recompute()` after `workbox.register()` or `fail()`).
### Applied
- [major] dictionary-404 launch — no route-hit assertion and no expected snapshot value, so a 404 route that never fires passes as a copy of the first-launch case → fixer item 1
- [major] registration-attempt F4 case — under hold the logged settle is the original's (can precede the release), so "the settle plus one macrotask" never shows `main.ts` resumed; a never-released hold passes vacuously → fixer item 2
- [minor] F4 lead-in — "dictionary route on the first page only" reads as holding it in the registration-attempt case too → fixer item 3
- [minor] first-launch hold — `current().kind` `active` is always true when the dictionary request exists (`game.load()` and mount precede `dictionary.load()`) → fixer item 4 (cut)
- [minor] trailing check source — CAP-3 / build-notes Boot, not F4 → fixer item 5 (word-neutral only)
### Default applied (technical)
- every dictionary route asserted hit; snapshots `ready` on first launch, `failed` after the 404 and the timeout
- registration-attempt resume point → after the release poll `swState()` out of `unregistered` (`registerWorker()`'s last step, run only after the held promise settles), one macrotask, then assert
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none; left unapplied for the plan (over budget): dictionary-held case's chunk handler records the hit and `route.continue()`s (fails on the assertion, not a timeout); fulfil the dictionary with `route.continue()`; timeout route never released; call-log reader and its `e2e/globals.d.ts` global; dev case read point (existing waits); chunk URL built as `'/' + swChunkFile()` against `baseURL`, hit once; scan "mirror" for the engine-token and `.d.ts` cases
