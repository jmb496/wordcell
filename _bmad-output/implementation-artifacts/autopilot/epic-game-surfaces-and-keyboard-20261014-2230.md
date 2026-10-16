# Autopilot digest — epic-game-surfaces-and-keyboard (20261014-2230)

Epic: epic-game-surfaces-and-keyboard (epic 6)
Branch: epic-6-surfaces
Start commit: 4d4e5dd
Authorisation: owner-authorised autopilot, 2026-09-28 (methodology § Autopilot). Local commits only, never pushed.

## 6.1 Surface foundation and the one New game function — stopped
What it adds: the shared building blocks for every menu, panel and confirm dialog, plus the rule that New game stays one function.
Ticket review: 3 passes, diverging (majors 11, 4, 5); no decision-needed items, but three late majors touch spec/spine intent, so the run stopped (rule 1).
Build: not started
Ref to fix upstream:
- Undo/Redo reachability under menu, panels and confirms → build-notes.md, Per-surface behaviour table ("Bars live" column says "per EXPERIENCE.md" instead of saying only the end sheet leaves the bars live); a pass-2 fix added an unreachable Undo-over-a-surface path and should be reverted to the by-construction sentence in the ticket.
- Reduced-motion mechanism for CSS-driven surface transitions → ARCHITECTURE-SPINE.md AD-14 / AGENTS.md motion rule (`--wc-base-ms`) versus `duration('overlay')` 120 ms in src/ui/motion.ts.
- open(<new id>) against peek, hover peek, tile/tail selection and WordCell view on top; historyNotice's legal tops; transition rules with no test → ticket 6.1 Guards and Tests; ARCHITECTURE-SPINE.md AD-13.
Close-out docs: none

## Resume 2026-10-15 — 6.1 ticket review, pass 4 — stopped again
After the owner recorded F6-F8 in the epic SPEC, the ticket review resumed for pass 4 (majors 11, 4, 5, 8; diverging again). No fixes applied in pass 4. Build: not started.
Spec/spine-intent late majors (stop rule 1):
- F7 wording: `--wc-reduced` is a 0/1 shell flag and `REDUCED_FADE_MS` is a UI constant the shell cannot import; the spec/AD-14 must name a UI-side CSS property fed from the exported constant → SPEC F7, AD-14, motion.ts.
- Bars (Undo/Redo) under menu/panel/dialog are covered but still reachable by Tab+Enter with [endSheet, statistics]; build-notes "Bars live: per EXPERIENCE.md" must say the top bar is inert unless the top is empty/endSheet/wordcellView → build-notes.md per-surface table.
- F8 opener sequence (clear, pop, push) has no owning ticket in 6.1; entry 10 owns the closeView-first helper → SPEC F8, tickets.toml entries 1, 2, 10.
Ticket-level majors (not spec intent, left for the fix pass): act() scan vs Dialog/Sheet, existing overlays tests vs new pair guard, newGame scan wording, depth matrix, 360x320 check without mounted page.
Close-out docs: none

## 6.1 Surface foundation and the one New game function — done
What it adds: the shared building blocks every menu, panel and confirm dialog will use (open/close rules, sheet/panel/dialog shells, the `openSurface` helper), and the rule that New game stays one function.
Ticket review: 7 passes total (3 before, 4 after your F6-F8 answers), capped (majors 11, 4, 5, 8, 6, 2, 1); nothing needed your input.
Build: built; commit bfed752
Code review: thorough, 3 passes, converged (majors 5, 1, 1); fixes in 3638e0e, 03824f1
Tests: all passing (one drag test failed once in the first full run, passed alone and in the full rerun: treated as a flake), screenshots passed
Ref to fix upstream: Motion paragraph of the ticket (reduced-motion CSS branch gating check) → ticket 6.1 Description > Motion; technical, not spec intent.
Tokens: 6.7M input-equivalent (code review 33%, build 30%, ticket review 25%, other 9%, orchestrator 3%)
Worth knowing: open item carried to a later ticket or the refactor sweep: `openSurface('resetConfirm')` over the History notice with a sticky WordCell view or tail selection beneath throws AD-13 from its clearing step (latent, no opener calls it that way yet; default fix: skip clearing when the top is the History notice, plus a test). Flaky drag test: e2e/success-signal.spec.ts "the same move by drag" (android).
Close-out docs: SPEC.md F6, F7, F8 (epic 6 spec) already hold your 2026-10-15 answers; no other owner doc changes.

