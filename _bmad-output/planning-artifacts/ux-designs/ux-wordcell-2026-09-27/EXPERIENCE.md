---
name: WordCell
status: final
created: 2026-09-27
updated: 2026-09-27
sources:
  - _bmad-output/planning-artifacts/briefs/brief-wordcell-2026-09-26/brief.md
  - docs/game-flow-spec.md
  - docs/requirements-carryover.md
  - docs/platform-decision.md
  - CLAUDE.md
  - docs/development-methodology.md
---

# WordCell — Experience Spine

`DESIGN.md` (same folder) owns the look; this file owns behaviour and cites its tokens as
`{path.to.token}`. Rules R-xx and decisions Q-xx are `docs/game-flow-spec.md` v0.7 and are not
restated or reopened here: this spine only says how each one surfaces. Where a rule and this file
seem to disagree, the rule wins and this file has a bug. Where a mock disagrees with either
spine, the spines win.

## Foundation

- **Form factor.** One surface, one layout: portrait phone first (installed PWA on Chrome for
  Android), the same layout widened in desktop and mobile browsers (spec §7.8 default confirmed,
  Q-17). Layout geometry is in `DESIGN.md` → Layout & Spacing.
- **UI system.** None. Svelte 5 components render engine state and dispatch engine commands
  (CLAUDE.md rule 3). Gestures are hand-rolled on Pointer Events with `setPointerCapture`,
  `touch-action: none` on cards and tiles, `overscroll-behavior: none` on the body, and drop
  targeting by card overlap (CLAUDE.md rule 4, platform decision §3). During any drag the shell
  writes `transform` on the dragged elements and dispatches at most one engine command on release.
- **Input.** Touch first; mouse and keyboard on desktop (Q-24). No sound (Q-20), no hints
  (Q-19), no Cancel (Q-01), no auto-confirm (Q-07).
- **Stakes.** Hobby / personal; public URL, no accounts, nothing leaves the device.
- **Ownership line.** Everything a player can see or touch is decided here. Engine legality,
  persistence, seed generation, the clock and dictionary loading are the architecture step's; this
  file names only their visible states.

## Information Architecture

| Surface | Reached from | Purpose |
|---|---|---|
| **Board** | Launch; closing any panel | The game, top to bottom: top bar (menu, score, timer, Undo, Redo), leftover band, columns with their foot row, tray band, WordCell row, an 8 px non-interactive gap, action bar (only the primary button, full width). Exact order and gaps: DESIGN.md → Band order. Shows one of four phase states: Idle, Composing, Place, Game over. |
| **WordCell view** | Long-press a WordCell; tap in Idle or Game over; hover (desktop); `Space` on a focused cell | See every card of one cell (R-65). |
| **Menu sheet** | ☰ in the top bar; `M` | New game, Replay this deal, Give up, Statistics, Preferences, How to play, app version. |
| **Confirm dialog** | New game or Replay this deal while a game is in progress (§2); Reset history | Stop an unrecorded abandon, or an irreversible delete. |
| **End sheet** | Status becomes won or gaveUp | Score, band, longest word, words placed (R-83). |
| **Statistics panel** | Menu; end sheet | The six R-84 statistics, or the unreadable-history message. |
| **Preferences panel** | Menu | Animation speed, Show timer (spec §7.10, R-76). |
| **How to play panel** | Menu; `?` | Rules, worked example, controls. |
| **History notice** | Launch, when the score history is unreadable (§2, Q-33) | Name the version, offer Reset history. Pushes one history entry; back acts as `Not now`. |
| **Session-rejected message** | Launch, when the stored Session is rejected (§2) | Name the version, offer New game. Replaces the Board. It is a root with no history entry; back leaves the app. |

No routes beyond these. Panels, sheets, dialogs and the sticky WordCell view (tap or `Space`) each
push one browser history entry; the long-press peek and the hover peek push none. So the Android
back gesture closes the topmost one (the end sheet collapses to its bar instead). Expanding the
end sheet pushes one entry and collapsing it pops it; with the sheet collapsed, back behaves as on
the bare Board. Every tail selection, by tap or key, owns exactly one history entry; re-selecting
or resizing it pushes none. The entry is popped when the selection ends any other
way (drop, deselect, Undo, Redo, menu), so back clears it. On the bare Board, back first
clears a tail selection if there is one; otherwise it does what the platform does (leaves the app).
Back never performs Undo. When a selection's entry must be popped and another surface pushed (for
example opening the menu while a tail is selected), the pop completes (`popstate`) before the
push. Closing any surface by a path other than back (Undo closing the end sheet, a menu item
closing the sheet before acting, a dialog action, a tap closing the sticky view, the auto-close
before the end sheet opens) pops its entry, and that `popstate` completes before any following
push. At launch the app replaces the current history state (`replaceState`), so no stale entries
survive a reload; a `popstate` with no matching surface is ignored. A peek that turns sticky on
release pushes one entry then, stacked above a kept tail-selection entry: the first back closes
the view, the second clears the selection. Tile selections own no history entry: back ignores
them (the bare-Board rule applies), while `Esc` clears them. Testable: after a reload, back from
the bare Board leaves the app. [ASSUMPTION A-E1]

Every stated need lands on a surface and every surface is used by a Key Flow below.

## Voice and Tone

Plain, short, second person, present tense. No exclamation marks outside the band messages. Name
the thing the player sees (a letter, a word, a cell number), never an internal term (no "draft",
"Session", "cursor"). The spec vocabulary the player meets: column, WordCell (or "cell"), word,
free letter, tray.

### Message catalogue

Player-facing word strings are uppercase, and a QU card is written `QU`: in the word line, messages,
the pending-draft line and the live region.

