# Review log — story-dictionary-load-retry-and-validate (ticket 3.9)
State: pass 1: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: 223 words, snapshot `story-dictionary-load-retry-and-validate.passes/pass0.md`, HEAD 2d4e499.
Note: the pull from tickets.toml entry 9 dropped `interface`, `tests`, `owns`; they are passed to reviewers and fixer as intent, and the pass 1 fixer adds them to the Description as `Interface:`, `Tests:`, `Owns:` lines.

## Pass 1 — 2026-10-01
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 10, minor 7, decision-needed 0  |  Dropped in triage: 0 (duplicates merged across lenses)
Words (docs): 1001 (4.49 x pass 0; budget 1500)  |  Snapshot: story-dictionary-load-retry-and-validate.passes/pass1.md  |  Fixer: all 17 applied; no runnable command added
### Applied
- [major] Description — pulled entry lost interface/tests/owns (caller directive) → fixer 1
- [major] Interface — Svelte 5 cannot export a reassigned `$state`; module surface, initial state, words-before-ready order, store ctx gate and feedback Vitest mock unspecified (4 lenses) → fixer 2
- [major] Validate labels — precedence, Idle labels, text.ts strings, held-route disabled `Loading words…` check untested (4 lenses) → fixer 3
- [major] Failure mapping — non-OK/network/timeout/empty list → failed, only 404 sets the reload flag; untested (3 lenses) → fixer 4
- [major] Q-42 under a controlling SW — Reload behaviour and test deferral unstated (2 lenses) → fixer 5
- [major] Halted guard — check point after double rAF/whenVisible and the halted-boot test's wait point unspecified (4 lenses) → fixer 6
- [major] Verify — R-73 Validate, AD-8 never-closing-body Vitest, AD-16 halted boot and held-request DOM check missing (2 lenses) → fixer 7
- [major] Continuity — interim LABELS / Validate label assertions in other specs, test-hook keys + globals.d.ts, placeholder screenshot left to race (3 lenses) → fixer 8
- [major] R-73 Validate step order and wait unspecified (3 lenses) → fixer 9
- [major] Invalid-word line — text, uppercasing (3.4 deferral), placement, stays Composing/nothing stored (4 lenses) → fixer 10
- [minor] first-paint mechanism (double rAF) not named → fixer 11
- [minor] 404 reload observable assertion → fixer 12
- [minor] banner component name and scope (board only, no AD-11 latch until epic 4) → fixer 13
- [minor] timeout lower bound (29 999 ms) → fixer 14
- [minor] retry in-flight state (banner hidden, `Loading words…`) → fixer 15
- [minor] retry()/load() preconditions (fail fast) → fixer 16
- [minor] one-tap Validate rule → fixer 17
### Default applied (technical)
- Surface — exported `dictionary` object: `state` getter (initial `loading`), `words`, `load()`, `retry()`; words set before `ready`; store passes `state === 'ready' ? words : undefined`
- Q-42 controlled page — Reload refetches in place (no page reload); controller branch shell Vitest here, Playwright P7 in epic 7
- Halt guard — main.ts re-checks halted after double rAF + `whenVisible()`; an in-flight load just settles
- Banner — `src/ui/DictionaryBanner.svelte`, board only, straight from state (no gesture latch until epic 4); not on the rejected root
- retry() throws unless `failed`; load() throws if called twice
- startHidden ordering case stays with CAP-10 (ticket 11)
### Dropped
- none
