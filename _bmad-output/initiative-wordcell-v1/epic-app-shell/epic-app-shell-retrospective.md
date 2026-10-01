---
epic: epic-app-shell
date: 2026-10-01
verdict: accepted-with-open-items
criteria: declared
headless: true
---

# Epic 3 retrospective: app shell services

## Epic summary

- **Epic:** `epic-app-shell` (epic 3, App shell services), branch `epic-3-shell`, created from `main` at 8e5462f.
- **Tickets** (`tickets.py status`, build order): 3.1 Engine carry-ins and D1 export removal, 3.2 Parse hardening and engine cleanup, 3.3 Game store load, dispatch and storage, 3.4 Primary action, New game, Replay and feedback, 3.5 Fatal surface, rejected Session and single instance, 3.6 Lifecycle and visible-time clock, 3.7 Score-history store and finish writes, 3.8 Nav adapter, overlays core, History notice and Reset confirm, 3.9 Dictionary load, retry and Validate, 3.10 Preferences and motion, 3.11 Boot order and restore boundaries, 3.12 Refactor sweep and shared Playwright config. All 12 are `status: done`, `state: done`. None is still at `built`. `pending_tickets` is empty.
- **Range:** one combined range, `8e5462f..ced8a13` (HEAD). It has 134 commits and no merges (`git_evidence.py`). The plans' baselines are, in order: 3.1 ad5ed00, 3.2 124ae04, 3.3 162af5a, 3.4 d7df29c, 3.5 0008939, 3.6 81a61e9, 3.7 6da8e6f, 3.8 a9c25cf, 3.9 43d46dc, 3.10 77844fc, 3.11 cc326d7, 3.12 f496ae4. The last range runs to HEAD. The commits after 3.12 (51e24bb, d13399b, ced8a13 and c29d109) are only skill and ticket changes. I did not attribute work per range: the commit subjects name their ticket, which is enough provenance.
- **Evidence available:**
  - the epic file;
  - all 12 plans, with their stories, `.review-log.md` files and passes;
  - the spec folder (`SPEC.md`, `rule-coverage.md`, `build-notes.md`, `SPEC.review-log.md`, `.memlog.md`);
  - the autopilot digest `_bmad-output/implementation-artifacts/autopilot/epic-app-shell-20260930-0915.md` and the handoff `epic-app-shell-handoff.md`;
  - the epic 2 retrospective;
  - the step logs in `/tmp/wordcell-autopilot/20260930-0915` and the `loop-epic-app-shell-*` folders. These are references only: I did not read them in full.
- **Evidence missing:** none blocking. Process lessons rest on the digest and plans, not on full session transcripts.
- **Biggest change by net lines:**
  - `src/shell/game.svelte.test.ts`: +1593
  - `e2e/blocking.spec.ts`: +484
  - `e2e/history-notice.spec.ts`: +355
  - `src/shell/game.svelte.ts`: +349
  - `e2e/dictionary.spec.ts`: +343

## Findings

### Owner decisions made during the epic (record and reconcile)

| # | Finding | Source | Disposition | Prevention |
|---|---|---|---|---|
| O1 | The Blocking message (fatal error, another window, rejected save) focuses its button when it appears and when its cause changes (owner, 2026-09-30). It is built and Playwright-checked. EXPERIENCE.md does not mention this focus rule. | epic Notes; `.memlog.md`; commit 9ad736e; `src/ui/BlockingMessage.svelte:34` (`focusOnCause`); EXPERIENCE.md:193-194 | Accept as built. Fix now (docs): record it in EXPERIENCE.md. | Owner UX decisions made during a ticket go into EXPERIENCE.md during the epic's close-out. |
| O2 | The History notice is not dismissed by a tap outside it. Only Not now, Reset history and back close it, and focus starts on Not now (owner, 2026-10-01). It is built. EXPERIENCE.md:152 states the scrim rule only for the Confirm dialog and has no History notice row. | epic Notes; `.memlog.md`; EXPERIENCE.md:52, :102, :152 | Accept as built. Fix now (docs): add a History notice row to EXPERIENCE.md's interaction patterns. | Same as O1. |
| O3 | Q-42 on the installed app (owner, 2026-10-01): after a 404 on the word list, Reload retries in place, the banner stays visible during the retry, and the page never reloads. | epic Notes; `.memlog.md`; `src/shell/dictionary.svelte.ts:13-19, :75-84`; `dictionary.svelte.test.ts:238, :254` | Accept as built. Fix now (docs): item 1 below. | — |
| O4 | The banner hides when that retry succeeds (owner, confirmed 2026-10-01 after 3.12). Built as `keepBanner = false` in `attempt()`'s `finally`, with `showBanner = state === 'failed' \|\| keepBanner`. Tested by `AD-8 after a 404, retry() never reloads and refetches with the banner kept shown, then ready hides it`. Recorded nowhere yet. | `src/shell/dictionary.svelte.ts:62-66, :93-95`; `dictionary.svelte.test.ts:238-250` | Accept as built. Fix now (docs): record it in the epic Notes and `.memlog.md`. | — |
| O5 | The owner confirmed all close-out recommendations (2026-10-01), including the owner-doc edits in item 1 and the spec wording fixes in item 3. | owner instruction to this run | Closeout routing below. | — |

