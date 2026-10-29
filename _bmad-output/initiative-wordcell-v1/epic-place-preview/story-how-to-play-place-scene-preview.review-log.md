# Review log — story-how-to-play-place-scene-preview.md (ticket 11.4)

State: pass 2: done

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