## 6.2 Menu sheet, menu button and version footer — stopped (rule 1, owner decision)
What it adds: the ☰ menu button and the menu sheet (New game, Replay this deal, Give up) with the version footer.
Ticket review: 3 passes, converged (majors 8, 1, 0); nothing needed your input
Build: built; commit f924833
Code review: thorough, 2 passes, converged (majors 1, 0); 1 fix applied (WIP dacf5ef); 1 decision for the owner
Tests: build and review runs passed; full test:all and screenshots not yet run (stopped before Step D)
Ref to fix upstream: none
Tokens: 5.2M input-equivalent (build 38%, ticket review 35%, code review 20%, other 4%, orchestrator 2%)
Worth knowing: decision pending — with a WordCell view open (or a peek), the view's scrim covers the top bar, so a real tap on ☰ cannot reach it, though the ticket and SPEC F6 say the top bar stays live. Proposed default: leave the layering, amend the ticket wording. Alternative: raise ☰ above the scrim (layering change plus real-tap e2e tests).
Close-out docs: none yet

## 6.2 Menu sheet, menu button and version footer — done
What it adds: the ☰ menu button and the menu sheet (New game, Replay this deal, Give up) with the version footer.
Resumed 2026-10-15 after the owner's answer (option A): the menu button stays covered by an open WordCell view; the player closes the view first. Recorded in the ticket, SPEC F6 and build-notes.
Ticket review: 3 passes, converged; nothing needed your input
Build: built; commit f924833
Code review: thorough, 2 passes, converged (majors 1, 0); 1 fix applied (WIP dacf5ef)
Tests: all passing, screenshots passed (14)
Ref to fix upstream: none
Tokens: resume session 0.1M input-equivalent
Worth knowing: unapplied minor: the menu inert test's Enter probe after blur cannot fail alone (the closest('[inert]') assertion carries the rule).
Close-out docs: SPEC.md F6 (epic 6 spec) already holds the 2026-10-15 owner answer (☰ covered by a sticky WordCell view); EXPERIENCE.md/DESIGN.md Elevation wording on "top bar stays live" for the WordCell view may need the same note at the retro.

## 6.3 Confirm dialogs, New game and Replay — done
What it adds: New game and Replay this deal (menu and action bar) now ask "Keep playing?" first while a game is in progress; a fresh deal or finished game acts at once.
Ticket review: 5 passes, converged (majors 10, 8, 2, 2, 0); nothing needed your input
Build: built; commit d6dc6f0
Code review: quick-equivalent single pass of the thorough loop, 1 pass, converged (major 0); 0 fixes applied (depth thorough: ticket risk medium)
Tests: all passing, screenshots passed (16 passed, 2 skipped)
Ref to fix upstream: none
Tokens: 5.8M input-equivalent (ticket review 58%, build 25%, code review 10%, other 4%, orchestrator 2%)
Worth knowing: unapplied ticket-review minors (tests line "five" vs six strings; tickets.toml entry 3 wording) were given to the build; entry-3 text in tickets.toml may still need syncing at publish.
Close-out docs: none

## 6.4 Preferences panel and the top-bar timer — done
What it adds: a Preferences panel (animation speed Fast/Normal/Slow, Show timer switch) reachable from the menu, and an optional timer in the top bar that ticks while you play and freezes when the game ends.
Ticket review: 5 passes, converged (majors 10, 8, 7, 1, 1); nothing needed your input
Build: built; commit 4170f94
Code review: thorough (ticket risk medium), 2 passes, converged (majors 1, 0); fixes applied in 52a2e7b (extra e2e/unit coverage incl. the live playing-to-Game-over timer step)
Tests: all passing (630 e2e), screenshots passed (18 passed, 4 skipped)
Ref to fix upstream: none
Tokens: 6.1M input-equivalent (ticket review 50%, build 25%, code review 18%, other 4%, orchestrator 2%)
Worth knowing: nothing
Close-out docs: none

## 6.5 Statistics panel, history flag and menu dot — stopped (owner decision needed)
What it adds: a Statistics panel (games played, won, given up, best and average score, longest word) and an error dot on the menu button when saved history is unreadable.
Ticket review: 5 passes, converged (majors 8, 5, 4, 2, 0); one item needs your input (below)
Build: not started
Worth knowing: the decision concerns only how the longest word is displayed.
Decision: how to show the letter count beside the longest word on its tile. Proposed default: the uppercase word as the tile value, with a small secondary-ink caption "8 letters" beneath it (text from text.ts). Effect: only what the player reads on that tile; no rule or scoring change.

