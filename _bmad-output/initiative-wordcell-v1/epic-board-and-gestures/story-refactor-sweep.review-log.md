# Review log — story-refactor-sweep.md (ticket 4.13)

State: pass 6: done

- Mode: docs, thorough, max 7, budget 1500 words
- Pre-loop: HEAD 149fa80; pass 0 copy story-refactor-sweep.review-log.passes/pass0.md, 226 words
- Intent additions from tickets.toml entry 13 (not copied at pull): interface, tests, owns — fixer adds them to the Description in pass 1

## Pass 1 — 2026-10-07
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 15, minor 6, decision-needed 0  |  Dropped in triage: 0 (about 40 raw findings merged into 21)
Words (docs): 1401 (6.2x pass 0; budget 1500)  |  Snapshot: story-refactor-sweep.review-log.passes/pass1.md, fix diff pass1.fix.diff
### Applied (fixer items, see list below)
- [major] Notes/Description — no deferred inventory → 1
- [major] banner-during-scroll flake (layout.spec.ts) → 2
- [major] carried open majors 4.5, 4.6, 4.9-f32, 4.12 → 3
- [major] 4.12 hover timer keyed by element; closed-rect 6/7 edge → 4
- [major] 4.8 column rects not clipped under the sticky top bar → 5
- [major] player-visible leftovers without a disposition → 6
- [major] AC "unedited except imports" contradicts the inventory → 7
- [major] re-measure metric undefined → 8
- [major] watch re-run method on drvfs → 9
- [major] measure order and owner-stop timing records → 10
- [major] test:screens with Docker unreachable → 11
- [major] R6 helper shape (build-notes CAP-10, PrefsRejectReason) → 12
- [major] R7 boundary and shared setup → 13
- [major] intent fields interface/tests/owns and the AGENTS.md record → 14
- [major] architecture.test.ts split shape → 15
- [minor] items 16–21 (close-out doc boundary, e2e helper dedup, test/plan minor batch, count badge, 5 s boundary, flake rerun policy)
### Default applied (technical)
- re-measure — metric → Vitest-reported Duration, warm fsModuleCache, wall clock for information
- watch re-run — method → Linux-filesystem clone, else warm `npx vitest run <file>` proxy
- test:screens — Docker unreachable → record in plan, green run moves to the owner's done/merge gate
- R7 — shared setup → copied into history.svelte.test.ts
- split — shape → `src/architecture-<topic>.test.ts`, SELF becomes the set
- AGENTS.md — tickets.toml over build-notes CAP-10: record in plan, no edit
- top-bar clip — fix to EXPERIENCE.md Drop targeting steps 6–7
- player-visible leftovers — homes epic 5 / 6 / 7 device pass
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- edge-case reviewer: 4-5 minor 1 test name "now accurate" — disproved (overlays.svelte.test.ts resetForNewSession test still opens no hover peek)

Fixer: all 21 applied (inventory D1–D15, Out of scope section, intent fields); ran `npx vitest run src/engine/deal.test.ts` (652 ms); full-suite claims (5 green test:e2e runs, Docker) unverified as design statements.

