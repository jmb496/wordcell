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

Fix ticket from ticket 7.11's §6.4 audit (plan `story-close-out-documents-audits-and-device-read-plan.md`, fix-ticket proposals 1 and 2; owner decision 2026-11-07 in the epic Notes). Tests plus one coverage-row edit, which follows from fix-ticket proposal 2 because the §6.4 sentence-level audit reads the epics' `rule-coverage.md` (release-checklist §6.4), so it is no new scope; no `src/` change. A failure of the new test's own premise (e.g. live faces not uniform on the won board) is fixed in the test and recorded in the plan, not an owner stop; only a copy differing from the live face (a real `src/` defect) stops for the owner.

(1) Q-17 (portrait on the phone, responsive in a browser) has no passing test whose title carries Q-17, though the behaviour is tested (G1 passed). Retitle two tests, assertions unchanged, each title starting `Q-17` with its AD id kept after it: `e2e/pwa/build-output.spec.ts:22` for the portrait half (it asserts the manifest's `orientation: 'portrait'`; e.g. "Q-17 AD-16 the built web manifest is exactly DESIGN.md A-D5 plus the plugin defaults"), and `e2e/hover-peek-reanchor.spec.ts:83` (`desktop` describe, "AD-12 an open hover peek re-anchors above its cell after a viewport width change…") for the responsive half (it asserts the cell moves and narrows as the viewport goes from 700 to 600 px wide, the AD-11 width rule).

(2) R-87's "no colour change" clause (Q-48) has no automated assertion. Add one test, title starting `R-87`, in the `android` describe of `e2e/celebration.spec.ts` beside "R-87 the copies: 55 face copies…" (:324), reusing `readyToWin` (as `readyToWin(page, 'prefs-theme-scifi')`: Normal speed, and a `--wc-card-texture` that is not `none`, unlike Charcoal's, `src/ui/app.css:39`), `winIntoRun` and the manual-clock stepping of `stepUntilShown`:
- First, after `winIntoRun` and before the first step, every live card's `.face` (inside its `[data-card-id]` element) on the won board shows one and the same computed value set of the face properties of the third bullet, and every live `.glyph` one computed `color`.
- Then it samples the run at two manual-clock steps, both bounded by the run's cap (`NORMAL_CAP_STEP_MS`): the first step at which a group is shown, and the first step at which the QU copy (in JDAQUYE, group 1 in `WON_ROWS`) is shown. Each sample reads only shown copies (group computed opacity > 0, copy visible) and first asserts at least one; the second asserts the QU copy is among them.
- At each sample: `[data-celebration]` still counts 55 and `[data-celebration-root]` holds only its `[data-celebration-group]` elements and their copies (no trail); the root and each shown group have computed `filter` `none` and `mix-blend-mode` `normal`; each shown `[data-celebration]` copy's computed `color`, `background-color`, `background-image`, `border-top-color` and `filter` equal the live face set, and its `.glyph` `color` equals a live card's `.glyph`; the QU copy's `.badge` `background-color` and `color` equal a live QU card's `.badge`.

(3) `_bmad-output/specs/spec-epic-10-end-of-game-words/rule-coverage.md:61` lists "No trail, no colour change" (R-87, Q-48) under Exempt as visual. Move it to a mapped row, `| R-87 no trail of copies and no colour change (Q-48) | CAP-3 | P6 |`, like the file's other R-87 rows; per its header the row cites no titles, and the plan records the new test for both clauses and "R-87 the copies: 55 face copies…" (:324) as the second test for "no trail".

## Acceptance Criteria

Verify: for each new or retitled title, `grep` finds it and the final `npm run test:all` log (a local run with `CI` unset, which selects the `list` reporter, `playwright.base.ts:18`) shows its `✓` line (the manifest test under both `pwa` and `dist-smoke`); epic 10 `rule-coverage.md` has no Exempt line for "no colour change" and has the R-87 "no trail of copies and no colour change (Q-48)" P6 row; no `src/` file changed; `npm run test:all` is green (and `npm run test:screens` if a screenshot spec changed).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- plan — _bmad-output/initiative-wordcell-v1/epic-pwa-release/story-close-out-documents-audits-and-device-read-plan.md (§6.4 audit, fix-ticket proposals 1 and 2)
- code — e2e/pwa/build-output.spec.ts, e2e/hover-peek-reanchor.spec.ts, e2e/celebration.spec.ts
- coverage — _bmad-output/specs/spec-epic-10-end-of-game-words/rule-coverage.md (Exempt, :61)
- spec — docs/game-flow-spec.md Q-17, Q-48, R-87
