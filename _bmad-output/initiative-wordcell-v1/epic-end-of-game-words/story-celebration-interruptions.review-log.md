# Review log — story-celebration-interruptions.md
State: pass 4: done
Pre-loop: HEAD 765affe; pass0.md 216 words; growth budget stated 1500 words; tickets.toml entry 7 fields interface, tests, owns, consumers, plan_checkpoint passed as intent, to be added to Description in pass 1.

## Pass 1 — 2026-10-24
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 10 (merged from ~30 raw), minor 6, decision-needed 0  |  Dropped in triage: 4 (duplicates merged)
Words (docs): 1075 (4.98 x pass 0; budget 1500)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-celebration-interruptions.passes/pass1.md
Fixer: all 16 applied; no runnable commands added; test titles checked in e2e/celebration.spec.ts; item 6 worded "☰ throws, `M` is ignored" (code shows `M` ignored in `attempt()`); Redo test attributed to entry 5 (commit 691c8e6).
### Applied
- [major] Description — tickets.toml entry 7 interface, tests, owns, consumers, plan_checkpoint not carried; hide-end default needs the owner's nod (10.4 plan) → fixer item 1
- [major] Description hide — "hide mode" undefined; default plain `end()` from a main.ts `registerBeforeHide`, entry 5's `done` hidden branch defers the open silently → fixer item 2
- [major] AC hide row — cannot tell "queued for next visible" from "opened while hidden"; no second flush; "back and menu still work" unasserted → fixer item 3
- [major] Description hide — `pagehide` on a visible reload now runs the hide end; e2e/celebration.spec.ts reload-mid-run relaunch test must stay green → fixer item 4
- [major] Description resize — listener owner/lifetime, trigger, and orientationchange test route unstated → fixer item 5
- [major] Description ☰/`M` — handlers (TopBar.svelte, keys.ts `CELEBRATION_KEYS`), shared helper, guarded deferred open (double ☰, ☰ then hide before settle → halt), `act()` unchanged, closes the interim throw → fixer item 6
- [major] AC — "interruption rows" not a rule-coverage label; list rows, project, new vs already covered → fixer item 7
- [major] Description keys — rule-coverage "WordCell tap does nothing" vs entry 6's consumed skip; tap clause covered by entry 6 → fixer item 8
- [major] AC — AD-19 Tests requires UI Vitest for hide/resize/menu wiring → fixer item 9
- [major] Description cancel — Undo keys on `desktop` missing; cancel outcomes unpinned (no late sheet, wc 0, New game back leaves the app) → fixer item 10
- [minor] Description Redo — mid-run Undo then Redo boundary → fixer item 11
- [minor] References — TopBar.svelte not Menu.svelte; missing files and spec refs → fixer item 12
- [minor] Notes — device proof belongs to entry 9's final Android read; ticket closes the merge blocker → fixer item 13
- [minor] AC screens — no baseline added or changed → fixer item 14
- [minor] Description — hide/resize ends while halted pass through (as skip.ts) → fixer item 15
- [minor] Notes — back landing between ☰'s pop and the sheet push: accepted residual (AD-13 nav absorbs) → fixer item 16
### Default applied (technical)
- Hide end — plain `celebration.end()` registered last in main.ts `registerBeforeHide`; no mode flag; AD-19 "hide mode" wording to entry 9's sync
- Resize — permanent `window` `resize` + `orientationchange` listeners in main.ts calling `celebration.end()` (no-op with no run, no size compare)
- Menu — one shared helper: under `celebration`, `end()` then `nav.whenSettled` opening the menu only if top is `endSheet` and the menu is not open; `menu` joins `CELEBRATION_KEYS`; `act()` unchanged
- Halted — hide/resize ends do nothing while halted
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Duplicates of the contract, hide-mode, rows and WordCell-tap findings across lenses (kept the clearest)

