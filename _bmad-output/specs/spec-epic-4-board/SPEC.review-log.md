# Review log — spec-epic-4-board (SPEC.md + rule-coverage.md + build-notes.md)

State: pass 7: done

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

## Pass 4 — 2026-10-01
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 7, minor 14, decision-needed 0  |  Dropped in triage: 0
### Applied (sent to fixer)
- [major] CAP-7/rule-coverage — Undo-during-fly-back P4 calls a Node Locator inside `page.evaluate`; observable passes after the animation ends (gating check unrunnable) → 1
- [major] CAP-4/F8 — controller attach/detach when App switches from the rejected root to the Board after New game (no reload) unspecified → 2
- [major] CAP-3/CAP-4/CAP-9 — native long-press (contextmenu, callout, text selection) at ~500 ms can `pointercancel` the peek on Android → 3
- [major] CAP-9 — used top drawn hatched in the view contradicts AD-14 (view/peek copies are normal cards) → 4
- [major] CAP-3 scroll test — "no banner while the finger is down" contradicts the 150 ms backstop; unverified Chromium claims incomplete → 5
- [major] CAP-4/CAP-6 — presses resolved on the drawn card, not the full slot pitch (DESIGN.md Hit rects); 8 px lift moves the hit area → 6
- [major] CAP-9/F25 — no owner for sheet/scrim tap vs drag; trailing `click` after closing not consumed (AD-12 single controller) → 7
- [minor] 8–21: build-notes "(or `document`)" listener host; long-press on empty cell then move still deselects; available width from `clientWidth`; back-cancel flies back per EXPERIENCE while `act()`/hide settle at once (AD-12 close-out note); mid-drag ghosts as CSS on slot wrappers; word-line slot reserved, only the invalid-word line in it; static-tray clipping named in the deploy question; R-14 Undo row fixture `session-idle-empty-column`; re-measure still > 5 s → stop for owner; sheet `overscroll-behavior: contain`; halt mid-drag → cancel on Board unmount; drag lift gated on `canPickUp`
### Default applied (technical)
- all majors take reviewers' defaults (AD-14 normal-card look for item 4)
### Decision needed (functionality / UX / gameplay)
- none new
### Dropped
- none
### Fixer outcome
All 18 items applied. New F26 (slot wrappers carry the live-card attributes; lift and drag transform move the inner face; overlap uses the face rect; mid-drag ghosts drawn on the untransformed wrappers). Checked: Playwright 1.63 Chromium does not support `-webkit-touch-callout`, so the computed-style check asserts `user-select` only. `unverified`: CDP touch pan scrolls the document; no `scrollend` before release; on-device native long-press (epic 7). Back-cancel flies back; `act()`/hide settle at once (AD-12 close-out note).
Words: 12645 (1.55 x pass 0)  |  Snapshot: SPEC.review-log.passes/pass4/ ; fix diff pass4.fix.diff

## Pass 5 — 2026-10-01
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 3, minor 21, decision-needed 1 (extends the pass 3 item)  |  Dropped in triage: 0; reclassified: snap-back on act()/hide (adversarial major → minor: EXPERIENCE.md "cancel as for pointercancel, then acts" plus "a button press completes any running animation at once" together give the settled snap), desktop tooltips content (major → minor: obvious handling, name now and key with epic 6)
### Applied (sent to fixer)
- [major] F26 — lifted face (no `pointer-events: none`) overlaps the card above, so the hit area moves → 1
- [major] CAP-9 — one-shot trailing-`click` swallower has no expiry and can eat the next real click → 2
- [major] F24/CAP-4/CAP-7 — selection-replacing drag ended by a real `pointercancel`/`lostpointercapture`: store keeps a selection the DOM no longer shows → 3
- [minor] 4–25: fly-back P4 asserts transform/animations on the faces; tray capacity 14 at both widths (Open Questions); AD-11 `clientWidth` close-out note and predicate on the same width (or `scrollbar-gutter: stable`); `byBack` gate-idle wording; bottom-8 px case needs a ≥ 2-card tail; F26 row order; `pointercancel` closes a peek; tap on non-card column parts with nothing selected is a no-op; WordCellView renders inside the Board root; hover timer mouse-only; CAP-6 pan region names the tray band; controller created after the halted check; scroll test fallback (wheel/synthesizeScrollGesture); banner Reload always deselects (retry branch is private); hover peek closes on `pointerdown` only for a drag or modal; tooltips show the accessible name, key with epic 6; AD-17 1 s watch gate; deploy question adds "a win shows no end sheet until epic 6"; F13 cites both EXPERIENCE.md sentences for the settled snap
### Default applied (technical)
- all majors take reviewers' defaults
### Decision needed (functionality / UX / gameplay)
- CAP-9 hover peek `+n older cards` at n = 1 — singular copy missing from the catalogue — proposed default: `+1 older card`; folded into the pass 3 view-title Open Questions item
### Dropped
- none
### Fixer outcome
All 21 items applied; decision-needed singular appended to the PROPOSED BY REVIEW Open Questions item. Checked on Playwright 1.63 Chromium: with `scrollbar-gutter: stable` the desktop `clientWidth` stays 1265 whether or not the page overflows. `unverified`: scroll-test fallback (wheel / `Input.synthesizeScrollGesture`).
Words: 13124 (1.6 x pass 0)  |  Snapshot: SPEC.review-log.passes/pass5/ ; fix diff pass5.fix.diff

