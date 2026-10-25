# Review loop — epic 9 owner decisions D1–D6 (code mode, thorough, max 7)

State: pass 2: done

Target: uncommitted working-tree change against HEAD e6443fd on branch end-of-game-words (`git diff HEAD`, 16 files), staged as `opus-review-epic-9-decisions.passes/pass0.diff`.
Pre-loop: HEAD e6443fd1cd50fff8d801ca1b246d71d2134dffde; tree snapshot 0 f2dcd6d13c44847cd0968347f5b26d74d0af38d8.
Intent: epic-themes.md Notes "Decision (owner, 2026-10-22, Opus review decisions D1–D6 …)"; opus-review-epic-9.md "Decision needed" sections; open major in opus-review-epic-9b.md Result (rune shapes in colour-literals.ts); implementing report `.autopilot/opus-review-20261022-1737/e9-decisions.json` (its two questions answered by the owner: keep both as built).
Owner rules: only majors fixed; minors listed, never sent to the fixer; anything beyond D1–D6 changing UX/visuals/gameplay is decision-needed; no screenshot baselines.

## Pass 1 — 2026-10-22
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 5, minor 2, decision-needed 0  |  Dropped in triage: 3
Snapshot: tree f2dcd6d (pass 0)
### Applied
- [major] src/ui/app.css dark alternate blocks + src/ui/theme/contrast.test.ts INHERITED / D3 test — D3 done by deleting `--wc-shadow-drag` from scifi/garden/steampunk/plum so they inherit; DESIGN.md Themes "a theme is complete when it defines all 18 roles plus those [four internal tokens]" and tickets 9.6–9.9 "the key-set check requires the full set"; harness loosened → fixer item 1 (2 reviewers)
- [major] src/ui/theme/colour-literals.ts — the rune-shape fix covers only expression-bodied arrows; a block-bodied `$derived.by(() => { return '#000' })` or function under a colour-named binding (the shape every real src/ui site uses) still passes the TH-2 gate → fixer item 2
- [major] src/ui/Column.svelte:209-269 — D4's split writes the 12 % drop wash four times (two face rules, placeholder, foot); the D6 harness reads only the placeholder/foot copies, so the face copies can drift (risk 2) → fixer item 3 (2 reviewers)
- [major] DESIGN.md Focus ring (l.522) vs PreferencesPanel.svelte D5 rule — the as-built inside ring with a table gap on both sides is not recorded in DESIGN.md, and the code comment claims DESIGN.md says it (risk 7) → fixer item 4 (3 reviewers)
- [major] src/ui/theme/art.test.ts 'AD-14 worstRatio paints the wash over the art before measuring' — every case puts the worst point on the art-free stack, so a wash-under-art implementation passes (probe: both orders 3.97665) (risk 1) → fixer item 5
### Default applied (technical)
- Column.svelte — one component-local wash custom property read by all four rules and by the contrast.test.ts WASHES extraction
- colour-literals.ts — a block-bodied function in a colour value position: its own ReturnStatement arguments are value positions (nested functions skipped)
- D3 — each dark block declares `--wc-shadow-drag: #0008`; test asserts dark records equal the default's value and Paper's differs
### Decision needed (functionality / UX / gameplay)
- none
### Minor (listed, not applied — owner rule)
- src/ui/PreferencesPanel.svelte `.list .segment` — content-box sizing: 10 px vertical padding adds to the 44 px min-height, so Theme rows are ~64 px; the D1 test only asserts >= 44 (row look kept as built by the owner)
- e2e/tap.spec.ts:631 — D4 desktop hover path tested only under Charcoal (`, none`); no textured-theme hover case (the drag case is android-only)
### Dropped
- Stale screenshot baselines (Preferences, Greenhouse Dusk) ×3 reviewers — owner rule: the orchestrator regenerates them and expects these images to change
### Fixer outcome
- 1: four dark blocks declare `--wc-shadow-drag: #0008`; INHERITED removed, `check` back to HEAD signature; D3 test renamed 'AD-14 theme %s: a dark theme declares the default --wc-shadow-drag, a light one its own', iterates every non-default record by color-scheme.
- 2: colour-literals.ts FUNCTIONS set: a function in a colour value position makes its own ReturnStatement arguments value positions (nested functions reset); +2 positives, +1 nested-function negative; break check: both positives fail without it; tree scan clean.
- 3: `.column { --drop-wash: … }` read by all four rules; contrast.test.ts WASHES reads `--drop-wash` and the `.foot` 8 % rule; still pins [0.08, 0.12].
- 4: DESIGN.md Focus ring gains the segment / Theme row inside-ring clause (owner, 2026-10-22).
- 5: art.test.ts order case (white rect 0.5 on black, black wash 0.5, white ink → 10.4088); swapping order in art.ts fails it (3.97665); art.ts restored byte-for-byte.
- Commands (orchestrator rerun): npm test 86 files / 3348 tests pass; lint exit 0 (1 pre-existing warning e2e/end-sheet.spec.ts:846); check exit 0; fixer ran tap/theme-art/theme e2e: 62 passed.
Snapshot: tree c6d769b65cd298030334a2739cc304162ecad591; diff passes/pass1.diff; fix diff passes/pass1.fix.diff

## Pass 2 — 2026-10-22
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 5, decision-needed 0  |  Dropped in triage: 0 (merged: FunctionDeclaration scan gap ×2)
Snapshot: tree c6d769b (unchanged; no fix pass)
### Applied
- none (zero majors)
### Decision needed (functionality / UX / gameplay)
- none
### Minor (listed, not applied — owner rule)
- src/ui/theme/colour-literals.ts FUNCTIONS — `FunctionDeclaration` only resets nesting: a colour-named `function fill() { return '#000'; }` or class getter `get fill()` is not flagged (no current src/ui site; object methods and function expressions are) — default: open a colour context for a colour-named FunctionDeclaration / MethodDefinition with a positive each, or drop it from FUNCTIONS and say so (2 reviewers)
- src/ui/theme/contrast.test.ts WASHES filter — narrowed to `--drop-wash` plus `.foot` rules; a future inline wash on a placeholder or face rule would escape the D6 check and the [0.08, 0.12] pin — default: match WASH on every Column.svelte declaration
- e2e/theme.spec.ts:922/927 D5 focus test — unanchored `/a+\.*t+\.*a+/` checks the inner table gap only, not the outer one DESIGN.md Focus ring now records — default: `/^\.?t+\.*a+\.*t+\.*a+/` in both assertions
- DESIGN.md Blocking message / Themes, AD-10 — D2 (fatal surface wears Charcoal incl. a #15171B status bar; another-window and session-rejected messages keep the theme) recorded only in the epic Notes and code; refs still say the meta follows the active theme — default: one clause in DESIGN.md Blocking message (owner doc)

## Result — converged after 2 passes
Majors per pass: 5, 0. Applied: 5 (all technical defaults or doc records of owner decisions; no visible change). Decision needed: none. Default applied (technical): 3.
Final state (tree c6d769b): npm test 86 files / 3348 tests pass; lint exit 0 (1 pre-existing warning e2e/end-sheet.spec.ts:846, untouched); check exit 0; targeted e2e (tap, theme-art, theme) 62 passed (fixer run).
Expected baseline changes (orchestrator): Preferences (D1, every theme incl. Charcoal), drag (D3/D4), Greenhouse Dusk (D6).
Unapplied minors: 7 (pass 1: 2, pass 2: 5), listed above.