### Owner-supplied items 1–8

| # | Finding | Source | Disposition | Route |
|---|---|---|---|---|
| 1 | Three owner docs still say that under the service worker the banner "stays until the next launch". This contradicts O3/O4. | `docs/game-flow-spec.md:473` (§9 Q-42); spine AD-8 Load bullet, lines 359-363; EXPERIENCE.md:192 (State Patterns › Dictionary failed); `rule-coverage.md:88` (Q-42 row). This is carry-forward C-OWN2. | Fix now (owner-approved spec reconciliation) | closeout-docs |
| 2 | Spine notes from `build-notes.md` (lines 6-23) and the 3.8 AD-13 stale-launch Forward-then-push edge are still unfolded. The notes are: AD-7 `activeMs` 2^52 headroom and the `checkRecord` domain; Proposed epics rows (Session-rejected message, History notice and the overlays core moved to epic 3); AD-4 `haltCause`; the AD-9/Q-38 persisted-pageshow staleness halt; AD-16/AD-9 `whenVisible`; the AD-13 reload cases restated; the AD-17 restore snapshot rule. C-SP1 (I-38) adds: stale-entry push; stored `wc` > real history; Forward overlay; a back between Delete history's two pops. | `build-notes.md` Spine notes; 3.12 plan I-38 / C-SP1; plan 8 deferred | Fix now (spine wording, no AD reopened) | closeout-docs |
| 3 | Spec wording: (a) B6 is a named test, not a command-table row (SPEC CAP-1, build-notes CAP-1); (b) only `App.svelte` reads the store (CAP-1; C-SP2 also names "main.ts reads view" and noLib); (c) the 3.3 ticket still says text-labelled Undo/Redo, but they were built as DESIGN.md icon buttons (I-10, plan 3 Residual risks); (d) the CAP-4 intent wording (C-SP2, I-76). | 3.12 plan I-10, I-58, I-76, C-SP2 | Fix now (owner-approved) | closeout-docs |
| 4 | The spec review loop diverged at pass 3 (majors 11, 7, 8). Its eight open majors were carried into tickets 1, 2, 5, 7, 9 and 11. Every ticket loop then converged, but its first pass started high: majors 6–14, in 4–7 passes; 3.12 needed all 7. The carry approach worked, but each ticket loop absorbed spec gaps at the cost of extra passes. | `.memlog.md` (Review loop event); epic Notes; digest lines 11-150 | Accept (process lesson) | later epic (epic 4 spec stage) |
| 5 | AGENTS.md is stale in four places. (a) The Known pitfalls line "type exports are unchecked": `src/architecture.test.ts:1980` now checks them with `getExportsOfModule` (C-AG1, I-55). (b) The fixtures pitfall should allow History-notice flows to seed `history-invalid-*` (C-AG2, I-56). (c) The epic 3 shell modules and their owners are not listed. (d) Item 7's notes on the Vitest cache and watch mode on /mnt/d. | 3.12 plan C-AG1, C-AG2; AGENTS.md Known pitfalls | Fix now, through `bmad-project-context`, before epic 4 | agents-md |
| 6 | Epic 7 device checks are missing: Android back closes a launch-pushed History notice (A-A11), and Playwright proof for Q-42's service-worker branch (P7, `rule-coverage.md:88`). | C-E7b; I-70 | Defer | epic-7 |
| 7 | The unit suite meets the 5 s budget only with a warm `node_modules/.vitest-cache`: 4.32 s median. A cold run (fresh `npm ci`, CI) takes 7.15–7.78 s. On drvfs (/mnt/d), Vitest watch sees no file events, and polling starved the suite. The `architecture.test.ts` watch re-run takes 1.50 s (C-AD17W). | 3.12 plan Design Notes M, Implementation Notes, Residual risks | Accept with a recorded rule (technical default; see Action items C9) | closeout-docs (AD-17 note) + agents-md (watch note) |
| 8 | Dispatch cost at 4× CPU throttling (3.4): 10.4 ms max, 1.1 ms median, under the 16 ms flag. | digest; plan 4; I-64 | Accept (informational); the real-device figure stays with C-E7a | epic-7 (existing C-E7a) |

