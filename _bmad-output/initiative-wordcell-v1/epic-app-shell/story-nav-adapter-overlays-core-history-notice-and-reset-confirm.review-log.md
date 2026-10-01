# Review log — story-nav-adapter-overlays-core-history-notice-and-reset-confirm (ticket 3.8)
State: pass 6: done (converged)

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: 266 words, snapshot `story-nav-adapter-overlays-core-history-notice-and-reset-confirm.passes/pass0.md`, HEAD 2a6822b.
Note: the pull from tickets.toml entry 8 dropped `interface`, `tests`, `owns`; they are passed to reviewers and fixer as intent, and the pass 1 fixer adds them to the Description as `Interface:`, `Tests:`, `Owns:` lines.

## Pass 1 — 2026-10-01
Reviewers: builder's reading, edge-case, adversarial, ref alignment  |  Findings: major 8, minor 9, decision-needed 1  |  Dropped in triage: 17 (duplicates merged across the four lenses)
### Applied
- [major] Tests — three History-notice variants: one fixture each (version-unknown, null, a contents fixture), version interpolated from the stored version, not the catalogue's sample "2" → fixer 1
- [major] Tests/Verify — stale-launch and Forward have no reachable P3 flow; name flows (Forward after Not now; stale via notice+confirm → Delete history → reload → goForward) and nav.ts S Vitest cases (timeout, stale launch, missing wc, Forward) → fixer 2
- [major] Tests — queued pop-before-push and pending-pop counting untested (S Vitest; P3 Keep it then Reset history at once → wc 2) → fixer 3
- [major] Verify — deferred push after New game from the rejected root untested; plus once-per-launch → fixer 4
- [major] Interface — before-back hook in epic 3 (pointer controller is epic 4) → fixer 5
- [major] Dialog — confirm focus, scrim tap, board inert, Esc, native cancel bypass unspecified → fixer 6
- [major] Verify — win smoke route (session-won, Undo, Redo, New game) missing; Validate disabled until entry 9 → fixer 7
- [major] Verify — Keep it returning to the notice untested → fixer 8
- [minor] resetForNewSession epic 3 subset → fixer 9
- [minor] main.ts boot placement of launch, register and notice push → fixer 10
- [minor] Delete history: reset() first, then closes; wc 0, back leaves, reload no notice → fixer 11
- [minor] stored history bytes unchanged after Not now, Keep it, back, reload → fixer 12
- [minor] overlays.svelte.ts unit test (non-top close throws, closedByBack, depth/top/isOpen) → fixer 13
- [minor] "leaves the app" = about:blank mechanic; goBack is not A-A11 evidence → fixer 14
- [minor] References: DESIGN.md Components, SPEC CAP-7, build-notes CAP-7 → fixer 15
- [minor] history-invalid-* seeding exemption recorded in the plan → fixer 16
- [minor] Interface/Tests/Owns lines from tickets.toml entry 8 added to Description → fixer 0
Fixer: all 17 items applied (0–16); notice scrim/focus left as a Notes open question.
Words (docs): 1084 (4.1 x pass 0)  |  Snapshot: story-nav-adapter-overlays-core-history-notice-and-reset-confirm.passes/pass1.md
### Default applied (technical)
- nav register — `register({ closedByBack, depth })` from overlays; epic 4 adds the before-back registration; nav runs no hook until then; a back popstate before registration throws (rule 6)
- Dialog — focus starts on the dismissive button; scrim consumes taps (board inert); confirm scrim tap = Keep it via overlays.close; Esc lands with the epic 6 keyboard map; a native dialog cancel never closes without overlays.close
- boot — await nav.launch() first; overlays registers after launch; notice pushed after registerLifecycle, before mount, only when active and history unreadable
### Decision needed (functionality / UX / gameplay)
- History notice — should tapping outside the notice (on the dimmed board) dismiss it like Not now, and should keyboard focus start on Not now? EXPERIENCE gives these only for confirm dialogs — proposed default: yes, same as the confirm dialog (focus on Not now, scrim tap acts as Not now)
### Dropped
- 17 duplicates of the above across lenses

