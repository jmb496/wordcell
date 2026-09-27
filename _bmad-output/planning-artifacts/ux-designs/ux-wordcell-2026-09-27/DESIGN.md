---
name: WordCell
description: Solo FreeCell-style word card game. Dark card table, ivory serif letters, one teal for "you can act here" and one orange for "commit". Portrait phone first.
status: final
created: 2026-09-27
updated: 2026-09-27
sources:
  - _bmad-output/planning-artifacts/briefs/brief-wordcell-2026-09-26/brief.md
  - docs/game-flow-spec.md
  - docs/requirements-carryover.md
  - docs/platform-decision.md
  - CLAUDE.md
colors:
  table: '#15171B'
  surface: '#1E2127'
  surface-raised: '#282C34'
  hairline: '#363B45'
  outline: '#6E7480'
  card-face: '#23262C'
  card-edge: '#6A707C'
  card-ink: '#F3EEE4'
  ink-primary: '#F3EEE4'
  ink-secondary: '#A9A398'
  ink-disabled: '#6B675F'
  ink-on-accent: '#15171B'
  accent-teal: '#3DBDB5'
  accent-orange: '#EF7A3D'
  destination: '#7FA2D6'
  destination-fill: '#2E3A52'
  error: '#F08A84'
  scrim: '#000000B3'
typography:
  card-letter:
    fontFamily: "'WordCell Serif', serif"
    fontWeight: 600
    fontSize: 0.56 × {components.card.width}
    lineHeight: 1
  card-badge:
    fontFamily: "system-ui, 'Roboto', sans-serif"
    fontWeight: 700
    fontSize: 11px
    lineHeight: 1
  cell-number:
    fontFamily: "system-ui, 'Roboto', sans-serif"
    fontWeight: 600
    fontSize: 13px
    lineHeight: 16px
  word-line:
    fontFamily: "'WordCell Serif', serif"
    fontWeight: 600
    fontSize: 20px
    minFontSize: 14px
    lineHeight: 24px
    letterSpacing: 0.08em
  ui-body:
    fontFamily: "system-ui, 'Roboto', sans-serif"
    fontWeight: 400
    fontSize: 16px
    lineHeight: 24px
  ui-label:
    fontFamily: "system-ui, 'Roboto', sans-serif"
    fontWeight: 500
    fontSize: 14px
    lineHeight: 20px
  button-label:
    fontFamily: "system-ui, 'Roboto', sans-serif"
    fontWeight: 600
    fontSize: 16px
    lineHeight: 24px
  ui-title:
    fontFamily: "system-ui, 'Roboto', sans-serif"
    fontWeight: 600
    fontSize: 20px
    lineHeight: 28px
  score:
    fontFamily: "system-ui, 'Roboto', sans-serif"
    fontWeight: 700
    fontSize: 18px
    lineHeight: 24px
    note: 'tabular-nums'
  end-score:
    fontFamily: "system-ui, 'Roboto', sans-serif"
    fontWeight: 700
    fontSize: 56px
    lineHeight: 64px
    note: 'tabular-nums'
rounded:
  card: 6px
  sm: 6px
  md: 12px
  lg: 20px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 24px
  '6': 32px
  gutter-phone: 4px
  gutter-desktop: 16px
  touch-min: 44px
  card-gap: 4px
components:
  card:
    background: '{colors.card-face}'
    border: '1px solid {colors.card-edge}'
    radius: '{rounded.card}'
    ink: '{colors.card-ink}'
    width: 'max(40, min(width-derived floor(available width ÷ 8 − {spacing.card-gap}), height-derived largest integer that fits the height rule))'
    height: 'round(width × 4/3)'
    letterBand: 'top 72% of height; the glyph is centred inside it'
  column-slot:
    width: '{components.card.width} + {spacing.card-gap} (≥ {spacing.touch-min}); board width = 8 × slot'
    strip: 'max({spacing.touch-min}, round(0.72 × card height))'
  placeholder-slot:
    border: '2px dashed {colors.outline}'
    radius: '{rounded.card}'
  wordcell:
    label: '{typography.cell-number}'
    empty: '2px solid {colors.outline}'
  tile:
    size: 'width max({components.card.width}, {spacing.touch-min}); height {components.card.height}, compact 44px when the word needs more than one row'
    glyph: '{typography.card-letter.fontSize} from the card width, centred in a wider tile'
    compactGlyph: '22px; Qu 18px'
    gap: '{spacing.card-gap}'
  button-primary:
    background: '{colors.accent-orange}'
    ink: '{colors.ink-on-accent}'
    height: 48px
    radius: '{rounded.full}'
  button-secondary:
    background: '{colors.surface-raised}'
    border: '1px solid {colors.outline}'
    ink: '{colors.ink-primary}'
    height: '{spacing.touch-min}'
    radius: '{rounded.full}'
  button-danger:
    background: '{colors.error}'
    ink: '{colors.ink-on-accent}'
    height: '{spacing.touch-min}'
    radius: '{rounded.full}'
  top-bar:
    height: 44px
    background: '{colors.table}'
  action-bar:
    height: '60px content + env(safe-area-inset-bottom)'
    position: 'sticky; bottom: 0'
    paddingBottom: 'env(safe-area-inset-bottom), on the surface background'
    background: '{colors.surface}'
  tray-band:
    background: '{colors.surface}'
    radius: '{rounded.md}'
  sheet:
    background: '{colors.surface}'
    radius: '{rounded.lg} {rounded.lg} 0 0'
  dialog:
    background: '{colors.surface-raised}'
    radius: '{rounded.md}'
  view-sheet:
    background: '{colors.surface}'
    radius: '{rounded.lg}'
    width: 'board width'
    maxHeight: '80% of the viewport height, scrolls inside beyond that'
