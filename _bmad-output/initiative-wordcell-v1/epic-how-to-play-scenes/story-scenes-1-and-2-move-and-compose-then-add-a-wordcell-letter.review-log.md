# Review log — ticket 8.7 (Scenes 1 and 2)

State: pass 1: done
Mode: docs, thorough, max 7, budget 1500 words. Pass 0: 198 words. HEAD at start: 0a52938.
Note: this epic has no SPEC.md (epic file: "goes straight to tickets, no separate spec").

## Pass 1 — 2026-10-17
Reviewers: Builder's reading, Edge-case hunter, Adversarial, Ref alignment  |  Findings (merged): major 9, minor 2, decision-needed 1  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 1140 (5.8 x pass 0, budget 1500)  |  Snapshot: story-scenes-1-and-2-move-and-compose-then-add-a-wordcell-letter.passes/pass1.md
### Accepted (sent to fixer)
- [major] Scene content (board, lifted tail, k/Flip sequence, words, borrowed cell) unspecified
- [major] Continuity of scene 2's start with scene 1's end undefined (fixture format has static `start` only)
- [major] Where the free letter lands after Flip (in M, not D) unspecified
- [major] Animated reorder mechanism (no step kind, motion kind, reduced-motion frame) unspecified
- [major] Replacement scope: drag/compose/destination scripts, fixtures, captions, tests, index.ts, scene counts, baselines
- [major] Acceptance criteria and tests too thin (tickets.toml fields interface/tests/owns/verify/risk/hitl not copied; "U"/"P6" shorthand; "plays" undefined; screenshot baselines)
- [major] Captions for scenes 1 and 2 not drafted
- [major] Validate end state of scene 2 undefined
- [major] Rule refs: add R-10, R-13, R-20, R-23, R-31 to R-34, R-38; R-21 not exercised; HP-1/HP-2 via existing player
- [minor] Size budget / stage filler note
### Default applied (technical)
- Reorder mechanism — `arrange` command with tray glide using existing motion.ts kind, no pointer steps
- Continuity check — engine test replays scene 1 and compares resulting position and draft with scene 2's start
- Playwright "plays" — reduced-motion Next to last frame plus tap pause/restart; one Docker final-frame baseline per scene
### Decision needed (functionality / UX / gameplay)
- Scene 1/2 board contents and caption wording — the exact cards, words and caption text are what the player sees — proposed default: reuse the HP-3 rulebook-position lineage (E D K A onto column 3, BAKED/BALKED, borrow L from cell 6) with captions built from the approved old ones plus the owner's sentence; owner reads at done

Fixer applied items 1-10 (item 10's filler part skipped: not owned by 8.7). Fixer also edited tickets.toml; the orchestrator reverted that (out of scope).
