# Review log — story-celebration-skip.md
State: pass 1: done
Pre-loop: HEAD 75ccb28; pass0.md 230 words; growth budget stated 1500 words; tickets.toml entry 6 fields interface, tests, owns, consumers, plan_checkpoint, done_checkpoint passed as intent, added to Description in pass 1.

## Pass 1 — 2026-10-23
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 10 (merged from ~30 raw), minor 7, decision-needed 1  |  Dropped in triage: 2
Words (docs): 1029 (4.47 x pass 0; budget 1500)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-celebration-skip.passes/pass1.md
Fixer: all 16 applied; `npx vite preview --help` (vite 8.3.1) lists `--host`; `npm run preview` = `vite preview`; device handoff (LAN preview, chrome://inspect) unverified (needs a device); attribute names checked in Celebration.svelte.
### Applied
- [major] Description — tickets.toml entry 6 interface, tests (AD-19 listener U tests), owns, consumers, plan_checkpoint, done_checkpoint not carried → fixer item 1
- [major] Description press skip — which event ends the run, per-pointer "after the start", primary button, and the swallow outliving the run (release must not collapse/activate the just-opened sheet); listener attach/detach on every removal (entry 4 Notes: teardown on the internal stop, not `onEnd`) → fixer item 2
- [major] Description keys — Esc already ends the run via keys.ts `pressEscape` regardless of focus; entry 4 Notes hand its `celebration` branch to this ticket so a bar-focused Esc does not end the run → fixer item 3
- [major] AC press rows — no observable for "consumed, nothing under it tapped", held finger, banner button → fixer item 4
- [major] Description helper — press helper contract (hook-free for entry 8's `dist-smoke`, name, file, press point, self-test) → fixer item 5
- [major] Description/AC tuning — unattended build cannot apply tuning from a later owner read; order, bounds, failed-read path; keep entry 5's Slow-cap assumption → fixer item 6
- [major] AC device read — no route to a celebrating build with the fixture on Jared's phone → fixer item 7
- [major] AC device read — won-words fixture (10 words, longest 10 letters) cannot judge A-D12's scale floor or large-list copy cost → fixer item 8
- [major] AC back row / Notes — second back collapsing the sheet dropped; Playwright proves app level only, device read the platform → fixer item 9
- [major] AC screens — whether a celebration baseline is added unstated (tickets.toml header "6 (first visible motion)", rule-coverage Exempt "ticket's screenshot"); `test:all` missing → fixer item 10
- [minor] References — AD-12, AD-14, AD-17, rule-coverage.md, click-swallow.ts, visible-band.ts, overlays.svelte.ts, e2e helpers → fixer item 11
- [minor] AC — "skip rows" not a rule-coverage label; list the four rows → fixer item 12
- [minor] Description — banner hiding mid-run: band stays as measured at `start()` → fixer item 13
- [minor] Description keys — auto-repeat, modifier chords, the skipping Space's keyup landing on Replay this deal → fixer item 14
- [minor] Description keys — no platform gate; key rows run on `desktop` → fixer item 15
- [minor] Description keys — key skip calls `cancelGesture()`/`act()` first (AGENTS.md act rule) → fixer item 16
- [minor] Description press — mouse non-primary buttons pass through (merged into item 2)
### Default applied (technical)
- Skip event — `end()` on the qualifying primary `pointerdown`; that pointer's `pointerup`/`click` swallowed via epic 5's click swallower, outliving the run
- Esc with bar/banner focus — per AD-19 and entry 4 Notes, `pressEscape`'s `celebration` branch leaves the run running (pending decision below)
- Helper — `skipByPress(page)` in `e2e/helpers/celebration.ts`, DOM only, self-test in `e2e/helpers.spec.ts`
- Device route — hook-free `dist/` via `npm run build` + `vite preview --host`, fixture written to `wordcell:session` over chrome://inspect
- Screens — one manual-clock mid-run frame in a new `e2e/celebration.screens.spec.ts`
- Large-list cost and A-D12 scale floor — judged at entry 9's close-out read (SPEC Assumptions "final read at close-out")
### Decision needed (functionality / UX / gameplay)
- Description keys (AD-19 focus exception vs R-87 / EXPERIENCE.md Keyboard / F9) — after the last word is confirmed by a click or `Enter`, focus stays on the action bar's primary button, which now reads New game; under AD-19's "unless a bar or banner control holds focus", `Space` then starts a new game (no end sheet) and `Esc` does nothing, so the usual desktop flow cannot skip by key — proposed default: `Space` and `Esc` skip whatever holds focus while the run plays (R-87 has no focus exception; spec wins), AD-19's exception dropped in entry 9's doc sync; a keyboard player uses Z/N/M during the run instead of Space on a focused bar button
### Dropped
- builder: blocking dialog / Halted Reload swallowed by the document listener — speculative; Halted replaces the app and has no run
- duplicates across lenses (fields, Esc, helper, device route, back, screens) merged
