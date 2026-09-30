---
id: 5
type: story
title: "Fatal surface, rejected Session and single instance"
parent: epic-app-shell
covers: [CAP-4]
after: [4]
risk: medium
---

# Fatal surface, rejected Session and single instance

## Description

Adds main.ts's error/unhandledrejection handlers (store halt('fatal'), then the DESIGN.md Blocking message with the error text and Reload, standalone before mount and rendered reactively from haltCause), the boot font check with its 30 s timeout, the Session-rejected root with its three catalogue variants and New game (the UI handler resets overlays from entry 8 on), the storage-event halt registered at store creation (key null on localStorage counts; halt while booting stops boot: load still parses, no write, no listeners, no mount, no dictionary), haltCause with fatal always winning, and the e2e storage-spy helper armed by page.evaluate after boot (review-log open major 4).

## Acceptance Criteria

Verify: npm run test:all is green, and Playwright on android shows a 404 font giving the fatal surface with localStorage empty, a spied setItem throwing on a dispatch giving the fatal surface and no later write, session-invalid-version-unknown.json, session-invalid-null.json, session-invalid-s2-last-only.json and a replay-rule fixture such as session-invalid-r50-placement-order.json each showing their catalogue text with bytes unchanged across a reload and New game replacing them, and a second unseeded page's Undo halting a first page seeded with session-place.json with the another-window message.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell.md
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Message catalogue (Session rejected rows), State Patterns (Open in another window, Unexpected failure)

## Notes

- Open question: None.
