# Review log — story-live-layout-gate-and-touch-action-regions.md (ticket 4.4)

State: pass 2: done

Mode: docs, thorough, max 7, budget 1245 words (2.5 x (374 pass-0 words + 124 carried toml words)). Pass 0: HEAD affe546, copy story-live-layout-gate-and-touch-action-regions.passes/pass0.md, 374 words.

## Pass 1 — 2026-10-02
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 10, minor 9, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
### Applied
- [major] Description gate.ts — no scroll input on the gate; S tests cannot drive scroll-busy, own-write ignore has no hook → fixer item 1
- [major] Description layout.svelte.ts — no surface/lifecycle: how it gets the gate, what Board reads, initial synchronous compute → fixer item 2
- [major] Description banner latch — DictionaryBanner renders live `dictionary.showBanner`, so the latch would not hold the banner off → fixer item 3
- [major] Description layout — entry 1 functions not named (entry 1 plan deferral), `last` policy, SPEC CAP-3/F21 re-layout and anchor delta after a w recompute dropped → fixer item 4
- [major] Description anchor delta — DOM must take new heights (flushSync) before scrollTop write; write only when differs; ignore flag clears next rAF → fixer item 5
- [major] Description gate/layout — deferred work not coalesced; inputs read at event vs run time unspecified → fixer item 6
- [major] AC — no test for hoverFine recompute, two 60 px shrinks (stateful `last`), w-recompute anchor delta → fixer item 7
- [major] AC touch-action/user-select — regions unnamed, pan-x pan-y branch untested → fixer item 8
- [major] AC scroll case — fallback path contradicts AC; SPEC test conditions dropped; "within a frame" unmeasurable → fixer item 9
- [major] Description ?bands= — where parsed, which "dev" (dist-test excluded), one order for bands() and Board → fixer item 10
- [minor] registerBeforeHide order vs AD-9 cancel-first; AD-9 vs build-notes registrar → fixer item 11
- [minor] deferrals from entries 1–2 (banner sticky offset F22, sub-pixel tolerance, desktop <360 px scrollbar) → fixer item 12
- [minor] gate leave() at 0, whenIdle FIFO, scrollReset clears timer → fixer item 13
- [minor] safe-area probe timing and top/bottom only → fixer item 14
- [minor] banner-leftover-first viewport and observable → fixer item 15
- [minor] touchHold validation/misuse and spec case → fixer item 16
- [minor] add toml interface/tests/owns to Description (caller instruction) → fixer item 17
### Default applied (technical)
- gate inputs — `scroll()`, `scrollEnd()`, `ignoreNextScroll()`; layout owns window listeners
- layout surface — `createLayout` with injected window/matchMedia deps, created in main.ts after the gate, Board reads its getters
- anchor write — flushSync then scrollTop only when it differs
- coalescing — one pending relayout job reading live inputs when it runs
- ?bands= — `import.meta.env.DEV` only, parsed once in the layout module
- regions narrow case — a viewport under the 352 px board asserting pan-x pan-y
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (duplicates across lenses merged)
### Fix outcome
Fixer applied items 1–17. Unverified: whether `import.meta.env.DEV` is allowed in a UI module by `src/architecture.test.ts` (fixer item 10). `flushSync` checked against svelte 5.57.1.
Words (docs): 967 (2.59 x pass 0)  |  Snapshot: story-live-layout-gate-and-touch-action-regions.passes/pass1.md

## Pass 2 — 2026-10-02
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 7, minor 13, decision-needed 0  |  Dropped in triage: 1 (340 px "unsupported width" folded into the wide-case viewport minor)
### Applied
- [major] AC banner-during-scroll — "within 2 frames" loosens SPEC/build-notes/rule-coverage/toml "within a frame" (introduced by pass 1) → fixer item 1
- [major] AC banner-during-scroll — test can pass vacuously if the dictionary fails after the pan; no check that `failed` is reached mid-pan → fixer item 2
- [major] CSS/AC touch-action — an ancestor's pan-y intersects the regions' values; computed-style test passes with horizontal pan broken → fixer item 3
- [major] layout deps — clientWidth (cardWidth's input, build-notes CAP-1), `location.search`, the probe's document, scroll read/write not injected; UI Vitest in node cannot construct createLayout → fixer item 4
- [major] layout — no mechanism to follow `dictionary.showBanner`; under Vitest `$effect` never runs and `flushSync` is a server noop (svelte index-server.js:16, checked) → fixer item 5
- [major] layout — coalesced task decides w only via `shouldRecomputeWidth` (innerWidth/innerHeight), so a hoverFine-only change recomputes nothing; contradicts its own test → fixer item 6
- [major] gate whenIdle — what requests the raf on busy→idle unspecified (queued work can stall); busy re-check within a snapshot → fixer item 7
- [minor] scrollReset/scrollEnd wording (which flag, timer) → fixer item 8
- [minor] trayRows fixed at 1 (build-notes CAP-1), AD-11 tray-row trigger is epic 5 → fixer item 9
- [minor] gate and layout created after the halted return, before `registerLifecycle()` (entry 6, AD-16) → fixer item 10
- [minor] Playwright viewport numbers hold on `android` only; wide case at a supported width → fixer item 11
- [minor] banner background and 4 px tray gap are non-card regions → fixer item 12
- [minor] ?bands= test split: dev half on android, dist half in dist-smoke.spec.ts → fixer item 13
- [minor] fallback order: synthesizeScrollGesture on android before desktop wheel (SPEC Constraints android-first) → fixer item 14
- [minor] hide reset wiring: P4 or S-only exempt in the plan (rule-coverage row 99) → fixer item 15
- [minor] insets-only change re-lays bands → fixer item 16
- [minor] layout own-write ignore and no-write-when-equal asserted in the createLayout case → fixer item 17
- [minor] touchHold cleanup when moveTo throws / test fails mid-hold → fixer item 18
- [minor] Notes deferrals each get an action verb → fixer item 19
### Default applied (technical)
- frame bound — "within a frame" counted in rAF ticks in-page; any slack recorded in the plan as test tolerance
- vacuity — poll the test hook's `dictionaryState()` to `failed` mid-pan before asserting no banner
- touch-action — values only on the regions; every ancestor computes `auto`, asserted
- banner watch — injected `watchBanner(cb)` dep (browser: `$effect.root`), Vitest calls cb; Vitest asserts `$state` and scroll writes through fakes, never DOM/effects; `flushSync` is real only in the browser
- `last` records hoverFine too
- gate raf — at most one outstanding raf, requested on whenIdle and busy→idle while the queue is non-empty; each fn re-checks busy
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- separate "340 × 750 is an unsupported width" minor — merged into item 11
### Fix outcome
Fixer applied items 1–19, none skipped. Checked: `dictionaryState` (test-hook.ts), `hidePage`/`showPage` (e2e/helpers/lifecycle.ts), svelte server `flushSync` noop, desktop 370 × 750 → clientWidth 355, available 323 < board 352 (throwaway Playwright measurement). Unverified: the scroll fallbacks (as in build-notes).
Words (docs): 1244 (3.33 x pass 0; at the 1245 budget, further additions are minor)  |  Snapshot: story-live-layout-gate-and-touch-action-regions.passes/pass2.md