| Situation | Text | Where |
|---|---|---|
| Invalid word (R-38) | `BAKDE isn't in the word list.` | Tray word line, until the next edit, Undo, Redo, or a successful Validate. |
| Too short (R-36) | `Need 3+ letters` | Validate label while disabled for this reason. |
| Dictionary loading (R-38) | `Loading words…` | Validate label while disabled for this reason. |
| Dictionary failed to load | `Word list didn't load.` + **Reload** | Dictionary-failed banner, 44 px, under the top bar; the score and timer stay visible; Validate disabled with label `Word list unavailable`. |
| Empty destination (R-22, R-31) | `Empty column: no cards join the word` | Tray control row, in place of the D-block controls. |
| Pending draft in Idle (§2) | `Undone: BAKED · Redo brings it back` | Tray band, ink-secondary. |
| New game confirm (R-74) | **Start a new game?** `This game won't count in your statistics.` [Keep playing] [New game] | Confirm dialog. |
| Replay confirm (R-74) | **Replay this deal?** `You'll start this deal again from the beginning. This game won't count in your statistics.` [Keep playing] [Replay] | Confirm dialog. |
| Session rejected, unknown version (§2) | **This saved game can't be opened.** `It was saved in format version 3, which this version of WordCell can't read. It stays saved until you start a new game.` [New game] | Session-rejected message. Used when the version is readable but not one this build knows. |
| Session rejected, version unreadable (§2) | **This saved game can't be opened.** `It was saved in a format this version of WordCell can't read. It stays saved until you start a new game.` [New game] | Session-rejected message. Used when the version itself cannot be read. |
| Session rejected, replay check failed (§2) | **This saved game can't be opened.** `It (format version 3) failed a rules check while loading. It stays saved until you start a new game.` [New game] | Session-rejected message. Used when the version is known but loading or the replay check fails. |
| History unreadable (§2, Q-33) | **Your score history can't be read.** `It uses format version 2, which this version can't read. Statistics are off until you reset it. Resetting deletes the old history.` [Not now] [Reset history] | History notice; the same text in the Statistics panel. The second sentence depends on the condition: unknown version, as shown; version itself unreadable, `Its format version can't be read.`; readable, known version but unreadable contents, `It uses format version 2 but its contents can't be read.` |
| Game finished, history unreadable (§2, Q-33) | **Your score history can't be read.** + the version sentence of the row above (same variants) + `This game wasn't added to your statistics.` + **Reset history** | End sheet, under the stats lines. |
| Reset history confirm | **Delete the score history?** `This can't be undone.` [Keep it] [Delete history] | Confirm dialog, danger button. Opened from the History notice, Delete history closes both the dialog and the notice (popping both entries in order); Keep it returns to the notice. |
| No finished games (R-84) | `Finish or give up a game to see statistics here.` | Statistics panel, under the tiles. |
| Win outcome | `Every column cleared.` | End sheet title. |
| Hover peek, more than 14 cards (R-65) | `+n older cards` | Hover peek, a line above the first row. |
| Give-up outcome (R-81) | `Game given up.` and `12 letters left: −120`; for one letter, `1 letter left: −10` (a lone `QU` is 2 letters, plural) | End sheet title and penalty line. |

Version numbers in messages are the stored value as read; the example numbers above are
placeholders. A negative score on the end sheet, the top bar and Statistics uses U+2212 (`−40`);
a positive score has no plus sign.

### Rating bands (R-83, Q-15)

Thresholds are the spec's; names and messages are this step's deliverable (Q-15).

| Threshold t of 520 (applies when finalScore × 520 ≥ t × max, R-83) | English score | Name | Message |
|---|---|---|---|
| below 156 (including negative) | < 159 | Alphabet Soup | Plenty of letters, not much broth. The deck forgives you. |
| 156 | ≥ 159 | Warming Up | The cells are waking up. |
| 260 | ≥ 265 | Word Nerd | Halfway to glory, and it shows. |
| 370 | ≥ 378 | Wordsmith | Long words, high cells. Nicely forged. |
| 460 | ≥ 469 | Lexicon Legend | The dictionary is a little afraid of you. |
| 520 (perfect) | = 530 | Perfect Deck | Fifty-two cards, one cell. Nothing left to prove. |

[ASSUMPTION A-E2: names and messages]

## Component Patterns

Behavioural. Visual specs live in `DESIGN.md` → Components.

