# Review log — ticket 6.4

State: done

Pre-loop: HEAD 1cfa6e35e22edbffa5675b3fe7d6e737e522b613, 291 words (story-preferences-panel-and-the-top-bar-timer.review-log.passes/pass0.md)

## Pass 1 — 2026-10-15
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 10 (merged), minor 5, decision-needed 0  |  Dropped in triage: 0 (many duplicates merged)
### Majors (triaged, merged; all technical, default applied)
1. tickets.toml interface/tests/owns/consumers/risk not in ticket (lead-given) → add to Description
2. No UI access to activeMs/peek(now) (verified: no activeMs in non-engine UI/shell; clock.peek not exposed) → read-only shell accessor on game store, named in interface; AD-3/AD-4/AD-9
3. Tick semantics: 1000 ms interval via $effect with cleanup keyed on showTimer+status; re-render on every dispatch and on leaving playing; frozen == stored activeMs; hidden/paused no growth; 0:00 after New game/Replay; resume on undo out of over
4. "status is playing" undefined → name GameView field/values; fixtures named with expected strings, prefs seeded showTimer true
5. 360 px fit: cite DESIGN Top bar (fixed 64 px right-aligned box, tabular numerals, absent when off, 140 px score), measurable assertions
6. "tick writes nothing" observable: compare wordcell:* keys across page.clock advance, while playing as well as relaunch
7. Panel contract: roles/names (radiogroup Animation speed Fast/Normal/Slow, role=switch Show timer), text.ts strings, act(), menu row via openSurface('preferences') in Panel.svelte, back/Esc/focus
8. "shorter glide" → --wc-base-ms 90/180/320 + WAAPI duration; applies to next glide; reduced motion wins
9. Setter throws not caught (rule 6); Q-36 test (unreadable prefs fixture → defaults, first change overwrites); not undoable (session byte-identical, Undo state unchanged)
10. Formatter: name, file, floor to seconds, literal table, throws on negative/non-finite
### Minors
- screens specs list; References add R-76/§7.10/Q-36/AD-9/AD-10, DESIGN Top bar/Panels; AD-9/R-76 test ids rather than AD-10 where fitting; timer stays visible frozen in Game over
Words: 923 (3.17 x pass 0, over the 2.5x budget: from pass 2 minors only if the fix adds no words)  |  Snapshot: story-preferences-panel-and-the-top-bar-timer.review-log.passes/pass1.md
### Applied
- all 10 majors and 2 minors → fixer items 1-12 (accessor game.elapsedMs(now); 1000 ms effect; 64 px box; roles; text.timer; fixtures session-won/session-gave-up/prefs-unreadable)
### Fixer-marked unverified
- focus return to ☰ after panel close; h:mm:ss fit test editing session-composing activeMs (AD-7 limit unchecked); gave-up fixture negative score assumed

## Pass 2 — 2026-10-15
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 8 (merged), minor ~8, decision-needed 0  |  Dropped in triage: 0
### Majors (default applied, technical)
1. Timer refresh: stale `now` vs `performance.now()` ambiguity (peek negative → text.timer throws) → template calls `game.elapsedMs(performance.now())`, interval and dispatch only bump a trigger
2. elapsedMs throws in halted/rejected: say timer expression and effect are evaluated only in the active branch (TopBar mounted only there), Vitest throws case
3. 360 px bullet rests on two unverified facts (gave-up score, AD-7 activeMs) → check and name a fixture or drop hedge
4. Focus return after panel Back stated as unverified guess, no AC → read build-notes/Menu/6.3, state fact, one assertion
5. Fixture assignment: prefs-non-default for persistence, prefs-fast for the Fast test
6. "no dispatch" not observable → byte-identical keys plus move count
7. "grows nothing while hidden" has no AC → one P6 AC with page.clock and visibility
8. End-sheet clause in Description/AC depends on entry 6 (SPEC: freeze tests do not depend on the end sheet) → drop
### Default applied / follow-up (not edited in the ticket)
- elapsedMs is a new read path outside GameView: kept as the technical default; the spine/build-notes close-out should record it as a sanctioned AD-9 read path (upstream, not this ticket). tickets.toml entry 4 to be synced at publish.
### Minors not applied (budget exceeded, fix adds words)
- row order note for 6.5; throw inputs list; score re-centre note; Esc over end sheet; WAAPI move naming; won fixture 0:00 vs gave-up 0:01 (reword allowed)
Words: 957 (3.29 x pass 0)  |  Snapshot: story-preferences-panel-and-the-top-bar-timer.review-log.passes/pass2.md
### Applied
- 8 majors + 1 minor → fixer items 1-9 (template reads fresh performance.now(); active-branch only; gave-up fixture Score −530 with activeMs edited; focus on ☰; fixture roles; hidden AC; end-sheet clauses removed)

