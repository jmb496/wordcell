outcome: stopped
ticket: 5.11
reason: rule 1, decision-needed (and a spec-intent late major) in the ticket review
next: 5.11
updated: 2026-10-14T16:50:47Z
summary: The ticket review for 5.11 (cards fly into the WordCell on Confirm) needs your answer about how the cell looks mid-flight.

## Report

**What happened.** The ticket review ran 5 rounds and did not settle; nothing was built.

**Your decision.** While Confirm's letters fly into a cell that already holds a word, should the cell ever look empty?
- *Default (recommended):* no. Old and already-landed letters stay visible until the last letter lands, then all but the top disappear together. This matches the F27 rule that Confirm's fly is where the cell never looks empty.
- *Spec literal:* old letters vanish at the first landing, so a long word (10 letters) shows a brief empty cell, up to about 270 ms.

**Also for you (spec wording).** SPEC F7 and build-notes CAP-8 don't say which cards "fly" when the free letter being placed is already in a WordCell (same band). Please say whether it flies, or only its used-state copy disappears.

**Close-out docs:** none yet; SPEC.md F7 and build-notes.md CAP-8 may need a line after your answers.

To resume: record your answers in the ticket Notes and rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-tray-and-place`. Digest: _bmad-output/implementation-artifacts/autopilot/epic-tray-and-place-20261008-1002.md
