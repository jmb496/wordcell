---
id: 9
type: story
title: "Dictionary load, retry and Validate"
parent: epic-app-shell
covers: [CAP-8]
after: [8]
risk: medium
---

# Dictionary load, retry and Validate

## Description

Extends dictionary.svelte.ts with state loading | ready | failed and the Set, started by main.ts after the first paint of whatever root is mounted and whenVisible (not while halted), a 30 s AbortController timeout covering fetch plus response.text() (review-log open major 8), retry() in place, the 404 → next Reload calls location.reload() rule (not under a controlling service worker), the dictionary-failed banner, Validate enabled iff view.canValidate && ready with the catalogue labels, the invalid-word line, dictionaryState() on the test hook, and the Validate step of the R-73 save test.

## Acceptance Criteria

Verify: npm run test:all is green, and Playwright on android (route **/en*.txt) shows TAN from session-composing.json validating to Place only after dictionaryState() is ready, a word list without tan showing the invalid-word line that the next changing dispatch clears, a failed load showing the banner with Undo and Redo into Place still working and a reload of session-place.json restoring to Place, retry success and repeat failure, the timeout 30 000 ms after the request with page.clock, and a 404 making the next Reload reload the page.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell.md
- spec — _bmad-output/specs/spec-epic-3-app-shell/build-notes.md, CAP-8

## Notes

- Open question: None.
