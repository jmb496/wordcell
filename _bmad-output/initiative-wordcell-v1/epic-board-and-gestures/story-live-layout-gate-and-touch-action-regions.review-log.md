# Review log — story-live-layout-gate-and-touch-action-regions.md (ticket 4.4)

State: pass 1: done

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
