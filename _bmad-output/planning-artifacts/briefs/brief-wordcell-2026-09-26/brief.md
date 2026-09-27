---
title: "Product Brief: WordCell"
status: reviewed
created: 2026-09-26
updated: 2026-09-27
---

# Product Brief: WordCell

Inputs: `docs/game-flow-spec.md` v0.5 (authoritative rules R-xx and decisions Q-01…Q-33),
`docs/requirements-carryover.md`, `docs/platform-decision.md`, `docs/development-methodology.md`,
`CLAUDE.md`, and the legacy rulebook in `_bmad-output/planning-artifacts/legacy/`. This brief does
not restate or reopen any Q-xx decision; where it touches a rule it cites the R-id. The brief was
hardened by a four-pass review loop (`brief.review-log.md`); Jared confirmed every inference and
every review question on 2026-09-27, so the text below carries no open items.

## 1. Executive summary

WordCell is a solo word card game in the likeness of FreeCell: 52 letter cards in eight face-up
columns, words formed from a stack tail lifted from one column, the bottom cards of a destination
column and the top cards of WordCells, placed on WordCells numbered 3–10. The game is won when
every column is empty, and the score rewards putting many letters into high-numbered
cells (R-80).

The game exists today only as a rulebook and a stalled Board Game Arena (BGA) implementation that
its designer cannot play on his phone. This project rebuilds it as a small TypeScript web app,
installed on Android as a Progressive Web App (PWA) and playable in desktop and mobile browsers,
with no backend, no accounts and no cost to run. It is a passion project: Jared is the designer,
the only developer and the first player. The brief is sized to that.

Why now: all 33 open rule questions are answered, the stack is decided, and the BGA attempt showed
exactly which engineering choices made the game unshippable. The rebuild is organised so those
failures cannot recur: one pure rules engine, an event-sourced session, a thin UI and a test for
every engine rule before any UI is built.

## 2. The problem

**The player's problem.** Jared designed a game he enjoys and cannot play. The physical version
needs a table and a dictionary; the BGA version lives in a studio sandbox behind a browser and a
manual upload step, and its word-formation controls needed about 30 attempted-fix commits
(carryover §7).

**The developer's problem.** The BGA implementation stalled for reasons recorded in
`requirements-carryover.md` §7:

- No local run-and-test loop. Every change was uploaded to BGA Studio and exercised by hand.
- Rules split between a PHP server and a 3,000-line client controller. Most logged bugs were
  client/server state desynchronisation, stale DOM closures and initialisation-order errors, not
  rule mistakes.
- Roughly 30 of 526 commits were "attempted fix" commits for the reorder and flip controls alone.

Any rebuild that repeats the split-state, hand-tested shape will stall in the same place.

## 3. The solution

**The game, as the player meets it**, phase by phase (spec §4):

1. **Pick up and drop.** Deal from a seed (R-02, R-03). Drag a stack tail from the bottom of a
   column onto any column, including its own, or tap the card and then a column (R-14); the tray
   opens (R-10, R-20, R-23).
2. **Compose.** The destination tail sits locked at one end of the word; tap a destination card or
   plus/minus to change how many join (R-31), flip it between reading downward and upward (R-30),
   add a WordCell's top card (R-33; gesture per UX), arrange the movable cards freely (R-34). On
   an empty destination column, including a whole-column self-drop, there is no destination block
   and flip is inert (R-22, R-31).
3. **Validate.** **Validate** checks the dictionary only when tapped (R-38).
4. **Place.** Choose a WordCell numbered at or below the word's letter count, order the cards so
   the right letter ends up on top, then **Confirm** (R-40–R-52, R-60).
5. **Around the move.** Undo steps back one phase at a time all the way to the deal, Redo steps
   forward, and there is no Cancel (R-39, R-70–R-72). Give up, available whenever no draft is
   open (Idle, R-75), even before the first move, when stuck (from a given-up game the first Undo
   only reinstates play); the end screen shows score, a light-hearted rating band, longest word
   and word count (R-75, R-81–R-83). If Android kills the app, the game resumes exactly where it
   was (R-73).

**The product.** A static, offline-capable PWA installable from Chrome on Android, also playable
as-is in desktop and mobile browsers (carryover §5; supported set in §7), portrait on phone and
responsive in browser (Q-17); English only, with all language data as per-language data (R-85).
Scope is §7.

