# Review log — story-place-and-scoring-scenes.md

State: pass 5: done

Pre-loop: HEAD 3ee207aa10e7b40100164b89d37db81a4648ce24, 158 words (pass 0 copy: story-place-and-scoring-scenes.passes/pass0.md). Growth budget 2.5x = ~395 words (default). Note: no epic-8 SPEC.md exists under _bmad-output/specs/; the epic file is the requirement source. Ticket toml fields interface/tests/owns (entry 3 of tickets.toml) are passed to reviewers and fixer as intent; fixer adds them to the Description in pass 1.

## Pass 1 — 2026-10-16
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 8 (merged from 4 reviewers), minor 5, decision-needed 0  |  Dropped in triage: 0 (duplicates merged; R-36 mis-citation confirmed: R-36 is the 3-letter floor, QU = 2 is Q-06/R-80)
### Applied (to fixer)
- [major] toml fields interface/tests/owns absent from Description
- [major] scene 4 start and command list (compose chain, then setTarget 5, setTarget 6, setPlacementOrder, confirm; R-42 pre-selects 6 via validate; words entries; DICT {'baked','balked'})
- [major] placement order as startOf CardIds bottom-to-top D B A L K E ('front' = bottom, R-51; E top, R-52); cell 6 holds exactly BALKED after confirm, L used (R-41, R-60)
- [major] SceneFixture has no field for cell contents/placement/target/per-cell numbers: add optional assertion(s) to scene-replay.ts (Interface), range-checked, with negatives
- [major] scene 5 start (cells-only, commands [], scores after 0 = 61; C A T / QU I T / B A L K E D bottom to top; QU encoded 'QU'; per-cell 9, 16, 36 asserted; order of BALKED consistent with scene 4)
- [major] frame list, Frame field additions, step→command mapping (tap=setTarget, drag=setPlacementOrder, Confirm=confirm), final frames, new static visuals
- [major] captions verbatim from epic Notes in howTo.scenes (place, scoring), fixture filenames
- [major] tests: reduced-motion Next step-through (P6 android), negatives (61→62, order, per-cell number, out-of-range), script-vs-fixture, test-name ids
- [minor] references (8.1/8.2 continuity, code, AD-1, Q-06; R-36 floor only); dictionary note (scene 5 none)
### Default applied (technical)
- Scene 5 animation within approved HP-3e: per-cell numbers reveal one by one then total; reduced motion steps the same frames
### Decision needed (functionality / UX / gameplay)
- (none)

Fix applied; words 658 (4.2x pass 0, over the 2.5x budget: from pass 2 minors go to the fixer only when they add no words); snapshot story-place-and-scoring-scenes.passes/pass1.md. All 8 majors and the minors applied. Fixer ran temporary replays of scene 4 commands (incl. confirm) and scene 5 start through the engine: pass (temp test deleted). Deviation: scene 5 needs one undrawn `Z` column card because the engine start throws `start-no-column-card` on an empty board.

