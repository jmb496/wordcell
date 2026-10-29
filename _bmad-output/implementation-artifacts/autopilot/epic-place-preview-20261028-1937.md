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