## Pass 2 — 2026-10-24
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 3, minor 10, decision-needed 0  |  Dropped in triage: 5 (duplicates merged)
Words (docs): 1353 (6.26 x pass 0; budget 1500)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-celebration-interruptions.passes/pass2.md
Fixer: all 13 applied; no commands added; keys.test.ts titles, `animationFrames` (e2e/helpers/lifecycle.ts), main.ts `halted()` and `cancelAnnounce` registration checked; no import cycle for open-surface.ts `openMenu()`; fixer flagged item 12 rests on a later flush (cancelAnnounce runs before the new callback in the same flush).
### Applied
- [major] Hide/Resize/AC U tests — wiring inline in `main.ts` cannot be unit-tested (main.ts boots on import); name a UI module the U tests drive with fakes → fixer item 1
- [major] Halted bullet — bare `registerBeforeHide(() => celebration.end())` contradicts the halted rule (flush runs in every state); check location (callbacks only, never `end()`) and no test → fixer item 2
- [major] Plan checkpoint / Hide — plain `end()` (queued `nav.pop` on a hidden page) departs from AD-19 Hide's "hide mode" wording; make it an explicit rule 7 checkpoint item with the rationale and the conforming alternative → fixer item 3
- [minor] Menu — shared helper has no home → fixer item 4
- [minor] Menu — deferred branch must run `openSurface('menu')`; "menu not open" redundant → fixer item 5
- [minor] Menu — the dropped open is the ticket's own default, not a spec-prescribed outcome; list it at the checkpoint for a SPEC F-row at entry 9 → fixer item 6
- [minor] Keys — doc-sync hand-off also covers EXPERIENCE.md Keys while it runs, AD-13 celebration sentence, SPEC F15 → fixer item 7
- [minor] Menu — keys.test.ts `KEY_OF` `menu` row and its coverage assertion, overlays.svelte.ts `SUSPENDING` comment change too → fixer item 8
- [minor] AC hide row — ☰ pressed after back collapsed the sheet; fix the order → fixer item 9
- [minor] AC keys row — `Enter` on an empty WordCell proves nothing; use non-empty `wordcell-3` → fixer item 10
- [minor] Cancel — "advancing the hook clock past the cap" cannot fail with no live run → fixer item 11
- [minor] Hide — any visible `pagehide` (navigation away too), the announce dropped by the next flush's `cancelAnnounce()` → fixer item 12
- [minor] AC ☰ row — assert `running()` false, no copies, entry counts → fixer item 13
### Default applied (technical)
- Wiring module — `src/ui/celebration/interruptions.ts` `installInterruptions({ win, registerBeforeHide, halted, end })`, called by main.ts after its existing `registerBeforeHide` calls; U tests with fakes
- Halted guard — in the hide and resize callbacks only (`game.state.kind === 'halted'`), never in `end()`
- Menu helper — `openMenu()` exported from `src/ui/open-surface.ts`
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Duplicates of the wiring-module and halted findings across the four lenses; the "openSurface" wording minor raised twice

