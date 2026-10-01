# Review log — story-lifecycle-and-visible-time-clock (ticket 3.6)
State: pass 1: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: 203 words, snapshot `story-lifecycle-and-visible-time-clock.passes/pass0.md`, HEAD d02367e.
Note: the pull from tickets.toml entry 6 dropped `interface`, `tests`, `owns`; they are passed to reviewers and fixer as intent, and the pass 1 fixer adds them to the Description as `Interface:`, `Tests:`, `Owns:` lines.

## Pass 1 — 2026-09-30
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 11, minor 11, decision-needed 0  |  Dropped in triage: 0 (duplicates merged across lenses)
Words (docs): 843 (4.15 x pass 0; budget 1500)  |  Snapshot: story-lifecycle-and-visible-time-clock.passes/pass1.md  |  Fixer: all 20 applied; no runnable command added (page.clock install/pauseAt/runFor already used in e2e/blocking.spec.ts)
### Applied
- [major] Description — pulled entry lost interface/tests/owns (4 lenses) → fixer 1
- [major] Description — isStale protocol (owned here) undefined: last text, update points, how entries 7/10 join (3 lenses) → fixer 2
- [major] Verify — no-halt case passes even if own writes never update the last text; real bfcache restore follows a pagehide flush (3 lenses) → fixer 3
- [major] Verify — which key the halting case changes is unspecified; only the session owner exists here (3 lenses) → fixer 4
- [major] Description — "registerLifecycle() not called while halted" lives in main.ts, untestable by shell Vitest; behaviour while booting/twice unspecified (4 lenses) → fixer 5
- [major] Description — whenVisible contract (at once if visible; before registration; several callers) and its shell Vitest missing (4 lenses) → fixer 6
- [major] Verify — R-76 cases (won, gaveUp, fresh deal) and R-73 "not on ticks" collapsed into one phrase (4 lenses) → fixer 7
- [major] Verify — CAP-5 New game activeMs = 0 with discarded take has no Playwright proof (3 lenses) → fixer 8
- [major] Description — hide flush does not assign the accrued Session (write first, then assign); next write loses time (3 lenses) → fixer 9
- [major] Description — rejected root: registration, resume, flush writes nothing; whenVisible needed there by entry 9 (CAP-8) (2 lenses) → fixer 10
- [minor] Verify — exact expected activeMs with page.clock install/pauseAt/runFor → fixer 11
- [minor] Description — callbacks and take/pause run in every state; only accrue/write/assign while active; AD-15 halted flush setup via the persisted-pageshow halt → fixer 12
- [minor] Description — a throwing callback or write propagates to AD-15 (rule 6) → fixer 13
- [minor] Description — persisted pageshow: staleness check before resume; skipped while halted; fatal still wins → fixer 14
- [minor] Verify — persisted:false while hidden observed via a following pageHide, not showPage → fixer 15
- [minor] Verify — hidePage spy log is exactly one entry for wordcell:session (flush writes only that key) → fixer 16
- [minor] Tests line — "mirror" undefined → "own-write no-halt case" → fixer 17
- [minor] Description — registerBeforeHide constraints (order, no dispatch, cannot change what is written), stub-only per E10 → fixer 18
- [minor] Description — one 120-word sentence; split into bullets → fixer 19
- [minor] References — only the parent epic → fixer 20
### Default applied (technical)
- registerLifecycle() — throws while booting or halted and on a second call (rule 6, style of load/dispatch); main.ts keeps its halted early return; shell Vitest AD-16 asserts the throw and no listener added
- isStale — each owner keeps last read or successfully written text (null when absent), rereads via storage.read; game.svelte.ts's pageshow handler ORs a fixed list of directly imported owner checks (entries 7 and 10 append)
- whenVisible() — throws before registerLifecycle(); resolves at once if visible, else every pending caller on the next visibilitychange to visible; independent of store state
- Halting case key — wordcell:session set via page.evaluate to a different valid Session text