| Component | Behavioural rules |
|---|---|
| **Column** | Hit rect = the whole slot: every card strip, the empty space below the bottom card, the placeholder slot, and the foot pad. That rect is used for tap drops and for overlap targeting alike. Columns hold at most 7 cards and never grow, and w changes only between gestures (DESIGN.md A-D11), so hit rects never move under a finger. The dictionary-failed banner is not an exception: it shows and hides only when no gesture is in progress (DESIGN.md A-D11). The one exception during play is a word longer than two compact rows (14 tiles), which grows the tray band (Tray band). The columns and the tray shift up into the leftover band above the columns while it lasts; the WordCell row, the gap and the action bar keep their screen position. Once the leftover is used up, the document grows at the top and the shell adjusts `scrollTop` so the WordCell row does not move; the columns scroll partly under the sticky top bar and can be scrolled back from the pan-y regions (DESIGN.md A-D4). Target cells stay reachable in Place. The change applies only after the edit completes, and hit rects are recomputed before the next gesture. Overlap targeting always uses the current on-screen rects. |
| **Card in a column** | Tap and drag per the phase matrix. Tapping any strip selects from that card (R-10). |
| **Foot pad** | Only active while a tail is selected (by tap or key): a tap drops on that column. The source column's pad is labelled `Here` and is the discoverable way to drop on the source column (spec §7.1). |
| **WordCell** | Tap, long-press and drag per the phase matrix. The count badge appears at 2+ cards so the player knows there is something to view. An empty WordCell never opens a view: tap, long-press, `Space`, `Enter` and hover on it are no-ops in Idle and Game over (a tap with a tail selected still deselects, R-14). A long-press (≥ 400 ms) on an empty WordCell is treated as a tap on release. In Composing a tap on it is the R-33 no-op. In Place a tap, `Enter` or its digit key on an empty legal cell sets the target (R-40). |
| **WordCell view** | Opened by long-press it is a *peek*: it stays while the finger is down and closes on release. A peek whose content overflows the sheet (it overflows the sheet's 80 % max height, DESIGN.md) stays open on release as a sticky view, so every card can be seen (R-65). Opened by tap or `Space` it is *sticky* and modal: it closes on any tap, `Esc` or back, and the tap that closes it is consumed and does nothing else. Opened by hover (desktop) it is a non-modal peek: no scrim, anchored directly above the hovered cell, over the tray band and the columns, never covering the cell; it shows the top 14 cards, oldest of them first, with a `+n older cards` line above the first row when the cell holds more; it takes no clicks, never opens during a drag, closes when the pointer leaves the cell; a click on the cell does its phase-matrix action as usual. [ASSUMPTION A-E15] Read-only; changes nothing (R-65). |
| **Tray band** | Sits directly below the columns and directly above the WordCell row (DESIGN.md Layout & Spacing, owner decision 2026-09-27). Cards flow one way down the screen: a tail leaves the bottom of a column into the tray beneath it, Confirm sends the word down into the WordCell row, and Undo reverses the path. A free letter hops up a short way from its WordCell into the tray. The WordCells and the primary button are in the bottom thumb zone. The band order lives in one layout definition, switchable in dev builds, so a fallback order is a one-line change. Always present at the reserved height of DESIGN.md (room for one card-height row or two compact rows, whichever is taller). The one exception: a word longer than two compact rows (14 tiles) grows the band. The extra height comes from the leftover band above the columns first: the columns and the tray shift up; the WordCell row, the gap and the action bar keep their screen position. Once the leftover is used up, the document grows at the top and the shell adjusts `scrollTop` so the WordCell row does not move; the columns scroll partly under the sticky top bar and can be scrolled back from the pan-y regions (DESIGN.md A-D4). Target cells stay reachable in Place. The change applies only after the edit completes, and hit rects are recomputed before the next gesture (DESIGN.md Layout & Spacing). Idle: empty or the pending-draft line. Composing: word line, tiles, and the control row (D-block controls and the letter count). Place: word line, placement strip and the control row, with meta like `6 letters → cell 6 · +30`. Game over: empty. |
| **Word line** | Live word string, updated on every edit (spec §7.2). The meta sits in the tray's control row: the letter count with `QU` as 2 (R-36); in Place also the target cell and points preview: the net R-80 score change on commit = word letter count × target cell − Σ over free letters (letter count × its source cell). BALKED on cell 6 with cell 6's `L` previews `+30`. Formats: `+30`, `±0`, `−1` (U+2212 minus); spoken "plus 30", "no change", "minus 1". [ASSUMPTION A-E14] |
| **Movable tile** (S or free letter) | Drag to reorder; tap-select, tap another tile to swap; tap the selected tile again: a source tile deselects, a free-letter tile returns to its WordCell (R-33 remove command, spec §7.2). A tile released with its rect overlapping the tray band by less than 25 % of its area snaps back, no edit; it is never a removal. A tile selection ends on any edit, any phase change, a completed swap or any enabled-control press (a failed Validate included); an enabled control clears it and then acts. It is kept by taps on the destination block, on a used or empty WordCell in Composing, and on a not-legal WordCell in Place. Every other tap outside the selected tile clears it: the tray band background, the top bar, labels, disabled controls, column cards. |
| **Destination block** | Not draggable, not selectable; taps are no-ops and keep a tile selection. It sits at the left end (`destinationSide = left`) or right end (`right`), reversed per R-30 when right. |
| **D-block controls** | `−`/`+` change k by one (R-31); at a bound the button is disabled (a press there is not an edit). `⇄ Flip` toggles the side (R-30). On an empty destination column they are not rendered: the caption `Empty column: no cards join the word` takes their place (R-31). |
| **Validate** (primary, Composing) | Enabled iff the structural checks pass (R-38) **and** the dictionary is loaded. Otherwise disabled, and its label is the reason, no caption (message catalogue). When several apply: `Word list unavailable` > `Loading words…` > `Need 3+ letters`. In Idle it is disabled; its label is `Loading words…` or `Word list unavailable` while the dictionary is loading or failed, otherwise plain `Validate`. One tap runs the engine's Validate once; the button is ignored until the result renders. |
| **Placement strip** (Place) | Holds all word cards (S ∪ F ∪ D, R-50), left = bottom, right = top (R-51 default). Drag or tap-swap to reorder; D cards are movable here. A second tap on a selected strip tile only deselects it, for every card: no return glyph, no removal (R-39, R-71). A tile released with its rect overlapping the tray band by less than 25 % of its area snaps back, no edit; it is never a removal. Tile selection ends as for movable tiles. The bottom and top markers are tags inside the first and last strip tiles. |
| **Confirm** (primary, Place) | Always enabled in Place. Commits (R-60), then the fly-to-cell animation. |
| **Undo / Redo** | Icon-only buttons with accessible names `Undo` and `Redo`, in the top bar right of the timer (owner decision 2026-09-27). They are rare actions, kept away from the busy bottom area so an accidental Undo does not step the player back a phase, after which the next action would discard the redo data (R-71); Undo is still one tap away (spec §7.6). This overrides brief §9's Undo-in-thumb-reach goal. Enabled exactly when the engine allows (R-70, R-71, R-75). A press clears any tap-selection first. |
| **Top bar score** | Current committed score (R-82). Changes only on commit, Undo or Redo across a commit, and give-up (penalty applied) / un-give-up. Resets to 0 on New game or Replay this deal. |
| **Timer** | Shown only when Show timer is on (R-76). Displays active time as `m:ss` (`h:mm:ss` from one hour). Runs whenever the shell's clock runs (R-76) and freezes when the game is over. |
| **Menu sheet** | Opening it clears any tap-selection. Give up is enabled only in Idle while playing (R-75); New game and Replay this deal always. Give up acts at once, no confirmation [ASSUMPTION A-E10]. Items close the sheet before acting. |
| **Confirm dialog** | Focus starts on the dismissive button; `Esc`, back and scrim tap dismiss. |
| **End sheet** | Any transition into won, by Confirm or by Redo, opens it after the commit animation settles; Give up opens it at once. Relaunch with status won or gaveUp opens the Board in Game over with the sheet expanded and no animation. A transition into Game over closes any open WordCell view before the sheet opens. When the sheet opens, focus moves to its first action. The grab handle, back, `Esc` and a scrim tap collapse it to its bar (they do not close it; the scrim tap is consumed), and focus returns to the board; tapping the bar expands it. Expanded, the top bar (with Undo) and the action bar (with New game) stay above the scrim and usable; collapsed, there is no scrim and its bar sits over the tray band (empty in Game over), directly above the WordCell labels, so WordCells stay fully tappable to view. The large number is the final score after R-81. Longest word ties go to the earliest committed word (R-84); it shows `—` when no word was committed (R-83). The game record holds the word's spelling and its letter count (R-84, Q-35). After Reset history from the end sheet, the finished game stays unrecorded (§2): the history block and its Reset history button are replaced by the line `This game wasn't added to your statistics.`, and a later Undo of that finish removes nothing (R-84). Undo in the top bar closes it and resumes play (R-70, R-75). |
| **Statistics panel** | Reads the score history; shows games played, won, given up, best score, average score (whole number, rounded like `Math.round`, half toward +∞), longest word ever as the word and its letter count, ties to the earliest record (R-84). The record holds the word's spelling (R-84, Q-35). `—` where no value exists. [ASSUMPTION A-E3: average rounding, longest-word ties] |
| **Preferences panel** | Changes apply immediately and persist outside the Session; not undoable; survive New game and Replay this deal (spec §7.10, brief §7). Show timer defaults to off (R-76). |
| **How to play panel** | Static scrolling page; see its section below. |

### Phase matrix

What each gesture does, per phase. "Tap" is a press-release under the drag threshold that did not
become a long-press. On any target other than a WordCell, a press-release under the drag threshold
is a tap whatever its duration. Inert means no engine command and no visual response beyond the
platform's; in Composing and Place an inert tap still clears a tile selection unless the cell says
it is kept (Movable tile).

| Target ↓ / Phase → | Idle, nothing selected | Idle, tail selected | Composing | Place | Game over |
|---|---|---|---|---|---|
| Card in a column: tap | Select tail from it (R-10) | Other column: drop there. Source column, card not the selected top: re-select from it. The selected top card: no-op (R-14) | Destination column: set k (R-31). Ghost slots of S (self-drop): inert. Other columns: inert (R-39) | Inert (R-39) | Inert (R-75) |
| Card in a column: drag | Lift tail, target by overlap; a drag whose target never left the source column cancels (R-14, Q-34) | Lift that card's tail (replaces the selection) | Destination column: the card does not move; k is set once at `pointerup`, exactly as a tap on the card where the press started (R-39). Others: inert | Inert | Inert |
| Empty space, placeholder, foot of a column: tap | No-op | Drop on that column, the source column included (R-14) | Inert | Inert | Inert |
| WordCell: tap | Open sticky view (R-65); empty: no-op | Deselect, no view, whatever the cell (R-14) | Available top card: add as free letter, appended (R-33, Q-31). Used or empty: no-op, tile selection kept | Legal: set target (R-40). Not legal: no-op, tile selection kept | Open sticky view; empty: no-op |
| WordCell: long-press | Peek | Peek; selection kept | Peek | Peek | Peek |
| WordCell top card: drag | Inert | Inert | Available top card: overlap with the tray band inserts at the insertion gap (Q-31 index; Composing the word); released otherwise, nothing. Used or empty: inert | Inert | Inert |
| Tray tile / strip tile | — | — | Movable tile rules | Placement strip rules | — |
| Anything else outside the columns (top bar, labels, tray band background, the gap above the action bar, disabled controls): tap | No-op | Deselect (R-14) | Clears a tile selection (the destination block keeps it) | Clears a tile selection | No-op |
| Primary button | `Validate`, disabled (label per its rule) | `Validate`, disabled (label per its rule) | `Validate` per its rule | `Confirm` | `New game` |

With a tail selected, any tap outside the columns clears the selection (R-14). An enabled control
clears it and then acts. A WordCell tap deselects without opening the view. An empty WordCell never opens a view (tap,
long-press, hover, `Space`, `Enter`): in Idle and Game over those are no-ops. In Composing its tap
is the R-33 no-op. In Place a tap on an empty legal cell sets the target (R-40). WordCells never
lift a tail, and a WordCell drag is inert in Idle (R-12). A drag that starts anywhere other than a
column card, a WordCell top card or a tray or strip tile is inert in every phase.

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| First launch, no Session | Board | Shell deals a fresh seed at once (R-74); Idle; no dialog, no onboarding. How to play is one tap away in the menu. |
| Relaunch with a Session | Board | Restored at the exact phase (R-73): Composing reopens the tray with the stored arrangement, k and side; Place reopens with its target and order. Status won or gaveUp: Game over with the end sheet expanded, no animation. Tap-selection, tile selection and any open overlay are not restored (R-14). The invalid-word line is transient UI and is not restored either. |
| Dictionary loading | Board | Everything playable; Validate disabled with `Loading words…`. |
| Dictionary failed | Board | Dictionary-failed banner under the top bar with `Word list didn't load.` and `Reload`; score and timer stay visible; disabled Validate (message catalogue); the rest of the game still works, including Undo and Redo into Place (R-71 trusts stored validation). `Reload` retries the fetch in place: the banner hides and Validate shows `Loading words…` while it runs; on success Validate follows its normal rule; on a repeat failure the banner returns. |
| Session rejected | Session-rejected message | Board not shown; only New game, which acts at once with no confirm dialog. The stored Session is untouched until New game (§2). |
| Session and history both unreadable | Session-rejected message, then History notice | The Session-rejected message first; the History notice after New game. |
| History unreadable | History notice, then Board | Notice once per launch. On a relaunch into Game over, the end sheet's entry is pushed first and the History notice shows on top; the sheet is visible once the notice is dismissed; menu ☰ carries a small error-coloured dot; Statistics shows the message; a finished game shows the end-sheet line. |
| Idle, pending draft | Board | Redo enabled; tray line `Undone: … · Redo brings it back`. [ASSUMPTION A-E13] |
| Idle, tail selected | Board | Tail lifted 8 px with teal outline; foot pads live; `Here` on the source column. |
| Dragging a tail | Board | Tail follows the finger; ghosts in its old places; target column highlighted live (drop-target state); no highlight when no column meets the overlap minimum, or while the target is the source column and has never left it (Q-34). |
| Composing | Board | Tray open; S ghosts in the source column; D cards in the destination column in destination style; used WordCells hatched (R-33). |
| Invalid word | Board, Composing | Error line in the tray; draft unchanged (R-38); Redo state unchanged. |
| Place | Board | Legal cells ringed, others faded, pre-selected target per R-42; placement strip with bottom and top tags; S and D cards shown as ghosts in their columns; Confirm. |
| Won / gave up | End sheet over Board | See End sheet. The Board stays viewable (collapse the sheet); WordCells can be viewed (R-75). |
| Offline | Board | No indicator: the app is fully offline after precache (brief §6.8). |
| New app version installed | — | The service worker activates on the next launch; no prompt in v1. [ASSUMPTION A-E4] |

## Interaction Primitives

### Pointer thresholds

- **Drag threshold**: 8 CSS px of movement from `pointerdown`. Below it at `pointerup` the gesture
  is a tap. [ASSUMPTION A-E5]
- **Long-press**: 400 ms without crossing the drag threshold (spec §7.9). Only WordCells react to
  it. Once it fires, later movement does not start a drag; once a drag starts, the long-press
  timer is cancelled.
- **One pointer at a time.** A second pointer during a gesture is ignored.
- **`pointercancel`** (incoming call, app hidden, system gesture) ends a column drag like a
  release over no column (tail returns, no command) and a tile drag with no change. A WordCell
  drag inserts nothing; a peek closes.
- **Commands during a drag.** An Undo, Redo or menu command, and any key command or
  overlay-opening key, arriving during a drag first cancels the drag as for `pointercancel`, then
  acts. A back (`popstate`) arriving during a drag also cancels it as for `pointercancel`; then
  the normal back rule applies (the cancel has already ended any selection).
- **Animations never block input.** A new gesture or button press completes any running animation
  at once and acts on the settled state (the winning animation is the exception, see Motion).

### Drop targeting by overlap (CLAUDE.md rule 4, spec §7.7)

1. The **dragged rect** is the rendered rect of the tail's top card (the card that was grabbed,
   R-10), after its drag transform.