## Pass 3 — 2026-10-24
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 2, minor 8, decision-needed 0  |  Dropped in triage: 6 (duplicates merged)
Words (docs): 1471 (6.81 x pass 0; budget 1500)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-celebration-interruptions.passes/pass3.md
Fixer: all 10 applied; no commands added; keys.test.ts title, EXPERIENCE.md row, open-surface.ts/Menu.svelte comments and the four reference paths checked; tightened Interface/Halted/Menu wording (the Menu dropped-open default no longer says "listed at the plan checkpoint"; it still goes to entry 9's SPEC F-row).
### Applied
- [major] Hide rule 7 fallback — "remove without `nav.pop`, sheet push reuses the stale entry" is unbuildable (nav has no reuse op; next back swallowed) and contradicts the ticket's own AC; a decline stops the build for a ticket revision → fixer item 1
- [major] AC U tests — with `end` faked, pop/`done` counts and idempotence are unobservable; real attached `end()` with nav mocked (attached.test.ts pattern), nav unsettled until after the microtask for the menu case → fixer item 2
- [minor] Hide visible `pagehide` — reload makes it moot; event-order claim unverified; bfcache restore may leave a pending pop (first back absorbed) → Notes residual for entry 9 → fixer item 3
- [minor] Menu keys.test.ts — `M` loses all unit coverage; extend "AD-13 Z, Ctrl+Z and N act while only celebration is open" to `M` → fixer item 4
- [minor] Menu — deferred open runs outside `act()`; the plan wraps it in `act()` or says why no gesture can start → fixer item 5
- [minor] AC resize — `orientationchange` needs its own run → fixer item 6
- [minor] AC hide — "no throw" has no observable; no Halted surface → fixer item 7
- [minor] Entry 9 sync — who registers the hide callback (AD-19 says main.ts); silent return cites epic 6 F16 / entry 5, EXPERIENCE.md row to sync → fixer item 8
- [minor] Comments — open-surface.ts header and Menu.svelte comment change with the code → fixer item 9
- [minor] References — layout.svelte.ts, announce.ts, e2e/helpers/live-region.ts, attached.test.ts → fixer item 10
### Default applied (technical)
- Declined hide default → the build stops for a ticket revision (no fallback mechanism named)
- U-test harness — fake `win`, `registerBeforeHide`, `halted`; real attached `celebration.end()` with nav mocked
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Duplicates of the fallback and U-test findings across lenses

## Pass 4 — 2026-10-24
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 0, minor 15, decision-needed 0  |  Dropped in triage: 2 (duplicates merged)
Words (docs): 1471 (6.81 x pass 0; budget 1500)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-celebration-interruptions.passes/pass3.md (no fix pass)
### Applied
- none (converged)
### Default applied (technical)
- none new
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Duplicate resize-toolbar and keys.test.ts `M` observable findings (raised by two lenses each)

## Result — converged after 4 passes
Majors per pass: 10, 3, 2, 0. Words 216 → 1471 (budget 1500). Decision-needed: none. Technical defaults applied: 9 (hide via plain `end()` as a rule 7 checkpoint item; decline stops for a ticket revision; `installInterruptions` module; halted guard in its callbacks; permanent resize/orientationchange listeners, no size compare; `openMenu()` in open-surface.ts with the guarded deferred open; `menu` in `CELEBRATION_KEYS`; U-test harness with the real attached `end()` and mocked nav).

Unapplied minors (for the build's plan or a later loop):
- Menu bullet — pass 3 tightening dropped pass 2's "listed at the plan checkpoint" for the dropped deferred open; the plan lists it at the checkpoint beside the Hide rule 7 item.
- Menu bullet keys.test.ts — `celebrate()` starts no run and open-surface is real, so `M`'s effect is unobservable; spy/mock `openMenu()` or `celebration.end()` and assert it is logged.
- Interface — `openMenu()` in open-surface.ts pulls celebration.svelte.ts (and game.svelte.ts's import-time `window` listener) into every importer's tests; overlays-surfaces.test.ts needs a game.svelte mock and `whenSettled`/`settled` on its nav mock; confirm the 5 s unit budget, else move `openMenu()` to a small module.
- keys.test.ts — removing `menu` from `KEY_OF` also needs `menu` in its `Exclude<…>` type.
- Resize — "no size compare" ends the run on a mobile-browser toolbar resize (AD-11 / A-D11 innerHeight-only < 80 px); keep the default, record as a residual for entry 9's Android read.
- AC ☰ row — the double ☰ tap's timing is unstated; use the `doubleTap` pattern (e2e/history-notice.spec.ts) and say which branch it exercises (the drop branch is the U test's).
- AC keys/Cancel — `Z`, Ctrl+Z and `N` each need their own run (Redo or a separate test).
- AC resize — reuse the hide sub-case's outcome assertions (`running()` false, no copies, entry count) for both resize events; say how the second run is reached.
- Halted bullet — reword to "the injected `halted()` check" so interruptions.ts does not import `game`.
- Entry 9 sync — the tickets.toml entry 7 `interface` field (`end(hide-mode)`, main.ts registrations) is stale; add to entry 9's sync or the plan's owner note.
- Hide bullet — a bfcache navigation away may keep the visible branch's announce (scheduled after this flush's `cancelAnnounce()`); add to the bfcache residual for entry 9.
- References — add src/ui/Menu.svelte (its comment changes; tickets.toml lists it).
