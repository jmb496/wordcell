# Review log — story-worker-registration-state-module-and-swstate.md (ticket 7.1)

State: pass 1: done

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
