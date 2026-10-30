# Review log — story-worker-registration-state-module-and-swstate.md (ticket 7.1)

State: pass 3: done (converged)

Mode: docs, thorough, max 7. Pre-loop: HEAD edc929a, copy at `story-worker-registration-state-module-and-swstate.review-log.passes/pass0.md`, 388 words.
Refs: SPEC.md, rule-coverage.md, device-checks.md, release-checklist.md, build-notes.md (`_bmad-output/specs/spec-epic-7-pwa-release/`), epic-pwa-release.md, ARCHITECTURE-SPINE.md, AGENTS.md; plus the uncopied `tickets.toml` entry 1 fields (interface, tests, owns, consumers, plan_checkpoint) as ticket intent.

## Pass 1 — 2026-10-30
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 3, minor 11, decision-needed 0  |  Dropped in triage: 3 (duplicates merged)
Words (docs): 898 (2.31x pass 0)  |  Snapshot: story-worker-registration-state-module-and-swstate.review-log.passes/pass1.md  |  Fix diff: pass1.fix.diff
Fixer: applied items 1–14, no conflicts; verified `workbox-window` 7.4.1 in node_modules, vite-plugin-pwa `^7.4.1`, lockfile 7.4.1, `npm ls workbox-window` one deduped copy; current build-output title and markers confirmed; `Workbox.register()` rejects under `block` (Workbox.js reads `.waiting` of the stub's `undefined`).
### Applied
- [major] Description, "the failure detection is entry 2's" vs `interface` "always-resolving attempt promise" — what entry 1's `sw.ts` does on a rejected `register()` is unspecified (catch vs AD-15) → fixer item 1
- [major] Description, build-output narrowing — "to CAP-6's first clause" can drop the other three markers and the `clientsClaim` check; no presence assertion; stale test title → fixer item 2
- [major] Verify, shell Vitest precedence — only single-slot cases; no test that waiting beats installing beats active, or of the empty registration → fixer item 3
- [minor] Description — add the uncopied `tickets.toml` entry 1 fields (interface, tests, owns, consumers, plan_checkpoint) → fixer item 4
- [minor] F6 audit — every routing spec asserts its handler hit (not only reload ones); `theme.spec.ts` is the one routing spec; `precacheComplete()` is entry 4's, so not a remedy here; `block` not used in entry 1 → fixer item 5
- [minor] `workbox-window` pin — exact `7.4.1`, lockfile updated → fixer item 6
- [minor] Verify dev check — named with its id, asserted after `dictionaryState()` leaves `loading`; entry 5 extends that test → fixer item 7
- [minor] F4 halt returns and F17 catch untested here — proven by entries 5 and 7; plan lists them as deferred coverage → fixer item 8
- [minor] `swChunkFile()` contract — throws on a missing or non-dynamic `src/shell/sw.ts` key; `e2e/helpers.spec.ts` case → fixer item 9
- [minor] sticky `failed` — implemented in entry 1's state module, tested in entry 2 → fixer item 10
- [minor] state recompute points and one `statechange` listener per worker → fixer item 11
- [minor] F17 try/catch only around the `import()` expression → fixer item 12
- [minor] dev skip is a branch around import and attempt, not a `return` → fixer item 13
- [minor] References — F4 supersedes AD-15 "later steps still run" until CAP-9's sync (known, not a spine bug to stop on) → fixer item 14
### Default applied (technical)
- rejected `register()` in entry 1 → no catch; propagates to AD-15 (rule 6); always-resolving contract and `failed` land with entry 2; entry 1 sets no spec to `block`
- `workbox-window` range → exact `7.4.1`
- sticky `failed` → in entry 1's state module, tested by entry 2
- `swChunkFile()` on a missing key → throws (rule 6)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- "second update found later" naming/duplication with entry 2 — merged into item 8's "later entries extend these tests" note
- theme.spec.ts known-result and audit remedies — duplicate of item 5
- "only in the sw.ts chunk" stricter than CAP-6's closure wording — merged into item 2

## Pass 2 — 2026-10-30
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 3, minor 8 (applied), minor 2 (left), decision-needed 0  |  Dropped in triage: 4 (duplicates merged)
Words (docs): 998 (2.57x pass 0)  |  Snapshot: story-worker-registration-state-module-and-swstate.review-log.passes/pass2.md  |  Fix diff: pass2.fix.diff
Fixer: applied items 1–11, no conflicts; cuts for budget (workbox-window pin clause, `block` clause, Cache Storage wording, dropped the redundant "makes the attempt always resolve"); verified Playwright 1.63.0 `waitForLoadState('networkidle')` exists (typings mark it discouraged), workbox-window 7.4.1, existing hook tests' four-key lists.
### Applied
- [major] Description, boot tail F17 — after a caught `import()` rejection nothing says the attempt is skipped; in production (`halted()` false) the listed order calls the attempt on a module that never loaded → TypeError → AD-15 surface, against Q-40/F17 → fixer item 1
- [major] Verify, dev test (pass-1 fix) — the no-request and `unregistered` checks can pass vacuously right after the `dictionaryState()` poll; a substring match would also catch the F1 state module → fixer item 2
- [major] Description/References — five hook keys contradict spine AD-17's four-key list; F14 (the sanctioned supersession) is not cited, so an unattended build could stop under AGENTS.md Policy → fixer item 3
- [minor] Verify, Vitest — no `statechange`-driven move between slots and no one-listener-per-worker case (reclassed from major: the P7 poll to `active` exercises `statechange` end to end) → fixer item 4
- [minor] Interface/build-output — the kept `registerSW` marker fails a `sw.ts` function named `registerSW` → fixer item 5
- [minor] Verify, precedence — all three slots filled → `waiting` not listed → fixer item 6
- [minor] `swChunkFile()` — needs an optional root like `buildRoot(repo)` so `e2e/helpers.spec.ts` (no `PW_PREVIEW`) can reach its throws and success → fixer item 7
- [minor] Tests line — "AD-16 state rows (S)" names no rule-coverage row → fixer item 8
- [minor] state setter — what a set after `failed` does is unstated → fixer item 9
- [minor] existing AD-17 hook-key tests (`e2e/pwa/test-hook.spec.ts`, `e2e/test-hook.spec.ts`) vs the new AD-16 AD-17 test — who asserts the key list → fixer item 10
- [minor] F6 audit — "no hit assertion" reads as accepted; theme.spec.ts gains one → fixer item 11
### Default applied (technical)
- F17 path → the attempt is skipped and the tail falls through (no `return`) to its final `halted()` check
- dev negative check → listener before `goto`, `networkidle` after the poll, exact pathname `/src/shell/sw.ts`
- setter after `failed` → leaves `failed` unchanged (CAP-1 outcome)
- `sw.ts` export name → not `registerSW`
- `swChunkFile(root = buildRoot())`
### Decision needed (functionality / UX / gameplay)
- none
### Left (minor, unapplied: plan detail, word budget)
- Description, last sentence — between entries 1 and 2 a rejected `register()` on `dist/` shows the AD-15 surface; plan lists it as a transitional residual risk (nothing merges before entry 2)
- `sw.ts` — attach the module's own `updatefound` listener synchronously after `register()` resolves, before the first slot read
### Dropped
- pathname-match finding — folded into item 2
- macrotask wait (fix-diff) — folded into item 2
- F17 skip (adversarial minor) — duplicate of item 1
- statechange cases (adversarial minor) — duplicate of item 4

## Pass 3 — 2026-10-30
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 0, minor 12, decision-needed 0  |  Dropped in triage: 3 (duplicates merged)
Words (docs): 998 (2.57x pass 0, over budget)  |  Snapshot: unchanged (pass2.md); no fix pass
### Applied
- none (converged)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- key-list titles (edge, adversarial) — merged into the key-list minor
- "tail's final `halted()` check" (fix diff, adversarial) — duplicate, merged
- key-list test count (ref alignment) — duplicate of the adversarial finding
### Triage note
- Adversarial labelled the missing third key-list test (`src/shell/test-hook.test.ts`) major; reclassed minor: `npm test` fails at once with obvious, mechanical handling, and the ticket follows CAP-2's own four-file "change together" list.

## Result — converged after 3 passes

Majors per pass: 3, 3, 0. No decision-needed items; 12 technical defaults applied (passes 1–2). Words 388 → 998. No open major.

Unapplied minors (for the build plan):
- Verify, "both existing `AD-17` hook tests' key lists gain `swState`" — three tests pin the four keys: also `src/shell/test-hook.test.ts:45-53` (Vitest); all three key lists gain `swState`, and the two Playwright titles ("exposes loaded, current, dictionaryState and celebration") are retitled (e.g. "… exposes exactly its hook keys") so entry 4's sixth key does not stale them again.
- Description, boot tail — "falls through … to the tail's final `halted()` check, where entry 5 appends `requestPersistence()`": entry 1's tail ends after the attempt; entry 5 appends the final `halted()` check with `requestPersistence()` (no trailing no-op check here).
- Verify, dev test — named AD-16 AD-17; entry 5, extending it with persistence calls, renames it to carry AD-7 (rule-coverage row "AD-16 AD-7 (F3)").
- Verify, dev test wait — after the `dictionaryState()` poll let one macrotask pass, then wait for `networkidle` (resolves at once if already reached; matches build-notes' F4 "one macrotask").
- Verify, "a `pwa` test named AD-16 AD-17 only polls" — the test lives in `e2e/pwa/test-hook.spec.ts` (rule-coverage AD-17 row); "only" means it does not re-assert the key list.
- Verify, "a worker present at `register()` that also fires `updatefound`" — the registration fires `updatefound`, not the worker; put the event on the fake registration.
- Vitest isolation — fresh state module and `sw.ts` per case with `vi.resetModules()` (as `test-hook.test.ts`); no `reset()` export (SPEC Constraints: no production path for a test).
- F17 catch — `reportError(new Error('Q-40 F17 …', { cause }))` keeps the rejection's reason; and call `reportError` only when the launch has not already halted, so a Q-38 another-window halt during a pending import is not overwritten by `fatal` (game.svelte.ts:210-212), or accept as hook-build residual risk.
- Notes, open question — beyond `theme.spec.ts`, the F6 audit's findings are recorded in the plan.
- (pass 2) Between entries 1 and 2 a rejected `register()` on `dist/` shows the AD-15 surface; transitional, nothing merges before entry 2; plan lists it as a residual risk.
- (pass 2) Attach `sw.ts`'s own `updatefound` listener synchronously after `register()` resolves, before the first slot read.