## Pass 2 — 2026-10-07
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 9, minor 8, decision-needed 1  |  Dropped in triage: 0 (about 34 raw findings merged into 18)
Words (docs): 1683 (7.4x pass 0; over the 1500 budget, so later minors only if word-neutral)  |  Snapshot: story-refactor-sweep.review-log.passes/pass2.md, fix diff pass2.fix.diff
### Applied (fixer items)
- [major] D8 helper copies wider and divergent (nine specs, differing signatures) → 1
- [major] split needs tsconfig.arch.json / tsconfig.app.json edits → 2
- [major] watch-run proxy can trigger the owner stop wrongly; trigger edit undefined → 3
- [major] inventory preamble "plans only for D5" contradicts D6/D9 plan and ticket edits → 4
- [major] D9 cites "4-2" (overlaps D12) and nonexistent "4-10 minors" → 5
- [major] missing rows: 4-6 minor 4 same-id peek, 4.3 compact tray and placeholder negative case → 6
- [major] classify 'up' without coordinates is a production change with no outcome → 7
- [major] lost-end touch press recovery has the wrong home (epic 7) → 8
- [major] Interface bars the src/ui changes In rows need → 9
- [minor] items 10–17 (D10 citation, R6 game-store wording and assertWritable(kind, op), Q-39 tracker accessor, < 5.00 s boundary and "once after all changes", D1 reset rule, D14 definite, screenshot precedent, residual row)
### Default applied (technical)
- classify 'up' — outcome → per EXPERIENCE.md Pointer thresholds, ≥ 8 px at pointerup is not a tap, dispatches nothing
- lost-end press — home → In with a reachability Vitest
- compact tray browser check → Out, epic 5
- assertWritable — signature → (kind, op), no store import
- boundary → below 5.00 s passes (epic Done when 5)
### Decision needed (functionality / UX / gameplay)
- D7 — When the board is scrolled under the sticky top bar (and the dictionary banner or the bottom action bar), dragging cards over a bar can light up, and drop on, a column hidden beneath it. Should the sweep stop that now (only the visible part of a column counts as a target), or accept it for v1? EXPERIENCE.md Drop targeting 6–7 ("what the player sees is what happens", bars are never targets) supports fixing; spine AD-12 / rule 4 say targeting uses the column's "whole hit rect", so fixing deviates from the spine wording (rule 7: ask first). — proposed default: fix now: clip each column's hit rect to the visible band between the sticky top bar (plus the banner when shown) and the action bar, with tests, and record an AD-12 wording note for the retrospective.
### Dropped
- none

Fixer: all 17 applied (new rows D16–D20; D7 disposition marked owner decision pending); citations and tsconfig entries checked; no new runnable commands.

## Pass 3 — 2026-10-07
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 8, minor 8 sent (word-neutral only) + others left, decision-needed 0 new (D7 still open)  |  Dropped in triage: 0 (about 33 raw merged)
Words (docs): 1921 (8.5x pass 0; over budget: majors +239, minors −1)  |  Snapshot: story-refactor-sweep.review-log.passes/pass3.md, fix diff pass3.fix.diff
### Applied (fixer items)
- [major] D17 rule catches presses whose long-press fired → 1
- [major] D18 new-pointerId recovery contradicts CAP-4 one-pointer rule → 2
- [major] D7 pending: no rule for a build without the owner answer → 3
- [major] D1 vs Flakes contradiction; unbounded reset → 4
- [major] D20 no outcome if reachable; 4-7 deselect carry missing → 5
- [major] split: shared scanner code has no home → 6
- [major] "before any other speed-up" vs CAP-10 → 7
- [major] D9 production edits and either/or defaults unstated; 4-1 minor 3 → 8
- [minor] 9–16 (word-neutral only: clone procedure cut, Description guard wording, R7 helpers, D12 → epic 5, D15 wording, D6 edge, D1 sources, Out-row carry-forward)
### Default applied (technical)
- D18 — recover only a provably dead press; else owner stop
- D20 — if reachable: no throw, F28 restore, deselect skipped under a view
- split — shared code in one root module (e.g. src/architecture-scan.ts), balanced AD-1 split
- D9 — first-named log default; 4-1 minor 3 folded into the 4.4 sub-pixel tolerance item
### Decision needed (functionality / UX / gameplay)
- none new (D7 from pass 2 remains open)
### Unapplied minors (over budget, not word-neutral)
- R6 loaded()/load() guard messages: say whether the snapshot helper takes caller messages (adversarial)
- missing residual rows: 4.6 plan main.ts registration test gap, 4.9 Android pointercancel-before-back (epic 7), 4.3 ghost fill owner glance and D-block seam (ref alignment)
- re-measure: whether the watch file is re-chosen after a split (edge-case)
### Dropped
- none

Fixer: all 8 majors and 8 minors applied (minors net −1 word); SELF, tsconfig entries and the 15/18 AD-1 describe count checked against the repo; the watch-run proxy clause was cut in favour of a working-tree copy and `touch` (design statement).

