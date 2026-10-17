# Review log — ticket 8.7 (Scenes 1 and 2)

State: pass 5: done (converged)
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

## Pass 4 — 2026-10-17
Reviewers: Fix diff, Edge-case hunter, Adversarial, Ref alignment  |  Findings (merged): major 1, minor 12, decision-needed 0  |  Dropped in triage: 0 (reviewer majors on untested `opens` guards, script-to-fixture proof gap and the unspecified "fuller" amount reclassified minor under the pass-4 bar: verification precision / builder detail)
Words (docs): 1486 (7.5 x pass 0, budget 1500)  |  Snapshot: story-scenes-1-and-2-move-and-compose-then-add-a-wordcell-letter.passes/pass4.md
### Accepted (sent to fixer)
- [major] Dropping `arrange` from `COMMAND_TYPES.move` makes `defineScene` throw for source-drop.ts (move step, command 1 = arrange; verified) and breaks the unchanged Tricky scene: keep `move` accepting `arrange`; scope the "no move step names arrange" test to the two new scenes
- [minor, zero-add only (ticket at 1495 words, budget 1500)] AD-14 test that defineScene rejects steps below `opens`; script frames vs fixture data; "fuller" minimum; define M/D; AC3 split by motion mode; scene 2 step list; wording of the k invariant; toml `interface` sync stays with the owner
### Default applied (technical)
- Keep `arrange` allowed for `move`; the new StepType is used by the two new scenes only
### Decision needed
- (none new; passes 1 and 2 items stand)

Fixer applied pass 4 items 1-9 (wc 1486; Verify line shortened to the two npm scripts to make room).

## Pass 5 — 2026-10-17
Reviewers: Fix diff, Edge-case hunter, Adversarial, Ref alignment  |  Findings (merged): major 0, minor 12, decision-needed 0  |  Dropped in triage: 0 (eight reviewer-labelled majors from the adversarial lens reclassified minor under the pass-4 bar: each is a builder-picked, engine-checked detail, an already-flagged owner item, or verification precision; none is a defect in shipped behaviour, a gating check or the ticket's contract)
Words (docs): 1486 (7.5 x pass 0, budget 1500; no fix pass)
### Applied
- none (converged)
### Decision needed
- unchanged from passes 1 and 2

## Result — converged after 5 passes

Unapplied minors (next build or loop; the ticket is at its word budget, so any fix must add no words):
- R-31 bound wording: "1 <= k <= destination column length after the drop" should read the column's own length before the lifted cards land (4 for M U N B)
- "Fuller means at least the old board's cards" contradicts the default column 3 (M U N B replaces L M F B); reword to column 1's tail and F, cell 6's L, a bottom B, plus decoration within MAX_COLUMN_CARDS / MAX_CELL_CARDS
- Verify line was shortened to the two npm scripts; AC1 to AC3 carry the toml verify clauses (point the Verify line at them)
- `opens` validation: harness range check; helper asserts `opens === scene1.commands.length` and scene 2 has more than `opens` commands; negative test mutates `opens`
- The `arrange` step's target (`rest`), default `times`, and COMMAND_TYPES entry; one step = one glide of all moved tiles
- Pin that AC5 names two preference values (Fast vs Slow)
- CardIds [0,22,8,6] depend on `startOf` numbering; decoration must not add A/K/E/D, or the test derives ids from letters
- Stated words are locked; a change is an owner decision
- Scene 2 caption's first sentence is redundant with the owner sentence; the scene-2 Flip-back is not in the caption
- Scene 2 final frame: spell out the pressed-Validate tray content; scene ids `move-compose` / `free-letter` for e2e retargeting
- place.ts comment names the removed compose scene (ticket 8.8 owns place), so the grep should exclude prose comments
- tickets.toml entry 7 `interface` and `references` still differ from the ticket; sync at done
- M/D notation and R-31 precision; scene 2 first frame equals scene 1's last frame with the pointer at rest
