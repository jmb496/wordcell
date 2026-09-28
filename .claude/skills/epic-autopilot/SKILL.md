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

1. A review loop (docs or code) reports a **decision-needed** item (functionality, UX, gameplay),
   or it capped or stopped on its trend with late majors whose ref to fix is spec or spine
   intent (what a rule or an AD means, not how the ticket words it): that text is the owner's
   (AGENTS.md Policy), so present it as a question with the proposed wording.
2. The build's plan status is not `built` (e.g. `blocked`: a ticket halt condition fired, or the
   build could not finish).
3. `npm run test:all` fails after the build or after the code-review fixes.
4. The next ticket is `hitl = true`, or the built ticket's **Owner checks at gate 4** line names a
   check other than reading the result (e.g. judging icon art). For the latter, build and verify
   it, leave it `built` (not `done`), and stop so the owner can check.
5. The working tree is dirty or not on the epic's branch when a ticket starts, a headless step
   hit a usage or session limit (see Usage limits), a headless step exits without writing its
   result file, or any command here fails unexpectedly.
6. `stop-after=<ref>` was given and that ticket is done, or no tickets remain (then recommend
   `/bmad-retrospective`).

Everything else — technical defaults, a review loop capped at 7 passes or stopped on its trend
after applying its fixes (its late-major area recorded as a ref to fix upstream), deferred
items — is recorded in the digest and the run continues.

## Setup (once per run)

1. Resolve the epic: the argument, else the epic of the first `ready_to_start` ticket from
   `uv run _bmad/method/scripts/tickets.py next`. Read the epic file's branch decision
   (e.g. "epic branch `epic-1-scaffold`").
2. Check: `git status --short` empty and `git branch --show-current` is the epic branch.
   Otherwise stop (rule 5).
3. Run id `R` = `YYYYMMDD-HHMM`. Working dir for step results and logs, **outside the repo** so
   the tree stays clean for the build: `W=/tmp/wordcell-autopilot/<R>`. Create it.
   Resuming: if this epic's newest digest has no `## Run complete` and ends in a `## Stopped`
   section, reuse its `R`, `W` and digest (recreate `W` if it is gone) instead.
4. Digest (committed): `_bmad-output/implementation-artifacts/autopilot/<epic>-<R>.md`. Create it
   with a heading, the epic, branch, start commit and the owner authorisation line. It is written
   only between steps (never while a build runs) and committed with each "mark done" commit, and
   with the stop commit when a run stops before a ticket is done (`docs(autopilot): stopped at
   ticket <ref> step <step> (<reason>)`), so a rerun starts from a clean tree.

## Per ticket

Take the first `ready_to_start` ticket of this epic from `tickets.py next`. Let `T` be its ticket
file (absolute), `ref` its ref (e.g. `1.4`), `P` its plan file path
(`<ticket basename>-plan.md` beside it, once the build creates it), and `L` its code review log
`_bmad-output/implementation-artifacts/review-loop/<ref>-build.md`. If it is `hitl`, stop
(rule 4) before doing anything.

A ticket an earlier run left part-way starts at the first unfinished step, judged from the files
alone: a ticket review log without a `## Result` line → Step A (resume); no `P`, or `P` status
`in-progress` → Step B; `P` `built` and `L` missing or without `## Result` → Step C (resume);
`L` with `## Result` → Step D. A "partial" log is one that exists without `## Result`: never
delete it, restart it or skip it.

Run every headless step with the Bash tool, `run_in_background: true`, from the repo root, and
wait for its completion notification (builds can take a long time; never poll with sleep):

```bash
claude -p "<prompt>" --permission-mode bypassPermissions --output-format text < /dev/null > "$W/<ref>-<step>.log" 2>&1
```

Every step prompt ends with the result-file contract: *"When finished, write
`$W/<ref>-<step>.json` containing exactly one JSON object as specified, then stop. Do not
commit. Do not push. Do not ask questions: record anything that needs the owner in the JSON."*
After the process exits, check the log **first** for a usage limit (below), and only then the
JSON: missing or unparsable → stop (rule 5) and point the owner at the `.log`.

### Usage limits

A step hit a limit when its log matches `grep -iE 'hit your (session|usage) limit'` (the message
reads e.g. `You've hit your session limit · resets 5:30am (America/New_York)`). This check runs
before the missing-JSON rule, since a limited step never writes its JSON. Then:

1. Keep the step's log as `$W/<ref>-<step>-attempt<k>.log` and leave everything the step wrote in
   place: an `in-progress` plan is resumed by `bmad-build-auto`, a partial review log by the
   review-loop skill's resume rule, and review passes are already checkpointed (Steps A, C).
2. If the tree is dirty, commit what the step wrote as a WIP checkpoint in the step's commit
   family (e.g. `docs(tickets): WIP review pass <n> ticket <ref>`); a build's own files are left
   to `bmad-build-auto`'s resume, so leave them uncommitted and say so.
3. Append `## Stopped — usage limit` to the digest: the ticket, step, the reset time exactly as
   the message shows it, and the resume instruction; commit it (the stop commit, Setup 4).
4. Tell the owner in plain words: the run paused at the limit, when it resets, and that running
   `/epic-autopilot <epic>` after that picks up where it stopped.
5. Optional, only when this orchestrator session offers a scheduling tool (e.g. `ScheduleWakeup`
   or `CronCreate`): schedule a one-off `/epic-autopilot <epic>` for about 5 minutes after the
   reset time instead of leaving the run idle, and tell the owner it is scheduled and for when.
   Without such a tool, just stop.

### Step A — harden the ticket (docs review loop)

