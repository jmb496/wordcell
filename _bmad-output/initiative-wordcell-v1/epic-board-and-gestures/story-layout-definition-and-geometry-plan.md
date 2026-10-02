---
title: 'Layout definition and geometry (AD-11 pure core)'
type: 'feature'
ticket: '1'
created: '2026-10-01'
status: 'built'
baseline_revision: 'c3e49c1d4434448ca4a60f6eb9b47514d0ca85f8'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-board-and-gestures/story-layout-definition-and-geometry.md'
  - '{project-root}/_bmad-output/specs/spec-epic-4-board/build-notes.md'
warnings: []
deferred:
  - summary: 'Spine close-out: geometry.ts exports trayGrowth, cardMetrics, availableWidth, anchorScroll, shouldRecomputeWidth beside AD-11''s "two entry points"; fold a note into AD-11 at the epic 4 retrospective.'
    severity: minor
  - summary: 'Entry 4: fractional safe-area insets give fractional heights/anchor (used as measured, no rounding); bounding-box assertions may need sub-pixel tolerance.'
    severity: minor
  - summary: 'Entry 4: on desktop below 360 px clientWidth the horizontal pan scrollbar reduces clientHeight versus innerHeight; check the height rule there.'
    severity: minor
  - summary: 'tickets.toml entry 4 still describes the scroll clamp as layout.svelte.ts''s own work and does not name anchorScroll/availableWidth/cardMetrics; reconcile when entry 4 is pulled (ticket files are not written by a build).'
    severity: minor
---

<intent-contract>

## Intent

**Problem:** Epic 4 needs one band-order definition and pure geometry (AD-11) before any Board, live layout or gesture code exists; nothing in `src/ui/layout/` exists yet.

**Approach:** Add `src/ui/layout/bands.ts` (band ids, `BAND_ORDER`, anchor/slack constants, `?bands=` parser) and `src/ui/layout/geometry.ts` (cardWidth, cardMetrics, availableWidth, bands, trayGrowth, anchorScroll, shouldRecomputeWidth) exactly as the ticket Description specifies, with UI Vitest `AD-11 …` cases pinning every ticket AC number plus the review-log minors resolved below.

## Boundaries & Constraints

**Always:** The ticket Description is the contract for every type, signature and formula (BandId, Unit, BAND_ORDER, parseBandsParam, insets, cardMetrics, availableWidth, bands return shape, AD-11 order-independent growth rule, anchorScroll clamp, shouldRecomputeWidth). Pure modules: no DOM, `window`, `import.meta.env`, timers or Svelte. Growth/anchor computed from unit positions in `bandOrder`, never named neighbours. Insets used as measured (no rounding). cardWidth's first TS parameter is named `clientWidth` (AD-11 positional signature kept; build-notes CAP-1 feeds clientWidth). Test names start `AD-11`. Every number in a test is a literal from the ticket AC or this plan; a mismatch is first rechecked against the formula, then, if it holds, it is a spec bug: stop and report (AGENTS.md Policy), never adjust a literal.

**Never:** No input validation in bands/trayGrowth (rule 6). No shell, engine, component, CSS or e2e change; no gate, layout module or Board (entries 2–4). Do not export a unitId helper unless needed internally. Do not write ticket files or tickets.toml.

## I/O & Edge-Case Matrix

Defaults for every case: insets {0, 0}, hoverFine false, bannerShown false, trayRows 1, default BAND_ORDER, w from cardWidth at that viewport unless a w is stated. `sum` = total − leftover with no banner, trayRows 1. A scroll range upper bound is asserted through anchorScroll only: `anchorScroll(next, next, 1e6, ih)` returns max(0, total − ih) and `anchorScroll(next, next, -5, ih)` returns 0 (the test never re-derives the clamp).

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Ticket AC | every AC bullet of the ticket | its exact numbers | — |
| Fallback order, banner and tray on opposite sides | `topBar,banner,leftover,wordcells,tray,columns,actionBar`, 412 × 839, bannerShown, trayRows 3 | leftover 101 → 57, anchor 161 unchanged, total 887, anchorScroll delta 0 | — |
| Grower above, slack below | `topBar,banner,columns,tray,wordcells,leftover,actionBar`, 412 × 839, trayRows 1 → 3 | leftover stays 101, anchor 609 → 657, total 839 → 887, scrollTop 0 → 48 | — |
| anchorScroll across a w change | 412 × 839 (w 46) → 412 × 700 (cardWidth 40) | anchor 710 → 601, total 722, scrollTop 0 stays 0, range 0–22 | — |
| Fractional insets | 412 × 839, w 46, insets {23.5, 12.25} | topBar 67.5, actionBar 72.25, leftover 65.25, anchor 697.75, total 839 (exact, unrounded) | — |
| Parser empty-first | `?bands=&bands=<valid reorder>` | default BAND_ORDER (first value read, empty → default) | — |
| Parser invalid | unknown id, `footRow`, duplicate, missing id, trailing comma | throws plain `Error` naming the list | thrown to AD-15, never caught |