2. Each column's **hit rect** is its whole slot (Component Patterns → Column), including an empty
   column's placeholder slot and the source column.
3. On every `pointermove`, compute overlap area ÷ dragged-rect area for each column. The target is
   the column with the largest ratio, provided it is **at least 25 %**. [ASSUMPTION A-E6] As a
   consequence (informative, not a separate rule), between two adjacent columns the larger overlap
   wins; the 25 % minimum decides only at the edges of the column area (its outer edges: left, right, top and bottom).
4. **Tie-break**: equal ratios go to the column whose centre is horizontally nearest the dragged
   rect's centre; still equal, the lower column number.
5. **Leaving the source column** (R-14, Q-34). The drag has *left* the source column once the
   live target is another column or no column at some `pointermove` after the drag threshold was
   crossed. Until then the source column is never highlighted, even when it is the live target.
   After the drag has left, the source column is highlighted like any other column when the
   target returns to it.
6. The target is highlighted live (DESIGN.md drop-target state). Release drops on the highlighted
   column, which is exactly the column shown, so what the player sees is what happens. Release with
   no highlighted column (no target, or the source column before the drag has left it): the tail
   flies back, no engine command, no history change (R-14, Q-34). A drag that left the source
   column and returned drops on the source column. A drag that replaced a tap-selection and ends
   with no command ends with nothing selected, and the selection's history entry is popped.
