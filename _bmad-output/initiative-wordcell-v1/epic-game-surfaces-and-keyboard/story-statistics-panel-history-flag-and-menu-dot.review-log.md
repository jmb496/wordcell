# Review log — story-statistics-panel-history-flag-and-menu-dot

State: pass 5: done

Pre-loop: HEAD 1a7c369, words 291 (budget default 2.5x = ~728).

## Pass 1 — 2026-10-15 (review triaged)
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings (after merge): major 8, minor 4, decision-needed 0  |  Dropped in triage: 3
### Accepted (majors)
1. Unreadable state: the message and Reset history replace the tiles and the empty line (SPEC CAP-6 "instead"); the panel carries no Not now.
2. Empty line shows only when games played is 0; a negative-only history shows counts, longest word if any, best/average `—`, no empty line; after Reset the panel shows the fresh-history view.
3. Tile order (played, won, given up, best, average, longest word), labels and empty-line string in text.ts, average whole number, longest-word tile = spelling uppercase + letter count (QU as QU), layout per DESIGN.md Panels.
4. Ties/Q-35 have no Verify clause or fixture: name fixtures (history-three-records.json plus any valid fixture to add) for a tie, a QU word and a negative-only history.
5. Message variants: reuse the History notice strings of text.ts (historyVersionUnreadable, historyContentsUnreadable, historyResetHint), no new copy; map one history-invalid-* fixture per variant (unknown version, unreadable version, unreadable contents), the dot on each.
6. Getter contract: live over scoreHistory.state (status === 'unreadable'), false after Delete history, exact file/export name, AD-n Vitest asserting the underlying $state reference (AGENTS pitfall).
7. Dot locator/accessible name (no new data-testid) and Keep it case in Verify (message and dot stay, panel stays open) plus focus after the dialog closes.
8. U+2212: by Q-44 no tile can show a negative, so the Description's "U+2212 negatives" is unreachable in the panel; state that and drop it from Verify (shared formatter unchanged).
### Accepted (minors)
- AD-13 reload as explicit steps (answer the notice with Not now; dot persists); screens baselines listed; split the run-on Description sentence; dot clears on Reset from any surface (via the getter).
### Default applied (technical)
- Getter name/file, dot accessible name, fixture choice, test levels → reviewers' defaults.
### Decision needed
- none
### Dropped
- end-sheet opener for the panel (entry 7's, consumers field covers); fixture matrix size reduced instead of listing all ~18 (folded into 5); tile rounding test (engine owns the rule).
Fix applied (all 8 majors, 3 minors + tickets.toml fields added). Words: 794 (2.7 x pass 0; front matter and References included) | Snapshot: pass1.md

## Pass 2 — 2026-10-15 (review triaged)
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings (after merge): major 5, minor 4, decision-needed 0  |  Dropped in triage: 7
### Accepted (majors)
1. Focus rules stated but not tested; panel-close focus goes to ☰ like Preferences (6.3 plan) → add to Reset history AC.
2. `0` rule and fractional mean have no fixture → the tie fixture also holds a given-up record scoring 0 (not negative, so counted) and a non-integer mean.
3. Only-negative fixture: pin that it has no longestWord (`—`, no count).
4. Panel needs the version for the variant sentences but noticeReason() is captured at open: one shared reason→sentence mapping fed by live scoreHistory.state.reason.
5. AD-13 reload: name history-invalid-version-unknown.json; the panel and confirm are gone after reload.
### Accepted (minors, no added words)
- Tie fixture wording (equal letterCount, different records); drop the redundant "dot clears on any history reset" sentence; dot asserted with all surfaces closed; consumers reword.
### Default applied (technical)
- Focus target after panel close, shared mapping location, fixture contents → reviewers' defaults.
### Decision needed
- none
### Dropped
- unreadable focus start (build-notes Per-surface defines it); panel title; tie rule read as per-record (R-84 spec line 346 and EXPERIENCE agree); halted/stale dot; Panel.svelte close cite; engine/UI line note; "(QU as QU)" deletion (text.ts convention).
Fix applied (5 majors, 4 minors). Words: 886 (3.0 x pass 0) | Snapshot: pass2.md

## Pass 3 — 2026-10-15 (review triaged)
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings (after merge): major 4, minor 3, decision-needed 1  |  Dropped in triage: 7
### Applied (majors)
1. Description says a negative-only history shows longest word `—` unconditionally; the engine counts longest word over all records (introduced by the pass-2 fix) → say `—` only when no record holds a longestWord (the fixture holds none).
2. Focus start "panel heading or close" (build-notes) is two targets → name the one element, the same one PreferencesPanel (6.3) uses.
3. The reset confirm and its handlers live inside HistoryNotice.svelte (deleteHistory also closes historyNotice) → say they move to a shared component/function used by the notice and the panel, focus return set per opener; Keep it asserted for Esc, back and scrim tap too.
4. Tie fixture not pinned → exactly two records, the 101 won and the 0 given-up, equal letterCount, different spellings, the earlier in array order shows.
### Applied (minors, no added words)
- `launch` in the AD-13 clause is the post-reload launch id; getter Vitest covers an inactive game state too; Esc and back close the unreadable panel.
### Default applied (technical)
- Focus element, shared confirm location → build-notes/6.3 defaults.
### Decision needed (functionality / UX / gameplay)
- Longest-word tile — how the letter count is shown beside the word (what the player reads) — proposed default: the uppercase word as the tile value with `8 letters` as a small ink-secondary caption beneath it (string built from a text.ts key); the owner reads the copy at ticket review. Not applied.
### Dropped
- live-vs-captured reason test (both yield the same sentence, indistinguishable); exact-string version numbers; text.test.ts mapping; baseline fixture naming; fresh-history cross-reference; Reset→values phrase.
Fix applied (4 majors, 3 minors). Words: 939 (3.2 x pass 0) | Snapshot: pass3.md

## Pass 4 — 2026-10-15 (review triaged)
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings (after merge): major 2, minor 8, decision-needed 0  |  Dropped in triage: 0 (minors below the late-pass bar or add words over budget are left unapplied)
### Applied (majors)
1. Pass 3 made Esc a tested behaviour on the panel and the shared confirm, but nothing says what handles it (Panel.svelte and Dialog.svelte have none; 6.2/6.3 specify interim act()-wrapped window handlers) → say Esc uses the same interim handlers: the panel closes only when overlays.top is statistics, the shared confirm acts as Keep it only when it is top.
2. The `0` rule (best/average `0`, not `—`) has no fixture → make the tie fixture two given-up records scoring 0 (equal letterCount, different spellings): best 0, average 0, the earlier spelling shows (net-zero words).
### Default applied (technical)
- Esc handler pattern → the interim handlers of 6.2/6.3; fixture contents.
### Decision needed
- none new (the letter-count rendering from pass 3 stays open).
### Unapplied minors
- Session seed named in the AD-13 reload; focus-return mechanism after Delete history; `Statistics` title key; message rendered only in the unreadable branch; long-word wrap baseline; empty-line/unreadable rule merge; confirm scrim/Esc/back wording.
Fix applied (2 majors). Words: 978 (3.4 x pass 0) | Snapshot: pass4.md

## Pass 5 — 2026-10-15
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 0, minor 12, decision-needed 0  |  Dropped in triage: 0
No fix pass (zero majors). Words: 978 (3.4 x pass 0).

## Result — converged after 5 passes
Majors per pass: 8, 5, 4, 2, 0. Decision needed (not applied): longest-word tile — how the letter count shows beside the word; proposed default: uppercase word as the tile value with `8 letters` as a small ink-secondary caption beneath (text.ts key); practical effect: what the player reads on that tile.
Technical defaults applied: focus element for the panel, shared confirm location, getter/dot accessible description, Esc via interim handlers, fixtures.
### Unapplied minors (for the build plan)
- Esc handler citation says "6.3 and 6.2 plans"; the real sources are 6.4 (PreferencesPanel closeOnEsc) and 6.3 (ConfirmDialogs; it covers only newGame/replay confirms, so the reset confirm needs its own top-gated handler); Esc cases are interim until entry 10.
- The shared Delete history closes only resetConfirm; the notice adds its own historyNotice close (overlays.close throws when not top).
- Name the expected values for history-three-records.json (3 / 1 / 2 / 355 / 355 / LQUEJATA 8); whether historyTitle shows in the panel body; the dot appears wherever ☰ renders; focus-return mechanism after Delete history; assert the dot via the button's accessible description; array order is chronological (AD-6); a fractional-mean guard; AD-13 reload: History notice is the only overlay after reload and the Session fixture seeded alongside the history; unreadable baseline fixture (version-unknown); long-word wrap baseline; `Statistics` title key in text.ts; message rendered only in the unreadable branch; empty-line/unreadable rule merge.
