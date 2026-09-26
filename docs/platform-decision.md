# WordCell – Platform research and recommended plan

Date: 2026-09-26. Companion to `requirements-carryover.md`.
Research was done by three parallel agents (Unity 6.6, web stack, BMAD) with web sources
checked the same day; package versions were confirmed against the npm registry.

## 1. Recommendation in one paragraph

Build WordCell as a **TypeScript web app** (Vite + a pure rules engine + a thin
Svelte 5 view + hand-rolled Pointer Events drag-and-drop), ship it as an **installable
PWA** that you open from your Android home screen, and later wrap the same URL as a
**Trusted Web Activity** with Bubblewrap if you want it on the Play Store. Test the
engine with **Vitest** and the UI with **Playwright** in a Pixel emulation profile.
Drive development with **BMAD 6.12** on its "epic-sized" path (brief → architecture
spine → spec/tickets → build), skipping the PRD and the Game Dev Studio module.
Keep Unity 6.6 as the fallback only if native-app polish turns out to matter more than
iteration speed. Confidence: high for the stack choice, moderate for the Svelte-vs-vanilla
detail (either is fine).

## 2. Why not Unity 6.6 for this game

The BGA project stalled because the platform was opaque and there was no local
run-and-test loop. Unity fixes the "opaque" part but recreates the slow loop:

| Concern | Unity 6.6 | TypeScript web |
|---|---|---|
| Test cycle for rules | Editor cold boot 30–90 s per batch run; cannot run while the Editor has the project open. Workaround: separate net8 class library and `dotnet.exe test` via Windows interop | `vitest` returns in well under a second, watch mode |
| Test cycle for UI | UI Toolkit Test Framework (6.3+) or PlayMode tests, same Editor cost | Playwright headless Chromium inside WSL2, screenshots, Pixel viewport |
| Agent-editable assets | Scenes/prefabs are YAML with GUIDs and `.meta` files; recommended practice is "build scenes from code" and drive the Editor via the new Unity CLI / MCP / Claude Code plugin (Sept 2026), Editor must be running, Windows-only questions in WSL2 | Everything is plain text; no editor process |
| Drag-and-drop | UI Toolkit has no built-in runtime drag; uGUI is still Unity's official recommendation; known multi-frame touch lag threads on Android | Pointer Events + `setPointerCapture` + CSS `transform`; the standard pattern for web solitaire games |
| Release status | 6.6 is a non-LTS "Supported" release, patched only until 6.7 ships (late 2026). Expect one forced upgrade | Vite 8.3 / Vitest 5 / Playwright 1.63 are current stable |
| Output size | ~15 MB APK, 5–8 MB compressed web build before the dictionary | ~100 KB app + ~450 KB gzip dictionary |
| Android toolchain | One Unity Hub checkbox (SDK/NDK/JDK 17 bundled, ~3 GB) | None for the PWA. JDK 17 + cmdline-tools (Bubblewrap downloads them) only for the Play Store step |
| Browser build on Android | Officially supported but with reported quirks (portrait desktop-mode fps, per-frame pointer events) | Native |

What Unity genuinely offers here: a Play-Store-ready native APK from a checkbox, C#,
and the strongest *official* AI-agent tooling of any engine in 2026. None of those
address the requirements that matter most for WordCell (fast tests, reliable touch drag,
tiny logic core). Godot 4.7 sits between the two (text scenes, headless gdUnit4, single
binary that runs in WSL2) but its web export is GDScript-only and adds a second language
to the project for no gain.

## 3. Recommended stack, with reasons

| Layer | Choice | Why |
|---|---|---|
| Build | Vite 8.3, TypeScript 6.x (TS 7 lacks a compiler API that Svelte tooling still needs), pnpm or npm | Standard, fast, agent-familiar |
| Lint/format | Biome 2.5 | One binary, one config; replaces ESLint + Prettier |
| Rules engine | Pure TS package, zero DOM imports | Deterministic deal from a seed; every rule in the carryover doc becomes a unit test |
| Undo | Event sourcing: `{seed, moves[], undoIndex}`; state = replay(seed, moves[0..n]) | Unlimited undo and redo for free; a bug reproduces from a 200-byte string; replay of a whole game over 52 cards is microseconds |
| Persistence | Serialize the same `{version, seed, moves, undoIndex}` to localStorage on every move; IndexedDB later for saved games/stats | Survives reload and app suspend, satisfies "undo through the whole session" |
| View | Svelte 5 (runes) rendering engine state; during a drag write `transform` directly to the dragged elements and commit to state on drop | Within ~5 % of vanilla in benchmarks; keeps engine framework-free. Vanilla TS is the acceptable alternative |
| Drag-and-drop | Own code (~150 lines): `pointerdown` → `setPointerCapture` → `pointermove` → `pointerup/pointercancel`; `touch-action: none` on cards, `overscroll-behavior: none` on body; drop target chosen by card overlap, not pointer position | No DnD library models "drag a stack tail (bottom slice of a column) between columns" on touch well. dnd-kit is React-only and in a 0.x rewrite; Pragmatic DnD has poor touch reports |
| Dictionary | ENABLE list (public domain, ~172.8k words, no proper nouns/abbreviations). Your `english.txt` (172,724 lines) is almost certainly ENABLE already. Load as `Set<string>` after first paint | Measured: 454 KB gzip / 370 KB brotli; ~4 MB heap; ~38 ns per lookup. Tries only matter if you add prefix hints |
| Android | PWA: manifest with `display: standalone`, `orientation: portrait`, Workbox precache via vite-plugin-pwa 1.3; request `navigator.storage.persist()` | Full screen, offline, home-screen icon, no toolchain. Chrome grants persistent storage to installed apps |
| Play Store (optional, later) | Bubblewrap 1.25 TWA from WSL2 (needs JDK 17 + Android cmdline-tools, no Android Studio), or PWABuilder in the cloud with zero local toolchain | Same URL, no second codebase. Capacitor only if native plugins are ever needed |
| Engine tests | Vitest 5 | Fast; `agent` reporter reduces token use |
| UI tests | Playwright 1.63, `devices['Pixel 7']` project, `webServer` boots Vite, `toHaveScreenshot` for layout regressions | Runs headless in WSL2. Touch drag via a `touchDrag()` helper using CDP `Input.dispatchTouchEvent`; mouse-driven drags cover the same pointer code path for logic tests |
| Hosting | Cloudflare Workers static assets (brotli, free bandwidth) or GitHub Pages (gzip only) | HTTPS is required for PWA install |

