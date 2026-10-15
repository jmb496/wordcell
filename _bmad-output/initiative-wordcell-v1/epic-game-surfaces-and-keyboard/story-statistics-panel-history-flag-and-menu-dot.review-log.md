# Review log — story-statistics-panel-history-flag-and-menu-dot

State: pass 1: done

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