Skip if the ticket already has a `<ticket>.review-log.md` with a `## Result` line. If that log
exists without one, this is a **resume**: add to the prompt *"The review log is partial: resume it
with the review-loop skill's resume rule; do not restart."*

Prompt: *"Run the review-loop skill on `T` (docs mode, thorough, max 7). Refs: the epic's
SPEC.md, build-notes.md and delta-checks.md (under `_bmad-output/specs/<epic spec>/`), the epic
file, ARCHITECTURE-SPINE.md, AGENTS.md, and the plans of this epic's done tickets for continuity.
Checkpoint: after each pass's fixes are written (and its state line updated), commit only `T` and its
review log (the loop's `.passes/` copies are git-ignored), as `docs(tickets): WIP review pass <n> ticket
<ref>`; this is the one commit you may make. Result JSON: `{"result":
"converged"|"capped"|"diverging", "passes": n, "majors_per_pass": [..], "decision_needed":
[{"location": "...", "question": "...", "proposed_default": "...", "practical_effect": "..."}],
"late_majors": [{"area": "...", "ref_to_fix": "<doc and section>", "spec_or_spine_intent":
true|false}]}` (`late_majors`: the majors of the last passes when not converged, else `[]`)."*

Then: if `decision_needed` is non-empty → stop (rule 1) and present each item by its practical
effect with the proposed default. If the result is not `converged`, record each `late_majors`
area in the digest as a **ref to fix upstream** (real majors late mean the refs are unclear,
methodology § Autopilot); any with `spec_or_spine_intent` → stop (rule 1), the rest continue.
Else commit the ticket and its review log (the WIP commits stay as they are, no squash):
`docs(tickets): harden ticket <ref> with a <n>-pass review loop`.

### Step B — build

Check the tree is clean. Prompt: *"Run the bmad-build-auto skill on ticket `<ref>`
(`T`). Result JSON: `{"plan": "<plan path>", "status": "<plan frontmatter status>",
"blocking_condition": "..."|null, "commits": ["<sha> <subject>", ...]}`."*

Then read `P`'s frontmatter `status` yourself (the plan is the proof, not the JSON). Not `built`
→ stop (rule 2), explaining the blocking condition and `## Auto Run Result` in plain words.

### Step C — code review loop

Let `B` = the commit before the build's first commit (the Step A commit or the previous HEAD);
the build's commits are listed in the Step B JSON and `P`.

Depth by risk: read `P`'s internal review (its Review Triage Log / Code Review section and
frontmatter `deferred`), e.g. with `grep -nE 'high|medium' "$P"`, not the whole plan. If no high
or medium finding was left unresolved (every one patched, or triaged false or rejected; none
deferred or open), run at **quick** depth; otherwise **thorough**. Record the depth in the digest.

If `L` exists without `## Result`, this is a resume: add *"The review log is partial: resume it
with the review-loop skill's resume rule; do not restart."* Prompt: *"Run the review-loop skill in
code mode on the commit range `B..HEAD` (the build's commits; exclude WIP review-pass commits of
this loop), with `P` as the intent (<depth>, max 7). Log to `L`. Checkpoint: after each pass's
fixes are written, commit them with `L` (not its git-ignored `.passes/`) as `fix(<area>): WIP code
review pass <n> (ticket <ref>)`; this is the one commit you may make. Result JSON: `{"result":
"converged"|"capped"|"diverging", "passes": n, "majors_per_pass": [..], "decision_needed":
[...as in Step A], "late_majors": [...as in Step A], "files_changed": ["..."], "test":
"pass"|"fail", "lint": "pass"|"fail", "check": "pass"|"fail"}`."*

Then: decision-needed → stop (rule 1); decision-needed items are never applied, and the
technical fixes so far sit in the WIP commits, say so. `late_majors` as in Step A. Otherwise
continue to Step D; any remaining fixes and the final log are committed there.

### Step D — verify and mark done

1. Free the dev and preview ports (`! ss -ltn 'sport = :5173' | grep -q 5173`, same for 4173);
   if taken, stop (rule 5). Run `npm run test:all` yourself (background, wait). Fail → stop
   (rule 3) with the failing test names.
2. If Step C left uncommitted code changes: commit them with the review log,
   `fix(<area>): code review loop fixes (ticket <ref>)`; if only the log (with its `## Result`)
   is uncommitted, commit it alone, `docs(review-loop): code review log (ticket <ref>)`; if the
   WIP commits already hold everything, commit nothing here.
3. Owner check other than reading the result → stop now (rule 4), ticket stays `built`.
4. `uv run _bmad/method/scripts/tickets.py mark <ref> done`, append the ticket's digest entry,
   and commit both: `docs(tickets): mark ticket <ref> done (autopilot)`.
5. If `stop-after` names this ref → stop (rule 6). Else next ticket.

## Digest entry (per ticket, plain language)

```
## <ref> <title> — done | built, waiting for you | stopped
What it adds: <one or two sentences a non-programmer understands>
Ticket review: <n> passes, <converged|capped|diverging>; nothing needed your input | <items>
Build: <built|blocked: reason in plain words>; commits <short shas>
Code review: <quick|thorough>, <n> passes, <converged|capped|diverging>; <k> fixes applied
Tests: all passing | <what failed>
Ref to fix upstream: <for a capped or diverging loop: area → doc and section; or "none">
Paused: <usage limit at <step>, reset <time as shown>, resumed at <time>; or omit the line>
Worth knowing: <deferred items, halts that nearly fired, anything capped — plain words, or "nothing">
```

## Final report

Tell the owner in plain language: tickets done this run, where it stopped and why, what (if
anything) they must decide or check — each choice with its practical effect — and the digest
path. Never report a ticket as done unless `tickets.py` shows it done and `test:all` passed.