## Pass 6 — 2026-10-01
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 3, minor 16, decision-needed 0  |  Dropped in triage: 0
### Applied (sent to fixer)
- [major] F24/CAP-7 — pass 5 item 3 regression: a real `pointercancel` deselecting (own `nav.pop()`) followed by an Android edge-swipe back leaves the app; resolve the other way (restore the old selection's visuals, keep selection and entry) → 1
- [major] CAP-9 — trailing-click swallower disarmed by `setTimeout(0)` may run before Chromium's touch gesture-tap `click`; untested timing → 2
- [major] CAP-9/CAP-5 — desktop hover peek and long-press peek both open on the same cell → 3
- [minor] 4–19: AD-12 close-out for F26 slot-pitch hit rects; R-33 row CAP 9 with P4 supp.; R-32 "(S here)" wording; `footRow` grouped with `columns` as one unit; labels outside `[data-wordcell]`, `pan-y`; placeholder always rendered, revealed by class on whole-column self-drop; candidate rects unclipped by the sticky bars (stated); `openView(cell)` in CAP-5; scroll-test travel within the 122 px range, route failed after the pan starts; reduced-motion fade shape; empty-destination line is epic 5; one shared gate created in main.ts; CAP-8 "no hover outline on other column cards"; new fixtures' version/seed/activeMs; w recompute on `hoverFine` change; wheel fallback `unverified` and project named
### Default applied (technical)
- all majors take reviewers' defaults
### Decision needed (functionality / UX / gameplay)
- none new
### Dropped
- none
### Fixer outcome
All 18 items applied. `unverified`: Android delivers `pointercancel` before back (epic 7); touch `pointerup` → `click` order (gated by the android scrim-over-Undo P4); both scroll-test fallbacks. AD-12 close-out notes added for F13 pointercancel and F26 slot pitch. `BAND_ORDER` now seven units.
Words: 13654 (1.67 x pass 0)  |  Snapshot: SPEC.review-log.passes/pass6/ ; fix diff pass6.fix.diff

## Pass 7 — 2026-10-01 (verify-only)
Reviewers: fix diff only (pass6.fix.diff)  |  Findings: major 0, minor 1, decision-needed 1  |  Dropped in triage: 0
### Applied
- none (verify-only pass)
### Decision needed (functionality / UX / gameplay)
- SPEC CAP-6/CAP-7, F24 (pass 6 item 1) — when a system gesture (e.g. Android edge swipe) interrupts a drag that replaced a tap-selection, should the old selection come back or should nothing stay selected? EXPERIENCE.md step 6 and AD-12 say nothing stays selected ("`pointercancel` = release over nothing"); pass 6 changed it to keep the old selection so that a back arriving right after the cancel clears the selection instead of leaving the app. Not yet in the spec's Open Questions — proposed default: keep the old selection (current spec text), amending EXPERIENCE.md step 6, its Pointer thresholds line and AD-12 at close-out.
### Dropped
- none

## Result — converged after 7 passes
Majors per pass: 19, 11, 9, 7, 3, 3, 0. Words 8,184 → 13,654 (1.67 x).
Decision needed: WordCell view title wording incl. one-card form and `+1 older card` (in Open Questions, PROPOSED BY REVIEW); `pointercancel` after a selection-replacing drag keeps vs clears the old selection (pass 7, log only — not yet in Open Questions).
Owner reports already in Open Questions: deploying epic 4 alone (pre-existing, extended); AD-11 `bannerShown` vs Q-42 spine bug (pass 2).
### Unapplied minors
- SPEC CAP-3 — "recomputes w only per CAP-1's predicate on … or a `hoverFine` media-query change" reads as if the predicate gates the media-query trigger; reword to "always (through the gate) on a `hoverFine` change" and add a UI Vitest or P4 case.
