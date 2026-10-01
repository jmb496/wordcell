# Rule coverage — epic 3

Every app-shell sentence of `docs/game-flow-spec.md` (spec preamble: dictionary load R-38,
visible-time clock R-76, storage and version rejection §2), every `(UI)` sentence this epic's
minimal board can prove, and the §9 answers the shell owns, with the capability that proves
them and where the rest are covered. A ticket plan expands its rows into the sentence → test
mapping; "exempt" sentences assign ownership, record provenance or describe versioning process.

Test kinds: **P3** = Playwright in this epic on the `android` project (`desktop` too only for
desktop-only behaviour), named with the id; **V** = engine Vitest (epic 2 unless CAP-1/CAP-2 is
named); **P4–6** / **P7** = Playwright in epics 4–6 / 7; **S** = shell or UI Vitest named `AD-n`,
supplementary, never R-id coverage; **—** = none.

Naming: an R-id where the sentence has one; `§2 …` for §2 sentences; `Q-nn …` for a §9 answer
with no R-id sentence; `AD-n …` for spine behaviour with no rule id (AGENTS.md Conventions).

## §2 Game state

| Sentence | CAP | Kind | Notes |
| --- | --- | --- | --- |
| Unknown `version` rejected on launch; message naming the version; New game offered; stored session not overwritten until the player starts one | 4 | P3 | One test per variant (four): `session-invalid-version-unknown` (new fixture, version 3), `session-invalid-null` (`version-unreadable`), `session-invalid-s2-last-only` (pre-replay AD-7 check, `replay-failed`), `session-invalid-r50-placement-order` (replay rule, `replay-failed`); each asserts its catalogue text (the stored version only in the unknown-version and replay-failed variants), only New game, `wordcell:session` byte-identical after a reload, and New game writing a fresh Session at once. |
| History unreadable or unknown version: reported with a message naming its version and a Reset history action | 7 | P3 | History notice, three version sentences (unknown, unreadable version, unreadable contents). |
| The stored score history is never overwritten silently | 6, 7 | P3 | Bytes unchanged after a finish, an un-finish, New game and reload while unreadable; changed only by Delete history. |
| Statistics are unavailable until the player resets it | — | P4–6 | Statistics panel (epic 6); the store's `statistics` absent while unreadable is S. |
| A game that finishes meanwhile still finishes; its record is not written | 6 | P3 | Redo onto a winning commit from a seeded fixture with an unreadable history: status won in `current()`, history bytes unchanged. |
| … the end screen repeats the message with the Reset action (Q-33) | — | P4–6 | End sheet, epic 6. |
| Replay's first violation aborts the load and is surfaced exactly like an unknown `version` | 4 | P3 | The replay-rule `replay-failed` variant above, from `session-invalid-r50-placement-order`; `session-invalid-s2-last-only` is the pre-replay AD-7 check (redo-tail violation, Q-41 order). |
| Replay never consults the dictionary | 8 | P3 | Redo into Place from Composing works while the dictionary route fails (Validate disabled); a reload of a seeded Place fixture with the dictionary route failing restores to Place. V in epic 2. |
| `status` and "in progress" derivation | — | V | Epic 2; the New game/Replay confirm is P4–6. |

## §4 R-38 (dictionary load)

| Sentence | CAP | Kind | Notes |
| --- | --- | --- | --- |
| "The app shell loads the dictionary into a `Set<string>` and passes it to the engine's Validate command as data; the engine never loads it" | 8 | P3 + V | P3: a valid word from a seeded Composing fixture advances to Place only after `dictionaryState()` is `ready`; before it, Validate is disabled with `Loading words…`. Engine side V (epic 2, `validate` without a dictionary throws). |
| Validate inactive until structural checks pass; valid word advances; invalid word shows a message and stays in Phase C | 8 | P4–6 (P3 supplementary) | Engine V (epic 2); the minimal board's line and button are supplementary; epic 5 owns the tray UI. |
| "throws while structural fails" | 1 | V | CAP-1 adds the `R-38`-named case (retro S3). |

## §5 R-73, R-74, R-76