## Pass 3 — 2026-10-15
Reviewers: fix diff, edge-case hunter (none), adversarial, ref alignment  |  Findings: major 7 (merged), minor 4, decision-needed 0  |  Dropped in triage: 1 (mounted-then-halted throw ordering: stretch, obvious guard)
### Majors (default applied, technical)
1. visibilitychange trigger added in pass 2 puts a listener in the UI (AGENTS.md/AD-9: only game.svelte.ts) → drop it; interval + dispatch + leaving playing refresh (3 reviewers)
2. h:mm:ss in a fixed 64 px box: no fit rule/assertion → assert timer text scrollWidth <= its box in the 12:03:04 test; font fit rule per DESIGN
3. Frozen-in-Game-over not tested by value → relaunch, advance page.clock, force re-derive, text unchanged
4. page.clock must be installed before goto (negative peek hazard)
5. Preferences row vs Menu's focus-main effect (skipFocus) and Esc/Back one close path; remove undefined "unless the menu reopened"
6. "Undo out of Game over resumes": gave-up has no moves (cannot undo), won activeMs 0 → name won with a nonzero activeMs
7. 360 px crossing 59:59→1:00:00 amount unstated → runFor 2000 ms, assert at least 1:00:00
### Minors
- applied (zero words): stray "and," grammar; Q-36 test picks a non-default value
- not applied: ticking tolerance wording, WAAPI move naming
Words: 975 (3.35 x pass 0)  |  Snapshot: story-preferences-panel-and-the-top-bar-timer.review-log.passes/pass3.md
### Applied
- 7 majors + 2 minors → fixer items 1-8 (visibilitychange trigger removed; scrollWidth<=64 assertion; frozen-by-value; clock before goto; skipFocus + one close path; session-won undo; runFor 2000)
- Note for pass 4: fixer dropped "(R-82, U+2212)" from the 360 px AC and the "read-only so AD-3/AD-4/AD-17 hook unaffected" clause; check R-82 coverage still present

## Pass 4 — 2026-10-15
Reviewers: fix diff (none), adversarial, ref alignment (none)  |  Findings: major 1, minor 2, decision-needed 0  |  Dropped in triage: 0
Words: 980 (3.37 x pass 0)  |  Snapshot: story-preferences-panel-and-the-top-bar-timer.review-log.passes/pass4.md
### Applied
- [major] R-82 id lost from tests line and 360 px bullet (fixer in pass 3 dropped it) → restored (UI)(P6)
- [minor, zero words] "a preference toggle" → "an Animation speed change"
### Not applied minors
- tick bullet "without hidePage" (implied)

## Pass 5 — 2026-10-15
Reviewers: fix diff, edge-case hunter (none), adversarial, ref alignment (none)  |  Findings: major 1, minor 2, decision-needed 0  |  Dropped in triage: 0
### Open major (recorded, not fixed: two consecutive passes with at most one major)
- AC bullets 1-2: no test for the live playing → over transition (Show timer on, Give up or win, advance page.clock, text equals the value at the transition and the stored activeMs via text.timer); only a relaunch into Game over is covered. Original contract: "sees it tick then freeze in Game over". Fix: add that step to bullet 1.
### Minors not applied
- Game over frozen-value bullet: "an Animation speed change" may not force a re-derive (vacuous); prefer `hidePage` then `showPage` (zero-word reword)
- h:mm:ss shrink rule: m:ss at the score's size, h:mm:ss shrinks to fit 64 px (adds words)
- earlier: tick bullet "without hidePage"; row-order note for 6.5; throw-inputs list; score re-centre note; Esc over end sheet; WAAPI move naming; ticking tolerance wording
### Follow-ups (upstream)
- `game.elapsedMs` is a new read path outside GameView: record as a sanctioned AD-9 read path in spine/build-notes close-out; sync tickets.toml entry 4 (interface, tests, description wording) at publish

Words: 980 (3.37 x pass 0). Technical defaults applied: all findings of passes 1-4 (~27).

## Result — converged after 5 passes (open major: no test for the live playing → Game over freeze)
