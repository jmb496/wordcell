---
id: 8
type: story
title: "Nav adapter, overlays core, History notice and Reset confirm"
parent: epic-app-shell
covers: [CAP-7]
after: [7]
risk: high
---

# Nav adapter, overlays core, History notice and Reset confirm

## Description

Builds nav.ts (the only History API and popstate user: launch rewind with its 250 ms timeout, launch id, queued push and pop, pending-pop counting, stale-launch and Forward rules), the overlays.svelte.ts core (E3), the History notice with its three catalogue variants pushed once per launch at boot or after New game from the rejected root, wires overlays.resetForNewSession() into both New game handlers (rejected root and game over), and the Reset confirm (Keep it returns to the notice, Delete history resets and closes both top-down); History-notice flows count as §2 rejection flows and may seed history-invalid-* fixtures.

## Acceptance Criteria

Verify: npm run test:all is green, and Playwright on android with history-invalid-version-unknown.json seeded shows Not now and back closing the notice, back on the confirm closing only the confirm, Delete history writing { version: 1, records: [] }, a reload with the notice (or notice and confirm) open re-pushing only the notice at { wc: 1, launch: <new> } with the first back closing it and the next leaving the app, the rejected root pushing no entry, and win → New game → back leaving the app.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell.md
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Information Architecture, Message catalogue (History unreadable, Reset history confirm), Flow 7

## Notes

- Open question: Whether Playwright's goBack reproduces Chrome's handling of entries pushed without user activation (A-A11 stays an epic 7 device check).
