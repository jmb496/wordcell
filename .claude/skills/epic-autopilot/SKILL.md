---
name: epic-autopilot
description: Work through the remaining tickets of one epic unattended — harden each ticket with /review-loop, build it with bmad-build-auto, code-review it with /review-loop, verify, mark it done and continue — stopping only when the owner's input is needed. Use when the user says "autopilot", "run the epic", "work through the epic", or "/epic-autopilot".
argument-hint: "[epic folder name] [stop-after=<ref>] [one-ticket]"
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

## One ticket per session (fresh context, preferred)

An orchestrator that runs many tickets carries every earlier ticket in its context, and each turn
re-reads it (epic 3: about 420k tokens per turn, 9M wasted). So the preferred way to run an epic
is one fresh orchestrator session per ticket, started by the driver:

```bash
.claude/skills/epic-autopilot/scripts/loop.sh <epic> [max-tickets]
```

The driver runs `claude -p "Run the epic-autopilot skill with arguments: <epic> one-ticket"` once
per ticket and continues while each session's handoff says `outcome: done`. It exits 0 when the
epic is complete (or max-tickets is reached), 2 when a session stopped (read the handoff), 3 on a
usage limit (rerun after the reset), 4 when a session made no progress (read its log). Before
each ticket it runs `scripts/limits.py`, which reads the plan's 5-hour and weekly utilization
from the local cache of the owner's "Claude Code Usage" VS Code extension (no network call), and
exits 5, asking the owner to rerun it by hand, when either is at or over its threshold
(`MAX_FIVE_HOUR`, `MAX_SEVEN_DAY`, default 80); 6 if the cache is missing or more than 30 minutes
old, i.e. VS Code is closed (`LIMIT_CHECK=off` skips the check). The owner can run it in a
terminal, or an interactive session can run it with `run_in_background: true`, relay its
progress lines (Watching progress, below) and report the handoff when it exits. After answering
an owner question in an interactive session, record the decision (ticket Notes, epic Notes, spec
memlog), commit, and rerun the driver: the next session resumes the ticket from its files.

With the argument `one-ticket` (always headless):

- Setup runs as below, except Setup 3 reuses the newest digest of this epic whenever it has no
  `## Run complete` (whatever its last section), so all sessions of one run share `R`, `W` and
  the digest. Record the session start time `S` (`date -u +%Y-%m-%dT%H:%M:%S`).
- Process exactly one ticket: the first `ready_to_start` one, or the one an earlier session left
  part-way (Per ticket, resume rule). After Step D.4 (or at any stop), write the handoff and end.
