# Autopilot run 20260928-0053 — epic-scaffold-ci-deploy

Branch: epic-1-scaffold · start commit 36a8658
Owner authorisation: methodology § Autopilot (Jared, 2026-09-28): gate 3 covered by the review loop's decision-needed rule; gate 4 delegated for tickets that pass every check.

## 1.3 Test harness: Playwright configs, test hook and helpers — done
What it adds: the testing toolkit later tickets rely on — tests that run against the finished app as players would get it, a hidden test-only window into the app that never ships to players, and helpers that fake finger drags, long presses and the phone putting the app in the background.
Ticket review: 7 passes, capped (last fix not re-reviewed); nothing needed your input
Build: built; commits 71741b6
Code review: 4 passes, converged; 3 fixes applied (extra tests for the seeding helper's error checks, one test restored to the ticket's wording, updated evidence) — 1b31057
Tests: all passing
Worth knowing: the finger-drag simulation works in the test browser, so the halt you approved never fired. The check that test-only code is absent from the players' version runs only in its own command until the CI ticket (1.8) adds it to the automatic checks. A naming rule in AGENTS.md doesn't fit the new test files; that goes to the end-of-epic AGENTS.md tidy-up (a default, no effect on the game).

## 1.4 WordCell Serif card-letter font — done
What it adds: the card letters now use the game's own serif font (a trimmed copy of Fraunces containing only the capital letters and the small "u" used on the QU card), downloaded once and stored for offline play. Nothing else on screen uses it.
Ticket review: 7 passes, converged; nothing needed your input
Build: built; commits d46bc89
Code review: 1 pass, converged; no fixes needed
Tests: all passing
Worth knowing: the font file is tiny (about 4 KB), just over the size at which the build tool would embed it inside the style file; one build setting keeps it a separate file, and the architecture document should mention that setting (noted for the end-of-epic retrospective). A screenshot of the cards in the new font was taken during the build.

## 1.5 PWA packaging: manifest, service-worker settings, head, icons and palette — done (icons approved by you, 2026-09-28)
What it adds: everything that makes WordCell installable on Android: the app's name and colours when installed, the install icon (a serif W on a tilted dark card with a teal and an orange mark), a matching browser-tab icon (your answer), the page title and phone status-bar colour, the game's colour palette, and offline-storage settings that ask before updating instead of updating silently.
Ticket review: 7 passes, capped (last fix not re-reviewed); one question for you, answered: the browser-tab icon becomes the W card
Build: built (first attempt cut off by the usage limit, resumed); commits 89af221
Code review: 1 pass, converged; no fixes needed
Tests: all passing
Worth knowing: the colour codes are written in lowercase in the style file because the project's formatter insists; they are the same colours. You approved the icons.

