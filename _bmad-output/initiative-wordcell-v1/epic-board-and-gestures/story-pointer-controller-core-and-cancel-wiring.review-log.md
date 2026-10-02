# Review log — story-pointer-controller-core-and-cancel-wiring.md (ticket 4.6)

State: pass 6: done

Mode: docs, thorough, max 7, budget default (2.5x pass 0). Pass 0: HEAD 6432e75, copy story-pointer-controller-core-and-cancel-wiring.passes/pass0.md, 409 words. Intent includes tickets.toml entry 6 fields interface, tests, owns, unknown (not copied at pull; fixer adds them to the Description in pass 1).

## Pass 1 — 2026-10-02 12:20
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 8, minor 15, decision-needed 0  |  Dropped in triage: 1 (merged duplicates not counted)
Words (docs): 1066 (2.61 x pass 0)  |  Snapshot: story-pointer-controller-core-and-cancel-wiring.passes/pass1.md (fix diff pass1.fix.diff)
Fixer: applied items 0–20; no conflicts; no commands added.
### Applied
- [required] Description — add tickets.toml entry 6 interface, tests, owns, unknown → fixer item 0
- [major] Description capture clause — tiles are captured but inert (SPEC CAP-4 "a column, a WordCell or a tile"); non-card presses resolve by closest data-column/data-wordcell/data-foot from elementFromPoint (build-notes CAP-4); only uncaptured case: non-card column parts with nothing selected (pan-y) → fixer item 1 (default applied)
- [major] Description gate — which presses are the active press, which enter the gate, exactly one leave on the first of pointerup/pointercancel/lostpointercapture/cancel(), later terminal events ignored → fixer item 2 (default applied)
- [major] Description cancel — cancel() releases capture, dead pointerId's events dropped until its up/cancel, a new pointerdown (same id included) starts fresh; cancel() detached or with no press is a no-op → fixer item 3 (default applied)
- [major] classify — inputs/outputs undefined; SPEC case "empty WordCell long-press then move releases as a tap" missing → fixer item 4
- [major] act.ts/attach — how act() and App's action reach the controller main.ts creates → fixer item 5 (default applied: setter in act.ts, controller prop to App, throw if unset)
- [major] createController(gate) — node Vitest env has no DOM/timers seam → fixer item 6 (default applied: injected deps like createGate)
- [major] act() coverage — S spy cannot prove every App-owned button uses act() → fixer item 7 (default applied: architecture.test.ts source scan)
- [major] Verify contextmenu P4 — no procedure; CDP long touch may not fire contextmenu → fixer item 8 (default applied: synthetic cancelable contextmenu during touchHold, negative control)
- [minor] items 9–23 (before-hide order, closePeek only when open, classify boundary cases, before-back missing cases, entry-6 release outcome, Dialog scrim, unknown probe, References, attach twice, cancel closes no other entry, hide/AD-16 P4 partial split, tray-tile test asserting a controller effect, foot-pad drag with tail lands in entry 9, "before launch() resolves" wording)
### Default applied (technical)
- capture/gate/cancel semantics, controller seam, test seam, act scan, contextmenu procedure (items 1–3, 5–8)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- adversarial: "selected-tail foot-pad drag dropped without a home" — entry 9's tests already list it; kept only as a minor cross-reference

## Pass 2 — 2026-10-02 12:45
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 7, minor 17, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 1160 (2.84 x pass 0)  |  Snapshot: story-pointer-controller-core-and-cancel-wiring.passes/pass2.md (fix diff pass2.fix.diff)
Fixer: applied items 1–10; no commands added.
### Applied
- [major] Press/End — only captured presses enter the gate but every end leaves it (throws at count 0); SPEC CAP-4 "increments the gate at pointerdown" has no captured qualifier → every active press enters, leaves once; pan-y pointercancel ends an uncaptured pan; if entry 4's scroll test fails, stop and report (rule 7) → fixer item 1 (default applied)
- [major] AC act scan — names onclick but App/HistoryNotice use onaction/ondismiss/onscrim props and ActionBar uses primary.onclick → scan every on(click|action|dismiss|scrim)= value plus ActionBar's handler object; BlockingMessage/Dialog forward and are exempt → fixer item 2 (default applied)
- [major] attach — "Svelte action" given an attachment's signature → use: action whose destroy calls the detach attach(root) returns → fixer item 3 (default applied)
- [major] Notes probe — unobservable in this entry → structural P4: attached root contains top bar, banner band, action bar and covers the viewport → fixer item 4 (default applied)
- [major] F24 press-only S cases vacuous with no press; refs' case is a sticky view over a selection → each case holds an active press; sticky view over a tap-selection → fixer item 5
- [major] AC rejected-root hidePage — existing test asserts no writes only; refs require "throws nothing" → extend with no halted surface, still rejected → fixer item 6
- [major] classify input "whether the WordCell is empty" — source unstated, DOM counting would re-derive game state (AD-3) → read from game.view at pointerdown → fixer item 7 (default applied)
- [minor] zero-word fixes: duplicate tray-tile contextmenu clause cut; "(deselect, SPEC CAP-4)" → "(its deselect is entry 7's)"; button filter scoped to pointerdown → fixer items 8–10
### Default applied (technical)
- items 1–4, 7
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (minors over budget left unapplied; listed in Result)

