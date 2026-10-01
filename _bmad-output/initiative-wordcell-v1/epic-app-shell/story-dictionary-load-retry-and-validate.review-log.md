# Review log — story-dictionary-load-retry-and-validate (ticket 3.9)
State: pass 2: done

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

## Pass 2 — 2026-10-01
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 8, decision-needed 0  |  Dropped in triage: 0 (duplicates merged across lenses)
Words (docs): 1238 (5.55 x pass 0; budget 1500)  |  Snapshot: story-dictionary-load-retry-and-validate.passes/pass2.md  |  Fixer: all 13 applied; no runnable command added
### Applied
- [major] Verify › Invalid word — "stored `wordcell:session` unchanged" fails: dispatch writes the accrued Session (activeMs) on a rejected Validate (2 lenses) → fixer 1
- [major] Verify › Timeout — 29 999 ms bound after the route sees the request is not deterministic in Playwright (timer starts at fetch; clock/rAF interplay) (3 lenses) → fixer 2
- [major] Start — dictionary start must be scheduled only on the App mount path (whenVisible throws before registerLifecycle on the standalone halted path); halted check after the double rAF too (1 lens) → fixer 3
- [major] Verify › AD-16 — no deterministic trigger for the in-load / after-mount halt (3 lenses) → fixer 4
- [major] Validate — dictionary reason labels in ink secondary (DESIGN.md Ink) in Composing and Idle, untested (2 lenses) → fixer 5
- [minor] retry() sets 'loading' synchronously → fixer 6
- [minor] controlled-SW parenthetical states an outcome, reads against the Retry rules (3 lenses) → fixer 7
- [minor] Vitest never-closing body: race text() against the abort signal → fixer 8
- [minor] ✕ glyph vs exact-text assertion (2 lenses) → fixer 9
- [minor] paused-clock specs and the 'ready' wait → fixer 10
- [minor] session-idle-pending-draft.json row in the rewritten LABELS table → fixer 11
- [minor] banner DESIGN.md look not cited → fixer 12
- [minor] §2 case: Validate disabled `Word list unavailable` while failing (rule-coverage) → fixer 13
### Default applied (technical)
- Invalid word — assert stored moves/cursor unchanged and stored == current().session (activeMs may grow)
- Timeout — exact 29 999/30 000 boundary in the shell Vitest (fake timers); Playwright keeps a margin (still loading at 29 000 ms, banner by 30 000 ms after the request)
- Halt triggers — in-load: Q-38 storage write during boot (blocking.spec.ts pattern); after mount: startHidden page halted by another window's write, then showPage
- ✕ in its own aria-hidden element; assertion targets the message element
### Dropped
- none