**The engineering shape**, because it is the point of the rebuild: every untagged sentence that
states engine behaviour lives in a pure, deterministic engine and is covered by a Vitest test
naming the R-id; shell-behaviour and `(UI)`-tagged sentences are rendered by the shell and covered
by Playwright (§6.4); state is the event-sourced `Session` of spec §2, persisted whole
(R-73); columns and WordCells are derived by replay and never stored; the Svelte UI only renders
and dispatches; drag is hand-rolled on Pointer Events; errors fail fast (CLAUDE.md rules 1–4 and
6).

## 4. Who this serves

- **Jared, designer and first player.** Wants to play his own game on his Android phone, in
  portrait, with one thumb, in short sessions that survive interruption.
- **Jared, sole developer.** Wants a codebase where a rule change is a test change, where any rules
  bug is a short serialised `Session`, and where agents can build tickets unattended without
  guessing design intent (`docs/development-methodology.md`).
- **Friends and family Jared hands the URL to.** Secondary; they get the same build with no
  accounts and no onboarding beyond the in-app how-to-play page (§7). They shape nothing in v1
  except the requirement that the site is public and installable; bugs they report are not
  reproducible in v1 (§7).

## 5. What makes this different

Honest version: WordCell is a personal game, not a market entry, and there is no moat.

What the design offers that generic word or solitaire games do not:

- **Position, not pattern.** A stack tail is any bottom slice of a column (R-10, R-11); the
  puzzle is in choosing which tail and which destination, not in matching suits or sequences.
- **The destination must join.** A word laid under a column that still has cards once the source
  tail is lifted must use at least one of them (R-21, R-31, Q-12), so an empty column is a real,
  earned resource (R-22).
- **WordCells feed back into play.** Each cell's top card is a free letter for later words, and
  the player chooses which letter to leave on top (R-33, R-50–R-52). The scoring stacks are also
  the hand.
- **Scoring by cell number.** Long words placed high are worth far more (R-80), and the give-up
  penalty makes an honest stuck game cost something (R-81).

What the implementation offers that the BGA attempt did not: sub-second rule tests, bugs that
reproduce from a seed plus a move list, and touch drag that is owned code rather than a library
compromise. No market or comparable-product research was done for this brief; it is
not needed for a passion project and the designer is not seeking differentiation from other titles.

## 6. Success criteria

Player-facing (Jared as player):

1. Qualitative, judged by Jared: Jared plays complete games on his Android phone by choice after
   v1 ships, trusts Undo enough to experiment, and never fights the controls.
2. The app, hidden and then reloaded or reloaded without a preceding hide (Playwright), or killed
   by Android and relaunched (real device), restores every field of the spec §2 `Session` as last
   saved (version, seed, moves with draft and redo tail, cursor, `gaveUp`, `activeMs` before any
   clock tick) and the whole score history with its version (R-73, R-84), and the preferences
   (spec §7.10). Tested at the hardest boundaries: in Place with a free letter, a non-default
   placement order and a redo tail behind it; in `gaveUp`; and after a finish was recorded then
   undone, so the removed record stays removed. The architecture step defines how tests read the
   restored Session (for example re-serialisation compared field by field with the pre-reload
   snapshot); the device check uses force-stop from Android app settings.
3. Before v1 is declared done, ten consecutive qualifying games on the phone
   (played to won or `gaveUp` with at least five committed words; others are not counted and do
   not break the run), with no misdrop (a drag released in Idle while status = playing that opens
   the tray on a column other than the one Jared intended, judged by Jared at the drop) and no
   lost drop (such a drag that Jared intended for a column or placeholder slot and that opens no
   tray). Conformance to the overlap rule itself is covered by the Playwright tests in criterion 4.

Engineering (Jared as developer), reflecting the BGA lessons:

4. Every untagged sentence that states engine behaviour is covered by a passing Vitest test, and
   every `(UI)`-tagged rule or sentence and every untagged sentence that states app-shell
   behaviour (dictionary load R-38, visible-time clock R-76, storage and version rejection spec
   §2; R-84's record and undo semantics are engine-tested, R-73 and R-74's seed sentence are
   `(UI)`-tagged) by a passing Playwright test, written against the android project, with
   desktop-only behaviours (hover view, keyboard shortcuts) additionally tested on the desktop
   project. Tests name the R-id, or the spec section and Q-id
   where no R-id exists (spec §2, Q-24). Sentences that assign ownership, record provenance or
   describe versioning process are exempt and the ticket plan names them; the plan
   lists the sentence-to-test mapping, checked at review. `npm run test:all` runs both projects
   and both are green on every done ticket.