### Carry-forward list from the 3.12 plan (17 items)

| Row | Item | Disposition | Route |
|---|---|---|---|
| C-OWN1 | Reject impossible records: a win with no word, a q without a u, more than 23 letters. | Owner decision (2026-10-01): no change in v1; keep accepting them as built; revisit when `LangData` arrives. No code change. | none (decision recorded in the epic Notes and `.memlog.md`) |
| C-OWN2 | Q-42 retry-in-place wording | Fix now = item 1 | closeout-docs |
| C-SP1 | AD-13 stale-launch edges | Fix now = item 2 | closeout-docs |
| C-SP2 | SPEC/build-notes CAP-1 and CAP-4 wording | Fix now = item 3 | closeout-docs |
| C-SP3 | `rule-coverage.md` R-84 says "init script"; it should say "armStorageSpy after boot" | Fix now (wording only, no id or CAP change) | closeout-docs |
| C-SP4 | AD-15 says a font timeout throws "like AD-8", but AD-8 maps a timeout to `failed` | Fix now (spine bug, wording): AD-15's font timeout is fatal by its own rule. Drop "like AD-8". | closeout-docs |
| C-SP5 | Scaffold deltas: the `tsconfig.e2e` glob must add `playwright.base.ts`. build-notes CAP-11 departure: `use` narrowed to `trace`, and screens keeps `retries: 0`. | Fix now (wording) | closeout-docs |
| C-AG1 | AGENTS.md: `architecture.test.ts` checks type exports | Fix now = item 5 | agents-md |
| C-AG2 | AGENTS.md: History-notice flows may seed `history-invalid-*` | Fix now = item 5 | agents-md |
| C-UI1 | Dialog and BlockingMessage share card styles | Defer | epic-5 |
| C-AD17W | `architecture.test.ts` watch re-run > 1 s (informational) | Accept; recorded in the AD-17 note (C9) | closeout-docs |
| C-E4a | Board letters are asserted only by screenshots; add DOM assertions | Defer | epic-4 |
| C-E4b | Gesture cancel on hide (`registerBeforeHide` has no registrant) | Defer; widened by R2 | epic-4 |
| C-E6 | I-68: Playwright proof for Q-29 Replay; statistics notice P4–6; Replay calls `resetForNewSession`; Escape invert; the win smoke test should discriminate | Defer | epic-6 |
| C-E7a | E8 dispatch figure on a real device | Defer | epic-7 |
| C-E7b | A-A11 back device check; 250 ms rewind; Q-42 service-worker Playwright test (P7) | Defer = item 6 | epic-7 |
| C-E56 | Stylesheets should consume `--wc-base-ms` / `--wc-reduced` | Defer | epics 5/6 |

### Other spine and doc notes found in the evidence

| # | Finding | Source | Disposition | Route |
|---|---|---|---|---|
| S1 | AD-15 calls the Blocking message's Reload the primary button. DESIGN.md Buttons lists `Reload` as secondary, which reads as the banner's Reload. As built, the Blocking button is `.primary`. | `build-notes.md:22`; `src/ui/BlockingMessage.svelte:34`; DESIGN.md:570, :593 | Accept as built (owner, 2026-10-01). Fix now (docs): DESIGN.md Buttons and Blocking message make the Blocking message's single button primary and the secondary `Reload` the banner's; the build-notes note is folded into AD-15. Applied at close-out. | closeout-docs (applied) |
| S2 | AD-9/AD-17: the gesture-cancel half of the hide assertion lands with the pointer controller. The literal plain-overlay wording and the win → New game → back case are re-proven in epics 4/6. | `build-notes.md:14-17` | Defer | epic-4, epic-6 |
| S3 | The 3.12 Seam P finding: under Vitest, `.svelte.ts` stores compile for the server, so `$derived` re-derives on every read and `game.view` identity can't be observed. | 3.12 Implementation Notes ("Seam P deviation") | Fix now (pitfall) | agents-md |

### Aggregate views

- **Architecture delta.**
  - `src/architecture.test.ts` (the AD-1 layer scan) passes on HEAD: 1664 tests green in the subagent's run.
  - The single owners hold, checked by grep over `src/**`:
    - `localStorage` appears only in `storage.ts`;
    - `visibilitychange`, `pagehide` and `pageshow` only in `game.svelte.ts`;
    - `popstate` and the History API only in `nav.ts`;
    - `console.error` only in `main.ts` `fatal()`;
    - `apply`, `accrue` and `createSession` only in `game.svelte.ts`.
  - The game, history and prefs stores import each other in a cycle. It is safe: no module reads another at top level.
  - Clean.
