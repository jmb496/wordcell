# Review log — story-wordcell-peek-and-sticky-view.md (ticket 4.11)

State: pass 5: done

Mode: docs, thorough, max 7, budget default (2.5x pass 0). Pass 0: HEAD 9581f2a, copy story-wordcell-peek-and-sticky-view.passes/pass0.md, 409 words. Intent includes tickets.toml entry 11 fields interface, tests, owns, unknown (not copied at pull; fixer adds them to the Description in pass 1); copy at story-wordcell-peek-and-sticky-view.passes/intent-tickets-toml-11.md.

## Pass 1 — 2026-10-07
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 7, minor 9, decision-needed 0  |  Dropped in triage: 3 (duplicates merged across lenses)
Words (docs): 1156 (2.83x pass 0, over the 2.5x budget: from pass 2 a minor goes to the fixer only when its fix adds no words)  |  Snapshot: story-wordcell-peek-and-sticky-view.passes/pass1.md
### Applied
- [major] Acceptance Criteria — P4 cases the Description and intent tests state are missing: R-33/R-39 Composing and Place WordCell tap and drag inert (Session reference unchanged, no view), R-12 Idle WordCell drag lifts nothing, empty WordCell tap and long-press open nothing, back closes the sticky view, a tap on the sheet closes it (after the swipe), the used cell's peek (top tagged, unhatched, count cards.length) → fixer item 1
- [major] Acceptance Criteria — AD-13 entry counts (peek none, sticky one, peek→sticky one) not asserted in P4; the above-a-kept-selection ordering has no source → fixer item 2
- [major] Description — the deselect()-throws-under-a-view hazard deferred to this ticket by tickets 4.7 and 4.9 is dropped: what is reachable while a sticky view sits above a selection, sheet/scrim taps never take F25, S cases (cancel(), hide F24, scrim tap) → fixer item 3
- [major] Description/AC/Notes — overflow test viewport not pinned, no pre-release overflow assertion, fallback fixture undefined and conflicting with "ten → eleven"; sheet geometry (DESIGN.md view sheet) not cited → fixer item 4
- [major] AC — AD-11 computed-style P4 for the view sheet (deferred by ticket 4.4, rule-coverage AD-11 row) missing → fixer item 5
- [major] Description — the peek's look (F27 title, scrim, same sheet) unspecified; peek→sticky changes only mode and entry → fixer item 6
- [major] Description — the ticket's tickets.toml intent fields (interface, tests, owns, unknown) absent → fixer item 7
### Default applied (technical)
- Description — overflow seam: WordCellView marks its scroll area with a data attribute; controller queries it under its root at release → minor item 8
- Description — swallower seam: small module on injected target and timers, tested in node with EventTarget and fake timers → minor item 9
- Notes — failing scrim-over-Undo gate → stop and report (AGENTS.md rule 7), no change to arming point or expiry → minor item 12
- AC — fallback fixture name `session-won-overflow-cell`-style default left to item 4 → see fixer item 4
### Minors
- capture-phase listener and 300 ms expiry armed at pointerup restored (item 10); serialize.test.ts ValidName, PROPERTIES, comment and architecture test name follow the count (item 11); "open no view" covers taps and drags only, an overflowing peek turns sticky in every phase (item 13); Idle with a selection: tap deselects (R-14, existing), drag does nothing (item 14); baselines expected unchanged (item 15); References gain SPEC CAP-9, rule-coverage, DESIGN.md view sheet and layer order, EXPERIENCE.md WordCell view, full-viewport scrim above bars (item 16); swipe AC reworded (in item 1)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- duplicate reports of the same missing-AC cases, the peek title and the ValidName/PROPERTIES gap across lenses (kept the clearest wording)
### Fixer outcome
- all 16 items applied (no conflicts); no commands or tool claims added; fix diff story-wordcell-peek-and-sticky-view.passes/pass1.fix.diff

