# Review log — story-celebration-interruptions.md
State: pass 1: done
Pre-loop: HEAD 765affe; pass0.md 216 words; growth budget stated 1500 words; tickets.toml entry 7 fields interface, tests, owns, consumers, plan_checkpoint passed as intent, to be added to Description in pass 1.

## Pass 1 — 2026-10-24
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 10 (merged from ~30 raw), minor 6, decision-needed 0  |  Dropped in triage: 4 (duplicates merged)
Words (docs): 1075 (4.98 x pass 0; budget 1500)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-celebration-interruptions.passes/pass1.md
Fixer: all 16 applied; no runnable commands added; test titles checked in e2e/celebration.spec.ts; item 6 worded "☰ throws, `M` is ignored" (code shows `M` ignored in `attempt()`); Redo test attributed to entry 5 (commit 691c8e6).
### Applied
- [major] Description — tickets.toml entry 7 interface, tests, owns, consumers, plan_checkpoint not carried; hide-end default needs the owner's nod (10.4 plan) → fixer item 1
- [major] Description hide — "hide mode" undefined; default plain `end()` from a main.ts `registerBeforeHide`, entry 5's `done` hidden branch defers the open silently → fixer item 2
- [major] AC hide row — cannot tell "queued for next visible" from "opened while hidden"; no second flush; "back and menu still work" unasserted → fixer item 3
- [major] Description hide — `pagehide` on a visible reload now runs the hide end; e2e/celebration.spec.ts reload-mid-run relaunch test must stay green → fixer item 4
- [major] Description resize — listener owner/lifetime, trigger, and orientationchange test route unstated → fixer item 5
- [major] Description ☰/`M` — handlers (TopBar.svelte, keys.ts `CELEBRATION_KEYS`), shared helper, guarded deferred open (double ☰, ☰ then hide before settle → halt), `act()` unchanged, closes the interim throw → fixer item 6
- [major] AC — "interruption rows" not a rule-coverage label; list rows, project, new vs already covered → fixer item 7
- [major] Description keys — rule-coverage "WordCell tap does nothing" vs entry 6's consumed skip; tap clause covered by entry 6 → fixer item 8
- [major] AC — AD-19 Tests requires UI Vitest for hide/resize/menu wiring → fixer item 9
- [major] Description cancel — Undo keys on `desktop` missing; cancel outcomes unpinned (no late sheet, wc 0, New game back leaves the app) → fixer item 10
- [minor] Description Redo — mid-run Undo then Redo boundary → fixer item 11
- [minor] References — TopBar.svelte not Menu.svelte; missing files and spec refs → fixer item 12
- [minor] Notes — device proof belongs to entry 9's final Android read; ticket closes the merge blocker → fixer item 13
- [minor] AC screens — no baseline added or changed → fixer item 14
- [minor] Description — hide/resize ends while halted pass through (as skip.ts) → fixer item 15
- [minor] Notes — back landing between ☰'s pop and the sheet push: accepted residual (AD-13 nav absorbs) → fixer item 16
### Default applied (technical)
- Hide end — plain `celebration.end()` registered last in main.ts `registerBeforeHide`; no mode flag; AD-19 "hide mode" wording to entry 9's sync
- Resize — permanent `window` `resize` + `orientationchange` listeners in main.ts calling `celebration.end()` (no-op with no run, no size compare)
- Menu — one shared helper: under `celebration`, `end()` then `nav.whenSettled` opening the menu only if top is `endSheet` and the menu is not open; `menu` joins `CELEBRATION_KEYS`; `act()` unchanged
- Halted — hide/resize ends do nothing while halted
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Duplicates of the contract, hide-mode, rows and WordCell-tap findings across lenses (kept the clearest)
