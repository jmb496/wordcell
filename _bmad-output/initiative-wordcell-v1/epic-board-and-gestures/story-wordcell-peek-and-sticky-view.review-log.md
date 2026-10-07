# Review log — story-wordcell-peek-and-sticky-view.md (ticket 4.11)

State: pass 2: done

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
