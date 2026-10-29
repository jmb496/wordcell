# Review log — story-how-to-play-place-scene-preview.md (ticket 11.4)

State: pass 4: done

Mode: docs, thorough, max 7, budget 1500 words. Pre-loop: HEAD ab31448, copy `story-how-to-play-place-scene-preview.review-log.passes/pass0.md`, 167 words.

## Pass 1 — 2026-10-28
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 4, minor 8, decision-needed 1  |  Dropped in triage: 3 (plus duplicates merged)
Words (docs): 720 (4.3 x pass 0; budget 1500)  |  Snapshot: story-how-to-play-place-scene-preview.review-log.passes/pass1.md
Fixer: all 10 items applied; no commands added beyond the existing npm scripts; decision-needed item left untouched (the ticket is silent on a count badge).
### Applied
- [major] Acceptance Criteria — no per-frame expectations; "plays the Place scene" cannot fail on a wrong preview; the D5-pinning tests (e2e/how-to-play.spec.ts reduced-motion place test, scenes.test.ts D11 test at :1160 and the `AD-14 frame cell 6 state` describe at :1434/:1464) are not named as updated, not deleted → fixer item 1
- [major] Description, "fixture is unchanged" — the preview (top letter, empty cell 6, count) would be re-derived in the UI with no engine check, unlike every other drawn scene fact (types.ts, epic 8 post-close review, entry 2 Never list) → fixer item 2 (default applied)
- [major] Description — motion-on Confirm/tuck fly: layer place-4 keeps E★ under the fliers until place-5, contradicting E6 / DESIGN.md "the star goes at commit" → fixer item 3 (default applied)
- [major] Description, "reusing entry 2's ★ pill" — the fixed 16 px / 11 px `.preview-mark` is not counter-scaled on the scene stage (D12, Stage.svelte rules cover `.badge` and `.mark` only), so it drops under the 11 px floor → fixer item 4 (default applied)
- [minor] AC — baseline frame base, test and snapshot name unstated → item 5
- [minor] AC — "the how-to-play Vitest" ambiguous (src/ui/how-to-play.test.ts vs src/engine/how-to-play-scenes.test.ts); test:all / test:screens green not required → item 6
- [minor] Description — frame 2 cell 6 "empty outline" is drawn with its legal ring → item 7
- [minor] Description — previewMark on a `static` card, not the `preview` mirror (AD-14 scene copies) → item 8
- [minor] Description — "Place frames" undefined; frame 5 unchanged; the used target never draws L → item 9
- [minor] Description — D5 code comments (place.ts, Scene.svelte, scenes.test.ts, how-to-play.spec.ts) to cite Q-49 for frames 1–4 → item 10
### Default applied (technical)
- Preview source → fixture `previews` entries (after, cell, top letter or null, count) checked by the engine harness against `view().cells[].preview`; Scene.svelte draws from them; Place frames drop `cell6`
- ★ at Confirm (motion on) → a declared scene element for frame 4's mark held at opacity 0 from the Confirm tap, previewed top stays under the fliers; asserted in scenes.test.ts effects and the motion-on tuck Playwright test
- ★ pill on the stage → Stage.svelte counter-scales `.card .preview-mark` by `--wc-scene-up`; stage.test.ts AD-11 list gains it
- Baseline → frame index 4 (four Next clicks), `AD-17 how to play scene 3 frame 4 screenshot at 360 px`, `how-to-play-scene-3-frame-4.png`
### Decision needed (functionality / UX / gameplay)
- Description — In the game the previewed target shows a "6" count badge (its cards after Confirm); How to play scenes never draw count badges (the final frame shows cell 6 as one card E). Should the scene's previewed WordCell show the "6"? — proposed default: no count badge in the scene (the star only), keeping every scene frame badge-free
### Dropped
- Hard-coded cell 6 risk (adversarial) — resolved by construction by the fixture `previews` default
- Extra baseline for frame 2 (adversarial) — the per-frame DOM assertions cover it; one baseline kept
- Duplicate "empty outline" / "how-to-play Vitest" findings merged

