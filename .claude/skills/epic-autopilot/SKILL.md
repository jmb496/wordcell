---
name: epic-autopilot
description: Work through the remaining tickets of one epic unattended — harden each ticket with /review-loop, build it with bmad-build-auto, code-review it with /review-loop, verify, mark it done and continue — stopping only when the owner's input is needed. Use when the user says "autopilot", "run the epic", "work through the epic", or "/epic-autopilot".
argument-hint: "[epic folder name] [stop-after=<ref>]"
---

# Epic autopilot

Runs the per-ticket loop of `docs/development-methodology.md` for every remaining ticket of one
epic, in `tickets.toml` order, without stopping between tickets. The owner authorised this mode on
2026-09-28 (methodology § Autopilot): while it runs, gate 3 (read the ticket before build) is
covered by the review loop's decision-needed rule, and gate 4 (mark done) is delegated to the
autopilot for tickets that pass every check below. Invoking this skill is the owner's ask for
local commits. Never push.

You are the **orchestrator**. Each step runs in a **fresh headless Claude session** (the
methodology's "fresh chat"); you never review, fix or build yourself. You sequence steps, read
their result files, run the verification gates, commit, mark done, and write the digest. Keep
your own context small: read result files and `git`/`tickets.py` output, not the step logs.

## Stop rule

Stop — finish the digest, report to the owner in **plain language** (no jargon: what happened,
what the choice is, what each option would mean for the game or the project), and end the run —
when any of these holds:

1. A review loop (docs or code) reports a **decision-needed** item (functionality, UX, gameplay).
2. The build's plan status is not `built` (e.g. `blocked`: a ticket halt condition fired, or the
   build could not finish).
3. `npm run test:all` fails after the build or after the code-review fixes.
4. The next ticket is `hitl = true`, or the built ticket's **Owner checks at gate 4** line names a
   check other than reading the result (e.g. judging icon art). For the latter, build and verify
   it, leave it `built` (not `done`), and stop so the owner can check.
5. The working tree is dirty or not on the epic's branch when a ticket starts, a headless step
   exits without writing its result file, or any command here fails unexpectedly.
6. `stop-after=<ref>` was given and that ticket is done, or no tickets remain (then recommend
   `/bmad-retrospective`).

Everything else — technical defaults, a review loop capped at 7 passes after applying its
fixes, deferred items — is recorded in the digest and the run continues.

## Setup (once per run)

1. Resolve the epic: the argument, else the epic of the first `ready_to_start` ticket from
   `uv run _bmad/method/scripts/tickets.py next`. Read the epic file's branch decision
   (e.g. "epic branch `epic-1-scaffold`").
2. Check: `git status --short` empty and `git branch --show-current` is the epic branch.
   Otherwise stop (rule 5).
3. Run id `R` = `YYYYMMDD-HHMM`. Working dir for step results and logs, **outside the repo** so
   the tree stays clean for the build: `W=/tmp/wordcell-autopilot/<R>`. Create it.
4. Digest (committed): `_bmad-output/implementation-artifacts/autopilot/<epic>-<R>.md`. Create it
   with a heading, the epic, branch, start commit and the owner authorisation line. It is written
   only between steps (never while a build runs) and committed with each "mark done" commit.

## Per ticket

Take the first `ready_to_start` ticket of this epic from `tickets.py next`. Let `T` be its ticket
file (absolute), `ref` its ref (e.g. `1.4`), `P` its plan file path
(`<ticket basename>-plan.md` beside it, once the build creates it). If it is `hitl`, stop
(rule 4) before doing anything.

Run every headless step with the Bash tool, `run_in_background: true`, from the repo root, and
wait for its completion notification (builds can take a long time; never poll with sleep):

```bash
claude -p "<prompt>" --permission-mode bypassPermissions --output-format text > "$W/<ref>-<step>.log" 2>&1
```

