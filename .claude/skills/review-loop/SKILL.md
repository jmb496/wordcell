---
name: review-loop
description: Harden one document (story, ticket, spec, design) or one code change by looping fresh-context reviewer subagents and a separate fresh fixer subagent until no major findings remain or a pass cap is hit. Use when the user says "review loop", "harden this story/spec", "/review-loop <path>", or asks to iterate review until clean. Technical choices take the recommended default; only choices that change functionality, UX or gameplay are collected for the user, never auto-applied.
argument-hint: <path-or-target> [max=7] [depth=quick|thorough] [refs=path,path]
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
- **max** (default 7): pass cap, including the verify-only pass (step 3). Never exceed it.
- **depth** (default thorough): `quick` = 1 reviewer lens in docs mode, 2 in code mode;
  `thorough` = all lenses for the mode.
- **refs** (default: see below): documents reviewers judge the target against.
- **budget** (optional, docs mode): a stated growth budget in words, for a stub being fleshed
  out (e.g. a ticket entry of under ~300 words); replaces the 2.5x default below.

Default refs for this repo: `docs/game-flow-spec.md`, `docs/requirements-carryover.md`,
`CLAUDE.md`, plus `AGENTS.md`, the active `ARCHITECTURE-SPINE.md`, and the target's epic file when
they exist. Do not pass a ref that is the target itself.

## Severity and stopping rule