Reference implementations worth reading before the architecture step: Solitude/CardHearth
(DOM + CSS transitions, single pointer-events path, snapshot undo, Vitest rules engine),
FreeCellDelux, gitbrent/FreecellJS, richardwooding/patience (overlap-based drop targeting).

## 4. BMAD 6.12 setup and workflow

Your previous installs (6.0-Beta.7 and 6.2.2) predate several breaking changes:
`bmad-quick-dev` became `bmad-build`; `create-story`/`dev-story` are deprecated shims;
review skills merged into `bmad-review`; research skills merged into `bmad-deep-recon`;
`document-project` + `generate-project-context` became `bmad-project-context`; config
moved from YAML to layered TOML; skills now install to `.claude/skills/` rather than
`.claude/commands/`; `uv` (already installed here, 0.10.1) is required for `bmad-build`.

Install (in the new repo):

```bash
cd /mnt/d/CodeProjects/wordcell && git init
npx skills add bmad-code-org/BMAD-METHOD      # pick Claude Code; include bmad, core-tools,
                                               # method, bmad-build, bmad-preview-ticketing,
                                               # bmad-architecture, bmad-spec, bmad-product-brief,
                                               # bmad-deep-recon, bmad-code-review, bmad-retrospective
# then inside Claude Code:  "run bmad setup"  →  "bmad status"
```

Sequence (epic-sized path; skip PRD, skip Game Dev Studio, skip TEA):

1. Copy `docs/requirements-carryover.md` and the BGA rulebook into
   `_bmad-output/planning-artifacts/legacy/`.
2. `/bmad-deep-recon` (technical, "select" shape) only if you want the Unity-vs-web
   decision recorded in BMAD's own `research.md`; this document can be pasted in as the
   report to process.
3. `/bmad-product-brief` in Fast mode, pointing at the legacy docs.
4. `/bmad-ux` only if you want a DESIGN.md for the card layout and word-formation tray.
   Recommended, because touch layout is the riskiest UX piece.
5. `/bmad-architecture` → `ARCHITECTURE-SPINE.md` recording the stack above, the
   engine/view boundary, the event-sourced undo model, persistence and PWA packaging.
6. `/bmad-project-context` setup → AGENTS.md block, imported from CLAUDE.md.
7. `/bmad-spec` per epic → `/bmad-preview-ticketing` → `tickets.toml`.
8. Fresh chat per ticket: `/bmad-build <id>`. `/bmad-code-review` when the built-in
   review is not enough. Review every story yourself; community reports of stub "fixes"
   marked complete are the main failure mode.
9. `/bmad-qa-generate-e2e-tests` once the engine exists. `/bmad-retrospective` per epic.

Suggested epics:

1. Project scaffold and CI: Vite, TS, Biome, Vitest, Playwright, GitHub Actions, deploy.
2. Rules engine: deal from seed, selection legality, word assembly (reorder, destination
   stack tail, flip, WordCell letters), validation, placement, scoring, end detection,
   event-sourced undo/redo, serialization. 100 % unit tested before any UI.
3. Dictionary: ENABLE load, lookup, filtering, lazy load after first paint.
4. Board UI: columns, WordCells, drag-and-drop of stack tails, drop targeting, animations.
5. Word-formation tray: reorder, plus/minus destination cards, flip, WordCell letters,
   validate, choose WordCell, reorder before placement with top/bottom indicator.
6. Session: undo/redo controls, persistence, resume, new game, give up, score screen
   with rating scale.
7. PWA: manifest, icons, service worker, install prompt, orientation, storage persist.
8. Preferences and statistics (carried over list).
9. Optional: Bubblewrap TWA and Play Store listing.

## 5. Decisions left for you

- Svelte 5 vs vanilla TS for the view. Default: Svelte 5.
- Hosting: Cloudflare (brotli, custom headers) vs GitHub Pages (simplest). Default: Cloudflare.
- Play Store now, later, or never. Affects nothing until epic 9.
- Keep `english.txt` or re-download ENABLE with provenance. Default: re-download.
- Whether to record the stack decision through `bmad-deep-recon` or just cite this file
  from the architecture step. Default: cite this file.

## 6. Facts the research could not verify

- Frame-time numbers for DOM vs canvas drag on a specific mid-range Android device; the
  DOM choice rests on compositor behaviour and the open-source solitaire projects.
- Whether Bubblewrap's automatic JDK/SDK download behaves on WSL2 (no WSL notes).
- Whether the Linux Unity CLI inside WSL2 can drive a Windows Editor (relevant only if
  you choose Unity).
- Exact `_bmad-output/` subfolder names in 6.12 and an official 6.2 → 6.12 migration
  guide (none found; old wrappers are auto-removed on upgrade).
- Whether 6.7 will formally be Unity's next LTS (widely reported, not yet on unity.com).
