---
title: 'Surface foundation and the one New game function'
type: 'feature'
ticket: '1'
created: '2026-10-14'
status: done
baseline_revision: 'a27a69055eb624f3d75642a5ce1b16b7baf72c02'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/specs/spec-epic-6-surfaces/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-epic-6-surfaces/build-notes.md'
warnings: ['oversized']
deferred:
  - summary: >-
      Focus start, focus return to the opener and the act() caller mount have no executed test (Vitest runs in node, no jsdom; the ticket's App-mount unit tests are not possible without adding jsdom).
    evidence: |-
      Verification-gap lens and intent auditor: removing restoreFocus or focusStart leaves every test green; Dialog's own focusOnReturn masks dialogs. Needs owner approval for jsdom (rule 7) or a Playwright check once entry 2 supplies a real opener.
    location: >-
      src/ui/presence.svelte.ts, src/ui/Sheet.svelte, src/ui/Panel.svelte
    severity: medium
  - summary: >-
      Sheet and Panel reduced-motion branch is proved by source scan only and both are tree-shaken from dist/ until an opener exists; the build-output check requires at least two branches (Dialog, WordCellView).
    evidence: |-
      Raise the expected count and add a computed-style check on mounted Sheet and Panel in entry 2.
    location: >-
      e2e/pwa/build-output.spec.ts
    severity: low
  - summary: >-
      presence onend does not check event.target, so a descendant's opacity transition ending could unmount an exiting Sheet or Panel early (the transition lives on children there, so a plain target check would break them).
    evidence: |-
      maybe-false: cards in a sheet carry no opacity transition today; settle when entry 2 puts real content in a Sheet.
    location: >-
      src/ui/presence.svelte.ts
    severity: medium (unverified)
  - summary: >-
      A Dialog destroyed by a parent {#if} gets no exit fade and no presence focus restore; reopen during an exit records the wrong opener.
    evidence: |-
      Existing Dialog callers keep focusOnReturn; later entries mount Dialog with open bound to the store.
    location: >-
      src/ui/Dialog.svelte, src/ui/presence.svelte.ts
    severity: low
---

<intent-contract>

## Intent

**Problem:** Epic 6's surfaces (menu, panels, confirms, sheets) have no overlay ids, shared components, open helper or transition, and nothing guards New game's single call site.

**Approach:** Implement the ticket file as written (`story-surface-foundation-and-the-one-new-game-function.md`, its Description, Guards, Motion, Tests and ACs are the contract): six new OverlayIds with the AD-13 pair guards, `openSurface`, Sheet/Panel/Dialog, `initMotion`, App `inert`, the single-site scan.

## Boundaries & Constraints

**Always:** Rules 1–7 of AGENTS.md; spec wins over spine; every handler on shared components wrapped by callers in `act()`; `overlays.svelte.test.ts`, `history-notice.svelte.test.ts`, `hover-peek.test.ts`, `act.test.ts`, `e2e/history-notice.spec.ts`, `e2e/history.spec.ts`, `e2e/wordcell-view.spec.ts` stay green (edit only where the ticket says WordCellView's "No transition" assumption changes).

**Never:** WAAPI or `duration('overlay')` for surfaces; Esc wiring (entry 10); a new nav API; a new screenshot baseline; changing `new-game.ts` behaviour; any inline `120ms` literal in surface CSS.

</intent-contract>

## Code Map

- `src/ui/overlays.svelte.ts` -- add six ids, `MODAL_TOP` additions, table-driven legal-top pair guard in `open`, resetConfirm legal-top rule; `OWN_OPERATION` unchanged.
- `src/ui/open-surface.ts` (new) -- `openSurface(id)`; nav op queue is the wait.
- `src/ui/Sheet.svelte`, `src/ui/Panel.svelte` (new), `src/ui/Dialog.svelte` -- shared components, build-notes § Per-surface behaviour.
- `src/ui/WordCellView.svelte` -- gets the open/close transition; update "No transition" comment.
- `src/ui/App.svelte` -- `main` inert for any new id, resetConfirm or historyNotice.
- `src/ui/motion.ts` -- export the 120 ms constant, add `initMotion()` (sets `--wc-fade-ms`); `src/main.ts` calls it right after `prefs.load()`.
- `src/ui/act.ts`, `src/architecture-ad2-ad12-ad17.test.ts` (HANDLER_ATTRIBUTE gains `close`; Sheet and Panel join ACT_EXEMPT_FILES).
- `src/architecture-new-game.test.ts` (new, via `architecture-scan.ts`) -- no `game.newGame(` outside new-game.ts, tests, `src/architecture-*`; positive control.
- `e2e/pwa/build-output.spec.ts` -- hook-free build-output case (see Motion check).
- `e2e/wordcell-view.spec.ts` -- `AD-14 WordCell view open/close transition` P6 spec (dev server, no screenshots).
- Read-only reference: `src/shell/nav.ts`, `src/ui/new-game.ts` (unchanged), `src/ui/history-notice.svelte.ts`.

## Tasks & Acceptance

**Execution:**
- [ ] `src/ui/overlays.svelte.ts` -- six ids, legal tops, stack-length matrix, peek/hoverPeek/tileSelection rules, `select`/`expandEndSheet`/`openView` throw under a new id -- ticket Guards
- [ ] `src/ui/open-surface.ts` -- clear selections, close view/peeks, modal-notice pre-check, then open -- SPEC F8
- [ ] `src/ui/Sheet.svelte`, `Panel.svelte`, `Dialog.svelte` -- focus start/return, scrim rules, safe-area, 80 % max height with visible close, action `style` prop, transition class with `transitionend`/`transitioncancel` exit -- SPEC F5-F7
- [ ] `src/ui/App.svelte`, `WordCellView.svelte` -- inert and transition; focus return after the inert flush
- [ ] `src/ui/motion.ts`, `src/main.ts` -- `initMotion`; surface CSS uses `@container style(--wc-reduced: 1)` with `transition: opacity var(--wc-fade-ms)`
- [ ] `src/architecture-*` -- `close` handler attribute, exempt files, single-site scan
- [ ] Unit/UI Vitest per ticket Tests (AD-13 matrix, openSurface cases, Motion U, act mounts, focus return, inert mounts)
- [ ] `e2e/pwa/build-output.spec.ts` -- **Gating check for the reduced-motion branch (resolves the ticket's open major):** a case, hook-free so it runs in `dist-smoke` against `dist/` after `npm run build`, reads every `dist/assets/*.css` and asserts the `@container style(--wc-reduced` query survived minification and its branch contains `var(--wc-fade-ms)` and no literal `120ms`. The dev-server P6 spec below separately proves the computed style under `reducedMotion: 'reduce'`. If the query is rewritten or dropped by the CSS pipeline, the check fails and the build stops and reports it (rule 7; no silent fallback to another mechanism).
- [ ] `e2e/wordcell-view.spec.ts` -- P6 transition spec: open/close and peek run a `--wc-base-ms` transition, end state shown; reduced emulation runs 120 ms opacity-only; fix any test assuming an instantly settled sheet

**Acceptance Criteria:**
- Given any new id and a legal top, when opened, backed or closed, then the stack depth and nav push/pop counts match the ticket matrix; an illegal pair throws `AD-13 open(<id>) while <top> is the top entry`.
- Given a menu item acts, when it opens X, then the menu closes first ([endSheet, menu] -> [endSheet] -> [endSheet, X]).
- Given a confirm opened from the menu is dismissed, then only the confirm closes.
- Given any new id, resetConfirm or historyNotice is open, then `main` is inert; closing returns focus to the opener after the inert flush.
- Given reduced motion, when a surface opens, then an opacity-only 120 ms transition runs, with `--wc-fade-ms` set by `initMotion()`.
- Given the built `dist/`, then its CSS holds the `@container style(--wc-reduced` branch (gating check above).
- Given a second `game.newGame(` call site, then the scan test fails.

## Implementation Notes

Route full: about 12 files, well over 100 lines. The ticket file is the detailed contract; the review log records seven hardening passes. Open major from the review log (Motion build-check sentence named no test) is resolved by the `build-output.spec.ts` case above, chosen from the reviewer's technical defaults because it runs in the existing hook-free `dist-smoke` gate inside `test:all` and needs no real opener.

## Plan Change Log

## Review Triage Log

### 2026-10-14 — Review pass
- verdicts: 36 findings — high 0, medium 3, low 3, false 6, maybe-false 1 (grouped; the remainder rejected as out of scope or duplicates)
- findings:
  - `[medium]` `[defer]` focus start/return and act() caller mount untested (blind, verification-gap, intent) — no DOM test environment; see deferred
  - `[low]` `[defer]` Sheet/Panel reduced-motion only source-scanned — see deferred
  - `[maybe-false]` `[defer]` transitionend target not compared — a plain check breaks Sheet/Panel, whose transitions sit on children; see deferred
  - `[low]` `[defer]` Dialog under {#if} and reopen-during-exit opener — see deferred
  - `[low]` `[reject]` openSurface not atomic (throws after clearing for illegal non-notice pairs) — the ticket says every other illegal open is left to the store guard (SPEC F8)
  - `[false]` `[reject]` WordCellView cellOf throws on stale cell during exit — cells 3–10 always exist in view.cells
  - `[false]` `[reject]` exit never unmounts at zero duration — BASE_MS is 90/180/320 and the reduced fade is 120
  - `[false]` `[reject]` brace-scan fragility, plan template leftovers, z-index and RTL remarks — minified CSS has no braces in strings; plan housekeeping and styling remarks name no failing case

## Auto Run Result

- Summary: six overlay ids with the AD-13 guards, `openSurface`, Sheet, Panel, extended Dialog, shared presence logic, `initMotion`, App `inert`, the WordCellView transition and the new-game single-site scan. The ticket's open major is resolved: `e2e/pwa/build-output.spec.ts` reads `dist/assets/*.css` and asserts the `@container style(--wc-reduced` branches with `var(--wc-fade-ms)` and no literal `120ms`; it runs inside `test:all`.
- Files: see the diff since the baseline (overlays, open-surface, Sheet, Panel, Dialog, presence, WordCellView, App, motion, main, architecture scans, two e2e specs, two Vitest files).
- Review: 0 patches applied; 4 items deferred (above); the rest rejected with reasons in the triage log.
- Follow-up review recommended: false.
- Verification: `npm run test:all` green; `npm run test:screens` green with no new baselines (subagent run).
- Residual risks: focus start and return are unverified in a browser until entry 2; Sheet and Panel are not yet bundled.

## Design Notes

Style queries on custom properties need no `container-type`; the build-output case proves the query survives the pipeline, and the P6 spec proves it applies.

## Verification

**Commands:**
- `npm run test:all` -- expected: all suites pass
- `npm run test:screens` -- expected: green, no new baselines (Docker)
