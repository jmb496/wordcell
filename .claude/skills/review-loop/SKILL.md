---
name: review-loop
description: Harden one document (story, ticket, spec, design) or one code change by looping fresh-context reviewer subagents and a separate fresh fixer subagent until no major findings remain or a pass cap is hit. Use when the user says "review loop", "harden this story/spec", "/review-loop <path>", or asks to iterate review until clean. Decisions that need human intent are collected, never auto-applied.
argument-hint: <path-or-target> [max=4] [depth=quick|thorough] [refs=path,path]
---

# Review Loop

Converge one artifact through repeated independent review and repair. Every reviewer and every
fixer is a **new subagent with an empty context**: it knows only what its prompt gives it, so it
cannot inherit the author's blind spots or this conversation's assumptions. You are the
orchestrator: you never review or fix the artifact yourself.

## Inputs

- **target** (required): a file path (story, ticket file, spec, DESIGN.md, plan) → *docs* mode;
  or a code target (`diff`, `staged`, a branch name, a commit range, a ticket plan whose diff can
  be derived) → *code* mode. When a ticket plan is given in code mode, the plan is also the intent.
- **max** (default 4): pass cap. Never exceed it.
- **depth** (default thorough): `quick` = 1 reviewer lens; `thorough` = all lenses for the mode.
- **refs** (default: see below): documents reviewers judge the target against.

Default refs for this repo: `docs/game-flow-spec.md`, `docs/requirements-carryover.md`,
`CLAUDE.md`, plus `AGENTS.md`, the active `ARCHITECTURE-SPINE.md`, and the target's epic file when
they exist. Do not pass a ref that is the target itself.

## Severity and stopping rule

- **major**: a contradiction, an unspecified behaviour a builder would have to guess, a rule that
  cannot be tested as written, a bug, a missing test for a stated rule, a violation of a ref.
- **minor**: wording, ordering, redundancy, style, an unlikely corner case with obvious handling.
- **decision-needed**: fixing it requires intent the refs do not supply (e.g. a game-design
  choice). These are never fixed by the loop; they go to the user.

Stop when a pass yields **zero major** findings after triage, or when `max` passes have run.
Decision-needed findings do not block convergence; they are reported.

## Procedure

1. **Stage the target.** Docs: use the absolute path. Code: write the unified diff to
   `{scratchpad}/review-loop/<slug>.diff` (include untracked files for `staged`/`diff`) and use
   that path. Record the pre-loop state (`git rev-parse HEAD`, or a copy of the document at
   `{scratchpad}/review-loop/<slug>.pass0.md`) so the log can show the delta.
2. **Choose lenses** from `references/lenses.md` for the mode and depth.
3. **Pass N (N = 1..max):**
   a. **Review.** Launch one `general-purpose` subagent per lens **in parallel, in a single
      message**. Build each prompt from `references/reviewer-prompt.md`: lens instruction, the
      target path, the ref paths, the severity definitions, and the output contract. Subagents
      read files themselves; never paste the artifact into the prompt.
   b. **Triage.** Merge all findings. For each, open the target at the cited location and verify
      it is real; drop disproved ones and duplicates (keep the clearer wording). Reclassify
      severity if a reviewer over- or under-stated it. Anything whose fix needs intent the refs
      do not give becomes decision-needed.
   c. **Check the stopping rule.** If zero major remain → go to step 4.
   d. **Fix.** Launch **one** new `general-purpose` subagent with the prompt in
      `references/fixer-prompt.md`: the target path, the accepted major *and* minor findings as
      a numbered list, the refs, and the rules (minimal edits; preserve ids such as R-xx/Q-xx;
      never resolve decision-needed items; in docs mode append each decision-needed item to the
      document's open-questions table marked `PROPOSED BY REVIEW` with a proposed default; in code
      mode run `npm test` and `npm run lint` and `npm run check` before returning and report their
      output). It returns a change summary.
   e. **Verify the fix landed.** Docs: diff the file against the previous pass copy. Code: run
      the three commands yourself; a failing suite is a major finding for the next pass.
   f. **Log the pass** (see Log).
4. **Report** to the user: passes run, converged or capped, counts per pass, the decision-needed
   list with each proposed default, where the log is, and (code mode) the final test/lint status.
   If capped without convergence, say which majors persisted; three passes of real majors usually
   mean the refs are unclear, so name the ref to fix.

Never edit the target yourself, never skip triage, never apply a decision-needed item, and never
run more than `max` passes. Do not commit.

## Log

Docs mode: `<target-dir>/<target-basename>.review-log.md`. Code mode:
`_bmad-output/implementation-artifacts/review-loop/<slug>.md`. Append per pass:

```
## Pass N — <date time>
Reviewers: <lenses>  |  Findings: major X, minor Y, decision-needed Z  |  Dropped in triage: W
### Applied
- [major] <location> — <one line> → <what the fixer did>
### Decision needed
- <location> — <question> — proposed default: <…>
### Dropped
- <one line each, with why>
```

Finish with `## Result — converged after N passes` or `## Result — capped at N passes`.