</intent-contract>

## Code Map

- `src/ui/layout/bands.ts` -- new; types, BAND_ORDER, ANCHOR_BAND, SLACK_BAND, parseBandsParam. Unit ids derived from each unit's first band that is not `trayGap`, `actionGap` or `labels`.
- `src/ui/layout/geometry.ts` -- new; imports from `./bands`. Height-rule band heights per DESIGN.md Layout (topBar 44 + top inset; columns 6 × strip + H; footRow 44; trayGap 4; tray 24 + max(H, 92) + 44 + 16 + trayGrowth; labels 16; wordcells H; actionGap 8; actionBar 60 + bottom inset; banner 44/0). Height-derived w = largest integer w ≥ 40 whose sum fits innerHeight (≤), else 40; result max(40, min(floor(available/8 − 4), height-derived)).
- `src/ui/layout/bands.test.ts`, `src/ui/layout/geometry.test.ts` -- new UI Vitest (included by `vite.config.ts` `src/**/*.test.ts`, node environment). Style reference: `src/ui/motion.test.ts`.
- `src/architecture.test.ts` -- read-only; classifies `src/ui/**` as the ui layer; the new files import nothing outside `src/ui/layout/`.
- Prior plans in this epic: none (entry 1).

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/layout/bands.ts` -- implement per ticket Description -- BAND_ORDER is the single band-order definition (AD-11, F22).
- [x] `src/ui/layout/geometry.ts` -- implement the seven functions per ticket Description, growth by unit position relative to ANCHOR_BAND/SLACK_BAND -- AD-11 order-independent rule.
- [x] `src/ui/layout/bands.test.ts` -- `AD-11` cases: BAND_ORDER units, anchor/slack, parser (absent, empty, `?bands=&bands=<valid>`, repeated, reorder, the five throws via `toThrow()`).
- [x] `src/ui/layout/geometry.test.ts` -- `AD-11` cases for every remaining ticket AC bullet and every matrix row above; deltas and ranges only through anchorScroll.

**Acceptance Criteria:**
- Given the new modules, when `npm run test:all` runs, then lint, check, unit (including every AD-11 case above), build and all e2e suites pass and `src/architecture.test.ts` stays green.
- Given any ticket AC number, when its test runs, then it matches without the literal being edited.

## Implementation Notes

Review-log minors resolved: fallback + banner, w-change anchorScroll, range assertion via anchorScroll, grower-above case, `clientWidth` parameter name, fractional insets (test here; sub-pixel note deferred to entry 4), `?bands=&bands=`, defaults preamble, recheck-before-stop rule all applied above. Spine close-out note, desktop scrollbar corner case and tickets.toml entry 4 recorded in `deferred`. The review log's suggested grower-above anchor "429 → 477" was rechecked: 429 omits the tray unit (44 + 369 + 16); with the tray unit (180) above the anchor it is 609 → 657 (total 887 matches), so 609 → 657 is used; not a spec number.

## Plan Change Log

## Review Triage Log

### 2026-10-01 — Review pass
- verdicts: 18 findings — high 0, medium 2, low 5, false 4, maybe-false 0
- findings:
  - `[medium]` `[patch]` blind: no test checks which band receives banner/tray growth — added heights.tray 224 (412 × 839, trayRows 3) and heights.banner 0/44 assertions.
  - `[low]` `[patch]` blind: parser case-sensitivity and no-trimming untested — added `TopBar,…` and `topBar, banner,…` throw cases.
  - `[low]` `[patch]` blind: "plain Error naming the bad list" not pinned — every throw case now asserts `Error` and `toThrow(list)`.
  - `[low]` `[patch]` blind: only footRow tried as a non-unit id — added trayGap and labels throw cases.
  - `[low]` `[reject]` blind: plan lacks a sentence → test mapping — fix edits this build's plan; the I/O matrix and AC list map every number to a named AD-11 test.
  - `[false]` `[reject]` blind: plan metadata contradictory (in-review, empty triage log) — the review was in progress when the diff was taken; this entry fills it.
  - `[false]` `[reject]` blind: Verification records no results — results go under Auto Run Result at Finalize (test:all green twice).
  - `[low]` `[patch]` blind + intent: `unitId`'s unreachable throw is a rule 6 guard — removed; returns the `find` result with a type assertion, derivation unchanged.
  - `[medium]` `[patch]` verification-gap: banner growth on the opposite side of the slack band never exercised — added `AD-11 banner growth above the anchor with slack below` (leftover 101, anchor 609 → 653, total 839 → 883, anchorScroll 44; rechecked against the formula).
  - `[low]` `[reject]` intent: the AD-15 path of a parser throw is not exercised — the ticket makes the parser pure; the dev-only caller and AD-15 wiring are entry 4.
  - `[low]` `[reject]` intent: `?bands=` dev-only gating not exercised — entry 4 / dist-smoke per rule-coverage.md AD-11 row 2.
  - `[low]` `[reject]` intent: clientWidth / `last` caller contracts unexercised — entry 4's layout module; the parameter name and doc comment carry the contract here.
  - `[false]` `[reject]` intent: scroll clamp in geometry versus the spine's "layout module computes the delta" — the ticket settles it (anchorScroll, called by the layout module); the spine note is in `deferred`.
  - `[low]` `[reject]` intent: exported types Insets, CardMetrics, BandLayout, WidthInputs beyond the Interface line — types callers need; AD-2's export check binds only the engine; covered by the deferred spine note.
  - `[low]` `[reject]` intent: `clientWidth` parameter rename versus spine/SPEC `innerWidth` — positional signature kept, as the plan and review log specify.
  - `[low]` `[reject]` intent: H = 93 growth tested only through trayGrowth — bands calls trayGrowth with cardMetrics(w).H, exercised at w 46; adding a w 70 band case adds no coverage of a distinct path.
  - `[false]` `[reject]` intent: two 60 px shrinks only predicate-level — the ticket defines the predicate with `last` held by the caller; the stateful policy is entry 4's.
  - `[low]` `[reject]` intent (observation): plan file in the diff — expected build artifact, no defect.

## Verification

**Commands:**
- `npx vitest run src/ui/layout` -- expected: all AD-11 cases pass
- `npm run test:all` -- expected: green

## Auto Run Result

- **Summary:** pure AD-11 layout core: `BAND_ORDER` (7 units of 11 band ids), anchor/slack constants and the `?bands=` parser; `cardWidth`, `bands` and helpers `cardMetrics`, `availableWidth`, `trayGrowth`, `anchorScroll`, `shouldRecomputeWidth`, with 32 UI Vitest `AD-11` cases pinning every ticket AC and SPEC CAP-1 number (no literal edited; open question answered: the height-derived search is exact at every reference viewport, including 24/24 insets).
- **Files:** `src/ui/layout/bands.ts` (band ids, order, parser); `src/ui/layout/geometry.ts` (height/width rules, growth, anchor scroll, recompute predicate); `src/ui/layout/bands.test.ts`, `src/ui/layout/geometry.test.ts` (AD-11 cases).
- **Review-log minors:** all twelve resolved in this plan (Implementation Notes and `deferred`); the review log's grower-above anchor "429 → 477" rechecked to 609 → 657 (429 omitted the tray unit).
- **Review:** 18 findings; 6 patched (2 medium, 4 low: growth-band assertions, opposite-side banner case, parser case/trim/non-unit/message cases, unitId guard removed); 0 deferred from review; 12 rejected with reasons above (4 false).
- **Follow-up review:** false — patched mediums were test additions, verified passing; no unverified risk remains.
- **Verification:** `npx vitest run src/ui/layout` 32/32; `npm run test:all` exit 0 after the patches (1696 unit tests, dist-smoke, e2e, pwa green).
- **Residual risks:** the four `deferred` items (spine close-out note, sub-pixel tolerance and desktop scrollbar case for entry 4, tickets.toml entry 4 wording).
