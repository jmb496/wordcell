# WordCell – Development methodology

How this project turns intent into tested code with Claude Code and BMAD. The owner (Jared) makes
the game-design and product decisions; agents converge documents and code on those decisions.
Every reviewer and fixer runs as a fresh-context subagent so it cannot inherit the author's
assumptions. Work moves one ticket at a time with a human read between steps.

## Roles

| Who | Owns |
|---|---|
| Owner | What the game is: rules, feel, priorities. Answers every Q-xx. Approves briefs, UX, architecture and each ticket before build. Marks tickets done. |
| Orchestrating session | Runs skills, triages findings, keeps logs, never silently decides intent. |
| Reviewer subagents | Independent findings against the artifact and its refs. Read-only. |
| Fixer subagent | Applies accepted findings minimally. Never resolves decision-needed items. |
| `bmad-build-auto` | Unattended build of one ticket with its own review/repair loop (≤ 5 iterations). Halts instead of guessing. |

## Gates where the owner decides

1. `docs/game-flow-spec.md` §9 open questions (once, before planning).
2. Product brief → UX `DESIGN.md`/`EXPERIENCE.md` → `ARCHITECTURE-SPINE.md` (read and approve each).
3. Each ticket before it is built (read the ticket; answer any decision-needed items).
4. Each built ticket before it is marked done (read the plan's result; optionally drive the app).
5. Any `decision-needed` finding from a review loop, at any time.

## Planning phase (once)

```
owner answers Q-xx  →  /review-loop docs/game-flow-spec.md  →  owner reads
→ /bmad-product-brief  →  /bmad-ux  →  /bmad-architecture  →  /bmad-project-context
→ /bmad-spec (first epic)  →  /bmad-preview-ticketing (slice into tickets)
```
Each BMAD skill runs in a fresh chat. Point each at the spec, the legacy docs in
`_bmad-output/planning-artifacts/legacy/`, and the previous step's output. Skip the PRD.

## Per-ticket loop

```
1. Read the ticket (owner).                       gate 3
2. /review-loop <ticket file or plan>  (optional; recommended for the first tickets and any
   ticket touching rules)  → owner reads decision-needed items, answers them.
3. Clean working tree on the epic's branch.  Then, in a fresh chat:  /bmad-build-auto <ticket>
   (or /bmad-build <ticket> when the owner wants to approve the plan first).
4. Read the plan's `status` and `Auto Run Result` (owner).  Chat output is not proof.   gate 4
5. Optional second pass: /review-loop <plan> in code mode, or /bmad-code-review.
6. Mark done: uv run _bmad/method/scripts/tickets.py mark <ref> done
7. After the epic's last ticket: /bmad-retrospective.
```

Stop conditions for any review loop: zero major findings after triage, or the pass cap (default 4).
Real majors on a third pass mean the refs are unclear; fix the spec or CLAUDE.md, not the ticket.

## Definition of done for a ticket

- Every rule id the ticket claims has a passing test naming that id.
- `npm run test:all` passes (lint, types, unit, e2e).
- No engine-purity, thin-UI, or hand-rolled-DnD rule violated (CLAUDE.md).
- No Q-xx answered by code that the owner has not answered in the spec.
- Plan status `built`, owner has read the result and marked `done`.

## Prompts

**Kick off after reviewing the spec** (paste into a fresh Claude Code session in this repo):

> I have reviewed docs/game-flow-spec.md and answered the open questions in §9. Run /review-loop
> docs/game-flow-spec.md with max=4 and thorough depth. Do not change any answer I gave in §9.
> When it converges or caps, list every decision-needed item with its proposed default and stop
> for my answers. After I answer, fold each confirmed answer into the rules section as a rule with
> an id, delete the resolved rows from §9, and leave only genuinely open items. Then summarise
> what changed and tell me the exact next skill to run.

**Start planning** (fresh chat): `/bmad-product-brief` — "Create the product brief for WordCell
from docs/game-flow-spec.md, docs/requirements-carryover.md and
_bmad-output/planning-artifacts/legacy/. Fast mode. English only for v1. Android PWA first."

**UX** (fresh chat): `/bmad-ux` — "Design the touch layout and interaction model for WordCell
from the brief and docs/game-flow-spec.md §7. Portrait phone first."

**Architecture** (fresh chat): `/bmad-architecture` — "Record the architecture spine from
docs/platform-decision.md §3 and CLAUDE.md architecture rules; do not reopen the stack choice."

**First ticket** (fresh chat, after an initial commit exists): `/bmad-build-auto ticket 1.1`.