| Sentence | CAP | Kind | Notes |
| --- | --- | --- | --- |
| R-73 whole Session saved after every change (phase step, draft edit, undo, redo, commit, give-up, new game) | 3, 8 | P3 + P4–6 | Per dispatch on the minimal board: Undo, Redo, Confirm (seeded Place fixture) (CAP-3); New game in its own test from `session-gave-up.json`; Validate added to the same test in CAP-8; the stored Session equals `current().session` before the next action. Draft edits and give-up have no minimal-board control: the store writes on every new reference (S), and epics 4–6 add their P tests. |
| R-73 saved whenever the app becomes hidden | 5 | P3 | `hidePage` → exactly one `wordcell:session` write (AD-17); `pageHide(page)` alone writes it with the accrued `activeMs`. |
| R-73 restored on launch, every element of `moves` validated by replay | 10 | P3 | Restore-boundary suite; the rejection side is §2 above. |
| R-73 `activeMs` flushed on those events and when hidden, not on timer ticks | 5 | P3 | `page.clock` advance with no dispatch writes nothing; a dispatch or hide writes the accrued value. |
| R-73 exact phase after Android kills the app | 3, 10 | P3 | Kill variant (CDP `Page.crash`, new page in the same context). |
| R-73 "No account, no server" | 3 | P3 | A dispatch-and-reload session makes no request off-origin and no non-GET request. |
| R-74 New game starts a fresh seed | 3 | P3 | Game-over New game (minimal board) and New game from the rejected root: a uint32 seed, `moves = []`, `activeMs = 0`, written at once. |
| R-74 Replay this deal restarts the same seed | — | P4–6 (S) | Menu is epic 6; the store's `replay()` is S here. |
| R-74 both ask for confirmation if a game is in progress (UI) | — | P4–6 | Confirm dialogs, epic 6. |
| R-74 abandoned game not recorded (Q-29) | 3 | P3 + P4–6 | P3: New game never touches `wordcell:history` (from game over and from the rejected root); abandoning an in-progress game needs the epic 6 confirm. |
| R-74 shell generates the uint32 seed and passes it; the engine never generates seeds (UI) | 3 | P3 | First launch: `current().session.seed` is a uint32 and two fresh contexts get different seeds (probabilistic, 2^-32); AD-1 scan keeps `crypto` out of the engine. |
| R-74 on launch with no stored Session the shell deals a fresh seed immediately (UI) | 3 | P3 | Fresh context: `wordcell:session` exists before any input and deep-equals `current().session`. |
| R-76 clock runs whenever playing and visible (including a fresh deal), pauses when hidden or over | 5 | P3 | `page.clock` cases: visible playing grows, hidden does not, won and gaveUp do not, a fresh deal grows. |
| R-76 shell measures visible time and passes elapsed ms as data; the engine never reads a clock | 5 | P3 + V | P3 via the stored `activeMs`; AD-1 scan (V) for the engine half. |
| R-76 always recorded for statistics | 6 | P3 + V | The appended record's `activeMs` equals the finishing Session's. |
| R-76 Show timer preference, default off (UI) | 9 | P3 + P4–6 | First launch: `current().prefs.showTimer` is `false` (default) with `loaded().prefs === null` (P3); the timer display is epic 6. |

## §6 R-84 (persistence half)

| Sentence | CAP | Kind | Notes |
| --- | --- | --- | --- |
| Record appended when status becomes won or gaveUp, removed when that finish is undone | 6 | P3 + V | Redo onto the winning commit appends; Undo removes; the given-up fixture's Undo removes. |
| Persisted locally beside the Session, with its own version | 6 | P3 | `wordcell:history` holds `{ version: 1, records }`. |
| Finish and un-finish write Session and history synchronously in the same task | 6 | P3 | Both keys changed when the dispatch's click resolves, history first (a `setItem` spy in an init script records key order). |
| One game in progress at a time | 3, 4 | P3 | The store holds one Session; a second window halts (Q-38). |
| Statistics set, exclusions, ties | — | V + P4–6 | Epic 2; the panel is epic 6. |

## §7.10 Preferences

| Sentence | CAP | Kind | Notes |
| --- | --- | --- | --- |
| v1 preferences are animation speed and Show timer | 9 | P3 | Prefs format `{ version, animationSpeed, showTimer }`; the panel is P4–6. |
| Stored separately, not part of the move history or undo, survive New game / Replay | 9 | P3 + P4–6 | Seeded non-default prefs unchanged after Undo, Redo and New game; Replay is P4–6. |

