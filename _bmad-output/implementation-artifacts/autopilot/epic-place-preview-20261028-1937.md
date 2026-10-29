# Epic autopilot run 20261028-1937 — epic-place-preview

Epic: Place preview of WordCell tops (epic 11), `_bmad-output/initiative-wordcell-v1/epic-place-preview/`
Branch: `place-preview`
Start commit: 6534769
Authorisation: owner-authorised autopilot mode, 2026-09-28 (docs/development-methodology.md § Autopilot); one-ticket sessions via loop.sh.

Startup note: no handoff file yet (first session of this epic). A stale pid file `.autopilot/20261020-0925/10.6-C3.done.pid` (no live process) was deleted.

## 11.1 Engine place preview on CellView — done
What it adds: the game engine now works out, while a word is being placed, what each affected WordCell will look like after Confirm (its new top card and card count), so the next ticket can show it on screen. Nothing visible changes yet.
Ticket review: 3 passes, converged; nothing needed your input
Build: built; commits 3ba74f5
Code review: quick (risk low, no high or medium build finding left), 1 pass, converged; 0 fixes applied
Tests: all passing (`npm run test:all` exit 0), screenshots not needed (no UI change: only `src/engine/view.ts` and its test)
Ref to fix upstream: none
Tokens: 5.0M input-equivalent (ticket review 54%, build 32%, code review 7%, orchestrator 5%, other 3%); orchestrator peak context 70k
Worth knowing: the hardened ticket's wording drifted from its `tickets.toml` entry 1 (description, verify, references: commit path `commitMove`, R-50/R-52, the present-iff-changed property, won/gaveUp); the ticket file is the record, the toml entry was left as planned (sync at the retro if wanted). One review-log minor not applied by the build: adding R-65 to the ticket's References line (the build never edits ticket files; R-65 is covered by the cell's card list staying the current one). The how-it-will-look check for a used target whose only card is the used one runs on a test-built position, since no fixture has that shape.
Close-out docs: none


Session note (2026-10-28, session for 11.2): the handoff still named 11.2 as next with Step A not started, but the ticket files showed a partial review log (4 passes committed, no `## Result`) and an empty `11.2-A-attempt1.log` from an earlier session that ended without a handoff or digest entry; the files won and Step A was resumed. No pid files were live.

## 11.2 WordCell row place preview — stopped
What it adds: while placing a word, each WordCell the word changes will show how it looks after Confirm: the new top card, its card count and a small ★ mark.
Ticket review: 5 passes, converged (majors 6, 3, 2, 1, 0); one question needs your input (below)
Build: not started
Code review: not started
Tests: not run (nothing built)
Ref to fix upstream: none
Tokens: 2.6M input-equivalent (ticket review 95%, orchestrator 3%, other 1%); orchestrator peak context 57k
Worth knowing: 12 small review findings were left for the build's plan (listed in the review log), e.g. call the ★ mark a "pill" not a "box", the fixture note claiming a used one-card cell needs two earlier words is wrong (a two-card word like `qua` is enough), and the test-update search should also catch Place count-badge checks (`e2e/place.spec.ts:518`).
Close-out docs: none yet

## Stopped — decision needed (stop rule 1)
Ticket 11.2, Step A (ticket review). Question for Jared: on the narrowest phone width (360 px, 40 px cards), a WordCell that will hold 10 or more cards after the word shows a two-digit count badge at bottom-right that may touch or overlap the ★ preview mark at bottom-left (0–4.5 px gap, font-dependent). DESIGN.md fixes both at their corners and says nothing about a collision. Proposed default: keep both marks at their corners, draw the badge above the ★ where they meet, and judge it at the entry 5 device read; the ticket's 360 px rect check stops the build and reports if they intersect, moving no mark. Resume: record the answer (ticket Notes, epic Notes), commit, rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-place-preview`; the next session starts at Step B (the review log has its `## Result`).

Session note (2026-10-28, second session for 11.2): handoff, git log and ticket files agreed: Step A done (review log has `## Result`, the owner's ★/badge answer committed in 36f2b5d), so Step B started. No live pid files.

## 11.2 WordCell row place preview — stopped at the plan checkpoint
Build: plan written and committed (57dbccc), status `ready-for-dev`; nothing implemented. The ticket says an unattended build stops after planning for a person to approve the plan, and the build did so (stop rule 2).
Tokens: 2.2M input-equivalent (build 91%, orchestrator 5%, other 4%); orchestrator peak context 67k
Worth knowing: all twelve review-log minors are resolved in the plan's Design Notes. The plan computed and measured the ★ pill and a two-digit badge at 360 px: they overlap by about 0.35–0.6 px (16 px tall strip), so the ticket's "rects do not intersect" check would fail even though the look matches your 2026-10-28 decision (badge drawn above the ★). At 412 px there is no overlap.
Close-out docs: DESIGN.md § Components → WordCell (place preview) ← the badge draws above the ★ pill where they meet at 360 px (owner, 2026-10-28)

## Stopped — plan checkpoint (stop rule 2)
Ticket 11.2, Step B. Two things for Jared: (1) approve the plan `_bmad-output/initiative-wordcell-v1/epic-place-preview/story-wordcell-row-place-preview-plan.md`; (2) the ★/badge test: the marks overlap by under 1 px at 360 px. Proposed default: keep both marks where they are and change the check to "the badge is drawn on top of the ★ where they meet"; the alternative is moving or narrowing a mark (a look change). Resume: record the approval and answer (ticket Notes, epic Notes; plan Design Notes if the check changes), commit, rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-place-preview`; the next session reruns Step B on the approved `ready-for-dev` plan (tell the build the checkpoint is approved).

Session note (2026-10-28, third session for 11.2): the owner approved the plan and the 360 px check (badge drawn above the ★ where they meet) in 09b2af2; Step B reran on the approved plan.

## Stopped — usage limit
Ticket 11.2, Step B (build on the approved plan). The build hit the 5-hour limit (`You've hit your 5-hour limit · resets 8:30pm (America/New_York)`) after implementing; its plan is `in-review` and its uncommitted work is in the tree (src/ui Card and WordCellRow, flip, text, the new fixture `session-place-used-cells`, `e2e/place-preview.spec.ts`, updated specs and Place baselines); those files are this build's own and were left uncommitted for its resume. Step log kept as `11.2-B2-attempt1.log`. Resume: rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-place-preview`; the next session resumes Step B per bmad-build-auto's resume rule (plan `in-review` → its review step), with the build's files in the tree.

Session note (2026-10-29, fourth session for 11.2): handoff, git log and ticket files agreed (digest ended at the usage-limit stop, plan `in-review`, the build's files uncommitted in the tree), so Step B resumed per bmad-build-auto's resume rule (`in-review` → its review step). No live pid files.

## 11.2 WordCell row place preview — done
What it adds: while placing a word, each WordCell the word changes now shows how it will look after Confirm: the new top card, its card count and a small orange ★; a used cell no longer shows its hatched used card in that phase.
Ticket review: 5 passes, converged (majors 6, 3, 2, 1, 0); one question answered by you (★ and count badge overlap)
Build: built (resumed after the usage limit; its own review found 18 small points, 6 patched, none deferred); commit d021c5e
Code review: thorough (ticket risk medium), 2 passes, converged (majors 2, 0); pass-1 fixes in b77bd18 (missing tests: strip drag reorder, Undo of a commit onto a committed cell, the R-65 view on a used cell, ★ over the flourish, a labels case), log in 6177150
Tests: all passing (`test:all`, 1119 e2e passed), screenshots passed (67, against the Place and theme board baselines the build updated)
Ref to fix upstream: none
Tokens: 6.5M input-equivalent (code review 62%, build 33%, orchestrator 3%, other 3%); orchestrator peak context 65k
Worth knowing: (1) until ticket 11.3, the fly-in after Confirm briefly shows the target's old top card again (or the card beneath on a used cell) instead of the previewed card; 11.3 owns that. (2) The ★ is a font character (`text.star`, as the ticket says), while DESIGN.md's icon rule asks for inline SVG; the strip's ★ already does the same — a doc point for the retro. (3) Three small code-review notes left open: the plan's test list doesn't name the pass-1 tests, two plan triage rows are stale, and one preview test helper doesn't check the cell's other cards stay hidden (review log `11-2-build.md`).
Close-out docs: DESIGN.md § Components → WordCell (place preview) ← the count badge draws above the ★ pill where they meet at 360 px (owner, 2026-10-28)

Session note (2026-10-29, first session for 11.3): handoff, git log and ticket files agreed (11.2 done, 11.3 next and `ready_to_start`); pulled the ticket file (e9cc281). No live pid files.

## 11.3 Fly-to-cell keeps the previewed top — stopped
What it will add: after Confirm (or a Redo that places a word), while the cards fly into the WordCell, the cell shows the new top card from the start instead of briefly flashing its old top or a used card.
Ticket review: 4 passes, converged (majors 7, 4, 1, 0); one question for you (below). The plan_checkpoint flag from `tickets.toml` was added to the Description, so the build will also stop after planning for your approval.
Tokens: 6.4M input-equivalent (ticket review 96%, other 2%, orchestrator 2%); orchestrator peak context 58k
Worth knowing: nothing else.
Close-out docs: none yet (the answer to the question below will touch DESIGN.md § Components → WordCell (fly-to-cell) and epic 5 SPEC F28 if it changes the stacking)

## Stopped — decision needed (stop rule 1)
Ticket 11.3, Step A (ticket review). Question for Jared: during the fly-in after Confirm, once the word's first card lands in the target cell, should the landed cards stack up visibly on top of the previewed top card until the top card itself lands (keeps the epic 5 F28 rule: landed cards stay visible until the last one lands, then hide together), or should the final top card stay in front the whole time, with each card seeming to vanish into the cell as it lands? Proposed default: stacking, as the ticket now states (ticket Description, Hold bullet); the old top never flashes either way. Resume: record the answer (ticket Notes, epic Notes), commit, rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-place-preview`; the next session starts at Step B (the review log has its `## Result`), and the build stops at its plan checkpoint for your approval.

Session note (2026-10-29, second session for 11.3): handoff, git log and ticket files agreed (Step A converged with `## Result`, the owner's stacking answer committed in ce9ed84), so Step B started. No live pid files.

## 11.3 Fly-to-cell keeps the previewed top — stopped at the plan checkpoint
Build: plan written and committed, status `ready-for-dev`; nothing implemented. The ticket says an unattended build stops after planning for a person to approve the plan, and the build did so (stop rule 2).
Tokens: 0.7M input-equivalent (build 83%, orchestrator 10%, other 7%); orchestrator peak context 58k
Worth knowing: the plan applies your stacking answer (the target shows a copy of its new top, without the ★, as its base from Confirm or a committing Redo; landed cards stack over it; at the last landing only the real top remains). It adds two flights to the tests: a committing Redo onto a cell that already holds a word, and a Confirm on the fixture where a used one-card cell ends up empty. 12 of the 13 review-log minors are resolved in the plan's Design Notes; minor 13 (split a long sentence in the ticket) is declined because a build never edits ticket files.
Close-out docs: DESIGN.md § Components → WordCell (fly-to-cell hold with the previewed top) ← landed cards stack over the previewed-top copy until the last landing, F28 kept (owner, 2026-10-28), if its wording does not already say so

## Stopped — plan checkpoint (stop rule 2)
Ticket 11.3, Step B. For Jared: approve the plan `_bmad-output/initiative-wordcell-v1/epic-place-preview/story-fly-to-cell-keeps-the-previewed-top-plan.md`. Resume: record the approval (ticket Notes, epic Notes), commit, rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-place-preview`; the next session reruns Step B on the approved `ready-for-dev` plan (tell the build the checkpoint is approved).

Session note (2026-10-29, third session for 11.3): handoff, git log and ticket files agreed (plan `ready-for-dev`, Jared's approval committed in 136527c), so Step B reran on the approved plan. No live pid files. The build prompt carried the step contract's "do not commit", so the build left its work uncommitted; the orchestrator committed it as the build commit c0664ef before Step C.

## 11.3 Fly-to-cell keeps the previewed top — done
What it adds: after Confirm (or a Redo that places a word), while the cards fly into the WordCell, the cell shows its new top card underneath from the start; the arriving cards pile up over it and, when the last one lands, only the new top remains. The old top card or a used card no longer flashes.
Ticket review: 4 passes, converged (majors 7, 4, 1, 0); one question answered by you (the cards stack during the fly-in), and you approved the plan at its checkpoint
Build: built (its own review found 17 small points, 1 patched, 16 rejected, none deferred); commit c0664ef
Code review: thorough (ticket risk medium), 1 pass, converged (majors 0); 0 fixes applied; log in 38ea8f7
Tests: all passing (`test:all`: unit 3629, e2e 1120, dist 21, pwa 17), screenshots passed (67, no baseline changed)
Ref to fix upstream: none
Tokens: 4.0M input-equivalent this session (build 53%, code review 37%, orchestrator 5%, other 5%); orchestrator peak context 71k
Worth knowing: (1) the stacking look is checked by the tests only through which cards are present and visible, not by pixels; your device read in ticket 11.5 is the real check. (2) Three small code-review notes left open (review log `11-3-build.md`): the plan's Auto Run Result still says the build is uncommitted (it is c0664ef); one plan rationale for the Undo-mid-flight case is worded wrongly (the case is covered by unit tests plus the release check); there is no browser test that the copy goes away when New game interrupts a fly-in (it holds by how the code is built). (3) The old used-card hold from epic 5 (R-52) is removed, since ticket 11.2 made it unreachable.
Close-out docs:
- DESIGN.md § Components → WordCell (fly-to-cell hold with the previewed top) ← landed cards stack over the previewed-top copy (no ★) until the last landing, epic 5 F28 kept (owner, 2026-10-28), if its wording does not already say so
- ARCHITECTURE-SPINE.md AD-14 mirror list ← the hold's previewed-top copy replaces the R-52 used mirror (follows from the same owner decision, 2026-10-28; wording in the plan's Design Notes, left to ticket 11.5)

Session note (2026-10-29, first session for 11.4, resumed): the previous session hit the 5-hour usage limit during 11.4's ticket review (pass 4 reviewers; its log kept as `11.4-A-attempt1.log`) and ended before writing a stop section or handoff, so the handoff still said 11.3 done with 11.4 next. The ticket files settled it (review log at `State: pass 3: done`, no `## Result`), so Step A resumed at pass 4. No live pid files.

## 11.4 How to play Place scene preview — stopped
What it adds: the How to play Place scene will show the WordCell preview the way the game now does (the target cell shows its future top letter with the ★; a used cell that is not the target shows what lies beneath).
Ticket review: 4 passes, converged (majors 4, 3, 3, 0); one question for you (count badge in the scene, below). Four small notes are left for the build in the review log's `## Result`.
Paused: usage limit at Step A (pass 4), reset 1:30am (America/New_York), resumed 2026-10-29 10:18 UTC
Tokens: 2.0M input-equivalent (ticket review 92%, orchestrator 5%, other 3%); orchestrator peak context 61k
Close-out docs: none yet (if the answer is "show the badge", EXPERIENCE.md / DESIGN.md How to play scene notes and epic 8 D5 may need a line)

## Stopped — decision needed (stop rule 1)
Ticket 11.4, Step A (ticket review). Question for Jared: in the real game, the WordCell you are about to place onto shows a count badge (e.g. "6", the cards it will hold after Confirm). How to play scenes never draw count badges. Should the How to play Place scene's previewed WordCell show the "6" badge too? Proposed default: no badge; the scene shows only the new top letter with the ★, so every scene frame stays badge-free. Effect: with the default, the scene matches the game except for the missing number; with the badge, it matches more closely but becomes the only scene frame with a badge. Resume: record the answer (ticket Notes, epic Notes), commit, rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-place-preview`; the next session starts at Step B (the review log has its `## Result`).

Session note (2026-10-29, second session for 11.4): the handoff, git log and ticket files agreed (Step A converged with `## Result`, the no-badge answer committed in 8cd6b84), so Step B started. No live pid files.

## 11.4 How to play Place scene preview — done
What it adds: the How to play Place scene now shows the WordCell preview the way the game does. The cell being placed onto shows its future top letter with the ★ (no count badge, as you decided), and in frame 2 the used cell 6, which is not the target, shows the empty outline underneath. The scene's opening frame still shows cell 6 as used.
Ticket review: 4 passes, converged (majors 4, 3, 3, 0); one question answered by you (no count badge in the scene)
Build: built (its own review found 19 small points: 4 patched, 15 rejected, none deferred; all ten review-log minors resolved in the plan); commit fdb3bd5
Code review: quick (risk low, no high or medium build finding left), 2 passes, converged (majors 1, 0); 1 fix applied (test tightening in b8d33cf); log in c8e4bb2
Tests: all passing (`test:all` rerun: unit 3638, e2e 1120, dist 21, pwa 17), screenshots passed (68: the new scene 3 frame 4 baseline, no other baseline changed)
Ref to fix upstream: none
Tokens: 5.5M input-equivalent (build 63%, code review 25%, other 7%, orchestrator 5%); orchestrator peak context 75k
Worth knowing: (1) The first `test:all` failed on one test, `[android] e2e/nav.spec.ts:163` (a double tap on New game on the rejected-save screen), the same load flake as in epic 10. This time the `doubleTap` helper's own check fired: the second tap arrived as a single tap even with stamped timestamps. It passed 5 of 5 alone and the whole suite passed on the rerun; this ticket touches neither that test nor its helpers. The flake is back after fix 169c6bc, so it is worth a look in the 11.6 refactor sweep (log kept as `11.4-testall-attempt1.log`). (2) The place fixture gained a `previews` list, as the hardened ticket says (it replaces the toml entry's "fixture unchanged" clause). (3) One code-review minor left open (log `11-4-build.md`): the two bad-frame render tests match only the message prefix, so they cannot tell Scene.svelte's two throws apart.
Close-out docs:
- EXPERIENCE.md How to play (Place scene) / DESIGN.md ← the scene's previewed WordCell shows the ★ and no count badge; scenes stay badge-free (owner, 2026-10-29), only if their wording implies a badge (a grep found none)

## Stopped — next ticket needs you (stop rule 4)
Ticket 11.5 (Close-out: documents and device read) is marked hitl in `tickets.toml`, and no authorisation for this run lets the autopilot take it. Its hands-on parts go beyond a final check: it edits owner docs (the spec, EXPERIENCE.md, DESIGN.md, the spine's AD-3 and AD-14) and needs Jared's Android read. Nothing was started for it (no ticket file pulled, no step run).
Session note (2026-10-29, session after 11.4 done): the handoff, git log and ticket files agreed (11.4 done, 11.5 next). Tree clean on `place-preview`, no pid files.
Tokens: 0.0M input-equivalent (orchestrator 100%); orchestrator peak context 52k
Resume: run 11.5 yourself (the doc syncs from the Close-out docs list in the handoff, then `node scripts/device-preview.mjs <entry 2's Place fixture>` on your phone), or record in its `tickets.toml` entry that the autopilot may do the doc parts and leave it `built` for your phone check, then rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-place-preview`.
