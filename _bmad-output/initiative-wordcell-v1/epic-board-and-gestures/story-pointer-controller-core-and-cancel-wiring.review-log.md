# Review log — story-pointer-controller-core-and-cancel-wiring.md (ticket 4.6)

State: pass 2: done

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
- [minor] zero-word fixes: duplicate tray-tile contextmenu clause cut; "(deselect, SPEC CAP-4)" → "(handled in entry 11)"; button filter scoped to pointerdown → fixer items 8–10
### Default applied (technical)
- items 1–4, 7
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (minors over budget left unapplied; listed in Result)
