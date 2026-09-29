# Lenses

Each lens is one reviewer subagent. `quick` depth runs only the first lens listed for docs mode,
and lenses 1 and 3 (correctness, verification gap) for code mode.
From pass 2 the fix-diff lens (end of file) replaces the first lens (`thorough`) or joins it
(`quick`); the verify-only last pass runs it alone.

## Docs mode (stories, tickets, specs, design docs)

1. **Builder's reading** — You must implement this document exactly as written. List every place
   you would have to guess, every term used before it is defined, every rule that conflicts with
   another rule or with a ref, every acceptance criterion that cannot be turned into a test, and
   every constraint that would make the code untestable (e.g. inline CI bash, "no script file").
2. **Edge-case hunter** — Trace the behaviour the document defines. For each rule, construct
   inputs at the boundaries (empty, one, maximum, same-as-source, already-used, longer-than-10,
   the QU card) and report where the document's answer is missing or ambiguous.
3. **Adversarial** — Assume the document is wrong somewhere. Find at least ten concrete
   weaknesses: hidden assumptions, rules that are true only in the worked example, scoring or
   ordering statements that could be read two ways, dependencies on undefined UI behaviour.
   Then mark which of the ten are real majors versus stretch findings.
4. **Ref alignment** — Compare the document against each ref. Report every contradiction, every
   requirement in a ref that the document silently drops, and every decision the document makes
   that a ref reserves for the user (in this repo: the Q-xx table and CLAUDE.md rules).

## Code mode (a diff, branch, or ticket implementation)

1. **Correctness** — Read the diff as the code it changes. Find bugs, unhandled states,
   off-by-ones, mutation of engine state outside the engine, non-determinism (Math.random,
   Date.now, timers) in `src/engine/`.
2. **Edge cases** — Same boundaries as docs lens 2, applied to the code paths.
3. **Verification gap** — For each rule id (R-xx) the ticket or plan claims, find the test that
   proves it; report rules with no test, tests that do not exercise the claimed rule, and
   assertions that would pass on a wrong implementation.
4. **Intent alignment** — Compare the diff with the ticket/plan and the refs. Report scope the
   diff added or dropped, architecture-rule violations (engine purity, thin UI, hand-rolled DnD,
   no fallbacks), and behaviour that resolves a Q-xx question the user has not answered.

## Both modes, from pass 2

- **Fix diff** — Read only the last fix diff (`<passes>/passN.fix.diff`) and the prior passes'
  Applied lists in the log, opening the target only for context. Report each Applied finding
  the diff did not actually resolve, each edit that contradicts or undoes an earlier Applied
  fix or a ref, each new defect the diff introduced, and each changed command, config value or
  tool claim that was not run against the pinned tool or marked `unverified`.