## Pass 2 — 2026-10-16
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 8 (merged; 4 reviewers flagged #1), minor 3 applied, decision-needed 0  |  Dropped in triage: 3 (toml references drift: toml out of scope; place-entry-per-after and place.after validity: plan detail)
### Applied (to fixer)
- [major] scene 5 cell 6 order contradicts scene 4 (D B A L K E, top E); scene 4 "holds exactly BALKED" → D B A L K E (spelled BALKED by the word, order is the push, R-60)
- [major] scene 4 commands 0 to 3 have no steps/frame mapping: state which are pre-applied set-up vs steps, what frame 0 is, frame→`after` mapping
- [major] generic replay test asserts moves.length > 0 (how-to-play-scenes.test.ts:41); scoring has commands [] → relax or own test
- [major] Frame.order already means tray tile letters (types.ts:55): name the new field (placeOrder)
- [major] value types: cells.cards compared as letters (QU), place.order as CardIds; viewFrom holds CardIds
- [major] scene 5 start.columns literal ([["Z"]], not drawn)
- [major] scene 5 steps (reveal, no pointer) and Frame encoding of revealed numbers/total
- [major] cellScores: harness computes each non-empty cell's score from viewFrom, fails on mismatch/missing, and the sum must equal the scores entry
- [minor, no added words] garbled captions sentence; delete the R-36 clause
### Default applied (technical)
- all above are harness/fixture/Frame contract choices; none changes what the player sees beyond epic HP-3
### Decision needed (functionality / UX / gameplay)
- (none)

Fix applied; words 775 (4.9x pass 0, over budget); snapshot story-place-and-scoring-scenes.passes/pass2.md. All 8 majors and minors applied. Fixer notes: 8.2's coverage test (scenes.test.ts:91-93) requires steps for every fixture command, so the ticket now states the rule that it skips scene 4's set-up prefix (commands 0 to 2); scene 5 reveal steps: whether the pointer can be hidden is `unverified` (Step type requires type and target).

## Pass 3 — 2026-10-16
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 3 applied, decision-needed 0  |  Dropped in triage: 2 (adversarial stretch minors: scene 5 reachability, scene 4 loop restart: build-plan detail, would add words)
### Applied (to fixer)
- [major] steps→commands: COMMAND_TYPES (script.ts) has no setTarget/setPlacementOrder/confirm; state mapping (tap: setTarget, confirm; move: setPlacementOrder; fly command-less after the Confirm tap)
- [major] Scene.carry is required and Scene.svelte draws from start.columns/carry: scene 5 has no tail; make carry optional / draw nothing without it (the `Z` column not drawn)
- [major] Frame new-field types/defaults (placeTarget number, lit number[], placeOrder letters, numbers count, total number; tray/tail for scene 5 and place frames)
- [major] scene 4 `scores` [{after 8, 36}], `cells` and `cellScores` at after 8; sum check fails without a scores entry at that after
- [major] scene 5 step count (four reveal tap steps: three numbers, then total) and pointer shown or not left to plan, test not tied to it
- [minor, no added words] "counts 4 to 7" → "after 4 to 7"; frame i vs step wording / fly shares final frame; DICT negative's failure mode (EngineError of setTarget in composing)
### Default applied (technical)
- all are script/Frame/harness contract choices
### Decision needed (functionality / UX / gameplay)
- (none)

Fix applied; words 819 (5.2x pass 0, over budget); snapshot story-place-and-scoring-scenes.passes/pass3.md. All 5 majors and minors applied. Fixer verified setTarget needs the place phase (commands.ts); "scene 4 draws no Validate" not checked against Scene.svelte.

## Pass 4 — 2026-10-16
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 3 (after late-pass bar), minor 3 applied (no added words), decision-needed 0  |  Dropped in triage: 7 (minors that add words while over budget: carry guards, lit/placeTarget derivation test, DICT check code, extra negative, frame counts in P6, scene 5 card-stack drawing; a stretch)
### Applied (to fixer)
- [major] scene 4 "draws no Validate / no validatable entry" (added in pass 3, unchecked) contradicts the Validate tap step and 8.2's drawn-Validate rule: scene 4 draws Validate (pressed at the tap, then off in the place phase), `validatable` entries per after, per the existing rule
- [major] frame/step table: 6 steps (Validate tap, tap 5, tap 6, drag, Confirm tap, fly) vs "frame i+1 = after step i" gives 7 frames; list them explicitly (fly shares final, or Confirm tap and fly one step)
- [major] scene 4 start/validated frames: what is drawn (word cards in a strip in R-51 order B A L K E D until the drag, placeOrder on the validated frame; fixture place.order for after 4 to 6 = default order)
- [minor, no added words] "per-cell numbers" → "per-cell scores"; replace the "8.2's coverage test skips scene 4's set-up prefix" sentence with "scene 4 has its own coverage test (indexes 3 to 7)"
### Default applied (technical)
- Scene 4 start strip order = R-51 default; Validate drawn per 8.2's rule
### Decision needed (functionality / UX / gameplay)
- (none)

Fix applied; words 831 (5.3x pass 0, over budget); snapshot story-place-and-scoring-scenes.passes/pass4.md. All 3 majors and the two no-word minors applied. Fixer cut 43 words incl. the pointer-ghost aside (pass 3 item 5) and "inert markup ... as 8.1"; the remaining "New static visuals" line still says "per-cell numbers".

## Pass 5 — 2026-10-16
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 2 (after dedupe), minor 1 applied (no added words), decision-needed 0  |  Dropped in triage: 8 (adversarial/stretch minors that add words while over budget or are plan detail: start-frame drawing, QU wording in cellScores, scene 5 tap targets, WordCell stacks visual, DICT ordering note, place.order negative naming, CardId note)
### Applied (to fixer)
- [major] scene 4 `validatable`: "true after 3 only" ambiguous against 8.2 (compose chain is true after 1 to 3, view.ts canValidate): state entries for after 3 to 8 (true after 3 only), the frame counts, set-up counts 0 to 2 unlisted (harness lists only given entries, scene-replay.ts:102)
- [major] scene 4 keeps `carry` (source 1, count 4, destination 3) and draws post-drop columns with tail gone as 8.2's gone frames do; only scene 5 omits carry
- [minor, no added words] "New static visuals" line: "per-cell numbers" → "per-cell scores"
### Default applied (technical)
- both are fixture/script contract choices
### Decision needed (functionality / UX / gameplay)
- (none)

Fix applied; words 843 (5.3x pass 0, over budget); snapshot story-place-and-scoring-scenes.passes/pass5.md. Both majors and the minor applied. Fixer found Scene.svelte does not draw post-drop columns for a 'gone' frame (drawn.columns come from fixture.start + carry), so the ticket now adds a proposed `carry.landed` rule (append the tail to the destination column); this is a proposed Scene.svelte change, `unverified` by running.