## Pass 2 — 2026-10-07
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 7, minor 11 (2 word-neutral sent to the fixer, 9 deferred over budget), decision-needed 0  |  Dropped in triage: 2 (duplicates)
Words (docs): 1232 (3.01x pass 0)  |  Snapshot: story-wordcell-peek-and-sticky-view.passes/pass2.md
### Applied
- [major] Description/AC — cancel() and the hide flush under a peek turned sticky above a selection must keep the view too (entry depth unchanged, no nav call), else closing the view first silences the hazard untested → fixer item 1
- [major] AC — R-65 "the view does not enter the move history": Undo/Redo enablement unchanged not asserted (rule-coverage R-65 row) → fixer item 2
- [major] Description — swallower target and suppression unspecified; a wrong guess (preventDefault only, listener on the scrim) fails the gating scrim-over-Undo case → fixer item 3 (default applied)
- [major] Description — "cannot reach their handlers" holds for pointer presses only; keyboard activation of a focused Undo/Redo/Reload behind a sticky view above a selection throws in deselect() → fixer item 4 (default applied)
- [major] AC — scrim tap over Undo proven on android only; the mouse path needs desktop (epic AC: desktop for mouse behaviour) → fixer item 5
- [major] AC — the singular F27 title is unreachable in play and untested; text.ts title needs UI Vitest cases → fixer item 6
- [major] Description — a press ended by a same-id pointerdown leaves the peek open (controller end() closes it only for cancel/pointercancel/lostCapture); next long-press throws → fixer item 7
- [minor, no words] AC — "four board baselines" are eight files (four phases × android, desktop) → fixer item 8
- [minor, no words] AC — "pinned … e.g. 412 × ~320" pins nothing → fixer item 9
### Default applied (technical)
- swallower: armed on the controller's attach root, capture phase, stopPropagation + preventDefault on the swallowed click; the controller's detach disarms it
- keyboard under the sticky view: the content outside WordCellView is `inert` while the sticky view is open
### Decision needed (functionality / UX / gameplay)
- none
### Deferred minors (over budget; for the build plan)
- how the controller recognises sheet/scrim presses (plain data attributes, checked before data-place resolution)
- sheet locator: role="dialog" named by its F27 title; scrim hit by coordinates
- a missing scroll area at a long-press release throws (rule 6), never silently closes
- the short overflow viewport: scroll the WordCell row into view before the hold
- assertion surface for "tagged top" (visible tag text) and "unhatched" (absence of the used-state class)
- overscroll on the sheet root and the title, wheel over the scrim
- intent.ts Hit wordcell gains its cell and a view action; Hit gains sheet/scrim kinds
- double tap on a WordCell: second tap closes the view (no Dialog-style guard)
- UI Vitest case drives the controller release path with a fake scroll area; cancel() is the before-hide hook, also cancel({ byBack: true })
- AD-13 "peek turned sticky above a kept selection" is P4 + S in rule-coverage; no Idle fixture overflows, so the plan records S only and close-out notes it
### Dropped
- duplicate Undo/Redo enablement and swallower-target reports
### Fixer outcome
- all 9 items applied (no conflicts; DESIGN.md sheet sizing detail cut to the reference, -9 words); no commands or tool claims added; fix diff story-wordcell-peek-and-sticky-view.passes/pass2.fix.diff

