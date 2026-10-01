# Review log — spec-epic-4-board (SPEC.md + rule-coverage.md + build-notes.md)

State: pass 3: done

Mode: docs, thorough, max 7. Pre-loop: HEAD 1c93404; copies at SPEC.review-log.passes/pass0/; words 8184 (SPEC 3515, rule-coverage 2298, build-notes 2371).
Caller rule: stop as diverging if majors rise pass-over-pass.

## Pass 1 — 2026-10-01
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 19, minor 13, decision-needed 0  |  Dropped in triage: 0 (duplicates merged across lenses)
### Applied (sent to fixer)
- [major] CAP-4/F9 — `act()` cancel-first on the Blocking message before the controller exists (standalone Halted surface) → 1
- [major] CAP-1/build-notes — `BAND_ORDER` shape contradictory (11 bands vs 9 ids, gaps separate); invalid `?bands=` → 2
- [major] CAP-7 — drag replacing a selection: old selection visuals mid-drag under F12; drag from the selected source column unspecified → 3
- [major] CAP-4/CAP-8 — after `cancel()`/`pointercancel` the held pointer's later events, destination-card press and long-press timer; `lostpointercapture`, non-primary buttons → 4
- [major] CAP-4 — the before-back cancel must be distinguishable (no `deselect()`) from hide/Undo cancel → 5
- [major] CAP-5 — peek / hover-peek open state has no owner in the overlays store → 6
- [major] CAP-4 — press resolution: tray/strip tiles and WordCell stack cards carry `data-card-id` → 7
- [major] rule-coverage AD-12 cancel-first P4 — second-touch Undo unwritable; second pointer must not block native buttons → 8
- [major] CAP-3 — banner-during-scroll test not reproducible → 9
- [major] Assumptions/rule-coverage S rows — node Vitest needs pure seams (classify, gate injection); AD-16 S unwritable → 10
- [major] F20 — contradicts AD-11 text; builder must stop under Policy unless the spec states the spec-wins supersession → 11
- [major] rule-coverage R-75/R-65/R-22 — fixtures cannot carry the assertions (gave-up cells empty; no Idle non-empty cell; no empty-column Idle) → 12
- [major] CAP-1/CAP-3 — innerHeight-only re-layout outcome unspecified, untested → 13
- [major] CAP-9/F14 — overflow decided by a guessed-padding formula, not the rendered sheet → 14
- [major] CAP-6/build-notes — deselect on capture `pointerdown` clears selection on long-press/pan; must be a completed tap → 15
- [major] F13 — press during fly-back must act on the settled layout → 16
- [major] CAP-9 — sticky view must scroll (pan-y) and close only on a tap → 17
- [major] CAP-10/F18 — retro R6's `loaded()` pattern dropped → 18
- [major] CAP-8/CAP-9 — WordCell tap/drag in Composing and Place in epic 4 unspecified → 19
- [minor] R6/R7 labels swapped in build-notes and F18 → 20
- [minor] R-03 test named `AD-3` against the naming rule → 21
- [minor] CAP-1 inset case lacks expected numbers → 22
- [minor] CAP-1 no case for height rule above innerHeight (desktop 720) → 23
- [minor] CAP-6 re-select both directions → 24
- [minor] C-E4a letter read vs `QU` ×2 badge → 25
- [minor] CAP-9 hover peek must close on `pointerdown` → 26
- [minor] DESIGN.md desktop foot number and Undo/Redo tooltips dropped silently → 27
- [minor] rule-coverage: AD-11 tray-growth bounding-box test unrouted (P5) → 28
- [minor] Success signal "lights while over it" needs `touchHold` → 29
- [minor] Constraints test split vs `dist-smoke` row; "dist-smoke build" wording; Game-over fixture unnamed → 30
### Default applied (technical)
- all 19 majors take the reviewers' recommended defaults (see fixer items)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (duplicates across lenses merged)
### Fixer outcome
All 30 items applied (fixer summary): new Decisions F21 (innerHeight-only re-layout), F22 (BAND_ORDER units), F23 (press resolution by data-place), F24 (cancel({ byBack })), F25 (deselect on completed tap); new scripted fixtures planned `session-idle-empty-column`, `session-gave-up-after-commit`; numbers checked against DESIGN.md arithmetic; `Locator.dispatchEvent` checked in Playwright 1.63. Unverified: band unit id names ([ASSUMPTION]), Chromium pointer events on disabled buttons (as before).
Words: 10011 (1.22 x pass 0)  |  Snapshot: SPEC.review-log.passes/pass1/ ; fix diff pass1.fix.diff