## Pass 2 — 2026-10-28
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 3, minor 11, decision-needed 0  |  Dropped in triage: 0 (duplicates merged; 2 reviewer majors reclassified minor)
Words (docs): 962 (5.8 x pass 0; budget 1500)  |  Snapshot: story-how-to-play-place-scene-preview.review-log.passes/pass2.md
Fixer: all 12 items applied; no commands or config values added; rule 6 cited as "CLAUDE.md rule 6" per AGENTS.md citation convention.
### Applied
- [major] Description ¶5 with ¶4 — the ★ must be a declared, separately held scene element, but it is Card.svelte's internal `.preview-mark` span with no `data-scene-el` hook; a wrapper would hide E too (all four lenses) → fixer item 1 (default applied)
- [major] Description ¶2 — how Scene.svelte maps a frame to its `previews` entries (Frame has no `after`) and what a Place frame with no entry does → item 2 (default applied)
- [major] Description ¶2 / AC bullet 1 — the harness's "no other cell has a preview" check has no stated range (afters 3 and 8 unchecked) and only one negative case covers two checks → item 3 (default applied)
- [minor] tickets.toml entry 4 says the fixture is unchanged (three lenses, reported major) — reclassified minor: the toml entry is this ticket's own pass-0 stub, which the refined ticket supersedes; fix is one clause → item 4
- [minor] AC bullet 3 — the shared `it.each` case `AD-14 R-33 scene %s: cell 6 is drawn used exactly while …` also pins place frames 1–4; the old names become false (reported major by one lens) — reclassified minor: the ticket's scope (place frames 1–4 only) already fixes the new rule, so a builder does not guess → item 5
- [minor] ¶5 / AC bullet 5 — "from the Confirm tap" vs the strip/Confirm holds of the tuck fly step (place-step-6) → item 1
- [minor] ¶5 — "Reduced motion is unchanged" reads against the frame table → item 6
- [minor] ¶2 — `SceneFixture` (scene-replay.ts) gains `previews` too; `'QU'` convention for `top` → item 7
- [minor] last ¶ — "epic 8 Notes are left for entry 5's close-out": entry 5 does not own the epic 8 file; this epic's Notes already record the supersession → item 8
- [minor] AC bullet 6 — src/ui/how-to-play.test.ts mounts no scene, so it cannot fail; the static-card check is scenes.test.ts `not.toContain('data-mirror-of')` → item 9
- [minor] ¶1 — say other scenes (free-letter's Validate-pressed frame) are unchanged (E7) → item 10
- [minor] AC bullet 2 — "the previewed top stays" is not observable in an effects unit test; reword → item 11
- [minor] ¶6 — counter-scale "as the badge: size and font, not the inset" → item 12
### Default applied (technical)
- ★ element → optional Card prop (e.g. `markEl`) writing `data-scene-el` on the `.preview-mark` span, passed only by Scene.svelte; id `mark-4`, in place.ts `elements`; held at opacity 0 in the tucks fly step's phase-0 holds with `strip-4` and `confirm` (effects.ts); Card.svelte listed as changed
- Frame mapping → optional `Frame.after` set in place.ts on frames 1–4 (4–7); Scene.svelte looks up `previews` by it and throws when a `placeOrder` frame has none; scenes.test.ts asserts `frame.after` equals the applied command count
- Harness range → at every after 0..commands.length the engine's previews equal the listed entries exactly; negative `it.each` (Q-49): wrong top, wrong count, missing entry, extra entry for an unchanged cell
### Decision needed (functionality / UX / gameplay)
- (none new; the pass-1 count-badge question stands)
### Dropped
- (none)

## Pass 3 — 2026-10-28
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 3, minor 8, decision-needed 0  |  Dropped in triage: 1 (duplicates merged)
Words (docs): 1091 (6.5 x pass 0; budget 1500)  |  Snapshot: story-how-to-play-place-scene-preview.review-log.passes/pass3.md
Fixer: all 11 items applied; no commands added.
### Applied
- [major] Description ¶2 — the pass-2 exact-match harness check, run on every fixture, fails free-letter (it ends on `validate`, so the engine reports a cell 6 preview); not gated on `previews` being present (three lenses) → fixer item 1 (default applied)
- [major] Description ¶2 / AC — Scene.svelte's fail-fast throw for a `placeOrder` frame with no entry (or no `after`) has no test (three lenses) → item 2 (default applied)
- [major] Description motion ¶ / AC e2e bullet — "from the start of `place-step-6`" includes the step's `wait` hold (player.ts:132–133) when the ★, strip and Confirm are still drawn; and "no ★" cannot pass with motion on, since layers place-1…3 keep their D★ under place-4 (opacity 1, occluded) → item 3 (default applied)
- [minor] ¶3–4 — `markEl` only on the last `placeOrder` frame's target (`mark-<i>`), id derived as `stripId` is, in defineScene's tucks `needs` → item 4
- [minor] ¶2 — `previews` `after` values pass the harness range check; the AD-2 out-of-range test covers `previews` → item 5
- [minor] AC bullet 1 — the `frame.after` scenes.test.ts clause sits in the engine bullet; frames 0 and 5 carry no `after` → item 6
- [minor] AC bullets 2, 5 — Q-49 added to the tuck unit test and motion-on e2e test names → item 7
- [minor] AC bullet 6 — five `not.toContain('data-mirror-of')` assertions exist; name `AD-3 scene place: six layers …` → item 8
- [minor] Frame table row 2 — "shows only D" as rows 1, 3, 4 → item 9
- [minor] AC bullet 3 — free-letter's used look is D4/D11, not D5: "keep the used look" → item 10
- [minor] ¶2 — "never from the cell number" is untestable; cut → item 11
### Default applied (technical)
- Harness gate → the exact-match check runs only when a fixture has `previews` (optional in `SceneFixture` and `SceneFixtureData`); free-letter unchecked and unchanged
- Throw test → scenes.test.ts (AD-14 Q-49) renders a `placeScene` copy whose frame 2 `after` names an after with no entries, and one with `after` removed; both throw
- ★ timing → the scene's commit moment is the fly step's phase 0 (after its wait), when `strip-4` and `confirm` go; e2e asserts `[data-scene-el="mark-4"]` computed opacity 0 and place-4's cell 6 glyph E while the `place-step-6` `tuck-*` animations run
### Decision needed (functionality / UX / gameplay)
- (none new; the pass-1 count-badge question stands)
### Dropped
- `.card` text reads "D★" in the e2e per-frame check (adversarial, self-labelled stretch, no ticket words needed) — build-plan detail

## Pass 4 — 2026-10-29
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 0, minor 10, decision-needed 0  |  Dropped in triage: 0 (duplicates merged: the `wait` wording from all four lenses, the head-test finding from two)
Words (docs): 1091 (6.5 x pass 0; budget 1500), no fix pass  |  Snapshot: story-how-to-play-place-scene-preview.review-log.passes/pass3.md (unchanged)
### Applied
- (none: zero majors, the loop stops; minors below are left for the build)
### Default applied (technical)
- (none)
### Decision needed (functionality / UX / gameplay)
- (none new; the pass-1 count-badge question stands)
### Dropped
- (none)

## Result — converged after 4 passes

Majors per pass: 4, 3, 3, 0. Words 167 → 1091. Open decision-needed (pass 1): should the scene's previewed WordCell show the "6" count badge the game shows; proposed default no badge (the star only).

Unapplied minors (for the build plan):
- Description motion ¶ — "after its `wait`": the tuck fly step (`place-step-6`, place.ts last step) has no `wait`; only the Confirm tap step (`place-step-5`) has one (player.ts:131–133). Cut ", after its `wait`,"; phase 0 of `place-step-6` is the exact moment (all four lenses).
- AC bullet 1 — how-to-play-scenes.test.ts:421 `R-38 R-41 scene place: BALKED missing from the dictionary …` spreads `place` into a 4-command copy and expects no throw; it keeps the new `previews` (afters 4–7), so the range check fails. Add `previews: []` to its emptied-field list (a present-but-empty `previews` still runs the exact check, afters 0..4 show no preview).
- References — add `src/ui/scenes/script.ts` (defineScene's tucks `needs` changes).
- AC bullet 3 — the shared `it.each` name also produces the move-compose, free-letter and source-drop cases; keep it scene-neutral (e.g. "… hold its top card, except on Place frames (Q-49)") rather than a blanket Q-49 rename.
- ¶2/¶4 — state that every non-null `previews` top is drawn with `previewMark` (E4), `markEl` only on the last `placeOrder` frame's target (no such non-target case occurs in this fixture).
- ¶4 — `.preview-mark` is absolutely positioned and the scene's `place="column"` card is not a positioned element, so the pill sits against Scene.svelte's `.stack`; correct only while each previewed cell is a one-card stack. Note the containing block in the plan.
- AC bullet 4 — stage.test.ts AD-11 regex only checks a rule contains `var(--wc-scene-up)`; for `.card .preview-mark` assert width, height and font-size each read it.
- AC bullet 1 — anchor the Q-49 negative cases on the previews mismatch message, not a bare `toThrow()`.
- Last ¶ — e2e/how-to-play.spec.ts:541 cites D5 only for frame 0 (no change needed); Scene.svelte's `cellCards` comment (:153) becomes false and is not listed. Swap one for the other.
- ¶2 — "on frames 1–4 (4–7)" → "on frames 1–4 (`after` 4–7)".
