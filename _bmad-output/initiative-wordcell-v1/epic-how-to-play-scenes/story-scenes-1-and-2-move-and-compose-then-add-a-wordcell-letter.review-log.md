# Review log — ticket 8.7 (Scenes 1 and 2)

State: pass 3: done
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

## Pass 2 — 2026-10-17
Reviewers: Fix diff, Edge-case hunter, Adversarial, Ref alignment  |  Findings (merged): major 4, minor 6, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 1453 (7.3 x pass 0, budget 1500)  |  Snapshot: story-scenes-1-and-2-move-and-compose-then-add-a-wordcell-letter.passes/pass2.md
### Accepted (sent to fixer)
- [major] Reorder step type unspecified (script.ts command-fit table: `arrange` only on `move`; no glide step); AC4 duration test tautological
- [major] `opens` only on harness SceneFixture; UI SceneFixtureData, scene 2 opening frame / reduced-motion frame 0, index validation unspecified
- [major] Continuity test and its negative test not defined as a comparison (a changed decoration card still replays legally)
- [major] Default board contradicts invariants (§8 col 3 L M F B cannot spell with k>1; Flip side right vs BALKED); order of arrange/k/flip; −/+ and Flip must actually appear; scene 2 sequence
- [minor] Playwright test names use covered R-ids + AD-14 (not HP-1); captions not "owner-approved" composites; fixture test DICT/FIXTURES lists; no remaining reference grep; count phrasing; baseline names and Docker blocker; toml refinements note
### Default applied (technical)
- Reorder step — name a step type for the glide bound to `arrange` with kind snap; duration test asserts kind and scaling
- Continuity — harness-level comparison helper used by positive and negative tests
### Decision needed (functionality / UX / gameplay)
- Scene 1 Flip with the E D K A tail — the flipped word AKEDB is not a word (only DEKARE/DEKARES/DEKAGRAM read upward from that tail), so the pinned default has scene 1 end on a non-word flipped draft and scene 2 flip back before BALKED. Would the owner rather drop Flip from scene 1, keep Flip with a different lifted tail, or keep the flip-back? — proposed default: as written (flip shown, scene 2 flips back); the owner reads it at done
- (pass 1 item stands)

Fixer applied pass 2 items 1-9 (pinned sequence verified against engine and dictionary in a /tmp script). Fixer reported finding 4 only partly (see decision needed).

## Pass 3 — 2026-10-17
Reviewers: Fix diff, Edge-case hunter, Adversarial, Ref alignment  |  Findings (merged): major 2, minor 10, decision-needed 0  |  Dropped in triage: 0 (reviewer-labelled majors on command notation, scene 2 final frame, reorder test wording and the flip-back invariant reclassified minor: clarifications of a builder-picked, engine-verified default)
Words (docs): 1495 (7.6 x pass 0, budget 1500)  |  Snapshot: story-scenes-1-and-2-move-and-compose-then-add-a-wordcell-letter.passes/pass3.md
### Accepted (sent to fixer)
- [major] Continuity check (c) cannot compare via `words` (AKEDB is not a word; `words` keyed by `command`, `block`/`validatable` by `after`): compare replayed engine views of the prefix and use `block`/`validatable` at `after: opens`
- [major] No test ties the UI's hand-drawn scene 2 first frame to scene 1's last frame: add an AD-14 script unit test (or build frame 0 from scene 1's final-frame constants)
- [minor, fixed only if no words added or after cuts] literal command notation (k values, arrange = CardIds A K E D, fixture field names); scene 2 final frame = pressed-Validate tray (as old compose); step order and AC5 wording; scene 2 begins with flip back; `opens` = number of prefix commands; drop the vacuous `rejected` clause; grep narrowed to exact removed identifiers; test-name ids for AC1/2/6; harness file is test support (epic Boundaries); scene 1 Playwright asserts tile order and block; mark the Flip ending a draft for owner
### Default applied (technical)
- Continuity compares replayed views; UI-side equality by an AD-14 unit test
### Decision needed
- (none new; pass 1 and 2 items stand)

Fixer applied pass 3 items 1-12 (wc 1495, cuts made for room).
