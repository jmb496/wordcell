# Review log — SPEC.md (spec-epic-3-app-shell)

State: pass 3: done (diverging)

Target: SPEC.md with companions rule-coverage.md and build-notes.md. Pass 0: HEAD 8e5462f (uncommitted spec), copies in SPEC.review-log.passes/pass0*.md; words SPEC 2930, rule-coverage 1868, build-notes 1504 (total 6302). Depth thorough, max 7.

## Pass 1 — 2026-09-30
Reviewers: builder's reading, edge-case, adversarial, ref alignment  |  Findings: major 11, minor 22, decision-needed 0  |  Dropped in triage: 17 (duplicates across lenses)
### Applied
- [major] CAP-3 / rule-coverage R-73 — Validate dispatch save untestable before CAP-8 → fixer item 1
- [major] CAP-7 — AD-13 reload cases wrong with a History notice re-pushed at boot → item 2
- [major] CAP-1 / build-notes — type-level index exactness impossible → item 3
- [major] CAP-5, CAP-6, rule-coverage AD-15 row — Replay and prefs-while-halted have no epic 3 control → item 4
- [major] build-notes CAP-6 — Q-39 write-back owned by the game store, against AGENTS single owner → item 5
- [major] Success signal / Constraints — "every app-shell sentence" P3 contradicts rule-coverage's P4–6/P7 rows → item 6
- [major] CAP-6 — AD-7 absent history not written until first change missing → item 7
- [major] Why — B10 claimed, not absorbed → item 8
- [major] CAP-4 — storage listener timing and a halt while booting unspecified → item 9
- [major] CAP-4/CAP-5 — bfcache-restored page misses storage events, may overwrite another window's save → item 10
- [major] build-notes CAP-4 — store calls overlays.resetForNewSession (shell importing UI) → item 11
- [minor] fixtures unnamed (history unknown version, prefs, won-recorded history, replay-failed redo-tail, version-unreadable) → item 12
- [minor] items 13–30 (see fixer list)
### Default applied (technical)
- index exactness → Vitest over TS compiler API getExportsOfModule vs a literal list
- Replay / prefs-while-halted → shell Vitest (S) now, Playwright epic 6
- Q-39 rollback → history.svelte.ts returns a rollback the store calls before rethrow
- storage listener → registered at store creation; halt while booting wins over the load
- bfcache → pageshow persisted compares wordcell: keys with last read/written text, differ → halted (Q-38 message)
- E8 → >16 ms recorded as a flag for epic 7, no optimisation in epic 3
- rune tests → Vitest resolve.conditions ['browser']
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- duplicates of the above across the four lenses (17)
Fixer: all 30 applied; item 3 test placed in src/architecture.test.ts (engine tests may not import typescript). Words (docs): total 7666 (1.22 x pass 0)  |  Snapshot: SPEC.review-log.passes/pass1*.md

## Pass 2 — 2026-09-30
Reviewers: fix diff, edge-case, adversarial, ref alignment  |  Findings: major 7, minor 20, decision-needed 0  |  Dropped in triage: 12 (duplicates)
### Applied
- [major] CAP-8/CAP-10 — hidden-launch dictionary gate relied on rAF; Playwright's startHidden keeps rAF running → item 1 (store whenVisible hook)
- [major] CAP-5 bfcache test — live page halts from the storage event first; test cannot discriminate → item 2
- [major] CAP-4/5 bfcache — no owner for per-key last-read/written text of history and prefs → item 3
- [major] CAP-4 Q-38 — second page's "own boot write" never happens → item 4
- [major] CAP-4 — halted has no cause; who renders the another-window message, which wins → item 5
- [major] CAP-10 — restore comparison contradicts absent-key reporting → item 6
- [major] Assumptions — resolve.conditions tool claim unverified and doubtful → item 7
- [minor] items 8–27
### Default applied (technical)
- whenVisible() from the store's own listener; main awaits it after the double rAF
- each key owner keeps lastText and isStale(); pageshow persisted asks all three
- haltCause 'fatal' | 'another-window' getter beside the AD-4 state; fatal always wins; spine note
- rune testing: unverified; first shell test is a reactivity probe, fallback a client-environment Vitest project
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- duplicates across lenses (12)
Fixer: all 27 applied; rune reactivity and compiler-API timing marked unverified; error handlers kept in main.ts (AD-1 file rule). Words (docs): total 8435 (1.34 x pass 0)  |  Snapshot: SPEC.review-log.passes/pass2*.md

