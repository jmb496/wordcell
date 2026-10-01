# Review log — story-lifecycle-and-visible-time-clock (ticket 3.6)
State: pass 4: done

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

## Pass 3 — 2026-09-30
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 3, minor 11, decision-needed 0  |  Dropped in triage: 1
Words (docs): 1314 (6.47 x pass 0; budget 1500)  |  Snapshot: story-lifecycle-and-visible-time-clock.passes/pass3.md  |  Fixer: all 13 applied; verified with node v24.1.0 that EventTarget.dispatchEvent returns normally and re-raises a listener throw as uncaught
### Applied
- [major] Verify, Shell Vitest — throwing before-hide callback cannot be observed: Node EventTarget dispatchEvent swallows listener throws (re-raised as uncaught) (3 lenses) → fixer 1
- [major] Description, Hide flush — throwing flush write (no assign, propagates) untested; assign-before-write passes every case (2 lenses) → fixer 2
- [major] Description, isStale — recording the text read at load (rejected, valid-stored) untested; a null text would wrongly halt a restored rejected page → fixer 3
- [minor] "No listener added" asserted via addEventListener spies (Node EventTarget cannot list listeners) → fixer 1
- [minor] whenVisible before registerLifecycle throws synchronously; add the case → fixer 4
- [minor] pageshow resume runs in every state (like take/pause), after the staleness check (2 lenses) → fixer 5
- [minor] registerBeforeHide order test: one stub before, one after registerLifecycle(); callbacks run before take (AD-9 order) (2 lenses) → fixer 6
- [minor] startHidden case sequence and fixture (hidePage throws on a hidden page) (2 lenses) → fixer 7
- [minor] Fresh first-launch deal asserted exactly N → fixer 8
- [minor] R-73 hidePage single-write case names session-place.json → fixer 9
- [minor] Drop "halted-boot" read point (unobservable) → fixer 10
- [minor] R-73 not-on-ticks: epic 6 reruns with the UI interval (Show timer) → fixer 11
- [minor] R-76 "shell measures visible time" sentence mapped to the seeded-growth case → fixer 12
- [minor] References add AD-4, AD-15, spec R-73/R-76/Q-38 → fixer 13
### Default applied (technical)
- Shell Vitest listener access — spy on the window/document stubs' addEventListener, record listeners by type, call them directly; `toThrow` for the throwing cases
- whenVisible before registration — throws synchronously `AD-16 whenVisible() before registerLifecycle()`
### Dropped
- gaveUp → Undo un-finish boundary (adversarial stretch) — accrue ignoring non-playing time is engine R-76 coverage, not this ticket's

## Pass 4 — 2026-09-30
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 1, minor 15, decision-needed 0  |  Dropped in triage: 4
Words (docs): 1340 (6.60 x pass 0; budget 1500)  |  Snapshot: story-lifecycle-and-visible-time-clock.passes/pass4.md  |  Fixer: all 11 applied; no runnable command added; fixtures verified
### Applied
- [major] Verify, isStale own-write cases — no hide-flush case advances time first, so the flush rewrites identical bytes and a flush that never records its text passes (real bfcache restores would halt) → fixer 1
- [minor] Throwing-callback case: "no further wordcell:session write" → fixer 2
- [minor] R-73 not-on-ticks: cut the epic 6 rerun clause (no ref assigns it) → fixer 3
- [minor] registerBeforeHide order case: playing fixture loaded → fixer 4
- [minor] Test ids for Hide flush assigns (R-73), New game (R-74), startHidden (AD-17); AD-17 cited inside the R-73 single-write and R-76 pageshow cases → fixer 5
- [minor] Q-38 halting case: seed session-place.json, replace with session-won.json's text → fixer 6
- [minor] registerLifecycle: the called-twice check runs first (2 lenses) → fixer 7
- [minor] isStale no-halt list: newGame from active and from rejected → fixer 8
- [minor] persisted:false while hidden: the pageHide writes one entry equal to the hide's value (spy) → fixer 9
- [minor] R-76 seeded growth: name session-place.json and the hidden-interval steps → fixer 10
- [minor] Import-cycle note as a requirement on entries 7 and 10 → fixer 11
### Dropped
- Flush leaves feedback untested (adversarial) — a shell Vitest rejected Validate needs a dictionary; left as a stated contract, listed for the build plan
- Flush assignment re-renders the view (stretch) — no change needed
- whenVisible on a visible pageshow (stretch) — dropped in pass 2 as already explicit
- Not-on-ticks binding proof in epic 6 (stretch) — conflicts with fixer 3's cut
