# Review loop — ticket 10.4 build (code mode)
State: done
Range a194a2e..HEAD (build 6dc0018). Pre-loop HEAD 6dc0018, tree 0 = 5fdb059a57b82c93d52fdc0fa25c575f4a87f6e5. Target diff: _bmad-output/implementation-artifacts/review-loop/10-4-build.passes/pass0.diff
Intent: _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-celebration-overlay-entry-plan.md
Depth thorough, max 7.

## Pass 1 — 2026-10-23
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 6, decision-needed 0  |  Dropped in triage: 2 (duplicates)
### Applied (planned)
- [major] overlays.svelte.test.ts ILLEGAL startCelebration table — no arrangement has a hover peek open, so "no state change" is unproven for the one field startCelebration clears (`hoverPeek`) → fixer item 1
- [minor] attached.test.ts — no row that a run's own finish / the cap (plan I/O matrix "Run end") parks done and closes the entry while attached → item 2
- [minor] attached.test.ts — no row that `createCelebration()` stays synchronous after `attachOverlays()` → item 3
- [minor] end-sheet.test.ts celebration Undo row — `focusByPhase` mock ignores its view argument → item 4
- [minor] celebration.svelte.ts `attachOverlays()` — doc comment should say it must be the only registration (a later `onCelebrationRemoved` detaches the singleton) → item 5
- [minor] plan Design Notes "Owner checkpoint items (… not built here …)" — item 4's refinements (a)–(e) are built in this diff → item 6
### Default applied (technical)
- attachOverlays() sole-registration: comment only, keep the ticket's replace semantics
### Dropped
- duplicate: cap/natural-finish attached row (correctness and verification-gap lenses both raised it)
- duplicate: deferred press-timer hand-off (edge and intent lenses both raised it)
### Not applied (outside the code diff; for the owner / entry 5)
- tickets.toml entry 5 lacks the plan's two hand-offs: cancel the controller press before `overlays.startCelebration()` (deferred AD-13 openPeek throw), and start only from the still-pending winning `whenSettled` callback. Carry into entry 5's ticket at its review loop.
Fix landed: hover peek in two ILLEGAL arrangements (mutation hoverPeek-first fails 2 rows, reverted); attached cap row and unattached-after-attach row; focusByPhase mock records its view; attachOverlays() sole-registration comment; plan owner-items heading reworded. Snapshot: tree 1eb785d70613fc6dcf9b4c2232475b02b416f9e3. test 3448 pass, lint pass (1 pre-existing e2e warning), check pass.

## Pass 2 — 2026-10-23
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 3, decision-needed 0  |  Dropped in triage: 0
Target: 10-4-build.passes/pass1.diff (tree 1eb785d, committed as 3d29683)
### Minors not applied
- overlays.svelte.test.ts ILLEGAL rows 'a tail selection' / 'the collapsed end sheet': assert `o.hoverPeek` is 6 after `openHoverPeek(6)` (guards against the arrangement silently no-op'ing) and name the rows "… with a hover peek".
- plan Auto Run Result "Review-log minors" line still counts spine refinements (a)–(e) among items "recorded … for entry 9"; reword to "built here, awaiting entry 9's spine amendment" to match the reworded Design Notes item 4.
- attached.test.ts: no two-run row proving a later run's back/Esc takes its own live `done`, not a stale `pending` (dropping `pending = null` in `removed()` passes every test); add run 1 end() → done → sheet back → run 2 closedByBack → only run 2's done once.

## Result — converged after 2 passes
Final: npm test 87 files / 3448 pass; lint pass (1 pre-existing warning, e2e/end-sheet.spec.ts:857); check pass (0 errors). Pass 1 fixes committed as 3d29683. Unapplied minors: pass 2 list above, plus pass 1's tickets.toml entry-5 hand-off (cancel the controller press before `overlays.startCelebration()`; start only from the still-pending winning `whenSettled` callback).
