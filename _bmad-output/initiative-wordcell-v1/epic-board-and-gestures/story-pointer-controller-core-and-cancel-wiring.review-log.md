# Review log — story-pointer-controller-core-and-cancel-wiring.md (ticket 4.6)

State: pass 1: done

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
