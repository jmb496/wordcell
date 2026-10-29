---
epic: epic-place-preview
date: 2026-10-29
verdict: accepted-with-open-items
criteria: declared
headless: false
---

# Epic 11 retrospective: Place preview of WordCell tops (Q-49)

## Epic summary

Epic 11, `epic-place-preview` (owner decision Q-49, 2026-10-25), on branch `place-preview` cut from `main` at `d5015e5`. Run interactively at Jared's request after 11.6 (autopilot prompt: "After 11.6: run `/bmad-retrospective` on the epic and stop"); no going-in concerns were asked for, since the prompt asked for the retro and a stop.

**Tickets** (`tickets.py status`, build order); all six `done`, none at `built`, `pending_tickets` empty:

| Ref | Title | State | Plan range (baseline → next baseline) | Commits |
| --- | --- | --- | --- | --- |
| 11.1 | Engine place preview on CellView | done | `4528211..09b2af2` | 13 |
| 11.2 | WordCell row place preview | done | `09b2af2..136527c` | 13 |
| 11.3 | Fly-to-cell keeps the previewed top | done | `136527c..8cd6b84` | 9 |
| 11.4 | How to play Place scene preview | done | `8cd6b84..5a86a03` (shared with 11.5) | 14 |
| 11.5 | Close-out: documents and device read (hitl) | done | no `baseline_revision` (done by hand); its commits `d67b42a`, `5e3245d` sit inside 11.4's range | 2 |
| 11.6 | Refactor sweep | done | `5a86a03..d86f419` (HEAD, inferred) | 7 |

The docs commit `6534769` (Q-49 doc edits and the epic folder) precedes 11.1's baseline. Ranges begin at each plan's baseline, which follows that ticket's review-loop commits, so each range also carries the next ticket's ticket-review commits. No merges in any range (`merge_count` 0).

