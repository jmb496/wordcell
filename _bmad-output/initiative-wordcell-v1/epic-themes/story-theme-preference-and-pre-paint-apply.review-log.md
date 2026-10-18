# Review log — story-theme-preference-and-pre-paint-apply (ticket 9.4)

State: pass 4: done
Pre-loop: HEAD 799b7eb, 192 words, copy story-theme-preference-and-pre-paint-apply.review-log.passes/pass0.md

## Pass 1 — 2026-10-18
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 8, minor 4, decision-needed 0 (1 owner-gate item noted below)  |  Dropped in triage: 0 (duplicates merged)
Triaged majors (all verified against main.ts, prefs.svelte.ts, AD-7/10/16, epic TH-3/TH-4):
1. First paint: ticket leaves the unknown open though AD-16 answers "synchronous apply, no inline script"; but main.ts awaits nav.launch() and fontCheck() before prefs.load(), so the default tokens can paint first.
2. "No flash" not testable as written.
3. Playwright switch needs a non-default theme, none exists before 9.6.
4. Prefs shape: optional `theme` vs exact key-set parser, write shape, setTheme, unknown/non-string = contents-unreadable (all prefs default, Q-36).
5. Apply/meta ownership: UI theme module vs shell prefs (shell never imports ui).
6. Tests incomplete: Q-36 unknown theme, survives New game/Replay, ignores prefers-color-scheme, Session untouched, test-hook/globals.d.ts and fixtures.
7. Preferences baselines change vs TH-4.
8. Apply on halted / rejected-Session paths.
Minors: index.html and manifest stay #15171B; TH-7 only verified; meta colour source vs TH-2; Q-38 note; Description structure.
Words: 712 (3.7 x pass 0, over the 2.5x budget; from pass 2 only no-added-words minors go to the fixer)  |  Snapshot: story-theme-preference-and-pre-paint-apply.review-log.passes/pass1.md
### Applied
- [major] 1-8 above, minors 9 (index.html/manifest, TH-7 scope, meta colour source) → fixer items 1-9; Q-38 note and restructuring skipped
### Default applied (technical)
- registry of themes with only `default` in production plus test-only second theme; applyTheme in src/ui/theme/ called from main.ts and a prefs change callback; theme optional and omitted while default; plan settles apply-before-awaits
### Decision needed (owner gate, not UX choice)
- First paint order: moving prefs.load()+apply ahead of nav.launch()/fontCheck() departs from AD-16 order and needs a spine edit approved by the owner (rule 7) — proposed default: plan proposes it if the first-frame test fails otherwise

## Pass 2 — 2026-10-18
Reviewers: fix-diff, edge-case, adversarial, ref alignment  |  Findings: major 7, minor 4 (merged), decision-needed 0  |  Dropped in triage: 0
Words: 691 (3.6 x pass 0, over budget; minors only if word-neutral)  |  Snapshot: story-theme-preference-and-pre-paint-apply.review-log.passes/pass2.md
### Applied
- [major] pre-apply-slot halts and first-paint guarantee merged into one bullet → 1
- [major] no-flash probe reworded for the static pre-apply state → 2
- [major] test-only theme `paper` via registerTheme hook, test-hook builds only → 3
- [major] unregistered-valid id test; prefs-invalid-theme rejection test → 4
- [major] prefs normalisation (omit iff default) → 5
- [major] onThemeChange callback API → 6
- [major] explicit meta colour per registry entry + token-equality test → 7
- [minor] screenshots wording, Theme row last → 8
### Default applied (technical)
- pre-slot halts render static default and are exempt; test theme id `paper`; meta table per AD-10
### Decision needed
- (same as pass 1: first-paint order vs AD-16 spine edit, owner approval)
### Dropped
- none

## Pass 3 — 2026-10-18
Reviewers: fix-diff, edge-case, adversarial, ref alignment  |  Findings: major 4 (merged from 9 raw), minor 4, decision-needed 0  |  Dropped in triage: 1 (first-paint "fix the default" minor: contradicts the plan_checkpoint/owner gate already recorded)
Words: 809 (4.2 x pass 0, over budget)  |  Snapshot: story-theme-preference-and-pre-paint-apply.review-log.passes/pass3.md
### Applied
- [major] registerTheme hook crossed the shell/ui layer and raced the boot apply → main.ts registers test-only `paper` at module load in test-hook builds; hook dropped
- [major] Switch test fragment → full assertions
- [major] meta-colour unit test scoped to production entries (paper exempt)
- [major] parsePrefs raw shape vs resolved in-memory Prefs
- [minor] applyTheme always sets data-theme; apply-throws halt looks default
### Default applied (technical)
- main.ts owns test-theme registration; raw/resolved Prefs split
### Decision needed
- (unchanged: first-paint order vs AD-16 spine edit, owner approval)
### Dropped
- "keep AD-16 order, no spine edit" — the ticket already routes that to the plan_checkpoint and owner (rule 7)

## Pass 4 — 2026-10-18
Reviewers: fix-diff, edge-case, adversarial, ref alignment  |  Findings: major 0, minor 7, decision-needed 0  |  Dropped in triage: 0
Words: 809 (4.2 x pass 0, unchanged; no fix pass)
### Decision needed (owner gate)
- First paint order: whether prefs.load()+apply move ahead of nav.launch()/fontCheck() (departs from AD-16 order, spine edit needs owner approval, rule 7) — proposed default: keep AD-16 order unless the plan's first-frame test shows a flash; then propose the edit.

## Result — converged after 4 passes

Unapplied minors:
- registry needs a named registration function (registerTheme-like) for main.ts's test-only `paper` entry
- pin applyTheme between prefs.load() and game.load(); applyTheme looks up the registry before any DOM write
- order in setTheme (write, set value, mirror, callback); callback throw goes to AD-15
- list the Charcoal / Daylight Paper label strings (EXPERIENCE.md) for the switch test
- add AD-15 and EXPERIENCE.md Preferences rows to References
- state which build the Preferences baseline is taken in (test build lists `paper`)