## Pass 3 — 2026-10-07
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 3, minor 11 (1 word-neutral sent to the fixer, 10 deferred over budget), decision-needed 0  |  Dropped in triage: 3 (duplicates of the focus-test and inert-placement majors)
Words (docs): 1321 (3.23x pass 0)  |  Snapshot: story-wordcell-peek-and-sticky-view.passes/pass3.md
### Applied
- [major] Description — where WordCellView mounts and where `inert` goes are unspecified; copying App.svelte's `<main use:pointerRoot inert=…>` pattern makes the view inert and hides sheet/scrim presses and the swallower from the controller → fixer item 1 (default applied)
- [major] AC — the desktop "focused Undo plus Enter" case passes without `inert` (the opening click moves focus) → fixer item 2
- [major] Description/AC — existing tests assert the old inert behaviour this ticket changes: e2e/tap.spec.ts:176 (taps wordcell-7), controller.test.ts:920, intent.test.ts:66; tap.spec.ts:357 should be extended, not duplicated → fixer item 3
- [minor, no words] AC — "text.test.ts F27 titles" names no AD id (UI Vitest names start with AD-n) → fixer item 4
### Default applied (technical)
- WordCellView renders inside Board.svelte within `<main use:pointerRoot>`, a sibling of TopBar, the banner, ActionBar and `.board`; while the sticky view is open `inert` goes on those siblings, never on `<main>` or an ancestor of the view
### Decision needed (functionality / UX / gameplay)
- none
### Deferred minors (over budget; for the build plan)
- the scrim sits above lifted faces (z-index 3) and the drag layer (5): assert elementFromPoint at a lifted face returns scrim/sheet in the held-peek-with-selection case
- the swipe and sheet-tap steps run on the session-won view left open by the peek turned sticky, at the plan's short viewport
- Card.svelte changes (a `view` mirror kind: unhatched, `touch-action: pan-y`, a `top` tag) belong in the Interface
- swallow only clicks with detail ≥ 1; a keyboard click (detail 0) passes and does not disarm
- Esc closing the view is epic 6 (F15); do not add keydown handling
- the 'AD-12 peek on end' case covers each EndReason kind (sameId, detach, up without overflow)
- split the Description and AC into bullets at the existing semicolons (no words added)
### Dropped
- repeat reports of the focus-test and inert-placement majors (merged)
### Fixer outcome
- all 4 items applied (no conflicts; line refs checked against the code); no commands or tool claims added; fix diff story-wordcell-peek-and-sticky-view.passes/pass3.fix.diff

## Pass 4 — 2026-10-07
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 1, minor 14 (2 word-neutral sent to the fixer, 12 deferred), decision-needed 0  |  Dropped in triage: 3 (the same major from three lenses, merged)
Words (docs): 1321 (3.23x pass 0)  |  Snapshot: story-wordcell-peek-and-sticky-view.passes/pass4.md
### Applied
- [major] Description — pass 3's mount default cannot be built: TopBar, the banner and ActionBar render inside `.board` (Board.svelte band snippet), and the `--wc-*` card-size properties are set only on `.board`, so a view outside it renders unsized mirrors → fixer item 1 (default applied)
- [minor, no words] AC — "AD-14 F27 titles": AD-14 is one live element per card; the view is an AD-13 overlay → fixer item 2
- [minor, no words] AC — banner Reload exists only when the dictionary failed; assert the banner band instead → fixer item 3
### Default applied (technical)
- Board.svelte gains a wrapper carrying the `--wc-*` properties that contains `.board` and WordCellView (a sibling after `.board`), inside `<main use:pointerRoot>`; while the sticky view is open `inert` goes on `.board` only, never on the wrapper, `<main>` or a view ancestor
### Decision needed (functionality / UX / gameplay)
- none
### Deferred minors (for the build plan)
- a sheet-tap close also restores the wc count (EXPERIENCE.md: non-back close pops its entry)
- the empty-cell tap and long-press case also on session-gave-up-after-commit (Game over: empty is a no-op)
- name the cells in the R-33/R-39 cases (used cell, empty cell, Composing available top card)
- a desktop mouse long-press peek case, or a plan note why the shared pointer path covers it
- a still finger held on the sheet then lifted closes the view ("closes on any tap"); pin it with one controller S case
- focus is unmanaged in epic 4 (keyboard is epic 6); epic 6 shortcuts close the view before acting (EXPERIENCE.md Keyboard)
- the tap.spec.ts:357 extension asserts the held peek does not overflow (precondition visible)
- fallback fixture: its deepest cell overflows at the plan's viewport with the WordCell row reachable
- "fake timers" = injected setTimer/clearTimer stubs as in gate.test.ts, no vi.useFakeTimers
- a desktop press in the F30 scrollbar-gutter strip neither closes nor acts (accepted, F30)
### Dropped
- two duplicate reports of the mount major
### Fixer outcome
- all 3 items applied, net 0 words (trimmed a duplicate overflow condition and filler); fix diff story-wordcell-peek-and-sticky-view.passes/pass4.fix.diff

