---
epic: epic-end-of-game-words
date: 2026-10-25
verdict: accepted-with-open-items
criteria: declared
headless: false
---

# Retrospective: epic 10, End-of-game word list and win celebration

## Epic summary

Epic folder `_bmad-output/initiative-wordcell-v1/epic-end-of-game-words`, branch `end-of-game-words`,
cut from `main` at `19acd17` (Merge epic 9). Retro run at HEAD `d4b42a6`; `npm run test:all` green there
(owner, `d4b42a6` message); screenshots last run at 10.10 (67 passed, digest 10.10), and nothing after
touches a `*.screens.spec.ts` or UI source (`6c0ece0`, `d4b42a6` change docs and `e2e/end-sheet.spec.ts`).

Tickets (`tickets.py status`, build order), all `done`; none at `built`, `pending_tickets` empty:

| Ref | Ticket | Plan baseline | Range | Commits |
|---|---|---|---|---|
| 10.1 | Engine word list and its fixture | `d3b76f1` | `d3b76f1..1190a6f` | 10 |
| 10.2 | End-sheet Words section | `1190a6f` | `1190a6f..57efcbd` | 14 |
| 10.3 | Celebration step, renderer and run controller | `57efcbd` | `57efcbd..a194a2e` (cut, below) | 52 (16 epic 10) |
| 10.4 | Celebration overlay entry | `a194a2e` | `a194a2e..00a1304` | 10 |
| 10.5 | Win trigger and celebration test seam | `00a1304` | `00a1304..2a0bfbd` | 12 |
| 10.6 | Celebration skip | `2a0bfbd` | `2a0bfbd..eaf8ffb` | 31 |
| 10.7 | Celebration interruptions | `eaf8ffb` | `eaf8ffb..131df48` | 8 |
| 10.8 | Hook-free celebration suite | `131df48` | `131df48..91d1f55` | 10 |
| 10.9 | Close-out: documents, AGENTS pitfall and device check | `91d1f55` | `91d1f55..728b18a` | 16 |
| 10.10 | Refactor sweep | `728b18a` | `728b18a..d4b42a6` (inferred to HEAD) | 9 |

Baselines verified in ancestor order (`git merge-base --is-ancestor`). The planning commits before
10.1's baseline (`9ca004c`…`d3b76f1`: spec, UX, AD-19, epic file, ticket 10.1 pull and review) are
the epic's set-up and fall outside every plan range.

**Range cut (10.3).** `57efcbd..a194a2e` also carries 36 commits that are not epic 10: autopilot
tooling (`fd69490`, `e92e7d6`, `9e3e8cc`, `b76098a`, `f16ac6e`, `de864f5`, `3b4683a`) and the Opus
re-reviews of epics 5, 6, 8 and 9 (`ca202db`…`0cc58ac`). They are excluded from every view below; the
epic 10 commits in the range are `e161c3c`…`91e03d7` (10.3 build and review), the Opus re-review of
10.1–10.3 `c84a1df`, `7352e29`, `4e0d813`, `f4ad3d1`, `bd071ee`, and 10.4's ticket pull and review.

**Evidence inventory.**

- Available: epic file (Done when 1–5, Notes, Known issues); initiative file; SPEC
  `_bmad-output/specs/spec-epic-10-end-of-game-words/SPEC.md` (F1–F32) with `rule-coverage.md` and
  `.memlog.md`; ten story files, ten plans, ten ticket review logs and the build review logs under
  `_bmad-output/implementation-artifacts/review-loop/` (`10-*-build.md`, `opus-review-epic-10.md`); the
  autopilot digest `_bmad-output/implementation-artifacts/autopilot/epic-end-of-game-words-20261020-0925.md`
  (per-ticket entries, every stop, Run complete); `git_evidence.py` per range.
- Missing: raw session transcripts. The digest's per-ticket "Worth knowing", stop and startup notes
  stand in for them; process lessons below are drawn from the digest and logs only.
- Previous retrospective: `epic-themes/epic-themes-retrospective.md` (2026-10-19).

## Findings

Scope: the epic 10 commits of `19acd17..d4b42a6` (144 of 180; the 36 cut commits above excluded).
The four analyses ran as fresh-context sub-agents (doc reconciliation, aggregate views, `bmad-review`
with the adversarial, edge-case and verification-gap lenses, behavior check). Every finding routed
below was re-checked here against the primary source. Owner-recorded items are not re-reported: SPEC
F30 (second-finger residual), F31 and the bfcache rows 78/79 (epic Known issues), F32 (low-fps
overrun), the toolbar-resize end and the F29 raced ☰ open. The 10.10 plan Appendix C (every
deferred finding of the epic, with its fate) was read so closed rows are not re-raised.

