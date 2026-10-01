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

Builds nav.ts (the only History API and popstate user: launch rewind with its 250 ms timeout, launch id, queued push and pop, pending-pop counting, stale-launch and Forward rules), the overlays.svelte.ts core (E3), the History notice with its three catalogue variants pushed once per launch at boot or after New game from the rejected root, wires overlays.resetForNewSession() into both New game handlers (rejected root and game over), and the Reset confirm (Keep it returns to the notice, Delete history resets and closes both top-down); History-notice flows count as §2 rejection flows and may seed history-invalid-* fixtures (this widens the AGENTS.md fixtures pitfall; the plan records the exemption for the next project-context refresh).

- Interface: new src/shell/nav.ts (launch, push, pop, register); new src/ui/overlays.svelte.ts (open, close, closedByBack, depth, top, isOpen, resetForNewSession); History notice and Dialog components; main.ts awaits nav.launch() first.
- Tests: §2 history unreadable reported with Reset (three variants); AD-13 back, reload, stale launch, Forward (P3 + S incl. the 250 ms rewind timeout); AD-13 win → New game → back as a smoke case (discriminating case epic 6).
- Owns: nav.ts, the overlays.svelte.ts core, the Dialog component, the History notice, and recording in its plan the epic 7 device check "Android back closes a launch-pushed History notice" (A-A11).

Decisions (defaults; refine build-notes CAP-7's [ASSUMPTION] API):

- Registration: overlays calls nav.register({ closedByBack, depth }) at boot right after nav.launch() resolves and before any push. Epic 4 adds the before-back hook (the pointer controller's cancel, a SPEC Non-goal here), run before the close callback per AD-13; no no-op stub now. A back popstate with no close callback registered throws (rule 6).
- Boot (AD-16): main.ts awaits nav.launch() before the font check; overlays registers after launch; the History notice opens after the store's lifecycle registration and before mount, only when the store is active (not rejected or halted) and the score history is unreadable. The once-per-launch and deferred flag is the builder's to place, UI side, not shell.
- resetForNewSession() in epic 3 only closes every open entry top-down through close(); epics 4 and 6 add the end-sheet and selection parts (AD-13, SPEC E3).
- Dialog: renders the scrim, which consumes taps so the board beneath is inert. For the Reset confirm, focus starts on Keep it (EXPERIENCE Component behaviour, Confirm dialog) and a scrim tap acts as Keep it via overlays.close (pops its entry). A native <dialog> cancel or Esc never closes a dialog except through overlays.close; Esc itself lands with the epic 6 keyboard map (SPEC Non-goals).
- Variant sentences: the unknown-version and contents-unreadable sentences interpolate the stored version (the catalogue's "2" is a sample) as text.ts functions.
- Delete history: scoreHistory.reset() runs first, then the confirm and the notice close top-down (build-notes CAP-7), so a throwing write reaches AD-15 with nothing closed.

## Acceptance Criteria

Verify: npm run test:all is green, and Playwright on android with history-invalid-version-unknown.json seeded shows Not now and back closing the notice, back on the confirm closing only the confirm, Delete history writing { version: 1, records: [] }, a reload with the notice (or notice and confirm) open re-pushing only the notice at { wc: 1, launch: <new> } with the first back closing it and the next leaving the app, the rejected root pushing no entry, and win → New game → back leaving the app.

"Leaves the app" uses build-notes CAP-7's mechanic (navigate from about:blank; goBack() lands on about:blank). goBack is not A-A11 evidence; the epic 7 device check recorded in the plan is (see Notes).

Tests (P3 = Playwright android, S = shell Vitest, U = UI Vitest; names start `§2` or `AD-13`):

- P3 §2 variants, each asserting its exact sentence: history-invalid-version-unknown.json (version 2 sentence; runs the full flow), history-invalid-null.json ("Its format version can't be read."), history-invalid-won-negative.json ("It uses format version 1 but its contents can't be read.").
- P3 Keep it: confirm closes, notice stays, history.state.wc 1 (same end state as back on the confirm). Scrim tap on the confirm: same result.
- P3 Keep it then Reset history tapped with no wait: ends at history.state.wc 2 with the confirm open.
- P3 Delete history: afterwards history.state.wc 0, back leaves the app, a reload shows no notice.
- P3 wordcell:history bytes unchanged after Not now, Keep it, back and reload (rule-coverage row 23; only Delete history changes them).
- P3 Forward: notice open, Not now, goForward() → notice stays closed, history.state.wc 0, next back leaves the app.
- P3 Stale launch: notice and confirm open, Delete history (pops both), reload (history readable, nothing pushed), goForward() → the old-launch entry is ignored, nothing opens, no history.back(); then back leaves the app.
- P3 deferred push: seed session-invalid-version-unknown.json with history-invalid-version-unknown.json → rejected root, no notice, wc 0; New game → notice at { wc: 1, launch }; back closes it; the next back leaves the app.
- P3 win smoke (SPEC CAP-7 route; Validate stays disabled until entry 9): seed session-won.json plus history-invalid-version-unknown.json, navigate from about:blank, Not now, Undo then Redo onto the winning commit, game-over New game (primary-action) → no notice (once per launch), history.state.wc 0, goBack() lands on about:blank. Non-discriminating in epic 3 (no end sheet; discriminating case epic 6).
- S nav.ts on a stubbed history: rewind with no popstate within 250 ms throws to AD-15 (rule-coverage row 99); stale-launch popstate ignored (no close, no back); missing wc ignored; Forward does go(−(d − depth)) and closes nothing; a push() issued while a pop is pending is sent only after that pop's popstate; a popstate from nav's own pop() or Forward correction calls neither the close callback nor a before-back hook.
- U overlays.svelte.ts with nav stubbed: close(id) on a non-top entry throws; closedByBack(d) closes every entry deeper than d, topmost first, and never calls nav; depth, top, isOpen.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell.md
- spec — _bmad-output/specs/spec-epic-3-app-shell/SPEC.md, CAP-7; build-notes.md, CAP-7 Nav and overlays core
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Information Architecture, Message catalogue (History unreadable, Reset history confirm), Flow 7; DESIGN.md, Components (Buttons, Dialog, History notice)

## Notes

- Open question: Whether Playwright's goBack reproduces Chrome's handling of entries pushed without user activation (A-A11 stays an epic 7 device check).
- Open question (owner): whether a scrim tap on the History notice acts as Not now and focus starts on Not now — pending; see the review log.