- A headless session does not wait for its own background jobs, so never use
  `run_in_background` here. Start every headless step and `npm run test:all` detached, then wait
  in the foreground (Bash `timeout: 600000`), repeating the wait while it prints `not yet`; on
  `died` (the step's process is gone without an exit code) stop as for a missing result file
  (rule 5):

  ```bash
  .claude/skills/epic-autopilot/scripts/detach.sh "$W/<ref>-<step>.done" "$W/<ref>-<step>.log" -- claude -p "<prompt>" --permission-mode bypassPermissions --output-format text
  .claude/skills/epic-autopilot/scripts/wait-for.sh "$W/<ref>-<step>.done" 540
  ```

  (`detach.sh` closes stdin and keeps `<done-file>.pid` while the step runs; for `test:all` the
  command is `npm run test:all` and the done file holds its exit code.) Before Setup 2, if any
  `.autopilot/*/*.pid` names a live process (a step an earlier session left running), stop
  (rule 5) and name it; never start a second copy.
- Handoff (committed, overwritten each session):
  `_bmad-output/implementation-artifacts/autopilot/<epic>-handoff.md`, starting with these lines,
  then the plain-language report for the owner (Final report) and how to resume:

  ```
  outcome: done | stopped | complete
  ticket: <ref>
  reason: <stop rule number and short reason, or "done">
  next: <next ready ref, or none>
  updated: <date -u +%Y-%m-%dT%H:%M:%SZ>
  summary: <one plain sentence>
  ```

  The report includes the run's **Close-out docs** (Step D.4); when the outcome is `complete`,
  list them all, since the retrospective applies them.
  `complete` when no tickets remain after this one (Stop rule 6); then also append
  `## Run complete` to the digest, with a `Close-out docs:` section gathering every ticket's
  entries. Commit both with the ticket's "mark done" commit, or with the
  stop commit. A stop for a usage limit puts `usage limit` in `reason:` (with the reset time) so
  the driver reports it as one.
- The digest entry gets a `Tokens:` line from
  `python3 .claude/skills/epic-autopilot/scripts/usage-report.py --since <S>` (this session and
  its steps).

### Watching progress

While a session runs, the driver prints a progress line whenever a step starts or finishes (with
the step's result summary: passes, majors, built or blocked, decisions for the owner) and for
each new commit (e.g. each review pass's WIP commit). It reads only the run directory and git
(polling every `PROGRESS_SECS`, default 15), so no orchestrator or step context grows. The build
step prints nothing between its start and finish (it does not commit until it is built).

```
[13:02]   3.12 ticket review: started
[13:28]   3.12 ticket review: finished (exit 0) — converged; 7 passes; majors 8, 5, 4, 3, 3, 2, 0
[13:28]   3.12 build: started
[14:36]   commit dcf317d refactor(epic-3): refactor sweep and shared Playwright config (3.12)
```

When the owner asks how to run the driver and see this detail, offer both ways:

1. **In the owner's Claude Code session (default).** Start the driver with the Bash tool and
   `run_in_background: true`; the result names its output file. Then load the Monitor tool
   (`ToolSearch` `select:Monitor`) and watch that output file, so each new line wakes the
   session; relay each progress line to the owner as one short line (started/finished lines
   always; commit lines may be grouped). The lines cost only the interactive session's context.
   When the driver exits, read its last lines and the handoff and report as above.
2. **A separate terminal (live, no context cost).** The owner runs
   `.claude/skills/epic-autopilot/scripts/loop.sh <epic>` in a terminal and tells the session
   when it exits; or, when the session started the driver, follows it with
   `tail -f <output file>`, using the output file path the session gives them.

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
   it, leave it `built` (not `done`), and stop so the owner can check. The same path applies to a
   `hitl` ticket the owner authorised for this run whose only hitl part is that final check: run
   Steps A–C and D.1–2, leave it `built`, and stop.
5. The working tree is dirty or not on the epic's branch when a ticket starts, a headless step
   hit a usage or session limit (see Usage limits), a headless step exits without writing its
   result file, or any command here fails unexpectedly.
6. `stop-after=<ref>` was given and that ticket is done, or no tickets remain. Then the
   recommended next step is: run `/bmad-retrospective`, apply its owner-approved doc fixes
   (including the run's Close-out docs), and mark the epic container done with
   `bmad-preview-ticketing` once its verdict is accepted, so a later epic whose `after` names it
   is not gated (Setup 5).

Everything else — technical defaults, a review loop capped at 7 passes or stopped on its trend
after applying its fixes (its late-major area recorded as a ref to fix upstream), deferred
items — is recorded in the digest and the run continues.

## Setup (once per run)

1. Resolve the epic: the argument, else the epic of the first `ready_to_start` ticket from
   `uv run _bmad/method/scripts/tickets.py next`. Read the epic file's branch decision
   (e.g. "epic branch `epic-1-scaffold`").
2. Check: `git status --short` empty and `git branch --show-current` is the epic branch.
   Otherwise stop (rule 5). One exception: when the digest's last section is
   `## Stopped — usage limit` at Step B and the uncommitted files are that build's own (its plan
   `P` is `in-progress`), continue and resume Step B, adding to its prompt: *"This is a resume: a
   previous build of this ticket stopped at a usage limit with its plan `in-progress` and its
   uncommitted work in the tree (those files are this build's own); resume it per
   bmad-build-auto's resume rule."*
3. Run id `R` = `YYYYMMDD-HHMM`. Working dir for step results, logs, done and pid files, in the
   git-ignored repo folder `.autopilot/` (it survives a reboot for the retro, and `git status
   --short` ignores it, so the tree stays clean for the build): `W=<repo root>/.autopilot/<R>`
   (absolute). Create it. The driver's lock and loop logs live in `.autopilot/` too.
   Resuming: if this epic's newest digest has no `## Run complete` and ends in a `## Stopped`
   section, reuse its `R`, `W` and digest (recreate `W` if it is gone) instead.
4. Digest (committed): `_bmad-output/implementation-artifacts/autopilot/<epic>-<R>.md`. Create it
   with a heading, the epic, branch, start commit and the owner authorisation line. It is written
   only between steps (never while a build runs) and committed with each "mark done" commit, and
   with the stop commit when a run stops before a ticket is done (`docs(autopilot): stopped at
   ticket <ref> step <step> (<reason>)`), so a rerun starts from a clean tree. Commit the new
   digest at once (`docs(autopilot): start run <R> (<epic>)`), since Step B needs a clean tree.
5. Gating: when `tickets.py next` offers this epic nothing although tickets remain, check the
   epic file's frontmatter `after`: an epic container carries no done status until
   `bmad-preview-ticketing` marks it done after its retrospective, so an `after` naming an epic
   not yet marked done holds every ticket. Stop (rule 5) and tell the owner which epic must be
   closed first; never edit `after` or a container's status yourself.

## Per ticket

Take the first `ready_to_start` ticket of this epic from `tickets.py next`. If its entry has no
file yet, run `uv run _bmad/method/scripts/tickets.py pull <epic folder> <id>` and commit the new
file (`docs(tickets): pull ticket <ref> (<title>)`) before Step A. Let `T` be its ticket
file (absolute), `ref` its ref (e.g. `1.4`), `P` its plan file path
(`<ticket basename>-plan.md` beside it, once the build creates it), and `L` its code review log
`_bmad-output/implementation-artifacts/review-loop/<ref with dots as dashes>-build.md` (ref `1.11`
→ `1-11-build.md`). If it is `hitl`, stop (rule 4) before doing anything, unless the owner
authorised it for this run and its only hitl part is the final check (rule 4).

A ticket an earlier run left part-way starts at the first unfinished step, judged from the files
alone: a ticket review log without a `## Result` line → Step A (resume); no `P`, or `P` status
`in-progress` → Step B; `P` `built` and `L` missing or without `## Result` → Step C (resume);
`L` with `## Result` → Step D. A "partial" log is one that exists without `## Result`: never
delete it, restart it or skip it.

Run every headless step with the Bash tool, `run_in_background: true`, from the repo root, and
wait for its completion notification (builds can take a long time; never poll with sleep). In
`one-ticket` mode use `detach.sh` and `wait-for.sh` instead (One ticket per session):

```bash
claude -p "<prompt>" --permission-mode bypassPermissions --output-format text < /dev/null > "$W/<ref>-<step>.log" 2>&1
```

Every step prompt ends with the result-file contract: *"When finished, write
`$W/<ref>-<step>.json` containing exactly one JSON object as specified, then stop. Do not
commit. Do not push. Do not ask questions: record anything that needs the owner in the JSON."*
After the process exits, check the log **first** for a usage limit (below), and only then the
JSON: missing or unparsable → stop (rule 5) and point the owner at the `.log`.

### Usage limits

A step hit a limit when its log matches `grep -iE 'hit your [a-z]+ limit'` (the message
reads e.g. `You've hit your session limit · resets 5:30am (America/New_York)` or `You've hit
your weekly limit · resets Sep 30, 4pm (America/New_York)`). This check runs
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
   In `one-ticket` mode, tell the owner to rerun `.claude/skills/epic-autopilot/scripts/loop.sh
   <epic>` instead, and skip item 5 (never schedule).
5. Optional, only when this orchestrator session offers a scheduling tool (e.g. `ScheduleWakeup`
   or `CronCreate`): schedule a one-off `/epic-autopilot <epic>` for about 5 minutes after the
   reset time instead of leaving the run idle, and tell the owner it is scheduled and for when.
   Without such a tool, just stop.

### Step A — harden the ticket (docs review loop)

Skip if the ticket already has a `<ticket>.review-log.md` with a `## Result` line. If that log
exists without one, this is a **resume**: add to the prompt *"The review log is partial: resume it
with the review-loop skill's resume rule; do not restart."*

Prompt: *"Run the review-loop skill on `T` (docs mode, thorough, max 7<, budget=1500 when `T` is a
stub under ~300 words>). <When the ticket's `tickets.toml` entry has extra keys `pull` does not
copy (e.g. `interface`, `tests`, `owns`): The ticket was pulled from entry <id> of `<tickets.toml
path>`, whose fields <names> were not copied; pass them to the reviewers and fixer as part of
the ticket's intent, and the fixer adds them to the Description in pass 1.> Refs: the epic's
SPEC.md and every companion its `companions:` frontmatter lists inside the spec folder
(`_bmad-output/specs/<epic spec>/`, e.g. build-notes.md, rule-coverage.md), the epic file, ARCHITECTURE-SPINE.md, AGENTS.md, and the plans of this epic's done tickets for continuity.
Checkpoint: after each pass's fixes are written (and its state line updated), commit only `T` and its
review log (the loop's `.passes/` copies are git-ignored), as `docs(tickets): WIP review pass <n> ticket
<ref>`; this is the one commit you may make. Result JSON: `{"result":
"converged"|"capped"|"diverging", "passes": n, "majors_per_pass": [..], "decision_needed":
[{"location": "...", "question": "...", "proposed_default": "...", "practical_effect": "..."}],
"late_majors": [{"area": "...", "ref_to_fix": "<doc and section>", "spec_or_spine_intent":
true|false}], "open_major": "..."|null}` (`late_majors`: the majors of the last passes when not
converged, else `[]`; `open_major`: the major a converged run recorded as open, else `null`)."*

Then: if `decision_needed` is non-empty → stop (rule 1) and present each item by its practical
effect with the proposed default. If the result is not `converged`, record each `late_majors`
area in the digest as a **ref to fix upstream** (real majors late mean the refs are unclear,
methodology § Autopilot); any with `spec_or_spine_intent` → stop (rule 1), the rest continue.
Else commit the ticket and its review log (the WIP commits stay as they are, no squash):
`docs(tickets): harden ticket <ref> with a <n>-pass review loop`.

### Step B — build

Check the tree is clean. Prompt: *"Run the bmad-build-auto skill on ticket `<ref>`
(`T`). <If the ticket review log records an open major or unapplied minors: The ticket's review
log `<log path>` leaves these for the build; resolve each in the plan or record why not: <open
major and minors, one per line>.> Result JSON: `{"plan": "<plan path>", "status": "<plan frontmatter status>",
"blocking_condition": "..."|null, "commits": ["<sha> <subject>", ...]}`."*

Then read `P`'s frontmatter `status` yourself (the plan is the proof, not the JSON). Not `built`
→ stop (rule 2), explaining the blocking condition and `## Auto Run Result` in plain words.

### Step C — code review loop

Let `B` = the commit before the build's first commit (the Step A commit or the previous HEAD);
the build's commits are listed in the Step B JSON and `P`.

Depth by risk: read `P`'s internal review (its Review Triage Log / Code Review section and
frontmatter `deferred`), e.g. with `grep -nE 'high|medium' "$P"`, not the whole plan. If no high
or medium finding was left unresolved (every one patched, or triaged false or rejected; none
deferred or open) and the ticket's `tickets.toml` `risk` is not `"medium"` or higher, run at **quick** depth;
otherwise **thorough**. Record the depth in the digest.

If `L` exists without `## Result`, this is a resume: add *"The review log is partial: resume it
with the review-loop skill's resume rule; do not restart."* Prompt: *"Run the review-loop skill in
code mode on the commit range `B..HEAD` (the build's commits; exclude WIP review-pass commits of
this loop), with `P` as the intent (<depth>, max 7). Log to `L`. Checkpoint: after each pass's
fixes are written, commit them with `L` (not its git-ignored `.passes/`) as `fix(<area>): WIP code
review pass <n> (ticket <ref>)`; this is the one commit you may make. Result JSON: `{"result":
"converged"|"capped"|"diverging", "passes": n, "majors_per_pass": [..], "decision_needed":
[...as in Step A], "late_majors": [...as in Step A], "files_changed": ["..."], "test":
"pass"|"fail", "lint": "pass"|"fail", "check": "pass"|"fail", "open_major": "..."|null}`."*

Then: decision-needed → stop (rule 1); decision-needed items are never applied, and the
technical fixes so far sit in the WIP commits, say so. `late_majors` as in Step A. A `converged`
result with `open_major` set (the review-loop's "two passes with at most one major" stop) is
not a failure: record the open major in the digest's Worth knowing as an open item carried to
the epic's refactor sweep or a follow-up ticket, and continue; stop (rule 1) only when it is
spec or spine intent. Otherwise continue to Step D; any remaining fixes and the final log are
committed there.

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
   and commit both: `docs(tickets): mark ticket <ref> done (autopilot)`. **Close-out docs:** for
   every owner decision made for this ticket during the run (an answered decision-needed item,
   a question answered between sessions, a decision recorded in the ticket, epic Notes or spec
   memlog), list each owner doc whose text it changes or contradicts: `docs/game-flow-spec.md`,
   ARCHITECTURE-SPINE.md, DESIGN.md, EXPERIENCE.md, the epic's SPEC.md (or a companion). One
   line per doc and section, with the decision and its date, in the digest entry and the
   handoff. Do not edit those docs: they are the owner's and are applied at the retro.
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
Tokens: <usage-report.py line, one-ticket mode; or omit the line>
Worth knowing: <deferred items, halts that nearly fired, anything capped — plain words, or "nothing">
Close-out docs: <doc § section ← decision (owner, date), one per line; or "none">
```

## Final report

Tell the owner in plain language: tickets done this run, where it stopped and why, what (if
anything) they must decide or check — each choice with its practical effect — the Close-out docs
gathered so far (Step D.4), and the digest path. When the epic is complete, the recommended next
step is the retrospective, then applying its owner-approved doc fixes, then marking the epic done
(Stop rule 6). Never report a ticket as done unless `tickets.py` shows it done and `test:all` passed.
