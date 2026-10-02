---
id: 2
type: story
title: "Board render in Idle and Game over with bars"
parent: epic-board-and-gestures
covers: [CAP-2, CAP-3]
after: [1]
risk: high
---

# Board render in Idle and Game over with bars

## Description

Tracer bullet: replaces the epic 3 minimal board with Board.svelte iterating BAND_ORDER (no component names a neighbour band) at the w and band heights from entry 1 computed once at mount, Column.svelte (fanned cards, H, strip, slot and board from geometry.ts cardMetrics(w), the always-rendered placeholder slot, foot pad foot-<n> with the desktop column number, whole-slot column-<n> hit rect), Card.svelte as a full-slot-pitch wrapper carrying data-card-id, data-testid and data-place with a pointer-events: none face (glyph in the top 72 %, flourish, QU ×2 badge; F26), WordCellRow.svelte (labels 3–10, top card or empty outline, count badge at 2+, used, legal, selected-target (view.place.target) and not-legal (Place, cell and label 35 %; used cells keep their 40 % hatch under any ring) states (build-notes CAP-2, DESIGN WordCell)), the sticky TopBar (empty 44 px menu slot, Score <n> from displayScore via text.ts score(n) with U+2212 and tabular numerals, Undo/Redo icon buttons with desktop tooltips of the accessible name; F3), the dictionary banner in its band and the sticky ActionBar holding primary-action with epic 3's labels, enablement and New game sequence, a visually hidden h1 (F4), a new `R-03 …` test in smoke.spec.ts covering every column of session-idle-fresh (C-E4a), and e2e/placeholder.screens.spec.ts plus its two baselines deleted.

Interface: New src/ui/Board.svelte, Column.svelte, Card.svelte, WordCellRow.svelte, TopBar.svelte, ActionBar.svelte; App.svelte's active branch renders Board; text.ts gains score(n); WordCell elements carry data-wordcell="<3–10>", column hit rects data-column="<1–8>", foot pads data-foot="<1–8>" (build-notes CAP-4 attribute names); each band element carries data-band="<BandId>".

Tests: R-03 dealt layout rendered top→bottom per column (C-E4a, P4 supp.); R-82 (UI) score shown live during play; R-70/R-71 Undo and Redo enablement (P4 supp.; the Redo-into-Composing used-state half is entry 3); AD-14 one live element per card in Idle and Game over; 'AD-11 bands render in BAND_ORDER (default)'.

