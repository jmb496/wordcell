# Review log — story-celebration-skip.md
State: pass 5: done
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

## Pass 3 — 2026-10-23
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 7, minor 10, decision-needed 0  |  Dropped in triage: 1 (edge-case hunter arrived after triage: its major duplicated items 2 and 4; three new minors sent to the same fixer as items 15–17)
Words (docs): 1519 (6.60 x pass 0; budget 1500, offset by cuts: the opening paragraph compressed, duplicate Press/Keys/Tuning phrases merged, entry 7's row list dropped from the Verify line)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-celebration-skip.passes/pass3.md
Fixer: all 17 applied; names checked in code (`disarm()`, motion.ts window blur, attached.test.ts L253, step.test.ts L254 offsets, step.ts OVERLAP/FIT_SHARE/MIN_SCALE, `readyToWin` Undo → `focusByPhase` first strip card); no commands added.
### Applied
- [major] Press bullet — whether the skipping `pointerdown` is stopped is unstated; unstopped, the controller marks a celebrating press whose `pointerup` the tail then eats, leaving the gate entered; the tail does not clear on the next `pointerdown`; run-scoped `pointerup`/`click` listeners have no job → fixer item 1
- [major] Keys bullet — "clears on it or on blur": an element blur fires when the sheet moves focus to Replay this deal, clearing the tail before the keyup → fixer item 2
- [major] Keys bullet — `src/ui/celebration/attached.test.ts` "AD-13 pressEscape with the entry on top…" also pins the old Esc path and is not named for rewriting → fixer item 3
- [major] U list / AC keys row — no gate fails if the tails consume nothing (`keyboard.press` releases before the sheet opens; U checks only removal) → fixer item 4
- [major] AC held-finger row — touch location unstated; a touch held on a bar control passes whatever the logic → fixer item 5
- [major] Helper — "returns once the expanded end sheet is visible" also succeeds on a natural finish in hook-free real time → fixer item 6
- [major] Tuning — "values win" vs "AD-19 `step` tests stay green" when step.test.ts pins entry 3's literal offsets; a value breaking a behaviour row unhandled → fixer item 7
- [minor] Tuning — Slow-cap trigger is the Slow run ending before 3008 ms, not the last launch → fixer item 8
- [minor] Keys — name one call: `cancelGesture()` → fixer item 9
- [minor] Helper — press the centre of `[data-celebration-root]`'s rect (no bar testids) → fixer item 10
- [minor] Keys — the Space tail also consumes that key's repeats → fixer item 11
- [minor] AC keys row — "focus the board" may land on a column card (`Enter` → `tap`); use the focus the Undo step leaves → fixer item 12
- [minor] Press — "resize (entry 7)" → fixer item 13
- [minor] Tuning — the 90 % fit share is also a DESIGN.md value → fixer item 14
- [minor] U list — Shift+Space, Shift+Esc, non-primary button cases → fixer item 15
- [minor] AC banner case — observable that Reload acted (refetch) → fixer item 16
- [minor] Helper — "touch projects" undefined (`dist-smoke` is a Pixel 7) → `navigator.maxTouchPoints > 0` → fixer item 17
### Default applied (technical)
- Skipping `pointerdown` — `stopPropagation()` + `preventDefault()` at the document capture phase, so the controller never opens a press; run listeners are `pointerdown`/`keydown` only; tails own `pointerup`/`click`/`keyup` and also clear on the next `pointerdown`
- Tuning pins — literal pins take the new values; the rule-coverage AD-19 behaviour rows and R-87 cap rows stay green; a value that breaks a behaviour row stops for the owner
### Dropped
- fix diff "observe the pointerup without consuming it" — superseded by stopping the skipping pointerdown (item 1), which keeps AD-19's "consume a press"

## Pass 4 — 2026-10-23
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 2 (merged from 5 raw), minor 11, decision-needed 0  |  Dropped in triage: 0 (3 minors left unapplied, see Result)
Words (docs): 1530 (6.65 x pass 0; budget 1500, growth offset by cuts of restated phrases)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-celebration-skip.passes/pass4.md
Fixer: all 13 applied; checked keys.ts:570 `defaultPrevented` early return and motion.ts `startTracker` DOC_EVENTS capture; second `keyboard.down` arriving as a repeat is Playwright-documented, `unverified`.
### Applied
- [major] U list vs Keys bullet — "gone too on expiry" gives the Space tail an expiry the Keys bullet does not; its window-`blur` clear and the press tail's `pointercancel` are untested (gating U contract) → fixer item 1
- [major] AC press row — the only consumption observable (sheet stays expanded after a release on the scrim) cannot fail: touch has implicit capture and a mouse click goes to the common ancestor, so the scrim never gets the click; the WordCell case cannot release on the scrim (the sheet panel covers it) → fixer item 2
- [minor] Press — "the next `pointerdown`" scope: before release only that pointer's `pointercancel`/same-id `pointerdown`; after, the swallower disarms on any `pointerdown` → fixer item 3
- [minor] Press — tails listen on `document` capture too (behind motion.ts's tracker) → fixer item 4
- [minor] Press — the run's listeners judge events whatever `defaultPrevented` says (AD-14 tracker) → fixer item 5
- [minor] Press — "after the start judged per `pointerId`" decides nothing (listener attaches at `start()`); cut → fixer item 6
- [minor] Press — "or appears mid-run" declares copies over a shown banner, against CAP-2/DESIGN.md layer order; cut → fixer item 7
- [minor] Tuning — whether an owner-approved scale amendment is applied here → applied here with the values, recorded for entry 9 → fixer item 8
- [minor] U list — natural finish missing from the removal cases → fixer item 9
- [minor] AC Space row — a second `keyboard.down` (repeat) once Replay has focus → fixer item 10
- [minor] Keys — the Space tail also clears on a fresh non-repeat `Space` keydown (lost keyup, as motion.ts) → fixer item 11
- [minor] Notes — report AD-19 Skip's run-scoped `pointerup`/`click` becoming post-run tails (plus the Space tail) for entry 9's doc sync → fixer item 12
- [minor] AC held-finger row — hold point with no card or WordCell under it, `Enter` before the long-press time → fixer item 13
### Default applied (technical)
- Press-row observable — touch press released within the tap window; a page-side window bubble-phase `pointerup`/`click` recorder sees nothing from the skipping press; the WordCell case releases where it pressed (over the sheet panel), no sheet action activated
- Space tail — no expiry; clears on its keyup, a fresh `Space` keydown or window `blur`

## Pass 5 — 2026-10-23
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 0, minor 17 (merged from 19 raw), decision-needed 0  |  Dropped in triage: 0
Words (docs): 1530 (no fix pass)  |  Snapshot: _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-celebration-skip.passes/pass4.md
### Applied
- none (converged)

## Result — converged after 5 passes
Majors per pass: 10, 8, 7, 2, 0. Words 230 → 1530 (budget 1500). No open major.
Decision needed (owner): Pass 1 — `Space`/`Esc` while a bar control holds focus (after the winning Confirm, focus stays on the primary button, now New game): AD-19's exception makes `Space` start a new game and `Esc` do nothing; R-87, EXPERIENCE.md Keyboard and F9 say both skip. Proposed default: both skip whatever holds focus; AD-19's exception dropped at entry 9's doc sync.
Resolved 2026-10-23 under the owner's standing rule (accept the proposed default): recorded as SPEC F17; the ticket's Keys bullet and U list now say both keys skip whatever holds focus.
Unapplied minors (for the plan or the next loop):
- AC Verify line says all four skip rows pass on `android`; the `Space`/`Esc` row is `desktop` (reword "pass on their rule-coverage projects") — flagged by all four pass-5 lenses
- AC press row: "within the tap window" undefined; use "before `LONG_PRESS_MS` (400 ms) from the press" or "at once (a tap, so a click follows)"
- U list "a later `pointerdown`" vs Press bullet (same-id before the release, any after) — align the U wording
- Tuning: "(an owner amendment, applied here …)" lost its subject → "changing one is an owner amendment, applied here with the values"
- Notes: flag the AD-19 Skip refinement (post-run tails) and the R-87 banner wording at the plan checkpoint (rule 7), not only for entry 9
- Press: an AD-15 halt mid-run leaves the run's listeners attached, so the first press on Halted's Reload is eaten as a skip; pass everything through while `game.state.kind` is `halted` (one U case)
- Press: "pointers held from before the start never are" consumed is true of these listeners only (motion.ts's tracker may consume them) → "these listeners never consume …"
- U list: "after a press or key skip the controller holds no press" (key skip's `cancelGesture()`)
- AC `Space` row: send the key once `running()` (the AD-14 guard eats earlier keys)
- Device read: Android Chrome may download `manifest.webmanifest`; use a same-origin file shown inline (e.g. a dist icon PNG); install from `localhost:4173` or record the read as tab-only, with Remove animations off
- Device read: the long-list fixture deferred to entry 9 has no owner; record it as entry 9's deliverable in the epic Notes
- Device checklist: ☰ and `M` during the run are entry 7 (☰ throws until then)
- Repeats, Shift+`Space`, chords, non-primary buttons "pass untouched" rather than "do not call `end()`"
- Bar/banner target test: `[data-band=topBar|actionBar|banner]` ancestor
- Tuning: if tuned values make the run shorter than the Fast cap, stop for the owner rather than retarget; the post-read application path (session, plan record) belongs in the plan's done-checkpoint section
