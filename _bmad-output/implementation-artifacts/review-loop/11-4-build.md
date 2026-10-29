# Review loop — ticket 11.4 build (code, 8cd6b84..HEAD)
State: pass 1: done

Target: commit range `8cd6b84..HEAD` (staged as `11-4-build.passes/pass0.diff`); intent `_bmad-output/initiative-wordcell-v1/epic-place-preview/story-how-to-play-place-scene-preview-plan.md`. Depth quick, max 7.
Pre-loop: HEAD fdb3bd57fc069f39f9fdb02f864104fd403b8a24, tree snapshot 0 0bf88627f82ab3ad82ab0702de6f85aa7a44c9ac.
Refs: docs/game-flow-spec.md, docs/requirements-carryover.md, CLAUDE.md, AGENTS.md, ARCHITECTURE-SPINE.md, DESIGN.md, EXPERIENCE.md, epic-place-preview.md, story-how-to-play-place-scene-preview.md.

## Pass 1 — 2026-10-29
Reviewers: correctness, verification gap  |  Findings: major 1, minor 3, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree 2e8f75f9abfc5d24a00fd316089a7261fd6bb1c9 (fix diff `11-4-build.passes/pass1.fix.diff`). Fixer: 4/4 applied, test-only (how-to-play-scenes.test.ts, scenes.test.ts, how-to-play.spec.ts); targeted e2e `npx playwright test e2e/how-to-play.spec.ts --project=android -g "with motion on the place scene tucks"` 1 passed. Orchestrator: `npm test` 3638 passed, `npm run lint` pass, `npm run check` 0 errors.
### Applied
- [major] `src/engine/how-to-play-scenes.test.ts` "a %s fails the harness" — no test proves the `previews` check visits an after with no listed entry (the title's "afters 3 and 8 none" is unasserted); add a row removing every after-7 entry, expecting `after 7 commands cell 6 stated preview none, engine E 6` → fixer item 1
- [minor] same it.each — the regex stops at "stated preview"; give each row its exact expected message → fixer item 2
- [minor] `src/ui/scenes/script.ts:89` — the new `mark-<frame>` tucks need is untested; add a defineScene throw case without `mark-4` → fixer item 3
- [minor] `e2e/how-to-play.spec.ts` motion-on tuck test — the poll reads the glyph text, not whether `place-4` is visible; add the layer's computed opacity → fixer item 4
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (correctness lens returned no findings)
