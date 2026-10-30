# Review loop — ticket 7.5 (Persistent-storage request and boot-order proofs)

State: pass 1: done

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
