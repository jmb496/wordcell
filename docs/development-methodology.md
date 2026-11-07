# WordCell – Development methodology

How this project turns intent into tested code with Claude Code and BMAD. The owner (Jared) makes
the game-design and product decisions; agents converge documents and code on those decisions.
Every reviewer and fixer runs as a fresh-context subagent so it cannot inherit the author's
assumptions. Work moves one ticket at a time with a human read between steps.

## Roles

| Who | Owns |
|---|---|
| Owner | What the game is: rules, feel, priorities. Answers every Q-xx. Approves briefs, UX, architecture and each ticket before build. Marks tickets done. |
| Orchestrating session | Runs skills, triages findings, keeps logs, never silently decides intent. |
| Reviewer subagents | Independent findings against the artifact and its refs. Read-only. |
| Fixer subagent | Applies accepted findings minimally. Never resolves decision-needed items. |
| `bmad-build-auto` | Unattended build of one ticket with its own review/repair loop (≤ 5 iterations). Halts instead of guessing. |

## Gates where the owner decides

1. `docs/game-flow-spec.md` §9 open questions (once, before planning).
2. Product brief → UX `DESIGN.md`/`EXPERIENCE.md` → `ARCHITECTURE-SPINE.md` (read and approve each).
3. Each ticket before it is built (read the ticket; answer any decision-needed items).
4. Each built ticket before it is marked done (read the plan's result; optionally drive the app).
5. Any `decision-needed` finding from a review loop, at any time.

## Planning phase (once)

```
owner answers Q-xx  →  /review-loop docs/game-flow-spec.md  →  owner reads
→ /bmad-product-brief  →  /bmad-ux  →  /bmad-architecture  →  /bmad-project-context
→ /bmad-spec (first epic)  →  /bmad-preview-ticketing (slice into tickets)
```
Each BMAD skill runs in a fresh chat. Point each at the spec, the legacy docs in
`_bmad-output/planning-artifacts/legacy/`, and the previous step's output. Skip the PRD.

## Per-ticket loop

```
1. Read the ticket (owner).                       gate 3
2. /review-loop <ticket file or plan>  (optional; recommended for the first tickets and any
   ticket touching rules)  → owner reads decision-needed items, answers them.
3. Clean working tree on the epic's branch.  Then, in a fresh chat:  /bmad-build-auto <ticket>
   (or /bmad-build <ticket> when the owner wants to approve the plan first).
4. Read the plan's `status` and `Auto Run Result` (owner).  Chat output is not proof.   gate 4
5. Optional second pass: /review-loop <plan> in code mode, or /bmad-code-review.
6. Mark done: uv run _bmad/method/scripts/tickets.py mark <ref> done
7. After the epic's last ticket: /bmad-retrospective.
```

## Autopilot (owner-authorised 2026-09-28)

`/epic-autopilot [epic]` runs the per-ticket loop above for every remaining ticket of an epic
without stopping between tickets: `/review-loop` on the ticket, `/bmad-build-auto`, `/review-loop`
in code mode on the build (every ticket), `npm run test:all`, then mark done. Each step runs in a
fresh headless session. While it runs, gate 3 is covered by the review loop's decision-needed rule
and gate 4 is delegated to the autopilot for tickets that pass every check. It stops for the owner
on any decision-needed item, a build that is not `built`, a failing `test:all`, a `hitl` ticket, a
ticket whose gate-4 owner check is more than reading the result, or the end of the epic. The owner
reads the plain-language digest in `_bmad-output/implementation-artifacts/autopilot/` instead of
each plan. Local commits only; never pushes.

Device reads (a gate-4 owner check on a real phone, e.g. a ticket's `done_checkpoint`): run
`node scripts/device-preview.mjs <fixture>` and open the printed tailnet URL on the phone; setup and
steps in `docs/device-testing.md` (owner, 2026-10-24).

Stop conditions for any review loop: zero major findings after triage, two consecutive passes
with at most one major each, majors rising pass-over-pass, or the pass cap (default 7, the last
pass verify-only). Rising or persisting real majors mean the refs are unclear; fix the spec or
CLAUDE.md, not the ticket. Minors left at the stop are listed in the result, not applied.

## Definition of done for a ticket

- Every rule id the ticket claims has a passing test naming that id.
- `npm run test:all` passes (lint, types, unit, build with the size budget, `dist-smoke`, e2e, pwa; screenshots run in the container via `npm run test:screens`).
- A ticket that touches `.github/workflows/` also passes the pinned actionlint command of ci.yml's `actionlint` step, run locally via Docker (AD-17 Scripts; ticket 1.11, 2026-09-28).
- No engine-purity, thin-UI, or hand-rolled-DnD rule violated (CLAUDE.md).
- No Q-xx answered by code that the owner has not answered in the spec.
- Plan status `built`, owner has read the result and marked `done`.

## Flake-close protocol (owner-approved 2026-11-07, epic 7 retro A5)

A flake ticket (a test that fails intermittently) cites this section instead of restating it. The
ticket adds only the test's title, the evidence, its edit boundary and anything it narrows or pins
(e.g. 7.14's pinned literals). Built from 7.10 items 5–6, the D-70 fix, 7.13 and 7.14. Flaky tests
are identified by title, never by line number.

1. Evidence. Each failure records its error, failing step, run condition (isolated, counted,
   diagnostic, `test:all`, injection) and trace path; copy the trace outside the repo before the
   next run. Run the AGENTS.md pre-run environment check first: mass 5 s timeouts or `EROFS` are an
   environment fault, not a sighting.
2. Reproduction counts. CI unset (retries 0), on the `/mnt/d` checkout, before and after any fix:
   isolated `npx playwright test <spec> -g "<title>" --project=<project> --repeat-each=50` and three
   counted `npx playwright test --project=<project>` runs, each count recorded with the commit or
   tree it ran at. After a fix both are 0 (0/50, 0/3) at the last tree that changes anything
   outside `_bmad-output/`; any later such change, review fixer included, re-runs them and
   `test:all`.
3. Modes. Each distinct failing step or error is its own mode and needs its own proof; a cause
   proven for one mode does not claim the others.
4. Proof halves. Cause found: a temporary, reverted injection modelling the named mechanism (e.g. a
   delay before a tap, a stale stamp; never load alone, never suppressing the input) reproduces the
   mode 5/5 with `--repeat-each=5`, or else at least 5/20. Fix proven: the same injection and
   command, injection site unchanged, give 0/5 or 0/20 with the fix, with no failure of any kind.
   Record every result. With both halves the fix lands even when the natural before-count is 0;
   without the first half a suspected cause is a recorded hypothesis and no test changes.
5. Void rule. A candidate fix may be revised until its injection proof passes. From its first
   uninjected run on, any failure of the flaky test voids it: revert it (keep the diff in the
   plan), record the failure per 1, no rerun, and the plan stops short of `built` (no second
   unattended fix attempt). With no fix in place, any failure is a reproduction.
6. Never loosen an assertion. No `test.skip`, `test.fixme` or retries. Never change the test's
   title, steps, inputs or expected literals, what a check function asserts, or remove or loosen an
   assertion, unless the recorded cause shows it asserts something no ref it cites prescribes. A
   per-test, poll or expect timeout (`test.slow` included) or a fixed delay only for a test-side
   cause whose proof shows the step needs more time with no late or lost input; page-state waits may
   fix any test-side or input-delivery cause. A longer timeout or a retap never fixes an
   input-delivery cause.
7. Cause by layer.
   - Test: input timed into a window, or onto a control still disabled, as a ref prescribes; fixed
     in the test.
   - Helper or input delivery: an `e2e/helpers/` bug, or Chromium/CDP delivering or stamping input
     late under load (D-71); fixed test-side by page-state waits or deterministic stamps. A changed
     helper gets or keeps an `e2e/helpers.spec.ts` case that fails on a named mutation, and its
     callers' tests pass `--repeat-each=5`.
   - `src/` or config: a behaviour no ref prescribes that a real player's input can reach, even if a
     test wait would hide it (e.g. a human-speed tap after a drag ignored; AD-14 is one example of
     a ref to check against). No `src/` or config edit in the flake ticket: record the cause, its
     proof and a fix-ticket proposal (title, finding, files, reproduction), and the plan stops for
     the owner.
8. Outcomes. Fixed (both halves; 0/50 and 0/3 after). Reproduces without both halves: counts and
   evidence recorded, no speculative edit, the plan stops short of `built`. Never reproduces
   (neither half: no failure in the runs of 2 or the build's `test:all`, no injection showing the
   mode): closed with the counts and evidence recorded, and the plan reaches `built` with that
   reason. A later sighting opens a new fix ticket citing the closed ticket's plan and the
   failure's event log (D-65 → 7.13, D-64 → 7.14).
9. An unrelated flake in a final `test:all`. A failure confined to a known flaky test outside the
   ticket's change gets one rerun at the same commit, both results recorded. A failing rerun stops
   the build; a flake seen in a second ticket gets its own fix ticket. Any other failure stops the
   build and is reported.

## Prompts

**Kick off after reviewing the spec** (paste into a fresh Claude Code session in this repo):

> I have reviewed docs/game-flow-spec.md and answered the open questions in §9. Run /review-loop
> docs/game-flow-spec.md with max=4 and thorough depth. Do not change any answer I gave in §9.
> When it converges or caps, list every decision-needed item with its proposed default and stop
> for my answers. After I answer, fold each confirmed answer into the rules section as a rule with
> an id, delete the resolved rows from §9, and leave only genuinely open items. Then summarise
> what changed and tell me the exact next skill to run.

**Start planning** (fresh chat): `/bmad-product-brief` — "Create the product brief for WordCell
from docs/game-flow-spec.md, docs/requirements-carryover.md and
_bmad-output/planning-artifacts/legacy/. Fast mode. English only for v1. Android PWA first."

**UX** (fresh chat): `/bmad-ux` — "Design the touch layout and interaction model for WordCell
from the brief and docs/game-flow-spec.md §7. Portrait phone first."

**Architecture** (fresh chat): `/bmad-architecture` — "Record the architecture spine from
docs/platform-decision.md §3 and CLAUDE.md architecture rules; do not reopen the stack choice."

**First ticket** (fresh chat, after an initial commit exists): `/bmad-build-auto ticket 1.1`.
