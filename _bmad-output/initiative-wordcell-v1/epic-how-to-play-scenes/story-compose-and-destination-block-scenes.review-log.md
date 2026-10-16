# Review log — story-compose-and-destination-block-scenes.md

State: pass 3: done

Pre-loop: HEAD d9895643d34c0c46ca3e99c54160884a86aa4b07, 143 words (pass 0 copy: story-compose-and-destination-block-scenes.passes/pass0.md). Growth budget 2.5x = ~357 words (default). Note: no epic-8 SPEC.md exists under _bmad-output/specs/; the epic file is the requirement source.

## Pass 1 — 2026-10-16
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 8 (merged from 4 reviewers), minor 5, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
### Applied (to fixer)
- [major] toml fields interface/tests/owns (and consumers-equivalent) absent from Description
- [major] STAPE is not a dictionary word: it is a structural intermediate asserted as the live word string, never dictionary-checked; non-word negative targets a validated word (BALKED)
- [major] "Validate stays enabled for STAPE": no fixture field or assertion; needs an optional fixture field checked against the engine view's canValidate (R-38) plus script-vs-fixture match
- [major] scene 2 start and command list (§8 start, drop, arrange A K E D, add free letter L with insertion so the word is A L K E D, validate)
- [major] scene 3 mini-board start (columns, no cells) and commands (drop, +, +, flip) with words APE, STAPE, PEATS
- [major] frame list and final frame per scene, reduced-motion Next step-through, baselines under reduced motion
- [major] approved captions not in the ticket (epic Notes); quote or cite them verbatim
- [major] new static visuals and tap targets (WordCell row, Validate, −/+, Flip, locked block) undefined
- [minor] references R-10, R-20, R-23, R-31, R-32 + 8.1 continuity; reuse 8.1 negatives; duplicate L note; test-name ids
### Default applied (technical)
- Scene 2 final frame: Validate pressed, tray stays open (no Place; scene 4 covers it) → epic HP-3b ends at "tap Validate"
- Validate-enabled as optional fixture field checked against the view flag → default
### Decision needed (functionality / UX / gameplay)
- (none)

Fix applied; words 532 (3.7x pass 0, over the 2.5x budget: from pass 2 minors go to the fixer only when they add no words); snapshot story-compose-and-destination-block-scenes.passes/pass1.md. All 8 majors and the applicable minors applied. Unverified by the fixer: scene 3 word strings (APE, TAPE, STAPE, PEATS) derived from R-30 to R-32, not run through the engine; dictionary membership of balked/peats checked in generated/dictionary/en.txt.

## Pass 2 — 2026-10-16
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 6 (merged), minor 6, decision-needed 0  |  Dropped in triage: 3 (adversarial minors: 'canValidate true at STAPE' already stated, scene 3 column-count note, caption string reuse: plan detail)
### Applied (to fixer)
- [major] validatable shape/indexing undefined and frame→Validate state mapping (canValidate is true from the drop until validate succeeds, then false in the place phase) → `{after: count, canValidate}` as scores, entries listed, drawn Validate lit exactly when true
- [major] arrange CardIds: fixture ids are those startOf assigns; words entries catch a wrong id
- [major] a rejected validate in `commands` does not fail the positive replay (scene-replay.ts records rejectedWords only for words entries) → harness fails on any rejectedWord in commands (or equivalent assertion), so a dictionary lacking BALKED fails the replay
- [major] scene 2 frame list ambiguous (count, final frame is a script pose of the open tray, Place is scene 4)
- [major] Frame type widening fields and normal-motion steps for −/+/Flip/cell 6 (target ids carrying commands; cell 6 drawn used after the borrow, R-33)
- [major] tests: inline Set {'balked'}; one concrete illegal case; drop the vacuous score negative; test-name ids line
- [minor, no added words] 'index into M'; static controls inert non-button markup
### Default applied (technical)
- all six above are technical (harness/fixture contract, test shape); none changes what the player sees beyond epic HP-3
### Decision needed (functionality / UX / gameplay)
- (none)

Fix applied; words 599 (4.2x pass 0; over budget). Snapshot passes/pass2.md. Applied all 6 majors; item 3 resolved without a harness throw (existing 8.1 test expects rejectedWords [undefined,'bedka']): positive replay asserts rejectedWords all undefined, negative expects 'balked' rejected. Minor 'index into M' not applied (budget). Unverified by fixer: setDestinationCount 0 throws r31-destination-count on scene 3 (inferred, not run; no TABLE row for non-self count 0); no fixture replay was run.

## Pass 3 — 2026-10-16
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 6 (merged), minor 5 applicable, decision-needed 0  |  Dropped in triage: 7 (stretch minors: cell 6 'used' look, frame 5 'pose' note, words entry on scene 2 drop, derive arrange ids by test, canFlip assertion, scene 3 default k, M undefined; all plan detail, over budget)
### Applied (to fixer)
- [major] frame→command-count mapping, and 'pressed' overrides validatable's false after validate; 'off' = drawn disabled (per-frame table for both scenes)
- [major] step→command mapping for both scenes and the defineScene rule for tap steps (arrange, cell 6 tap, −/+, Flip, Validate)
- [major] UI SceneFixtureData also gains optional validatable (AD-1: UI cannot import the engine type)
- [major] validatable range check (like scores/rejected) and its out-of-range test
- [major] caption is the figure's description (types.ts), no second string
- [major] shared DICT in how-to-play-scenes.test.ts becomes {'baked','balked'}; the negative builds its own {'baked'}
- [minor, word-neutral] setDestinationCount 0 cite: TABLE has no non-self row; cite replay.test.ts 'k = 0 on a non-empty destination'; scene ids for the two fixtures
### Default applied (technical)
- all of the above are harness/script/test contract choices
### Decision needed (functionality / UX / gameplay)
- (none)

Fix applied; words 707 (4.9x pass 0; over budget). Snapshot passes/pass3.md. All 6 majors and the 2 word-neutral minors applied. Unverified by fixer: tray letter strings per frame and validatable truth values derived from the ticket and view.ts, not replayed (fixtures do not exist yet).
