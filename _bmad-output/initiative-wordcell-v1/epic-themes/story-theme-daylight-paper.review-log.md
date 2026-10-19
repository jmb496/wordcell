# Review log — story-theme-daylight-paper (ticket 9.6)

State: pass 3: done

Pre-loop: HEAD 42fc3b8, copy `story-theme-daylight-paper.review-log.passes/pass0.md`, 150 words (budget 1500). No themes SPEC.md exists under `_bmad-output/specs/`; refs are the epic file (TH-1..TH-9), DESIGN.md Themes, the spine, AGENTS.md and the plans of 9.1-9.5.

## Pass 1 — 2026-10-19
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 7, minor 6, decision-needed 1  |  Dropped in triage: 0 (many duplicates merged)
### Findings (triaged)
- [major] Description — `testPaper` replaced by a production `paper` entry (registry.ts, main.ts test-hook branch would throw on duplicate id; registry.test.ts, theme.spec.ts, globals.d.ts, `prefs-theme-paper` fixture, dist-smoke Theme group)
- [major] Description — token source (brief §D 18 values), the four internal tokens (`--wc-shadow-drag`, `--wc-scene-pointer-*`), `color-scheme: light` placement, art tokens `none`, block after default block
- [major] Description — `theme-color` meta value `#ECE6D8` = `--wc-table`; unit assertion; manifest and static meta stay `#15171B`
- [major] Acceptance Criteria — tests unmapped: contrast floors (owner option A TABLE floors, incl. card-ink on destination-fill), switch/back/reload e2e (retarget theme.spec.ts), computed color-scheme, scrim dark
- [major] Acceptance Criteria — screenshot set unpinned (spec file, seeding, shots); Preferences baseline changes by the added radio, so "default baselines unchanged" is wrong as written
- [major] Description/References — DESIGN.md Themes values: land in 9.6 or 9.11 (technical default: brief stays the source, 9.11 sweeps)
- [major] covers — TH-2, TH-4, TH-8 not claimed/checked
- [minor] front matter `after`; References paths (brief §D, AD-7/10/16, Q-45, sibling tickets); owner phone-play gate
### Decision needed (functionality / UX / gameplay)
- Acceptance Criteria (TH-3 no-flash) — Daylight Paper is the first light theme, so on a cold start the screen shows one dark frame (Charcoal) before the light theme applies, unless AD-16's boot order is changed (needs owner approval, rule 7). Accept the one dark frame, or approve the AD-16 change? — proposed default: accept the dark frame; the reload test then asserts persistence and the final theme only, not a dark-free first frame.
### Applied
- all 7 majors and 3 minors (fixer items 1-10); `after` set to [3, 4, 5] in the ticket, tickets.toml entry 6 still says [1, 4] (not edited)
Words: ~880 (5.9 x pass 0, within the 1500 budget)  |  Snapshot: story-theme-daylight-paper.review-log.passes/pass1.md
### Default applied (technical)
- DESIGN.md values for paper — ticket leaves DESIGN.md untouched, brief §D stays the source until 9.11
- paper `--wc-shadow-drag` / pointer tokens — pointer kept as default, lighter shadow chosen in the plan

## Pass 2 — 2026-10-19
Reviewers: fix-diff, edge-case, adversarial, ref-alignment  |  Findings: major 3, minor 6 (after merging), decision-needed 0  |  Dropped in triage: 0
### Findings (triaged)
- [major] Tokens bullet — "after the default block" can place the paper block before app.css's separate `:root { color-scheme: dark }` rule (line 39), so `color-scheme` stays dark; place it after that rule
- [major] Meta bullet / Registry AC — meta-equals-`--wc-table` test: single owner (contrast.test.ts, reads app.css records), case-insensitive (`#15171B` vs `#15171b`), garden inherits the default table
- [major] Screenshots/Hue-alone — scene 2 final frame (BALKED, Validate pressed) is not an error state; the "error state" claim is unsupported
- [minor] production export name `paperTheme`, registration order default, paper, stale registry.ts/main.ts comments; dist-smoke test rename, count 2, select paper and assert `data-theme` and meta; scrim check by exact literal; `--wc-shadow-drag` default value; "floor (third) column"; pointer-fill visibility; scene-reach helper; tickets.toml `after` note
### Applied
- 3 majors, 6 minors (fixer items 1-11); tickets.toml untouched (note in ticket)
Words: ~1118 (7.5 x pass 0)  |  Snapshot: story-theme-daylight-paper.review-log.passes/pass2.md
### Default applied (technical)
- meta-equals-table test owned by contrast.test.ts, case-insensitive; `--wc-shadow-drag: rgb(0 0 0 / 0.35)`; scene-reach helper extracted to e2e/helpers/; error/selected states left to contrast row and owner gate

## Pass 3 — 2026-10-19
Reviewers: fix-diff, builder, adversarial, ref-alignment  |  Findings: major 2, minor ~9, decision-needed 0  |  Dropped in triage: 0
### Findings (triaged)
- [major] Verify line / Default baselines (TH-4) — the pass 1 fix claimed `preferences-panel.png` changes by the added radio; false: screens run serves `npm run dev`, main.ts already registers `testPaper` (same id, label, order) when `import.meta.env.DEV`, so the panel shows 3 radios today; no default baseline changes (verified in main.ts:223 and playwright.screens.config.ts)
- [major] Meta bullet — contrast.test.ts does not import the registry (empty Map in Vitest); name the entries it imports (`defaultTheme`, `paperTheme`, `testGarden`) and compare each meta with the record's `--wc-table`
- [minor] dist-smoke: give the new test name and assert radio order; Switch return-trip properties named (`--wc-table`, `--wc-card-face`); Hue-alone claim: plan fails the ticket if a shot lacks the state; dark-first-frame wording (index.html pre-paint sets data-theme; only meta lags) to be verified; Preferences/TH-4 clause drops with the false claim
### Applied
- 2 majors, 4 minors (fixer items 1-6). Finding: index.html's inline pre-paint script (lines 10-16) sets `data-theme` before first paint, so the page is already paper at first paint; only the static `theme-color` meta (`#15171B`) waits for main.ts. The decision-needed item from pass 1 therefore narrows (see Decision needed below).
Words: see wc  |  Snapshot: story-theme-daylight-paper.review-log.passes/pass3.md
### Decision needed (restated, functionality / UX / gameplay)
- TH-3 first-paint — on a cold start with Daylight Paper stored, the page paints paper at once, but the browser/status-bar tint (`theme-color` meta) may show Charcoal's `#15171B` for one frame until main.ts sets it, and the installed-PWA splash (manifest `background_color`) stays dark. Accept, or approve an AD-16 edit to set the meta earlier? — proposed default: accept (ticket already says the meta waits for main.ts).
