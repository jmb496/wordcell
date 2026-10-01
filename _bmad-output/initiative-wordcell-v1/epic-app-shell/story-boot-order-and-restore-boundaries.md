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
- Q-41 R-73 (test name starts "Q-41 R-73 …"): session-below-committed-last.json.

Test titles: '<id> <fixture> restores after hidden then reloaded' / '<id> <fixture> restores after a reload without a hide'. Each case runs hidden-then-reloaded and plain-reloaded: seedStorage(page, …, { captureBoot: true }) → goto → wait until window.__wordcell?.current().kind !== 'booting' → the case's dispatch (Undo only for the finish-undone case; no other case dispatches) → hidden mode: hidePage(page), then snapshot; plain mode: snapshot → page.reload() → wait until not booting → assert. Reuse game-store.spec.ts's open() and snapshot() (extracting them to e2e/helpers/ if needed), not a third version. The snapshot reads current() and, in the same page.evaluate, which wordcell:* keys exist in localStorage; "present before the reload" means present in localStorage at snapshot time. Asserts: all three loaded() fields deep-equal JSON.parse of __wordcellBoot (null when absent), the Session equal to the snapshot except activeMs not smaller, and history and prefs equal to the snapshot only when present before the reload (SPEC.review-log.md Pass 3 open major 1); after the reload current().kind is 'active', current().session deep-equals loaded().session except activeMs not smaller, and current().prefs deep-equals loaded().prefs when that is non-null (as the kill variant does via sessionOf).

Crash mode (epic Done when 2): extend, not duplicate, game-store.spec.ts 'R-73 kill variant: an Undo on session-place-free-letter-redo-tail.json survives a renderer crash'. It keeps its Undo dispatch (the last write is a dispatch, differing from the seed), adds captureBoot(page2) before page2's goto, and asserts all three loaded() fields deep-equal JSON.parse of page2's __wordcellBoot and loaded().session deep-equals the Session as written by the Undo exactly (activeMs included, no flush ran). A plain reload still fires pagehide, so the crash mode is the no-flush proof.

Interface: main.ts boot sequence only (no src/ change expected; it changes only if an AD-16 case fails); build-notes Spine notes gain the AD-17 snapshot amendment (loaded() fields vs __wordcellBoot; snapshot equality only for keys present before reload). The amendment is recorded in build-notes.md Spine notes; ARCHITECTURE-SPINE.md is not edited.
Tests: AD-16 order cases; AD-17 restore suite; R-73 restored on launch and exact phase; Q-41 below-committed-last restore.
Owns: The boot order and the restore-boundary suite.

## Acceptance Criteria

Verify: npm run test:all is green with the restore suite passing on android, and each AD-16 ordering promise covered (existing AD-16 / ordering tests kept as they are, not duplicated):

- A held **/en*.txt route sees the request only once card-0 and primary-action are in the DOM: existing dictionary.spec.ts 'AD-16 the word-list request arrives with card-0 and primary-action in the DOM'.
- A startHidden page (no halt) with card-0 attached, then animationFrames(page, 2) (as 'halt after mount while hidden'), has made no **/en*.txt request; after showPage exactly one request arrives and dictionaryState() reaches 'ready': new AD-16 test inside test.describe('AD-16 dictionary start') in dictionary.spec.ts.
- Nothing written before the font check: new AD-16 healthy fresh-launch case in blocking.spec.ts beside the Q-37 AD-15 font tests (nothing seeded, captureBoot(page)): hold the **/*.woff2 route; wait until the held request has arrived and the nav launch has stamped the base entry (history.state is { wc: 0, launch } via page.evaluate) with current().kind still 'booting', then animationFrames(page, 2); assert no wordcell:* key in localStorage and every __wordcellBoot value null; release the route, then JSON.parse of wordcell:session deep-equals current().session, and wordcell:history and wordcell:prefs stay absent.
- With a rejected Session and an unreadable history, the rejected root shows and no History notice is pushed until New game: existing nav.spec.ts '§2 AD-13 deferred push: …'.
- Kill: the extended game-store.spec.ts kill variant above.
- build-notes.md Spine notes carry the AD-17 amendment (all three loaded() fields vs __wordcellBoot; history and prefs vs the snapshot only for keys present before the reload).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell.md

## Notes

- Open question: None.
