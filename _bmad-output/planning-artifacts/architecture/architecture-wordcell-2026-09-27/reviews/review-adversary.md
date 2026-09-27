# Adversarial review — ARCHITECTURE-SPINE.md (WordCell, draft 2026-09-27)

Reviewer: fresh-context adversary. Inputs: the spine, `docs/game-flow-spec.md` v0.7 (§2, §4, §5, §6
authoritative), `EXPERIENCE.md`. Method: for each seam, build two units one level down that each
obey every AD to the letter, then show they still build incompatibly. Each hole ends with proposed
AD text. The spine is not edited.

## Verdict

**Not ready to ticket.** The core paradigm is sound, but 21 holes let two compliant tickets build
incompatible code. Six are major: the dispatch result contract (H-1), the AD-1 scan colliding with
the score history's own names (H-2), flush ordering and protected-storage overwrites (H-3), the
UI's inability to read letters or statistics (H-4), two owners of overlay and nav state (H-5), and
the no-op-vs-throw split per command (H-6). None needs Jared's design intent except H-10 (multiple
tabs) and H-12 (quota failure mid-finish), which are marked **decision-needed**.

Severity: **Major** = two compliant tickets will not integrate, or a spec rule breaks.
**Minor** = likely rework or a flaky test, but it can be settled inside one ticket.

---

## H-1 (Major) — The dispatch result is unspecified, and `accrue` destroys the "same reference" signal

**Pair.** Epic 3 ticket "game store dispatch" (AD-4) vs epic 5 ticket "Validate states and
invalid-word line" (EXPERIENCE Word line, Movable tile).

- The store follows AD-4 exactly: `accrue` → `apply` → write, and returns nothing (the sequence
  diagram ends in "new Session → GameView"). `rejectedWord` from `ApplyResult` has nowhere to go.
- The tray ticket needs (a) the rejected word, (b) to clear the invalid-word line "until the next
  edit, Undo, Redo, or a successful Validate", and (c) to end a tile selection "on any edit".
  Without a result, a natural implementation compares `session` references before and after
  dispatch. But `accrue` returns a new reference on almost every dispatch while playing (any
  visible ms > 0), so every no-op command, including a failed Validate and an arrange that leaves
  the order unchanged, looks like an edit. The line is cleared by the dispatch that produced it,
  and tile selections drop on no-op swaps. That contradicts R-38 and R-71 as surfaced.
- A third ticket (end sheet, epic 6) might store `rejectedWord` in its own `$state`; the store
  might store it too. That makes two owners of the invalid-word line, and neither is told when to
  clear it.

