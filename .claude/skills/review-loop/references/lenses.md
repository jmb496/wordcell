# Lenses

Each lens is one reviewer subagent. `quick` depth runs only the first lens listed for the mode.

## Docs mode (stories, tickets, specs, design docs)

1. **Builder's reading** — You must implement this document exactly as written. List every place
   you would have to guess, every term used before it is defined, every rule that conflicts with
   another rule or with a ref, and every acceptance criterion that cannot be turned into a test.
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
