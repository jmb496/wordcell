# Review log — story-dictionary-load-retry-and-validate (ticket 3.9)
State: pass 4: done

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

## Pass 3 — 2026-10-01
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 11, decision-needed 1  |  Dropped in triage: 1
Words (docs): 1464 (6.57 x pass 0; budget 1500)  |  Snapshot: story-dictionary-load-retry-and-validate.passes/pass3.md  |  Fixer: all 15 applied plus the optional cut; Q-42 question recorded in the ticket's Notes; no runnable command added
### Applied
- [major] Load — pass 2's controlled-SW wording (banner hidden while loading, may recover) contradicts confirmed Q-42 / AD-8 / EXPERIENCE "banner stays until the next launch" (3 lenses) → fixer 1 (state only what the refs say; the rest is decision-needed)
- [major] Load — the losing `response.text()` promise rejects after abort → unhandled rejection → AD-15 fatal instead of `failed` → fixer 2
- [major] Verify › AD-16 after-mount — no sync point guarantees the halt lands while main.ts waits in whenVisible() → fixer 3
- [major] Verify › AD-16 in-load — the blocking.spec pattern halts before game.load(), and no wait precedes the zero-requests check (3 lenses) → fixer 4
- [major] Load — "404 at any fetch" untested (only first-fetch 404) → fixer 5
- [minor] timeout must be setTimeout + controller.abort(), never AbortSignal.timeout (3 lenses) → fixer 6
- [minor] per-attempt controller and timer (load and each retry); retry stall test (2 lenses) → fixer 7
- [minor] paused-clock specs: runFor *and* expect.poll → fixer 8
- [minor] reload flag observed through behaviour, not exported → fixer 9
- [minor] load()/retry() return contract (Promise<void>, never rejects for AD-8 outcomes) → fixer 10
- [minor] invalidWord uppercases itself; text.test.ts case → fixer 11
- [minor] test-name ids for Retry/Timeout/banner cases (AD-8) → fixer 12
- [minor] Continuity: blocking.spec.ts healthy-boot runFor(31_000) now trips the dictionary timeout → fixer 13
- [minor] banner sticky offset needs the epic-4 top bar → fixer 14
- [minor] invalid-word live-region announcement deferral → fixer 15
### Default applied (technical)
- Timer — `setTimeout` → `controller.abort()`, cleared on settle, one controller per attempt
- text() race — losing promise gets a no-op catch; Vitest case where the stub body errors on abort → `failed`, no unhandled rejection
- AD-16 after-mount — wait for card-0 plus two in-page rAF round-trips before the other window's write, then showPage
- load()/retry(): Promise<void>, resolve when state leaves 'loading'
### Decision needed (functionality / UX / gameplay)
- Description › Load (Q-42 controlled-SW branch) — On the installed app (service worker in control), after the word list 404s, what does tapping the banner's Reload do? Q-42 says "the banner stays until the next launch" but not whether Reload still retries (which by EXPERIENCE.md hides the banner while it runs and may recover the word list) or does nothing — proposed default: Reload retries in place but the banner stays visible throughout (never reloads the page); recovered words make Validate work again and the banner then hides. Practical effect: the player can still recover without relaunching if the file is back; otherwise nothing visible changes. Epic 7 P7 proves it.
### Dropped
- rejected-root banner case untested (adversarial) — the sentence follows from "rendered straight from state"; no separate test needed (fixer may cut the clause)

## Pass 4 — 2026-10-01
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (empty)  |  Findings: major 2, minor 12, decision-needed 0  |  Dropped in triage: 0
Words (docs): 1484 (6.65 x pass 0; budget 1500)  |  Snapshot: story-dictionary-load-retry-and-validate.passes/pass4.md  |  Fixer: all 4 applied; no runnable command added
### Applied
- [major] Interface/Load — retry() on the 404 reload branch: state and promise settlement undefined, so the Promise<void> contract and the stubbed-reload Vitest hang or assert nothing (3 lenses) → fixer 1
- [major] Load/Interface — `response.text()` rejecting on its own (body error mid-download) not mapped; "any other rejection reaches AD-15" would make it fatal → fixer 2
- [minor] fontCheck citation inaccurate (no AbortController there) — zero-word reword (2 lenses) → fixer 3
- [minor] invalid-word route must serve a non-empty list without tan (an empty body is `failed`) → fixer 4
### Default applied (technical)
- Reload branch — retry() leaves state 'failed', calls location.reload(), makes no fetch, resolves at once; Vitest asserts state stays 'failed'
- text() rejection without abort → `failed`; Vitest row: body that errors before abort → failed, no unhandled rejection
### Unapplied (over budget; for the build plan)
- Timeout Playwright: running page.clock.install() before goto, not pauseAt
- R-38 held route released with route.continue() (real list)
- Invalid-word line directly above primary-action in App.svelte
- Invalid-word clearing by edit/Redo/successful Validate and no-op covered by the game.svelte.test.ts feedback Vitest
- AD-16 request counting via page.on('request') registered before goto; in-load case is structurally trivial
- Stalled body after abort: rely on controller.abort() erroring the body stream
- Spine AD-15 "like the dictionary fetch (AD-8)" reads as fatal timeout; AD-8 says `failed` — spine wording bug to report (the ticket follows AD-8)
- game-store.spec.ts New game test's final `toHaveText('Validate')` waits for 'ready'
### Dropped
- none
