# Review log — story-lifecycle-and-visible-time-clock (ticket 3.6)
State: pass 2: done

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

## Pass 2 — 2026-09-30
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 11, decision-needed 0  |  Dropped in triage: 1
Words (docs): 1078 (5.31 x pass 0; budget 1500)  |  Snapshot: story-lifecycle-and-visible-time-clock.passes/pass2.md  |  Fixer: all 15 applied; no runnable command added; fixtures session-place.json and session-invalid-version-unknown.json verified to exist
### Applied
- [major] Verify, AD-15 halted — spy armed after boot records the test's own setItem that causes the halt, so "no write" fails (4 lenses) → fixer 1
- [major] Description, Hide flush — "while rejected the flush writes nothing" untested (AD-4 rejected-save protection) (3 lenses) → fixer 2
- [major] Verify, R-76 won/gaveUp — a flush skipping the write passes too; "unconditional" untested for finished games → fixer 3
- [major] Description, registerBeforeHide — allowed states unspecified; AD-9/AD-16 register cancel before lifecycle listeners (2 lenses) → fixer 4
- [major] Verify, Shell Vitest — registerLifecycle() booting and second-call throws untested (2 lenses) → fixer 5
- [minor] registerLifecycle second-call message `AD-16 registerLifecycle() called twice` → fixer 6
- [minor] Name session-place.json for the Undo cases (3 lenses) → fixer 7
- [minor] isStale shell Vitest: add replay and first-launch write; a persisted pageshow after an own write does not halt (3 lenses) → fixer 8
- [minor] whenVisible shell Vitest id AD-16 per rule-coverage → fixer 9
- [minor] Listener targets: visibilitychange on document, pagehide/pageshow on window; shell Vitest stubs document → fixer 10
- [minor] Rejected stale halt shell Vitest → fixer 11
- [minor] registerBeforeHide constraints are a caller contract, not enforced → fixer 12
- [minor] Flush leaves feedback unchanged (2 lenses) → fixer 13
- [minor] Entries 7/10 edit game.svelte.ts to append their check; import cycle safe (no import-time access) → fixer 14
- [minor] Throwing before-hide callback: shell Vitest AD-9 (error propagates, no write) → fixer 15
### Default applied (technical)
- AD-15 halted case — arm the spy after current().kind is 'halted', assert empty log
- Rejected flush — Playwright §2 case with session-invalid-version-unknown.json, spy armed after boot, hidePage + pageHide → empty log, stored bytes unchanged
- registerBeforeHide — accepts callbacks in any state, before registerLifecycle(), never throws
### Dropped
- whenVisible resolves only on visibilitychange (adversarial stretch) — already explicit in the ticket