## Pass 5 — 2026-10-07
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 0, minor 15, decision-needed 0  |  Dropped in triage: 0 (two adversarial majors reclassified minor)
Words (docs): 1321 (3.23x pass 0)  |  Snapshot: story-wordcell-peek-and-sticky-view.passes/pass4.md (no fix pass)
### Reclassified
- `top` tag string not listed in Interface/Owns → minor: SPEC Constraints "player strings only in src/ui/text.ts" already binds the builder; the plan adds the tag to text.ts
- scrim-over-Undo gate "passes without the swallower" → minor: on android the touch gesture-tap click is hit-tested at the tap point, so an unwired swallower lets it reach Undo and the case fails; only the desktop half (click retargeted to the common ancestor) is weak, a verify-precision item from pass 4
### Decision needed (functionality / UX / gameplay)
- none

## Result — converged after 5 passes

Majors per pass: 7, 7, 3, 1, 0. Words 409 → 1321 (over the 2.5x budget from pass 1; later passes applied only majors and word-neutral minors). Technical defaults applied: 7 (overflow seam, swallower seam, swallower target/suppression, inert background, view mount and wrapper, failing-gate stop rule, fallback fixture name).

Unapplied minors (for the build plan):
- the view's `top` tag string lives in text.ts (SPEC Constraints); list it with the F27 titles
- the scrim-over-Undo case records a capture-phase click recorder: the trailing click was defaultPrevented and never reached Undo; on desktop the click retargets to the common ancestor, so the desktop half is weak
- "deepest cell" = session-won cell 6 (24 cards)
- the sheet tap after the swipe lands on a non-top mirror (R-65 "only the top card is usable")
- a WordCell drag does nothing in Game over too
- the sheet has no open/close transition in epic 4 (SPEC Non-goals), so the release-time overflow read is stable
- back while a peek is held above a selection: cancel({ byBack: true }) closes the peek (no sticky), closedByBack clears the selection (UI Vitest AD-13)
- rename e2e/tap.spec.ts:176 to "… and an empty WordCell are inert" when dropping wordcell-7
- `inert` applies while the sticky view (not a held peek) is open
- sheet and scrim carry no click handlers; closing is the controller's pointer tap only
- a tap that stops a fling inside the sheet closes the view (accepted, EXPERIENCE.md "closes on any tap")
- any pointerdown on the root disarms the swallower, whatever its pointerId or button
- sheet and scrim presses are classified without setPointerCapture (SPEC CAP-4)
- if the fallback fixture is taken, the plan records it as the SPEC Assumptions exception to the epic's "two scripted valid Sessions" boundary
- plus the deferred minors of passes 2–4 above (sheet/scrim hit kinds, dialog role and name, missing scroll area throws, scroll the row into view, top/unhatched assertion surface, overscroll on the sheet root, intent.ts Hit changes, double tap, release-path S case, P4+S note for peek-sticky above a selection, scrim above lifted faces, swipe source, Card.svelte `view` mirror kind, detail ≥ 1 click filter, Esc is epic 6, every EndReason closes the peek, bullet split, sheet-tap wc restore, Game-over empty cell, named cells, desktop mouse peek, still-finger lift closes, focus unmanaged, tap.spec.ts:357 no-overflow precondition, fallback viewport bar, injected timer stubs, F30 gutter strip)
