---
id: 11
type: story
title: "Boot order and restore boundaries"
parent: epic-app-shell
covers: [CAP-10]
after: [10]
risk: medium
---

# Boot order and restore boundaries

## Description

Pins AD-16's boot order minus the service worker in main.ts (nav launch → font check → prefs → Session and history → lifecycle and resume → boot surfaces → mount → dictionary after first paint and visibility) and adds the AD-17 restore suite: session-place-free-letter-redo-tail.json, session-gave-up.json, session-gave-up.json with history-three-records.json undone, prefs-non-default.json and session-below-committed-last.json (Q-41), each hidden-then-reloaded and plain-reloaded, asserting all three loaded() fields deep-equal JSON.parse of __wordcellBoot (null when absent), the Session equal to the pre-reload snapshot except activeMs not smaller, and history and prefs equal to the snapshot only when present before the reload (review-log open major 1), plus a CDP Page.crash mode for session-place-free-letter-redo-tail.json (Done when 2); a plain reload still fires pagehide, so the crash mode is the no-flush proof.

## Acceptance Criteria

Verify: npm run test:all is green with the restore suite passing on android, a held **/en*.txt route seeing the request only once card-0 and primary-action are in the DOM, a startHidden page making no dictionary request until showPage, nothing written before the font check, and the rejected root shown before the History notice.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell.md

## Notes

- Open question: None.
