# Epic end-of-game-words: handoff (ticket 10.6, built, waiting for your phone check)

**What happened.** Your two answers are in (commit 2af38ac): a quick second tap within 0.3 s of skipping is now ignored, and the "judge by where the finger lands" bar test and the Space-chord blocking stay. The full test run passed and the screenshot check passed. Nothing else changed.

**What you need to do.** Ticket 10.6 has a done checkpoint: it is marked done only after you play a real win on your Android phone. It is `built` now.
- Setup (from the ticket's "Device read" line): `npm run build`, `npm run preview`, then chrome://inspect port forwarding `4173` → `localhost:4173`. On the phone, clear the site data. Open `localhost:4173/manifest.webmanifest`, and from that tab's console write `fixtures/session-won-words.json` to `localStorage['wordcell:session']`. Then open `/`, tap Undo, then Confirm.
- Check: the copy cost and frame rate, how the bounce timing and size feel, whether the long words stay readable at the fixture's sizes, no trail and no colour change, the tap skip, back to skip and then a second back to collapse the sheet.
- What the fixture can't show (the 40 % floor, a 23-letter row, hundreds of copies) is carried to ticket 10.9's final check.

**To resume.** If the read is fine: `uv run _bmad/method/scripts/tickets.py mark 10.6 done`, commit, and rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-end-of-game-words`. The next ticket is 10.7 (celebration interruptions). If you want the timing or size changed, record it in the ticket Notes first.

**Still true:** pressing ☰ or M during a celebration halts the app until ticket 10.7, so don't merge the branch before 10.7.

**Close-out docs (for the retrospective; 10.9 syncs them):**
- ARCHITECTURE-SPINE.md AD-19 Skip ← F17 keys skip whatever holds focus (2026-10-23); F18 0.3 s tap guard after a skip (2026-10-24); F19 bar test by press point, Space chords and repeats never press a button (2026-10-24); the post-run tails and passing everything through while halted
- docs/game-flow-spec.md R-87 ← the whole dictionary banner is exempt from skipping, as well as the two bars
- From 10.5 (F16, 2026-10-23): AD-19 Start; EXPERIENCE.md "Never plays"

Digest: `_bmad-output/implementation-artifacts/autopilot/epic-end-of-game-words-20261020-0925.md`
