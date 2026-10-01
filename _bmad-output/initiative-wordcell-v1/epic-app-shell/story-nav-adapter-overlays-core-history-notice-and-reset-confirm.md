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

Builds nav.ts (the only History API and popstate user: launch rewind, launch id, queued push and pop, pending-pop counting, stale-launch and Forward rules), the overlays.svelte.ts core (E3), the History notice (three catalogue variants, pushed once per launch at boot or after New game from the rejected root), overlays.resetForNewSession() in the New game handler (rejected root and game over), and the Reset confirm (Keep it returns to the notice, Delete history resets and closes both top-down); History-notice flows count as §2 rejection flows and may seed history-invalid-* fixtures (widening the AGENTS.md fixtures pitfall; the plan records the exemption, win smoke included, for the next project-context refresh).

- Interface: new src/shell/nav.ts (launch, push, pop, register); new src/ui/overlays.svelte.ts (open, close, closedByBack, depth, top, isOpen, resetForNewSession); History notice and Dialog components. open(id) on an already-open id throws (rule 6).
- Tests: §2 history unreadable reported with Reset (three variants); AD-13 back, reload, stale launch, Forward (P3 + S incl. the 250 ms rewind timeout: launch() rejects, boot's await carries it to AD-15, no throw inside the timer callback); AD-13 win → New game → back smoke (discriminating case epic 6).
- Owns: nav.ts, the overlays.svelte.ts core, the Dialog component, the History notice, and recording in its plan the epic 7 device check "Android back closes a launch-pushed History notice" (A-A11).

Decisions (defaults; refine build-notes CAP-7's [ASSUMPTION] API):

- Registration: main.ts calls nav.register({ closedByBack: overlays.closedByBack, depth: () => overlays.depth }) after launch resolves, before any push. nav counts the entries it pushed and has not seen popped; each push it sends is { wc: count + 1, launch } (AD-13 depth arithmetic), not the depth getter at send time. Epic 4 adds the before-back hook (the pointer controller's cancel; SPEC Non-goal), run before the close callback; no stub now. A back popstate with no close callback registered throws (rule 6).
- Boot (AD-16): main.ts awaits nav.launch() before the font check; the History notice opens after the store's lifecycle registration and before mount, only when the store is active (not rejected or halted) and the score history is unreadable. The once-per-launch flag is one module-level flag in a src/ui module, set on push; New game pushes the deferred notice only when the store was rejected before newGame(), the flag is unset and the history is unreadable.
- resetForNewSession() in epic 3 only closes every open entry top-down through close(); epics 4 and 6 add the end-sheet and selection parts (AD-13, SPEC E3).
- Dialog: a non-native element (role="dialog", aria-modal="true", its own scrim consuming taps), never showModal(): Android Chrome's native modal <dialog> takes system back as its close request, so no popstate reaches nav (unverified; epic 7 A-A11 device check). Dialogs render outside the board element; the board root and every surface below the top dialog (the notice under the confirm) are `inert`, derived from the rendered dialogs, never overlays.depth alone. The notice and confirm render only while the store is not halted, so the AD-15 Blocking message replaces them (SPEC CAP-4) with nothing inert; their entries stay stacked. For the Reset confirm, focus starts on Keep it (EXPERIENCE Confirm dialog) and a scrim tap (a click at a viewport point outside the dialog's box; no new data-testid) acts as Keep it via overlays.close. Esc closes dialogs only via overlays.close, with the epic 6 keyboard map (SPEC Non-goals). A-A11 covers back on the notice and the confirm.
- Variant sentences: the unknown-version and contents-unreadable sentences interpolate the stored version (the catalogue's "2" is a sample) as text.ts functions.
- Delete history: scoreHistory.reset() runs first, then confirm and notice close top-down (build-notes CAP-7), so a throwing write reaches AD-15 with nothing closed.

## Acceptance Criteria

Verify: npm run test:all is green, and Playwright on android with history-invalid-version-unknown.json seeded shows Not now and back closing the notice, back on the confirm closing only the confirm, Delete history writing { version: 1, records: [] }, a reload with the notice (or notice and confirm) open re-pushing only the notice at { wc: 1, launch: <new> } with the first back closing it and the next leaving the app, the rejected root pushing no entry, and win → New game → back leaving the app.

"Leaves the app" uses build-notes CAP-7's mechanic (navigate from about:blank; goBack() lands on about:blank). goBack is not A-A11 evidence; the plan's epic 7 device check is (see Notes).

Tests (P3 = Playwright android, S = shell Vitest, U = UI Vitest; P3 names start `§2` or `AD-13` (the halt case `AD-15`); every S and U name, text.ts cases included, starts `AD-13`; history.state assertions after queued pops or the Forward correction use expect.poll):

- P3 §2 variants, each asserting its exact sentence and the Reset history button: history-invalid-version-unknown.json (version 2 sentence; runs Verify's notice and confirm flows, including both reload cases; <new> means a launch id different from the one read before the reload), history-invalid-null.json ("Its format version can't be read."), history-invalid-won-negative.json ("It uses format version 1 but its contents can't be read.").
- P3 Keep it: when the confirm opens Keep it is focused (toBeFocused) and Tab never reaches the notice's buttons; Escape leaves the confirm open at wc 2 (interim; epic 6's keyboard map inverts it, EXPERIENCE Confirm dialog); Keep it closes the confirm, notice stays, history.state.wc 1 (as back on the confirm). Scrim tap on the confirm: same. Board inert: seed session-place.json and history-invalid-version-unknown.json (Undo enabled); with the notice open, undo.focus() leaves undo unfocused; with the confirm also open, page.mouse.click at undo's centre acts as Keep it (confirm closed, notice open, wc 1), Session unchanged.
- P3 Keep it then Reset history tapped with no wait: ends at history.state.wc 2 with the confirm open.
- P3 Delete history: history.state.wc 0, a reload shows no notice, then back leaves the app.
- P3 wordcell:history bytes unchanged after Not now, Keep it, back and reload (rule-coverage row 23; only Delete history changes them).
- P3 Forward: notice open, Not now, expect.poll history.state.wc 0, goForward() → notice stays closed, history.state.wc 0, next back leaves the app.
- P3 Stale launch: notice and confirm open, Delete history (pops both), expect.poll wc 0, reload (history readable, nothing pushed), goForward() → the page stays on the ignored entry (history.state { wc: 1, launch: <old> }, expect.poll; this observes no history.back()), nothing opens; the first back returns to { wc: 0, launch: <new> } with nothing closed; the next back leaves the app.
- P3 halt over dialogs (in e2e/history.spec.ts): notice and confirm open, armStorageSpy(page, { throwOn: 'wordcell:history' }), Delete history → its local expectFatal, Reload focused (toBeFocused), no dialog visible, history.state.wc 2, wordcell:history bytes unchanged.
- P3 e2e/history.spec.ts §2 unreadable-history test (ticket 3.7 carry-forward): tap Not now (history.state.wc 0) before its first Undo; assertions otherwise unchanged.
- P3 deferred push: seed session-invalid-version-unknown.json with history-invalid-version-unknown.json → rejected root, no notice, wc 0; New game → notice at { wc: 1, launch }; back closes it; the next back leaves the app.
- P3 win smoke (SPEC CAP-7 route; Validate stays disabled until entry 9): seed session-won.json plus history-invalid-version-unknown.json, navigate from about:blank, Not now, Undo then Redo onto the winning commit, game-over New game (primary-action) → no notice (store not rejected), history.state.wc 0, goBack() lands on about:blank. Non-discriminating until epic 6 (no end sheet).
- S nav.ts on a stubbed history: no rewind popstate within 250 ms rejects launch() (fake timers; rule-coverage row 99); the rewind's own popstate is exempt from the stale check; stale-launch popstate ignored (no close, no back); a back to { wc: 0 } at depth 1 calls closedByBack(0); a second pop() issues its back only after the first pop's popstate; missing wc ignored; Forward does go(−(d − depth)) and closes nothing; a push() issued while a pop() or Forward correction is pending is sent only after that popstate, and two such pushes go out as consecutive wc values; a popstate from nav's own pop() or Forward correction does not call the close callback; any other popstate with a wc before register() throws.
- U overlays.svelte.ts with nav stubbed: close(id) on a non-top entry throws; closedByBack(d) closes every entry deeper than d, topmost first, and never calls nav; resetForNewSession() with two entries open closes the top one first (nav.pop twice), leaving depth 0; open(id) on an open id throws; depth, top, isOpen. text.ts: the unknown-version function given 7 returns the sentence with 7.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell.md
- spec — _bmad-output/specs/spec-epic-3-app-shell/SPEC.md, CAP-7; build-notes.md, CAP-7 Nav and overlays core
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Information Architecture, Message catalogue (History unreadable, Reset history confirm), Flow 7; DESIGN.md, Components (Buttons, Dialog, History notice)

## Notes

- Open question: Whether Playwright's goBack reproduces Chrome's handling of entries pushed without user activation (A-A11 stays an epic 7 device check).
- Open question (owner): whether a scrim tap on the History notice acts as Not now and focus starts on Not now — pending; see the review log.
- Decision: owner, 2026-10-01: the History notice is not dismissed by a tap outside it (scrim); the player must press Not now or Reset history (back still acts as Not now, per EXPERIENCE.md). Keyboard focus starts on its Not now button (the non-destructive button). Supersedes this ticket's open question on scrim tap and initial focus.