## Resume 2026-10-15 — 6.5 build and code review — stopped (rule 1, owner decision)
Owner's longest-word answer applied; ticket built (44a6c0d) and code-reviewed (thorough, 2 passes, converged, majors 2, 0; fixes in 0a422e8). Not run: Step D (test:all, screenshots, mark done).
Decision: wording of the Statistics labels the builder chose (Games played, Games won, Games given up, Best score, Average score, Longest word, "Close statistics", empty line "Finish or give up a game to see statistics here."); they are not in the EXPERIENCE.md message catalogue. Proposed default: keep. Effect: only what players read on the panel.
Close-out docs: EXPERIENCE.md message catalogue ← Statistics panel strings once approved (owner, pending); SPEC.md F6 and EXPERIENCE/DESIGN Elevation note as above.
Tokens: 2.5M input-equivalent (build 75%, code review 15%)
Resume: reply with your choice or "default", record it in the ticket Notes, rerun loop.sh; it resumes at Step D.

## 6.5 Statistics panel, history flag and menu dot — done
What it adds: a Statistics panel (games played, won, given up, best and average score, longest word with its letter count) and an error dot on the menu button when saved history is unreadable.
Ticket review: 5 passes, converged; longest-word wording answered by you (2026-10-15)
Build: built; commit 44a6c0d
Code review: thorough, 2 passes, converged (majors 2, 0); fixes in 0a422e8; Statistics labels kept as built (owner, 2026-10-15)
Tests: all passing, screenshots passed (22 passed, 8 skipped)
Ref to fix upstream: none
Tokens: resume session 0.1M input-equivalent (orchestrator)
Worth knowing: unapplied minors in review-loop/6-5-build.md § Result (extra e2e assertions for the dot and focus return; a test title that overstates).
Close-out docs:
- EXPERIENCE.md message catalogue ← Statistics panel strings and longest-word "8 letters" caption (owner, 2026-10-15)
- SPEC.md F6 already holds the 2026-10-15 answer; EXPERIENCE/DESIGN Elevation note on the WordCell view may need the same

## 6.6 End sheet: result, collapse, Give up and relaunch — stopped (owner decision needed)
What it adds: the end-of-game sheet (result, score, band, longest word, words placed, Replay this deal and Statistics buttons), collapsing to a bar, Give up and relaunch into a finished game.
Ticket review: 4 passes, converged (majors 10, 5, 2, 0); nothing needed your input
Build: built; commit dbbf83a
Code review: thorough, 4 passes, converged (majors 6, 1, 2, 0); fixes in 02e4739, 2b42c05, 8135ba4; one wording decision open
Tests: not run (Step D not reached)
Ref to fix upstream: none
Worth knowing: ticket-review minors carried to the build were handled in the plan.
Decision: wording the builder chose that is not in the EXPERIENCE.md catalogue: handle name "Collapse result", bar name "Show result: …", labels "Longest word" and "Words placed". Proposed default: keep as built. Effect: only what players and screen-reader users read on the end sheet and its collapsed bar; no rule or scoring change.
Close-out docs: EXPERIENCE.md message catalogue ← end-sheet strings once approved (owner, pending).
Resume: reply with your choice or "default", record it in the ticket Notes, rerun loop.sh; it resumes at Step D (test:all, screenshots, mark done).

## 6.6 End sheet: result, collapse, Give up and relaunch — done
What it adds: the end-of-game sheet (result, score, band, longest word, words placed, Replay this deal and Statistics buttons), collapsing to a bar, Give up and relaunch into a finished game.
Ticket review: 4 passes, converged; nothing needed your input
Build: built; commit dbbf83a
Code review: thorough, 4 passes, converged (majors 6, 1, 2, 0); wording kept as built (owner, 2026-10-15)
Tests: all passing, screenshots passed (26 passed, 8 skipped)
Ref to fix upstream: none
Tokens: resume session 0.2M input-equivalent (orchestrator)
Worth knowing: accepted deviation: the win-by-Confirm test starts from a won session plus Undo, and bands 1-5 are covered by a unit test since no fixture reaches them. Unapplied minors are listed in review-loop/6-6-build.md § Result.
Close-out docs:
- EXPERIENCE.md message catalogue ← end-sheet strings "Collapse result", "Show result: …", "Longest word", "Words placed" (owner, 2026-10-15)