## Pass 3 — 2026-10-02 13:10
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 22, decision-needed 0  |  Dropped in triage: 1 (log wording, fixed in the log directly)
Words (docs): 1163 (2.84 x pass 0)  |  Snapshot: story-pointer-controller-core-and-cancel-wiring.passes/pass3.md (fix diff pass3.fix.diff)
Fixer: applied items 1–9 with offsetting wording cuts; no commands added.
### Applied
- [major] AC AD-12 scan — ActionBar's `onclick={primary.onclick}` can never be an act( call → exempt that markup value; each non-undefined onclick value of the derived primary object is an act( call → fixer item 1 (default applied)
- [major] cancel bullet / AC "gate count 0" — Gate exposes no count and busy() includes scrollBusy, so "gate idle" can be false in a hide mid-scroll → "every enter() the controller made is matched by one leave() before cancel() returns", S uses a counting fake Gate → fixer item 2 (default applied)
- [major] End bullet — a lostpointercapture from the implicit-capture target (touch) or a late one after a same-id new press would end the active press → ends it only when its target is the element captured for the active press; S case → fixer item 3 (default applied)
- [major] AC S one pointer — SPEC/rule-coverage require stopPropagation never called on the second pointer, AC asserts only preventDefault → fixer item 4
- [major] cancel bullet — peek close untested, conflicts with the no-press no-op, and nothing opens a peek before entry 11 → all peek closing (cancel, pointercancel, lostpointercapture) lands with openPeek in entry 11; keep "closes no overlay entry" here → fixer item 5 (default applied)
- [minor] zero/near-zero-word fixes: scan "have none" → "contain no act( call"; F24 (a) "no nav call after select()"; F24 (b) press held before openView; "active-branch (Board) root" → fixer items 6–9
### Default applied (technical)
- items 1–3, 5
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- fix-diff: log said "(handled in entry 11)" where the ticket says "(its deselect is entry 7's)" — log corrected; ticket right