## Pass 2 — 2026-10-01
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 11, minor 18, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
### Applied (sent to fixer)
- [major] CAP-4/F9 — Halted.svelte mounts both standalone and inside App; exemption of its Reload ambiguous → 1
- [major] F21 — innerHeight-only change deviates from AD-11 "anchor rule applied" and its 412 × 780 → 710 example contradicts itself → 2
- [major] F25/CAP-6 — outside-tap predicate also matches a WordCell long-press release and the sticky-view scrim tap; tap + click double trigger; `deselect()` with nothing selected undefined → 3
- [major] CAP-6/CAP-9/F25 — long-press on an empty WordCell with a tail selected must deselect (EXPERIENCE.md: treated as a tap) → 4
- [major] F24/CAP-4/rule-coverage — `cancel()` deselect scope contradicts build-notes/AD-12 (only a drag that replaced a selection); hide flush would pop or throw → 5
- [major] CAP-4 — a dead (cancelled) pointerId must not block new pointers → 6
- [major] CAP-3 scroll test — 412 × 700 scroll range 22 px; one-way loop stops firing scroll → 7
- [major] Constraints/F20 — spec waives AGENTS.md "stop and report the spine bug"; report must reach the owner at the spec gate → 8
- [major] CAP-4 — a press crossing 8 px from a column's non-card part or a WordCell is unspecified (EXPERIENCE: inert) → 9
- [major] F2/build-notes CAP-2 — static tray rendering of more than 8 tiles undefined (overflows into labels/WordCells) → 10
- [major] F13/act() — a button press during fly-back must complete it first (EXPERIENCE.md, AD-14) → 11
- [minor] 12–29: second-pointer native click untested; view-sheet mirror pan-y exception clause; long-press then movement; enabled controls clear then act (banner Reload); own scrollTop write marks scroll-busy; height-derived w when nothing fits; `?bands=` empty/repeat/sticky; hover peek order, `top` tag, 14/15 boundary, `grab` cursor; new fixtures' moves truncated; R-82 fixture sets; cancel-first fixture with Undo enabled; setPointerCapture on the re-resolved element; Session-rejected New game in the act list; scrim touch-action; success-signal tail size; sheet animation non-goal (C-E56); R-33 no-op sentence untagged (V + P5 supp.)
### Default applied (technical)
- all majors take the reviewers' recommended defaults; F21 re-stated as AD-11's anchor-offset delta clamped to the scroll range
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
### Fixer outcome
All 28 items applied. Open Questions gains the AD-11 `bannerShown` vs Q-42 spine-bug report (default: latch `dictionary.showBanner`, fold into AD-11 at close-out). F21 now AD-11's clamped anchor delta with exact values (412 × 839 → 779: leftover 101 → 41, delta −60 clamped 0; 412 × 780 → 710: leftover 42 → 0, scroll range 0 → 28). Scroll test 412 × 600 (range 122 px). No commands or tool claims added.
Words: 10844 (1.33 x pass 0)  |  Snapshot: SPEC.review-log.passes/pass2/ ; fix diff pass2.fix.diff

## Pass 3 — 2026-10-01
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 9, minor 18, decision-needed 1  |  Dropped in triage: 0 (duplicates merged)
### Applied (sent to fixer)
- [major] F13/CAP-4 — programmatic `cancel()` (act, hide, back) starts a fly-back still running when the handler acts; "every new press calls cancel()" contradicts the one-pointer rule → 1
- [major] CAP-3 scroll test — instant `scrollTo` fires `scrollend`, gate idles between ticks → 2
- [major] CAP-7 — "Undo pressed during a fly-back" P4 has no procedure or observable → 3
- [major] F24 — hide during a selection-replacing drag: outcome and test missing → 4
- [major] build-notes CAP-4/F25 — controller listens on the board root, so desktop margins and bars never classify; capture/classify of enabled buttons unspecified → 5
- [major] CAP-9 — peek/view of a used WordCell (used top card) unspecified; "empty" undefined → 6
- [major] CAP-4 classify — tap/drag read at `pointerup` vs latched at threshold crossing → 7
- [major] CAP-5/F5 — whether epic 4 wires `DispatchResult` finished/unfinished to the end-sheet state (invisible sheet pushing an entry) → 8
- [major] F18/build-notes CAP-10 — `stored-key.ts` `isStale(key)` would call `storage.ts`, breaking the single-owner rule → 9
- [minor] 10–27: success-signal long-press fixture; foot row `touch-action: none` while selected; horizontal centre tie-break; exactly-25 % case; no hover in Place/Game over; F1/F2/F17 row moves acknowledged in Open Questions; R1 AD-13 record deferral stated; Composing non-card/ghost presses inert; whole-column self-drop highlights placeholder; banner-hide reverse case; second-pointer DOM listener test; banner Reload page-reload branch skips deselect; scroll ignore-flag cleared next frame; clamp range from `bands()` total; anchor delta after w recompute; flying tail `pointer-events: none`; 20 px cancel case pinned
### Default applied (technical)
- all majors take reviewers' defaults
### Decision needed (functionality / UX / gameplay)
- SPEC CAP-9 — WordCell view/peek title wording (player-visible copy missing from the EXPERIENCE.md catalogue, incl. singular) — proposed default: `WordCell 6 · 7 cards` / `WordCell 6 · 1 card`, added to `text.ts` and the catalogue at close-out
### Dropped
- none
### Fixer outcome
All 25 items applied; decision-needed view title appended to Open Questions as PROPOSED BY REVIEW. Marked `unverified`: a held CDP touch pan fires no `scrollend` before release (scroll test, ticket checks). Cancel-from-code returns the tail at once; classify latches drag at ≥ 8 px; controller on the App root; end sheet not wired in epic 4; `stored-key.ts` never imports storage.
Words: 11824 (1.44 x pass 0)  |  Snapshot: SPEC.review-log.passes/pass3/ ; fix diff pass3.fix.diff
