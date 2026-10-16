---
title: 'Screen-reader labels and live region'
type: 'feature'
ticket: '13'
created: '2026-10-15'
status: done
baseline_revision: '1b663dadaf953abf386bc7884bcb7aef07895af3'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-screen-reader-labels-and-live-region.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-screen-reader-labels-and-live-region.review-log.md'
warnings: ['oversized']
deferred:
  - summary: >-
      The no game.dispatch( scan in labels.test.ts covers a listed set of src/ui files, not the directory.
    evidence: |-
      AD-1 bans import.meta.glob under src/; all current sites are adopted. Add a tree scan when a new dispatching module appears.
    location: >-
      src/ui/labels.test.ts
    severity: low
  - summary: >-
      The Playwright hidden-return test passes without the document.hidden guard; only the announce unit test covers it.
    evidence: |-
      No pending set exists when the page is hidden in the e2e flow.
    location: >-
      e2e/screen-reader.spec.ts
    severity: low
---

<intent-contract>

## Intent

**Problem:** Cards, WordCells, feet and the tray have no screen-reader names, and no phase, commit, Undo/Redo or outcome change is announced (CAP-11).

**Approach:** `text.ts` name and announcement entries; Card, Column, WordCellRow and tray render them; one `src/ui/announce.ts` (`dispatchAnnounced`, `announceReset`, `announceOutcome`) sets one polite live region mounted once at the App root. The ticket file (Labels table, State table, Live region, Announcer, Commit and Outcome triggers) is the contract; the plan does not restate it.

## Boundaries & Constraints

**Always:** Every string is a `text.ts` entry. A mirror never carries a name. Only the announcer sets the region. Word, cell and delta come from the PRE-dispatch view for a commit; a missing `draft.word`, `draft.letterCount`, `place.target` or `place.scoreDelta` throws to AD-15. Resulting phase text is `Composing. {WORD}, {N letters}.`, `Place. {WORD}, {N letters}.` or `Idle.` (closes review pass 7 major 1; the ticket's Phase row already defines all three). The no-op test runs after time has elapsed (pass 7 major 2; `changed`, not session identity, is the signal).

**Never:** No focus-order or roving change (keyboard ticket 6.11 owns `tabindex`/focus: this ticket adds `role="button"` and names only, and a WordCell card other than a non-used cell's top gets `aria-hidden`, no role, never focusable). No `game.dispatch(` left in `src/ui` outside `announce.ts` (scan test). No inline `aria-label` string in `WordCellRow`, `Column`, `Card`, `Tray`, `src/ui/tray/*`. No change to engine, shell or the deal. Buried WordCell cards stay hidden (owner decision 2026-10-15).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Commit | Confirm, wordCount 2 to 3, pre-view place.target 6, scoreDelta 30 | `BALKED placed on cell 6, plus 30` | missing field throws |
| Win | Confirm that wins | commit string, then in a later frame `srOutcome` once the sheet opens | no outcome if `openDeferred` returns false |
| Give up | `giveUp` | only the outcome sets the region, e.g. `Game given up. Score minus 12, Wordsmith.`; the penalty line is not read | none |
| Repeat reject | Validate same word twice | two separate sets | none |
| No-op | `changed` false after elapsed time | no set | none |
| Hidden return | `visibilitychange`/`pageshow` | silent; a pending rAF set is dropped on hidden | none |

</intent-contract>

## Code Map

- `src/ui/text.ts` -- add name/announce entries next to `letters`, `invalidWord`, `bandName`, `minus`, `plus`, `flip`; WordCell/column/foot/tray templates, `delta`, phase strings, `srOutcome`.
- `src/ui/announce.ts` (new) -- `dispatchAnnounced`, `announceReset(prefix)`, `announceOutcome()`, region element setter with clear + rAF latest-wins; commit/outcome queueing.
- `src/ui/App.svelte` -- mount the region once at the root outside the `{#if}` branches and any inert wrapper (`mainInert` is on `<main>` only).
- `src/ui/Card.svelte`, `Column.svelte`, `WordCellRow.svelte`, `src/ui/tray/*`, `Tray.svelte` -- names via new Card props (`name?: string`; the parent computes it from `GameView` + overlays selection: `ColumnView.cards` is top to bottom per `view.ts`, `i` = index + 1); `role="button"` on live non-mirror named cards; `aria-hidden` on non-top cell cards; foot `role="group"`. Card carries no letter/place logic itself.
- `src/ui/commands.ts`, `src/ui/gestures/controller.ts` (lines ~415, 861, 868), `Menu.svelte:62` -- replace `game.dispatch` with `dispatchAnnounced`.
- `src/ui/new-game.ts` -- `newGame()`/`replayDeal()` call `announceReset` after the store call.
- `src/ui/end-sheet.ts` -- `openDeferred` returns whether it opened (overlays.svelte.ts); `onDispatched` calls `announceOutcome()` only when it did.
- Tests: `src/ui/announce.test.ts`, `labels.test.ts` (UI Vitest, `AD-3` names), `e2e/screen-reader.spec.ts` (`A-E9`); also `e2e/globals.d.ts`/test hook unchanged. Build notes: `build-notes.md` gets the full string and trigger list.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/text.ts` -- add all strings; `QU` name `Q U, counts as two letters`; plural forms via `letters`; `minus N` never U+2212.
- [x] `src/ui/announce.ts` -- announcer as above. Hidden-page rAF: on `visibilitychange` to hidden, cancel any pending rAF and drop the pending set (resolves the review minor; the listener lives here as a read of `document.hidden` at set time, not a new `visibilitychange` listener, which AD-9 allows only in `game.svelte.ts`: instead, in the rAF callback, skip the set when `document.hidden`).
- [x] `src/ui/App.svelte`, `new-game.ts`, `end-sheet.ts`, `overlays.svelte.ts`, `commands.ts`, `controller.ts`, `Menu.svelte` -- wiring.
- [x] Card/Column/WordCellRow/tray -- labels. Tray-tile families (live tiles in Composing and Place, left to right; D-block copies and strip mirrors unnamed) are named in both phases using the tray template; `n` counts live named tiles only. Card props plumbing: parents pass `name`, `selected`, `destination` flags; `i`/`n` are computed by the parent.
- [x] Tests -- UI Vitest cases per ticket AC bullet, plus: Place to Composing and Composing to Idle phase strings, redo-from-Place target (commit uses the pre-view `place.target`), Give-up outcome example with penalty not read, hidden-page rAF drop, no `game.dispatch(` scan. Playwright (android) per ticket AC; win ordering under zero animation is Vitest-only (fake rAF with synchronous settle); Playwright asserts commit-then-outcome with the normal animation.
- [x] Docs -- `build-notes.md` string and trigger list; record EXPERIENCE.md Accessibility Floor and SPEC CAP-11 exception for buried WordCell cards as a close-out note in Implementation Notes (docs not edited here).

**Acceptance Criteria:**
- Given the ticket file's Acceptance Criteria, when `npm run test:all` runs, then it passes, and `npm run test:screens` shows no baseline change.
- Given a repeated identical announcement, when set twice, then a test-side MutationObserver sees two sets.

## Implementation Notes

Unapplied review minors resolved: hidden-page rAF (skip on `document.hidden`, implemented); tray-tile families (named in Composing and Place); `ColumnView.cards` top to bottom (stated); Playwright win ordering is Vitest-only under zero animation (stated); Card props plumbing (parent computes name); roles/focus boundary with 6.11 (Never); Give up outcome example (matrix); phase transition tests and redo-from-Place target test (tasks).

## Plan Change Log

## Review Triage Log

### 2026-10-15 — Review pass
- verdicts: 4 patch, 2 deferred, 5 rejected groups (per-finding rows grouped by root cause)
- findings:
  - `[medium]` `[patch]` Playwright AC lacks used WordCell, QU card and QU top-card names; Vitest AC lacks inert-ancestor cases for panel/dialog/notice — fixer re-engaged to add tests.
  - `[low]` `[patch]` announce edge paths untested (queued outcome dropped by a later say, region.destroy cancelling the frame) — tests added.
  - `[low]` `[defer]` `game.dispatch(` scan covers a listed set of files, not all of src/ui (import.meta.glob banned by AD-1) — recorded in deferred.
  - `[low]` `[defer]` e2e hidden-return test cannot fail without the guard; the unit test covers the guard — recorded in deferred.
  - `[low]` `[reject]` Give up title: matrix example says `Game over.`, code uses the existing end-sheet title `Game given up.` — plan edits are out of scope; reported to the owner in the result.
  - `[low]` `[reject]` ghost cards unnamed leave a gap in `card i of n` — ticket defines `i` by `ColumnView.cards` order.
  - `[false]` `[reject]` top card `role="button"` is not focusable / read twice — the ticket specifies a named non-focusable top-card button and hides the rest.
  - `[false]` `[reject]` queued outcome lost by `say()` cancel — only an Undo can follow a win before settle, and Undo cancels the outcome by design (CAP-5).
  - `[false]` `[reject]` `announceReset` throws before overlay reset — a missing region is a bug and fails fast (rule 6); the ticket orders the call after the store call.
  - `[false]` `[reject]` pre-dispatch throw without a view, unchecked casts, plan checkboxes — `dispatch` throws when not active anyway; casts on indices validated by construction; checkboxes ticked.

## Verification

**Commands:**
- `npm run test:all` -- expected: all suites green
- `npm run test:screens` -- expected: no baseline change (Docker); if Docker is unavailable, record it

**Manual checks (if no CLI):**
- None.

## Auto Run Result

**Summary:** Cards, WordCells, feet and tray tiles have names; `src/ui/announce.ts` drives one polite live region mounted at the App root. All nine review-log minors are resolved in the plan (hidden-page frame skip implemented).

**Files changed:** `src/ui/text.ts` (strings), `announce.ts` (announcer), `App.svelte` (region), `Card/Column/WordCellRow/tray/TileRows` (labels, roles), `commands.ts`, `controller.ts`, `Menu.svelte`, `new-game.ts`, `end-sheet.ts`, `overlays.svelte.ts` (wiring), tests (`announce.test.ts`, `labels.test.ts`, `e2e/screen-reader.spec.ts`, `e2e/helpers/live-region.ts`, edits to `smoke`, `dictionary`, `commands`, `end-sheet`, `new-game` specs), `build-notes.md`.

**Review:** patches applied: missing Playwright names (used, QU card, QU top card), inert-ancestor cases, announce edge tests. Deferred: two low (see frontmatter). Rejected with reasons in the triage log.

**Follow-up review recommended:** false.

**Verification:** `npm run test:all` exit 0 on the final tree. An earlier run had load-dependent Playwright timing failures that passed alone and in the rerun. `npm run test:screens` was not run (Docker); no visual styling was added.

**Residual risks / owner:** (1) Give-up outcome title is `Game given up.` (existing end-sheet title), not the plan matrix's `Game over.`; (2) EXPERIENCE.md Accessibility Floor and SPEC CAP-11 need the buried-card exception (not edited); (3) `test:screens` baseline unconfirmed.