Every step prompt ends with the result-file contract: *"When finished, write
`$W/<ref>-<step>.json` containing exactly one JSON object as specified, then stop. Do not
commit. Do not push. Do not ask questions: record anything that needs the owner in the JSON."*
If the JSON is missing or unparsable after the process exits, stop (rule 5) and point the owner
at the `.log`.

### Step A — harden the ticket (docs review loop)

Skip if the ticket already has a `<ticket>.review-log.md` ending in a `## Result` line.

Prompt: *"Run the review-loop skill on `T` (docs mode, thorough, max 7). Refs: the epic's
SPEC.md, build-notes.md and delta-checks.md (under `_bmad-output/specs/<epic spec>/`), the epic
file, ARCHITECTURE-SPINE.md, AGENTS.md, and the plans of this epic's done tickets for continuity.
Result JSON: `{"result": "converged"|"capped", "passes": n, "majors_per_pass": [..],
"decision_needed": [{"location": "...", "question": "...", "proposed_default": "...",
"practical_effect": "..."}]}`."*

Then: if `decision_needed` is non-empty → stop (rule 1) and present each item by its practical
effect with the proposed default. Else commit the ticket and its review log:
`docs(tickets): harden ticket <ref> with a <n>-pass review loop`.

### Step B — build

Check the tree is clean. Prompt: *"Run the bmad-build-auto skill on ticket `<ref>`
(`T`). Result JSON: `{"plan": "<plan path>", "status": "<plan frontmatter status>",
"blocking_condition": "..."|null, "commits": ["<sha> <subject>", ...]}`."*

Then read `P`'s frontmatter `status` yourself (the plan is the proof, not the JSON). Not `built`
→ stop (rule 2), explaining the blocking condition and `## Auto Run Result` in plain words.

### Step C — code review loop

Let `B` = the commit before the build's first commit (the Step A commit or the previous HEAD).
Prompt: *"Run the review-loop skill in code mode on the commit range `B..HEAD`, with `P` as the
intent (thorough, max 7). Log to `_bmad-output/implementation-artifacts/review-loop/<ref>-build.md`.
Result JSON: `{"result": "converged"|"capped", "passes": n, "majors_per_pass": [..],
"decision_needed": [...as in Step A], "files_changed": ["..."], "test": "pass"|"fail",
"lint": "pass"|"fail", "check": "pass"|"fail"}`."*

Then: decision-needed → stop (rule 1); the fixes stay uncommitted for the owner to see, say so.
Otherwise continue to Step D; the code-review fixes and log are committed there.

### Step D — verify and mark done

1. Free the dev and preview ports (`! ss -ltn 'sport = :5173' | grep -q 5173`, same for 4173);
   if taken, stop (rule 5). Run `npm run test:all` yourself (background, wait). Fail → stop
   (rule 3) with the failing test names.
2. If Step C changed files: commit them with the review log,
   `fix(<area>): code review loop fixes (ticket <ref>)`; if it changed none, commit the log alone,
   `docs(review-loop): code review log (ticket <ref>)`.
3. Owner check other than reading the result → stop now (rule 4), ticket stays `built`.
4. `uv run _bmad/method/scripts/tickets.py mark <ref> done`, append the ticket's digest entry,
   and commit both: `docs(tickets): mark ticket <ref> done (autopilot)`.
5. If `stop-after` names this ref → stop (rule 6). Else next ticket.

## Digest entry (per ticket, plain language)

```
## <ref> <title> — done | built, waiting for you | stopped
What it adds: <one or two sentences a non-programmer understands>
Ticket review: <n> passes, <converged|capped>; nothing needed your input | <items>
Build: <built|blocked: reason in plain words>; commits <short shas>
Code review: <n> passes, <converged|capped>; <k> fixes applied
Tests: all passing | <what failed>
Worth knowing: <deferred items, halts that nearly fired, anything capped — plain words, or "nothing">
```

## Final report

Tell the owner in plain language: tickets done this run, where it stopped and why, what (if
anything) they must decide or check — each choice with its practical effect — and the digest
path. Never report a ticket as done unless `tickets.py` shows it done and `test:all` passed.
