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

Pins the CAP-10 ordering promises of AD-16's boot order in main.ts minus the pointer controller (epic 4), the end-sheet surface (epic 6), the service worker and requestPersistence() (epic 7) (nav launch → font check → prefs → Session and history → lifecycle and resume → boot surfaces → mount → dictionary after first paint and visibility); epic 3's boot surfaces are the rejected root and the History notice. src/main.ts boot() already runs this order for epic 3 and changes only if a new AD-16 case fails.

Adds the AD-17 restore suite in e2e/restore.spec.ts, with the android-only beforeEach skip the sibling specs use. Fixtures and test ids:

- R-73: session-place-free-letter-redo-tail.json, session-gave-up.json.
- R-84 AD-17 (titles start 'R-84 AD-17 …'): session-gave-up.json plus history-three-records.json, then Undo (the finish recorded then undone); after the reload loaded().history.records deep-equals history-three-records.json's records without its last one (AD-17 "the record stays removed", build-notes CAP-10).
- §7.10 AD-17 (titles start '§7.10 AD-17 …'): prefs-non-default.json, seeded alone; boot writes a fresh Session, which the snapshot holds (so the Session is present before the reload), and loaded().history is null.
- Q-41 R-73 (test name starts "Q-41 R-73 …"): session-below-committed-last.json.

Test titles: '<id> <fixture> restores after hidden then reloaded' / '<id> <fixture> restores after a reload without a hide'; the finish-undone case's <fixture> is 'session-gave-up.json+history-three-records.json undone' (e.g. 'R-84 AD-17 session-gave-up.json+history-three-records.json undone restores after hidden then reloaded'). Each case runs hidden-then-reloaded and plain-reloaded: seedStorage(page, …, { captureBoot: true }) → goto → wait until `window.__wordcell !== undefined && window.__wordcell.current().kind !== 'booting'` → the case's dispatch (only the finish-undone case: an Undo button click, getByRole('button', { name: 'Undo', exact: true }), as in the kill variant; no other case dispatches) → hidden mode: hidePage(page) → snapshot; plain mode: snapshot; both then page.reload() → wait on the same predicate → assert. game-store.spec.ts's module-local open(), snapshot(), sessionOf() and type Snapshot move to e2e/helpers/restore.ts, imported by game-store.spec.ts and restore.spec.ts and tested in e2e/helpers.spec.ts (AGENTS.md Files): snapshot() gains a field `present`, read in the same page.evaluate: the wordcell:* keys present in localStorage; open() keeps its signature open(page, url = '/'), its goto and WordCell-heading wait, then waits until `window.__wordcell !== undefined && window.__wordcell.current().kind !== 'booting'`. helpers.spec.ts case: a session-only seeded page's snapshot has present ['wordcell:session'] and open() resolves with kind 'active'. Other specs' own open() variants are left to CAP-11. "present before the reload" means present in localStorage at snapshot time. Asserts: all three loaded() fields deep-equal JSON.parse of __wordcellBoot (null when absent), the Session equal to the snapshot's current().session (hidden mode: exactly, activeMs included, the clock being paused after hidePage, AD-9; plain mode: except activeMs not smaller), and history and prefs equal to the snapshot's current().history / current().prefs only when present before the reload (SPEC.review-log.md Pass 3 open major 1); after the reload the primary-action label equals the pre-reload label (R-73 (UI) exact phase), current().kind is 'active', current().session deep-equals loaded().session except activeMs not smaller, and current().history and current().prefs deep-equal loaded()'s when non-null.

Crash mode (epic Done when 2): extend, not duplicate, game-store.spec.ts 'R-73 kill variant: an Undo on session-place-free-letter-redo-tail.json survives a renderer crash'. It keeps its Undo dispatch (the last write is a dispatch, differing from the seed), adds captureBoot(page2) before page2's goto, and asserts all three loaded() fields deep-equal JSON.parse of page2's __wordcellBoot and loaded().session deep-equals the Session as written by the Undo exactly (activeMs included, no flush ran); Done when 2's crash survival is read per AD-17 as the Session as written by the last dispatch (the Undo). A plain reload still fires pagehide, so the crash mode is the no-flush proof.

Interface: main.ts boot sequence only (no src/ change expected; it changes only if an AD-16 case fails); build-notes Spine notes gain the AD-17 snapshot amendment (loaded() fields vs __wordcellBoot; snapshot equality only for keys present before reload). The amendment is recorded in build-notes.md Spine notes; ARCHITECTURE-SPINE.md is not edited.
Tests: AD-16 order cases; AD-17 restore suite; R-73 restored on launch and exact phase; Q-41 below-committed-last restore.
Owns: The boot order and the restore-boundary suite.

## Acceptance Criteria

Verify: npm run test:all is green with the restore suite passing on android, and each CAP-10 ordering promise (SPEC CAP-10 success) covered (existing AD-16 / ordering test bodies kept, not duplicated, except the rename and the kill-variant extension below; only helper imports change):

- A **/en*.txt route handler sees card-0 and primary-action in the DOM when the request arrives: existing dictionary.spec.ts 'AD-16 the word-list request arrives with card-0 and primary-action in the DOM'.
- A startHidden page (no halt) with card-0 attached, then animationFrames(page, 2) (as 'halt after mount while hidden'; animationFrames moves from dictionary.spec.ts to e2e/helpers/lifecycle.ts, tested in e2e/helpers.spec.ts, imported by dictionary.spec.ts and blocking.spec.ts), has made no **/en*.txt request; counted with dictionary.spec.ts's countRequests from goto until dictionaryState() is 'ready', exactly one request arrives, none before showPage: new AD-16 test inside test.describe('AD-16 dictionary start') in dictionary.spec.ts.
- Nothing written before the font check: new AD-16 healthy fresh-launch case at file level in blocking.spec.ts, after the 'Q-37 AD-15 fatal' describe (nothing seeded): hold every **/*.woff2 route; goto with waitUntil 'domcontentloaded' (the font preload blocks load), as the Q-37 held-font test does; expect.poll until at least one woff2 route is held (as 'AD-16 a halt during boot' does); wait until the nav launch has stamped the base entry (via page.evaluate, history.state.wc === 0 and history.state.launch a number) with current().kind still 'booting', then animationFrames(page, 2); assert no wordcell:* key in localStorage; continue every held route, wait until current().kind is 'active', then JSON.parse of wordcell:session deep-equals current().session, and wordcell:history and wordcell:prefs stay absent.
- With a rejected Session and an unreadable history, the rejected root shows and no History notice is pushed until New game: existing nav.spec.ts '§2 AD-13 deferred push: …', renamed '§2 AD-13 AD-16 deferred push: …' (body unchanged) so the AD-16 row has an AD-16-named test.
- Kill: the extended game-store.spec.ts kill variant above.
- build-notes.md Spine notes carry the AD-17 amendment (all three loaded() fields vs __wordcellBoot; history and prefs vs the snapshot only for keys present before the reload).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell.md

## Notes

- Open question: None.