AD-2's "returns the same `Session` reference" is also ambiguous. It can mean reference identity
(the engine must return its input object) or value identity (the engine compares values). An
`arrange` with a fresh array equal in content to the stored one must be a non-edit (R-71: "an
action that leaves them unchanged is not an edit"). An engine that builds a new `Move` and compares
references would treat it as an edit and wrongly drop the redo data.

**Proposed AD-4 addition — Dispatch result and transient feedback:**
> `dispatch(command)` returns `DispatchResult = { changed: boolean; rejectedWord?: string }`.
> `changed` is true iff `apply` returned a different reference from its input, where the input is
> the accrued session. Changes made by `accrue` alone never count. The store owns
> `feedback: { rejectedWord: string | null }` as `$state`. It sets the word on a failed Validate
> and clears it on any dispatch with `changed = true`, on New game and on Replay. The invalid-word
> line renders only `store.feedback.rejectedWord`, uppercased in `text.ts`. UI-only state that
> must end "on any edit" (tile selection) keys off `changed`, never off Session identity. Feedback
> is never persisted.

**Proposed AD-2 tightening:**
> "Changes no stored field" is decided by **value**. The engine compares the candidate draft
> fields (`destinationCount`, `destinationSide`, `freeLetters`, `arrangement`, `targetCell`,
> `placementOrder`, cursor, `gaveUp`) element by element with the stored ones. When all are equal,
> it returns its input reference unchanged and does not touch `reached` or the redo tail. Vitest:
> `R-71 arrange with an equal array is not an edit (same reference, redo kept)`.

---

## H-2 (Major) — The AD-1 architecture scan contradicts AD-6/AD-7 naming and AD-17 fixtures

**Pair A.** Epic 1 `architecture.test.ts` (AD-1 check 2: "only `src/shell/nav.ts` references
`history` or `popstate`") vs epic 3 store/storage (AD-6/AD-7). AD-6/AD-7 mandate
`reconcileHistory`, `parseHistory`, `HISTORY_VERSION`, the key `wordcell:history` and an in-memory
`history = {state: 'unreadable'}`, all outside `nav.ts`. A token scan for `history` fails on the
spine's own names. The epic 3 author either renames things away from the spine (to `scores`,
say), which breaks AD-6/AD-7 as written, or weakens the scan, which breaks AD-1.

**Pair B.** AD-1 check 2 ("engine files may import only relative paths inside `src/engine/`
(tests may also import `vitest`)") vs AD-17 ("Fixtures live in `e2e/fixtures/*.json` … Vitest
reuses them for engine repro cases"). An engine test that imports `../../e2e/fixtures/x.json`
fails AD-1. It could read the file with `node:fs`, but `fs` is a Node import that check 2 also
forbids.

The same scan also forbids the bare token `Date`. That flags identifiers such as `isUpToDate` and
comments. Two implementers will pick different regexes and argue over false positives.

**Proposed AD-1 check 2 text:**
> The scan matches syntax, not substrings. Engine globals: the regex
> `\b(Math\.random|Date|performance|crypto|setTimeout|setInterval|requestAnimationFrame|fetch|localStorage|globalThis|window|document|process|console)\b`
> applied to source with comments and string literals stripped. Browser history: only `nav.ts`
> may match `\b(window\.)?history\s*\.\s*(pushState|replaceState|back|forward|go|state|length)\b`
> or the string `'popstate'`. The score history keeps its names (`reconcileHistory`,
> `wordcell:history`). Engine **test** files (`*.test.ts` under `src/engine/`) may additionally
> import JSON from `e2e/fixtures/` with a static `import … with { type: 'json' }`. Engine
> **sources** may not.

---

## H-3 (Major) — Visibility, pagehide and flush: two listeners, the wrong owner, and writes to protected keys

**Pair A: clock vs store.** AD-9 says `clock.ts` "measures visible time … running while
`visibilityState === 'visible'`", so the clock listens to `visibilitychange`. AD-4 and AD-7 say the
store accrues and writes "on `visibilitychange` to hidden", so the store listens too. With two
listeners on one event, the outcome depends on registration order:
- If the clock's listener runs first, sets `running = false` and computes its elapsed time
  lazily as `visible ? now − start : 0`, then the store's `take()` returns 0. The last visible
  stretch before every backgrounding is lost, and R-76 undercounts on every app switch.
- If the store's listener runs first, the result is correct. The clock ticket and the store
  ticket each pass their own unit tests either way.

**Pair B: store vs Session-rejected (AD-7, §2).** AD-7 writes the Session "on `visibilitychange`
to hidden and on `pagehide`". While the Session-rejected message shows, what does the store hold?
AD-4 says it "holds the current `Session`" and has no rejected state. An implementer who seeds
the store with a placeholder `createSession(newSeed)`, so the Board code never sees `null`,
overwrites the rejected save on the first backgrounding. That violates §2 ("the stored session is
not overwritten until the player starts one").

**Pair C: fatal surface vs flush (AD-15).** "Leave storage untouched" does not stop the pagehide
listener, which still writes the last good Session plus accrued ms after a fatal error.

**Pair D: New game vs the clock.** AD-4's New game and Replay call `createSession` without
touching the clock. The next dispatch accrues the unflushed ms of the abandoned game, or the time
spent reading the Session-rejected message, into the fresh game. That violates R-74 and R-76
(`activeMs = 0`).

**Proposed AD-9 replacement text:**
> `clock.ts` is passive. It has no event listeners and exposes `resume(now)`, `pause(now)`,
> `take(now): number` (returns and zeroes the unflushed ms) and `peek(now)`. The store is the
> only `visibilitychange` / `pagehide` / `pageshow` listener, and it runs in this order: on hidden
> or pagehide, `ms = clock.take(); clock.pause(); flush(ms)`; on visible or pageshow,
> `clock.resume()`. New game, Replay and leaving the Session-rejected state call `clock.take()`
> and discard the result before `createSession`.

**Proposed AD-4 addition — Store state shape:**
> The store's state is `{ kind: 'rejected'; reason } | { kind: 'active'; session } | { kind:
> 'halted' }`. `flush` and dispatch write only in `active`. The AD-15 handler sets `halted` first,
> which removes the flush listeners, before it shows the fatal surface.

---

## H-4 (Major) — The UI cannot get card letters, band text data or statistics under the import rule

**Pair.** Epic 4 card component (AD-3: "Card letters and letter counts come from `LangData` via the
engine, never from a UI table") vs AD-1/AD-2 (UI may only `import type` from the engine).

- `GameView` as listed has columns and cells as `CardId` lists, but no letter per `CardId`. The
  card component cannot call a `letterOf(id)` or read `EN` (both are values). Compliant choices
  that clash: the store re-exports `EN`, or the view adds a `faces` table, or a `shell/cards.ts`
  wraps it. Epic 4 and epic 5 will each pick one.
- `statistics(records)` (AD-6) is an engine value function the Statistics panel needs, and the
  spine never says which shell module exposes it. The same goes for the end sheet's "was this game
  recorded" (see H-9).
- The end sheet shows "12 letters left: −120". `GameView` exposes `penalty`, but not the letters
  left. A UI that computes `penalty / 10` hard-codes the R-81 constant, which is the re-derivation
  AD-3 exists to forbid.
- Tapping a destination-column card sets k "so that card is the top of D", and tapping the current
  top gives k − 1 clamped at 1 (R-31). The command is `setDestinationCount { k }`, so the UI must
  compute k from the card's row, and the hover preview (EXPERIENCE Mouse and hover) must compute
  it the same way. That legality arithmetic lives in two UI places.

**Proposed AD-3 addition:**
> `GameView` also contains: `faces: readonly { letter: string; letterCount: number }[]` indexed by
> `CardId` (from `LangData`); `lettersLeft` (R-81); per-cell `used` and `canSetTarget`; and, for
> the destination column in Composing, `kIfTapped: ReadonlyMap<CardId, number | null>`, where
> `null` means a no-op (R-31: top of D at k = 1). Tap, `Enter`/`Space` and hover preview all read
> `kIfTapped`; none computes k. The shell module `shell/history.svelte.ts` (see H-9) exposes
> `statistics` and `isRecorded` as derived state. The UI never calls an engine value function.

---

## H-5 (Major) — Overlay state and nav entries have two owners; back and state-driven closes can double-pop

**Pair A: `nav.ts` (epic 3) vs the end sheet (epic 6).** AD-13 gives `nav.ts` "a stack of open
entries" with close handlers. AD-12 says overlay state is "UI state" but names no module. The end
sheet has three states (hidden, collapsed, expanded), a winning-commit deferral (AD-14), an
"Undo closes it" path, and a "relaunch opens it expanded" path. Two compliant builds:
- (i) The end sheet derives `open = status ≠ playing` and pushes or pops in a `$effect`. Undo
  flips status, the effect calls `nav.pop(entry)`, and `history.back()` fires `popstate`. The
  popstate handler finds the entry and calls its close handler. If that handler calls
  `nav.pop` again, as a "close" naturally would, the history goes back twice and the app exits.
  AD-13 says nothing about idempotency or who may call `pop`.
- (ii) The winning deferral cannot be expressed by (i) at all, because `status` flips immediately
  (AD-14). The component has to hold its own "suppressed until animation settles" flag. Now three
  things say whether the sheet is open: status, the component flag and the nav stack.

**Pair B: `nav.ts` popstate vs the gesture controller (AD-12).** EXPERIENCE requires "a back
(`popstate`) arriving during a drag also cancels it as for `pointercancel`" before the back rule
runs. `nav.ts` is shell and may not import `src/ui/gestures/`. A compliant nav runs the close
handler, which clears the selection, while the drag is still live. Then `pointerup` drops a tail
whose selection no longer exists, and the dispatch goes through.

**Pair C: matching `popstate`.** "A `popstate` that matches no open entry is ignored", but the event
carries the state of the entry *below* the one that was left. One builder matches on
`event.state === top.state` and never closes anything. Another matches on "state ≠ top" and closes
correctly. The desktop Forward button re-enters a closed entry, which matches nothing and is
ignored. After that, every back is off by one, and the "after a reload, back from the bare Board
leaves the app" test fails after any Forward.

**Pair D: boot push order.** On relaunch into Game over with unreadable history, EXPERIENCE requires
the end-sheet entry first and the History notice on top. If both components push on mount, the
order is Svelte mount order, which is not specified.

**Proposed AD-13 replacement text:**
> `src/ui/overlays.svelte.ts` is the single owner of overlay state: an ordered stack of
> `{ id, kind, depth }` plus the end sheet's `hidden | collapsed | expanded`. Components render
> from it and never hold their own open flag. `nav.ts` is its mechanical adapter. Every entry is
> pushed with `history.pushState({ wc: depth })`, with depth increasing from 0 at root. On
> `popstate` with `state.wc = d`, the adapter closes every open entry whose depth is greater than
> d, topmost first, through `overlays.closedByBack(id)`, which never calls `pop`. On a `popstate`
> with `d` greater than the stack depth (Forward), it calls `history.go(-(d − stackDepth))` and
> closes nothing. `nav.pop(id)` is idempotent: it is a no-op when `id` is no longer open. A
> programmatic close (Undo, a menu item, a state change) calls `overlays.close(id)`, which pops.
> `nav.ts` exposes `setBeforeBack(fn)`. The gesture controller registers a function that cancels
> any live drag as `pointercancel` does, and `nav` runs it before closing entries. The end sheet
> opens when the store reports a transition into won or gaveUp, and the winning case waits for
> `animations.settled()`. At boot, `main.ts` pushes in a fixed order: end sheet (if Game over),
> then History notice.

---

## H-6 (Major) — No-op or throw, per command, is not specified; the engine and UI tests will disagree

**Pair.** An epic 2 engine ticket (AD-2: "an illegal command (… a command in the wrong phase or
status) throws") vs the spec's engine-tested sentences that call some of the same inputs "inert
(not an edit)":
- R-31: "on an empty column … flip is inert (not an edit)". It is untagged, so it needs an engine
  test. Is `flip` on an empty destination a throw or a same-reference no-op?
- R-31: "a press at a bound is a no-op and not an edit". Is `setDestinationCount { k: current }` a
  same-reference no-op and `{ k: current + 2 }` a throw?
- R-33: "A tap on a used or empty WordCell in Composing is a no-op (not an edit)". The §4
  preamble says a duplicate free letter throws. Is `addFreeLetter` on an **empty** cell a throw or
  a no-op? On a used cell it is a throw per the preamble, but the sentence calls the tap a no-op.
- R-40 `setTarget` on a non-legal cell, R-75 `giveUp` outside Idle, `setPlacementOrder` with a
  non-permutation, `arrange` that drops a source card (R-35): these are presumably throws, but
  nothing says so.

The engine author picks one per case and the keyboard author (epic 6: "a shortcut … acts only when
that control is enabled; otherwise … not an edit") picks another. The integration fails only when
a guard is missing, and then it goes to the fatal surface.

**Proposed AD-2 addition — Command table:**
> The engine test file `commands.test.ts` opens with one table, reproduced in the epic 2 spec. It
> gives every command and precondition as either **no-op** (same reference) or **throw**. At
> minimum: `flip` with k = 0 → no-op (R-31); `setDestinationCount` with k = current → no-op, k
> outside 1…n or any k when n = 0 → throw; `addFreeLetter` on a used or empty cell → throw (the
> UI's no-op is not dispatching, gated by `canAddFreeLetter`); `setTarget` = current → no-op, not
> legal → throw; `arrange` or `setPlacementOrder` equal in value → no-op, not a permutation of
> the right set → throw; any command other than `undo` while status ≠ playing → throw. The UI
> dispatches only when the matching `GameView` flag allows it, so a throw always means a bug.

---

## H-7 (Minor) — `pickTarget`'s `hasLeftSource` is ambiguous in a way that breaks Q-34

**Pair.** `targeting.ts` (pure, Vitest) vs the pointer controller (AD-12). The signature
`pickTarget(draggedRect, candidates, sourceId, hasLeftSource)` suggests it returns the
*highlighted* target: `null` while the raw target is the source and the drag has not left it. The
controller must update `hasLeftSource` when "the live target is another column **or no column**".
If it derives that from the return value, a source-column overlap returns `null`, which looks like
"no column", so `hasLeftSource` becomes true on the first move. A small drag over the source
column then highlights it and self-drops, which violates Q-34 (Flow 1 variant). Both units pass
their own tests.

**Proposed AD-12 text:**
> `pickTarget` returns `{ raw: ColumnId | null; highlighted: ColumnId | null }`. The controller
> sets `hasLeftSource = true` when, after the threshold, `raw !== sourceId` (including `raw ===
> null`), and it never derives this from `highlighted`. Vitest:
> `Q-34 raw source overlap does not mark the drag as left`.

---

## H-8 (Minor) — The layout gate races animation completion at `pointerdown`

**Pair.** `gate.ts` (AD-11: a recompute runs "only when the gate is idle") vs AD-14 / EXPERIENCE
("a new gesture … completes any running animation at once"). The `pointerdown` handler completes
the animations, the animation count drops to 0, and the gate is idle. If the gate runs pending
recomputes synchronously on the idle transition, the tray-growth or banner recompute runs *inside*
the `pointerdown` that just started a gesture. Hit rects move under the finger, which violates the
Column rule and A-D11. If the gesture count is incremented first, it is fine. The spine does not
fix the order.

**Proposed AD-11 text:**
> In the pointer controller, `pointerdown` increments the gesture count **before** completing
> animations. Pending recomputes never run synchronously on a gate transition. They run in the
> next `requestAnimationFrame` in which the gate is idle. `bannerShown` is a gate-latched copy of
> `dictionary.state === 'failed'`. The Validate label reads the live state, and the banner and
> geometry read the latched one. The `scrollTop` adjustment is done by `src/ui/layout/`, not by
> the shell (layer fix).

---

## H-9 (Major) — The score history has two owners, and "was this game recorded" has none

**Pair A: `storage.ts` vs `game.svelte.ts`.** AD-7 puts the "in-memory `history = { state:
'unreadable', reason }`" under persistence (storage). AD-4 has the store call `reconcileHistory`
on `records`. AD-6 has "Reset history" write. The Statistics panel and the History notice read
it. One compliant build keeps a `$state` history in `storage.ts`, and another keeps it in the
store with `storage.ts` stateless. Both then import each other's copy, and Reset from the
Statistics panel updates one copy while the store reconciles against the other.

**Pair B: the end sheet vs the store (EXPERIENCE End sheet, Flow 7).** The end sheet must show
either the history block (recorded) or "This game wasn't added to your statistics." Recorded-ness
changes when the history was unreadable at the finish, when it was reset after the finish (Flow 7:
"stays unrecorded"), and on relaunch into Game over. The spine has no function for it. The end
sheet ticket will guess, for example "history.state === 'ok'", which shows the history block after
a Flow 7 reset even though the game is not in it.

**Pair C: an absent key.** Nothing says whether an absent `wordcell:history` is written at launch
or at the first finish, or that an absent key is `ok` with `[]` and not unreadable.

**Proposed AD-6/AD-7 text:**
> `src/shell/history.svelte.ts` is the single owner of the score history: `$state` of `{ state:
> 'ok'; records } | { state: 'unreadable'; reason }`. `storage.ts` is stateless read and write
> functions. An absent key is `{ state: 'ok', records: [] }` and is not written until the first
> change. The engine exports `isRecorded(records, session, lang) = gameRecord(session) !== null
> && deepEqual(last(records), gameRecord(session))`. The shell derives `recorded` from it (always
> false while unreadable), and the end sheet shows the history block iff `recorded`. The
> container's `version` governs parsing. A record whose own `version` differs from the container's
> makes the history `contents-unreadable { version }`.

---

## H-10 (Major, decision-needed) — Two tabs are two writers of one Session and one history

**Pair.** The store in tab A vs the store in tab B (desktop, and Android Chrome with the site open
in a tab and as the installed PWA). Both obey AD-4 ("one writer") within their own tab. Tab A
finishes a game and appends a record. Tab B still holds the old in-memory records, finishes later,
and writes `records + [B]`, so A's record is lost. Session writes also overwrite each other, and
a restore then replays whichever tab wrote last. R-84 says "One game is in progress at a time";
the spine gives that no mechanism.

**Proposed AD (new, AD-19 Single live instance), needs Jared's pick:**
> (a) The store listens to the `storage` event. When another tab writes `wordcell:session` or
> `wordcell:history`, this tab enters `halted` with a blocking message "WordCell is open
> elsewhere. [Reload]" and never writes again. Or (b) use a `BroadcastChannel('wordcell')` claim at
> boot: the newest tab wins and older tabs halt. Either way there is a Playwright test with two
> pages.

---

## H-11 (Minor) — The restore test (AD-17) and the pagehide write (AD-7) cannot both pass

**Pair.** An epic 7 restore test (AD-17: "snapshots the three keys before reload and compares
`loaded()` field by field") vs AD-7/AD-9 (on `pagehide`, accrue then write). `page.reload()` fires
`pagehide`. While playing, the app accrues the visible ms since the last dispatch and rewrites
`wordcell:session`, so the snapshot's `activeMs` is stale and the equality check fails, or flakes
when the elapsed time rounds to 0 ms. The test hook also lacks the service-worker readiness the
`pwa` offline test needs ("after the worker reports the precache complete").

**Proposed AD-17 text:**
> The restore snapshot is taken by an `addInitScript` in the **reloaded** page. It reads the three
> raw keys before any app script runs and stores them on `window.__wordcellBoot`. The test
> compares `loaded()` with `__wordcellBoot`. A separate test asserts that the pagehide write
> increased `activeMs` by at most the elapsed time (R-73, R-76). `window.__wordcell` also exposes
> `swState(): 'none' | 'installing' | 'waiting' | 'active'` and `precacheComplete(): boolean`.

---

## H-12 (Minor, decision-needed) — The finish is written as two `setItem` calls; R-84 forbids partial state

**Pair.** AD-4 ("write session (+ history if changed), same task") vs AD-15 (a write failure throws
to the fatal surface). A `QuotaExceededError` on the second `setItem` leaves one key written:
Session won but no record, or record present but Session still playing. After a relaunch,
`reconcileHistory` on Undo either removes nothing or removes a record whose finish is not in the
Session. Being in the same task does not make the two writes atomic.

**Proposed AD-4 text (Jared to confirm the residual):**
> Finish and un-finish write the history first, then the Session. Before writing, the store
> serialises both and checks their combined size against the estimated remaining quota. If the
> Session write fails after the history write succeeded, the store restores the previous history
> value (a third write, of known-good bytes) and then throws. The residual (a crash between the
> writes) is accepted and recorded in Assumptions.

---

## H-13 (Minor) — The Workbox precache defaults exclude the dictionary and font, and the size limit is near

**Pair.** AD-8/AD-16 ("the precache holds … the font … and the dictionary", "Workbox precaches
`assets/` entries without a revision parameter") vs a compliant `vite.config.ts` using
`generateSW` defaults. vite-plugin-pwa's default `globPatterns` is `**/*.{js,css,html}`, so
`.txt`, `.woff2`, `.png`, `.svg` and `.webmanifest` are not precached, and the offline test fails.
The default `maximumFileSizeToCacheInBytes` is 2 MiB. The filtered ENABLE list at LF is about
1.7 MB, so a future list or language can silently fall out of the precache: Workbox only warns.
The "no revision parameter" claim depends on `dontCacheBustURLsMatching` matching Vite 8's
hash format, and the spine does not pin that.

**Proposed AD-16 text:**
> `workbox.globPatterns = ['**/*.{js,css,html,txt,woff2,png,svg,webmanifest}']`,
> `maximumFileSizeToCacheInBytes = 4_000_000`, `dontCacheBustURLsMatching = /^assets\//`. The
> `pwa` project asserts two things: (a) exactly one network request for the dictionary URL across
> first load plus SW install, and (b) the generated `sw.js` precache manifest contains the
> dictionary and font entries without a `revision`. The build fails if any precached file exceeds
> the limit.

---

## H-14 (Minor) — Ghost cards and tiles share a `CardId` key, which breaks FLIP and test ids

**Pair.** AD-14 ("every card and tile element is keyed by `CardId` and carries `data-card-id`")
vs EXPERIENCE State Patterns (Composing: "S ghosts in the source column", free letters hatched in
their cell, and the same cards as tray tiles; Place: "S and D cards shown as ghosts"). Every such
card has two elements with the same `data-card-id`. The FLIP ticket (epic 5) will animate the first
match. The Playwright helper `card-<CardId>` (conventions) may resolve to the ghost, and the
`locator` fails on a strict-mode duplicate.

**Proposed AD-14 text:**
> A card has exactly one **live** element at a time, which carries `data-card-id` and is the FLIP
> identity. In Composing and Place the live element of an S, D or free-letter card is its tray or
> strip tile. Ghosts carry `data-ghost-of="<CardId>"`, have no `data-card-id` or `data-testid`,
> and never animate. A D card in the destination column during Composing is live in the column,
> and its tray block copy is a ghost.

---

## H-15 (Minor) — Reduced motion and animation speed exist in CSS only; a WAAPI FLIP cannot read them

**Pair.** AD-10 ("`--wc-base-ms` on the root … `prefers-reduced-motion` is applied in CSS") vs the
Deferred item "Web Animations vs CSS transitions — epic 5 decides". If epic 5 picks WAAPI (the
natural tool for FLIP with stagger and "complete at once"), its durations come from JS. It ignores
the CSS media query and has to parse a custom property. The spine's own deferral lets epic 5 break
the reduced-motion rule while staying compliant.

**Proposed AD-10 text:**
> `prefs.svelte.ts` exposes `motion = { baseMs, reduced }` as `$derived`, where `reduced` comes from
> a `matchMedia('(prefers-reduced-motion: reduce)')` listener. Every JS animation takes durations
> from `motion`. Every CSS animation uses `--wc-base-ms`, and a `--wc-reduced: 1` custom property
> is set on the root by the same module. `src/ui/motion.ts` is the only place that computes the
> reduced-motion replacement (the 120 ms fade).

---

## H-16 (Minor) — `reconcileHistory`'s `before` is either the accrued or the raw session

AD-4's sequence runs `accrue` and then `apply`, and passes `before` to `reconcileHistory`. That
could be the pre-accrue session or the accrued one. For a finish, `gameRecord(after)` is the same
either way. The difference appears only if a future change lets `accrue` run while the game is not
playing. It is also a trap for a hand-written store test that builds `before` without accruing.
Separately, the diagram omits the `lang` argument that AD-6's signature has.

**Proposed AD-4 text:**
> `before` is the accrued session, the input that `apply` received. The diagram's call is
> `reconcileHistory(records, accrued, after, lang)`.

---

## H-17 (Minor) — Boot order vs font check vs first-launch write

AD-16's order has no step for the AD-15 `document.fonts.load` check. AD-7's "no stored Session →
createSession and write it" happens at step 3. So a font failure on first launch shows the fatal
surface ("storage untouched") after a Session has already been written. It also shows it before
the Board mounts, or after, depending on the ticket.

**Proposed AD-16 text:**
> Order: `nav.replaceState` → `document.fonts.load` (a failure goes to the fatal surface, nothing
> has been written) → load prefs → load Session and history (write a fresh Session only here) →
> push boot overlays (H-5) → mount UI → …

---

## H-18 (Minor) — `wordcell:prefs` and the store both claim "write on change" timing

This pair is compliant but untidy. AD-10 writes prefs "on every change", and AD-4 writes the
Session on dispatch. The spine does not say whether prefs participate in the pagehide flush. That
is harmless today, but the flush order will matter if H-3's `halted` state has to block prefs
too.

**Proposed AD-10 text:**
> Prefs writes are immediate and are not part of the flush. `halted` (H-3) also blocks prefs
> writes.

---

## Contradictions with the spec or UX

| # | AD | Conflicts with | Fix |
| --- | --- | --- | --- |
| C-1 | AD-2 "a command in the wrong phase … throws" (no per-case list) | R-31 flip on an empty column "inert (not an edit)", an engine sentence that needs a unit test | H-6 command table: flip at k = 0 is a same-reference no-op |
| C-2 | AD-4 "store never writes when … accrue added nothing" vs AD-7 "writes … on hidden and on pagehide" | R-73 "saved … whenever the app becomes hidden" | State that the hidden and pagehide flush writes unconditionally while `active`, and never while `rejected` or `halted` (H-3) |
| C-3 | AD-7 hidden write (unguarded) | §2 "the stored session is not overwritten until the player starts one" | H-3 store state union |
| C-4 | AD-4 New game via `createSession` with no clock reset | R-74 fresh Session `activeMs = 0`; R-76 | H-3 `clock.take()` discard |
| C-5 | AD-3 "a component may combine a `GameView` flag only with shell state …" plus the UI computing k from the tapped card | R-31 (tap → k, top of D → k − 1) is legality arithmetic | H-4 `kIfTapped` |
| C-6 | AD-12 overlay state "UI state" with no owner, AD-13 close handlers | EXPERIENCE: end sheet collapse on back (not close), winning deferral, Undo closes it, boot push order | H-5 |
| C-7 | AD-11 "the shell adjusts `scrollTop`" | Layer table: layout is `src/ui/` | H-8 |
| C-8 | AD-1 check 2's `history` token | AD-6/AD-7 names, and EXPERIENCE's "History notice" component names | H-2 |

## What holds up

AD-5 (frozen deal plus golden test), AD-6's record shape against R-84/Q-35, the one-writer
dispatch idea, `GameView` as the only derived source, `$state.raw` with a same-reference no-op,
and the `?url` hashed dictionary are all sound once the holes above are closed. No AD reopens a
confirmed Q-xx.