## Pass 4 — 2026-10-07
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 6, minor 10 (word-neutral only), decision-needed 0 new (D7 still open)  |  Dropped in triage: 0 (about 26 raw merged)
Words (docs): 2006 (8.9x pass 0; majors +86, minors and cuts −1)  |  Snapshot: story-refactor-sweep.review-log.passes/pass4.md, fix diff pass4.fix.diff
### Applied (fixer items)
- [major] AC "unedited except imports" fails a split build → 1
- [major] screenshot gate: green with no baseline change; fallback holder = epic merge gate → 2
- [major] split one-third cap unmeetable (tree scan 790 ms ≈ 48 %, measured) → 3
- [major] D18 recovery always-true for an uncaptured press → 4
- [major] D1 vs Flakes still contradict; run counting → 5
- [major] median location (/mnt/d) vs watch copy → 6
- [minor] 7–16 (word-neutral only)
### Default applied (technical)
- split — by describe blocks, tree scan alone, per-file times recorded
- D18 — uncaptured press keeps same-id recovery, Out → epic 7
- screenshot fallback — epic merge gate (Done when 1, 6), open item at mark-done
- median — /mnt/d checkout
### Decision needed (functionality / UX / gameplay)
- none new (D7 remains open)
### Dropped
- none

Fixer: 6 majors applied; minors 7–13, 15, 16 applied word-neutral; 14 (D17 cleanup wording) skipped for words. No commands added.

## Pass 5 — 2026-10-07
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 6, minor 6 sent (word-neutral only), decision-needed 0 new (D7 still open)  |  Dropped in triage: 2 (no-edit minors: 5 s threshold vs tickets.toml, screenshot deviation already cited)
Words (docs): 2074 (9.2x pass 0; majors +69, minors −1)  |  Snapshot: story-refactor-sweep.review-log.passes/pass5.md, fix diff pass5.fix.diff
### Applied (fixer items)
- [major] split has no grouping rule (18 files possible) → 1
- [major] D17 contradicts SPEC CAP-8 destination-card drag-as-tap → 2
- [major] D15 vs AC on a non-green screenshot run → 3
- [major] D18 recovery outcome undefined → 4
- [major] D1 runs must follow src edits too; no exit for an unfixable D1/D4 → 5
- [major] D20 reachable outcome contradicts F24 / CAP-6 → 6
- [minor] 7–12 (word-neutral only)
### Default applied (technical)
- split — at most about four files (tree scan; other AD-1; TS-API checks)
- D17 — pending release ≥ 8 px classifies as 'drag' latched at release
- D18 — same-id end path, then the new press proceeds
- D20 — reachable path → record repro, owner stop (rule 7)
### Decision needed (functionality / UX / gameplay)
- none new (D7 remains open)
### Dropped
- 5.00 s threshold stricter than tickets.toml "exceeds" — ticket follows epic Done when 5; no edit
- screenshot fallback vs tickets.toml verify — precedent already cited; no edit

Fixer: all 6 majors and 6 minors applied; classify outcomes and the controller same-id/no-pick-up paths checked against the code; "re-saved unchanged" marked unverified.

## Pass 6 — 2026-10-07
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 2 (both D17, one fix), minor 7 sent (word-neutral), decision-needed 0 new (D7 still open)  |  Dropped in triage: 1 (screenshot vs tickets.toml verify again; precedent already cited)
Words (docs): 2073 (9.2x pass 0)  |  Snapshot: story-refactor-sweep.review-log.passes/pass6.md, fix diff pass6.fix.diff
### Applied (fixer items)
- [major] D17 needs an exported classify type change the Interface forbids → 1
- [major] D17 leaves the tail-selection outcome open (step 6 deselect vs keep) → 1
- [minor] 2–8 (split grouping label and AGENTS.md lines, D6 edge rule, D1 except split, Flakes wording, D18 active-press, D20 Out additions, D19 test name)
### Default applied (technical)
- D17 → Out, epic 7 device pass (unreachable without pointermove; 4-8 log marked it out of scope; not handed to 4.13)
- split → three files (tree scan; other AD-1; AD-2/AD-12/AD-17)
### Decision needed (functionality / UX / gameplay)
- none new (D7 remains open)
### Dropped
- tickets.toml verify vs screenshot fallback — already cited (4.10–4.12 precedent)

Fixer: major and all 7 minors applied, net −1 word; describe blocks and the drag.spec.ts whole-column test checked.
