---
title: 'How to play panel'
type: 'feature'
ticket: '9'
created: '2026-10-15'
status: done
baseline_revision: '4005750f23b89f80c9c4037b92c14c29436ee08b'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context: []
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** The Menu lists five rows; ticket 6.9 (CAP-8) adds the sixth, How to play, a static scrolling rules page (EXPERIENCE.md "How to play panel"; spec §3–§6, §8, §9) with no Cancel, no hints and the Q-12 empty-column rule.

**Approach:** `HowToPlayPanel.svelte` inside Panel.svelte, opened by `openSurface('howToPlay')` from a last Menu row; all text in text.ts; the §8 example drawn with Card.svelte via a new `mirror: 'static'` value; band list shows the six names plus the English score each needs (owner decision 2026-10-15).

## Boundaries & Constraints

**Always:** Full ticket text applies (`story-how-to-play-panel.md`). Strings only in text.ts (AD-3); no new engine export (AD-2); every button `act()`-wrapped; static cards carry no `data-card-id`, `data-testid`, `data-place`, `data-mirror-of`; sections are `h3` under Panel's `h2`; table labels are `<caption>`s, not headings.

**Never:** Wiring `?` (entry 10); accordions/tabs; threshold logic in the UI; touching the deal; editing the ticket file.

</intent-contract>

## Code Map