## §9 answers owned by the shell

| Answer | CAP | Kind | Notes |
| --- | --- | --- | --- |
| Q-36 unreadable prefs: defaults, no message, overwritten on the next change | 9 | P3 | Next change is S in epic 3 (no Preferences panel); P3 asserts defaults and the key untouched. |
| Q-37 unexpected failure: one blocking message, error text, Reload, storage untouched | 4 | P3 | Font failure before mount; `setItem` throwing after mount. |
| Q-38 second live instance halts with its message and Reload | 4 | P3 | Two pages in one context: the first seeded and `active`, then the second opens unseeded; a dispatch in the second (e.g. Undo) halts the first. |
| Q-38 a page restored from the back/forward cache after another page wrote halts | 5 | P3 | The page under test sets a `wordcell:` key via `page.evaluate` (a document gets no `storage` event for its own writes), is still `active`, then `pageShow(page, { persisted: true })` → halted with the another-window message; nothing changed → stays `active`. |
| Q-39 history first, Session second, history written back on a failed Session write | 6 | P3 | Init script makes the `wordcell:session` write throw once on a finishing dispatch. |
| Q-40 SW and precache failures | — | P7 | |
| Q-41 each move validated at its own `reached` | 10 | P3 + V | Restore of the below-committed-last fixture. |
| Q-42 after a 404 the banner's next Reload reloads the page; under SW the banner stays | 8 | P3 + P7 | SW-controlled branch is P7. |
| Q-43 un-finish match | — | V | Epic 2; D3 accepted as is. |

## Spine behaviour without a rule id (named `AD-n`)

| Behaviour | CAP | Kind |
| --- | --- | --- |
| AD-4 states, dispatch order, `DispatchResult`, `feedback.rejectedWord`, no writes while `rejected`/`halted`, dispatch throws outside `active`; `haltCause` (fatal wins in both orders); persisted `pageshow` after this window's own finish, Delete history or prefs change does not halt | 3, 4, 5 | S + P3 |
| AD-7 no history → `{ status: 'ok', records: [] }`, not written until its first change (absent after the load, non-finishing dispatches and New game; first written by a finish) | 6 | P3 |
| AD-9 clock fractional carry, `peek`, resume/pause idempotence, `registerBeforeHide` order | 3, 5 | S |
| AD-13 launch rewind, stale launch ignored, Forward correction, queued pop before push, reload cases as restated for epic 3 (notice re-pushed at boot, `{ wc: 1, launch: <new> }`, back closes it, next back leaves; literal plain-overlay wording re-proven in epics 4/6), win → New game → back leaves the app (smoke; the end-sheet-expanded discriminating case is P4–6) | 7 | P3 + S + P4–6 |
| AD-13 launch rewind with no `popstate` within 250 ms → AD-15 | 7 | S (`nav.ts` Vitest, stubbed history that never fires `popstate`) |
| AD-15 fatal before and after mount; Session and history writes blocked while halted | 4, 5 | P3 + S (CAP-4's failable no-write proof is the shell Vitest `AD-15 while halted …` case, supplementary) |
| AD-15 a prefs setter throwing while halted | 9 | S (AD-10); P4–6 with the Preferences panel |
| AD-15 `scoreHistory.reset()` throwing while halted | 6 | S |
| AD-16 boot order (nothing written before the font check, rejected root before the History notice, dictionary after first paint: `card-0` and `primary-action` in the DOM when the held `**/en*.txt` request arrives; a `startHidden` page requests it only after `showPage`, via the store's `whenVisible()`) | 8, 10 | P3 (the double rAF and `whenVisible` themselves S) |
| AD-17 `loaded()`, `current()`, `dictionaryState()`, restore-boundary suite (Session vs the snapshot, history/prefs vs `__wordcellBoot`, SPEC CAP-10), kill variant, `hidePage` single write | 3, 5, 8, 10 | P3 |

## Exempt

- R-74 "a replayed seed is a separate game record" beyond the engine V test (epic 2); R-84
  "never replayed" (engine), "v1 statistics are only …" (scope statement, V in epic 2).
- §2 "Dictionary changes do not bump `Session.version`" and `SESSION_VERSION`/`HISTORY_VERSION`
  bump rules: versioning process.
