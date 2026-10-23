# Review log — story-celebration-overlay-entry.md
State: pass 1: done
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
