---
title: 'Nav adapter, overlays core, History notice and Reset confirm'
type: 'feature'
ticket: '8'
created: '2026-10-01'
status: done
baseline_revision: 'a9c25cf337cdb515237e0d6ac774ef0165c36a24'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-app-shell/story-nav-adapter-overlays-core-history-notice-and-reset-confirm.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md'
warnings: [oversized]
deferred:
  - summary: >-
      A-A11 epic 7 device check: Android back closes a launch-pushed History notice (and the Reset confirm above it); Playwright goBack is not that evidence.
    evidence: |-
      Ticket Owns line and Notes open question; spine A-A11. A non-native dialog is used because a native modal <dialog> may take Android back as its own close request (unverified).
    location: epic 7 device checks
    severity: medium
  - summary: >-
      For the next bmad-project-context refresh: History-notice flows (and the win smoke) are §2 rejection flows and may seed history-invalid-* fixtures, widening the AGENTS.md fixtures pitfall.
    evidence: |-
      Ticket Description; e2e/history-notice.spec.ts and e2e/nav.spec.ts seed history-invalid-* in AD-13-named tests.
    location: AGENTS.md Known pitfalls (managed block)
    severity: low
  - summary: >-
      Spine note AD-13 before epics 4/6: a push made while on an ignored stale-launch entry stacks above it, so the next back lands on the stale entry and is swallowed once.
    evidence: |-
      Review log pass 6 unapplied minor; unreachable in epic 3 (no overlay can open after reload once the history is readable).
    location: ARCHITECTURE-SPINE.md AD-13
    severity: low
  - summary: >-
      Epic 6: Replay this deal must call overlays.resetForNewSession() first, like New game; epics 4/6 extend resetForNewSession (end sheet, selections) and add the before-back hook after the Forward decision.
    evidence: |-
      Review log pass 5/6 unapplied minors; SPEC E3; spine AD-13.
    location: src/ui/overlays.svelte.ts, src/shell/nav.ts (epics 4, 6)
    severity: low
  - summary: >-
      Entry 10: add "nav.launch() awaited before the font check" and "openHistoryNotice() after game.registerLifecycle() and before mount (AD-16)" as AD-16 boot-order cases.
    evidence: |-
      Review log pass 5 unapplied minor; rule-coverage row 103 belongs to entries 8 and 10.
    location: entry 10 (boot and restore suite)
    severity: low
  - summary: >-
      Epic 6: the Reset confirm's Escape test (e2e/history-notice.spec.ts, "Escape leaves it open at wc 2 (interim)") must be inverted when the keyboard map lands (EXPERIENCE.md Confirm dialog: Esc dismisses).
    evidence: |-
      Review pass 2026-10-01 (blind hunter); the interim behaviour is recorded only in Boundaries and Design Notes.
    location: e2e/history-notice.spec.ts
    severity: low
  - summary: >-
      Epic 7 device check: the AD-13 250 ms launch-rewind budget holds on a cold low-end Android reload (a slow go(-d) would be an AD-15 fatal).
    evidence: |-
      Unverified (maybe-false); 250 ms is prescribed by spine AD-13; settle with a device reload while an overlay entry is open.
    location: src/shell/nav.ts launch()
    severity: medium (unverified)
  - summary: >-
      Spine AD-13: if a restored entry's stored wc exceeds the real back history, go(-d) is a no-op and every reload would be fatal (no recovery path).
    evidence: |-
      Unverified (maybe-false); settle by checking whether Chrome can restore an entry's state without its earlier same-document entries (tab duplication, session restore). The rewind and its timeout are spine-prescribed.
    location: src/shell/nav.ts launch()
    severity: high (unverified)
---

<intent-contract>

## Intent

**Problem:** Back has no adapter, overlays have no owner, and an unreadable score history is silently kept with no way for the player to see or reset it (§2, Q-33, AD-13, SPEC CAP-7).

**Approach:** Add `src/shell/nav.ts` (the only History API / `popstate` user, AD-13) and the `src/ui/overlays.svelte.ts` core (E3), a non-native `Dialog` component, the History notice with its Reset confirm, and wire launch/registration/notice into `main.ts` boot (AD-16) and `resetForNewSession()` plus the deferred notice into App's New game handler.

## Boundaries & Constraints