## 6.7 End sheet: history-unreadable block and Reset history — stopped (decision needed)
What it adds: the end-sheet block shown when the score history can't be read, with Reset history, and the single reassurance line afterwards.
Ticket review: 3 passes, converged (majors 3, 1, 0); one item needs your input (below)
Decision: how long should "This game wasn't added to your statistics." show after Reset history? Proposed default: only on the sheet that was open when Reset ran from the sheet's block or the notice over it (kept through collapse/expand); gone after a reload; Undo then a new finish records normally with no line; a Reset from the Statistics panel leaves neither block nor line. Effect: the player sees the reassurance only right after resetting from the finished-game sheet.
Resume: reply with your choice or "default", record it in the ticket Notes, rerun loop.sh; it resumes at Step A (review log has a Result) then build.
Close-out docs: none yet

## Stopped — usage limit (login expired, not a real limit)
Ticket 6.7, Step B (build): the build step ended at 09:28 with "Failed to authenticate: OAuth session expired and could not be refreshed" (owner logged in again afterwards). The plan is `in-progress` and the 16 uncommitted files are this build's own. Resume per bmad-build-auto's resume rule; do not discard them.

## 6.7 End sheet: history-unreadable block and Reset history — done
What it adds: the end-sheet block shown when the score history can't be read, with Reset history, and the single "This game wasn't added to your statistics." line afterwards, kept only on the sheet open at the time of the reset (owner decision, 2026-10-15).
Ticket review: 3 passes, converged; one item needed your input, answered 2026-10-15 (default)
Build: built; commit 48c74ab (resumed after the login-expiry stop)
Code review: thorough, 2 passes, converged (majors 1, 0); 1 fix pass applied (929fd67)
Tests: all passing, screenshots passed (30 passed, 8 skipped)
Ref to fix upstream: none
Tokens: 2.3M input-equivalent (code review 46%, build 34%, other 16%, orchestrator 4%)
Worth knowing: nothing
Close-out docs:
- EXPERIENCE.md State Patterns / message catalogue ← unrecorded-game line shows only on the sheet open at reset, gone after reload (owner, 2026-10-15)

## 6.8 Pending-draft line — stopped
What it adds: a small grey line in the tray, `Undone: BAKED · Redo brings it back`, shown while an undone word can be redone.
Ticket review: 3 passes, diverging; majors 6, 2, 3; no decision-needed items, but one late major touches design intent (below)
Build: not started
Ref to fix upstream:
- DESIGN.md Tray band ("never wraps, word part ellipsizes first") and ticket Acceptance Criteria → does a 10-letter word have to fit with the full suffix visible at the narrowest width (reviewer default: yes, line never overflows or wraps, add a narrow-width check)? Flagged spec_or_spine_intent.
- DESIGN.md Tray band (idle line composition) → text.ts `pendingDraft` returns parts {prefix, word, suffix} vs one string; technical, default stated.
- Ticket 6.8 Placement → names a Tray.svelte "Idle branch" that does not exist; the line is a sibling branch inside `.word-line`; technical.
Worth knowing: pass 3 fixes were not applied; unapplied minors are in the review log.

## 6.8 Pending-draft line — done
What it adds: a small grey line in the tray, `Undone: BAKED · Redo brings it back`, shown while an undone word can be redone; a long word is cut with "…" only if it cannot fit, the suffix always stays (owner, 2026-10-15).
Ticket review: resumed after your answer; 4 passes total, converged (majors 6, 2, 3, 0); nothing further needed your input
Build: built; commit 0d28628
Code review: quick, 2 passes, converged (majors 2, 0); 1 fix applied (aa867fb: gap before "·" widened)
Tests: all passing, screenshots passed (32 passed, 8 skipped)
Ref to fix upstream: none
Tokens: 2.9M input-equivalent (build 51%, ticket review 21%, code review 17%, orchestrator 6%)
Worth knowing: the code review widened the gap before "·" (padding 0.25em) after the build's own screenshot showed it cramped; the two new baselines (board-idle-pending-draft android/desktop) were not regenerated and still passed, so they show the old, narrower gap; regenerate them next time baselines are refreshed. Playwright tests use the existing TAN session rather than BAKED. One minor unapplied: tidy a toEqual in the 360 px test.
Close-out docs:
- EXPERIENCE.md State Patterns (Idle/pending draft row) and DESIGN.md Tray band ← at 360 px the line never wraps or overflows, suffix always fully shown, word ellipsizes only if it cannot fit (owner, 2026-10-15)