5. `src/engine/` uses no DOM, no Svelte, no I/O, no timers, no `Math.random` (CLAUDE.md rule 1),
   enforced by lint or a test chosen by the architecture step, and every engine command is a pure
   function of `Session` plus its explicit data arguments (dictionary `Set`, elapsed ms, seed,
   language data: distribution and letter values, R-85; the list is not exhaustive and whether the
   score history is an engine input or a shell concern is an architecture decision); columns,
   WordCells, score and legality are derived from `Session` and the language data by replay
   alone; no game position or derived value is stored; the only persisted data are the Session,
   the score history (R-84) and the preferences (spec §7.10).
6. No server or second state holder exists; any rule or state bug is reproducible as a Vitest case
   from a serialised `Session` (plus the dictionary for Validate and the serialised score history
   for R-84), any UI bug as a Playwright case, and every bug fixed during v1 ships with that
   reproduction in the same ticket.
7. The full unit suite runs in under 5 s and a watch re-run in under 1 s on the
   WSL2 dev machine; there is no manual deploy-to-test step. Every ticket, in every epic, closes
   through the per-ticket loop in `docs/development-methodology.md`; code lands only via ticket
   plans.
8. The gzip size of the files needed from navigation until **Validate** can first
   succeed (app shell, card art, the filtered dictionary) is at most 600 KB, measured as the sum
   of gzip sizes of those files in the production `dist/` (shell chunks, card art,
   `dictionary/en.txt`) by a script the architecture step provides. The platform decision measured
   roughly 100 KB app plus 454 KB gzip dictionary; card art is not in that estimate, so the art
   choice may force this budget to be revised. The app works offline once the service worker
   reports the precache complete, verified by a Playwright test that deals, validates and reloads
   with the network disabled; the architecture step ensures the app and the precache share one
   dictionary download.

Process:

9. Any design question raised during build is added to spec §9 as a new Q-xx and answered by Jared
   before code depends on it; decision-needed findings always reach Jared (methodology gates).

## 7. Scope

**In v1**

- Everything in `docs/game-flow-spec.md` §2–§6: deal, the move in phases A–E, commit, undo/redo,
  persistence, **New game** and **Replay this deal**, **Give up**, active-time clock, scoring,
  rating bands, score history with the six R-84 statistics.
- Viewing all cards of a WordCell (R-65); the gesture is to be confirmed by the UX step.
- The interaction surface proposed in spec §7, as confirmed by the UX step. Fixed regardless:
  tap-to-select alongside drag (R-14), one Place screen (Q-22), tap-in-column plus plus/minus for
  destination cards and a flip button (Q-23), the empty-column placeholder slot as a drop target
  (R-14, spec §7.7), free-letter removal from its tray tile (R-33, spec §7.2), preferences stored
  outside the Session, not undoable, surviving New game and Replay this deal (spec §7.10, made
  binding here), overlap drop
  targeting (CLAUDE.md rule 4), 44 px touch targets (carryover §5); spec §7 items not cited by an
  R-id or Q-id are advisory. UX ownership is in §9.
- Preferences: **Animation speed** (fast/normal/slow, spec §7.10) and **Show timer** (default off,
  R-76, Q-13), per spec §7.10 and R-76. Keyboard shortcuts on desktop, no on/off preference
  (Q-24); the shortcut set is a UX deliverable.
- English dictionary built from ENABLE, filtered to 3–23 letters (R-37), loaded as a `Set`.
- Installable PWA with offline precache; desktop and mobile browser play from the same URL.
  Install relies on Chrome's native install UI; no custom prompt in v1.
- Browser support: Chrome on Android is required and tested on device; current desktop Chromium
  is tested by the Playwright desktop project; current desktop Firefox and Safari are best-effort;
  iOS Safari is untested in v1.
- A single static how-to-play page, its text rewritten from the legacy rulebook to match spec
  §3–§6 and the §9 decisions (notably Q-12, no Cancel, no hints), plus the spec §8 worked example;
  laid out by the UX step. No interactive tutorial.
- Public HTTPS hosting with automated deploy from the repository (Cloudflare default, platform
  decision §5); the pipeline is designed by the architecture step.

**Explicitly out of v1**