---

# WordCell — Design Spine

`EXPERIENCE.md` (same folder) owns behaviour: phases, gestures, states and flows. This file owns
how WordCell looks. Where a mock or a later import disagrees with either spine, the spines win.
Rule ids (R-xx) and decisions (Q-xx) refer to `docs/game-flow-spec.md` v0.7.

## Brand & Style

WordCell is a quiet card table for one. It borrows the posture of a good solitaire app: the cards
are the interface, chrome recedes, and nothing moves unless the player moved it. The letters are
the only thing with presence, so they get a real serif face on a dark card, the way the BGA
quilled-letter art put a letter on charcoal. There are no hints (Q-19), no sound (Q-20), no
celebration beyond a short fly-to-cell animation and the end screen's light-hearted band message.

Two accents carry interaction meaning; destination blue and error red are status colours, each
paired with a glyph. The error fill also marks a destructive action (the danger buttons); otherwise
error red is status only. **Teal** says "you can act here" (selection,
the drop target under a drag, legal WordCells). **Orange** marks commit actions and value (the ×2 badge, the next
free letter); every primary commit action is listed in Components → Buttons. A muted blue marks
the destination block, which the player can resize but never rearrange (R-32).

One dark theme in v1. [ASSUMPTION A-D1]

## Colors

- **Table (`#15171B`)** is the page background behind the board and the top bar. It stays darker
  than every card so the card edges read without shadows.
- **Surface (`#1E2127`)** holds the tray band, the action bar, sheets. **Surface raised
  (`#282C34`)** is for dialogs and secondary buttons. **Hairline (`#363B45`)** draws dividers
  only. **Outline (`#6E7480`)** draws empty WordCells, placeholder slots and ghost slots: 3.8:1 on
  table, 3.4:1 on surface (WCAG 1.4.11).
- **Card face (`#23262C`) / card edge (`#6A707C`) / card ink (`#F3EEE4`)** make every card. The
  edge is 3.6:1 on table and 3.2:1 on surface, so a card's outline and a tray tile's outline read
  without shadows (WCAG 1.4.11). Placeholder slots stay distinct from cards by their 2 px dashed
  outline. Ivory on charcoal is 13.1:1,
  so letters stay legible at the smallest card (40 px wide at a 360 px viewport).
- **Ink primary / secondary / disabled** are UI text. Secondary on surface is 6.4:1. Disabled on
  surface raised is 2.49:1; it is used only for inactive controls, which WCAG exempts. In Composing, a disabled Validate
  always says why in its own label, in ink secondary (5.6:1 on surface raised, EXPERIENCE.md). In
  Idle it reads plain `Validate` in ink disabled unless the dictionary is loading or failed, when
  it shows that reason in ink secondary.
- **Accent teal (`#3DBDB5`)**: selection outline, drop-target highlight, legal-target ring,
  focus ring (see Components → Focus ring). 7.0:1 on surface, 6.6:1 on a card. Never used for
  text longer than a label.
- **Accent orange (`#EF7A3D`)**: primary button fill (ink `#15171B` on it is 6.4:1), the `QU`
  ×2 badge, the "next free letter" star in Place. Never a background for large areas.
- **Destination (`#7FA2D6`) / destination fill (`#2E3A52`)**: outline and tile fill of the
  locked destination block in the tray and of the D cards in the destination column. Ivory on the
  fill is 9.9:1. Always paired with a lock glyph, so it never relies on hue alone.
- **Error (`#F08A84`)**: invalid-word message text, the dictionary-failed banner line, the menu
  error dot and the danger button. 6.7:1 on surface. There is no red fill behind game content.
- **Scrim (`#000000B3`)** dims the board under dialogs, sheets and the WordCell view.

Avoid: gradients on cards, colour-coded letters, green "success" states (a valid word simply
advances), any third interaction accent.

## Typography

- **Card letters** use one serif display face with strong strokes, bundled as a static woff2
  instance subset (A–Z plus `u` for the `Qu` glyph), named `WordCell Serif` in CSS. The face is
  Fraunces (SIL OFL), instanced at wght 600, opsz 48, SOFT 0 and WONK 0 [ASSUMPTION A-D2]. It is
  precached with the app shell and declared with `font-display: block`. The generic `serif` in the
  font stack is only the CSS terminator, not a fallback face. A failed font load is surfaced like
  any other failed precache asset, not hidden (CLAUDE.md rule 6). The size ratios in this spine were
  set for that face; a substitute needs a spine change, not a build choice. The
  subset is part of the brief's 600 KB budget (brief §6.8); it is expected to be well under
  20 KB. Size is `{typography.card-letter.fontSize}`, so it scales with the card. The subset is
  letters only: numbers and symbols are always set in the sans.
- **`QU`** is set as `Qu` (capital Q, small u) in one glyph box; `Qu` is set at fontSize
  0.44 × card width, so it reads as one card. It is centred vertically in the region from 12 px below
  the card top to the bottom of the letter band (Components → `QU` card).
