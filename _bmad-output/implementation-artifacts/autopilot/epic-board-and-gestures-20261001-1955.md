# Epic autopilot — epic-board-and-gestures — run 20261001-1955

- Epic: epic-board-and-gestures (Board and gestures)
- Branch: epic-4-board
- Start commit: a336272
- Mode: one-ticket sessions (driver `loop.sh`)
- Authorisation: owner-authorised autopilot (methodology § Autopilot, 2026-09-28); gates 3 and 4 delegated per the skill.

## 4.1 Layout definition and geometry — done
What it adds: the measuring rules for the new board, as plain code with no screen yet: the order of the screen bands (top bar, banner, columns, WordCell row, tray, spare space, action bar), how wide a card can be for a given phone or window, and how tall each band is, all pinned by tests against the numbers in the epic spec.
Ticket review: 4 passes, converged; nothing needed your input
Build: built; commits 457dfcc
Code review: thorough, 2 passes, converged; 1 fix applied (84e5008)
Tests: all passing
Ref to fix upstream: none
Tokens: 6.9M input-equivalent (ticket review 53%, code review 23%, build 19%, orchestrator 2%, other 2%); orchestrator peak context 59k
Worth knowing: the layout module exposes a few more helper functions than the architecture note for AD-11 describes ("two entry points"); the build recorded this for the retrospective to fold into AD-11. Ticket 4.4 (live layout) should allow sub-pixel tolerance on phones with fractional safe-area insets, and should pick up the helper names the 4.4 entry in tickets.toml does not mention yet. Five small extra test cases from the code review were left as optional minors in its log.
Close-out docs: none

## Stopped — 4.2 Board render in Idle and Game over with bars, Step A (owner question)
What it adds: the first real board on screen (columns, WordCells, top bar, banner and action bar) in the Idle and Game-over states.
Paused: usage limit at Step A pass 1 (reset 10:30pm America/New_York), resumed 2026-10-02T02:30Z.
Ticket review: 6 passes, diverging (majors 11, 8, 6, 3, 2, 3); stopped by rule 1 — one late major is spec intent.
Ref to fix upstream: bar heights vs safe-area padding → build-notes.md CAP-1 / CAP-3 (spec intent, owner question); board root extent → ticket Board paragraph (restore SPEC F25 "spans the viewport width"); root min-height unit → ticket Board paragraph (100dvh, never 100vh).
Tokens: 10.2M input-equivalent (ticket review 98%, other 1%, orchestrator 1%); orchestrator peak context 54k
Owner question: on phones with a notch or gesture bar, do the top bar and action bar keep their full 44 px / 60 px content height with the safe-area padding added outside it (proposed), or is the padding squeezed inside the band heights the layout computes?
Resume: record the answer in build-notes.md CAP-1 (or the ticket Notes), apply the three open majors in the ticket (the two ticket-wording ones take the proposed defaults), commit, and rerun the driver. The ticket review log already has its `## Result`, so the next session goes straight to the build.
Close-out docs: build-notes.md CAP-1 / CAP-3 ← bar box model and safe-area padding (pending owner answer, 2026-10-01)
