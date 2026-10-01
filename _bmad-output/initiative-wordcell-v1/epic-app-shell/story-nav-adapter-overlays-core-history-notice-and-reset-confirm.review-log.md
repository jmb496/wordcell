# Review log — story-nav-adapter-overlays-core-history-notice-and-reset-confirm (ticket 3.8)
State: pass 2: done

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
