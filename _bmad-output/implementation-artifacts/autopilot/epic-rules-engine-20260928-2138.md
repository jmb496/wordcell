# Epic autopilot — epic-rules-engine (20260928-2138)

Epic: epic-rules-engine (epic 2, Rules engine). Branch: epic-2-engine. Start commit: 906264e.
Authorisation: owner, 2026-09-28 (methodology § Autopilot; invocation prompt of this session). Local commits only; never push; main untouched.
Working dir: /tmp/wordcell-autopilot/20260928-2138

## Setup notes
- The epic file's frontmatter `after: [epic-scaffold-ci-deploy]` gated every ticket, because epic 1's container has no `done` status; reverted to `after: []` (entry 2.1 already waits on 1.10, and the initiative entry keeps the needs line).
- Step A refs use the epic's rule-coverage.md in place of delta-checks.md (epic 2's spec has no delta-checks.md).
