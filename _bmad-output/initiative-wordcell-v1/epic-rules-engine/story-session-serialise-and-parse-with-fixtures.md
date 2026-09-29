---
id: 10
type: story
title: "Session serialise and parse with fixtures"
parent: epic-rules-engine
covers: [CAP-9]
after: [9]
risk: medium
---

# Session serialise and parse with fixtures

## Description

Adds serializeSession and parseSession (JSON parse, version checks, the §2 schema stage, then replay with checkSession), SESSION_VERSION = 1, the valid round-trip fixtures in root fixtures/ generated once through public apply, and one rejecting session-invalid-<check>.json per schema case, AD-7 check and violable replay check; null/[] fixture tests assert only version-unreadable (review-log minor); the won fixture comes from entry 6's helper.

## Acceptance Criteria

Verify: npm run test:all is green with every round-trip fixture deep-equal after parse, every rejecting fixture giving replay-failed with its version plus the unique check code from the stage run directly, version-unknown and the inline unparseable and primitive-root cases giving their reasons, and a schema-valid replay-invalid Session making apply and view throw while parseSession returns replay-failed.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine.md
- spec — _bmad-output/specs/spec-epic-2-rules-engine/build-notes.md, CAP-9 Serialise and parse

## Notes

- Open question: Whether the architecture test's fixtures/<name>.json rule and the engine tsconfig accept the JSON imports without a config change.
