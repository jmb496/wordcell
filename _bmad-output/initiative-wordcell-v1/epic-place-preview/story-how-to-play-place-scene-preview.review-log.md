# Review log — story-how-to-play-place-scene-preview.md (ticket 11.4)

State: pass 1: done

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
