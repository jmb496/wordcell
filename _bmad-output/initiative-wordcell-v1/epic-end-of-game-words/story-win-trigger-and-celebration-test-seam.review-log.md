# Review log — story-win-trigger-and-celebration-test-seam.md
State: pass 1: done
Pre-loop: HEAD 8d5147f; pass0.md 373 words; growth budget 2.5x (~930 words); tickets.toml entry 5 fields interface, tests, owns, consumers, unknown, plan_checkpoint passed as intent, added to Description in pass 1.

## Pass 1 — 2026-10-23
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 13 (merged from ~30 raw), minor 7, decision-needed 0  |  Dropped in triage: 2
Words (docs): 929 (2.49 x pass 0)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-win-trigger-and-celebration-test-seam.passes/pass1.md
Fixer: all 20 applied; lead paragraph trimmed where bullets replace it; nothing run (no commands touched); names checked against code (`cancelGesture()` in act.ts, `setManual`, `game.whenVisible()`).
### Applied
- [major] Description — tickets.toml entry 5 interface, tests, owns, consumers, plan_checkpoint not copied → fixer item 1
- [major] Description "off by default" — owner and per-build default of the enabled flag unstated; hook-free `dist/` must always play (F12), Vitest end-sheet win tests would hit `startCelebration` → fixer item 2
- [major] Description no-start cases / Notes — whether reduced-motion and seam-disabled paths push/pop the entry unstated (the Notes unknown) → fixer item 3
- [major] Description start/`done` — start preconditions (still won, live token) and what `done` runs (token-guarded open, `announceOutcome`) unstated → fixer item 4
- [major] Description start — entry 4's deferred press-timer halt (cancel the controller press before `startCelebration`) dropped → fixer item 5
- [major] Description `done` — entry 4 owner-checkpoint default (`done` waits for `whenVisible()` when hidden) dropped → fixer item 6
- [major] Description hook — late-bound methods before registration, second registration, `setEnabled` mid-run, nested freeze unstated → fixer item 7
- [major] Description helper — one helper cannot enable and advance; name, file, signatures, helpers.spec.ts tests unstated (consumed by 6, 7) → fixer item 8
- [major] AC no-start rows — pass trivially with the seam off; rule-coverage requires the seam enabled; relaunch row cannot fail as written → fixer item 9
- [major] AC — no UI Vitest `AD-19` wiring tests (tickets.toml tests, AD-19 Tests) → fixer item 10
- [major] AC default-off — must be proven on the dev server and `dist-test/` (rule-coverage) → fixer item 11
- [major] AC cap — no pass condition; `advance(cap)` stops short (16 ms sub-steps); scaling unproven → fixer item 12
- [major] AC order / fresh mount / first launch — "registered", "fresh" not observable; fixed advance goes stale at entry 6 tuning → fixer item 13
- [minor] AC — test-name ids (R-87, AD-17, AD-19) → fixer item 14
- [minor] AC "no screenshot baseline changes" — reword to no snapshot file modified → fixer item 15
- [minor] Notes — ☰ during a run throws until entry 7; no merge before entry 7 → fixer item 16
- [minor] Description mount — which App.svelte branch hosts the mount → fixer item 17
- [minor] References — missing code paths and AD-9, AD-16 → fixer item 18
- [minor] AC copy count — "card counts" means `cards.length` (QU) → fixer item 19
- [minor] AC finish row — assert the entry was popped (one history entry, the sheet's) → fixer item 20
### Default applied (technical)
- enabled flag — `celebration.svelte.ts` flag, default on (hook-free and Vitest); `main.ts` calls `attachOverlays()` in every build and, only under the DEV/VITE_TEST_HOOKS gate, turns it off and registers the seam; `setEnabled(on)` sets the flag and `setManual(on)`
- no-start paths — no `startCelebration`/`start`; the callback runs today's open unchanged
- start precondition — status won and a live token (non-consuming token query on `overlays`)
- hook — methods throw before registration; second registration throws; `setEnabled` throws mid-run; nested object frozen
- helper — `e2e/helpers/celebration.ts` `enableCelebration(page)`, `finishCelebration(page)`, tested in `e2e/helpers.spec.ts`
- cap — advance by the cap rounded up to a 16 ms step; at Slow still running after the Fast cap
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- adversarial: dev server never shows a real-time run (manual viewing note) — owner viewing is entry 6's device read on `dist/`; not this ticket's contract
- builder: tickets.toml header says entry 5 changes end-sheet baselines — with the seam off in hook builds nothing visible changes; kept "no baseline modified" (item 15)