7. WordCells, the tray and the bars are never drop targets for a tail.

The drop dispatches the engine's drop command; the draft starts per R-23 (k = 1 or 0, side left,
S in column order). Drop position never picks k (Q-26).

### Tap-to-select and tap-to-drop (R-14, Q-18)

Tap a card: its tail is selected. Then tap anywhere in another column (card, empty space,
placeholder, foot) to drop there, or the `Here` pad (or empty space) of the source column to drop
on the source column (spec §7.1). A small drag that never leaves the source column is a
cancel, not a self-drop (Q-34), so the `Here` pad is the tap route for a self-drop. The full rules
are the phase matrix. The selection is transient:
not persisted, not undoable, cleared by Undo, Redo, the menu, back and any tap outside the
columns.

### Composing the word

- **Change k** (R-31, Q-23): tap a destination-column card (it becomes the top of D), or tap the
  current top of D (k − 1, not below 1), or `−`/`+`.
- **Flip** (R-30): `⇄ Flip` swaps the block to the other end, reversed.
- **Add a free letter** (R-33, Q-31): tap the WordCell's top card to append it to the right end
  of M; or drag it into the tray band [ASSUMPTION A-E12]. While the dragged card rect overlaps the tray band rect by
  at least 25 % of the card area (CLAUDE.md rule 4), the tiles part to show the insertion gap
  nearest the card's centre among indices 0…|M| of M, never inside or on the far side of the
  destination block; release inserts it there (the
  optional insertion index). Released otherwise, nothing happens. A used or empty WordCell's drag
  is inert.
- **Remove a free letter** (R-33): tap its tile to select it (it shows `↩`), tap it again. The
  cell reactivates; the rest of M keeps its order (Q-31).
