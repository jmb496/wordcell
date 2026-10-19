# Review log — story-theme-art-layer-table-background-and-card-texture (ticket 9.5)

State: pass 3: done
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

## Pass 2
Reviewers: fix-diff, edge-case, adversarial, ref-alignment  |  Findings: major 7 (merged), minor 6, decision-needed 0  |  Dropped in triage: 2 (forced-colors/test:screens wording stretch, optional byte-cost record)
### Default applied (technical)
- M1 test-only art theme CSS location → separate test-only stylesheet imported from the test-hook branch of main.ts, read by the Vitest checks, asserted absent from dist
- M2 fail-fast check site → Vitest only over parsed app.css theme blocks plus the test sheet; drop "or registration" (no runtime check, rule 6)
- M3 token grammar/opacity source → `none` or exactly one `url("data:image/svg+xml,…")` with a single fill and fill-opacity; no gradient, image, href, script, external url, var(), initial/unset, empty; the test reads colour and alpha from it
- M4 table-art worst point → same form; lightest/darkest declared colour composited over --wc-table; roles drawn on table (edge, outline, destination outline)
- M5 card roles enumerated → card-ink on card-face and on destination-fill; texture is background-image over state background-color
- M6 pixel check method → letter hidden, sample background pixels in letter box on a live card, the QU card and a tray tile, against card-ink
- M7 surfaces → fixed px tile; table art on body; Scene surfaces named; layout check adds sticky bars and scrollWidth; `:root` declares none
Words: 678 (3.2 x pass 0)  |  Snapshot: story-theme-art-layer-table-background-and-card-texture.review-log.passes/pass2.md
### Applied
- [major] M1-M7 → fixer items 1-7 (destination-outline assertion not added: only outline-on-table row exists)

## Pass 3
Reviewers: fix-diff, edge-case, adversarial, ref-alignment  |  Findings: major 6 (merged), minor 6, decision-needed 0  |  Dropped in triage: 0 (scan, pixel-method and layout-isolation items classed minor; fixer applies only if word-neutral)
### Default applied (technical)
- M1 existing Card.svelte face rules (ghost `background:none`, `.block/.destination` shorthand, `.used` hatch) → ghost carries no texture (DESIGN.md), block/destination convert to `background-color`, `.used` keeps its hatch and drops the texture; contrast/pixel checks cover the states with a texture
- M2 table art placement → on `html` (canvas) with fixed-px tile, `background-attachment: scroll`; Board.svelte's opaque `--wc-table` background also carries the art (same tile so layers align), or becomes transparent
- M3 test-only theme id → reuse an existing unshipped ThemeId (as testPaper reuses `paper`), no new ThemeId/THEMES entry (AD-7 closed set, rule 7); registered and its sheet loaded by dynamic import() inside the existing test-hook condition in main.ts; dist-absence check scans for the sheet's selector and art data URI
- M4 destination-fill contrast → per-pair floor from contrast.test.ts TABLE (card-face 13.1 pinned figure; destination-fill's own pinned figure), not 13.1 for both
- M5 grammar → allowlist: `none` or exactly one `url("data:image/svg+xml,…")` of rect/circle/path/line, one hex `fill` and one `fill-opacity` shared by all shapes (absent = 1), no stroke/opacity/overlap
- M6 Scene → backdrop layer stays plain `--wc-table` under the scrim; Scene Cards carry the texture
Words: 694 (3.3 x pass 0)  |  Snapshot: story-theme-art-layer-table-background-and-card-texture.review-log.passes/pass3.md
### Applied
- [major] M1-M6 and word-neutral minors → fixer items 1-6 (Scene has no backdrop/scrim of its own; claim corrected)
