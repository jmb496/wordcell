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

Pins AD-16's boot order in main.ts minus the pointer controller (epic 4), the end-sheet surface (epic 6), the service worker and requestPersistence() (epic 7) (nav launch → font check → prefs → Session and history → lifecycle and resume → boot surfaces → mount → dictionary after first paint and visibility); epic 3's boot surfaces are the rejected root and the History notice. src/main.ts boot() already runs this order for epic 3 and changes only if a new AD-16 case fails.

Adds the AD-17 restore suite in e2e/restore.spec.ts, with the android-only beforeEach skip the sibling specs use. Fixtures and test ids:

- R-73: session-place-free-letter-redo-tail.json, session-gave-up.json.
- AD-17: session-gave-up.json plus history-three-records.json, then Undo (the finish recorded then undone); after the reload loaded().history.records deep-equals history-three-records.json's records without its last one (AD-17 "the record stays removed", build-notes CAP-10).
- AD-17: prefs-non-default.json, seeded alone; boot writes a fresh Session, which the snapshot holds (so the Session is present before the reload), and loaded().history is null.
- Q-41 (R-73): session-below-committed-last.json.

Each case runs hidden-then-reloaded and plain-reloaded: seedStorage(page, …, { captureBoot: true }) → goto → wait until current().kind !== 'booting' → the case's dispatch (Undo only for the finish-undone case; no other case dispatches) → hidden mode: hidePage(page), then snapshot; plain mode: snapshot → page.reload() → wait until not booting → assert. The snapshot reads current() and, in the same page.evaluate, which wordcell:* keys exist in localStorage; "present before the reload" means present in localStorage at snapshot time. Asserts: all three loaded() fields deep-equal JSON.parse of __wordcellBoot (null when absent), the Session equal to the snapshot except activeMs not smaller, and history and prefs equal to the snapshot only when present before the reload (SPEC.review-log.md Pass 3 open major 1).

Crash mode (Done when 2): extend, not duplicate, game-store.spec.ts 'R-73 kill variant: an Undo on session-place-free-letter-redo-tail.json survives a renderer crash'. It keeps its Undo dispatch (the last write is a dispatch, differing from the seed), adds captureBoot(page2) before page2's goto, and asserts all three loaded() fields deep-equal JSON.parse of page2's __wordcellBoot and loaded().session deep-equals the Session as written by the Undo exactly (activeMs included, no flush ran). A plain reload still fires pagehide, so the crash mode is the no-flush proof.

Interface: main.ts boot sequence only; build-notes Spine notes gain the AD-17 snapshot amendment (loaded() fields vs __wordcellBoot; snapshot equality only for keys present before reload). The amendment is recorded in build-notes.md Spine notes; ARCHITECTURE-SPINE.md is not edited.
Tests: AD-16 order cases; AD-17 restore suite; R-73 restored on launch and exact phase; Q-41 below-committed-last restore.
Owns: The boot order and the restore-boundary suite.

## Acceptance Criteria

Verify: npm run test:all is green with the restore suite passing on android, and each AD-16 ordering promise covered (existing tests kept as they are, not duplicated):

- A held **/en*.txt route sees the request only once card-0 and primary-action are in the DOM: existing dictionary.spec.ts 'AD-16 the word-list request arrives with card-0 and primary-action in the DOM'.
- A startHidden page (no halt) with card-0 attached makes no **/en*.txt request; after showPage exactly one request arrives and dictionaryState() reaches 'ready': new AD-16 test beside the AD-16 describe in dictionary.spec.ts.
- Nothing written before the font check: new AD-16 healthy fresh-launch case in blocking.spec.ts beside the Q-37 AD-15 font tests (nothing seeded, captureBoot only): hold the **/*.woff2 route, wait for current().kind 'booting', assert no wordcell:* key in localStorage; release the route, then wordcell:session is written and deep-equals current().session.
- With a rejected Session and an unreadable history, the rejected root shows and no History notice is pushed until New game: existing nav.spec.ts '§2 AD-13 deferred push: …'.
- Kill: the extended game-store.spec.ts kill variant above.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell.md

## Notes

- Open question: None.