## Pass 2 — 2026-10-01
Reviewers: fix diff, edge-case, adversarial, ref alignment  |  Findings: major 6, minor 7, decision-needed 0  |  Dropped in triage: 9 (duplicates: stale-launch end state ×3, native dialog ×1, focus/reset/unregistered tests ×3, before-back S half ×1, expect.poll ×1)
### Applied
- [major] Tests P3 Stale launch — after goForward() onto the ignored entry the page stays there; first back returns to { wc: 0, launch: <new> }, the next back leaves → fixer 1
- [major] Dialog — a native showModal <dialog> takes Android back as its own close request (no popstate); build a non-native dialog → fixer 2
- [major] Tests — ticket 3.7 carry-forward: e2e/history.spec.ts §2 unreadable test must tap Not now before its first Undo → fixer 3
- [major] Tests — stated rules untested: focus on Keep it, Esc leaves the confirm open, board inert under the scrim, resetForNewSession (U), popstate before register() throws (S) → fixer 4
- [major] Variant sentences — interpolation tested only with 2 (= catalogue sample); U case with another version → fixer 5
- [major] Dialog — notice/confirm while the store halts (throwing Delete history write, fatal, another window) unspecified → fixer 6
- [minor] rewind timeout rejects launch() (boot's await carries it to AD-15), not a throw inside the timer → fixer 7
- [minor] S nav case: drop "nor a before-back hook" (no hook in epic 3) → fixer 8
- [minor] open(id) on an already-open id throws (U) → fixer 9
- [minor] history.state assertions after queued pops / Forward use expect.poll → fixer 10
- [minor] reload cases: "full flow" → the Verify flows incl. both reload cases; <new> = launch differs from before the reload → fixer 11
- [minor] once-per-launch/deferred flag: one module-level flag in one src/ui module → fixer 12
- [minor] win smoke uses the history-invalid-* exemption; plan records it → fixer 13
Fixer: all 13 items applied (item 7: the S rejection assertion detail left to the plan).
Words (docs): 1382 (5.2 x pass 0)  |  Snapshot: story-nav-adapter-overlays-core-history-notice-and-reset-confirm.passes/pass2.md
### Default applied (technical)
- Dialog — non-native element (role="dialog", aria-modal="true", own scrim, board `inert`), never showModal()
- halted — notice and confirm render only while the store is not halted; entries stay in the overlay stack
- nav launch timeout — launch() rejects after 250 ms without popstate
- overlays open(id) on an open id throws (rule 6)
### Decision needed (functionality / UX / gameplay)
- none new (pass 1's History-notice scrim/focus question stays open)
### Dropped
- 9 duplicates (see header)

## Pass 3 — 2026-10-01
Reviewers: fix diff, edge-case, adversarial, ref alignment  |  Findings: major 5, minor 13, decision-needed 0  |  Dropped in triage: 7 (duplicates: board-inert test ×3, naming ×2, S rejects wording ×2)
### Applied
- [major] P3 Keep it board-inert check — fresh deal has Undo disabled and Playwright won't click through the scrim; seed session-place.json + history fixture, tap undo's box centre through the scrim → fixer 1
- [major] Tests naming — S/U Vitest names must start AD-13 (AGENTS.md), P3 §2/AD-13, halt case AD-15 → fixer 2
- [major] Dialog — the notice under the confirm stays focusable (keyboard Reset history → open() on open id; Not now → non-top close; both throw); every surface below the top dialog is inert → fixer 3
- [major] Dialog — inert follows the rendered dialog (not halted), never stack depth alone; halt test asserts Reload focused → fixer 4
- [major] P3 Forward / Stale launch — wait (expect.poll) for wc 0 before goForward()/reload(), else the case proves nothing or flakes → fixer 5
- [minor] S bullet: "throws to AD-15" → "rejects launch()" → fixer 6
- [minor] halt test uses armStorageSpy({ throwOn: 'wordcell:history' }) + expectFatal → fixer 7
- [minor] Android native-dialog claim marked unverified (epic 7 A-A11) → fixer 8
- [minor] Escape assertion labelled interim, inverted by epic 6 keyboard map → fixer 9
- [minor] scrim tap = click at a viewport point outside the dialog box, no new testid → fixer 10
- [minor] register depth is a getter → fixer 11
- [minor] once-per-launch flag set when the notice is pushed; New game pushes only when the store was rejected, flag unset, history unreadable → fixer 12
- [minor] U contents-function clause dropped → fixer 13
- [minor] S: rewind popstate exempt from stale check; back { wc: 0 } at depth 1 calls closedByBack(0); a second pop() waits for the first's popstate → fixer 14
Fixer: all 14 items applied; wording tightened elsewhere to fit; halt test placed in e2e/history.spec.ts with its local expectFatal.
Words (docs): 1497 (5.6 x pass 0; budget 1500 reached — further additions are minor)  |  Snapshot: story-nav-adapter-overlays-core-history-notice-and-reset-confirm.passes/pass3.md
### Default applied (technical)
- inert — board and every dialog below the top one; tied to the rendered dialog
- register depth — `depth: () => overlays.depth`
### Decision needed (functionality / UX / gameplay)
- none new
### Dropped
- 7 duplicates (see header)
### Unapplied minors (plan-level, no ticket words)
- while halted, each back silently closes one hidden overlay entry (accept; plan line)
- launch id from crypto.getRandomValues (e.g. seed.ts newSeed()), not randomUUID
- P3 "Keep it then Reset history with no wait" is a smoke check; the S queue case is the proof

## Pass 4 — 2026-10-01
Reviewers: fix diff, edge-case, adversarial, ref alignment  |  Findings: major 2, minor 4 applied + 9 plan-level unapplied, decision-needed 0  |  Dropped in triage: 3 (duplicates: board-inert/owner question ×2, once-per-launch label ×1)
### Applied
- [major] P3 Keep it "Board inert" — the click lands on the notice's scrim and asserts "notice still open", settling the pending owner question; assert inert instead (undo not focusable with the notice open; a click at undo's centre with the confirm open acts as Keep it, Session unchanged) → fixer 1
- [major] P3 Delete history — "back leaves the app, a reload shows no notice" reloads about:blank (vacuous); reorder: reload shows no notice, then back leaves → fixer 2
- [minor] S nav: "a non-stale popstate with a wc before register() throws" → "any other popstate …" (rewind popstate only resolves launch()) → fixer 3
- [minor] Registration: main.ts calls nav.register({ closedByBack: overlays.closedByBack, depth: () => overlays.depth }) after launch → fixer 4
- [minor] Boot: restore "the rejected-root New game handler" (pass 3 tightening lost it) → fixer 5
- [minor] win smoke label "(once per launch)" → "(store not rejected)" → fixer 6
Fixer: all 6 items applied; Boot dropped the redundant 'overlays registers after launch' and 'store was rejected before newGame()' to pay for the words.
Words (docs): 1497 (5.6 x pass 0)  |  Snapshot: story-nav-adapter-overlays-core-history-notice-and-reset-confirm.passes/pass4.md
### Default applied (technical)
- board inert evidenced by focusability plus the specified confirm-scrim outcome, not the notice scrim
### Decision needed (functionality / UX / gameplay)
- none new
### Dropped
- 3 duplicates
### Unapplied minors (plan-level; ticket at budget)
- the History notice renders through Dialog (role dialog, named by its title)
- order in the New game handler: resetForNewSession() then the deferred push (build-notes CAP-4)
- focus on close: confirm closes → notice's Reset history; notice closes → board
- Tab check bounded: Tab and Shift+Tab ×3 from Keep it stay inside the confirm
- every app surface except the top dialog is inert (entry 9's dictionary banner inherits)
- deferred push also requires the store active after newGame()
- after launch() rejects, nav ignores later popstates (no second fatal overwriting the timeout text)
- P3 Forward at depth 1: after Keep it, goForward() leaves the notice open, confirm closed (wc 1)
- once-per-launch flag is structurally redundant in epic 3 (rejection only at boot)

## Pass 5 — 2026-10-01
Reviewers: fix diff, edge-case, adversarial, ref alignment  |  Findings: major 1, minor 6 applied + 7 plan-level unapplied, decision-needed 0  |  Dropped in triage: 1 (duplicate: single New game handler)
### Applied
- [major] nav push — wc of a queued push unspecified; reading the depth getter at send time gives two queued pushes the same wc → nav keeps its own count of pushed-not-popped entries, sends { wc: count + 1, launch }; S: two pushes queued behind a pop go out as consecutive wc → fixer 1
- [minor] App.svelte has one newGame() for both roots: "in the New game handler (rejected root and game over)"; Boot deferred push condition explicit (store state read before newGame() was rejected) → fixer 2
- [minor] S queue case: "a pop() or Forward correction is pending" → fixer 3
- [minor] halt test also asserts history.state.wc 2 (entries stay in the stack) → fixer 4
- [minor] §2 variants assert the sentence and the Reset history button (rule-coverage row 22) → fixer 5
- [minor] "runs the Verify flows" → "runs Verify's notice and confirm flows" → fixer 6
Fixer: all 6 items applied; wording tightened across Description, Interface, Decisions and Tests to pay for them (no substance dropped per fixer).
Words (docs): 1511 (5.7 x pass 0)  |  Snapshot: story-nav-adapter-overlays-core-history-notice-and-reset-confirm.passes/pass5.md
### Default applied (technical)
- nav push numbering — own pushed-not-popped count, wc = count + 1
### Decision needed (functionality / UX / gameplay)
- none new
### Dropped
- 1 duplicate
### Unapplied minors (plan-level; ticket at budget)
- close(id) throws unless id is the top entry, including an empty stack
- variant tests assert the dialog's exact title and body (accessible name/description)
- after reload, wait for card-0 before asserting no dialog
- assert undo's centre lies outside the confirm's box before the inert click
- Forward is decided before the before-back hook (epic 4 note)
- "nav launch awaited before the font check" as an entry 10 ordering case
- notice renders from the reason captured when opened (reset() flips state to ok before the closes)
- while halted, back closes hidden entries (plan line)

## Pass 6 — 2026-10-01
Reviewers: fix diff, edge-case, adversarial, ref alignment  |  Findings: major 1 (open), minor 13, decision-needed 0  |  Dropped in triage: 3 (duplicates: push counter ×1, Esc wording ×1, stale-before-register ×1)
Words (docs): 1511 (5.7 x pass 0)  |  Snapshot: story-nav-adapter-overlays-core-history-notice-and-reset-confirm.passes/pass5.md (no fix this pass)
### Open major (not fixed; stopping rule)
- Decisions, Registration — pass 5's push counter ("entries it pushed and has not seen popped", wc = count + 1) is undefined for a Forward correction (count can go to −1) and for a back jumping several entries (count drops by one, not to d); later pushes get the wrong wc. Fix: count := state.wc of every settled current-launch popstate (own pop, Forward correction or back), +1 per push sent; S: after a Forward correction push() sends { wc: depth + 1 }, and a pop from wc 2 then two queued pushes send wc 2 then 3.
### Triage notes
- Stale-before-register ordering (edge-case lens: major; adversarial: minor) classed minor: register() in the same continuation as `await nav.launch()` leaves no reachable window; the S line should read "any other current-launch popstate … (stale ones are ignored even then)".
### Dropped
- 3 duplicates

## Result — converged after 6 passes
Majors per pass: 8 → 6 → 5 → 2 → 1 → 1. open major: nav push counter definition (Decisions, Registration; see Pass 6). Decision needed (owner): whether a scrim tap on the History notice acts as Not now and focus starts on Not now (proposed default: yes, same as the confirm dialog). Technical defaults applied: 13. Words 266 → 1511 (budget 1500).
### Unapplied minors (for the build plan)
- S nav: "any other current-launch popstate with a wc before register() throws (stale ones ignored even then)"; register() immediately after `await nav.launch()`
- Dialog Esc wording: "Esc does nothing on either dialog until epic 6's keyboard map, which closes them via overlays.close"
- P3 deferred push label `§2` (seeds session-invalid-*; AGENTS.md pitfall); assert its launch equals the boot launch id
- win smoke label "(already shown this launch)" instead of "(store not rejected)"
- push while on an ignored stale entry stacks above it (back swallowed once): spine note for AD-13 before epics 4/6
- Replay (epic 6) must call resetForNewSession() first
- register a wrapper `(d) => overlays.closedByBack(d)` or a free function, not a detached `this`-method
- spec files: e2e/history-notice.spec.ts (§2 and dialog flows), e2e/nav.spec.ts (Forward, stale, reload, deferred push, win smoke)
- contents-unreadable sentence is effectively constant until HISTORY_VERSION bumps
- one openHistoryNotice() in the flag-owning src/ui module for both boot and New game paths
- from pass 4: notice renders through Dialog; resetForNewSession() then deferred push; focus on close (confirm → Reset history, notice → board); bounded Tab check (Tab/Shift+Tab ×3); every app surface except the top dialog inert; deferred push requires the store active after newGame(); nav ignores popstates after launch() rejects; Forward at depth 1 P3; once-per-launch flag redundancy
- from pass 5: close(id) throws unless top (empty stack too); exact title/body assertion; wait for card-0 before absence checks; undo centre outside the confirm box; Forward decided before the before-back hook; nav launch awaited as an entry 10 ordering case; notice renders from the captured reason; back while halted closes hidden entries