## Pass 4 — 2026-10-02 13:35
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 3, minor 20, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 1215 (2.97 x pass 0)  |  Snapshot: story-pointer-controller-core-and-cancel-wiring.passes/pass4.md (fix diff pass4.fix.diff)
Fixer: applied items 1–7; also shortened the Owns bullet (refers to Interface) and the End bullet wording; no commands added.
### Applied
- [major] cancel bullet — pass 3 moved peek closing to entry 11, whose tickets.toml entry never lists it, so SPEC CAP-4's peek close on cancel()/pointercancel/lostpointercapture has no owner; overlays.openPeek already exists (entry 5) → keep it here (closePeek only when open) with an S case; reverses pass 3 item 5 → fixer item 1 (default applied)
- [major] End/cancel bullets — pointerId lifecycle contradicts itself ("later terminal events ignored" unbounded; dead id's events dropped vs a same-id pointerdown starting a press; a lost pointerup on an uncaptured mouse press stalls the controller and gate) → one rule: ignoring is scoped to the ended/cancelled press until the next pointerdown of that id; a same-id pointerdown during an active press ends the stale press (one leave, no command) and starts the new one; S cases → fixer item 2 (default applied)
- [major] Press/cancel bullets — after cancel() of a captured press with the finger still down (second-finger Undo, back, hide), a later long-press contextmenu is no longer suppressed (AD-11) → keep contextmenu preventDefaulted for that cancelled pointer until its pointerup/pointercancel; S case → fixer item 3 (default applied)
- [minor] zero/near-zero-word fixes: scan every src/ui/**/*.svelte except Dialog, BlockingMessage, Halted (replaces the file list); restore "without byBack" on the gate-balance clause; "(Board) root" → App's active-branch `<main>`; F24 (a) "later pointerup dispatches nothing" → "later pointerup is ignored" → fixer items 4–7
### Default applied (technical)
- items 1–3
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 5 — 2026-10-02 14:00
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 1, minor 20, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 1254 (3.07 x pass 0)  |  Snapshot: story-pointer-controller-core-and-cancel-wiring.passes/pass5.md (fix diff pass5.fix.diff)
Fixer: applied items 1–6; no commands added.
### Applied
- [major] Press bullet / AC P4 AD-11 — how a contextmenu is matched to the captured (or cancelled, still-held) press is unstated; the gating P4 dispatches a synthetic contextmenu with no pointerId, and matching any press brushes the second-pointer rule → the root's contextmenu listener preventDefaults whenever a captured press is active or a cancelled/lostpointercapture-ended captured press awaits its pointerup/pointercancel, with no pointerId or target matching (the one sanctioned exception to the second-pointer rule, AD-11) → fixer item 1 (default applied)
- [minor] zero/near-zero-word fixes: End bullet "ignored" scoped to gestures (its pointerup/pointercancel still ends contextmenu suppression); peek S case includes lostpointercapture; cancel S cases cover cancel({ byBack: true }) too; drop "Halted exempt" from the S act() item (the scan proves it); the AD-16 id goes on the '§2 rejected' test, the clock-resume assertion on 'R-73 AD-17 hidePage alone' → fixer items 2–6
### Default applied (technical)
- item 1
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 6 — 2026-10-02 14:25
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 1, minor 23, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 1254 (3.07 x pass 0), no fix pass  |  Snapshot: story-pointer-controller-core-and-cancel-wiring.passes/pass5.md
### Open (not fixed; stopping rule)
- [major] classify / End / cancel bullets, AC S classify list — the 400 ms long-press timer is never said to be cleared on a drag latch or on any press end (pointerup, pointercancel, lostpointercapture, cancel(), same-id pointerdown, detach), and no S case covers it (EXPERIENCE.md Pointer thresholds "once a drag starts, the long-press timer is cancelled"; build-notes CAP-4 "cleared on threshold crossing, release or cancel"; SPEC CAP-4 lists the timer among what cancel ends). Proposed: every press end and drag latch calls clearTimer; S cases: WordCell press latching drag at 300 ms held past 400 ms stays drag; WordCell press cancel()ed at 200 ms, advancing time fires nothing (clearTimer spy).
### Decision needed (functionality / UX / gameplay)
- none

## Result — converged after 6 passes
open major: long-press timer not cleared on drag latch / press end, and untested (pass 6; see Open above) — fold into the build plan.

Majors per pass: 8, 7, 5, 3, 1, 1. Words 409 → 1254 (over the 2.5x budget from pass 2; fixes kept terse). Technical defaults applied: 21. Decision-needed: 0.

### Unapplied minors (for the build plan or a later loop)
- Press bullet: the "(AD-11's sole second-pointer exception)" parenthetical cites no ref (spine AD-11 is layout); recite as SPEC CAP-4 "preventDefault()s contextmenu for a press it captured" / rule-coverage AD-11 row, a ticket default that touches no pointer events.
- End bullet: say a dead press's events are ignored except that its pointerup/pointercancel end contextmenu suppression (so a stale pointercancel/lostpointercapture cannot close a peek).
- Contextmenu suppression after cancel()/lostpointercapture: bound it (one waiting slot cleared by that pointer's pointerup/pointercancel, the next captured press, or detach); S cases for the lostpointercapture end and for suppression stopping at pointerup.
- cancel(): release capture only while the element holds it (hasPointerCapture); S case with the captured element detached mid-press.
- Enabled-button check: read closest('button:enabled') on the elementFromPoint result; null/outside-root result handling.
- Tray D-block mirrors (no data-place): resolve as a tray tile (captured, inert) or explicitly outside.
- AD-12 scan: also fail on shorthand {onclick}/{onaction}/{ondismiss}/{onscrim} and spreads.
- F24 case (b): "no nav call after openView"; define "hide" in S as running the store's before-hide callbacks, not a direct cancel().
- Non-card column presses: uncaptured whatever the selection until entry 7.
- act(): the returned handler throws when called with no controller (wrapping never throws) and forwards its arguments; act tests use vi.resetModules + dynamic import, no reset export.
- Run the Notes probe on the desktop project too (side margins).
- Lost touch ends: record that touch presses rely on implicit capture, pointercancel and before-hide cancel().
- AD-16 Board half: entry 9's hidePage mid-drag test should carry the AD-16 id (record when entry 9 is hardened).
- AD-11 P4: note the on-device long-press contextmenu check as `unverified`, recorded for epic 7.
- AD-12 DOM-wiring P4 (rule-coverage row 100): name the column-card contextmenu touchHold case as that evidence or hand it to entry 7.
- Tray-tile P4: name session-composing; the contextmenu defaultPrevented assertion is the discriminating half.
- classify "399 ms not" is untestable with an injected timer: assert setTimer(…, 400) only for WordCell presses and longPress only after the callback fires.
- Uncaptured press with a lost end from a different pointerType (pointerleave / other-type pointerdown recovery) — stretch.
- Desktop-touch contextmenu-on-release — record as unverified for epic 7 — stretch.
