---
id: 15
type: story
title: "Close the 7.11 §6.4 test-name and celebration-colour gaps"
parent: epic-pwa-release
covers: [CAP-9]
after: [10]
risk: low
---

# Close the 7.11 §6.4 test-name and celebration-colour gaps

## Description

Fix ticket from ticket 7.11's §6.4 audit (plan `story-close-out-documents-audits-and-device-read-plan.md`, fix-ticket proposals 1 and 2; owner decision 2026-11-07 in the epic Notes). Tests plus one coverage-row edit; no `src/` change; a failing new assertion that shows a real `src/` defect stops for the owner.

(1) Q-17 (portrait on the phone, responsive in a browser) has no passing test whose title carries Q-17, though the behaviour is tested (G1 passed). Retitle two tests, assertions unchanged, each title starting `Q-17` with its AD id kept after it: `e2e/pwa/build-output.spec.ts:22` for the portrait half (it asserts the manifest's `orientation: 'portrait'`; e.g. "Q-17 AD-16 the built web manifest is exactly DESIGN.md A-D5 plus the plugin defaults"), and `e2e/hover-peek-reanchor.spec.ts:83` (`desktop` describe, "AD-12 an open hover peek re-anchors above its cell after a viewport width change…") for the responsive half (it asserts the cell moves and narrows as the viewport goes from 700 to 600 px wide, the AD-11 width rule).

(2) R-87's "no colour change" clause (Q-48) has no automated assertion. Add one test, title starting `R-87`, in the `android` describe of `e2e/celebration.spec.ts` beside "R-87 the copies: 55 face copies…" (:324), reusing `readyToWin`, `winIntoRun` and the manual-clock stepping of `stepUntilShown`:
- First, every live card's `.face` (inside its `[data-card-id]` element) on the won board shows one and the same computed value set.
- Then it samples the run at two points: the first step at which a group is shown, and a later step before the run's cap. Each sample reads only shown copies (group computed opacity > 0, copy visible).
- At each sample: `[data-celebration-root]` and each shown `[data-celebration-group]` have computed `filter` `none` and `mix-blend-mode` `normal`; each shown `[data-celebration]` copy's computed `color`, `background-color`, `background-image`, `border-top-color` and `filter` equal the live face set; the QU copy's `.badge` `background-color` and `color` equal a live QU card's `.badge` (the fixture's QU is in JDAQUYE).

(3) `_bmad-output/specs/spec-epic-10-end-of-game-words/rule-coverage.md:61` lists "No trail, no colour change" (R-87, Q-48) under Exempt as visual. Move it to a mapped P6 row naming the new R-87 colour test and, for "no trail", "R-87 the copies: 55 face copies…".

## Acceptance Criteria

Verify: for each new or retitled title, `grep` finds it and the final `npm run test:all` log shows its `✓` list-reporter line (the manifest test under both `pwa` and `dist-smoke`); epic 10 `rule-coverage.md` has no Exempt line for "no colour change" and a P6 row naming both R-87 tests; no `src/` file changed; `npm run test:all` is green (and `npm run test:screens` if a screenshot spec changed).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- plan — _bmad-output/initiative-wordcell-v1/epic-pwa-release/story-close-out-documents-audits-and-device-read-plan.md (§6.4 audit, fix-ticket proposals 1 and 2)
- code — e2e/pwa/build-output.spec.ts, e2e/hover-peek-reanchor.spec.ts, e2e/celebration.spec.ts
- coverage — _bmad-output/specs/spec-epic-10-end-of-game-words/rule-coverage.md (Exempt, :61)
- spec — docs/game-flow-spec.md Q-17, Q-48, R-87
