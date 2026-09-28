@AGENTS.md

# CLAUDE.md – WordCell

Project rules, architecture rules 1–7, pointers and pitfalls live in `AGENTS.md` (imported above).
Commands are the `package.json` scripts. This file keeps the Claude Code BMAD workflow.

## BMAD and review loops

`/review-loop <path>` (project skill in `.claude/skills/review-loop`) hardens one document or code
change with fresh-context reviewer and fixer subagents until no major findings remain (cap 7).
Technical choices take the reviewer's recommended default; only findings that change
functionality, UX or gameplay go to Jared, never auto-applied. Use it on tickets before build and on
plans after build when a second pass is wanted.


Skills are installed in `.claude/skills/bmad-*`; runtime in `_bmad/`; artifacts in
`_bmad-output/` (planning-artifacts, implementation-artifacts, specs). Legacy inputs are in
`_bmad-output/planning-artifacts/legacy/`. Workflow: product brief → ux → architecture spine →
project-context → spec per epic → preview-ticketing → one ticket at a time: Jared reads the ticket, then `bmad-build-auto <ticket>` (unattended, has its
own review/repair loop, needs a clean tree on the epic's branch, commits locally, never pushes) or
`bmad-build` when a human should approve the plan → Jared reads the plan result → optional
`bmad-code-review` → mark done → retrospective per epic. Skip PRD. Ask `bmad` for help or status.
