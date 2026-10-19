# Review log — story-theme-art-layer-table-background-and-card-texture (ticket 9.5)

State: pass 1: done
Pre-loop: HEAD e922032, 211 words, copy story-theme-art-layer-table-background-and-card-texture.review-log.passes/pass0.md

## Pass 1
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 9 (merged), minor 6, decision-needed 0  |  Dropped in triage: 0 (4 stretch minors from adversarial dropped: forced-colors, pre-paint note, SVG constraints folded in)
### Default applied (technical)
- M1 art data format (token names; ThemeEntry unchanged; default = none; art colours in app.css theme blocks / TH-2 scan) → optional `--wc-table-art`, `--wc-card-texture` custom properties in app.css `[data-theme]` blocks
- M2 delivery + fail-fast (lazy vs inline, AD-8, "fails to load") → inline SVG/CSS in the stylesheet, precached, no fetch, no raster, no runtime dep (TH-8); fail-fast = registration/build-time check that declared art has both tokens, resolves, and is a data URI/flat pattern; no runtime load-failure path
- M3 worst-point contrast method → analytic composite check in Vitest + pixel-sampled Playwright (android) check on a test-only art fixture theme (epic decision 64)
- M4 table-side contrast (card edge ≥3.6, outline ≥3.8 over table art)
- M5 texture form: flat tiled pattern, opacity ≤ 6 %, no gradient functions on cards (DESIGN.md Avoid list)
- M6 test-only art theme registered under the test hook only; no shipped art theme; screenshots per art theme come with 9.7+
- M7 no layout shift test (P6 android) + default resolves tokens to none, baselines unchanged
- M8 surfaces/states: texture on every Card instance incl. mirrors/tray (no animation), table art on page/board background, Scene follows token
- M9 size budget: margin from size-budget.mjs recorded in plan; test art not in dist
- minors: tickets.toml fields added to Description, scope line (no card backs, pre-paint script unchanged), test mapping
Words: 634 (3.0 x pass 0, over the 2.5x budget; later minors only if word-neutral)  |  Snapshot: story-theme-art-layer-table-background-and-card-texture.review-log.passes/pass1.md
### Applied
- [major] 9 majors (M1-M9) and minor mapping/scope → fixer items 0-10
