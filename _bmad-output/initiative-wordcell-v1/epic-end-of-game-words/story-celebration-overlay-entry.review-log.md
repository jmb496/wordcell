# Review log — story-celebration-overlay-entry.md
State: pass 3: done
Pre-loop: HEAD 2222705; pass0.md 247 words; budget stated 1500 words.

## Pass 1 — 2026-10-23
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 8 (merged from ~30 raw), minor 7, decision-needed 0  |  Dropped in triage: 2
### Applied
- [major] Description "in `SUSPENDING`" — App.svelte `mainInert` derives from `SUSPENDING`, so the run would make `main` (top bar, action bar) inert, against AD-13 and EXPERIENCE.md → fixer item 1
- [major] AC "game keys ignored" — keys.ts `attempt()` drops every row under `SUSPENDING`, killing Undo keys and `N` that EXPERIENCE.md, rule-coverage and entry 7 need → fixer item 2
- [major] Description `onEnd`/`done` — entry 3's `finish` calls `done` synchronously after `onEnd`; one owner of `done` unstated; double `done` and re-entrant `close` on back → fixer item 3
- [major] Description removal callback — reasons, signature, registration API and per-reason outcome unstated; `onUnfinished` never closes the entry today → fixer item 4
- [major] AC "a WordCell tap" — `LEGAL_TOPS` only guards `open()`; `openView`/`openPeek`/`openHoverPeek` check `MODAL_TOP` only → fixer item 5
- [major] Description `startCelebration` — preconditions incomplete (sticky view on top, peek, hover peek, already open, `open('celebration')`) → fixer item 6
- [major] AC — no tests for illegal start, `end()` pop + microtask `done` once, pop-before-push call order, cancel paths stopping the run, WordCell `Enter` → fixer item 7
- [major] whole ticket — tickets.toml interface, tests, owns, consumers, plan_checkpoint not copied → fixer item 8
### Default applied (technical)
- removal API — `overlays.onCelebrationRemoved(fn: (reason: 'ended' | 'cancelled') => void)`; a later registration replaces; removing the entry with none registered throws `AD-13`
- `done` owner — once attached, the removal callback is the only caller of `done` (queueMicrotask, reason `ended` only); unattached `createCelebration()` instances keep entry 3's synchronous behaviour and tests
- inert — `mainInert` excludes `celebration`
- keys — `undo` and `newGame` rows run while `celebration` is open; `menu` stays ignored until entry 7
- tap gate — intent/controller return no action and the long-press peek does nothing while the entry is open; `celebration` joins `MODAL_TOP` and `OWN_OPERATION`
- start — `startCelebration` closes a sticky view on top and clears the hover peek (as `openDeferred`), throws on anything else
- `Esc` — `pressEscape`'s `close('celebration')` is an end (`ended`); entry 6 refines with its capture listener
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- "Have `attachOverlays()` throw on a second call" — conflicts with per-test attach; replace-on-register chosen instead
- "Make `pressEscape` return false" — EXPERIENCE.md has `Esc` skip; the close-as-end default is consistent
Words (docs): 846 (3.4 x pass 0; budget 1500)  |  Snapshot: story-celebration-overlay-entry.passes/pass1.md
Fixer applied findings 1–13 (8 majors, 5 minors) and the tickets.toml fields (Contract list; `plan_checkpoint: true` in front matter).