## 6.9 How to play panel — stopped
What it adds: a "How to play" panel in the menu explaining the rules, including the six rating bands.
Ticket review: 4 passes, converged (majors 8, 4, 1, 0); one item needs your input (below)
Build: not started
Decision for you: should the panel list only the six band names (ascending), or also each band's score threshold? Proposed default: names only, as the ticket says. Effect: names only shows which ratings exist without numbers to aim for; thresholds add those numbers.
Ref to fix upstream: none
Tokens: Tokens: 2.4M input-equivalent (ticket review 96%, orchestrator 3%, other 1%); orchestrator peak context 52k
Worth knowing: the review's last log update is committed with this stop.
Close-out docs: none yet

### 6.9 resumed (session 2026-10-15)
Owner answered the band question: names plus scores (commit 9def06b). Ticket review stays converged; resuming at Step B.

## 6.9 How to play panel — done
What it adds: a "How to play" panel as the last Menu row: eight short sections (goal, table, a move, undo/redo, empty columns, scoring and bands, a worked example drawn with cards, controls). The bands list shows all six names with the score each needs (owner, 2026-10-15).
Ticket review: 4 passes, converged; the one decision was answered by the owner before the build
Build: built; commit a8c7a07
Code review: thorough, 2 passes, converged (majors 3, 0); 1 fix commit (fdcf981, tests only)
Tests: all passing, screenshots passed (33 passed, 9 skipped)
Ref to fix upstream: none
Tokens: 2.9M input-equivalent (build 55%, code review 39%, orchestrator 4%); orchestrator peak context 56k
Worth knowing: the build changed the menu e2e row-height check to `toBeCloseTo(52, 1)` (it measured 52.00003 about half the time; cause not found). The panel text (rules wording, Q-12 empty-column rule) is on the ticket's owner text-review checklist; the Keyboard table lists `?` and Esc behaviour that ticket 6.10 implements.
Close-out docs:
- EXPERIENCE.md Rating bands / How to play content ← How to play lists band names plus scores (owner, 2026-10-15)

## 6.10 Keyboard: overlay keys, F39 and stale tile selection — stopped
What it adds: keys M, N, ?, Esc, Z, Y open and close the menu, new-game dialog and panels, undo and redo, and closing a view or selection first (F39).
Ticket review: 3 passes, converged; nothing needed your input
Build: built; commit 82cfde1
Code review: thorough, 2 passes, converged (majors 3, 0); fixes in ddd5f19; one decision for you (below)
Tests: test, lint and check pass in the review loop; the full `test:all` and screenshots not yet re-run by the autopilot
Ref to fix upstream: none
Worth knowing: spine AD-13 does not yet mention `nav.settled`/`whenSettled` (owner doc, apply at retro). Two Playwright cases are unit-tested only (M during a touch peek, Undo disabled with a sticky view open: no fixture).
Decision needed: the Validate, Confirm and Flip buttons now also close an open sticky word view or peek, and clear a tail selection, before acting, like Undo, Redo and the menu. Default: keep. If you refuse, those three buttons would leave the view open or risk a stale-selection error.
Close-out docs: none

### 6.10 resumed (session 2026-10-15)
Owner decision recorded (commit cc889c0): Validate, Confirm and Flip close an open word view first (keep). Resumed at Step D.

## 6.10 Keyboard: overlay keys, F39 and stale tile selection — done
What it adds: keys M, N, ?, Esc, Z, Y open and close the menu, new-game dialog and panels, undo and redo; closing a view or selection first (F39).
Ticket review: 3 passes, converged; nothing needed your input
Build: built; commit 82cfde1
Code review: thorough, 2 passes, converged (majors 3, 0); fixes in ddd5f19; the one decision was answered by the owner
Tests: all passing (`test:all`), screenshots passed (33 passed, 9 skipped)
Ref to fix upstream: none
Tokens: 0.1M input-equivalent (this session)
Worth knowing: spine AD-13 does not yet mention `nav.settled`/`whenSettled`. Two Playwright cases are unit-tested only. Baselines board-idle-pending-draft (android/desktop) predate the wider gap before "·" but still pass; regenerate at the next refresh.
Close-out docs:
- ARCHITECTURE-SPINE.md AD-13 ← mention `nav.settled`/`whenSettled` (build finding)
- EXPERIENCE.md State Patterns (Idle/pending draft row) and DESIGN.md Tray band ← at 360 px the line never wraps or overflows (owner, 2026-10-15)