- **The word line** in the tray renders only the card letters, in the same serif at
  `{typography.word-line.fontSize}`, shrinking to a minimum of 14 px to fit the band width;
  uppercase, letter-spaced, with the destination letters underlined in `{colors.destination}` in
  Composing. A `QU` card shows as `QU`, one unit, underlined as one unit when it is a D card. The
  meta text in the control row (letter count in Composing; letter count, target and points in
  Place) is ui-label sans.
- **UI text** is the platform sans (`system-ui`, Roboto on Android) in five roles: title, body,
  label, button label, cell number. Scores, the end score and the timer use tabular numerals so
  they do not jitter. Every negative number shown (score, end score, penalty, Statistics, the
  Place preview) uses the minus sign U+2212 (`−`).
- No all-caps UI labels, no text below 11 px (`{typography.card-badge}` text is the only 11 px
  text: the ×2 badge, the WordCell count badge, the free-letter origin tag, the placement strip's
  `bottom` / `top` tags and the WordCell view's `top` tag).
- **Icons** are inline SVG, not emoji or font glyphs, in `{colors.ink-primary}` unless stated:
  lock (`{colors.destination}`), `↩`, `✕` (`{colors.error}`), `⇄`, `☰`, `↶`, `↷`, `★`
  (`{colors.accent-orange}`), `▼`, check (`{colors.ink-on-accent}` on the teal check chip), back arrow, grab handle, and
  the six menu leading glyphs (plus, replay, flag, bar chart, sliders, question mark).
- **Text size.** All text on the Board surface, everything inside the height rule including the
  dictionary-failed banner, the foot row, the control row, badges and messages, is fixed px, so
  the height rule holds. Text in panels, sheets and dialogs is in rem and scales with the browser font
  size: their typography tokens convert at 16 px = 1 rem, and their minimums scale too (the 14 px
  stats floor is 0.875 rem). [ASSUMPTION A-D9]

## Layout & Spacing

Spacing scale 4 / 8 / 12 / 16 / 24 / 32 px. Every interactive target is at least
`{spacing.touch-min}` (44 px) in both directions (carryover §5).

**Portrait phone (the design target; reference viewport 412 × 915, Pixel 7):**

```
┌──────────────────────────────────────────┐  top bar 44 px
│ ☰             Score 124          4:12    │  menu · live score (R-82) · timer if on (R-76)
├──────────────────────────────────────────┤
│                                          │  leftover height (height rule)
│  3    4    5    6    7    8    9    10   │  WordCell row: number above each cell
│ [ ]  [A]  [ ]  [L]  [ ]  [ ]  [ ]  [ ]   │  one card slot per cell, stack-count badge
├──────────────────────────────────────────┤  gap 4 px
│  B A K E D                               │  tray band, height reserved in every phase
│ [#B][A][K][E][D]                          │  tiles (D block locked, blue; [#] = lock)
│ [−] 1 [+]   [⇄ Flip]           5 letters │  control row: D-block controls, letter count
├──────────────────────────────────────────┤
│ F    X    L    …                         │  8 column slots, slot = card width + 4
│ E    O    M                              │  fanned: strip ≥ 44 px, last card full
│ …                                        │
│ ░    ░    ░                              │  foot row 44 px (tap-drop pad, EXPERIENCE.md)
├──────────────────────────────────────────┤
│ [↶] [          Validate            ] [↷] │  action bar 60 px, thumb zone
└──────────────────────────────────────────┘
```

- **Available width** = viewport width − 2 × gutter: `{spacing.gutter-phone}`, or
  `{spacing.gutter-desktop}` under `(hover: hover) and (pointer: fine)`. Card width w = max(40,
  min(width-derived, height-derived)): width-derived is floor(available width ÷ 8 − 4),
  height-derived comes from the height rule below. The 40 floor wins for any available width below
  352 px whatever the gutter, and the page then pans horizontally. Card height H = round(w × 4/3);
  **column slot** = w + 4; board width = 8 × slot, centred. The top bar, the dictionary-failed
  banner, the tray band and the action bar span the board width, centred, on every form factor. At 412 px: card 46 × 61 px, slot 50 px,
  board 400 px. At the minimum supported width of 360 px: card 40 × 53 px, slot 44 px, board
  352 px. [ASSUMPTION A-D3: minimum supported viewport 360 × 740 CSS px]
- **Hit rects.** A column card, a WordCell, a tray tile and a placement-strip tile each hit-test
  on its full slot pitch (at least 44 × 44), not on the drawn card. At 360 px a 40 px card sits in
  a 44 px slot.
- **WordCell row** uses the same eight slots as the columns, so cell *n* sits above column
  *n − 2* [ASSUMPTION A-D7]. Cell numbers 3–10 sit above the cells, left to right (carryover §1).
- **Tray band** sits directly under the WordCell row, above the columns (spec §7.8). Owner
  decision 2026-09-27: the tray sits directly under the WordCell row so free letters are next to
  it; Validate, Confirm and Undo stay in the bottom action bar. This relaxes brief §9's one-thumb
  goal for the tray only. The band keeps its reserved height in every phase, so neither the
  WordCell row nor the columns move when the tray opens. It holds a word line, the
  tile rows and a control row (which also carries the meta text).
  - Tile width = max(card width, 44 px); tile gap 4 px; band inner padding 8 px each side. Tiles
    per row = floor((band inner width + 4) ÷ (tile width + 4)). D tiles keep the same 4 px pitch;
    the destination block is drawn joined over the gaps. The tile glyph is sized from the card
    width and centred in a wider tile.
  - Tiles are card height while the word fits one row. When it does not, every tile switches to
    compact height 44 px (same width, no bottom band, the ×2 badge stays, glyph 22 px, `Qu`
    18 px) and the tiles wrap. Tile mode and band height follow the tile count after any completed
    edit (drop, tap-add, removal, k change, Undo, Redo, Confirm, session restore), never during a
    drag. After Confirm the change applies once the fly-to-cell animation settles. The band grows only
    for words longer than 14 tiles; how the extra height is found is below. Tile rows are
    top-aligned in the tile area, with no gaps beyond the 4 px tile gap.
  - During a free-letter or tile drag over the tray, the insertion point is previewed. The layout
    is full when the tile count after the drop would exceed its capacity: 7 per row × the current
    rows (card-height mode holds one row). A reorder drag never changes the count, so it always
    parts the tiles. A free-letter drag parts the tiles while the layout has room; when it is
    full, no tile moves and a 3 px `{colors.accent-teal}` insertion caret, tile height, marks the
    insertion point between tiles. This holds at any row count. Mode and band height switch after
    release.
  - Reserved height = word line 24 + max(H, 2 × 44 + 4) + control row 44 + padding 8 top and
    8 bottom. That is 176 px for any H ≤ 92.
  - At 412 px (board 400, inner width 384, tile 46): 7 tiles per row, 14 in two compact rows. At
    360 px (board 352, inner width 336, tile 44): 7 tiles per row, 14 in two compact rows.
  - A word longer than two compact rows wraps further. For r compact rows the band gains
    max(0, r × 44 + (r − 1) × 4 − max(H, 92)) px. Phone (H ≤ 92): 3 rows +48, 4 rows +96 (the
    longest word, 22 cards). Desktop (H = 95): 3 rows +45, 4 rows +93. This is the one exception to the fixed height: the
    band takes the extra height from the leftover band first. The top bar stays; the WordCell row
    and the tray shift up by the amount of leftover used, and the columns keep their position as
    long as leftover remains. Once the leftover is used up the columns shift down and the page
    scrolls; the sticky action bar does not move. Changes apply only after the edit completes,
    and hit rects are recomputed before the next gesture. w is not recomputed. [ASSUMPTION A-D4]
- **Columns**: a column never gains cards (the destination column only loses them, R-60), so it
  holds at most 7 cards and its height is fixed: 6 strips + 1 card + the foot row. The strip is
  `max(44 px, round(0.72 × card height))`, and every card's glyph sits inside its top 72 %, so every
  letter in a fanned column is fully visible.
- **Action bar** is `position: sticky; bottom: 0` with `padding-bottom:
  env(safe-area-inset-bottom)` on the surface background, so its controls sit above the Android
  gesture area and Validate, Confirm and Undo stay on screen whenever the page
  scrolls. Its content is 60 px tall with 4 px padding and 4 px gaps; its total height is 60 px +
  `env(safe-area-inset-bottom)`. Undo (`↶`) left and
  Redo (`↷`) right are 52 × 52 icon-only buttons with accessible names (`Undo`, `Redo`) and
  tooltips on desktop. The primary action (48 px tall) takes the remaining width between them,
  about 232 px at 360 px and 280 px at 412 px, so both thumbs reach it. Its label shrinks to
  `{typography.ui-label}` size before it ellipsizes.
- **Height rule.** The layout height is `safe-area-inset-top + top bar 44 + cell-number label 16
  + WordCell H + gap 4 + tray band reserved height + columns (6 × strip + H) + foot row 44 +
  action bar 60 + safe-area-inset-bottom`, with H = round(4w/3) and strip = max(44,
  round(0.72 × H)). For H ≤ 92 that is 344 + 2H + 6 × strip plus insets; for H > 92 it is
  252 + 3H + 6 × strip plus insets. The rule measures `window.innerHeight`, with `viewport-fit=cover`
  in the viewport meta so the safe-area terms are real. The height-derived
  width is the largest integer w for which that sum fits the viewport height; when it wins, the
  board narrows, centred. When even w = 40 (H = 53) does not fit (short windows,
  phone landscape, small laptops), the board stays at H = 53 and the page scrolls vertically. When
  the width wins and height is left over, the leftover goes between the top bar and the WordCell
  row, pushing the play area towards the thumb. Test reference viewports are 412 × 915 (Pixel 7)
  and 412 × 839 (Playwright's Pixel 7 profile). At both the width wins: w = 46, H = 61, strip 44,
  sum 730 px plus insets, leaving 185 px and 109 px. The minimum case (w = 40, H = 53, strip 44)
  sums to 714 px plus insets. Scrolling starts exactly when 714 + actual insets > innerHeight.
  The 740 in A-D3 is only the supported-device floor; it assumes at most 26 px of insets (a 24 px
  allowance, rounded up).
  w is recomputed on `resize` and `orientationchange`, deferred until no gesture or animation is
  in progress, so cards and hit rects never move under a finger. Page scrolling counts as a
  gesture for this deferral. A resize that changes only innerHeight, by less than 80 px (the
  browser toolbar showing or hiding), does not recompute w. [ASSUMPTION A-D11]
- **Scrolling.** Cards, tiles and WordCells keep `touch-action: none`. When the page must scroll
  (below the minimum height, or once band growth or the dictionary-failed banner has used up the
  leftover band), vertical panning starts only on non-card regions, which get `touch-action:
  pan-y`: the top bar, the leftover band, the WordCell number labels, the foot row when no tail is
  selected, the empty space below a column's bottom card, the tray band background outside the
  tiles and the action bar background. Widths below 360 px are unsupported. The switch keys on the
  board width: when the board is wider than the available width, the layout keeps 44 px slots and
  the page pans horizontally from the same regions, which then get `touch-action: pan-x pan-y`
  (horizontal pan needs it); otherwise they keep `pan-y`.

**Desktop browser (spec §7.8 default confirmed: the same layout, widened).** The board is centred
with `{spacing.gutter-desktop}` gutters and grows until the height rule caps it (71 × 95 px cards,
600 px board, in a 1080 p window with a 950 px tall viewport: 252 + 3H + 6 × strip is 945 px;
72 × 96 would need 954). Nothing moves to a side panel; the tray
band stays between the WordCell row and the columns and the action bar stays under the columns,
inside the board width. No landscape phone layout:
the installed app is locked to portrait (manifest), and a phone browser in landscape keeps the
board at H = 53 and scrolls vertically.

## Elevation & Depth

Depth is tonal, not shadowed, with two exceptions that mimic physical cards:

- **A lifted card or tail** (drag, or tap-selected) gets a soft shadow `0 6px 16px #0008` and
  rises 8 px (tap-selected) or follows the finger (drag). The lifted cards draw above their
  neighbours; a whole-column lift may overlap the tray band by up to 8 px, which is allowed.
- **Overlays** (WordCell view, sheets, dialogs, end screen) sit above `{colors.scrim}`.

Layer order: table → board surfaces → cards → selection/lift → sticky bars (top bar,
dictionary-failed banner, action bar, collapsed end-sheet bar) → hover peek → drag layer → scrim →
overlay. A dragged tail passes over the bars.
The action bar additionally sits above the end sheet's scrim. It sits below every other scrim and overlay
(dialogs, panels, the sticky view).

## Shapes

`{rounded.card}` (6 px) for cards, tiles, placeholder slots and empty WordCells; it matches a
real card at this scale. `{rounded.md}` for the tray band and dialogs, `{rounded.lg}` for the top
of bottom sheets and all corners of the WordCell view sheet, `{rounded.full}` for buttons. The count badge and the ×2 badge are
pills (`{rounded.full}`); among badges only the error dot is a circle. The 44 × 44 icon buttons
(menu, `−`, `+`) and the 52 × 52 Undo and Redo buttons are circles.

## Components

- **Card.** `{components.card}`: face, 1 px edge, ivory serif glyph centred in the letter band
  (top 72 %). The bottom 28 % carries a thin flourish, a nod to the BGA quilled art, drawn in CSS: a
  centred 1 px curve in `{colors.card-edge}` spanning 60 % of the card width at 86 % of the card
  height. The flourish is omitted on tiles whose bottom band carries
  a tag or glyph. States: *normal*; *hover* (desktop, under `(hover: hover) and
  (pointer: fine)` only: in Idle with nothing selected, a 1 px teal outline around the tail that
  would lift; with a tail selected, hovering anywhere over another column shows the drop-target
  highlight on it, while the source column shows it only when its empty space, placeholder or
  `Here` foot pad is hovered; hovering a source-column card other than the selected top card shows
  the 1 px teal outline of the tail a click would re-select, and hovering the selected top card
  shows nothing; in Composing, hovering a destination-column card draws a 1 px teal outline around
  the D that a click would set; otherwise no hover); *selected* (teal 2 px outline,
  lifted 8 px); *dragging* (the tail follows the finger, lifted with the shadow; its former places
  in the column show as ghosts); *drop target* (the target column's bottom card or placeholder gets
  a teal 3 px outline and a 12 % teal wash; on the source column with a partial tail, the lowest
  card not in the tail, the future top of D (R-21), takes it; only when the whole column is lifted
  does the source column's top slot show the placeholder under the ghosts, and the placeholder
  takes the outline. At the start of a drag the source column is not highlighted; it becomes the
  highlighted target only after the drag's target has left it and returned (Q-34)); *in destination block* (destination-fill face, blue outline, lock glyph
  top-left in a 10 × 12 px box inset 2 px); *ghost* (source slot while its cards are in the tray: 1 px dashed `{colors.outline}`
  outline, no face, no glyph, distinct from the 2 px dashed placeholder; S cards in Composing, every word card, S and D, in Place;
  in Composing, when the emptied source column is also the destination column, the placeholder is
  drawn under the S ghosts, as during the drag); *inert*
  (Composing: every column except the destination column; Place: all columns; Game over: all
  columns (R-75); R-39): unchanged look, no hover. S ghosts are inert too.
- **Focus ring.** A 2 px `{colors.accent-teal}` ring at 2 px offset, with a `{colors.table}` gap
  between the ring and the element. It is distinct from the selection outline (outline plus lift);
  when both apply, both are drawn. On a fanned column card the focus ring encloses the card's
  visible strip; the selection outline encloses the whole lifted tail.
- **`QU` card.** Glyph `Qu`, plus the **×2 badge** (Q-06): an orange pill, `{typography.card-badge}`,
  reading `×2` in `{colors.ink-on-accent}`, in a reserved box in the top-right corner of the letter band (a fixed 18 × 12 px at
  every card size), so it stays visible in a fanned column, in the tray and on a WordCell top.
  The `Qu` glyph is centred vertically in the region from 12 px below the card top to the bottom
  of the letter band, so it stays clear of the badge. On a D-card `QU` the lock takes the top-left
  corner and the badge the top-right.
- **Column slot.** Eight equal slots. On touch the column number is not drawn (the position is the
  identity). Under `(hover: hover) and (pointer: fine)` (desktop) the foot row shows the column number, centred, in
  ink-secondary ui-label, to support the 1–8 keys; with a tail selected, the foot shows `Here`
  on the source column and the wash and dashed border on the others, replacing the column
  number. **Placeholder slot** (empty column, spec
  §7.7): card-sized dashed `{colors.outline}` outline at the column's top. **Foot pad**: 44 px row
  under each column; on touch it stays empty except when a tail is tap-selected, when the source
  column's whole foot pad (slot width × 44) fills with `{colors.surface-raised}` with `Here` in
  ui-label, centred, no horizontal padding (this `Here` pad remains the tap route for a self-drop,
  R-14, Q-34); the other feet show an 8 % teal wash plus a 1 px
  dashed `{colors.outline}` border (a shape cue).
- **WordCell.** Number label above; below it either an empty outline or the top card. When the
  cell holds 2 or more cards a count badge (e.g. `4`) sits inside the cell's card rect,
  bottom-right, inset 2 px: a 16 px tall pill, `{typography.card-badge}`, ink-primary on
  surface-raised. It keeps counting the used or dragged top card until commit (R-61). It is drawn
  below a lifted tail. States: *available*; *used this word* (its used top card shown at 40 % opacity with
  a hatch of 1 px `{colors.outline}` lines at 45° every 6 px, R-33; the card beneath is not revealed until commit, R-61);
  *legal target* in Place (teal 2 px ring); *selected target* (teal 3 px ring and a check chip at the cell's top-left, a 14 px teal circle
  with an ink-on-accent check;
  the strip's `top` tag and star show the future top card); *not legal* in Place (35 % opacity).
  During a drag from a WordCell top, the source cell shows the dragged card's slot as a 1 px
  dashed `{colors.outline}` ghost; the card beneath is not revealed (R-61). The cell takes the
  used state only on a successful drop.
  On a used cell in Place the hatch stays and a legal or selected ring is drawn over it at full
  opacity; a used cell that is not legal shows the card at 40 % opacity with the hatch, and the
  whole cell (outline, label, badge) is additionally drawn at 35 %.
- **WordCell view** (R-65). Every card in the cell at card size. The sheet is
  `{components.view-sheet}`: a centred dialog-style sheet, all corners `{rounded.lg}`, as wide as
  the board. Cards per row = floor((sheet
  inner width + 4) ÷ (card width + 4)), with 16 px sheet padding each side; that is 7 at 412 px (inner 368 px) and 7 at 360 px (inner 320 px); the formula governs.
  Row 1 sits at the top of the sheet and holds the bottom card first, left to right; the last
  card (the top) comes last and is marked `top`. The tap, `Space` and long-press views sit on this
  sheet centred above the board over the scrim, with cell number and card count as the title. Its
  max height is 80 % of the viewport height; beyond that it scrolls vertically inside. The *hover
  peek* (desktop, under `(hover: hover) and (pointer: fine)` only) is anchored directly below the
  hovered cell, over the tray band and the columns, with no scrim, above the cards in the layer
  order, clamped inside the board. It shows cards at card size, 7 per row, at most two rows: the
  top 14 cards (the most recent), oldest of them first, the top card last and tagged `top`. When
  the cell holds more than 14 cards, a ui-label `+n older cards` line (n = card count − 14) sits
  above the first row. The full view is
  the sticky view.
- **Tray band.** `{components.tray-band}`. Three parts: the word line (the word only, serif,
  20 px shrinking to 14 px to fit, D letters underlined blue in Composing); the tile rows; the
  control row. In Composing the control row holds `[−] k [+] [⇄ Flip]` left and the letter count
  (ui-label: `5 letters`, singular `1 letter`) right-aligned. In Place the word line shows the
  validated word in word order; reordering the strip does not change it. The control row holds the
  meta line, right-aligned like the letter count. In Idle it shows a single
  ui-label line in ink-secondary (the pending word or nothing, EXPERIENCE.md); it never wraps, and
  the word part ellipsizes first.
- **Tile.** A card in the tray. Movable tiles (S and free letters) are normal cards. A free-letter
  tile carries its WordCell number tag (`6`, `{typography.card-badge}`) in the bottom band, left,
  so the player sees where it came from. *Tap-selected tile*: teal 2 px outline, lifted 4 px. In
  Composing only, a selected free-letter tile also shows a `↩` return glyph in the bottom band,
  right; there is no `↩` in Place. On compact
  tiles (no bottom band) the tag moves to the top-left corner and `↩` takes the ×2 corner
  position, unless the tile is `QU`, where `↩` sits bottom-right as an overlay. A compact tile's letter glyph is
  centred on the tile's full 44 px height, clear of the corner marks. **Destination
  block** (Composing): the D tiles joined edge to edge in destination-fill with a single blue
  outline around the block and one lock glyph at the block's top-left. When the block wraps, each
  row segment gets its own outline and its own lock glyph at the segment's top-left, so blue
  never stands alone.
- **D-block controls.** `−` and `+` as 44 × 44 secondary buttons with the count `k` between
  them, then `⇄ Flip` as a secondary button. On an empty destination column the caption `Empty
  column: no cards join the word` (R-31) replaces them in the control row; the controls are not
  shown. The caption is a single line and ellipsizes before the letter count is cut.
- **Placement strip** (Place). The tray band's tile rows, now holding every word card. D cards
  here are normal movable tiles: no lock, no blue block outline, no D underline in the word line.
  The strip reads row by row, left to right. The first tile carries a `bottom` tag and the last
  tile a `top` tag plus the orange star (next free letter, R-50, R-52), in
  `{typography.card-badge}`: the tag in the bottom band left, the star in the bottom band right.
  On a full-height free-letter tile in Place the origin tag moves to the top-left corner.
  [ASSUMPTION A-D10] Compact tiles (no bottom band) use this corner map. Top-left: the position
  mark, a `▼` glyph on the first tile for bottom, the orange `★` on the last tile for top; these
  glyphs replace the `bottom` / `top` words. Top-right: the ×2 badge (`QU`). Bottom-left: the
  free-letter origin tag (11 px). Nothing else. Full-height tiles keep the layout above. The word
  line shows `BALKED`; the control row holds the meta `6 letters → cell 6 · +30`, the net score
  change on commit (EXPERIENCE.md, R-80), formatted `+30`, `±0` or `−1` (U+2212).
- **Invalid-word message.** One ui-body line in `{colors.error}` with a `✕` glyph, in the word-line
  position of the tray band, replacing the word line until it clears (EXPERIENCE.md message
  catalogue). It shrinks to 14 px to fit, like the word line, then ellipsizes the word part.
- **Buttons.** Primary (orange pill, 48 px tall, `{typography.button-label}`): Validate, Confirm,
  New game in the action bar when the game is over, the confirm action of the New game and Replay
  this deal dialogs, and New game on the session-rejected message. Secondary (raised pill with a 1 px `{colors.outline}` border so its shape reads, since
  surface-raised on surface is 1.15:1; 44 px; inside a dialog it uses a `{colors.surface}` fill,
  so its outline border keeps 3.4:1 against that fill):
  D-block controls, Reload, dialog dismissals; Undo and Redo are 52 × 52 icon-only secondary
  buttons (Layout & Spacing → Action bar). Danger (error fill): Reset history
  (history notice, end sheet, Statistics) and Delete history (confirm dialog). Disabled:
  ink-disabled on surface-raised, no fill change on hover. In Composing, a disabled Validate always
  says why in its own label (`Need 3+ letters`, `Loading words…`, `Word list unavailable`), in
  ink-secondary (5.6:1 on surface-raised), so no caption is needed. In Idle it reads plain
  `Validate` in ink-disabled unless the dictionary is loading or failed, when it shows that reason
  in ink-secondary.
- **Top bar.** Menu button (☰, 44 × 44) left; `Score 124` centred in `{typography.score}`; timer
  `4:12` right in the same style, hidden when Show timer is off (R-76). While the score history is
  unreadable the ☰ button carries an 8 px `{colors.error}` circle on its top-right.
- **Dictionary-failed banner.** A 44 px strip directly under the top bar, full board width:
  `Word list didn't load.` in ui-label `{colors.error}` (single line, ellipsis if needed) and a
  secondary `Reload` button. Score and timer stay in the top bar (R-82, R-76). While shown, the
  strip takes its 44 px from the leftover band first: while leftover remains, the WordCell row,
  the tray and the columns do not move; once it is used up they shift down and the page scrolls.
  w is not recomputed. Showing or hiding the banner is deferred until no gesture is in progress
  (A-D11), and hit rects are recomputed before the next gesture. This is a rare failure state.
- **Menu sheet.** Bottom sheet, one 52 px row per item with a leading glyph: New game, Replay
  this deal, Give up, Statistics, Preferences, How to play; footer line with the app version in
  ink-secondary. Give up outside Idle while playing is a disabled row: label and glyph in
  ink-disabled on surface, no press feedback.
- **Dialog.** Centred, max 320 px wide, title (ui-title), one or two body lines, buttons
  right-aligned: dismissive secondary first, the action second.
- **History notice.** Uses the Dialog component, with a danger `Reset history` action.
- **End screen.** A bottom sheet over the dimmed board: outcome line (ui-title), score
  (`{typography.end-score}`), band name (ui-title, ink-primary), band message (ui-body), then two
  stat lines (longest word, words placed) and, after a give-up, the penalty line. When the score
  history is unreadable, the history-unreadable block (ui-body text plus a danger `Reset history`,
  EXPERIENCE.md) sits under the stat lines. Buttons: Replay this deal and Statistics (secondary).
  Expanded, the sheet is at most 80 % of the viewport height and scrolls inside beyond that. The
  sheet ends above the action bar, which sits above the scrim and stays tappable with Undo and the
  primary `New game`; the scrim covers the rest of the board. In Game over the tray band is empty
  at its reserved height. The grab handle, a scrim tap, back or `Esc` collapses the sheet to a
  56 px bar showing score and band, directly above the action bar, over the bottom of the columns;
  tapping the bar expands it. While collapsed there is no scrim, and WordCells can be tapped to
  view.
- **Panels** (Statistics, Preferences, How to play). Full-screen on table, back arrow and title in
  a 48 px header, content max 560 px wide centred. Statistics is a 2 × 3 grid of stat tiles
  (label ui-label ink-secondary, value in `{typography.score}`). The longest-word tile's word
  shrinks to 14 px first, then wraps with `overflow-wrap: anywhere`. Preferences uses a three-way segmented control
  (Fast / Normal / Slow) and a switch (Show timer). The selected segment and the switch's on state
  use a `{colors.accent-teal}` fill with `{colors.ink-on-accent}` text and thumb.
- **Blocking message** (session rejected, spec §2). Replaces the board: a dialog-styled card
  centred on the table, no scrim, one primary button.
- **App icon and manifest.** Icon: a single card at a slight tilt, ivory serif `W` on card-face,
  a flourish of two flat strokes, one teal and one orange, at the bottom (the one decorative use
  of the accents; no gradient), on a
  `{colors.table}` field; the maskable variant keeps
  the card inside the central 80 % safe zone. Manifest: `name` "WordCell", `short_name`
  "WordCell", `description` "A solo word card game in the spirit of FreeCell.", `theme_color`
  and `background_color` `#15171B`, `display` `standalone`, `orientation` `portrait`, icons
  192 and 512 (`any`) and 512 (`maskable`). [ASSUMPTION A-D5]

**Card art decision (spec §7.11).** v1 renders cards as CSS with the bundled serif, not with the
BGA sprite sheet. Reasons: the sprite is 72 × 96 px, which blurs at the Pixel 7's device pixel
ratio of 2.6 once a card is 46 px wide; its letters fill the whole card, so a fanned column would
hide the lower part of letters that differ only there (E/F, P/R, O/Q); it has no place for the ×2
badge; and text cards cost almost nothing against the 600 KB budget. The palette and the flourish
keep the sprite's character. The sprite can return later as a skin without changing any
behaviour, because the sprite cell is derived from each card's letter, and `CardId`'s alphabetical order
matches the sprite's. [ASSUMPTION A-D6]

## Do's and Don'ts

| Do | Don't |
|---|---|
| Teal only for "act here", orange only for "commit", the ×2 badge and the next-free-letter star | Add a third interaction accent beyond teal and orange (destination blue and error red are status colours; the error fill also marks the danger buttons), or colour-code letters |
| Pair every colour state with a shape or glyph (lock, hatch, ring, star, ✕) | Signal a state by hue alone |
| Keep every target ≥ 44 × 44 px, including card strips and the foot pads | Shrink strips below 44 px to fit more; wrap or scroll instead |
| Keep the tray band's height fixed across Idle, Composing and Place (one exception: a word beyond two compact rows grows it) | Let the columns jump when the tray opens |
| Draw the glyph in the card's top 72 % | Centre the glyph on the full card height |
| Show the destination block as one locked unit | Draw drag handles or reorder affordances on D tiles in Composing |
| Use the scrim only for overlays | Dim the board to show a phase change |

## Open items

### Assumptions

Jared confirmed every assumption below on 2026-09-27; the `[ASSUMPTION]` tags stay for traceability.

| Id | Assumption | Where |
|---|---|---|
| A-D1 | One dark theme in v1; no light theme and no `prefers-color-scheme` switch. | Brand & Style |
| A-D2 | Card letters use a bundled static instance subset of Fraunces (SIL OFL) at wght 600, opsz 48, SOFT 0, WONK 0, precached with the app shell with `font-display: block`, not the system serif; the spine's size ratios are set for that face, so a substitute needs a spine change. | Typography |
| A-D3 | Minimum supported viewport is 360 × 740 CSS px (714 px at H = 53 plus a 24 px inset allowance is 738 px, rounded up to 740, so it covers up to 26 px of insets). The page scrolls exactly when 714 + actual insets > innerHeight; 740 is only the supported-device floor. Below 740 px tall the page may scroll vertically; the exact trigger is the height-rule inequality 714 + actual insets > innerHeight. When the board is wider than the available width (below 360 px wide) the layout keeps 44 px targets and the page pans horizontally. | Layout & Spacing |
| A-D4 | Long words switch tiles to 44 px compact height and wrap; r compact rows grow the band by max(0, r × 44 + (r − 1) × 4 − max(H, 92)) px (+48 / +96 for 3 / 4 rows on phones, +45 / +93 at H = 95), taken from the leftover band first (the WordCell row and tray shift up, the columns keep their position); once the leftover is used up the columns shift down and the page scrolls; the sticky action bar does not move. Applied after the edit completes; hit rects are recomputed before the next gesture. | Layout & Spacing |
| A-D5 | Manifest name, short name, description and colours as listed; icon is a tilted `W` card. | Components |
| A-D6 | CSS-rendered cards replace the BGA sprite sheet in v1. | Components |
| A-D7 | Cell *n* sits above column *n − 2* (both rows use the same eight slots). | Layout & Spacing |
| A-D9 | All text on the Board surface, everything inside the height rule including the banner, foot row, control row, badges and messages, is fixed px so the height rule holds; text in panels, sheets and dialogs is in rem and scales with the browser font size. | Typography |
| A-D10 | In Place, a full-height free-letter tile's origin tag moves to the top-left corner so the bottom band holds the `bottom` / `top` tag and the star; a compact tile puts the position mark (`▼` / `★`) top-left, the ×2 badge top-right and the origin tag bottom-left. | Components |
| A-D11 | The height rule measures `window.innerHeight` with `viewport-fit=cover`; w is recomputed on `resize` and `orientationchange`, deferred until no gesture or animation is in progress; page scrolling counts as a gesture; a resize that changes only innerHeight by less than 80 px does not recompute w. | Layout & Spacing |

### Open questions

| # | Question | Proposed default | Status |
|---|---|---|---|

None.
