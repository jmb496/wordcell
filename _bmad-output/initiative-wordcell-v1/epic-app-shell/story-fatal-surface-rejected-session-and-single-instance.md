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

- Adds main.ts's error/unhandledrejection handlers (store halt('fatal'), then the Blocking message: standalone before any mount, in App after; both reactive from haltCause/haltText), the boot font check with its 30 s timeout, the Session-rejected root with its three catalogue variants and New game (the UI handler resets overlays from entry 8 on), the storage-event halt registered at store creation (halt while booting stops boot: no write, no listeners, no mount, no dictionary), haltCause with fatal always winning, and the e2e storage-spy helper.
- Interface: main.ts handlers, font check and halted-boot path; game.svelte.ts gains `halt`, `haltCause`, `haltText` and the storage listener; App.svelte renders the rejected root (Blocking message with New game) and switches to the halted Blocking message; new Blocking message component in src/ui/; src/ui/text.ts gains the new strings; new e2e/helpers/storage-spy.ts with its test in e2e/helpers.spec.ts; new fixture session-invalid-version-unknown.json (session-place.json with version 3, failing only the version check); storage.ts gains a small area helper (e.g. `isLocalArea(area)`).
- Tests: R-84 one game in progress (the two-page case); §2 rejection per variant (unknown, unreadable, pre-replay AD-7, replay rule), each ending in New game, one of them `§2 R-74 Q-29 …` (deferred here by ticket 3.4's plan); Q-37 AD-15 fatal: font 404, font timeout, empty font list, dispatch throw; Q-38 two pages and halted boot; AD-4 shell Vitest (halt before load, both halt orders, halt from rejected, haltCause/haltText, storage filter, storage key null); AD-15 halted blocks Session writes.
- Owns: the Blocking message component, the storage-spy helper, and the §2 Session rejection sentences.
- Strings: every new string (the three rejected variants, `Something went wrong.`, the another-window message, Reload) lives in src/ui/text.ts; the version-bearing variants are functions of the version.
- Boot order (AD-16): main.ts registers `error` and `unhandledrejection` first (handlers live only in main.ts, AD-15; shell modules do only listener registration and `$state` init at import, no storage reads), then calls an async boot function without awaiting it (a top-level await would route a font failure to `error`): await the font check, `game.load()`, mount. A font failure thus reaches `unhandledrejection` before load, writing nothing.
- Font check: `document.fonts.load('600 1em "WordCell Serif"', 'W')` (AD-15); an empty list, a rejection or the 30 s timeout each throw to the handler. It races a `setTimeout` that is cleared when the load settles.
- Halt: overloads `halt('fatal', text: string)` and `halt('another-window')` move booting, rejected and active to halted; while halted it changes nothing except that `halt('fatal', text)` sets cause and text. A storage event or a fatal replaces the rejected root and `newGame()` then throws. While halted, `dispatch`, `newGame` and `replay` throw and write nothing. `haltCause` is a store getter only (undefined unless halted); `current()` stays `{ kind: 'halted' }` (AD-17, build-notes Spine notes); Playwright tells the causes apart by message text.
- Fatal text: haltCause holds only the cause. The handler calls `halt('fatal', text)`; a `haltText` getter, undefined unless the cause is 'fatal', holds the text, and both the standalone and the in-App Blocking message render reactively from them, so a later fatal (build-notes CAP-4) re-renders the mounted surface (replacing another-window) instead of mounting again. main.ts keeps one surface flag, set by whichever mount runs first (App or standalone), after `mount()` returns; the handler and the halted-boot path mount the standalone only while it is unset. Text is `error.message` when the error/reason is an Error, else `String(reason)` (an ErrorEvent with a null error: `event.message`).
- Halted boot: today `load()` throws unless booting. While halted, `load()` reads, parses and records the launch result (so `loaded()` works), never calls createSession or writes (also for an absent key), leaves the state halted and does not throw. If halted after the font check, main.ts still calls `game.load()`, then mounts the standalone Blocking message (per the surface flag) and runs no later step, never App ("no mount" means no App/Board mount); a font-check throw is the only exit that skips `load()`. The standalone mount clears `#app` first. Entries 6 and 9 prove "no listeners" and "no dictionary".
- Storage filter (build-notes CAP-4): a localStorage `storage` event (storage.ts helper) whose key starts with `wordcell:` or is null halts with 'another-window'; sessionStorage events and other keys are ignored. game.svelte.ts must not name `localStorage` (AD-1 single-owner scan, src/architecture.test.ts).
- Blocking message: one component (title, optional body, one primary button; DESIGN.md Components) renders all three surfaces: rejected root (variant text, New game), fatal (`Something went wrong.`, error text, Reload), another-window (`WordCell is open in another window.`, Reload). Only the fatal one shows error text; Reload calls `location.reload()`.
- Storage spy (entries 6 and 7 build on it: per-key counts, order across keys, throw on a chosen key): `armStorageSpy(page, { throwOn?: string })` waits for `current().kind !== 'booting'`, patches `Storage.prototype.setItem` (SPEC.review-log.md Pass 3 open major 4) and `removeItem` (as `{ key, value: null }`; entry 7's Q-39 write-back), for localStorage only (`this === localStorage`), records `{ key, value }` in order; a setItem to `throwOn` is recorded, then throws `new Error('storage-spy: <key>')` without calling the original; `storageWrites(page)` returns the records.

## Acceptance Criteria

- Verify: npm run test:all is green.
- Playwright android, fatal, names start `Q-37 AD-15 …` (goto with waitUntil 'domcontentloaded', since the index.html font preload holds the load event; clock installed before goto): a 404 on the font, `**/*.woff2` held with 30 000 ms advanced, and an init script making `document.fonts.load` resolve `[]` each give the fatal surface with localStorage empty; a healthy boot is still active after advancing past 30 s. Fatal tests assert the title, a non-empty error body, Reload as the only button and current().kind 'halted'; the exact message is left to the plan.
- Playwright android, fatal dispatch (`Q-37 AD-15 …`): seed session-place.json, arm the spy with throwOn 'wordcell:session', tap Undo → title `Something went wrong.`, non-empty error text, only Reload offered; wordcell:session bytes equal the fixture, no records after the throwing one.
- Playwright android, §2 rejection, one test per fixture, names start `§2 …`: session-invalid-version-unknown.json (new, version 3) → unknown-version text with 3; session-invalid-null.json → version-unreadable text, no number; session-invalid-s2-last-only.json (pre-replay AD-7) and session-invalid-r50-placement-order.json (replay rule) → replay-failed text with the fixture's version as read. Each asserts the catalogue text, New game as the only button, no card-*/undo/redo/primary-action test ids, and wordcell:session bytes unchanged across a reload, then taps New game: wordcell:session is written at once with a fresh Session (uint32 seed, moves [], activeMs 0) and the Board renders. The unknown-version test is named `§2 R-74 Q-29 …` (rule-coverage R-74 and R-74 (Q-29) rows), also seeds history-three-records.json, which stays byte-identical after New game, asserts the new Session deep-equals current().session, and a reload shows the Board with the stored seed.
- Playwright android, one test named `R-84 Q-38 …`: page 1 seeded with session-place.json and active, its spy armed; page 2 unseeded in the same context; page 2 Undo → page 1 shows `WordCell is open in another window.` and Reload, page 1 records no writes after, page 2 stays active; tapping Reload on page 1 brings it back active with page 2's Session.
- Playwright android, `Q-38 …` halted boot: page 1 unseeded, `**/*.woff2` held on page 1 only, goto '/' with waitUntil 'domcontentloaded', then wait until its current().kind is 'booting'; page 2 in the same context opens `/favicon.svg` (same origin, no app boot) and sets `wordcell:prefs` via page.evaluate; the font is released → page 1 shows `WordCell is open in another window.`, no card-*/undo test ids, wordcell:session absent.
- The Playwright "no writes after halt" checks cannot fail on the minimal board; the shell Vitest AD-15 case is this ticket's failable check (S, supplementary), and the plan adds "AD-15 halted: hide flush writes no wordcell:session (Playwright, spy)" to tickets.toml entry 6's tests and sets the rule-coverage AD-15 row's CAP column to 4, 5.
- e2e/helpers.spec.ts: the spy records order across keys and removals, the thrower throws on its key, and sessionStorage writes are not recorded.
- Shell Vitest AD-4 (the shared fresh-import setup helper in src/shell/game.svelte.test.ts stubs `window` as an EventTarget for every store test before `vi.resetModules` and `await import()`, since the store registers its listener at import under the node environment; dispatch synthetic storage events): halt before load with the key absent, a valid Session and a rejected one, each writes nothing, stays halted, haltCause 'another-window', loaded() populated; both halt orders; rejected + storage event → halted/'another-window'; rejected + `halt('fatal', t)` → 'fatal'; a foreign key and a sessionStorage event (including key null) do not halt; a wordcell: key with newValue null does; haltCause is undefined while booting, active and rejected; a second `halt('fatal', t2)` replaces the text.
- Shell Vitest AD-15: while halted, dispatch, newGame and replay throw and write nothing, and load writes nothing.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell.md
- _bmad-output/specs/spec-epic-3-app-shell/SPEC.md — CAP-4
- _bmad-output/specs/spec-epic-3-app-shell/build-notes.md — CAP-4, Fixtures, Spine notes
- _bmad-output/specs/spec-epic-3-app-shell/rule-coverage.md — §2, R-74, R-84, Q-37, Q-38, AD-15 rows
- _bmad-output/specs/spec-epic-3-app-shell/SPEC.review-log.md — Pass 3 open majors 4 and 6 (the plan updates the rule-coverage §2 rows and build-notes Fixtures to match the relabel)
- ARCHITECTURE-SPINE.md — AD-4, AD-15, AD-16
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Message catalogue (Session rejected rows), State Patterns (Open in another window, Unexpected failure)
- DESIGN.md — Components (Blocking message)

## Notes

- Open question: None.