## Pass 2 — 2026-10-23
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 6 (merged), minor 11, decision-needed 1  |  Dropped in triage: 0 (duplicates merged)
### Applied
- [major] `done` ownership — both suggested handover mechanisms break (`end()` clears the run before `onEnd`; an `onEnd(done)` handler breaks entry 3's tests) → fixer item 1
- [major] `done` ownership "only while the entry is open" — a defensive guard (rule 6) that silently drops `done` → fixer item 2
- [major] attached `cancel()` undefined vs AD-19 "`cancel()` pops the entry" → fixer item 3
- [major] spine deviations (start closes a sticky view, keys carve-out, `mainInert` exclusion, cancel wording) not recorded as amendments (rule 7) → fixer item 4
- [major] AC — no tests for the no-callback throw and replace-on-register → fixer item 5
- [major] AC Gestures "call no overlays method" fails on today's tap path (`applyTile` → `clearTile()`) → fixer item 6
### Default applied (technical)
- handover — `attachOverlays()` sets a private attached flag (public `onEnd` unchanged); attached `finish` parks `done` as pending, then `onEnd`, then `overlays.close('celebration')`; the removal callback takes the pending `done` or the live run's `done` (back, Esc), stops the run internally, queues `done` for `ended`, drops it for `cancelled`
- fail fast — attached `start()` throws `AD-19` unless `celebration` is the top entry; `end()` always closes; `ended` with no `done` throws; `startCelebration()` throws with no callback registered
- attached `cancel()` while the entry is open throws `AD-19`
- reason is set by the calling path (internal remove with a reason), so `resetForNewSession`'s `close` loop reports `cancelled`
### Decision needed (functionality / UX / gameplay)
- Keys bullet — SPEC Open Questions: "while the celebration runs, `?`, a WordCell tap or `Enter` and the other game keys do nothing" awaits the owner's confirmation at ticket review — proposed default: confirm as written (only Undo, `N`, `M`, ☰, `Space`/`Esc` and back act during the run); the ticket must not call it confirmed
### Dropped
- none
Words (docs): 1237 (5.0 x pass 0; budget 1500)  |  Snapshot: story-celebration-overlay-entry.passes/pass2.md
Fixer applied findings 1–15 (6 majors, 9 minors); the decision-needed item was left unapplied apart from the Keys reword.

## Pass 3 — 2026-10-23
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 2 (merged), minor 12, decision-needed 0  |  Dropped in triage: 1 (plus duplicates merged)
### Applied
- [major] Gestures bullet / AC — a press begun during the run whose tap release comes after `done` opened the sheet reaches `perform` → `tapAction` → `openView` and throws under `endSheet` (intent.ts `viewTap` returns `openView` in Game over); the "even after `done`" clause covers only timer and peek, and no AC tests it → fixer item 1
- [major] Entry bullet / AC — "the run moves no focus" (focus-follow's `SUSPENDING` yield, EXPERIENCE.md "Focus does not move") has no test, though `celebration` is carved out of the other two `SUSPENDING` consumers → fixer item 2
- [minor] Removal callback — the no-callback-at-removal throw is unreachable (start already throws; no unregister) → cut → fixer item 3
- [minor] `done` ownership — the `ended`-without-`done` throw lives in `celebration.svelte.ts`: prefix `AD-19` → fixer item 4
- [minor] `done` ownership — say `attachOverlays()` registers the callback via `onCelebrationRemoved`, and that it deliberately does not use `onEnd` (tickets.toml said it would) → fixer item 5
- [minor] Entry bullet — EXPERIENCE.md says the board stays "inert"; cite AD-13 for not-HTML-inert and add the wording to the close-out refinements → fixer item 6
- [minor] Refinement (d) — `onEnd` fires only for run-driven ends, never back, Esc or cancel; entries 6–7 must not hang teardown on it → fixer item 7
- [minor] AC Esc row — name the assertions (one pop, `ended`, `done` once after a microtask) → fixer item 8
- [minor] Keys bullet — attach the owner-confirmation clause to the do-nothing keys; mark `M` an interim gap until entry 7 → fixer item 9
- [minor] Removal callback — `onUnfinished()` with `celebration` open but not on top: throws as `close()` → fixer item 10
- [minor] Start bullet — the caller holds a live `deferEndSheetOpen()` token before `startCelebration()` (entry 5) → fixer item 11
- [minor] AC Keys row — digits are already gated off in Game over, prove nothing: drop → fixer item 12
- [minor] AC — tickets.toml verify "Undo and New game cancelling": `end-sheet.ts` `onDispatched` (unfinished → `onUnfinished`) is unchanged and covered; the direct calls stand in → fixer item 13
- [minor] AC Gestures — the `openView`/`openPeek`/`peekToSticky` throws with `celebration` on top are untested → fixer item 14
### Default applied (technical)
- press tagging — the controller marks a press begun while `celebration` is open; that press performs no tap, timer, peek or view action whatever the top is at its timer or release (no throw)
- focus-follow — focus-follow.test.ts `AD-13 …`: with `celebration` on top, a `sync` that would move focus moves none
- `onUnfinished()` — closes `celebration` only when it is the top entry, else `close()`'s `AD-13` throw
### Decision needed (functionality / UX / gameplay)
- none new (pass 2's Keys confirmation item stands)
### Dropped
- "Point entry 5's plan at the ☰ interim halt" — the Notes already record it; entry 5 reads this ticket
Words (docs): 1426 (5.8 x pass 0; budget 1500)  |  Snapshot: story-celebration-overlay-entry.passes/pass3.md
Fixer applied findings 1–14 (2 majors, 12 minors); the pass-2 decision-needed Keys item left as awaiting the owner.
