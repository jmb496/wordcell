# Review log — story-overlays-store-tail-selection-end-sheet-and-view-states.md (ticket 4.5)

State: pass 4: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: HEAD e204ca9, copy story-overlays-store-tail-selection-end-sheet-and-view-states.passes/pass0.md, 261 words.
Ticket fields not copied from tickets.toml entry 5 (interface, tests, owns, unknown) passed to reviewers and fixer as intent; fixer adds them to the Description in pass 1.

## Pass 1 — 2026-10-02
Reviewers: builder, edge-case, adversarial, ref alignment  |  Findings: major 10, minor 4, decision-needed 0  |  Dropped in triage: 1
Words (docs): 865 (3.31 x pass 0)  |  Snapshot: story-overlays-store-tail-selection-end-sheet-and-view-states.passes/pass1.md
Fixer: applied items 1–14 and copied interface/tests/owns into the Description.
### Applied
- [major] Description, view part — openView pushes one wordcellView and stores the cell; close/closedByBack clear it; openPeek/closePeek/hover peek push none (SPEC CAP-5, rule-coverage row 114) → fixer item 1
- [major] Description, end sheet — closedByBack sets collapsed never hidden; onUnfinished expanded → close then hidden, collapsed → hidden no pop (AD-13, SPEC CAP-5); expand only from collapsed, collapse only from expanded on top → fixer item 2
- [major] Description, closedByBack/close — per-id cleanup: tailSelection clears the selection, wordcellView clears the view cell (build-notes CAP-5) → fixer item 3
- [major] Description, deferred open — Undo path must cancel the pending token (AD-13, AD-14, EXPERIENCE.md): onUnfinished from hidden cancels it → fixer item 4
- [major] Description, deferred open — openDeferred semantics (live token: close an open wordcellView, set expanded, push one; cancelled/superseded no-op; won re-check is the caller's) → fixer item 5
- [major] Description, whole API — invalid-state calls unspecified → throw `AD-13 <op> while <state>`, listed no-ops only (rule 6) → fixer item 6
- [major] Description, select — different column while selected; re-select semantics; bounds → fixer item 7
- [major] Description, peek — peekToSticky carries the peek cell; closePeek/peekToSticky without a peek, openPeek while peek/view open → fixer item 8
- [major] Description, hover peek — unnamed API; refusal while peek/view open as specified no-op → fixer item 9
- [major] Description, generic paths/reset — open refuses new ids; resetForNewSession order and clearing peek/hover peek/view → fixer item 10
- [minor] getter shapes (selection/peek/view/hover-peek, null empty) → fixer item 11
- [minor] Acceptance Criteria — new separate Playwright test vs existing nav.spec case → fixer item 12
- [minor] Description — stale "entry 2's ActionBar" wording; new-game.ts is the caller → fixer item 13
- [minor] References — add SPEC.md CAP-5 and AD-13; copy tickets.toml interface/tests/owns/unknown into Description → fixer item 14
### Default applied (technical)
- select on a different column while selected → throws (callers deselect first, CAP-6/CAP-7)
- invalid-state calls → throw; no-ops: deselect with nothing selected, onUnfinished while hidden, dead openDeferred token, hover-peek open while peek/view open
- Undo-path cancel → onUnfinished from hidden cancels the token
- openDeferred(live) → closes an open wordcellView first, then expanded + one push; won re-check stays with the epic 6 caller
- hover peek API → openHoverPeek(cell)/closeHoverPeek()/hoverPeek getter
- resetForNewSession → also clears peek, view cell and hover peek
- Playwright → a new AD-13 test with a readable history, asserting wc 0 after Redo settles
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- front matter after: add 4.2 — 4.2 is done and tickets.toml has after [3.8]; changing it adds no build value

## Pass 2 — 2026-10-02
Reviewers: fix diff, edge-case, adversarial, ref alignment  |  Findings: major 5, minor 6, decision-needed 0  |  Dropped in triage: 2
Words (docs): 1087 (4.16 x pass 0, budget 1500)  |  Snapshot: story-overlays-store-tail-selection-end-sheet-and-view-states.passes/pass2.md
Fixer: applied items 1–11 (verified on resume against pass2.fix.diff); no commands touched.
### Applied
- [major] Generic paths — close('endSheet') effect on the state unstated (all four lenses) → removing the endSheet entry by close or closedByBack sets collapsed; onUnfinished/reset then set hidden → fixer item 1
- [major] Hover peek — closeHoverPeek with none open and openHoverPeek while one is open unstated under the blanket throw rule (pointerleave path) → fixer item 2
- [major] End sheet — openDeferred/deferEndSheetOpen preconditions: token consumed, sheet not hidden throws, peek/hover peek cleared, non-top view throws via close → fixer item 3
- [major] View and peek — openView while a peek or the view is open unstated → throws → fixer item 4
- [major] Selection — first select while other entries are open unstated → throws unless the stack is empty → fixer item 5
- [minor] cell outside 3–10 and non-integer count throw → fixer item 6
- [minor] Tests — back to an intermediate depth; view cell cleared by close/closedByBack; reset clears peek and hover peek; close('endSheet') → fixer item 7
- [minor] Acceptance Criteria — name the readable-history fixture, poll wc after New game shows → fixer item 8
- [minor] Selection — deselect under a sticky view: callers (epic 6 keyboard) close the view first; UI reach blocked by the CAP-9 scrim → fixer item 9
- [minor] Interface — name the view getter viewCell; token an opaque number → fixer item 10
- [minor] End sheet — onUnfinished from expanded with endSheet not on top throws (AD-13 top-entry guarantee) → fixer item 11
### Default applied (technical)
- close('endSheet') → collapsed; closeHoverPeek with none open → no-op; openHoverPeek while open → throws (leave closes first)
- openDeferred consumes its token; deferEndSheetOpen/openDeferred(live) with the sheet not hidden → throw; openDeferred clears peek and hover peek
- openView while a peek or the view is open → throws; first select with a non-empty stack → throws
- viewCell getter name; opaque number token
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- re-select under a view unreachable from the UI — harmless unit-level case, keep
- openDeferred with a modal above the view — covered by the generic close throw (stated via item 3)

## Pass 3 — 2026-10-02
Reviewers: fix diff, edge-case, adversarial, ref alignment  |  Findings: major 4, minor 9, decision-needed 0  |  Dropped in triage: 1
Words (docs): 1278 (4.90 x pass 0, budget 1500)  |  Snapshot: story-overlays-store-tail-selection-end-sheet-and-view-states.passes/pass3.md
Fixer: applied items 1–12; item 1 worded "before the Undo dispatch, in AD-14's order" (complete, cancel, undo) instead of "before it completes the animation", to match the spine; no commands touched.
### Applied
- [major] End sheet — no cancel callable before the Undo path completes the winning animation (AD-14 order: complete, cancel, undo; AD-13 no entry pushed) → add cancelEndSheetOpen() → fixer item 1
- [major] End sheet — openDeferred silently clears an open peek, so the controller's release closePeek()/peekToSticky() throws → openDeferred throws while a peek is open (unreachable: key commands call cancel() first, AD-12) → fixer item 2
- [major] Hover peek / Tests — "hover peek closed by peekToSticky" cannot be set up through the API → test the invariant instead → fixer item 3
- [major] Acceptance Criteria — Playwright wc poll passes on the first sample (session-won starts at wc 0) → wait through Undo and Redo, assert history.length unchanged and wc 0 → fixer item 4
- [minor] non-integer column or cell throws (fix diff + edge-case) → fixer item 5
- [minor] immediate end-sheet open (Give up, boot push) is epic 6's, via openDeferred(deferEndSheetOpen()) or a wrapper it adds (3 lenses) → fixer item 6
- [minor] any token other than the live one is a no-op → fixer item 7
- [minor] openView/openPeek/peekToSticky throw while historyNotice, resetConfirm or endSheet is on top; expandEndSheet throws unless the stack is empty; openDeferred throws unless the stack is empty after closing the view → fixer item 8
- [minor] first select while a peek is open throws → fixer item 9
- [minor] callers never start the hover timer while hoverPeek is non-null → fixer item 10
- [minor] deselect justification names Undo, Redo and the banner Reload → fixer item 11
- [minor] throw tests match /^AD-13 / only → fixer item 12
### Default applied (technical)
- cancelEndSheetOpen() (no-op without a live token), called by the AD-14 Undo exception before it completes the animation; onUnfinished-from-hidden and reset cancel through it
- openDeferred with a peek open → throws
- Playwright → history.length unchanged plus wc 0 after Undo then Redo settle
- non-live tokens no-op; modal/sheet-on-top preconditions throw; first select with a peek throws; throw tests match /^AD-13 /
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- re-select assigns a fresh object — obvious under $state.raw, no ticket text needed

## Pass 4 — 2026-10-02
Reviewers: fix diff, edge-case, adversarial, ref alignment (late-pass bar)  |  Findings: major 0, minor 13, decision-needed 0  |  Dropped in triage: 3
Words (docs): 1278 (4.90 x pass 0, budget 1500)  |  Snapshot: story-overlays-store-tail-selection-end-sheet-and-view-states.passes/pass3.md (no fix pass)
### Applied
- none (converged)
### Default applied (technical)
- none this pass
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- re-select under a view asymmetry — settled in pass 2, unit-only path
- openDeferred with a tail selection left — reviewer proposes no ticket change (epic 6 plan cites build-notes CAP-6)
- closedByBack vs peek/hover peek — duplicate of the edge-case item, kept once below

## Result — converged after 4 passes

Majors per pass: 10, 5, 4, 0. Decision-needed: none. Word count 261 → 1278 (budget 1500).

Unapplied minors (for the build plan):
- Acceptance Criteria: after Redo, wait for the commit animation to settle (or keep checking for a short window) before asserting history.length unchanged and wc 0; after Undo use auto-retrying not.toHaveText('New game') and expect(redo).toBeEnabled() before Redo (nav.spec.ts:194–195 pattern).
- End sheet: openDeferred checks every throw precondition (peek open; endSheet above the view) before it consumes the token or changes state.
- Description, last bullet: entry 5 touches only the overlays files plus one appended test in e2e/nav.spec.ts, which entries 2–4 never edit (epic parallel-lane note, epic file line 58).
- Hover peek: openHoverPeek with historyNotice, resetConfirm or endSheet on top — pick no-op (timer-fires-late) or allowed (scrims stop pointerover) in the plan; validate the cell before the no-op checks so a bad cell always throws.
- Generic paths: closedByBack never touches peek or hover peek (the controller's before-back cancel and pointerleave close them); one Vitest assertion.
- Selection: reword "a first select throws while the stack is non-empty (…) or while a peek is open" (the "unless … or" reading is ambiguous).
- Error format: only the "AD-13 " prefix is binding; argument errors may read e.g. "AD-13 select(9, 1): column out of range".
- Interface: note isOpen('endSheet') ⇔ endSheet === 'expanded', with one assertion.
- deferEndSheetOpen supersede: one Vitest case (defer twice; first token no-op, second opens).
- Reset: the tile selection AD-13 names is epic 5's.
