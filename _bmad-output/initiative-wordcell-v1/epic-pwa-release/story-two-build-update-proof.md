---
id: 3
type: story
title: "Two-build update proof"
parent: epic-pwa-release
covers: [CAP-4]
after: [2]
risk: medium
---

# Two-build update proof

## Description

Adds CAP-4's update proof on entry 2's state (a redundant install of B reports `failed` and halts the spec instead of leaving it waiting): `e2e/helpers/static-server.ts` (F8: copies a build dir, swaps or removes files, serves it with `/` mapped to `index.html` directly, `index.html` for any other missing path only on navigation requests (`Sec-Fetch-Mode: navigate`, unverified) and 404 otherwise, `/sw.js` included; per the review log's unapplied minor the install fetch requests plain `/index.html`, so no `?__WB_REVISION__` rationale or test case; both fallback branches covered in `e2e/helpers.spec.ts`; reused by entry 7's missing-`sw.js` cases), a shared no-prompt check in `e2e/helpers/` (no `dialog`, `alertdialog`, `alert` or `status` role besides App's live region, `REGION` in `e2e/helpers/live-region.ts`; reused by entry 6), and an `e2e/pwa/` update spec on a `dist-test/` copy with build marker A: after A is active and every open page controlled, B (A's `sw.js` with the `index.html` revision changed and `index.html` with marker B) is written; a reload leaves `swState()` `waiting`, marker A and no prompt; with B waiting, two pages open, one closed and another opened still show A; only a page opened after every page closed and B activated shows marker B, controlled, `swState()` polling to `active`, no prompt.

## Acceptance Criteria

Verify: `npm run test:e2e:pwa` passes the update spec (named Q-40 AD-16 A-A15) and `e2e/helpers.spec.ts` passes the static-server fallback cases; if Chromium's own activation timing differs from A-A15 (never a routing or serving limit), the plan records it and the row becomes the G3 D gap per SPEC Assumptions; `npm run test:all` is green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- spec — SPEC.md CAP-4, F6, F8, Assumptions; build-notes.md Playwright mechanics (Update); SPEC.review-log.md Result (unapplied minors)
- architecture — ARCHITECTURE-SPINE.md AD-16 (update policy), AD-17 (Projects)
- ux — EXPERIENCE.md State Patterns (New app version installed), A-E4
- code — e2e/helpers/live-region.ts, e2e/helpers/dist-test.ts, e2e/helpers.spec.ts, playwright.pwa.config.ts

## Notes

- Open question: Whether Playwright 1.63's Chromium activates the waiting worker exactly when every page of the context has closed, and whether it sends `Sec-Fetch-Mode: navigate` to the local server (unverified).