### Spec-to-implementation reconciliation

Checked and clean. Every close-out doc item of the digest's Run complete is applied at HEAD and
matches the code: AD-19 Start (F16, SPINE:971), Skip (F17–F19, tails, halted pass-through,
SPINE:973), Rule bullet 1 (F21/F23/F25/F26/F27, SPINE:966), renderer (35 %, no launch row, transform
per copy, SPINE:970), Hide (F28, SPINE:969), cap low-fps note (F32, SPINE:972), `open-menu.ts`
(SPINE:577, :656, :963, :1025, :1120), AD-17 Touch `doubleTap` (SPINE:857); EXPERIENCE.md "Never plays"
(F16, :437), F27 (:434), F28 (:436), Keyboard F15 (:346-347, :378, :384, :387, :438), Motion F32 and the
known-issues pointer (:414, :440); DESIGN.md Win celebration (:692) and A-D12 (:753); SPEC CAP-2 (:33),
F25 (:113), F24 marked superseded (:112); epic References F1…F32 (epic:46); R-87 banner exemption
(game-flow-spec.md:376, :13). No doc presents the F31 skip as built (SPINE:970 names it a known
issue). `rule-coverage.md` has no row without a passing, id-named test (R-86: 15 in
`src/engine/view.test.ts`; R-87: 31 in `e2e/celebration.spec.ts`, 3 in `e2e/pwa/dist-smoke.spec.ts`;
AD-19 units about 150 across `src/ui/celebration/*.test.ts`; R-88: 12 in `e2e/end-sheet.spec.ts`,
screens `e2e/end-sheet.screens.spec.ts:54`). AGENTS.md carries the copy pitfall (:75, :83).
`src/engine/session.ts`, `serialize.ts`, `src/shell/history.svelte.ts` are unchanged over the range;
`SESSION_VERSION` and `HISTORY_VERSION` stay 1.

| # | Finding | Source | Disposition |
|---|---|---|---|
| R1 | DESIGN.md A-D12 reads "scale to at least 40 % of card size sized as if their row overlapped by 35 % … (F20)" and cites F20 twice | DESIGN.md:753 | Fix now (wording; applied post-retro) |
| R2 | Epic Notes still states F31 as "skips the celebration (follow-up ticket for the retrospective)", which the owner replaced on 2026-10-25 with a known issue | epic file:76 vs Known issues :86 | Fix now (applied post-retro) |
| R3 | Epic Notes still says the AD-19 bullet 1 / CAP-2 / DESIGN.md 50 % sync is pending "by entry 9" | epic file:78; done in `52d5aa5`, `d4b42a6` | Fix now (applied post-retro) |
| R4 | `tickets.toml` entry 7 `interface` still reads `end(hide-mode)` | `tickets.toml:124`; 10.10 Appendix C row 77 | Accept as-is: entries are not maintained after pull |

### Architecture delta

Checked and clean: no shell→UI import, UI imports from the engine are type-only
(`celebration.svelte.ts:26`, `Celebration.svelte:3`), the engine diff (`view.ts`, `replay.ts`) is
pure and its sort is locale-free (`view.ts:291`), and the value-import cycle set over `src/**` is the
same at `19acd17` and HEAD (one pre-existing shell cycle, `game` ↔ `history` ↔ `prefs`). The
celebration depends on overlays one way; `open-menu.ts`, `end-sheet.ts` and `keys.ts` import it one
way.

| # | Finding | Source | Disposition |
|---|---|---|---|
| A1 | `celebration.svelte.ts` is the one module imported with an explicit `.ts` path (all five importers), a `/mnt/d` case-collision workaround with `Celebration.svelte`; recorded in Scaffold deltas and a comment, not in AGENTS.md pitfalls, so a new importer breaks only on drvfs | `4c9f853`; SPINE:1087-1089; `open-menu.ts:9` | Defer: candidate pitfall for the next `bmad-project-context` refresh |
| A2 | The run reads card width from `getComputedStyle('.board-root')` `--wc-w`, a second, DOM-based source beside the AD-11 layout object | `celebration.svelte.ts:256`; `main.ts:172` | Accept as-is (fails fast when missing, `:258`) |