## Pass 3 — 2026-09-30
Reviewers: fix diff, edge-case, adversarial, ref alignment  |  Findings: major 8, minor 22, decision-needed 0  |  Dropped in triage: 3 (duplicates: AD-17 boot compare ×2, Q-38 page-1 fixture ×2)
### Open majors (not fixed; stopping rule)
1. CAP-10 / AD-17 — restore suite must assert all three `loaded()` fields deep-equal `JSON.parse(__wordcellBoot[...])` (null when absent), plus the snapshot rule; add the AD-17 snapshot amendment to Spine notes.
2. CAP-1 B6 — the command TABLE allows only no-op/throw; land B6 as a named test right after the table (`Q-31 addFreeLetter with index: undefined appends like an absent index`), deep-equal to the absent-index result.
3. CAP-2 / E5 — `serialize.test.ts:1372` accepts a won record with finalScore −5; make that accepted case `gaveUp` and point won-negative at the new rejection fixture (allowed change).
4. Storage spies/throwers (R-84 same task, Q-39, CAP-4 setItem throw, CAP-5 exactly-one-write) — arm with `page.evaluate` after boot (`current().kind !== 'booting'`), patching `Storage.prototype.setItem`; `storage.ts` calls `localStorage.setItem` at call time.
5. CAP-6 / AD-7 absent history — minimal board cannot dispatch from a fresh launch: seed `session-place.json` alone (Undo, Redo, Confirm → history absent) and `session-gave-up.json` alone (New game → absent); fresh launch asserts absent after load.
6. rule-coverage §2 replay abort — add a `replay-failed` P3 case from a replay-rule fixture (e.g. `session-invalid-r13-*` or `session-invalid-r50-*`); relabel s2-last-only as the pre-replay AD-7 variant.
7. build-notes CAP-6 Q-39 — `reconcile` returns a rollback only when it wrote (no-op otherwise and always while unreadable); shell Vitest: non-finishing dispatch with a throwing Session write touches no history key.
8. CAP-8 timeout — timer and abort cover `fetch` plus `response.text()`; shell Vitest with a never-closing body → `failed` after 30 s fake time.
### Minors (unapplied)
- E8 measurement mechanics (seed session-won, preview of dist-test, Undo×8/Redo×8, Event Timing entries); drop "long scripted game".
- CAP-1 timing figure "~0.75 s" mark unverified.
- CAP-4 intent wording: "a window that sees another live window write stops saving".
- Q-38 page 1 fixture: `session-place.json`, dispatch Undo in page 2.
- CAP-5: `pageShow({persisted:false})` while hidden does not resume (AD-17 "resume only when visible").
- CAP-9: `--wc-reduced` Playwright case with `emulateMedia({ reducedMotion })`.
- CAP-10: "reloaded without a hide" still fires pagehide; kill variant is the no-flush proof.
- CAP-10: add `session-below-committed-last.json` restore (Q-41).
- Constraints: History-notice/unreadable-history flows count as §2 rejection flows and may seed `history-invalid-*` (default `history-invalid-version-unknown.json`).
- §2 "replay never consults the dictionary": seed session-place, Undo, Redo with the route failing.
- CAP-9 New game case: `session-gave-up.json` + `prefs-non-default.json`.
- CAP-2 E4 code: separate `ad7-active-ms-headroom` after `ad7-active-ms`, fixture `session-invalid-ad7-active-ms-headroom.json`.
- CAP-4: no dictionary fetch while halted; halted during boot: load still parses, then boot stops (no listeners, pushes, mount, dictionary).
- E7 first cut: module-load `createSession(1)` is a transitional exemption from AD-4 `booting`, removed by CAP-3.
- Standalone Blocking message renders reactively from `haltCause` so a later fatal replaces another-window before mount.
- A-A11 not proven by `goBack()`; add "back closes a launch-pushed History notice" to epic 7 device checks.

## Result — diverging at pass 3 (fix: test-flow and fixture detail per P3 case belongs in the ticket entries and plans)
Majors per pass 11 → 7 → 8, no decision-needed. The rise comes from reviewers reaching test mechanics on the minimal board, not from an unclear ref. The eight open majors above and the minors are carried into the epic 3 tickets.toml entries at inception (B10: each entry names its sentence → test ids), where each ticket's own review loop hardens them before build.
