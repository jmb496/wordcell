# Review log — ticket 6.4

State: pass 2: done

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