### Duplication map

| # | Finding | Source | Disposition |
|---|---|---|---|
| D1 | The celebration copies' card-face CSS (`.face`, `::after`, `.glyph`, `.glyph.qu`, `.badge`) is a hand copy of `Card.svelte`'s; a card-look or theme change must be made twice. Not in 10.10 Appendix C | `Celebration.svelte:83-106` vs `Card.svelte:214-240` | Defer: refactor candidate (shared face styles) for a later sweep |
| D2 | Gesture consumption is built twice on the same document capture node: the skip tails (held ids, consumed `pointerup`, F18 guard, Space repeat/keyup) beside the AD-14 winning-guard tracker; three separate 300 ms constants (`MIN_GUARD_MS`, `CLICK_GRACE_MS`, `SWALLOW_MS`) | `skip.ts:30`, `:81-203`; `motion.ts:50-140`, `:55`, `:60`; `click-swallow.ts:9` | Defer: refactor candidate |
| D3 | "No board input while celebrating" is gated in about seven places (`intent.ts:128`, the controller's `celebrating` mark, overlays throws, the skip listener, `App.svelte` `mainInert`, `keys.ts:527-538`, `end-sheet.ts:27`); `celebration` sits in `SUSPENDING` and consumers carve exceptions back out | `overlays.svelte.ts:76`; files named | Defer: note for the next AD-13 touch |
| D4 | Smaller repeats: `BARS` re-encodes `visible-band.ts`'s band ids; the token-guarded sheet open appears three times; `createClickSwallower` reused through an `as unknown as EventTarget` cast; e2e helpers restate `MANUAL_STEP_MS`, the cap formula and `WON_WORDS_LIST` | `skip.ts:61`, `:97-109`; `gestures/visible-band.ts:24`; `end-sheet.ts:42,53,58`; `e2e/helpers/celebration.ts:11-21` | Defer (low) |

Clean: the visible band reuses `createVisibleBand` (`celebration.svelte.ts:252`); one reduced-motion
read (`end-sheet.ts:41`); history entries go only through overlays and nav.

### Size growth

| # | Finding | Source | Disposition |
|---|---|---|---|
| S1 | `celebration.svelte.ts` (381 lines) holds about eight jobs: DOM measurement, run state, the rAF driver, the manual clock, the renderer, the overlay attach lifecycle, the AD-17 flag and skip wiring; it also keeps an unattached test-only mode (`onEnd`, `handler`) | `celebration.svelte.ts:118-176`, `:251-268`, `:321`, `:333` | Defer: split candidate (renderer, measurement); the `onEnd` part stays declined (10.10 Appendix C row 76, AD-19 names it) |
| S2 | `step.ts` (439 lines) carries no tuning leftovers (`OVERLAP`, `MIN_SPEED_SHARE`, `EXIT_AFTER_CONTACTS`, the time lag and the launch row are gone), but exports kept for tests (`RISE_SHARE`, `HOP_SHARE`, `cardBounces`, `DT_MAX_MS`), fields read only by tests (`Group.contacts`, `StepState.ceiling`), `stackOrder` in the physics module, and a 34-line F20–F27 tuning-history header | `step.ts:1-33`, `:36`, `:434` | Defer (low) |
| S3 | `step.test.ts` (1223 lines) pins tuned literals (`:624-740`, `0.553` at `:1170`), so any retune rewrites them; `celebration.svelte.test.ts:946-988` walks the source with the TypeScript compiler API outside the `src/architecture-*.test.ts` files | named lines | Accept as-is (the owner's tuning rounds relied on these pins) |

### Pattern divergence

Checked and clean: id-first test names (every touched UI/shell Vitest test starts with AD-n),
`act()` on ☰ and the deferred menu open (`TopBar.svelte:57`, `open-menu.ts:21`), durations only from
`motion.ts` (the celebration is rAF), `--wc-base-ms` transitions, messages in `text.ts:244-249`,
`data-celebration` on copies only, no new `data-testid`, no `console` in `src`, z-index 6 per
DESIGN.md layer order.

| # | Finding | Source | Disposition |
|---|---|---|---|
| P1 | `render()` returns silently when no elements are registered, so a run whose mount failed would tick invisibly to the cap (rule 6) | `celebration.svelte.ts:119` | Defer: fold into F1's follow-up (fail fast) |
| P2 | `launch` clamps (`Math.max(0, …)`, `b > a ? … : 0`) turn an off-band origin or tiny band into an invisible run, which is how the F31 known issue shows | `step.ts:209`, `:282`, `:286`; `6c0ece0` | Accept as-is (known issue F31, owner 2026-10-25) |
| P3 | `EndSheet.svelte` uppercases the visible word while `text.wordRow` uppercases the aria-label; `replayWords` builds every word's cards on each `view()` call | `EndSheet.svelte:188`; `replay.ts`, `view.ts` | Defer (low) |

### Diff-scope review (`bmad-review`, ticket boundaries)

| # | Finding | Boundary | Source | Disposition |
|---|---|---|---|---|
| F1 | A halt (AD-15 fatal or Q-38) during a run does not stop the run: frames keep stepping behind the Halted screen until the cap, then `end()` closes the `celebration` entry, a real `nav.pop()`. No sheet is pushed and nothing is announced, since `game.view` is `undefined` once halted (`game.svelte.ts:92-94`; the reviewer's stronger "pushes the sheet and announces" did not hold). Hide while halted is skipped by design (`interruptions.ts:30-32`) | 10.3 ↔ 10.5 ↔ 10.7, AD-15 | `celebration.svelte.ts:182-219`; `main.ts:80` | Defer (low): stop the run on halt (or check `halted()` in `frame`); same follow-up as P1 |
| F2 | Two quick Space presses skip the run and then replay the deal: Space's keyup is consumed but a fresh keydown passes (`skip.ts:178-181`), the opened sheet focuses Replay this deal, a keyboard click has `detail` 0 and a won game needs no confirm (`EndSheet.svelte:67`, `new-game.ts:46-52`). Esc, Esc likewise collapses the sheet just opened. SPEC F18's 300 ms guard covers presses only | 10.6 ↔ 10.4/10.5 | named lines | Open question for the owner (key guard is a UX choice); not built |
| F3 | A second throw replaces the first fatal's text: if `celebration.start()` throws after the entry is pushed, a back on the Halted screen reaches `removed('ended')` with no run and throws again, and `halt('fatal')` keeps the newest text | 10.3 ↔ 10.4 ↔ 10.5 | `end-sheet.ts:50-51`; `celebration.svelte.ts:194-200`; `game.svelte.ts:205-216` | Accept as-is: needs an earlier bug, and AD-15's latest-fatal-wins is as documented |
| F4 | A resize landing during the winning glide or the 300 ms guard defers the relayout; the run then starts from the old card width and WordCell positions and nothing ends it | 10.5 ↔ 10.7 ↔ layout gate | `celebration.svelte.ts:252-268`; `flip.ts:470-483`; `layout.svelte.ts:303-310` | Defer: plausible, not reproduced; a test candidate |
| F5 | Turning reduced motion on during a run does not stop it (read once at the settle) | 10.5 ↔ 10.7 | `end-sheet.ts:41`; `prefs.svelte.ts:149-153` | Accept as-is: SPEC CAP-3 says "does not start"; EXPERIENCE.md "never plays" is read at start |
| F6 | The closing-fade unit test passes only through NaN: it sets `vx: 0`, so `arcAt` computes `0 · asinh(u/0)` and `exited === false` holds because NaN compares false. 10.10 fixed the same defect in `step.test.ts` (Appendix C row 19, now `speed: 0`) but missed this sibling | 10.10 ↔ 10.3 | `celebration.svelte.test.ts:823-841`; `step.ts:168-171` | Fix now (Dev, small, test-only): use `speed: 0` and correct the comment |

Checked and found clean (reviewer, re-read here): ☰/M during a run against the F18 swallow, hide
during the press-skip tail (no nav touch), Redo restoring a win after a resize-ended run, Undo and New
game mid-run (`cancelled` drops `done`), two runs in a row, skip listener attach/detach, the 10.8
dist-smoke rows. Appendix C rows 22, 27, 32, 37-41, 43, 44, 48-50, 70 hold as recorded; none marked
fixed is unfixed.

### Process lessons (digest and logs; no session transcripts)

| # | Lesson | Source | Prevention |
|---|---|---|---|
| L1 | The handoff JSON was left stale by usage-limit stop commits three times, and each next session had to settle the resume from the ticket files | digest:105, :206, :234; SKILL.md Usage limits item 3 names only the digest | Usage limits item 3 also writes and commits the handoff JSON (applied post-retro) |
| L2 | A dead `.autopilot/20261020-0925/10.6-C3.done.pid` was reported in every session from 10.8 to 10.10 | digest:187, :191, :206, :214, :221, :249; SKILL.md:64-66 | A pid file naming no live process is deleted at startup and noted (applied post-retro) |
| L3 | `e2e/nav.spec.ts:162` failed under load 5 times across 10.4–10.9 and blocked 10.9 twice before the owner's `doubleTap` fix (`169c6bc`); it was carried as "known flake" for four tickets | digest:65, :74, :203, :210-216, :220 | A flake that recurs in a second ticket gets a fix ticket at once (owner process) |
| L4 | 10.6 took six owner device reads (F20–F27, F24 superseded by F25) and about 42M input-equivalent tokens, each round a code change plus review; the plan chose no dev harness for the renderer | digest:96-152; epic Notes:61, :67-71 | For the next motion-tuning ticket, plan a live-tunable preview (constants from the URL or a dev panel) for the device read; `scripts/device-preview.mjs` (`fe9744a`) already removed the transport cost |
| L5 | The Opus re-review of the Sonnet-built 10.1–10.3 found 12, 7, 4, 2 majors (drift side inverted, desktop floor bounce, band ignoring the banner, `data-celebration` on groups, vacuous tests) | epic Notes:77; `c84a1df` | Landed: the autopilot checks the model (`b76098a`, `f16ac6e`) |
| L6 | Plan checkpoints (10.3–10.7) were built unattended and the owner items settled at stops under the standing rule; no rework followed | digest:65, :77, :106, :162 | None: the pattern worked |

The epic's recorded spend is about 150M input-equivalent tokens across 19 digest entries.

## Behavior verification

Exercised hook-free on `dist/` (built from HEAD's sources, served by `vite preview`, Playwright
Chromium at 360×740 touch and a desktop viewport, service worker blocked; script and screenshots in
the session scratchpad):

- **Win, tap skip (Done when 1):** seeded `session-won-words`, Undo, Confirm: copies appear 684 ms
  after Confirm (55 copies, 10 groups, live cards untouched); a tap opens the expanded sheet in 21 ms
  with focus on Replay this deal. Words: `EHNPBNTFSA 10, JDAQUYE 7, EIOGKD 6, TMXRWO 6, AECCP 5,
  LHVIA 5, NMIHZ 5, LTOS 4, SURF 4, SURF 4`: longest first, ties alphabetical, the duplicate twice,
  equal to `WON_ROWS`. Pass.
- **Natural run:** 5,830 ms from first copy to last (3 runs, frame gaps ≤ 17 ms), sheet 2 ms later;
  Confirm to sheet 6,482 ms, the 650 ms before the run being the commit glide and guard. Pass.
- **Desktop skips:** Escape 10 ms, back 9 ms (app stays open), Space 8 ms, `M` 14 ms (sheet, then
  menu). Undo mid-run cancels with no sheet; a rotation mid-run ends the run and opens the sheet.
  Pass.
- **Long list:** `session-won-long-words`, 21 rows (23 letters down to 3), no horizontal overflow at
  360 px. Pass.
- **Reload on a finished game, reduced motion, Give up (Done when 2):** reload shows the list and
  adds no celebration node in 1.5 s; reduced motion opens the sheet 824 ms after Confirm with no
  celebration; Give up of a fresh game shows "No words were played." and no celebration. Pass.
- **Console:** no errors or warnings, no page errors in any step.
- Not exercised: hiding the page and New game mid-run (covered by `e2e/celebration.spec.ts`), and
  any device; the owner's Android reads (10.6 ×6, 10.9) are the device record (epic Notes:67-75).

## Previous-retro follow-through

Previous epic: `epic-themes` (its retro, `epic-themes-retrospective.md`, Action items A1–A7).

| Item (owner) | Landed? | Evidence |
|---|---|---|
| A1 mark epic 9 done (Owner) | Yes | `5bc5d68`; `tickets.py status` epic-themes done |
| A2 epic 8 A1/A2 resolved (Owner) | Yes (resolved before this epic) | epic 9 retro, resolved 2026-10-20 |
| A3 stub budget 1500; consider capping ticket review at 4 passes when majors reach 0 (Process) | Partly: the 1500 stub budget is in the autopilot prompt (`.claude/skills/epic-autopilot/SKILL.md:269`, since `e6e1f9e`); no 4-pass cap was added (`max 7` unchanged). Epic 10's ticket reviews ran 2–7 passes; none was a stub | SKILL.md:269; digest 10.1–10.10 |
| A4 append unapplied ticket-review minors to every build prompt (Process) | Yes: the prompt carries them (`SKILL.md:295`) and the digest records them handed over in 10.2, 10.5, 10.6, 10.7, 10.8, 10.9 | digest |
| A5 unknown-stored-theme boot path covered (Dev) | Yes | `e2e/theme.spec.ts:380` `Q-36 an unknown theme value boots the default theme…` |
| A6 merge epic 9 to `main` (Owner) | Yes | `19acd17` Merge epic 9 |
| A7 budget the 48,004-byte margin (Owner) | Noted: epic 10 used about 8 kB; the build is 559,956 / 600,000 at 10.10, margin 40,044 bytes | digest 10.10 |

## Action items

| # | Action | Owner | Kind |
|---|---|---|---|
| B1 | Apply R1–R3: DESIGN.md:753 A-D12 wording; epic Notes :76 (F31 now a known issue) and :78 (sync done) | Dev | Doc fix, no decision (applied post-retro) |
| B2 | Autopilot skill: usage-limit stops write and commit the handoff JSON (L1); a dead pid file is deleted at startup (L2) | Dev | Process fix, technical (applied post-retro) |
| B3 | F6: `celebration.svelte.test.ts:823-841` closing-fade test uses `speed: 0`, not `vx: 0`, so it no longer passes through NaN | Dev, small | Remediation, test-only; proposed |
| B4 | F1 + P1: stop a live run on halt, and fail fast when a run renders with no registered elements | Dev | Remediation, low; proposed for a later sweep |
| B5 | F2: decide whether a key skip (Space/Esc) gets a short guard like F18's, so a second press cannot replay the deal or collapse the sheet | Owner | UX decision; proposed, nothing built |
| B6 | Refactor candidates D1 (shared card-face styles), D2 (one consumption tracker), D3 (celebration input gate), S1 (split the run controller), S2, D4, P3; plus A1 as a `bmad-project-context` pitfall | Dev | Deferred, for the next sweep |
| B7 | F4: a test or fix for a resize landing during the winning glide | Dev | Deferred, plausible |
| B8 | L3: a flake seen in a second ticket gets its own fix ticket at once | Owner | Process lesson |
| B9 | L4: plan a live-tunable device preview for the next motion-tuning ticket | Owner | Process lesson |

Nothing in B3–B9 is merge-blocking. The epic's Known issues (F31, bfcache rows 78/79) are recorded by
the owner and not scheduled.

## Acceptance verdict

**accepted-with-open-items** (criteria declared, epic file Done when 1–5; every ticket done,
`pending_tickets` empty).

1. Met: `android` near-won win, bounce, tap skip, expanded sheet, Words longest first with the
   duplicate and alphabetical ties: `e2e/celebration.spec.ts` R-87 rows, `e2e/end-sheet.spec.ts`
   R-88 rows, and the behavior check above.
2. Met: Give up Words section and the no-move line, no celebration; reload shows the list without
   one: R-88 and R-73 rows, behavior check.
3. Met: back, ☰/`M`, hide, resize, Undo, New game and the Redo replay per `rule-coverage.md`
   (10.7 rows); `dist-smoke` proves a hook-free win plays and is skipped (10.8,
   `e2e/pwa/dist-smoke.spec.ts`).
4. Met: `test:all` green at `d4b42a6`; `test:screens` green at 10.10 with no screen-affecting change
   since; every `rule-coverage.md` row has a passing test; no Session or history shape or version
   change.
5. Met: the docs match the build (reconciliation above; three wording leftovers R1–R3), AGENTS.md
   carries the pitfall, and the owner watched the long list on Android with A-D12 accepted
   (2026-10-24, epic Notes:75).

Open items: B3–B9, none blocking. The branch is fit to merge once the owner accepts this verdict and
the epic container is marked done.

## Open questions

- F2 / B5 (owner): should Space and Esc get a short post-skip guard (e.g. F18's 300 ms) so a double
  press cannot replay the deal from the just-opened sheet? Today's behaviour matches the spec as
  written; a guard would be new behaviour.
- F4 was found by reading code only; whether it shows on a device is unknown.
