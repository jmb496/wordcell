---
id: 8
type: story
title: "Hook-free celebration suite"
parent: epic-end-of-game-words
covers: [CAP-6]
after: [6, 7]
risk: medium
---

# Hook-free celebration suite

## Description

Adds to `e2e/pwa/dist-smoke.spec.ts` (run by the `dist-smoke` project of `playwright.pwa.config.ts` against `dist/`, with no test hook) a real win by seeding the won-words fixture through `seedStorage` (or `openFixture` with `booted: false` and the `undo` step, since `dist/` has no hook to wait on), one Undo and Confirm, that plays the celebration in real time, is skipped by entry 6's press helper and by back, and opens the expanded end sheet; the audit result is that no hook-free spec wins a game today, so no existing spec changes.

## Acceptance Criteria

Verify: `npm run build` then `npm run test:e2e:dist` is green and the new hook-free test passes against the production build.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/epic-end-of-game-words.md
- architecture — ARCHITECTURE-SPINE.md AD-17 (Celebration seam), AD-18
- code — e2e/pwa/dist-smoke.spec.ts, playwright.pwa.config.ts (dist-smoke project)
