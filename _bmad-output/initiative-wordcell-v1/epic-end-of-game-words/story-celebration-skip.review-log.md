# Review log — story-celebration-skip.md
State: pass 2: done
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

## Pass 2 — 2026-10-23
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 8 (merged from ~20 raw), minor 9, decision-needed 0  |  Dropped in triage: 2
Words (docs): 1481 (6.44 x pass 0; budget 1500 — at budget, later additions are minor)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-celebration-skip.passes/pass2.md
Fixer: all 15 applied (plus: clear site data first, since `dist/sw.js` NavigationRoute would serve the app at the manifest URL); ran `npm run build` (557778/600000), `ls dist` (manifest.webmanifest present), `npm run preview` + curl manifest 200; `npx playwright test --help` lists `--update-snapshots [mode]` (all/changed/missing/none); `npm run test:screens -- e2e/end-sheet.screens.spec.ts --update-snapshots=changed --list` in the container listed 12 tests; device handoff marked `unverified` in the ticket.
### Applied
- [major] Press/Keys bullets, U list — "listeners detach on the internal stop" contradicts the skipping press's `pointerup`/`click` and Space `keyup` staying consumed after the run; `createClickSwallower` handles only `click` and arms at pointerup; "(the finish or the cap)" cannot apply to a skipping press → fixer item 1
- [major] AC Device read — the AD-9 `pagehide` flush rewrites `wordcell:session` on reload, so the DevTools-written fixture never loads; LAN http is not a secure context → fixer item 2
- [major] AC banner row / Press bullet — the banner button is `Reload` (`text.reload`), not Retry; a 404 route makes Reload reload the page (relaunch, no run); the banner hides on press → fixer item 3
- [major] AC `Space`/`Esc` and held-finger rows — no setup or observable; fixture routes leave focus on a bar button (focus exception: no skip; `Enter` activates the button); keyup protection unasserted → fixer item 4
- [major] AC press row — a plain tap releases before the sheet opens, so "after release the sheet is still expanded" passes on broken code → fixer item 5
- [major] Tuning — owner values vs entry 5's Slow-cap test assumption: values win, the row is retargeted → fixer item 6
- [major] Tuning/Screens — a tuning change breaks this ticket's own mid-run baseline; regeneration path unstated → fixer item 7
- [major] Press bullet / R-87 — R-87 names only the two bars; SPEC CAP-3, AD-19, EXPERIENCE.md (owner 2026-10-20) exclude the whole banner; record the resolution so the builder does not stop on "spec wins" → fixer item 8
- [minor] Keys — Shift handling explicit (Ctrl/Cmd/Alt never; Shift+Space no; Shift+Esc yes, as keys.ts) → fixer item 9
- [minor] Keys — `pressEscape`'s `celebration` branch: capture listener is the only Esc skip; branch returns false; keys.test.ts entry-4 Esc test rewritten → fixer item 10
- [minor] Tuning — 50 % overlap and 40 % floor are A-D12/CAP-2, changed only as an owner amendment for entry 9 → fixer item 11
- [minor] Device read — deferral to entry 9 contradicts the epic Notes (copy cost settled at entry 6); reword and record the carried items in epic Notes → fixer item 12
- [minor] U list — second-finger, repeat, chord, banner-hidden-mid-run cases (merged into items 1, 4, 9)
- [minor] AC Screens — `android` project only, test-name id → fixer item 13
- [minor] Keys/Press — skip before the celebration's push settles: `end()` at once, nav queue (AD-13); one U case → fixer item 14
- [minor] AC lead-in — "keys rows" ambiguous; name entry 7's rows → fixer item 15
- [minor] Device read — mark the device steps `unverified` (merged into item 2)
### Default applied (technical)
- Release tail — a one-shot per-`pointerId` tail outlives the run: consumes that `pointerup`, arms a `createClickSwallower` there (300 ms from release), clears on `pointercancel`; Space keyup tail clears on keyup or blur
- Device route — same-origin non-app URL (e.g. the web manifest) to write the key, then open `/`; chrome://inspect port forwarding to `localhost:4173`
- Banner route — 500 response (in-place retry), button `Reload` by role and name
- Key route — focus moved off every bar control before the keyboard Confirm
- Banner scope — follow SPEC CAP-3/AD-19/EXPERIENCE.md; R-87 wording reported for entry 9's doc sync
### Dropped
- edge (decision-needed): a second quick Space/tap after the skip acting on the just-opened sheet — refs answer it: the sheet opens "exactly as a normal finish does" (EXPERIENCE.md Skip); only the skipping input is consumed
- duplicates across lenses (release tail ×4, Reload ×3, screens regen ×3) merged