Owns: Board.svelte and the band components (the ActionBar's New game keeps calling overlays.resetForNewSession, which entry 5 widens), the slot-wrapper/face card structure (F26) every gesture entry hit-tests, the data-column/data-wordcell/data-foot attributes, and the F4 locator moves.

Mount inputs: read once at mount into Board-local state that entry 4's live layout replaces: width document.documentElement.clientWidth (build-notes CAP-1), innerHeight, insets {top: 0, bottom: 0} until entry 4's probe, hoverFine from one matchMedia('(hover: hover) and (pointer: fine)') read, trayRows 1, bannerShown false (the banner appears after mount, AD-16; leftover-first re-layout and anchoring stay with entry 4).

App: App.svelte keeps its halted/rejected/Board roots with dialogs beside the Board, and the Board root stays inert while the History notice is open (AD-13; history-notice.spec.ts:270). Epic 3's invalid-word line (game.feedback.rejectedWord, text.invalidWord) renders in the tray band's word-line position until entry 3 moves it into Tray.svelte (dictionary.spec.ts:91 stays green). column-<n> and wordcell-<n> contain their card wrappers; wordcell-<n> keeps aria-label 'WordCell <n>' on role="group".

Composing and Place: the Board renders view.columns and view.cells live as in Idle (data-place column/cell), with no tray tiles, ghosts or mirrors; entry 3 replaces that.

Bands: all bands always render; all but the banner take their height from the mount bands() result (tray reserved in every phase; leftover 0 px when bands() gives 0); the banner band is content-sized (0, or 44 px while dictionary.showBanner, sticky under the top bar) until entry 4. Only units ['columns','footRow'] and ['labels','wordcells'] get a wrapper, each one CSS grid whose [data-band] children are its row tracks (columns 6 × strip + H, footRow 44; labels 16, wordcells H), empty, first in the unit's DOM and pointer-events: none, so hits resolve to card or WordCell wrappers (build-notes CAP-4); each column-<n> is a grid item spanning both rows holding its card wrappers and foot-<n> (AD-12 hit rect incl. foot pad, build-notes CAP-1 contiguous), and each wordcell-<n> sits in the wordcells track with its label in the labels track, outside [data-wordcell] (F25). Every other band element is a direct Board-root child, so sticky bars stick against page scroll. [data-band] DOM order stays BAND_ORDER flattened.

Board: the root spans the viewport (F25, F8); top bar, banner, tray band and action bar span the centred board width (DESIGN Available width). Bars carry DESIGN's env() safe-area padding (top bar padding-top, banner top offset, action bar padding-bottom). Bar bands' bands() heights are content-box; env() padding adds on top (44/60 px content intact; stack may exceed innerHeight on inset devices until entry 4's probe feeds real insets).

Placeholder: absolutely positioned in the column's top slot, shown (DESIGN placeholder outline) iff the column is empty, otherwise visibility: hidden; no data-card-id.

Card: per SPEC F26, wordcell-<n> spans its full slot pitch (w + 4 wide, H tall) and each card wrapper is slot wide and strip tall, H tall for a column's last card and for WordCell cards. Face, glyph and count badge carry class hooks .face, .glyph, .count. The card wrapper keeps epic 3's touch-action: none and user-select: none. The glyph renders QU as `Qu` (DESIGN Card). Epic 3 style assertions on card-<id> (app-shell.spec.ts ~98–103 background and colour; pwa/font.spec.ts ~91–93 font family and weight) move to the face/glyph with unchanged values.

WordCellRow: every WordCell card is a live Card (data-place="cell") in DOM order bottom→top inside wordcell-<n>, stacked in the cell slot, only the top one visible and non-top ones visibility: hidden (live; toBeVisible and elementFromPoint skip them; build-notes CAP-2). Description's states render here; entry 3's R-33 (UI)/R-42 (UI) tests and screenshots cover the look. smoke.spec.ts's 'AD-17 WordCell cards render bottom → top' test keeps its name and DOM-order assertion; its visual y-order check (~57–65) becomes 'only the top card is visible': card-28 toBeVisible, card-42 and card-0 toBeHidden. Epic 3 board-ready waits on card-0 toBeVisible (helpers/restore.ts openBoard, blocking.spec.ts and others) fail where card 0 is a non-top cell card; those switch to toBeAttached under existing names, listed in the plan.

TopBar: Undo/Redo always carry a title attribute equal to text.undo / text.redo. The desktop foot column number is a span in foot-<n>, display: none outside a @media (hover: hover) and (pointer: fine) rule; hoverFine's matchMedia read feeds cardWidth only.

h1: the h1 reads 'WordCell' and uses the 1 × 1 px clipped sr-only pattern, so existing toBeVisible() waits stay unchanged.

F4: only seed-value reads (blocking.spec.ts:328, smoke.spec.ts:34) move to current().session.seed. e2e/pwa/font.spec.ts:97–99 uses the Seed line as a non-card text sample in the hook-free dist-smoke project; that sample becomes the top-bar Score text.

Screens: deleting e2e/placeholder.screens.spec.ts leaves playwright.screens.config.ts with no tests, so this ticket adds `--pass-with-no-tests` to the `test:screens:run` script (entry 3 drops it).

Out of scope: entry 3's tray, ghosts and mirrors, used/target tests and board.screens.spec.ts; entry 4's live layout, insets probe, banner re-layout, gate, other touch-action regions and ?bands=.

## Acceptance Criteria

Verify: npm run test:all is green, and Playwright on android shows session-idle-fresh with each column's letters top→bottom equal to literal lists, card faces 46 × 61 at the Pixel 7 profile with slot (column-<n> width) = w + 4 and board (column-8 right − column-1 left) = 8 slots, H = round(4w/3) (61), strip = max(44, round(0.72 H)) measured as the distance between adjacent card-wrapper tops in a column, and the band stack fitting innerHeight with no document scroll (build-notes CAP-3, F11), and Score on Idle, session-place, session-won and session-gave-up (negative with U+2212) and after a Redo across a commit.

- The 46 × 61 size check measures .face. The new `R-03 …` test reads .glyph text uppercased and compares to literal lists written with QU; the ×2 badge sits outside .glyph. The AD-17 attribute test drops 'minimal' from its name and keeps its checks minus the toHaveText on wrappers and the Seed line read (moved per F4).
- Score: literal expected strings per fixture (session-idle-fresh 'Score 0', session-place 'Score 0', session-won 'Score 355', session-gave-up 'Score −530' with U+2212). Redo flow: session-place-free-letter-redo-tail, assert 'Score 9' in Place, then Redo until Redo is disabled, asserting after each press 15, 15, 15, 24.
- AD-14: on session-idle-fresh, session-won and session-gave-up exactly 52 [data-card-id] elements, each id 0–51 once, data-place column/cell, zero [data-mirror-of].
- A new `R-70/R-71 …` test pins Undo/Redo enablement: session-idle-fresh both disabled; session-place-free-letter-redo-tail both enabled, Redo disabled after Redo to the tail's end; session-won and session-gave-up Undo enabled (R-70, R-75), Redo disabled.
- Render rules: `AD-17 …` tests assert session-won count badges 24, 21, 7 on wordcell-6, 7, 8 and none on an empty cell, foot-1..8 innerText (toHaveText, useInnerText) '1'..'8' on desktop and empty on android, Undo/Redo title equal to text.undo/text.redo on desktop, and Score's computed font-variant-numeric tabular-nums.
- 'AD-11 bands render in BAND_ORDER (default)': DOM order of [data-band] equals BAND_ORDER flattened (regression guard; entry 4's ?bands= test proves the iteration).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, As-built facts, Component tree, CAP-2, CAP-3
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Layout & Spacing (Action bar), Components (Card, Column, WordCell, Top bar, Action bar, Dictionary-failed banner)

## Notes

- Open question: How much of the minimal board's spec locators (h1, Seed line, ol WordCells) break across epic 3's e2e files; each is moved, never deleted, and the R-02 golden deal literals stay byte-identical.
