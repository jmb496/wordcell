# Review log — story-theme-preference-and-pre-paint-apply (ticket 9.4)

State: pass 1: done
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
