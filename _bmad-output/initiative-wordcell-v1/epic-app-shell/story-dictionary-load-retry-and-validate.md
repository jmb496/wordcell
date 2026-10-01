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

- Interface: dictionary.svelte.ts exports `dictionary` { state, words, load(), retry() } (keeps `dictionaryUrl`); test hook gains dictionaryState(); primary-action gains the Validate path; banner component.
- Tests: R-38 shell load and Validate enablement; R-73 Validate saved; §2 replay never consults the dictionary (restore to Place with the route failing); Q-42 404 → reload; AD-8 shell Vitest (never-closing body → failed after 30 s fake time); AD-16 halted boot requests no dictionary (Playwright).
- Owns: The dictionary state, the banner and the Validate label rules.
- Store: `dictionary` is one object with a reactive `state` getter (`'loading' | 'ready' | 'failed'`, initially 'loading' before load() starts) and a `words` getter; `words` is assigned before `state` becomes 'ready'. game.svelte.ts passes `dictionary.state === 'ready' ? dictionary.words : undefined` as ctx.dictionary (build-notes CAP-8), replacing today's `import { words }`. The feedback shell Vitest's `vi.doMock` of dictionary.svelte.ts (ticket 3.4) exports a ready state with its inline Set. `retry()` throws unless state is 'failed'; `load()` throws if called twice (AGENTS.md rule 6).
- Load: a 30 s AbortController timeout covers fetch plus response.text() (SPEC.review-log.md Pass 3 open major 8). A non-OK response, a network error, the abort and an empty list (after the LF split with empty lines dropped) all give `failed` (AD-8); only a 404, at any fetch, sets the reload-on-next-retry flag. retry() refetches in place; with the flag set the next Reload calls location.reload(), except under a controlling service worker, where Reload refetches in place (loading, then failed again, so the banner stays until the next launch) and never calls location.reload() (Q-42, build-notes).
- Start: main.ts starts load() after a double requestAnimationFrame following the mount of whatever root is mounted and `await game.whenVisible()`, and re-checks `game.state.kind !== 'halted'` immediately before calling load(), since a halt can arrive while waiting (AD-16). A load already in flight when a halt occurs just settles (state only; the halted surface replaces the board).
- Validate: enabled iff `view.canValidate` and state 'ready'; one tap runs the engine's Validate once (EXPERIENCE.md; dispatch is synchronous, so no extra guard). Labels follow EXPERIENCE.md Component Patterns › Validate precedence: `Word list unavailable` > `Loading words…` > `Need 3+ letters` (today App.svelte checks `Need 3+ letters` first). In Idle it is disabled, labelled `Loading words…` / `Word list unavailable` while loading/failed, else plain `Validate`.
- Text: src/ui/text.ts gains `Loading words…`, `Word list unavailable`, `Word list didn't load.` and `invalidWord(word)`, rendering `<WORD> isn't in the word list.` with `game.feedback.rejectedWord` uppercased (`QU` as `QU`; EXPERIENCE.md catalogue, AGENTS.md; deferred here by the ticket 3.4 plan).
- Invalid-word line: DESIGN.md look (✕, error colour); on the minimal board it sits in a line near the primary action while `rejectedWord` is set.
- Banner: src/ui/DictionaryBanner.svelte, rendered on the active board under the top bar while `dictionary.state === 'failed'`: `Word list didn't load.` with a `Reload` button calling `dictionary.retry()`. Board only, not on the Session-rejected root (it shows after New game if still failed); rendered straight from state, no AD-11 gesture latch until epic 4.
- Continuity: the interim primary-action LABELS table and label assertions in e2e/game-store.spec.ts (marked 'Interim … entry 9') are rewritten against a routed dictionary state; other specs asserting a plain `Validate` label (history.spec.ts, nav.spec.ts, lifecycle.spec.ts, etc.) wait for dictionaryState() 'ready' first. `dictionaryState()` is added to src/shell/test-hook.ts and e2e/globals.d.ts; e2e/test-hook.spec.ts and e2e/pwa/test-hook.spec.ts expect keys ['current','dictionaryState','loaded']. e2e/placeholder.screens.spec.ts waits for dictionaryState() 'ready' before capture (regenerate the baseline with `npm run test:screens` only if the image changes).

## Acceptance Criteria

- Verify: npm run test:all is green.
- Playwright android, route **/en*.txt.
- R-38: with the route held, session-composing.json shows a disabled `Loading words…` and dictionaryState() 'loading' before fulfilment, then Validate enabled and TAN → Place after 'ready' (rule-coverage R-38 row). session-composing-draft-2-letters.json shows `Loading words…` while held and `Word list unavailable` when failing (precedence over `Need 3+ letters`). session-idle-fresh.json shows `Loading words…`, `Word list unavailable`, and plain `Validate` once ready.
- Invalid word: a word list without tan → exact text `TAN isn't in the word list.`, the phase stays Composing and the stored `wordcell:session` is unchanged (R-38); the next changing dispatch (Undo) clears it.
- R-73: in the existing session-place.json per-dispatch test (name gains Validate), wait for dictionaryState() 'ready' (the real list contains `tan`), then Undo (to Composing) → Validate (to Place) → Undo → Redo → Confirm, asserting the stored Session equals current().session after each.
- §2: a failed load shows the banner with Undo and Redo into Place still working, and a reload of session-place.json restores to Place.
- Retry: success and repeat failure; with the retry's route held, the banner is hidden, dictionaryState() is 'loading' and the label is `Loading words…` before the outcome (EXPERIENCE.md State Patterns › Dictionary failed). A 500 failure's Reload refetches in place without reloading the page.
- Timeout: page.clock advanced 29 999 ms after the route sees the request → still loading, no banner; 1 ms more → banner.
- Q-42: after a 404, tapping Reload causes a page load (e.g. `page.waitForEvent('load')`), contrasted with the 500 case. The controlled-service-worker branch is proved in Playwright by P7 in epic 7 (rule-coverage Q-42).
- AD-16: `card-0` and `primary-action` are in the DOM when the held `**/en*.txt` request arrives (rule-coverage AD-16 row). A boot that halts in game.load() or after mount (not only a font 404, which halts before the dictionary code) shows the halted surface; after two rAF round-trips there are zero `**/en*.txt` requests. The startHidden ordering case belongs to CAP-10 (ticket 11).
- Shell Vitest (AD-8): a failure table (500, rejected fetch, '' and '\n' bodies → failed; 404 → failed with the reload flag); a never-closing body → failed at 30 000 ms fake time; under a stubbed `navigator.serviceWorker.controller`, Reload after a 404 refetches in place and never calls location.reload(); retry() outside 'failed' and a second load() throw.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell.md
- spec — _bmad-output/specs/spec-epic-3-app-shell/build-notes.md, CAP-8

## Notes

- Open question: None.