- Hints (Q-19), sound (Q-20), auto-confirm (Q-07), a Cancel button (Q-01), stuck detection
  (Q-08), languages other than English (Q-14), the extended statistics of carryover §6 (Q-33).
- Accounts, server, sync, leaderboards, multiplayer. Nothing leaves the device.
- More than one game in progress (R-84).
- Everything listed under §8 Vision.
- A player-visible "copy session" affordance. Jared reads the `Session` from local storage with
  Chrome remote debugging (`chrome://inspect` over USB); bugs reported by secondary players are not
  reproducible in v1.
- New card art. The UX step chooses; the BGA sprite sheet is a candidate (spec
  §7.11). New art is not a v1 deliverable in its own right. The `QU` ×2 indicator (Q-06) is in
  scope whatever the art choice.

## 8. Vision

If v1 succeeds, WordCell is a game Jared and a few friends still play a year on, and a codebase
that stays pleasant to change. Grounded next steps, none committed and all outside v1:

- Play Store via a Bubblewrap Trusted Web Activity (TWA) from the same URL. Deferred by Jared:
  not needed yet, so not a v1 deliverable (platform decision §5).
- A second language: distribution, letter values and dictionary as data (R-85), plus its card art
  and deck order.
- Share a seed as a URL so two players can compare scores on the same deal, still
  with no backend. Nothing in the spec asks for it; a daily deal is parked here too.
- Reintroduce carryover §6 statistics if the six in R-84 turn out not to be enough.

## 9. Handoff to the next steps

- **`bmad-ux`** renders every `(UI)` rule and must decide: the tap-to-select and tap-to-drop
  gestures (R-14), alongside the fixed drag, the overlap targeting rule (minimum overlap,
  tie-break; spec §7.7), the WordCell view gesture (R-65, spec §7.9), the add-free-letter gesture
  in Composing (R-33; spec §7.2 proposes a tap, which must coexist with the R-65 view gesture in
  Composing; in Idle with a tail selected the same tap deselects, R-14) and whether insertion at
  a position (Q-31) is offered or the tile always appends, non-drag arranging of tray tiles, the
  source-column-as-destination affordance (spec §7.1), the Validate control's state while the
  dictionary is not yet loaded (spec R-38 covers only structural checks), rating band names and
  messages (R-83, Q-15), the `QU` ×2 indicator (Q-06), card art (spec §7.11), the app icon and
  manifest presentation (name, colours), the desktop keyboard shortcut set (Q-24, spec §7.2 and
  §7.10), the default animation speed, the layout of the board, tray, Place screen, end screen,
  statistics view, preferences, placement of the persistent controls (Undo, Redo, New game,
  Replay this deal, Give up, live score, timer; spec §7.6, R-75, R-76, R-82) and the invalid-word
  message (R-38), the New game / Replay confirmation and the version / Reset-history messages
  (spec §2, R-74, R-82–R-84), and the how-to-play page (§7). Portrait on phone, responsive in
  browser (Q-17); "desktop widens the same layout" is the spec §7.8 default for UX to confirm.
  One-handed play is a layout goal: tray, Validate, Confirm and Undo sit within one-thumb reach in
  portrait.
- **`bmad-architecture`** owns: the stack in `docs/platform-decision.md` §3 as decided, the
  engine/UI boundary and `Session` of spec §2, the engine/score-history boundary (R-84), the
  seeded PRNG and shuffle (R-02), dictionary build and load (R-37, R-38), the dictionary as part
  of the offline precache, and a failed dictionary load surfaced rather than hidden (CLAUDE.md
  rule 6), persistence and versioning (spec §2, R-73, R-84), PWA packaging, CI and automated
  deploy to the chosen host (platform decision §4 epic 1), the leftovers in platform decision §5
  with their stated defaults (Cloudflare, re-downloading ENABLE; Svelte 5 is decided per
  CLAUDE.md; Play Store is deferred, §8), citing the platform document rather
  than re-running the research, the app-shell duties of R-74, R-76 and spec §7.10 (seed
  generation, visible-time clock, preferences store), persistent storage
  (`navigator.storage.persist()`, platform decision §3), the engine-purity lint or test (§6.5),
  the size script (§6.8) and the Playwright touch-drag helper (platform decision §3).
- **`bmad-project-context`** then records the rules of CLAUDE.md as the AGENTS.md block.
- The PRD is skipped by decision (`docs/platform-decision.md` §4, `docs/development-methodology.md`).
