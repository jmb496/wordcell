# Review log — story-flip-module-and-button-driven-glides.md (ticket 5.10)

State: pass 1: done

Mode: docs, thorough, max 7, budget 1500 words (2.5x pass 0 plus the tickets.toml entry 10 fields unknown, interface, tests, owns, consumers that pass 1 adds to the Description). Pass 0: HEAD acf8115, .passes/pass0.md, 471 words.

## Pass 1 — 2026-10-10
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 10, minor 8, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 1121 (2.38 x pass 0)  |  Snapshot: .passes/pass1.md, fix diff .passes/pass1.fix.diff
Fixer: all 18 applied; no runnable commands added; source facts checked (Command union has giveUp, data-place values, [data-band] ids columns/tray/wordcells, cancel() calls finishFlight(), only validate flushes).
### Applied
- [major] Description — tickets.toml entry 10 fields unknown, interface, tests, owns, consumers missing → fixer item 1
- [major] Description/AC "gate idle at every dispatch" — nothing in entry 10 finishes a running glide before a button dispatch (finishAll reaches the controller only in entry 16) → fixer item 2
- [major] Description play/capture — no flush: TopBar/ControlRow/Confirm dispatch without flushSync, so play would read stale DOM and capture would record a selection lift the act()/deselect clear has not rendered → fixer item 3
- [major] Description "a no-edit release → flyBack" — no dispatch, so no command/result; CAP-5/CAP-6 own it (fly-back.ts) → fixer item 4
- [major] Description "committing Redo" — DispatchResult has no phase; F7's resulting-view-phase input and its bans dropped → fixer item 5
- [major] Description "play left to entry 11" — what play does for flyToCell in entry 10 unspecified → fixer item 6
- [major] AC coordinate frame — + 14 → 15 and the 412 × 780 anchor delta need tray growth (entry 12); must be synthetic pure-planner inputs → fixer item 7
- [major] Interface — no injection seam for gate/root/animate under Vitest node env → fixer item 8
- [major] Description "band" — band undefined; how a card's band and band rect are found and how rects are keyed (CardId) → fixer item 9
- [major] Description kind mapping — command types (tapDestinationCard, arrange, setPlacementOrder, add/removeFreeLetter, giveUp) not mapped; F17 move names only → fixer item 10
- [minor] AC P5 — no non-committing Redo glide case → fixer item 11
- [minor] AC P5 — start fixtures and step chains unnamed → fixer item 12
- [minor] Description — reduced-motion fade form → fixer item 13
- [minor] Description — "changed" tolerance → fixer item 14
- [minor] Description — New game/Replay/restore rule untested → fixer item 15
- [minor] Description — play without a pending capture → fixer item 16
- [minor] AC — run-on "…412 × 780) the gate idle…" → fixer item 17
- [minor] Notes — open question's second half belongs to entry 16 → fixer item 18
### Default applied (technical)
- finishAll path → capture() calls finishAll() first; the controller's cancel() gains flip.finishAll() here (entry 16 keeps pointerdown)
- flush → capture() and play() each call flushSync() before measuring
- seam → createFlip(deps) factory installed once from main.ts via a setter, plus pure kindOf(command, result, phase) and a pure planner over rects
- flyToCell before entry 11 → kind returned, no animation, no gate count
- band → from data-place (column → columns, tray/strip → tray, cell → wordcells), rects keyed by data-card-id
- tolerance → 0.5 px as controller near()
- giveUp → empty animated set
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (duplicates across lenses merged)
