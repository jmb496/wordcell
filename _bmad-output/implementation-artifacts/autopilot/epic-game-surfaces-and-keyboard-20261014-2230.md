# Autopilot digest — epic-game-surfaces-and-keyboard (20261014-2230)

Epic: epic-game-surfaces-and-keyboard (epic 6)
Branch: epic-6-surfaces
Start commit: 4d4e5dd
Authorisation: owner-authorised autopilot, 2026-09-28 (methodology § Autopilot). Local commits only, never pushed.

## 6.1 Surface foundation and the one New game function — stopped
What it adds: the shared building blocks for every menu, panel and confirm dialog, plus the rule that New game stays one function.
Ticket review: 3 passes, diverging (majors 11, 4, 5); no decision-needed items, but three late majors touch spec/spine intent, so the run stopped (rule 1).
Build: not started
Ref to fix upstream:
- Undo/Redo reachability under menu, panels and confirms → build-notes.md, Per-surface behaviour table ("Bars live" column says "per EXPERIENCE.md" instead of saying only the end sheet leaves the bars live); a pass-2 fix added an unreachable Undo-over-a-surface path and should be reverted to the by-construction sentence in the ticket.
- Reduced-motion mechanism for CSS-driven surface transitions → ARCHITECTURE-SPINE.md AD-14 / AGENTS.md motion rule (`--wc-base-ms`) versus `duration('overlay')` 120 ms in src/ui/motion.ts.
- open(<new id>) against peek, hover peek, tile/tail selection and WordCell view on top; historyNotice's legal tops; transition rules with no test → ticket 6.1 Guards and Tests; ARCHITECTURE-SPINE.md AD-13.
Close-out docs: none

## Resume 2026-10-15 — 6.1 ticket review, pass 4 — stopped again
After the owner recorded F6-F8 in the epic SPEC, the ticket review resumed for pass 4 (majors 11, 4, 5, 8; diverging again). No fixes applied in pass 4. Build: not started.
Spec/spine-intent late majors (stop rule 1):
- F7 wording: `--wc-reduced` is a 0/1 shell flag and `REDUCED_FADE_MS` is a UI constant the shell cannot import; the spec/AD-14 must name a UI-side CSS property fed from the exported constant → SPEC F7, AD-14, motion.ts.
- Bars (Undo/Redo) under menu/panel/dialog are covered but still reachable by Tab+Enter with [endSheet, statistics]; build-notes "Bars live: per EXPERIENCE.md" must say the top bar is inert unless the top is empty/endSheet/wordcellView → build-notes.md per-surface table.
- F8 opener sequence (clear, pop, push) has no owning ticket in 6.1; entry 10 owns the closeView-first helper → SPEC F8, tickets.toml entries 1, 2, 10.
Ticket-level majors (not spec intent, left for the fix pass): act() scan vs Dialog/Sheet, existing overlays tests vs new pair guard, newGame scan wording, depth matrix, 360x320 check without mounted page.
Close-out docs: none

## 6.1 Surface foundation and the one New game function — done
What it adds: the shared building blocks every menu, panel and confirm dialog will use (open/close rules, sheet/panel/dialog shells, the `openSurface` helper), and the rule that New game stays one function.
Ticket review: 7 passes total (3 before, 4 after your F6-F8 answers), capped (majors 11, 4, 5, 8, 6, 2, 1); nothing needed your input.
Build: built; commit bfed752
Code review: thorough, 3 passes, converged (majors 5, 1, 1); fixes in 3638e0e, 03824f1
Tests: all passing (one drag test failed once in the first full run, passed alone and in the full rerun: treated as a flake), screenshots passed
Ref to fix upstream: Motion paragraph of the ticket (reduced-motion CSS branch gating check) → ticket 6.1 Description > Motion; technical, not spec intent.
Tokens: 6.7M input-equivalent (code review 33%, build 30%, ticket review 25%, other 9%, orchestrator 3%)
Worth knowing: open item carried to a later ticket or the refactor sweep: `openSurface('resetConfirm')` over the History notice with a sticky WordCell view or tail selection beneath throws AD-13 from its clearing step (latent, no opener calls it that way yet; default fix: skip clearing when the top is the History notice, plus a test). Flaky drag test: e2e/success-signal.spec.ts "the same move by drag" (android).
Close-out docs: SPEC.md F6, F7, F8 (epic 6 spec) already hold your 2026-10-15 answers; no other owner doc changes.

## 6.2 Menu sheet, menu button and version footer — stopped (rule 1, owner decision)
What it adds: the ☰ menu button and the menu sheet (New game, Replay this deal, Give up) with the version footer.
Ticket review: 3 passes, converged (majors 8, 1, 0); nothing needed your input
Build: built; commit f924833
Code review: thorough, 2 passes, converged (majors 1, 0); 1 fix applied (WIP dacf5ef); 1 decision for the owner
Tests: build and review runs passed; full test:all and screenshots not yet run (stopped before Step D)
Ref to fix upstream: none
Tokens: 5.2M input-equivalent (build 38%, ticket review 35%, code review 20%, other 4%, orchestrator 2%)
Worth knowing: decision pending — with a WordCell view open (or a peek), the view's scrim covers the top bar, so a real tap on ☰ cannot reach it, though the ticket and SPEC F6 say the top bar stays live. Proposed default: leave the layering, amend the ticket wording. Alternative: raise ☰ above the scrim (layering change plus real-tap e2e tests).
Close-out docs: none yet

## 6.2 Menu sheet, menu button and version footer — done
What it adds: the ☰ menu button and the menu sheet (New game, Replay this deal, Give up) with the version footer.
Resumed 2026-10-15 after the owner's answer (option A): the menu button stays covered by an open WordCell view; the player closes the view first. Recorded in the ticket, SPEC F6 and build-notes.
Ticket review: 3 passes, converged; nothing needed your input
Build: built; commit f924833
Code review: thorough, 2 passes, converged (majors 1, 0); 1 fix applied (WIP dacf5ef)
Tests: all passing, screenshots passed (14)
Ref to fix upstream: none
Tokens: resume session 0.1M input-equivalent
Worth knowing: unapplied minor: the menu inert test's Enter probe after blur cannot fail alone (the closest('[inert]') assertion carries the rule).
Close-out docs: SPEC.md F6 (epic 6 spec) already holds the 2026-10-15 owner answer (☰ covered by a sticky WordCell view); EXPERIENCE.md/DESIGN.md Elevation wording on "top bar stays live" for the WordCell view may need the same note at the retro.