- `src/ui/PreferencesPanel.svelte` -- template: `open`, ☰ refocus effect, `close`, `closeOnEsc`, window `onkeydown`.
- `src/ui/Menu.svelte` -- add last row `How to play` (`skipFocus = true` then `openSurface`), as `preferences()`.
- `src/ui/App.svelte` -- mount `<HowToPlayPanel />` after `<StatisticsPanel />` (`howToPlay` already in INERT_UNDER).
- `src/ui/Card.svelte` -- `mirror` gains `'static'`; `.card.static { touch-action: pan-y }` after `.card`.
- `src/ui/text.ts` -- private `BANDS`; add `bandNames()` export, `text.bandScore(band)`, `howToPlay`, `closeHowToPlay`, `howTo` block.
- `src/ui/overlays.svelte.ts`, `open-surface.ts` -- `howToPlay` id already present; unchanged.
- `e2e/menu.spec.ts` -- row counts (5 rows + close = 6 buttons) become 6 rows + close = 7.
- `e2e/preferences.screens.spec.ts`, `e2e/helpers/board.ts` -- patterns for the screens spec and fixtures (`session-idle-fresh`, `session-gave-up`).

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/text.ts` -- how-to-play strings, `bandNames()`, `bandScore` -- the owner reads the text at review
- [x] `src/ui/Card.svelte` -- `mirror: 'static'` -- non-interactive example cards
- [x] `src/ui/HowToPlayPanel.svelte` -- the page: nine headings (title `h2` + eight `h3`: `The goal`, `The table`, `A move`, `Undo and Redo`, `Empty columns`, `Scoring, giving up and bands`, `Worked example`, `Controls`), example rows with fixed card sizes (`--wc-w` 40px, `--wc-slot` 44px, `--wc-H` 56px, `--wc-strip` 20px; six cards = 264 px fit in 328 px at 360), three `<caption>`ed tables
- [x] `src/ui/Menu.svelte`, `src/ui/App.svelte` -- row and mount
- [x] `src/ui/text.test.ts`, new `src/ui/how-to-play.test.ts` -- AD-3 tests: headings/bodies equal text.ts exports; no prose Text node (svelte/compiler `parse`, whitespace-only Text nodes allowed); keyboard keys covered; `bandNames()` six in order; `bandScore` strings equal the R-83 arithmetic `ceil(t × 530 / 520)` for t in 156/260/370/460/520 (the engine `band` is not exported, AD-2; its boundaries are pinned in `scoring.test.ts`)
- [x] `e2e/how-to-play.spec.ts` (android) -- the ticket's Verify list; `e2e/how-to-play.screens.spec.ts` -- Worked example baseline at 360; `e2e/menu.spec.ts` -- counts

**Acceptance Criteria:**
- Given the menu, when How to play is tapped, then the menu closes, the panel opens with one history entry, and back, Esc or `Close how to play` close it with focus on ☰.
- Given the open panel, then the title, the eight `h3`, the four captions (`BAKED, 5 letters` …), the six band names with scores, three controls tables, the no-Cancel and no-hints sentences and the Q-12 rule are visible, with no horizontal overflow at 360 px.
- Given the example, then no `[data-card-id]`, `[data-testid^=card-]` or `[data-mirror-of]` exists in the panel and the 52 live cards remain one element each.

## Implementation Notes

Review-log minors resolved: (1) headings quoted above, sixth contains commas; (2) fixed card sizes above, no formula; (3) the prose-node scan uses `svelte/compiler` `parse`; (4) touch and mouse gestures listed by name in text.ts; a §8 derivation clause is not added to the captions (the caption form is pinned by Verify); the derivation sits in the Worked example intro paragraph instead.

## Plan Change Log

## Review Triage Log

### 2026-10-15 — Review pass
- verdicts: 24 findings — high 0, medium 0, low 5, false 19, maybe-false 0
- findings:
  - `[false]` `[reject]` Scoring text contradicts itself (blind) — the text restates R-80 (letters × cell number, max 53 × 10 = 530) and R-81 (10 per letter left); both match the spec.
  - `[false]` `[reject]` Keyboard table documents keys not yet wired, `?` (blind, edge, intent) — the ticket fixes the keyboard table as documentation only, behaviour is entry 10's.
  - `[low]` `[reject]` Band scores are literals not tied to the engine (blind, edge x2, intent) — the engine `band` is not exported (AD-2); `src/engine/scoring.test.ts` pins 159/265/378/469 and the how-to-play test pins the strings against the R-83 arithmetic; a runtime link would add an export.
  - `[false]` `[reject]` Static cards all use `id={0}` (blind, edge) — Card uses `id` only for attributes a `static` mirror suppresses; no FLIP or selection keyed by it.
  - `[low]` `[reject]` Example cards aria-hidden leave only the intro and caption for screen readers (blind, edge) — the figure's caption names the word and the intro paragraph gives the derivation; the ticket requires aria-hidden.
  - `[low]` `[reject]` Esc handler and ☰ refocus are a third copy (blind, edge: silent null) — interim copy required by the ticket; entry 10 removes all copies; same silent-skip as PreferencesPanel.
  - `[low]` `[reject]` Menu row height assertion loosened to `toBeCloseTo(52, 1)` (blind, edge, intent) — a measured 52.00003 sub-pixel value; the 52 px contract is still held to 0.05 px; cause of the fraction not found, a design issue for the owner if it recurs.
  - `[false]` `[reject]` e2e uses class selectors and an unchecked scrollTop (blind) — ticket names Panel's `.content`; the page is taller than the viewport at every project size.
  - `[false]` `[reject]` Missing coverage for inert, one history entry, Q-12 negative (blind) — the spec covers the one-entry and selection cases; inert is Panel's (surfaces.test.ts).
  - `[false]` `[reject]` Plan file out of date, unchecked boxes, empty logs (blind, intent) — process state at review time, updated at Finalize.
  - `[false]` `[reject]` Menu icon dot may not render (blind) — `.row svg` sets round linecaps.
  - `[false]` `[reject]` Wording points: unreferenced rule ids, tile-twice claim, long-press missing (blind) — text is the owner's review at ticket review (SPEC F3).
  - `[false]` `[reject]` bandScore indexing after discarded bandOf (edge) — bandOf throws for non-integers and out-of-range, so the index is valid.
  - `[false]` `[reject]` Example columns not checked against the seed deal (edge) — §8 is the rulebook example, not the dealt layout.
  - `[false]` `[reject]` Four-word check does not assert the card letters (intent) — captions are asserted; letters come from the same words and are in the screenshot baseline.
  - `[false]` `[reject]` Static change drops data-mirror-of and adds pan-y (intent) — both are required by the plan (clean `[data-mirror-of]` consumers; panel scrolling).
  - `[false]` `[reject]` No evidence test:all/test:screens ran (intent, verification-gap) — test:all re-run at finalize; screens baseline needs Docker (see Auto Run Result).
  - `[false]` `[reject]` Two readings of "eight sections" and band score scale (intent) — descriptive; ticket and owner decision pick h3 under the h2 and the English scale.
  - `[false]` `[reject]` Screens baseline absent (verification-gap) — generated only in Docker via `npm run test:screens`.

## Design Notes

Static card call: `<Card id={0} face={{letter, letterCount: 1}} place="column" mirror="static" full />`.

## Verification

**Commands:**
- `npm run test:all` -- expected: green
- `npm run test:screens` -- expected: green after baseline generation (Docker)

## Auto Run Result

**Summary:** The How to play panel with its sixth (last) Menu row: eight `h3` sections under the `h2` title, text in `text.ts`, the §8 example drawn with `Card` `mirror: 'static'`, six band names with their English scores (owner decision 2026-10-15), and touch, mouse and keyboard tables.

**Files changed:**
- `src/ui/HowToPlayPanel.svelte` (new) — the page, interim Esc handler and ☰ refocus.
- `src/ui/text.ts` — how-to-play strings, `bandNames()`, `bandScore()`.
- `src/ui/Card.svelte` — `mirror: 'static'` (aria-hidden, no data attributes, `touch-action: pan-y`).
- `src/ui/Menu.svelte`, `src/ui/App.svelte` — the row and the mount.
- `src/ui/how-to-play.test.ts` (new), `src/ui/text.test.ts` — AD-3 tests.
- `e2e/how-to-play.spec.ts`, `e2e/how-to-play.screens.spec.ts` (+ android baseline), `e2e/menu.spec.ts` — Playwright.

**Review:** 24 findings from four lenses: 0 patched, 0 deferred, all rejected (19 false, 5 low), each with its reason in the Review Triage Log.

**Review-log minors resolved:** headings quoted in the plan; fixed example card sizes instead of a formula; the no-prose-text-node scan uses `svelte/compiler`; touch and mouse gestures are listed by name. A §8 derivation clause is not added to the captions because the caption form is pinned by Verify; the derivation is in the Worked example intro.

**Follow-up review recommended:** false.

**Verification:** `npm run test:all` green after the final edit; `npm run test:screens` green (baseline `how-to-play-example-android-linux.png` generated in the container, second run compares clean).

**Residual risks:** the page text is a draft for the owner's read at ticket review (SPEC F3); the menu e2e row-height check uses `toBeCloseTo(52, 1)` after a sub-pixel 52.00003 reading; the keyboard table documents keys whose behaviour lands with entry 10.