- **major**: a contradiction, an unspecified behaviour a builder would have to guess, a rule that
  cannot be tested as written, a constraint that makes the code untestable (e.g. mandated inline
  CI bash with "no script file"), a bug, a missing test for a stated rule, a violation of a ref.
  **From pass 4** only defects in shipped behaviour, in a gating check, or in the document's
  (ticket's) contract stay major.
- **minor**: wording, ordering, redundancy, style, an unlikely corner case with obvious handling;
  from pass 4 also precision in verify/evidence procedures and non-gating steps; and any
  addition once the document exceeds its growth budget (about 2.5x its pass-0 word count, or the
  stated `budget`; docs mode), where procedure detail belongs in the build's plan instead. Over
  budget, a minor still goes to the fixer only when its fix adds no words (reword, reorder, cut).
- **decision-needed**: fixing it requires intent the refs do not supply **and** the choice
  changes what the product does or how it plays: functionality scope, UX (what the player sees,
  hears or can do) or gameplay (rules, scoring, the deal). These are never fixed by the loop; they
  go to the user, phrased by that practical impact, not by the technical mechanism.
- **Technical choices are not decision-needed.** When the refs leave open an implementation,
  tooling, test, build or internal-structure choice with no effect on functionality, UX or
  gameplay, the reviewer proposes a default, triage classes it major or minor by the rules above,
  and the fixer applies it. The user cannot judge these; never ask them. Mark each such item
  `default applied` in the log. When unsure whether a choice has practical impact, ask: would a
  player or the owner notice any difference in the product? If no, it is technical.

Stop (**converged**) when a pass yields **zero major** findings after triage, or when two
consecutive passes each yield **at most one** (that last major is recorded as open, not fixed,
and named in the result and the report; a caller's result JSON reports it as `open_major` with
`result` `converged`, never as `late_majors`, which belong to capped or diverging runs). Stop (**diverging**) when majors rise
pass-over-pass (e.g. 2 then 4): the refs are unclear, so name the ref or area to fix upstream
(spec, spine, CLAUDE.md) instead of fixing the document again. Otherwise stop at the cap: pass
`max` is always **verify-only** (quick depth, only the fix-diff lens, no new scope), so no fix goes
unreviewed; a major it finds is recorded as open, never fixed unreviewed. Decision-needed
findings do not block convergence; they are reported. Minors left at convergence or the cap are
not applied: list them in the result for the next build or loop.

## Procedure

1. **Resume or stage.** If the log (see Log) exists without `## Result`, resume: read its
   `State:` line and continue after the last complete step (`review` → fix; `fix` → verify;
   `done` → next pass), reusing the logged findings and pass copies. Otherwise stage.
   Docs: use the absolute path. Code: write the unified diff to `<passes>/pass0.diff` (include
   untracked files for `staged`/`diff`) and use that path. Record the pre-loop state
   (`git rev-parse HEAD` plus tree snapshot 0 (step 3e), or a copy of the document at
   `<passes>/pass0.md` plus its `wc -w`) so the log can show the delta. `<passes>` is the log's path minus `.md` plus `.passes/`, beside
   the log, never session scratch or `/tmp`, so an interrupted run can resume.
2. **Choose lenses** from `references/lenses.md` for the mode and depth. From pass 2 the
   **fix diff** lens (the pass N−1 fix diff plus the prior Applied lists) replaces the first
   lens at `thorough` and is added at `quick`; the other lenses stay full-target.
3. **Pass N (N = 1..max; pass `max` verify-only):**
   a. **Review.** Launch one `general-purpose` subagent per lens **in parallel, in a single
      message**. Build each prompt from `references/reviewer-prompt.md`: lens instruction, the
      target path, the ref paths, a one-line target context (what the target is for and its
      stage, e.g. "stub ticket being fleshed out before build"), the severity definitions for
      pass N, and the output contract.
      Subagents read files themselves; never paste the artifact into the prompt.
   b. **Triage.** Merge all findings. For each, open the target at the cited location and verify
      it is real; drop disproved ones and duplicates (keep the clearer wording). Reclassify
      severity if a reviewer over- or under-stated it. Anything whose fix needs intent the refs
      do not give becomes decision-needed only when it changes functionality, UX or gameplay;
      a purely technical one keeps its major/minor class with the reviewer's default as the fix
      (`default applied`). Reclassify reviewer-labelled decision-needed items the same way.
   c. **Check the stopping rule.** Converged, diverging, or pass `max` → go to step 4.
   d. **Fix.** Launch **one** new `general-purpose` subagent with the prompt in
      `references/fixer-prompt.md`: the target path, the accepted major *and* minor findings as
      a numbered list, the refs, and the rules (minimal edits; preserve ids such as R-xx/Q-xx;
      never resolve decision-needed items; in docs mode append each decision-needed item to the
      document's open-questions table marked `PROPOSED BY REVIEW` with a proposed default, or,
      when the document has no such table (e.g. a ticket), leave it only in the log; in code
      mode run `npm test` and `npm run lint` and `npm run check` before returning and report their
      output; in both modes run any literal command, config value or version-dependent tool
      claim a fix touches against the pinned tool, or mark it `unverified`; a design statement
      that is not a runnable command needs neither). It returns a change summary.
   e. **Verify the fix landed.** Save the new pass copy (`<passes>/passN.md`; code mode a tree
      snapshot, `GIT_INDEX_FILE=<passes>/index sh -c 'git read-tree HEAD && git add -A && git
      write-tree'`, id in the log, and the restaged full diff `<passes>/passN.diff` as the next
      target) and the fix diff (`<passes>/passN.fix.diff`: `diff -u` of the copies, or
      `git diff <tree N−1> <tree N> -- . ':(exclude)<log dir>'`). Code: run the three
      commands yourself; a failing suite is a major finding for the next pass. A fix touching a
      command, config value or tool claim counts as fixed only if the fixer ran it or marked it
      `unverified`; otherwise it is a major for the next pass.
   f. **Log the pass** (see Log): write the pass header and triaged findings after b
      (`State: pass N: review`), the fixer's outcome after d (`fix`), the snapshot after e
      (`done`).
4. **Report** to the user: passes run, converged or capped, counts per pass, the decision-needed
   list (functionality/UX/gameplay only) with each proposed default and its practical effect in
   plain words, a one-line count of technical defaults applied, any open major, the unapplied
   minors, word count start → end (docs), where the log is, and (code mode) the final
   test/lint/check status: run the three commands at the final state yourself if no fix pass
   ran them. If capped or
   diverging, say which majors persisted or rose and name the ref or area to fix upstream.

Never edit the target yourself, never skip triage, never apply a decision-needed item, and never
run more than `max` passes. Do not commit, except the per-pass checkpoint commits a caller asks
for; a run that converges with no fix pass leaves the log uncommitted for the caller.

## Log

Docs mode: `<target-dir>/<target-basename>.review-log.md`. Code mode:
`_bmad-output/implementation-artifacts/review-loop/<slug>.md`. Under its title line the log keeps the
checkpoint `State: pass N: review|fix|done`, rewritten after each step. Append per pass:

```
## Pass N — <date time>
Reviewers: <lenses>  |  Findings: major X, minor Y, decision-needed Z  |  Dropped in triage: W
Words (docs): <after fix> (<ratio> x pass 0)  |  Snapshot: <passes>/passN.md or tree <id>
### Applied
- [major] <location> — <one line> → fixer item <n>
### Default applied (technical)
- <location> — <choice> → <default taken>
### Decision needed (functionality / UX / gameplay)
- <location> — <question, in terms of what the player or owner would notice> — proposed default: <…>
### Dropped
- <one line each, with why>
```

Finish with `## Result — converged after N passes` (plus `open major: …` when one is), `## Result — diverging at pass N (fix <ref>)`
or `## Result — capped at N passes (open majors: …)`, then the unapplied minors.