- **Golden deal.** `src/engine/deal.ts` and `deal.test.ts` changed in comments and one test title only (`AD-2` → `AD-5`). The R-02 literals are unchanged (`git diff 8e5462f HEAD -- src/engine/deal*`). Clean.
- **God-class / size growth.**
  - `src/shell/game.svelte.ts` is 349 lines. It carries about eight concerns: state, load, dispatch, New game/Replay, halt, lifecycle and hide flush, the staleness checks, and the test seams. AD-9 requires the lifecycle listeners to live there. Disposition: watch, no split.
  - The real hotspot is `src/shell/game.svelte.test.ts`, at 1593 lines. It also holds the 26 `history.svelte.ts` cases, because that store has no test file of its own: a departure from "unit tests beside the file" (R7).
- **Duplication map:** R4, R5 and R6 below. The 3.12 sweep already folded the e2e helper copies (I-35, I-51 to I-53, I-62).
- **Pattern divergence:** R2 (cancel()-first is not yet wired) and R7 (no test file beside its module).
- **Spec-to-implementation reconciliation:** items 1–3, O1, O2, O4, S1 and C-SP3 to C-SP5. Every divergence found is a doc lagging the as-built or an owner decision. None is a code defect. All were reconciled at close-out (521b5dc; S1 on 2026-10-01 after the owner's answer).

### Diff-scope review (cross-ticket boundaries)

I ran these lenses inline through one general-purpose subagent over `8e5462f..HEAD`, weighted to the boundaries between tickets: adversarial, edge-case and verification-gap. This is a narrowing: `bmad-review` was not invoked, because every ticket already ran its own multi-lens review loop. The subagent dropped items already on the 3.12 carry-forward list. I re-checked R1, R3 and R7 against the code.

| # | Sev. | Finding | Source | Disposition | Route |
|---|---|---|---|---|---|
| R1 | medium | `nav.register()` throws on a second call, and `main.ts` registers once, before the font check, with only `closedByBack` and `depth`. AD-9/AD-13/AD-16 want the pointer controller, which is created after the Session load, to register its `cancel` as the before-back hook. Epic 4 has no seam for it without breaking the AD-16 order. | `src/shell/nav.ts:112-117`; `src/main.ts:99-105`; plan 8 deferred ("add the before-back hook") | Defer, with a fixed default: epic 4 adds a separate `nav` registration for the before-back hook, called after the controller exists, and records it in AD-13. | epic-4 |
| R2 | low | AGENTS.md says every Undo, Redo, menu, key command, back and the hide flush calls `cancel()` first. Nothing calls it yet: `App.svelte` undo/redo, the HistoryNotice/Dialog actions, and `registerBeforeHide` (`game.svelte.ts:239`) has no caller. C-E4b tracks only the hide case. | `src/ui/App.svelte`; `src/shell/game.svelte.ts:239` | Defer (no pointer controller exists yet) | epic-4 |
| R3 | low | A fatal raised during `await nav.launch()` or the font check doesn't stop `boot()`. `prefs.load()` and `game.load()` still run. They write nothing because the store is halted, and `main.ts:107` then shows the standalone surface. A later fatal (such as the 30 s font timeout) replaces the first fatal's surface text, as AD-15 specifies (`game.svelte.ts:214-221`). `console.error` reports both. | `src/main.ts:95-113`; `src/shell/game.svelte.ts:214-221` | Accept as specified. Note it in the AD-15 spine fold so later readers don't re-flag it. | closeout-docs |
| R4 | low | The New game sequence exists only in `App.svelte:39-44`: `wasRejected` → `game.newGame()` → `overlays.resetForNewSession()` → `openHistoryNotice()`. Epic 6's end sheet, menu and confirm dialog need the same sequence. | `src/ui/App.svelte:39-44` | Defer: epic 6 moves it into one UI-layer function before adding a second entry point. | epic-6 |
| R5 | low | One dispatch replays the game several times: `view()` twice to compare finished state, two records in `reconcileHistory`, then the derived `view` and `recorded`. A dispatch that only accrues time still calls `reconcile`. | `src/shell/game.svelte.ts:157-162`; `src/shell/history.svelte.ts` | Defer. The cost is measured under 16 ms (item 8); revisit only if the C-E7a device figure flags it. | epic-7 |
| R6 | low | The three storage owners repeat the same `rejectReason` body, the launch-text/`isStale()`/`loaded()` pattern and the halted/booting guard. The prefs reject-reason type is written out by hand instead of derived. | `src/shell/game.svelte.ts:99`; `src/shell/history.svelte.ts:58, :110`; `src/shell/prefs.svelte.ts:187, :231` | Defer to epic 4's refactor sweep (shared shell helper, no behaviour change) | epic-4 |
| R7 | low | `history.svelte.ts` has no `history.svelte.test.ts`. Its cases sit in the 1593-line `game.svelte.test.ts`, with no recorded reason for the departure. | `ls src/shell/history*.test.ts` (none) | Defer to epic 4's refactor sweep: move them, keeping the test names | epic-4 |

Checked and clean (subagent, confirmed where cited):
- the history-before-Session write order and Q-39 rollback;
- no write from the hide flush while halted or rejected;
- the persisted-pageshow staleness check across all three keys;
- a fatal outranks another-window;
- the boot order steps epic 3 owns, matching AD-16;
- the font-timeout guard;
- the nav push/pop queue and Forward correction;
- dictionary `retry()` only from `failed`;
- catalogue strings only in `text.ts`;
- shell test isolation.

### Process findings

| # | Finding | Source | Disposition | Route |
|---|---|---|---|---|
| P1 | Epic 2 retro B10, second half ("keep autopilot step logs in a git-ignored repo folder"), did not land. Step logs live in `/tmp/wordcell-autopilot/`, which a reboot or tmp cleanup can erase before a retro reads them. | digest line 7; `.gitignore` has no autopilot entry | Fix (technical default): epic-autopilot writes step logs to a git-ignored repo folder, e.g. `.autopilot/`. | epic-4 (before its autopilot run) |
| P2 | Twice a usage limit stopped a ticket's review loop mid-pass (3.3, 3.8). Both resumed cleanly from the committed partial log (d13399b then moved the driver to one ticket per session). | digest lines 31-34, 96-99 | Accept (worked as designed) | none |
| P3 | A fix arriving as an owner decision mid-ticket (O1–O3) was recorded in the epic Notes and memlog every time, but never reached the owner UX docs. That is why O1, O2 and item 1 pile up at close-out. | epic Notes; EXPERIENCE.md | Lesson: the autopilot's mark-done step lists the owner docs a decision touches as close-out actions. | later epic (epic-autopilot skill, before epic 4) |

## Behavior verification

- On HEAD (ced8a13; only skills and ticket docs changed since the 3.12 verification), I ran `npx playwright test e2e/restore.spec.ts e2e/game-store.spec.ts e2e/blocking.spec.ts e2e/history.spec.ts e2e/dictionary.spec.ts --project android`. Result: **79 passed** (35.8 s).
  - This covers Done when 2: the restore suite after hidden-then-reload and after a plain reload, plus the R-73 renderer-crash kill variant at `game-store.spec.ts:200`.
  - It covers Done when 3's rejected-Session surface.
  - It covers Done when 4's history writes.
  - It covers the Q-42 retry paths.
- The subagent's `npm test` run: 34 files, 1664 tests passed, 4.64 s.
- The 3.12 orchestrator verification is on record: `test:all` and `test:screens` green; no snapshot changed.
- Not exercised: the live deployed site (Done when 6, which waits on the owner's merge and deploy), and the service-worker-controlled Q-42 branch in a real browser (P7, epic 7).

## Previous-retro follow-through

Source: `_bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine-retrospective.md`, Action items B1–B11.

| Item | Owner | Landed? | Evidence |
|---|---|---|---|
| B1: (UI) tags on R-50 and R-83; §9 heading includes Q-44 | Close-out Task 3a | Yes | `docs/game-flow-spec.md:11` (tags R-50/R-83 UI), `:428` heading "Q-01 … Q-44" |
| B2: spine AD-2, AD-6 (Q-44), AD-7, AD-17, Scaffold deltas | bmad-architecture | Yes | commit bbdcaae; spine line 37 "Amended 2026-09-30 (epic 2 retrospective B2…)" |
| B3: AGENTS.md stale sentences and new pitfalls | bmad-project-context | Yes | AGENTS.md Known pitfalls: EngineError codes, D2 seam, `*-invalid-*` fixtures, `expectEngineError` per file, `parseHistory` `.history` |
| B4: skill notes 1, 3, 4, 6 applied to epic-autopilot and review-loop | Task 3c | Yes | commit f606309 |
| B5: mark epics 1 and 2 done | Task 3d | Yes | commit 8e5462f; `tickets.py status` epics `done` |
| B6: `addFreeLetter` with `index: undefined` | Dev, epic 3 | Yes | `src/engine/commands.test.ts:1087` (a named test, see item 3a) |
| B7: test gaps, including type-level exactness of `index.ts` | Dev, epic 3 | Yes | ticket 3.1 plan; `src/architecture.test.ts:1980` `getExportsOfModule` |
| B8: storage hardening (activeMs headroom, `checkRecord` domain, `longestWord` sharing) | Epic 3 spec | Yes | SPEC E4/E5; `build-notes.md:8-11`; ticket 3.2 |
| B9: duplication cleanup; dispatch replay cost | Dev, epics 3 and 7 | Partly | 3.2 parse cleanup and 3.4 measurement (10.4 ms max at 4×); the device figure is C-E7a (epic 7) |
| B10: inception carries interface/tests/owns; step logs in a git-ignored repo folder | Owner | Partly | First half: epic Notes ("each entry carries `interface`, `tests` and `owns`"). Second half not landed: logs are in `/tmp/wordcell-autopilot/` (P1) |
| B11: shared Playwright config base | Dev, epic 3 | Yes | `playwright.base.ts`; 3.12 plan I-60 |

## Action items

This run applied none of them. Close-out status (2026-10-01): C1–C10 were applied in commit 521b5dc and G1–G5 in commit 1e57edb (AGENTS.md refresh through `bmad-project-context`); the owner's answers to the Open questions were applied afterwards (S1: DESIGN.md and the AD-15 fold; C-OWN1: decision recorded, no code change). The later-epic items stay routed. Owner approval is noted where it exists.

### Close-out docs (owner-approved, or a technical default where marked)

| # | Action | From |
|---|---|---|
| C1 | `docs/game-flow-spec.md` §9 Q-42 (line 473), answer column: replace "under the service worker the banner stays until the next launch" with "under a controlling service worker, Reload retries the download in place with the banner kept visible during the retry, never reloads the page, and the banner hides when the retry succeeds (owner, 2026-10-01)". | item 1, O3, O4 (owner-approved) |
| C2 | Spine AD-8 Load bullet (ARCHITECTURE-SPINE.md lines 359-363): the same change. `retry()` on a service-worker-controlled page after a 404 refetches in place with the banner kept shown (`keepBanner`), never calls `location.reload()`, and hides the banner on success. | item 1 (owner-approved) |
| C3 | EXPERIENCE.md State Patterns › Dictionary failed (line 192): replace the last clause with the same rule, noting that this path keeps the banner shown (unlike the normal retry, which hides it while running). | item 1 (owner-approved) |
| C4 | `rule-coverage.md` Q-42 row (line 88): the sentence becomes "after a 404 the banner's next Reload reloads the page; under SW it retries in place with the banner kept, hidden on success". Kind stays P3 + P7. | item 1 |
| C5 | Epic file Notes and spec `.memlog.md`: add "Decision: owner, 2026-10-01 (confirmed after 3.12): under a controlling SW, the banner hides when the in-place retry after a 404 succeeds (as built: `dictionary.svelte.ts` `keepBanner` reset in `attempt()`'s `finally`)." | O4 |
| C6 | Spine: fold the build-notes Spine notes. AD-7: `activeMs` 0…2^52 and the `checkRecord` domain (E4, E5). Proposed epics: rows 3/4/6 for the Session-rejected message, History notice, Reset confirm and overlays core. AD-4: `haltCause`. AD-9/Q-38: persisted-pageshow `isStale()` halt. AD-16/AD-9: `whenVisible()` after the double rAF. AD-13: reload cases restated. AD-17: restore snapshot rule. Also fold the AD-13 edges from C-SP1: stale-entry push, stored `wc` > real history, the Forward-then-push correction, and a back between Delete history's two pops. Mark each note folded in `build-notes.md`. No AD is reopened. | item 2 (owner-approved), C-SP1 |
| C7 | SPEC.md CAP-1 and `build-notes.md` CAP-1: B6 is a named test (`R-33 addFreeLetter with index: undefined…`), not a command-table row. Only `App.svelte` reads the store (main.ts doesn't read the view). Add the noLib note. Fix the CAP-4 intent wording (C-SP2). Ticket 3.3's story file: note that Undo/Redo were built as DESIGN.md icon buttons (SPEC E1). | item 3 (owner-approved) |
| C8 | `rule-coverage.md` R-84 row: "init script" → "armStorageSpy after boot" (C-SP3). Spine AD-15: drop "like AD-8" from the font-timeout sentence, because the font timeout is fatal and AD-8's timeout is `failed` (C-SP4). Spine Scaffold deltas: the `tsconfig.e2e` include adds `playwright.base.ts`; `build-notes.md` CAP-11 records `use` narrowed to `trace` and screens keeping `retries: 0` (C-SP5). Spine AD-15: add a note that a later fatal replaces an earlier fatal's surface text and `boot()` keeps going (it writes nothing) (R3). | technical defaults |
| C9 | Spine AD-17 budget note (item 7, C-AD17W): the 5 s figure is the median of three `npm test` runs after a discarded warm-up, on the dev machine, with `fsModuleCache` warm. A cold first run (7.2–7.8 s) and CI are outside the budget. The 1 s watch gate applies to the slowest engine file. `architecture.test.ts` (1.5 s) is informational. Re-measure at each epic's refactor sweep. If the warm median exceeds 5 s, the next lever is splitting `architecture.test.ts` with its exemption. | item 7 (technical default) |
| C10 | EXPERIENCE.md Interaction patterns: add a History notice row: "Focus starts on Not now; back acts as Not now; a scrim tap does nothing (owner, 2026-10-01)". Add to the Blocking message rows (lines 193-194, and the §2 rejected row) or to Interaction patterns: "keyboard focus moves to its one button when it appears and when its cause changes (owner, 2026-09-30)". | O1, O2 (owner-confirmed decisions) |

### AGENTS.md (through `bmad-project-context`, before epic 4)

| # | Action | From |
|---|---|---|
| G1 | Known pitfalls, D2 seam line: replace "(`index.test.ts` pins the runtime keys only; type exports are unchecked)" with "`index.test.ts` pins the runtime keys; `src/architecture.test.ts` checks every export, types included, against AD-2's list with the compiler API". | C-AG1, item 5 |
| G2 | Known pitfalls, fixtures line: allow History-notice flows (a notice test that needs an unreadable history) to seed `history-invalid-*` besides §2 rejection tests. | C-AG2, item 5 |
| G3 | Where things are: list the epic 3 shell modules and what each owns. `game.svelte.ts`: the store, lifecycle, hide flush, halt and `haltCause`. `history.svelte.ts`: `reconcile`/`reset`. `prefs.svelte.ts`. `dictionary.svelte.ts`. `nav.ts`. `storage.ts`. `seed.ts`. `clock.ts`. `test-hook.ts`, whose type is also declared in `e2e/globals.d.ts`: change both together. Plus `src/ui/overlays.svelte.ts`. | item 5 |
| G4 | Running and verifying: the unit-suite budget is the warm-cache median (`node_modules/.vitest-cache`, `fsModuleCache`); a cold run is slower and not budgeted. On the /mnt/d drvfs checkout `npm run test:watch` gets no file events, and polling starves the suite: re-run `npm test`, or use a checkout on the Linux filesystem for watch. | item 7 |
| G5 | Known pitfalls: under Vitest, `*.svelte.ts` stores compile for the server, so `$derived` re-derives on every read. Assert the reference of the underlying `$state`, never the identity of a derived getter. | S3 |

### Later epics

| Epic | Action | From |
|---|---|---|
| epic-4 | Add a before-back hook registration to `nav`, separate from `register()` and callable after the pointer controller exists. Record it in AD-13. | R1 |
| epic-4 | Wire the pointer controller's `cancel()` first into Undo, Redo, every dialog and notice action, the menu, key commands, back (R1's hook) and `registerBeforeHide` (the hide flush). Add the AD-17 gesture-cancel hide assertion. | R2, C-E4b, S2 |
| epic-4 | Assert board letters in the DOM, not only by screenshot. | C-E4a |
| epic-4 | Refactor sweep: move the `history.svelte.ts` cases into `src/shell/history.svelte.test.ts` with their names unchanged. Fold the repeated `rejectReason`, launch-text/`isStale()`/`loaded()` and halted/booting guard of the three storage owners into one shell helper, with no behaviour change. | R6, R7 |
| epic-4 | Spec stage: if the spec review loop's major count rises from one pass to the next, stop and split or re-scope the spec before inception, rather than carrying open majors into tickets. Record the carried majors per ticket as epic 3 did. | item 4 |
| epic-4 | Before the epic 4 autopilot run, epic-autopilot (1) writes step logs to a git-ignored repo folder (e.g. `.autopilot/`, added to `.gitignore`) instead of `/tmp`, and (2) lists, at mark-done, the owner docs touched by any owner decision as close-out actions. | P1, P3, B10 |
| epic-5 | Share the Dialog and BlockingMessage card styles (a new UI module or global class). | C-UI1 |
| epic-5/6 | Stylesheets consume `--wc-base-ms` / `--wc-reduced`. | C-E56 |
| epic-6 | Move the New game sequence (`wasRejected` → `newGame()` → `resetForNewSession()` → `openHistoryNotice()`) into one UI-layer function before the end sheet, menu or confirm adds a second entry point. | R4 |
| epic-6 | I-68: Playwright proof for Q-29 Replay; statistics notice P4–6; Replay calls `resetForNewSession`; Escape invert; win smoke discrimination. Re-prove the AD-13 literal plain-overlay wording and the win → New game → back case. | C-E6, S2 |
| epic-7 | Device checks: Android back closes a launch-pushed History notice (A-A11); the 250 ms rewind; the E8 dispatch figure on a real device. If it flags, also look at the replay count per dispatch. | item 6, C-E7a, C-E7b, R5 |
| epic-7 | Playwright proof for Q-42's service-worker-controlled branch (P7): retry in place, banner kept, hidden on success. | item 6, C-E7b, O4 |

## Acceptance verdict

**accepted-with-open-items** (criteria declared in the epic file's Done when).

1. `npm run test:all` was green at the 3.12 verification (plan, both orchestrator notes). Every P3 row has a passing `android` test named with its id: this rests on the 3.11/3.12 plans' sentence → test maps, and I did not re-derive it. **Met.**
2. The restore suite and the renderer-crash kill variant pass (79 passed on HEAD, this run). **Met.**
3. The Session-rejected flow is covered by `fixtures/session-invalid-version-unknown.json` (`"version":3`) and blocking.spec, and passed in this run. **Met.**
4. The Q-39 history-first write and rollback are covered by `game.svelte.test.ts:1384-1437` and `e2e/history.spec.ts`. **Met.**
5. Exact exports are checked by `src/architecture.test.ts:1980`. The R-02 golden literals are unchanged (`git diff 8e5462f HEAD -- src/engine/deal*`: comments and one title only). **Met.**
6. The live-site check runs only after the owner merges and deploys. **Open:** not yet possible, so not met. It is the epic's open item, with no blocking findings.

All 12 tickets are done. No blocking finding is open. Open items: Done when 6 and the routed later-epic work. Close-out docs C1–C10 (521b5dc), AGENTS.md G1–G5 (1e57edb) and the two owner questions (2026-10-01) are applied.

## Open questions

- **C-OWN1:** should the history parser reject impossible records (a won record with no word, a q without a u, more than 23 letters)? This changes which stored histories are treated as unreadable. Proposed default: no change in v1. Keep accepting them as built, and revisit with `LangData`. **Answered (owner, 2026-10-01): the proposed default.** No code change; recorded in the epic Notes and the spec `.memlog.md`.
- **S1:** DESIGN.md Buttons lists `Reload` as a secondary button, while AD-15 and the build make the Blocking message's Reload primary. Proposed default: keep as built. DESIGN.md clarifies that the secondary `Reload` is the dictionary banner's, and that the Blocking message's single button is primary. **Answered (owner, 2026-10-01): the proposed default.** Applied: DESIGN.md Buttons and Blocking message; the `build-notes.md` AD-15/DESIGN.md spine note folded into AD-15 and marked folded; recorded in the epic Notes and the spec `.memlog.md`.

## Assumptions

- The epic resolved from the folder argument `_bmad-output/initiative-wordcell-v1/epic-app-shell` via `tickets.py status <folder>`. `pending_tickets` was empty.
- Headless: no team discussion, and no going-in concerns beyond the orchestrator's supplied items. Every owner-supplied item 1–8 and every 3.12 carry-forward row got a disposition and an action. The owner decisions O1–O5 are taken as stated in the invocation (owner-confirmed).
- The machine verdict is **accepted-with-open-items**, rendered with no human decision. Done when 6 is open only because the merge and deploy are the owner's later step.
- The diff-scope review ran through one general-purpose subagent instead of `bmad-review` (narrowing recorded above). Its findings were re-checked in the code before routing. Per-ticket diff ranges were not split; one combined range was used.
- Item 7: the technical default (C9, G4) keeps the budget as the warm median and makes no CI or pool change. Reason: `fsModuleCache` met the budget as the ticket defined it; cold and CI time are not a budgeted constraint; and the remaining levers (`isolate: false`, pool change, splitting `architecture.test.ts`) cost scan or isolation guarantees for no current need.
- Technical defaults applied without the owner: C4, C8, C9, G3–G5, R1–R7 routing, P1 and P3. Owner input was needed only for C-OWN1 and S1 (Open questions); the owner accepted both proposed defaults on 2026-10-01.
- This run wrote only this document and the orchestrator's result JSON. No status was changed and no tree file was edited.
- Close-out (2026-10-01, after this run): the owner accepted every proposed default; C1–C10 landed in commit 521b5dc, G1–G5 in commit 1e57edb, and the S1 and C-OWN1 answers in the DESIGN.md, spine AD-15, `build-notes.md`, `.memlog.md` and epic Notes edits that followed.
