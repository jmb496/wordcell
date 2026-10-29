---
id: 5
type: story
title: "Close-out: documents and device read"
parent: epic-place-preview
covers: [E8]
after: [1, 2, 3, 4]
hitl: true
risk: low
---

# Close-out: documents and device read

## Description

Brings the spec, EXPERIENCE.md, DESIGN.md and the spine (AD-3, AD-14) in line with what entries 1–4 built, then hands Jared the build for an Android read with `node scripts/device-preview.mjs <entry 2's Place fixture>` (docs/device-testing.md): retarget, reorder, a used non-target cell, Undo and Redo, Confirm's fly-to-cell, and whether the `★` mark reads as subtle.

## Acceptance Criteria

Verify: No document contradicts the build, `SESSION_VERSION`, `HISTORY_VERSION` and the Session and history shapes are unchanged, `npm run test:all` and `npm run test:screens` are green, and Jared records his Android read (and any change he asks for, as a new entry) in the epic Notes.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-place-preview/epic-place-preview.md
- constraint — docs/device-testing.md; docs/development-methodology.md, Definition of done

## Document check (2026-10-29)

Checked the spec, EXPERIENCE.md, DESIGN.md and the spine against entries 1–4 as built (HEAD `0e30a01`) and the owner decisions in the epic Notes.

- `docs/game-flow-spec.md`: no change. R-33, R-50, §7.4 and Q-49 match the build; the spec says nothing about the fly-in.
- DESIGN.md, Components → WordCell:
  - the committed cards that are not the top hide together at the last landing (F28), not "on landing";
  - a two-digit count badge draws above the `★` pill where they meet at 360 px (owner, 2026-10-28);
  - from Confirm or a Redo that commits, the fly-in base is a copy of the previewed top without the `★`, and the landed cards stack over it (owner, 2026-10-28).
- DESIGN.md, contrast floors: accent orange on surface raised (the `★`) ≥ 3:1, Charcoal 5.0:1, as `src/ui/theme/contrast.test.ts` pins.
- EXPERIENCE.md, How to play scenes: the Place scene previews the target's top with the `★` and no count badge (owner, 2026-10-29).
- Spine AD-14:
  - the fly-in base is a `preview` mirror of the new top without the `★`;
  - the non-top committed cards hide together at the last landing (F28);
  - the mirror look list notes the fly-in base.
- Spine AD-3 `preview`: no change (matches `{ top, count }` as built).
- `SESSION_VERSION` 1 and `HISTORY_VERSION` 1 are unchanged, and the Session and history shapes are unchanged (`src/engine/session.ts`, `history.ts`, `serialize.ts` are untouched since `6534769`). The only fixture changes: `how-to-play-place.json` gains its `previews` entries, and `session-place-used-cells.json` is new.
- Not edited: epic 5 SPEC F28's "previous top" clause. That is a closed epic's record; DESIGN.md and AD-14 now say Q-49 replaces it.
- Tests: `npm test` green after the edits (3638). `test:all` and `test:screens` were green at ticket 11.4's close (the first `test:all` hit the known `nav.spec.ts:163` double-tap load flake; the rerun was green).

Device read: `node scripts/device-preview.mjs session-place-used-cells`. Jared's read is recorded in the epic Notes.