**Evidence inventory**
- Available: the epic file (Description, Requirements E1–E8, Done when 1–5, Boundaries, Notes with five owner decisions and the device read); six story files; five plans with baselines (11.5's plan is a status stub from `tickets.py mark`); `git_evidence.py` output per range; the autopilot digest `_bmad-output/implementation-artifacts/autopilot/epic-place-preview-20261028-1937.md` and handoff; per-step logs and review JSON under `.autopilot/20261028-1937/` and `.autopilot/loop-epic-place-preview-*` (git-ignored, local only); review-loop logs `_bmad-output/implementation-artifacts/review-loop/11-*`; the previous retrospective `epic-end-of-game-words/epic-end-of-game-words-retrospective.md`.
- Missing or partial: no build-session transcripts beyond the step logs (the step logs are the session record); 11.5 has no plan body or range of its own.
- Code churn (non-`_bmad-output`): 46 files, +2043 −305 over `4528211..HEAD` in `src`, `e2e`, `fixtures`; most of it tests (`e2e/place-preview.spec.ts` +664, `src/engine/view.test.ts` +250). Binary churn: 10 screenshot baseline revisions (unmeasured).

## Findings

Derived by two read-only sub-agents and then spot-checked against the primary source. One covered the aggregate views over `4528211..HEAD`; the other was a `bmad-review` pass (adversarial, edge-case and verification-gap lenses) over `git diff 4528211..HEAD -- src e2e fixtures`, weighted to the ticket boundaries. No dependency-graph tool was run: the architecture delta comes from the import lines of the changed files (narrowed scope). Pixel baselines were not inspected. Dispositions: **fix** (becomes an action item), **defer** (context kept), **accept** (recorded so later retros stop re-flagging it).

### Architecture delta

- **AD-1/AD-2 clean.** The only new non-test imports are `commitMove` in `src/engine/view.ts` (engine-internal) and `import type { CardId }` in `src/ui/WordCellRow.svelte:2`. There is no new `index.ts` export and no cross-layer edge. **Accept.**
- **AD-3 respected.** The preview comes from the engine's own commit, `src/engine/view.ts:213-229` (`commitMove(position, placed(draft))`), and the UI reads `cell.preview` (`WordCellRow.svelte:55-75`, `:121`). One older UI inference remains: `WordCellRow.svelte:58` takes the used card as the cell's top, because `CellView` does not name it. That assumption predates the epic (the Composing branch has the same `i === top && cell.used`). **Accept.**
- **AD-14 respected.** The new `preview` mirror kind carries `data-mirror-of` only (`Card.svelte:175-178`). `flip.ts` dropped its mirror map (net −16 lines), and `measure()` reads only `[data-card-id]`. **Accept.**

### Duplication map

- **D1. E2e preview helpers written three ways.** `place-preview.spec.ts:104` `expectPreviewMirror`, `place.spec.ts:262` `expectPreviewTarget`, `board-phases.spec.ts:360` `expectPreviewCell3`; `place-preview.spec.ts:132` `expectPreviewLive` vs `place.spec.ts:283` `expectPreviewBeneath`. `retarget`/`swap` repeat (`place-preview.spec.ts:86,93` vs `place.spec.ts:146,165`), as does the mirror-animation probe (`place-preview.spec.ts:37-61`, `:549-555`). 11.6 declined the fold (plan R6). **Defer** to the next ticket that touches these specs (A6).
- **D2. Scene `previews` type declared twice.** `engine/scene-replay.ts:92` and `ui/scenes/types.ts:67`. AD-2 forces this (the fixture type is not exported), and it follows the existing `columns` pattern. **Accept.**
- **D3. `★` pill CSS repeats the badge pill.** `Card.svelte:238` `.preview-mark` vs `.badge` `:266` and `.top-tag` `:228`. Declined in 11.6 (R9). **Accept.**

### Size growth

None of these is called a god file. `place-preview.spec.ts` (new) holds about 15 local helpers inside one `describe`; that is the reason for D1.

| File | Lines now | Growth this epic |
| --- | --- | --- |
| `src/ui/scenes/scenes.test.ts` | 2264 | +103 |
| `src/engine/view.test.ts` | 1468 | +252 (one new Q-49 `describe`, `:622-870`) |
| `src/ui/scenes/Scene.svelte` | 662 | +28 |
| `e2e/place-preview.spec.ts` | 644 | new, 20 tests |
| `src/ui/flip.ts` | 510 | net −16 |
| `src/ui/Card.svelte` | 389 | 2 new props |
| `src/ui/WordCellRow.svelte` | 222 | `shown()` now has preview and hold branches, `:53-101` |

### Pattern divergence

- Test names all lead with an id. The fly-to-cell tests lead with `AD-14` by recorded decision (11.3 review log, minor 11). New strings live only in `src/ui/text.ts:282-284`, and the `★` reuses `text.star`. No new `data-testid`, duration or colour literal. **Accept.**
- `place-preview.spec.ts` defines its helpers inside the `describe`, whereas `place.spec.ts` keeps them at module level. This is part of D1. **Defer** (A6).

### Spec-to-implementation reconciliation

- **E1–E8 all implemented and tested.**
  - E1: `view.ts:189,213-229`; `view.test.ts:647-807`.
  - E2: `WordCellRow.svelte:55-75`; `place-preview.spec.ts:207,224,307,322,356,372`.
  - E3: `place-preview.spec.ts:282,299,470,497`.
  - E4: names in `text.ts:282-284`, tested in `labels.test.ts:176-217` and `screen-reader.spec.ts:309-311`; star and 35 % dim in `place-preview.spec.ts:603`.
  - E5: `place-preview.spec.ts:421-457,470,517,526`.
  - E6: `WordCellRow.svelte:87-98`; `fly-to-cell.spec.ts` (8 tests); `★` gone at commit `place-preview.spec.ts:633`.
  - E7: `Scene.svelte:176-186`, `scenes/place.ts:41-64`; `how-to-play.spec.ts`; screenshot `how-to-play-scene-3-frame-4`.
  - E8: digest § 11.6, the device read and the documents check (11.5, `d67b42a`).
- **Recorded owner deviations** (epic Notes): no count badge in the scene (E7, 2026-10-29); the fly-in stacks the landed cards over the preview copy (E6, 2026-10-28, F28 kept). **Accept.**
- **Added behaviour beyond E1–E8:** an Undo of a commit from Idle back into Place shows the preview from the first frame (`place-preview.spec.ts:538,572`). This is consistent with Q-49 (Place always previews). **Accept.**
- **S1. `★` glyph vs DESIGN.md:311.** DESIGN.md says icons are inline SVG, never font glyphs, and lists `★` among them. The `★` is the font glyph `text.star` on the strip's top tile and now on the WordCell pill. Raised as 11.6 plan R10. **Spec reconciliation proposed** (A5).
- **S2. 11.6 plan records name `9394922` as final.** Review fix `61f5419` changed `e2e/helpers/touch.ts` afterwards. The plan's R11 row, Scope 2 record, Final verification and Auto Run Result were not re-recorded, and the three extra android full runs were not redone. The digest (§ 11.6, Worth knowing 1) records `test:all`, screens and 20/20 repeats at `c2f1fe7`. This is the 11.6 code review's open major. **Fix** (A1).

### Diff review (`bmad-review`)

No high-severity findings. The 11.1 → 11.2 → 11.3 → 11.4 chain holds, and real-fixture e2e covers each boundary. Re-checked against HEAD:

- **V1 (medium, verification gap).** `e2e/theme-art.spec.ts:113-127` now checks the used face's hatch only for the three `ARTS` themes, in Composing after one Undo. The `theme-paper-board` and `theme-plum-board` baselines were regenerated in 11.2. They now show the preview where the R-33 used look used to be, so no pixel check of the used look remains for paper and plum. The used look is still drawn from tokens that `contrast.test.ts` pins, which is why this is not high. **Fix** (A2).
- **V2 (low).** The target ring (3 px, `::after`, `WordCellRow.svelte:191`) overlaps the pill's 2 px inset (`Card.svelte:238-239`) by 1 px on every Place target. The count badge had the same overlap before. Jared's device read covered this (checklist item 7, 2026-10-29). **Accept.**
- **V3 (low).** `e2e/helpers/touch.ts:156`: the failure path joins `read.events` without checking that the log survived a document replacement, so a TypeError could replace the diagnostic. `:135-165`: the capture listeners are removed only on success, so a caller that retries after a caught failure logs each event twice. These are the 11.6 code review's two open minors. **Fix** (A1).
- **V4 (low).** `e2e/helpers.spec.ts:1103-1139`: both new failure-path tests can only end by exhausting a 5 s `expect.poll`, because `doubleTap` takes no timeout. That adds about 10 s per `test:e2e`. **Fix** (A1).
- **V5 (low).** `e2e/fly-to-cell.spec.ts:370` compares `running` to itself inside `toEqual`; only `:371` checks it. **Fix** (A1).
- **V6 (low, rule 6).** The scene authoring paths accept malformed input silently:
  - `Scene.svelte:406` allows `cell6: 'used'` on a frame that also previews;
  - `Scene.svelte:176-185` `previewsAt` does not check that `frame.placeTarget` has an entry or that its top is `placeOrder.at(-1)`;
  - `types.ts:167` `Frame.after` is ignored on non-Place frames without an error;
  - `scene-replay.ts:234-245` compares preview tops by letter, not CardId, though its comment says exact.

  None of these misdraws today's scene, since the hand-written MATRIX and the harness pin it. **Defer** (A3).
- **V7 (low).** The scene `★` is positioned against `.stack`, not its own card (`Card.svelte:238` with `Scene.svelte:581`), so a taller scene stack would put it on the bottom card. Declined in 11.6 (R21); today's scene stacks are one card. **Accept.**

## Behavior verification

- **Owner device read** (2026-10-29, epic Notes): Jared ran `node scripts/device-preview.mjs session-place-used-cells` on his Android phone. He checked retarget, reorder, a used non-target cell (card beneath on cell 6, empty outline on cell 3), Undo to Composing (used look back), Redo, Confirm's fly-to-cell (no old top flashes), the How to play Place scene, and whether the `★` reads as subtle. Every item read as expected and he asked for no change.
- **360 px badge/`★` meet** (2026-10-29, 11.6 done checkpoint): `session-place-long` was rendered in Chromium at 360 × 839 (mobile, touch) on the dev server. Target cell 10 shows N with the `★` and badge 15, and the badge draws above the pill where they meet. Cell 3, whose top N is the word's free letter, previews A with the `★` and 2. Jared judged it "fine as is".
- **Suites at the final code commit** (`c2f1fe7`, digest § 11.6): `test:all` green (unit 3638, e2e 1123, dist 21, pwa 17, size 560553/600000); `test:screens` green (68, no baseline changed); `[android] e2e/nav.spec.ts:163 --repeat-each=20` 20/20.
- **Not exercised end to end by this retro:** a relaunch into Place on the installed PWA, and the screen-reader names on a real screen reader. Playwright covers both (`e2e/place-preview.spec.ts:526` reload into Place, `e2e/screen-reader.spec.ts:309-311` names), but no person checked them.

## Previous-retro follow-through

Source: `epic-end-of-game-words/epic-end-of-game-words-retrospective.md:207-222` (action items) and `:193-205` (follow-through). No commit in `main..HEAD` touches `src/ui/celebration/` or `.claude/skills/`.

- **B1** (Dev) apply R1–R3, DESIGN.md A-D12 wording and two epic Notes fixes: **landed**, `ca8e7f3` (DESIGN.md:762; epic 10 Notes :76, :78).
- **B2** (Dev) autopilot: usage-limit stop writes and commits the handoff, dead pid file deleted at startup: **landed**, `ca8e7f3` (`.claude/skills/epic-autopilot/SKILL.md:67-68`, `:253-256`). Not exercised this epic: both usage-limit stops (11.2 build, 11.4 ticket review) were resumed by hand in the parent session (digest § Stopped — usage limit).
- **B3** (Dev) F6: closing-fade test uses `speed: 0`: **not landed**. `src/ui/celebration/celebration.svelte.test.ts:828` still uses `vx: 0`. Declined by 11.6 (plan R26, outside Boundaries), carried here.
- **B4** (Dev) F1 + P1: stop a live run on halt, and fail fast on a run with no elements: **not landed**. `src/ui/celebration/celebration.svelte.ts:119` still has `if (elements.length === 0) return;`. Carried here (R26).
- **B5** (Owner) F2: guard on key skip: **landed (resolved)**, kept as built, recorded as epic 10 SPEC F33 in `5be1647`.
- **B6** (Dev) celebration refactor candidates D1, D2, D3, S1, S2, D4, P3 and the A1 AGENTS.md pitfall: **not landed**, no commit. Carried here (R26).
- **B7** (Dev) F4: test or fix for a resize during the winning glide: **not landed**, no such test in `src/ui/celebration/*.test.ts`. Carried here (R26).
- **B8** (Owner) L3: a flake seen in a second ticket gets its own fix ticket at once: **partly applied**. The `nav.spec.ts:163` flake came back in 11.4 (`.autopilot/20261028-1937/11.4-testall-attempt1.log`). It went into the 11.6 sweep rather than a ticket of its own: diagnostic-only commits `9394922` and `61f5419`, plan R11 "kept, unconfirmed". The owner deferred the fix ticket until the next failure (epic Notes, 2026-10-29). No such ticket exists.
- **B9** (Owner) L4: live-tunable device preview for the next motion-tuning ticket: **no evidence found**; epic 11 had no motion-tuning ticket.
- Carried from epic 9: **P-A3** (cap ticket review at 4 passes): **not landed**. `SKILL.md:272`, `:320` still say max 7, and 11.6's ticket review ran 6 passes. **P-A7** (build-size margin): **no evidence found** of a decision. The margin is now 39,447 bytes (560,553 / 600,000 at `c2f1fe7`), against 40,044 at epic 10.

## Action items

All items are proposed, not applied. The retro edited no tree file.

- **A1 (Dev, small): test-hygiene batch.**
  - Re-record the 11.6 plan's verification at `c2f1fe7`, or note that the digest holds it (S2).
  - Guard `read.events` and remove the listeners in a `finally` in `e2e/helpers/touch.ts` (V3).
  - Give `doubleTap` a timeout so the two `helpers.spec.ts` failure cases end fast (V4).
  - Drop the self-compare at `e2e/fly-to-cell.spec.ts:370` (V5).
- **A2 (Dev): used-look coverage for paper and plum (V1).** Extend the TH-9 used-face check in `e2e/theme-art.spec.ts` to every registered theme (Composing after Undo), or add a Composing board baseline for them.
- **A3 (Dev, low): fail fast in scene authoring (V6, AGENTS rule 6).**
  - `defineScene` rejects `after` on a non-Place frame and `cell6: 'used'` on a previewing frame.
  - `previewsAt` asserts a `placeTarget` entry whose top is `placeOrder.at(-1)`.
  - The harness compares CardIds.
- **A4 (Owner): carried epic 10 items B3, B4, B6, B7.** These are the celebration test fix, halt and empty-run behaviour, the refactor candidates and the resize-during-glide test, all still open (see follow-through). B4 changes behaviour, so it needs Jared's call. Proposal: one celebration clean-up ticket in the next epic that touches `src/ui/celebration/`, or its own small epic.
- **A5 (Owner, spec reconciliation): DESIGN.md:311 and the `★` (S1).** Proposed wording, from 11.6 plan R10: "**Icons** are inline SVG, not emoji or font glyphs, in `{colors.ink-primary}` unless stated (the `★` is the exception: the font glyph `text.star`, on the strip's top tile and the WordCell preview pill):". Drop `★` from that line's list of SVG icons. The alternative, an SVG star, is a look change for its own ticket.
- **A6 (Dev, deferred): fold the e2e preview helpers (D1)** into `e2e/helpers/` the next time `place.spec.ts` or `place-preview.spec.ts` is touched.
- **A7 (Owner): `nav.spec.ts:163` fix ticket (B8).** Jared chose to wait for the next failure (epic Notes, 2026-10-29); that failure now carries the event log. Proposal: add a backlog entry now, so the next occurrence has a home.
- **Process lessons:**
  - **A8 (Owner): ticket review length (epic 9 P-A3, still open).** Ticket reviews ran 3, 5, 4, 4 and 6 passes; the 6-pass review, majors 7, 7, 4, 4, 1, 0, was for a refactor sweep that adds no behaviour. That review cost 67 % of 11.6's 15.0M tokens (digest § 11.6). Decide whether to cap ticket review lower, or cap it lower for sweep tickets.
  - **A9 (Owner): build-size margin (epic 9 P-A7).** The margin is now 39,447 bytes (560,553 / 600,000), down 597 from epic 10. No decision is recorded.
  - **A10 (Dev): reading the review loop's JSON.** The loop's JSON can report `converged` while `open_major` is set (11.6 code review, `majors_per_pass` [1, 1]). The orchestrator handled it by rerunning the suites, but the plan was left stale (S2). Proposal: `epic-autopilot` step D re-records the plan, or stops, whenever `open_major` is not null.

## Acceptance verdict

**accepted-with-open-items** (criteria declared: epic file § Done when 1–5).

1. **Done when 1** (target top, `★`, count, reorder, retarget, used non-target, no used card in Place): `place-preview.spec.ts` (E2–E4 rows above) and the device read.
2. **Done when 2** (Undo look, Redo, reload, long-press view): `place-preview.spec.ts:421-457,470,517,526` and the device read.
3. **Done when 3** (fly-in never shows the old top; scene matches the game): `fly-to-cell.spec.ts`, `how-to-play.spec.ts`, the scene 3 frame 4 baseline and the device read.
4. **Done when 4** (`test:all` and `test:screens` green; no Session or history shape or version change; docs match): digest § 11.6 at `c2f1fe7`; 11.5 document check (`d67b42a`, `SESSION_VERSION` and `HISTORY_VERSION` 1).
5. **Done when 5** (Jared's read in Notes): epic Notes, 2026-10-29.

All six tickets are done, and no finding is blocking. Open items A1–A10 are tracked above.

## Open questions

- **A5:** take the DESIGN.md:311 wording, or ask for an SVG star?
- **A4:** whether B4 (stop a live celebration on halt; fail fast on an empty run) is wanted as specified in epic 10, and where the celebration clean-up goes.
- **A7:** add the `nav.spec.ts:163` fix ticket now, or keep waiting?
- **A8 and A9:** process thresholds (review pass cap; size-budget margin).
