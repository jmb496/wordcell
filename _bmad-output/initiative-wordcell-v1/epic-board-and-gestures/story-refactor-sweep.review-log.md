# Review log — story-refactor-sweep.md (ticket 4.13)

State: pass 2: done

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