## 6.11 Keyboard: board keys, focus moves and tooltips — stopped
What it adds: the board keys (1–8, arrows, Space, Enter, +/-, F), focus that follows the game phase, a visible focus ring and the key shown in desktop button tooltips.
Ticket review: 7 passes, converged (majors 10, 10, 3, 2, 2, 1, 0); one decision for you (below)
Build: not started
Ref to fix upstream: none
Decision needed: can a keyboard player put focus directly on any card of a fanned column, or only on one card per column (the bottom or last-focused card; the tail's top card after a key selection)? Proposed default: one Tab stop per non-empty column. Effect: a keyboard or screen-reader user cannot focus a buried card directly; they reach it by selecting with the number keys and up/down. Play stays fully possible.
Close-out docs: none yet

### 6.11 resumed (session 2026-10-15, owner decision on column focus stops recorded: one Tab stop per column)

## 6.11 Keyboard: board keys, focus moves and tooltips — stopped
What it adds: the board keys (1–8, arrows, Space, Enter, +/-, F), focus that follows the game phase, a visible focus ring and key hints in desktop tooltips.
Ticket review: 7 passes, converged; the one decision was answered by the owner
Build: built; commit 4bbf09d
Code review: thorough, 5 passes, converged (majors 4, 1, 2, 1, 0); fixes in WIP commits c1b964c..bea1a7a plus the log; one decision for you (below)
Tests: test, lint and check pass in the review loop; the full `test:all` and screenshots not yet run by the autopilot (Step D not started)
Ref to fix upstream: none
Decision needed: the focus ring on column cards is drawn inside the card (2px in), whereas DESIGN.md says a 2px ring at a 2px offset with a table-colour gap. Default: keep the inside ring. Effect: the ring looks slightly tighter than the design doc but is not hidden by the overlapping neighbour cards.
Close-out docs:
- DESIGN.md focus ring ← if the inside ring is kept, the doc's offset/gap wording changes (pending owner answer)
Tokens: Tokens: 12.7M input-equivalent (build 54%, code review 43%, orchestrator 1%, other 1%); orchestrator peak context 56k

### 6.11 resumed (session 2026-10-15, owner decision on card focus ring recorded: keep the inside ring)

## 6.11 Keyboard: board keys, focus moves and tooltips — done
What it adds: the board keys (1–8, arrows, Space, Enter, +/-, F), focus that follows the game phase, a visible focus ring and key hints in desktop tooltips.
Ticket review: 7 passes, converged; the one decision was answered by the owner
Build: built; commit 4bbf09d
Code review: thorough, 5 passes, converged (majors 4, 1, 2, 1, 0); fixes in WIP commits c1b964c..bea1a7a; the focus-ring decision was answered by the owner (keep inside)
Tests: all passing (`test:all`), screenshots passed (37 passed, 13 skipped)
Ref to fix upstream: none
Tokens: Tokens: 0.1M input-equivalent (orchestrator 58%, other 42%); orchestrator peak context 51k
Worth knowing: unapplied minors from the review log: static mirrors not asserted tabindex-free; Enter/Space on column cards in Composing/Place only unit-tested with a mocked controller; pointer press natively focuses a card; Space on a WordCell with an open view closes and reopens it.
Close-out docs:
- DESIGN.md focus ring ← card focus ring is drawn inside the card edge (2px in), not at a 2px offset with a gap (owner, 2026-10-15)

## 6.12 Winning guard: the end-sheet half — stopped
What it adds: Undo (button or key) during the win animation now cancels the pending end sheet, and every other input only finishes the animation before the sheet opens.
Ticket review: 5 passes, converged; nothing needed your input
Build: built; commit 4a93645
Code review: thorough (ticket risk high), 2 passes, converged; fixes applied in 248b166
Tests: `npm run test:all` FAILED at the dev-server e2e: [android] menu.spec.ts:39 "AD-13 ☰ opens the menu…" expected a menu row height of exactly 52 and got 51.99997 (sub-pixel layout; that spec already special-cases the "How to play" row). 880 passed, 825 skipped after it. Biome also reports 1 formatting warning (src/ui/motion.test.ts:691), exit 0. Screenshots not run (stopped before).
Ref to fix upstream: none
Worth knowing: the menu spec and menu files are not touched by this ticket (diff is guard, flip, motion, main, new-game and tests), so this looks like a pre-existing flaky pixel check, but I did not confirm it by rerunning. Step B prompt did not pass on two unapplied ticket-review minors (releaseHold wrapper test; SPEC CAP-5 "(none: opens at once)" edit); check the plan covers them.
Close-out docs: none new from this ticket (SPEC.md CAP-5 clause may need the F23 edit above)
