# Review loop — ticket 5.8 build (code mode, 875266c..44eda8b)
State: pass 1: fix (fixer running)

Target: `_bmad-output/implementation-artifacts/review-loop/5-8-build.passes/pass0.diff` (git diff 875266c..44eda8b)
Intent: `_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-free-letters-by-tap-and-by-drag-plan.md`
Depth: thorough (correctness, edge cases, verification gap, intent alignment; fix diff from pass 2) | max 7
Pre-loop: HEAD 44eda8b1b05c02df36e6cc046a4192fa23be5003, tree snapshot 0 b4b0814421f52aaa3f3265971c335b84630597b0

## Pass 1 — 2026-10-09
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 3, minor 5, decision-needed 1  |  Dropped in triage: 2
### Applied
- [major] controller.ts createParting `take()` — reads the current offset as face rect − slot, but a non-start block mirror face has `margin: 0` (Card.svelte `.block .face`), so it rests 2 px left of its slot; on a block of ≥ 2 mirrors the mirror animates (−2 px twitch, gate held, AD-14 breach) at caret/unaccepted changes, block-left gaps and every fly-back return; read the offset from the computed transform instead and add a k ≥ 2 Vitest → fixer item 1
- [major] controller.test.ts free-letter ender tests (F5 pointercancel/lostpointercapture/byBack; cancel()/same-id/detach) and P5 ends — the caret is never shown when a cancel-type end happens, so "hides the caret at every end" passes with `hideCaret` deleted; add caret-shown variants → fixer item 2
- [major] Card.svelte parted segment CSS — no browser check that under `wc-parted` the lock and segment ends follow `wc-part-start`/`wc-part-end` and ignore `.start`/`.end` (the only parted P5 has a one-mirror block); add a P5 on an existing k = 2 block setting the classes via `page.evaluate` (no new fixture) → fixer item 3
- [minor] e2e/free-letter.spec.ts back mid-drag test — plan says it asserts nothing selected and cell 7 unused; it does neither → fixer item 4
- [minor] controller.test.ts:4361, 4470 — caret-takeover return and mirror normal-motion animations only partly asserted (empty transform; last animation only) → fixer item 5
- [minor] e2e/free-letter.spec.ts reduced-motion mirror return P5 — moves outside the band before release, so the mirror is already at rest and `home()`'s reduced-motion mirror snap branch is never reached; end with pointercancel while parted → fixer item 6
- [minor] e2e/free-letter.spec.ts block-right P5 runs under emulated reduced motion without saying so in its name → fixer item 7
- [minor] DRAG_TILES lifts the `.tiles` clip at the crossing, so with ≥ 15 tiles the clipped third row shows for the whole drag and can receive a parted tile; ticket accepts clipping until CAP-9 — record for entry 12 in the plan's deferred list → fixer item 8
### Default applied (technical)
- createParting `take()` — current offset from the face's computed transform (includes a running WAAPI effect), not rect − slot
- parted CSS browser check — `page.evaluate` class writes on an existing k = 2 Composing block, no new fixture
### Decision needed (functionality / UX / gameplay)
- controller.ts perform() `addFreeLetter` — on desktop, clicking a WordCell to add its letter while that cell's hover preview is open leaves the preview open (now showing the letter used) until the mouse leaves the cell; EXPERIENCE.md closes the peek only for key commands — proposed default: keep as built (preview stays open and updates)
### Dropped
- plan Verification — `npm run test:all` never green as one command: environment (a stale owner-started `vite --host` on port 5173 that Playwright reuses); every step ran green separately; recorded for the owner, not a code defect
- (duplicate) edge-case reviewer's back-test finding merged into item 4
