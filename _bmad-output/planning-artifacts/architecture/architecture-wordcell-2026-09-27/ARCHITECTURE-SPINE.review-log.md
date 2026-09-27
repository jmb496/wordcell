# Review log — ARCHITECTURE-SPINE.md

Target: `_bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md`
Refs: brief, docs/game-flow-spec.md, DESIGN.md, EXPERIENCE.md, docs/platform-decision.md, CLAUDE.md.
Pre-loop state: the spine after the bmad-architecture reviewer gate (reviews/ holds the four gate reviews).

## Pass 1 — 2026-09-27
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 19, minor 12, decision-needed 1 (after merging 45 raw findings)  |  Dropped in triage: 0 (13 merged as duplicates)
### Applied
- [major] AD-9/AD-16 — clock never started at boot → boot step resumes when visible; resume/pause idempotent
- [major] AD-9/AD-2 — fractional ms → `take` floors with carry; `accrue` throws on non-integer
- [major] AD-7 — Session schema checks unlisted → explicit pre-replay check list
- [major] AD-13 — stale entries after reload broke A-E1 → per-launch id, rewind at launch
- [major] AD-9/AD-12 — hide mid-gesture → hide handler cancels gesture before flush
- [major] AD-13/AD-14 — Undo during winning animation → deferred open re-checks status
- [major] AD-12 — `raw` ambiguous → defined before source suppression
- [major] AD-11 — `bands()` lacked insets; 80 px baseline; scroll-end signal → added
- [major] Conventions/AD-14 — two testids for one element → `card-<id>` + `data-place`
- [major] AD-17 — no kill-without-unload test; local test composition → `Page.crash` variant; scripts defined
- [major] AD-3 — no `inProgress` → added
- [major] AD-1/AD-6 — `history.state` regex vs store field → `scoreHistory` with `status`
- [major] AD-13 — nav (shell) could not reach overlays (ui) → registration inversion
- [major] AD-2/AD-7 — `parseSession` without lang → `parseSession(text, lang)`
- [major] AD-17 vs AD-8 — dictionary in unit tests → repro-case exception
- [major] Epics — font/icons/manifest needed from epic 1 → moved
- [minor] command-table extras, persist() outcome, font check text and pre-mount fatal, DispatchResult finished/unfinished, buried cards, flush scope, OQ-1 pending marks, .gitignore/check/prebuild deltas, timer display, end-sheet back = collapse, restore compare wording, generation staleness
### Decision needed
- AD-7 / spec §2 — redo tail replayed "as committed" vs a pending draft pushed into the redo tail by Undo — proposed default: validate each move at its own `reached`; amend spec §2 (OQ-8)
### Dropped
- none

## Pass 2 — 2026-09-27
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 13, minor 21, decision-needed 1 (after merging 60 raw findings)  |  Dropped in triage: 0 (merged duplicates only)
### Applied
- [major] AD-13/AD-16 — async launch rewind would exit the app → await the rewind popstate, exempt it, then replaceState
- [major] AD-9 — pageshow resumed while hidden → resume only when visible
- [major] AD-13 — nav's own pops ran the before-back hook → own pops only settle the queue
- [major] AD-13/AD-4 — New game / Replay overlay teardown → `overlays.resetForNewSession()`
- [major] AD-14 — winning-animation input consumption → swallow except Undo
- [major] AD-18 — size budget excluded dynamic chunks → counts every chunk except worker files
- [major] AD-16 — boot pushes without user activation → device check + A-A11
- [major] AD-8/AD-16 — stalled dictionary fetch → 30 s timeout to `failed` (A-A12)
- [major] AD-17 — global webServer / testIgnore → three Playwright configs; `prebuild:test`; page-scoped seeding
- [major] AD-7 — persist() rejection silently ignored → rejection to AD-15
- [major] AD-6 — `longestWord` null vs absent → optional, null rejected
- [minor] tile selection on control press, kIfTapped absence, k=0/gaveUp checks, retry 404, dispatch outside active, clock signature, accrue in game over, pickTarget signature, anchor offset, table wording, loaded()/precacheComplete definitions, precache size enforcement, layer wording, pre-store fatal, A-E1/A-E4 refinements as assumptions, end-sheet history rules, OQ preamble, import-specifier scan, displayScore, HISTORY_VERSION bump
### Decision needed
- Scaffold deltas/AD-17/AD-18 — CLAUDE.md Commands/Testing changes and new toolchain (Docker, uv/Python) — proposed default: accept (OQ-9)
### Dropped
- none

## Pass 3 — 2026-09-27
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 4, minor 22, decision-needed 1 (after merging 38 raw findings)  |  Dropped in triage: 0; 1 reclassified (stale-launch pass-through: resolved by following confirmed A-E1 instead of asking)
### Applied
- [major] AD-2 — `setDestinationCount` on an empty column was both no-op and throw → always throw there
- [major] AD-4/AD-15/AD-17 — no pre-load store state → `booting`
- [major] AD-17 — `loaded()`/`current()` shapes ambiguous; init-script order → exact signatures; capture inside `seedStorage`
- [major] AD-11 — slack-first growth wrong under fallback band order → order-independent rule + Vitest case
- [minor] registerBeforeHide inversion, release on `highlighted`, ghost cases, size positive list + dynamic `sw.ts`, GameView absent fields, peek floor, `requestPersistence()`, App.svelte/app.css move, epic split of hook, font-check timeout, non-object JSON, bounded rewind wait, stale-launch ignored per A-E1 (A-A14 retired), scroll-busy backstop, template-literal scan, boot wording, pagehide/pageshow helpers, command-table source of truth, A-A15 routing
### Decision needed
- AD-8 — Reload after a 404 on the old hashed dictionary URL changes a confirmed UX behaviour — proposed default: next Reload tap does `location.reload()`; controlled pages keep the banner until next launch (OQ-10)
### Dropped
- none

## Pass 4 — 2026-09-27
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 6, minor 20, decision-needed 1 (after merging 34 raw findings)  |  Dropped in triage: 0
### Applied
- [major] AD-14 — used WordCell face "not rendered" vs DESIGN hatch; "ghost" term clash → "mirror" (`data-mirror-of`), look per DESIGN state
- [major] AD-14 — buttons not swallowed during the winning animation → one capture-phase document listener
- [major] AD-13/AD-12 — back during a drag double-popped history → before-back cancel closes no entry
- [major] AD-12 — tile drops per slot vs EXPERIENCE tray-band rule → tray band target + `insertionIndex`
- [major] AD-11 — small innerHeight change left leftover stale → band re-layout, w fixed
- [minor] growth remainder and band grouping, hide-event writes, `accrue(…, lang)`, kIfTapped null, dist-smoke test, dictionaryState epic, prefs throw when halted, OQ preamble, app.css path, rewind timeout throws, registerBeforeHide multi-callback under rule 2, A-E1 refinement note, un-finish with collapsed sheet, history record checks, first-paint definition, domain throws, current() prefs, scan scope, size exclusion scope, no-op field scope, role-based locators
### Decision needed
- AD-7/AD-6 — HISTORY_VERSION bump on scoring changes wipes statistics — proposed default: match the undoable record by seed, outcome, activeMs; bump only on shape change (OQ-11)
### Dropped
- none

## Result — capped at 4 passes
Majors per pass: 19 → 13 → 4 → 6 (pass 4 majors were fixed by the final fixer but not re-reviewed). The late majors are interaction-mechanics detail (overlays, gestures, animation input) where the spine meets EXPERIENCE.md; they belong in the epic 4–6 specs and a review of those will catch residue.