**Always:**
- AD-13 as written; the ticket's Decisions and Tests lines; owner decision 2026-10-01: the History notice is NOT dismissed by a tap outside it (its scrim consumes the tap); only Not now, Reset history (opens the confirm) or back close it; focus starts on Not now. The Reset confirm: focus on Keep it; scrim tap acts as Keep it via `overlays.close`.
- nav keeps `count` = wc of the current entry as nav knows it: set to `state.wc` on every current-launch `popstate` with a numeric wc (own pop settle, Forward, back); +1 per push sent; each push is `{ wc: count + 1, launch }` (review-log Result open major — resolves it).
- Rule 6: misuse throws (`open` on an open id, `close` of a non-top id incl. empty stack, back before `register()`, `register()` twice or before launch resolves, `push`/`pop` before `register()`, `launch()` twice). Error texts start with the AD id.
- Every catalogue string in `src/ui/text.ts`; test names per AGENTS.md (P3 `§2`/`AD-13`/`AD-15`; S and U `AD-13`).
- Delete history: `scoreHistory.reset()` first, then `overlays.close('resetConfirm')`, then `overlays.close('historyNotice')`.

**Never:** `showModal()`/native `<dialog>`; a History API call, `popstate` literal or `history` binding outside `nav.ts`; nav importing `src/ui/`; Esc handling (Esc does nothing on either dialog until epic 6's keyboard map, which will close them via `overlays.close`); before-back hook stub; engine changes; new `data-testid`s; touching end sheet/selection (epics 4/6).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Launch, no entry | `history.state` null or wc 0 | `replaceState({ wc: 0, launch })`, resolves | — |
| Launch rewind | state wc `d > 0` | `history.go(-d)`; first popstate (exempt from stale check) → `replaceState({ wc: 0, launch })`, resolve, queue starts | none within 250 ms (`setTimeout`) → `launch()` rejects (boot's await → unhandledrejection → AD-15); later popstates ignored |
| Own pop / Forward correction settles | pending > 0 | pending−1, count := wc (current launch), drain queue; no close callback | — |
| Stale launch | `state.launch` ≠ launch id | nothing: no close, no `back()`, count unchanged | ignored even before `register()` |
| Missing wc | current launch, wc not a number | ignored | — |
| Back | current launch, `d ≤ depth()` | count := d, `closedByBack(d)` | before `register()` → throw |
| Forward | current launch, `d > depth()` | count := d, pending+1, `go(-(d − depth()))`, close nothing | — |
| Queue | push/pop while pending > 0 | sent after the settling popstate, in order; two queued pushes → consecutive wc | — |

</intent-contract>

## Code Map

- `src/main.ts` -- `boot()`: add `await nav.launch()` first, then at once `nav.register({ closedByBack: (d) => overlays.closedByBack(d), depth: () => overlays.depth })`, then `fontCheck()`… ; after `game.registerLifecycle()` and before `mount(App)` call `openHistoryNotice()`. The `void boot()` rejection already reaches AD-15 via `unhandledrejection`.
- `src/ui/App.svelte` -- `newGame()` handles both roots; `main` is the board element; dialogs go as a sibling of `<main>` inside the `active` branch (so a halted/rejected root renders no dialog and nothing inert). Follow its biome-ignore import pattern.
- `src/ui/BlockingMessage.svelte` -- style reference (card, title/body typography, `$props.id()` ids, `{@attach}` focus). Do not change.
- `src/ui/text.ts` -- frozen catalogue; add strings here.
- `src/shell/history.svelte.ts` -- `scoreHistory.state` (`ok` | `unreadable` + `reason: HistoryRejectReason`), `reset()` (throws while halted/booting). Do not change.
- `src/shell/game.svelte.ts` -- `game.state.kind`; `newGame()` unchanged (shell never imports ui).
- `src/shell/seed.ts` -- `newSeed()` (crypto uint32): reuse as the launch id.
- `src/architecture.test.ts` -- AD-1 scans (History API regex, `popstate`, `history` bindings) exempt only `src/shell/nav.ts` and shell/ui tests; run it.
- `src/shell/game.svelte.test.ts` lines ~100–125 -- pattern for `vi.stubGlobal` + `vi.resetModules` + dynamic import of a module with top-level state.
- `e2e/history.spec.ts` -- `expectFatal`, `stored`, `open` helpers; §2 unreadable test at the end (update); add the halt test here.
- `e2e/helpers/seed.ts` (`seedStorage`, `fixture`), `e2e/helpers/storage-spy.ts` (`armStorageSpy` with `throwOn`).
- Fixtures (exist): `history-invalid-version-unknown.json` (v2), `history-invalid-null.json`, `history-invalid-won-negative.json` (contents, v1), `session-place.json` (Undo enabled), `session-won.json`, `session-invalid-version-unknown.json`.

## Tasks & Acceptance

**Execution:**
- [x] `src/shell/nav.ts` -- new: `launch(): Promise<void>`, `register({ closedByBack, depth })`, `push()`, `pop()`, one `popstate` listener added in `launch()`; handler order per Design Notes 1 -- AD-13 adapter.
- [x] `src/shell/nav.test.ts` -- S cases on a stubbed `window`/`history` (records calls; test fires `popstate` by hand) and fake timers: every ticket S line plus: after a Forward correction `push()` sends `{ wc: depth + 1 }`; pop from wc 2 then two queued pushes send wc 2 then 3; stale popstate before `register()` ignored, current-launch one throws; popstates after a rejected launch ignored -- AD-13 coverage.
- [x] `src/ui/overlays.svelte.ts` -- new store per Design Notes 2 -- E3 single owner.
- [x] `src/ui/overlays.svelte.test.ts` -- U with `vi.mock('../shell/nav')`: ticket U lines; close on empty stack throws; one `closedByBack(d)` closes every entry deeper than d (topmost-first has no per-entry observable effect in epic 3) and no nav calls -- AD-13.
- [x] `src/ui/history-notice.svelte.ts` -- new: `openHistoryNotice()` + captured `noticeReason` (Design Notes 3).
- [x] `src/ui/text.ts` (+ `src/ui/text.test.ts`) -- strings per Design Notes 4; U: `historyVersionUnknown(7)` and `historyContentsUnreadable(7)` contain 7 -- catalogue.
- [x] `src/ui/Dialog.svelte` -- new non-native dialog (Design Notes 5).
- [x] `src/ui/HistoryNotice.svelte` -- new: notice Dialog + Reset confirm Dialog (Design Notes 6).
- [x] `src/ui/App.svelte` -- render `HistoryNotice` beside `<main>`; `<main inert={…}>` while the notice is rendered; `newGame()` = `const wasRejected = game.state.kind === 'rejected'; game.newGame(); overlays.resetForNewSession(); if (wasRejected) openHistoryNotice();`.
- [x] `src/main.ts` -- boot wiring per Code Map.
- [x] `e2e/history-notice.spec.ts` -- §2 variants and dialog flows (Design Notes 7).
- [x] `e2e/nav.spec.ts` -- Forward (depth 0 and depth 1), stale launch, reload cases, deferred push, win smoke (Design Notes 7).
- [x] `e2e/history.spec.ts` -- §2 unreadable test: click Not now and `expect.poll` wc 0 before its first Undo; add the `AD-15` halt-over-dialogs test.

**Acceptance Criteria:**
- Given `history-invalid-version-unknown.json` seeded on android, when the app boots, then the notice (title, version-2 body, Not now focused, Reset history) is shown at `history.state` `{ wc: 1, launch }`, and Not now or back closes it to wc 0 with `wordcell:history` bytes unchanged.
- Given notice and confirm open, when Delete history is pressed, then `wordcell:history` is `{"version":1,"records":[]}`, both close, wc 0, a reload shows no notice and the next back leaves the app.
- Given notice (or notice and confirm) open, when the page reloads, then only the notice is shown at `{ wc: 1, launch: <new> }`, the first back closes it, the next leaves the app.
- Given a rejected Session plus unreadable history, when New game is pressed, then the notice opens at `{ wc: 1, launch: <boot launch> }`; the rejected root itself pushed nothing (wc 0).
- Given the change on a clean tree, when `npm run test:all` runs, then it exits 0.

## Implementation Notes

- "Open from about:blank": Chromium keeps a fresh page's initial `about:blank` entry when `page.goto('/')` navigates from it (probe: `history.length` 3 after the boot push), so no extra navigation is needed; `goBack()` from the base entry lands on `about:blank`.
- Dialog focus return: `Dialog.svelte` focuses its action button when its `inert` prop clears (it was covered by a later dialog), which gives "Reset history focused after Keep it/back/scrim tap"; a dialog that closes leaves focus to the page.
- The overlays U test observes close order through the stubbed `nav.pop` (it records `overlays.top` at each pop: `historyNotice`, then none).
- The P3 "Keep it then Reset history with no wait" case uses two consecutive Playwright clicks (no wait for the pop's popstate between them).
- Verification: `npx vitest run src` (1424 passed), the three Playwright specs on android (31 passed), `npm run test:all` exit 0; `git diff --stat src/engine fixtures` empty.
- Review patches (2026-10-01): focus on Reset history asserted after back and confirm scrim tap; notice scrim test uses `page.touchscreen.tap`; new card-body tap test; nav S cases for a multi-step back, non-integer/negative/string launch wc and a pending pop settling on a stale entry; new `src/ui/history-notice.svelte.test.ts` (5 cases). Re-verified by the orchestrator: `npm run test:all` exit 0 (unit 31 files / 1588 tests, 5.38 s inside test:all, borderline vs the 5 s target as in ticket 3.7; test:e2e:dist 13, test:e2e 118 passed / 108 skipped, test:e2e:pwa 12).

## Plan Change Log

## Review Triage Log

### 2026-10-01 — Review pass
- verdicts: 24 findings — high 0, medium 0, low 9, false 12, maybe-false 3
- findings:
  - `[low]` `[defer]` blind: Escape-stays-open test is interim (EXPERIENCE row 152 says Esc dismisses) and nothing makes epic 6 flip it — deferred to epic 6's keyboard map.
  - `[low]` `[patch]` blind: focus after back and after a confirm scrim tap not asserted (back goes through closedByBack) — added `Reset history` toBeFocused to both tests.
  - `[low]` `[patch]` blind: openHistoryNotice() once-per-launch and active/unreadable gating untested — added src/ui/history-notice.svelte.test.ts (grouped with intent #3).
  - `[false]` `[reject]` blind: deferred note says Replay calls resetForNewSession "first" while newGame() calls it after game.newGame() — the fix edits this plan; the code follows build-notes CAP-4 (store newGame, then the UI's resetForNewSession).
  - `[low]` `[patch]` blind: nav S cases missing (multi-step back, non-integer/negative/string wc at launch, a pending pop settling on a stale entry) — added the three cases to src/shell/nav.test.ts.
  - `[maybe-false]` `[defer]` blind: 250 ms rewind budget has no device evidence; a slow go(-d) on a cold low-end Android would be fatal — the 250 ms is spine AD-13's; settle with an epic 7 device check (if true medium, unverified).
  - `[false]` `[reject]` blind: AD-13-named tests seed history-invalid-* against the AGENTS.md pitfall — the ticket makes History-notice flows §2 rejection flows and prescribes P3 names `§2` or `AD-13`; the exemption is in deferred for the project-context refresh.
  - `[false]` `[reject]` blind: board inert keyed on `isOpen('historyNotice')` only — in epic 3 every non-empty stack has the notice at the bottom, so it is exactly "a dialog is rendered"; epics 4/6 own their overlays.
  - `[low]` `[reject]` blind: Dialog's return focus to its action assumes the action opened the dialog above — the only stacked caller is the notice; a return-focus prop adds surface for no current case.
  - `[low]` `[reject]` blind: Dialog copies BlockingMessage card styles — cosmetic duplication; the CAP-11 refactor sweep (entry 12) is where shared styles land.
  - `[false]` `[reject]` blind: plan record incomplete (empty triage log, ticket '8') — the triage log is written at this step; `ticket` is find's `id` per the workflow.
  - `[false]` `[reject]` edge: pushing while on an ignored stale entry stacks above it (guard: history.back()) — AD-13 says a stale popstate "calls no history.back()"; already a deferred spine note.
  - `[low]` `[reject]` edge: own pop landing on a stale entry leaves count unchanged, so the next push is one wc high — reachable only via Forward onto a stale entry then an overlay (no Forward on Android); it self-heals at the next current-launch back; same deferred spine note.
  - `[maybe-false]` `[defer]` edge: a stored wc larger than the real back history would make go(-d) a no-op, so every reload is fatal — settle by checking whether Chrome can restore an entry's state without its earlier entries (tab duplication, session restore); spine-prescribed rewind (if true high, unverified).
  - `[false]` `[reject]` edge: `shown` is set before overlays.open may throw — a throw there halts the app (AD-15), so the flag is never read again.
  - `[false]` `[reject]` edge: the deferred note calls the stale-entry push unreachable in epic 3, but a desktop Forward onto a stale entry before New game from the rejected root reaches it — the fix edits this plan; the outcome (one swallowed back) is the deferred spine note's.
  - `[low]` `[patch]` verification-gap: no test taps the confirm card itself, so nothing proves a tap on its text stays out of the scrim action — added '§2 a tap on the Reset confirm's card body leaves the confirm open at wc 2'.
  - `[false]` `[reject]` intent: launch timeout reaching AD-15 is shown by S only — the ticket and rule-coverage row 99 give it to S; the boot link is `await nav.launch()` in `void boot()` plus the existing unhandledrejection handler.
  - `[false]` `[reject]` intent: back is Playwright goBack, not Android back — the ticket concedes it; A-A11 is deferred to epic 7.
  - `[low]` `[patch]` intent: game-over resetForNewSession and the once-per-launch guard are not discriminated end to end — the ticket accepts the win smoke as non-discriminating; the guard is now covered by the new U test (grouped with blind #3).
  - `[maybe-false]` `[patch]` intent: owner decision is about a tap, but the notice scrim test uses mouse.click — the scrim test now uses page.touchscreen.tap (android has touch).
  - `[false]` `[reject]` intent: fixtures exemption recorded only in the plan — the ticket asks exactly that ("the plan records").
  - `[false]` `[reject]` intent: inert follows store state, not rendered DOM — App renders the notice exactly when that state holds, inside the active branch; the halted case is tested.
  - `[false]` `[reject]` intent: an existing test changed — the ticket's ticket 3.7 carry-forward line requires it.

## Design Notes

1. **nav.ts state and handler.** Module state: `launchId: number | undefined` (`newSeed()`), `count = 0`, `pending = 0`, `queue: ('push' | 'pop')[]`, `callbacks | undefined`, `ready = false`, `failed = false`, `rewound: (() => void) | undefined`. `launch()`: throw if called twice; add the listener; `d = history.state?.wc`; if `Number.isInteger(d) && d > 0`: return a Promise that sets `rewound` (clears the timer, `finish()`, resolve), starts `setTimeout(…, 250)` (sets `failed`, clears `rewound`, rejects `new Error('AD-13 launch rewind: no popstate within 250 ms')` — no throw inside the timer), then `history.go(-d)`; else `finish()` and resolve. `finish()` = `replaceState({ wc: 0, launch }, '')`, `count = 0`, `ready = true`, `drain()`. Handler: (1) `failed` → return; (2) `rewound` → call it, return; (3) `pending > 0` → `pending--`, count := wc if current launch and numeric, `drain()`, return (own pops settle whatever they land on, so the queue never stalls); (4) state not an object or `launch !== launchId` → return; (5) wc not a number → return; (6) no callbacks → throw `AD-13 back before register()`; (7) count := d; if `d > depth()` → `pending++`, `history.go(-(d − depth()))`, return (Forward is decided before epic 4's before-back hook); (8) `closedByBack(d)`. `drain()`: while `ready && pending === 0 && queue.length`: push → `count += 1; pushState({ wc: count, launch }, '')`; pop → `pending += 1; history.back()`. While halted, a back still closes one hidden entry (accepted).
2. **overlays.svelte.ts.** `export type OverlayId = 'historyNotice' | 'resetConfirm'`; `let stack = $state.raw<readonly OverlayId[]>([])`. `open(id)`: throw if open; append; `nav.push()`. `close(id)`: throw unless `stack.at(-1) === id` (empty included); remove; `nav.pop()`. `closedByBack(d)`: while `stack.length > d` remove the top (one at a time, topmost first); never nav. `resetForNewSession()`: while depth > 0 `close(top)` (epic 3 part only). Getters `depth`, `top` (`OverlayId | undefined`), `isOpen(id)`. Export one `overlays` object (as `game`).
3. **history-notice.svelte.ts.** Module-level `shown = false` (once per launch; structurally redundant in epic 3 since rejection happens only at boot, kept as the ticket's guard) and `$state.raw` `reason: HistoryRejectReason | undefined`. `openHistoryNotice()`: return unless `!shown && game.state.kind === 'active' && scoreHistory.state.status === 'unreadable'`; then `reason = scoreHistory.state.reason; shown = true; overlays.open('historyNotice')`. Export a getter for the reason so the notice renders the reason captured at open (`reset()` flips the state to ok before the closes).
4. **text.ts.** `historyTitle: "Your score history can't be read."`; `historyVersionUnknown: (v) => \`It uses format version ${v}, which this version can't read.\``; `historyVersionUnreadable: "Its format version can't be read."`; `historyContentsUnreadable: (v) => \`It uses format version ${v} but its contents can't be read.\`` (effectively constant until `HISTORY_VERSION` bumps); `historyResetHint: 'Statistics are off until you reset it. Resetting deletes the old history.'`; `notNow`, `resetHistory`, `resetConfirmTitle: 'Delete the score history?'`, `resetConfirmBody: "This can't be undone."`, `keepIt`, `deleteHistory`. Notice body = variant sentence + ' ' + hint (EXPERIENCE message catalogue rows 102, 104); the end sheet (epic 6) reuses the variant sentences.
5. **Dialog.svelte.** Props: `title`, `body`, `dismiss`, `action`, `ondismiss`, `onaction`, `onscrim?: () => void` (absent → the tap is consumed, nothing happens), `inert?: boolean`. Markup: a fixed full-viewport scrim `div` (`--wc-scrim`, receives the click) and a centred card (max 320 px, `--wc-surface-raised`, 12 px radius) with `role="dialog"`, `aria-modal="true"`, `aria-labelledby` the title, `aria-describedby` the body; buttons right-aligned, dismissive secondary first (44 px pill, `--wc-surface` fill, 1 px `--wc-outline` border), action second as danger (`--wc-error` fill, `--wc-ink-on-accent` ink). Card clicks do not reach the scrim (sibling or `stopPropagation`). Focus the dismissive button on mount. Later dialogs stack above earlier ones. No `keydown` handling.
6. **HistoryNotice.svelte.** Rendered by App while `overlays.isOpen('historyNotice')` (only inside the active branch, so halted shows only the Blocking message, entries stay stacked). Notice: `Dialog` with `inert={overlays.top !== 'historyNotice'}`, no `onscrim` (owner), `ondismiss = () => overlays.close('historyNotice')`, `onaction = () => overlays.open('resetConfirm')`. Confirm (`{#if overlays.isOpen('resetConfirm')}`): `ondismiss` and `onscrim` = `overlays.close('resetConfirm')`; `onaction` = reset then close confirm then notice. When the confirm closes and the notice stays, focus returns to the notice's Reset history; when the notice closes focus falls to the page (board). App: `<main inert={overlays.isOpen('historyNotice')}>`, so every surface except the top dialog is inert (entry 9's banner inherits).
7. **Playwright (android; other projects skip like `history.spec.ts`).** Local helpers per spec: `wc(page)` = `page.evaluate(() => history.state)`; "open from about:blank" = seed, then `page.goto('/')` from the page's `about:blank` (if Chromium replaces the initial entry, first `goto('about:blank')`-style navigation to create a real entry; record what works), wait for `card-0` (or the rejected root) before any absence check; "leaves the app" = `goBack()` then URL `about:blank`. Assert dialog title and body with `toHaveAccessibleName`/`toHaveAccessibleDescription` (exact strings). `history-notice.spec.ts`: three `§2` variants (each: exact title/body, Reset history button, Not now focused); version-unknown also runs: Not now → wc 0; back closes the notice; scrim tap on the notice (click at undo's centre, asserted outside the notice box) leaves it open at wc 1 and the Session bytes unchanged; confirm: Keep it focused, Tab/Shift+Tab ×3 never focus a notice button, Escape leaves it open at wc 2 (interim), Keep it / back / scrim tap (undo's centre, asserted outside the confirm box) each → confirm closed, notice open, Reset history focused after Keep it, wc 1; Keep it then Reset history with no wait → `expect.poll` wc 2, confirm open (smoke; the S queue case is the proof); board inert on `session-place.json` (`undo.focus()` leaves it unfocused); Delete history; `wordcell:history` bytes unchanged after Not now, Keep it, back and reload. `nav.spec.ts`: both reload cases, Forward at depth 0 and at depth 1 (after Keep it, `goForward()` → notice open, confirm closed, wc 1), stale launch, deferred push (`§2`, launch equals the boot launch), win smoke (`AD-13 … no notice (already shown this launch; store not rejected)`; non-discriminating until epic 6). Every `history.state` read after a queued pop or Forward correction uses `expect.poll`.
8. **Review-log resolutions.** Result open major → Always line 2 + nav S cases. Unapplied minors: all adopted above (register wrapper, Esc wording, `§2` deferred label + launch equality, win label, file names, one `openHistoryNotice()`, Dialog for the notice, reset-then-deferred-push order, focus on close, bounded Tab, top-dialog-only interactivity, active-after-newGame check, ignore after rejected launch, Forward at depth 1, close-on-empty throws, exact title/body, wait for card-0, box checks, Forward before the hook, captured reason, launch id via `newSeed()`), except: stale-entry push, Replay, entry 10 ordering case and A-A11 → `deferred`; contents sentence constancy and halted back → noted here, no code.

## Verification

**Commands:**
- `npx vitest run src/shell/nav.test.ts src/ui src/architecture.test.ts` -- all pass.
- `npx playwright test e2e/history-notice.spec.ts e2e/nav.spec.ts e2e/history.spec.ts --project=android` -- all pass.
- `npm run test:all` -- exit 0; `git diff --stat src/engine fixtures` -- empty.

## Auto Run Result

**Summary:** New AD-13 adapter `src/shell/nav.ts` (launch rewind with 250 ms rejection, launch id via `newSeed()`, queued push/pop, pending-pop settling, `count` = current entry's wc so pushes send `{ wc: count + 1, launch }` (resolves the review log's open major), stale-launch and Forward rules, rule-6 throws); E3 overlays store `src/ui/overlays.svelte.ts`; non-native `Dialog.svelte`; History notice with its Reset confirm (three catalogue variants, notice scrim consumes taps and focus starts on Not now per the owner decision of 2026-10-01; confirm focus on Keep it, scrim = Keep it; Delete history resets first then closes top-down); boot wiring in `main.ts` (launch → register → font check … → notice before mount) and App's New game (`newGame` → `resetForNewSession` → deferred notice from the rejected root).

**Files changed:**
- `src/shell/nav.ts`, `src/shell/nav.test.ts` — History API adapter and its 20 S cases.
- `src/ui/overlays.svelte.ts`, `src/ui/overlays.svelte.test.ts` — overlay stack and U cases.
- `src/ui/history-notice.svelte.ts`, `src/ui/history-notice.svelte.test.ts` — once-per-launch `openHistoryNotice()` with captured reason, and its U cases.
- `src/ui/Dialog.svelte`, `src/ui/HistoryNotice.svelte` — dialog component, notice and confirm.
- `src/ui/text.ts`, `src/ui/text.test.ts` — catalogue strings (rows 102, 104) and interpolation cases.
- `src/ui/App.svelte`, `src/main.ts` — rendering, inert board, New game handler, boot order.
- `e2e/history-notice.spec.ts`, `e2e/nav.spec.ts` — P3 flows; `e2e/history.spec.ts` — Not now carry-forward and the AD-15 halt-over-dialogs test.

**Review findings:** 24 (blind hunter 11, edge-case 5, verification-gap 1, intent alignment 7): 5 patched (4 low, 1 maybe-false; all test additions), 3 deferred (Escape test inversion for epic 6; 250 ms rewind device check; stale-wc rewind no-op, unverified), 16 rejected with reasons in the Review Triage Log.

**Review-log carry-ins:** the Result open major (push counter) is resolved in nav.ts as above; every unapplied minor is resolved per Design Notes 8 (adopted in code/tests, or recorded in `deferred`).

**Follow-up review recommended:** false — no high and fewer than two medium entries were patched (patched: high 0, medium 0, low 4, maybe-false 1).

**Verification:** `npm run test:all` exit 0 after the review patches; `git diff --stat src/engine fixtures` empty; I/O matrix rows each covered by named `AD-13` S cases in `src/shell/nav.test.ts`, all run and passed.

**Residual risks:** Playwright `goBack()` is not Android back (A-A11, epic 7); Delete history queues two pops and `drain()` sends the second `history.back()` only after the first pop's `popstate`, so a system back arriving in that gap is absorbed as nav's own pop and the second `back()` can leave the app; AD-13 edge for the spine owner: an overlay pushed while the current entry is a stale-launch entry reached by Forward leaves wc no longer equal to the distance from the base, so a later reload rewinds onto the stale entry and stamps it base, leaving an older-launch entry behind it (back from the bare Board is ignored once); the win smoke does not discriminate `resetForNewSession()` until epic 6; unit suite wall time borderline over 5 s on the `/mnt/d` filesystem.
