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

- Adds main.ts's error/unhandledrejection handlers (store halt('fatal'), then the DESIGN.md Blocking message with the error text and Reload, standalone before mount and rendered reactively from haltCause), the boot font check with its 30 s timeout, the Session-rejected root with its three catalogue variants and New game (the UI handler resets overlays from entry 8 on), the storage-event halt registered at store creation (key null on localStorage counts; halt while booting stops boot: load still parses, no write, no listeners, no mount, no dictionary), haltCause with fatal always winning, and the e2e storage-spy helper armed by page.evaluate after boot (SPEC.review-log.md Pass 3 open major 4).
- Interface: main.ts handlers and font check; game.svelte.ts rejected state rendering, haltCause getter, storage listener; new Blocking message component in src/ui/; new e2e/helpers/storage-spy.ts with its test in e2e/helpers.spec.ts; new fixture session-invalid-version-unknown.json, exercised only by Playwright (no engine test edit); storage.ts gains a small area helper (e.g. `isLocalArea(area)`).
- Tests: R-84 one game in progress (the two-page case); §2 rejection per variant (unknown, unreadable, pre-replay AD-7, replay rule; SPEC.review-log.md Pass 3 open major 6); R-74 rejected-root New game (deferred here by ticket 3.4's plan; Q-29 history untouched); Q-37 fatal before and after mount, font 404 and font timeout; Q-38 two pages; AD-4 shell Vitest (halt before load, both halt orders, halt from rejected, storage filter, storage key null); AD-15 halted blocks Session writes.
- Owns: the Blocking message component, the storage-spy helper, and the §2 Session rejection sentences.
- Strings: every new string (the three rejected variants, `Something went wrong.`, the another-window message, Reload) lives in src/ui/text.ts; the version-bearing variants are functions of the version.
- Boot order (AD-16): main.ts registers `error` and `unhandledrejection` first, before any await (handlers live only in main.ts, AD-15; shell modules do only listener registration and `$state` init at import, no storage reads); then awaits the font check; then `game.load()`; then mount. Today main.ts calls `game.load()` synchronously before mount; that changes. A failed font check throws before load, so nothing is written.
- Font check: `document.fonts.load('600 1em "WordCell Serif"', 'W')` (AD-15); an empty list, a rejection or the 30 s timeout each throw to the handler. It races a `setTimeout` that is cleared when the load settles (an uncleared timer would put up the fatal surface 30 s into a healthy game).
- Halt: `halt(cause)` moves booting, rejected and active to halted, so a storage event or a fatal replaces the rejected root and `newGame()` then throws (a rejected window must not overwrite another window's game). While halted, `dispatch`, `newGame` and `replay` throw and write nothing. `haltCause` is a store getter only (undefined unless halted); `current()` stays `{ kind: 'halted' }` (AD-17, build-notes Spine notes); Playwright tells the causes apart by message text.
- Fatal text: haltCause holds only the cause. The handler calls `halt('fatal', text)`; the store keeps the text beside haltCause, and both the standalone and the in-App Blocking message render from them. Text is `error.message` when the error/reason is an Error, else `String(reason)` (an ErrorEvent with a null error: `event.message`). A later fatal replaces the text (`halt('fatal')` always sets haltCause, build-notes CAP-4).
- Halted boot: today `load()` throws unless booting. While halted, `load()` reads, parses and records the launch result (so `loaded()` works), never calls createSession or writes (also for an absent key), leaves the state halted and does not throw. main.ts checks for halted after each boot step and, if halted, mounts only the standalone Blocking message, never App ("no mount" means no App/Board mount). main.ts sets its mounted flag only after `mount()` returns; the standalone mount clears `#app` first and happens once. "No listeners" and "no dictionary" are rules entries 6 and 9 honour and prove in their own tickets.
- Storage filter (build-notes CAP-4): a `storage` event with a `wordcell:` key, or key null with the storage area being localStorage, halts with 'another-window'; sessionStorage events and non-wordcell keys are ignored. game.svelte.ts must not name `localStorage` (AD-1 single-owner scan, src/architecture.test.ts), so the area check is the storage.ts helper.
- Blocking message: one component (title, optional body, one primary button; DESIGN.md Components) renders all three surfaces: rejected root (variant text, New game), fatal (`Something went wrong.`, error text, Reload), another-window (`WordCell is open in another window.`, Reload). Only the fatal one shows error text.
- Storage spy (entries 6 and 7 build on it: per-key counts, order across keys, throw on a chosen key): `armStorageSpy(page, { throwOn?: string })` waits for `current().kind !== 'booting'`, patches `Storage.prototype.setItem` for localStorage only (SPEC.review-log.md Pass 3 open major 4), records `{ key, value }` in order and throws on a setItem to `throwOn`; `storageWrites(page)` returns the records.

## Acceptance Criteria

- Verify: npm run test:all is green.
- Playwright android, fatal (Q-37): a 404 on the font gives the fatal surface with localStorage empty; with `page.clock`, `**/*.woff2` held and 30 000 ms advanced gives the fatal surface with localStorage empty; a healthy boot is still active after advancing past 30 s. Fatal tests assert the title, a non-empty error body and Reload as the only button; the exact message is left to the plan.
- Playwright android, fatal dispatch (AD-15): seed session-place.json, arm the spy with throwOn 'wordcell:session', tap Undo → title `Something went wrong.`, non-empty error text, only Reload offered; wordcell:session bytes equal the fixture, no records after the throwing one.
- Playwright android, §2 rejection, one test per fixture, names start `§2 …`: session-invalid-version-unknown.json (new, version 3) → unknown-version text with 3; session-invalid-null.json → version-unreadable text, no number; session-invalid-s2-last-only.json (pre-replay AD-7) and session-invalid-r50-placement-order.json (replay rule) → replay-failed text with the fixture's version as read. Each asserts the catalogue text, New game as the only button, no card-*/undo/redo/primary-action test ids, and wordcell:session bytes unchanged across a reload.
- Playwright android, `R-74 …` rejected-root New game (rule-coverage R-74 and R-74 (Q-29) rows): after New game, wordcell:session is written at once with a uint32 seed, moves [], activeMs 0, deep-equal to current().session, and the Board renders; a seeded sentinel wordcell:history stays byte-identical; a reload shows the Board with the stored seed.
- Playwright android, one test named `R-84 Q-38 …`: page 1 seeded with session-place.json and active, its spy armed; page 2 unseeded in the same context; page 2 Undo → page 1 shows `WordCell is open in another window.` and Reload, page 1 records no writes after, page 2 stays active.
- e2e/helpers.spec.ts: the spy records order across keys, the thrower throws on its key, and sessionStorage writes are not recorded.
- Shell Vitest AD-4 (stub `window` as an EventTarget before a fresh `await import()` after `vi.resetModules`, since the store adds its storage listener at creation; dispatch synthetic storage events): halt before load with the key absent, a valid Session and a rejected one, each writes nothing, stays halted, haltCause 'another-window', loaded() populated; both halt orders; rejected + storage event → halted/'another-window'; rejected + `halt('fatal')` → 'fatal'; a foreign key and a sessionStorage event (including key null) do not halt; a wordcell: key with newValue null does.
- Shell Vitest AD-15: while halted, dispatch, newGame and replay throw and write nothing, and load writes nothing; entry 6 adds the hide-flush variant.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell.md
- _bmad-output/specs/spec-epic-3-app-shell/SPEC.md — CAP-4
- _bmad-output/specs/spec-epic-3-app-shell/build-notes.md — CAP-4, Fixtures, Spine notes
- _bmad-output/specs/spec-epic-3-app-shell/rule-coverage.md — §2, R-74, R-84, Q-37, Q-38, AD-15 rows
- _bmad-output/specs/spec-epic-3-app-shell/SPEC.review-log.md — Pass 3 open majors 4 and 6
- ARCHITECTURE-SPINE.md — AD-4, AD-15, AD-16
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Message catalogue (Session rejected rows), State Patterns (Open in another window, Unexpected failure)
- DESIGN.md — Components (Blocking message)

## Notes

- Open question: None.
