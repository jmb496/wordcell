# Review log — ticket 7.12 (Owner's post-merge v1 release: production install, 1.0.0 and ten games)

State: pass 1: done

Target: `_bmad-output/initiative-wordcell-v1/epic-pwa-release/story-owner-s-post-merge-v1-release-production-install-1-0-0-and-t.md` (docs mode, thorough, max 7)
Pre-loop: HEAD 233c795; copy `<passes>/pass0.md`, 361 words.
Caller intent: tickets.toml entry 12 keys `unknown` and `done_checkpoint = true` not copied by `pull`, added to the Description in pass 1; owner authorised the agent to run the ticket on 2026-11-07 ("please proceed") after merge dcd2df0, CI run 42412944905 and Deploy run 42414566899 to https://wordcell.jmb496.workers.dev (production URL recorded in the ticket); retro accepted-with-open-items, A10 (Q-50 waiver) belongs here; `main` is an ancestor of `pwa-release` (a1a5934 + pull commit ride along with the release commit); owner steps few and plain, on the phone, no desktop or keyboard testing.

## Pass 1 — 2026-11-07
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 15, minor 9, decision-needed 0  |  Dropped in triage: 0 (about 20 duplicates merged)
Words (docs): 942 (2.61 x pass 0; budget ~900 — later additions are minors unless word-neutral)  |  Snapshot: <passes>/pass1.md; fix diff <passes>/pass1.fix.diff
### Applied
- [major] Description opening — merge/deploy described as future Jared work; record dcd2df0 (agent, one-time owner exception, epic Notes 2026-11-07), CI 42412944905, Deploy 42414566899, production URL, Jared's 2026-11-07 "please proceed"; release-commit merge/push stay Jared's → fixer item 1
- [major] Description — tickets.toml entry 12 `unknown` and `done_checkpoint = true` not carried → fixer item 2
- [major] Description / Notes — ten-game restart rule called open; answered 2026-10-29 (epic Notes Decision (2)) → fixer item 3
- [major] Verify — waiver optional and Done when 1 only; retro A10: Jared's explicit waiver of Done when 1 and 3 with the accepted gaps listed → fixer item 4
- [major] Description — branch state: ff-only already satisfied, record commits ride along, push form, ff before every agent commit, closing records after the declaration → fixer item 5
- [major] Description — spoiled read: refs allow resting on the tailnet G3 pass; no deploy only for a redo → fixer item 6
- [major] Verify — production reads lack date and footer (F12) → fixer item 7
- [major] Description/Verify — no `test:all` or pre-run check before `built`; plan carries the release commit → fixer item 8
- [major] Description — owner steps not guided or few; per-game reporting; Desktop re-read conflict → fixer item 9
- [major] Verify — where each row's evidence lives is unstated → fixer item 10
- [major] Verify — ten-game criterion drops qualifying test, no misdrop/lost drop, reset → fixer item 11
- [major] Description — no guard against opening WordCell between the 1.0.0 push and Deploy green → fixer item 12
- [major] Description — red CI/Deploy and §6.7 over-budget have no route → fixer item 13
- [major] Description — §6.1 "no" has no route → fixer item 14
- [major] Verify — who marks 7.12, epic and initiative done → fixer item 15
- [minor] F10 felt lag in §6.1 statement → 16; tag v1.0.0 → 17; References gaps → 18; every footer a game was played on → 19; restart-rule paths → 20; production site data not cleared → 21; G4 boundaries on either build → 22; `<sha>` defined → 23; SPEC CAP-10 / checklist §6.7 wording sync per SPEC review minors 4–5 → 24
### Fixer outcome
- All 24 applied; Description restructured into Done so far / 8 Owner steps / Agent rules. Checked: `main` ancestor of `pwa-release`; `git diff main pwa-release` only `_bmad-output/`; `_bmad/method/scripts/tickets.py mark <ref> <status>` exists (plans only; epic and initiative via `bmad-preview-ticketing`). Unverified: `git push origin pwa-release:main` (not run). Item 8: post-merge fix in its own fix-ticket plan (F11), not the 7.12 plan.
### Default applied (technical)
- Spoiled read → rests on the tailnet G3 pass unless a post-merge fix deploys anyway (then redone once on it)
- Push form → `git push origin pwa-release:main` (fast-forward; deployed SHA = release commit) (unverified, not run: agents never push)
- Evidence location → evidence table in the 7.12 plan; D in the epic Notes; `release-checklist.md` unchanged
- Closing record commits → stay local on `pwa-release` until after the declaration; Jared merges them then (docs-only deploy, no re-read)
- Red CI/Deploy → post-merge fix under F11 (flake: methodology flake-close protocol); §6.7 over budget → re-run once after the pre-run check, then a fix ticket
- §6.1 "no" → stops before the declaration; reasons become fix tickets or a spec §9 question
- Desktop re-read needed by a fix → the agent stops and asks Jared
- Done marks → the agent runs `tickets.py mark` on Jared's explicit recorded word
- Production site data → not cleared (keeps his history)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (duplicates merged across the four lenses)