- **Arrange M** (R-34): drag a tile; the other movable tiles part live to show the insertion gap
  (nearest gap to the tile's centre; across wrapped rows, nearest by distance). Non-drag
  alternative: tap one tile, tap another, they swap (spec §7.2) [ASSUMPTION A-E11]. A drag or swap that leaves the
  card order (by card, not letter) unchanged is not an edit; swapping two identical letters is an
  edit (R-71), so it clears the invalid-word line and the redo data. When a tray row is full during
  either drag (a tile or a free letter), no tile moves and a teal insertion caret marks the gap.
- **Validate**: see Component Patterns. Success → Place; failure → invalid-word line, still
  Composing (R-38).

### Place (Q-22)

Legal cells ringed, the highest pre-selected (R-42); tap a legal cell to retarget (the order is
kept, R-51). Reorder the strip by drag or tap-swap. The strip always marks bottom and the future
top card with tags inside the first and last tiles (R-50, R-52). **Confirm** commits. Undo returns to Composing with the arrangement intact
(R-70).

### Keyboard (desktop, always on, Q-24)

Cards and WordCells are focusable but have no native activation; the shell handles their keys.
`Space` or `Enter` on a focused column card is the tap on it per the phase matrix, in every phase.
On a focused WordCell, `Enter` is exactly the tap (Idle with nothing selected: open the sticky
view; Idle with a tail selected: deselect, no view; Composing: add the free letter; Place: set the
target; Game over: open the view). `Space` on a focused WordCell opens the sticky view in every
phase; with a tail selected it first clears the selection (popping its history entry). An empty
WordCell never opens a view (Component Patterns → WordCell): with a tail selected, `Space` on it
deselects with no view, like the tap. Any overlay opened by a key (`Space`
view, `?` How to play, `N` confirm dialog, `M` menu) first clears a tail selection and pops its
entry before pushing its own.

While the menu sheet, a panel or a dialog is open, game shortcuts are suspended: only `Tab`,
`Enter` and `Space` act, natively, and `Esc` closes the topmost overlay (custom handling, same as
back). While the end sheet or a WordCell view is open, game shortcuts stay active; any game
shortcut first closes the sticky view, then acts. Any key command that changes the phase or the
word data likewise first closes an open long-press peek or hover peek. `Enter`/`Space` on a focused button activate
that button; the global `Enter` below applies when focus is on a tile or the board. No
Ctrl/Cmd/Alt except the undo and redo aliases; Shift is allowed; keys match on the produced
character (`event.key`), letter keys case-insensitively; `Ctrl/Cmd+Shift+Z` is checked before
plain `Z`. [ASSUMPTION A-E7: the set] A shortcut that has an on-screen control (Validate,
Confirm, Undo, Redo, `−`/`+`, Flip, Menu) acts only when that control is enabled; otherwise it is a
no-op and not an edit. Keys without a control follow the phase matrix and the no-op cases in the
key table.

Focus follows the phase: entering Composing focuses the first movable tile, and focus skips
destination-block tiles; entering Place
focuses the first strip card; returning to Idle focuses the board; after a commit that does not win, focus returns
to the board; after a winning commit, focus goes to the end sheet's first action once the
animation settles. "The board" means the bottom card of the lowest-numbered non-empty column, or a
focusable board container when every column is empty. After `Shift`+arrow focus stays on the moved
tile; adding a free letter by key moves focus to the new tile; after a free-letter tile is removed
by key, focus moves to the next tile, or to the previous one if it was last. After a key-driven
tail selection (`1`–`8`, `↑`/`↓`) focus moves to the selected tail's top card.

| Key | Idle | Composing | Place | Game over |
|---|---|---|---|---|
| `1`–`8` | No selection: select the bottom card of that column (empty column: no-op). Tail selected: drop on that column (same number = source column) | — | — | — |
| `↑` / `↓` | Tail selected: extend the tail up one card (already the whole column: no-op) / shrink it (min 1) | — | — | — |
| `3`–`9`, `0` (= 10) | — | Add that WordCell's top card as a free letter (append). Used or empty cell: no-op. Removal only via the focused tile: `Space` to select, `Space` again to return | Set that cell as target if legal | — |
| `←` / `→` | — | Move focus between tray tiles; no wrap | Move focus along the strip; no wrap | — |
| `Shift`+`←` / `→` | — | Move the focused movable tile one place; at either end of M: no-op, not an edit | Move the focused card one place; at either end of the strip: no-op, not an edit | — |
| `Space` | Focused column card: tap equivalent; focused WordCell: open the sticky view | Focused tile: select / swap / return (tap equivalent); focused column card: tap equivalent; focused WordCell: view | Focused strip card: select / swap; focused column card: tap equivalent; focused WordCell: view | Focused column card: tap equivalent (inert); focused WordCell: view |
| `+` or `=` / `-` | — | k + 1 / k − 1 (empty destination column: no-op, R-31) | — | — |
| `F` | — | Flip (empty destination column: no-op, R-31) | — | — |
| `Enter` | Focused column card or WordCell: tap equivalent | Focused column card or WordCell: tap equivalent; otherwise Validate (when enabled) | Focused column card or WordCell: tap equivalent; otherwise Confirm | Focused column card: tap equivalent (inert); focused WordCell: open view |
| `Z`, `Ctrl/Cmd+Z` | Undo | Undo | Undo | Undo |
| `Y`, `Ctrl/Cmd+Y`, `Ctrl/Cmd+Shift+Z` | Redo | Redo | Redo | — |
| `Esc` | Close the topmost overlay; otherwise clear the selection | Close the topmost overlay; otherwise clear the tile selection | Same | Close the topmost overlay; collapse the end sheet |
| `M` | Menu | Menu | Menu | Menu |
| `N` | New game (confirm if in progress) | same | same | New game |
| `?` | How to play | same | same | same |

Give up has no key. Tooltips on desktop buttons show the key.

### Mouse and hover (desktop)

Same pointer code as touch. Hovering a WordCell for 400 ms opens the hover view, a non-modal peek
(Component Patterns → WordCell view); leaving the cell closes it (spec §7.9). The hover peek never opens during a drag. In Idle
while playing, with nothing selected, hovering a column card outlines the tail that would lift
(cursor `grab`). Game over has no hover affordance on column cards.
With a tail selected, another column highlights as the drop target while the pointer is anywhere over it. The source column highlights only while hovering its empty space, placeholder or `Here` pad. Hovering a source-column card other than the selected top shows the outline of the tail a click would re-select. The selected top card shows nothing. In Composing, hovering a
destination-column card previews the result of a click: the D it would set; on the current top of
D, k − 1; at k = 1 on the top of D, no preview.

## Motion

One preference, **Animation speed** (spec §7.10): Fast, **Normal (default)**, Slow. Base duration
90 / 180 / 320 ms. [ASSUMPTION A-E8: default and durations]

| Animation | Duration |
|---|---|
| Tail snap to target column / tray open | 1 × base |
| Tail fly-back on a release with no target, or a drag that never left its source column | 1 × base |
| Tiles parting during a drag | 0.5 × base |
| Cards returning on Undo, re-entering on Redo | 1 × base |
| Fly-to-cell on Confirm, or on a Redo that commits | 2 × base, 30 ms stagger per card, bottom card first |
| Overlays and sheets | 1 × base |

`prefers-reduced-motion: reduce` replaces the timed animations in the table above with a 120 ms
opacity fade, whatever the preference. Finger tracking during a drag stays; tile parting snaps. The invalid-word line has no shake. An Undo during the winning animation (the button or
any of its key aliases) completes it and then undoes; the end sheet does not open. Every other
pointer or key input during the winning commit animation only completes it and is consumed; the settled state is Game over with
the end sheet expanded.

## Accessibility Floor

- **No drag is ever required.** Every drag has a tap path: tap-select/tap-drop (R-14), tap-swap,
  tap to add a free letter plus tap-swap to position it, `−`/`+` for k (Q-23).
- **Targets** ≥ 44 × 44 px everywhere (carryover §5), including strips, foot pads and D-block
  buttons.
- **Keyboard**: full play on desktop via the table above; visible focus ring in
  `{colors.accent-teal}`; focus order top bar (menu, Undo, Redo) → columns → tray → WordCells → action bar.
- **Screen readers**: every card is a button named by letter, place and state (`E, column 1,
  card 2 of 5, selected`); WordCells by number, top card and count (`WordCell 6, top L, 4 cards,
  used`); `QU` is read "Q U, counts as two letters". A polite live region announces phase changes
  (`Composing. BAKED, 5 letters.`), the invalid-word message, commits (`BALKED placed on cell 6,
  plus 30`) and the end outcome. Full screen-reader play is not a v1 test target.
  [ASSUMPTION A-E9]
- **Not colour alone**: every state has a glyph or shape (DESIGN.md Do's and Don'ts).
- **Motion**: reduced-motion honoured (Motion).
- **Text size**: board text is fixed px; panels, sheets and dialogs scale with the browser font
  size (DESIGN.md A-D9). Card size follows the layout, not the font size.
- **Disabled controls explain themselves**: In Composing a disabled Validate always says why, in
  its own label.

## Responsive & Platform

- **Android PWA** (the target): standalone, portrait-locked, theme colour per DESIGN.md manifest.
  Install through Chrome's own UI; no custom prompt (brief §7). Status bar and gesture area
  respected via safe-area insets.
- **Mobile browser**: same layout; the browser's toolbars reduce height, and the height rule
  shrinks the cards.
- **Desktop browser**: the same layout centred and widened up to the height cap (spec §7.8
  confirmed). Hover view and keyboard added; nothing else differs.
- **Minimum viewport**: see DESIGN.md A-D3.

## How to play panel (brief §7)

One static page, text rewritten from the legacy rulebook to match spec §3–§6 and §9 (notably
Q-12, no Cancel, no hints). Sections, in order:

1. **The goal**: empty all eight columns by placing words on WordCells; long words on high
   cells score most.
2. **The table**: columns, stack tails, WordCells 3–10, free letters, the `QU` card (×2).
3. **A move**: pick up a stack tail; drop it on a column (its own included); the destination's
   bottom cards must join unless the column is empty (Q-12); flip; add free letters; arrange;
   Validate; choose a cell and the order; Confirm.
4. **Undo and Redo**: step back one phase at a time, all the way to the deal; there is no Cancel.
5. **Empty columns** and why they are valuable (R-22).
6. **Scoring, giving up and bands** (R-80, R-81, R-83), with the band names.
7. **Worked example**: spec §8 (BAKED, BALKED, FAKED, FLAKED), drawn with the real card component
   as static images, not interactive.
8. **Controls**: touch, mouse and the keyboard table.

The text itself is a build ticket's deliverable; this spine fixes the outline.

## Key Flows

Jared is the protagonist in every flow: the designer and first player (brief §4).

### Flow 1 — The bus ride (resume, drag, free letter, place)

1. Jared opens WordCell from his home screen; yesterday's game is exactly where he left it, in
   Idle (R-73).
2. He drags `E D K A` from the bottom of column 1 by its `E`; column 3 lights teal under it.
3. He releases; the tray opens with `B` locked on the left and `E D K A` after it (R-23).
4. He drags `A` next to `B`, then `K`, spelling `BAKED`; the word line follows each move.
5. He long-presses cell 6 to peek its cards, then lets go. WordCell 6 shows an `L`; he taps it and it lands at the right end; he drags it after `A`:
   `BALKED`, 6 letters. Cell 6 is hatched as used (R-33).
6. He taps **Validate**; the tray becomes the placement strip, cells 3–6 are ringed, 6
   pre-selected (R-42); the meta reads `6 letters → cell 6 · +30`.
7. He drags `B` to the right end so `B` will be the new free letter on cell 6.
8. **Climax:** he taps **Confirm**; the six cards fly into cell 6, the score changes by 30, and
   column 1 is down to `F`.

Failure path: instead of step 3, he lets go with the card over the WordCell row, outside every column slot;
nothing lights; the tail flies back, nothing is recorded (R-14).

Variant: before step 2 he drags `E` about 20 px, past the 8 px drag threshold, and it stays over
column 1; column 1 never lights; he lets go and the tail settles back, nothing recorded (R-14,
Q-34). Counter-case: a movement under 8 px is a tap and selects the tail.

### Flow 2 — One thumb, taps only, own column

1. Same position as Flow 1 (spec §8), cell 6 showing `L`. Standing on the train, Jared plays with
   his right thumb only.
2. He taps `E` in column 1; `E D K A` lifts with a teal outline and column 1's foot shows `Here`.
3. He taps `Here`; the tray opens with `F` locked on the left, the only card left in column 1
   (R-21, R-31).
4. He tap-swaps pairs: `A`↔`E`, `K`↔`D`, `E`↔`D`, giving `FAKED`.
5. He taps cell 6's `L`, which lands at the right end, then swaps it forward one tile at a time
   until the tray reads `FLAKED`.
6. He taps **Validate**, then **Confirm**. The WordCells and the primary button are within thumb
   reach at the bottom. The tray sits just above the WordCells, so cell 6's `L` hopped up a short
   way into the word.
7. **Climax:** column 1 is empty and shows its placeholder slot, a resource for a later word
   (R-22).

### Flow 3 — Wrong word, walking back

1. In Composing Jared taps **Validate** on `BAKDE`; the tray says `BAKDE isn't in the word list.`
   and nothing else changes (R-38).
2. He swaps `D` and `E`; the message clears; **Validate** succeeds; Place opens.
3. He changes his mind and taps **Undo** in the top bar: back in Composing with `BAKED` still arranged (R-70).
4. **Undo** again: the tray empties and the cards return; the tray reads `Undone: BAKED · Redo
   brings it back`.
5. **Climax:** he taps **Redo** in the top bar twice and is back in Place with the same target and order; trust
   in Undo is earned (brief §6.1).

### Flow 4 — Stuck

1. Jared sees no word he can make. He opens the menu and taps **Give up** (Idle, playing).
2. The end sheet opens: `Game given up.`, `9 letters left: −90`, final score `172` (after the −90 penalty, R-81), band `Warming Up` and its
   message, longest word, words placed.
3. He taps **Undo** in the top bar; the sheet closes and he is back in Idle, still playing, the
   record removed (R-75, R-84).
4. Still stuck, he gives up again, then taps **New game**; no confirmation, because the game is
   over (§2).
5. From the menu he opens **Preferences** and turns on **Show timer**; the timer appears in the top
   bar.
6. **Climax:** a fresh deal, and **Statistics** shows one more game given up.

### Flow 5 — Android kills the app mid-Place

1. In Place, with a free letter in the word and a non-default order, Jared switches apps for an
   hour; Android kills WordCell.
2. He relaunches.
3. **Climax:** the Board opens in Place with the same target, the same strip order and the same
   hatched cell; Redo and Undo behave as before (R-73).

### Flow 6 — At the desktop, keyboard only

1. Same position as Flow 1 (spec §8), cell 6 showing `L`. Jared opens the URL in a desktop
   browser; the same board, wider.
2. He presses `1`, `↑`×3 to select `E D K A`, then `3` to drop on column 3.
3. `6` adds cell 6's `L` at the end; `Shift`+`←`/`→` moves it and the other tiles into `BALKED`;
   `Enter` validates.
4. `6` keeps the target; `Enter` confirms.
5. **Climax:** a full move without touching the mouse; `?` shows the same controls table.

### Flow 7 — An old save after an update

1. After an update, Jared launches and sees `This saved game can't be opened.` with its format
   version; only **New game** is offered (§2).
2. He taps **New game**; the old save is replaced only now.
3. Separately, the history notice says the score history can't be read; he taps **Not now** and
   plays.
4. He finishes a game; the end sheet says it wasn't added to statistics and offers **Reset
   history**.
5. **Climax:** he resets, confirms the delete, and Statistics starts clean. The finished game
   stays unrecorded (§2); the end sheet now shows only `This game wasn't added to your statistics.`

## Rule coverage

Where each player-visible rule surfaces, for the Playwright tests that bind to it (brief §6.4).

| Rule | Surfaced by |
|---|---|
| R-10, R-11 | Phase matrix, card tap/drag (R-10, R-11); Flow 1, Flow 2 (R-10) |
| R-12 | Phase matrix: WordCell drag inert in Idle; WordCells never lift a tail |
| R-14 (UI), Q-34 | Tap-to-select and tap-to-drop; phase matrix; overlap steps 5 and 6 (a drag that never leaves the source column cancels, Q-34); Flow 1 variant |
| R-20–R-23 | Drop targeting; Composing opens per R-23 |
| R-30, R-31 | Composing the word; D-block controls |
| R-32 (UI) | Destination block (DESIGN.md Components) |
| R-33 (UI) | Add and remove a free letter; used WordCell state |
| R-34 | Arrange M |
| R-35 | Movable tile: a source tile has no return action |
| R-36, R-38 | Validate states, invalid-word line, message catalogue |
| R-39 (UI) | Phase matrix: inert targets in Composing and Place; no Cancel control exists |
| R-40, R-41 | Place ringing |
| R-42 (UI) | Place pre-selection |
| R-50–R-52 | Placement strip bottom/top marking |
| R-60, R-62 | Confirm; end sheet on win |
| R-61 | Used WordCell state; next card revealed on commit |
| R-65 (UI) | WordCell view: long-press peek, tap, hover, Space |
| R-70–R-72 | Undo/Redo enablement; pending-draft line; Flow 3 |
| R-73 (UI) | Relaunch state; Flow 5 |
| R-74 (UI) | Confirm dialogs; first launch deals at once |
| R-75 | Menu Give up; game-over column of the matrix; Flow 4 |
| R-76 (UI) | Timer; Preferences |
| R-80, R-81 | Place points preview; end-sheet penalty line |
| R-82 (UI) | Top bar score |
| R-83 (UI) | End sheet; rating bands |
| R-84, Q-35 | Statistics panel; end sheet longest word |
| §2 version / history messages, Q-33 | Session-rejected message; history notice; end-sheet line |
| Q-06 | `QU` ×2 badge (DESIGN.md) |
| Q-22, Q-23, Q-24 | Place; D-block controls; keyboard |
| spec §7.10 | Preferences panel; Motion |

## Open items

### Assumptions

Jared confirmed every assumption below on 2026-09-27; the `[ASSUMPTION]` tags stay for traceability.

| Id | Assumption | Where |
|---|---|---|
| A-E1 | Android back closes the topmost overlay or clears a selection, never Undoes; on the bare board it leaves the app. | Information Architecture |
| A-E2 | Band names and messages as listed (Alphabet Soup … Perfect Deck). | Rating bands |
| A-E3 | Average score shown as a whole number, rounded like `Math.round` (half toward +∞); longest word ever ties go to the earliest record. | Component Patterns |
| A-E4 | A new app version activates on the next launch with no prompt. | State Patterns |
| A-E5 | Drag threshold 8 CSS px. | Interaction Primitives |
| A-E6 | Overlap minimum 25 % of the grabbed card's area; tie-break nearest centre then lower column number. | Drop targeting |
| A-E7 | The keyboard set as tabled. | Keyboard |
| A-E8 | Default animation speed Normal; base durations 90 / 180 / 320 ms. | Motion |
| A-E9 | Screen-reader labels and live announcements in v1; full screen-reader play not a test target. | Accessibility Floor |
| A-E10 | Give up has no confirmation, because Undo reverses it (R-75). | Component Patterns, Flow 4 |
| A-E11 | Tap-to-swap is the non-drag arrangement for tiles and the placement strip. | Composing the word |
| A-E12 | A free letter can also be dragged from its WordCell into the tray at a position (Q-31 index offered). | Composing the word |
| A-E13 | The pending-draft line appears in Idle when a pending draft exists. | State Patterns |
| A-E14 | The Place control row previews the net score change on commit (`+30` for BALKED on cell 6 with cell 6's `L`). | Component Patterns |
| A-E15 | The hover view (desktop) is a non-modal peek that takes no clicks; a tap- or `Space`-opened sticky view is modal and consumes the tap that closes it. | Component Patterns |

### Open questions

None.
