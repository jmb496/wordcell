# Reconcile review: ARCHITECTURE-SPINE.md against its inputs

Reviewer: fresh-context reconciler, 2026-09-27. Read-only; the spine was not edited.
Scope: brief (§6, §7, §9), game-flow-spec v0.7 (§2, R-02, R-37, R-38, R-73, R-74, R-76, R-84,
R-85, §7.10), DESIGN.md, EXPERIENCE.md, platform-decision §3 and §5, CLAUDE.md rules 1-7,
development-methodology.md. I also checked the scaffold at HEAD, because the spine says it states
every place where the scaffold diverges.

**Verdict:** Mostly faithful. The core invariants (purity, event sourcing, one writer, the seeded
deal, the history semantics, the dictionary as one download, the update policy, nav ownership)
all landed. What is missing is mainly quiet: test obligations and their timing, the test seams
they need, a few UX handoffs that are order-dependent or only partly carried, and scaffold
divergences the spine does not call out. There are two self-contradictions (AD-1's `history`
token scan, and AD-11's anchor rule vs the switchable band order).

Severity: **M** = major (a ticket built from the spine would get it wrong or miss a test
obligation), **m** = minor, **D** = needs Jared's decision.

---

## 1. Product brief

| # | Sev | Input | Gap |
|---|---|---|---|
| B-1 | M | §6.4 test split | The spine never states the brief's split: engine sentences are covered by Vitest; `(UI)` sentences **and untagged app-shell sentences** (dictionary load R-38, visible-time clock R-76, storage and version rejection §2, R-73, R-74 seed) are covered by **Playwright on the android project**, and desktop-only behaviour (hover view, keyboard) is also tested on the desktop project. Because `src/shell/` is a separate layer and Vitest runs in `node`, a ticket could plausibly unit-test shell code in Vitest instead and claim the R-id. AD-17 and Consistency Conventions need this rule, plus the ticket-plan duty to list the sentence-to-test mapping and the exempt sentences (ownership, provenance, versioning process). |
| B-2 | M | §6.2 hardest boundaries | AD-17 defines how tests read the restored Session (`loaded()`), which is good. It does not list the three required boundary fixtures: (a) Place with a free letter, a non-default placement order and a redo tail; (b) `gaveUp`; (c) a finish recorded and then undone, so the removed record stays removed. It also omits the two triggers, "hidden then reloaded" and "reloaded without a preceding hide". These appear only as "restore tests at the brief §6.2 boundaries" in **epic 7**. That conflicts with the per-ticket DoD and brief §6.4: R-73 and R-84 persistence land in epic 3 and must be tested there. Fixtures plus the hook need no UI, so the tests can land with epic 3. |
| B-3 | M | §6.2 / R-73 / R-76 test seam | No seam exists for making the page **hidden** in Playwright (visibilitychange / pagehide) or for controlling visible time. R-73's hide-write and R-76's pause-while-hidden are Playwright obligations. The spine should name the mechanism, for example Playwright `page.clock` for `performance.now`, plus a defined way to emulate a hide: a second page brought to the front, CDP `Emulation.setFocusEmulationEnabled`/`Page.setWebLifecycleState`, or a DEV/test-hook `simulateHidden()`. |
| B-4 | M | §6.7 test speed | "Full unit suite under 5 s, watch re-run under 1 s" is not carried. The Deferred note only covers runtime performance. Nothing protects the budget. The main risk is B-5 (loading the 170k-word dictionary in unit tests). The spine should state the budget, and how it is checked (for example a CI timing assertion or a Vitest reporter threshold), or at least set it as a convention. |
| B-5 | M | §6.6 Vitest repro "plus the dictionary for Validate" | The spine does not say how Vitest gets a dictionary. The generated `generated/dictionary/en.txt` is git-ignored and only produced by `build:dictionary`, so `npm test` on a fresh clone (and CI's `unit` step, which runs **before** `build`) would fail if any test reads it. Loading the full list per test file also threatens B-4. A convention is needed: small inline `Set` fixtures for rule tests, and the full list only in named repro cases behind a `pretest` generation step, or read from `data/enable1.txt`. |
| B-6 | m | §6.8 one dictionary download | AD-8 designs for a single download but has no test that verifies it. A `pwa`-project assertion that `en-*.txt` is fetched from the network once across first launch and precache install would bind the claim. |
| B-7 | m | §6.8 "worker reports the precache complete" | AD-17's test hook exposes `loaded/current/dictionaryState` but no service-worker or precache state. The offline test needs a defined readiness signal, for example `navigator.serviceWorker.ready` plus an activated state, or a hook `swState()`. |
| B-8 | m | §6.4 "`npm run test:all` runs both projects" | Adding a third Playwright project (`pwa`) that needs `vite build` with `VITE_TEST_HOOKS=1` and then `vite preview` changes `test:all` and CI. The spine does not say how that build is produced: a separate outDir, so it does not overwrite `dist/` or the size-budget build. It also does not say that the offline test runs a hook-enabled build that differs from the deployed one. |
| B-9 | m | §7 browser support | Nothing records the support matrix (Chrome Android required, desktop Chromium tested, Firefox/Safari best-effort, iOS untested), and nothing sets a matching `build.target`. It is also not recorded that install relies on Chrome's native UI (no `beforeinstallprompt` handling). Platform decision §4 epic 7 listed "install prompt", and the spine silently drops it. It should say so explicitly. |
| B-10 | m | §6.9 process | OQ-2 (unreadable prefs) and OQ-3 (fatal-error surface text) are player-visible design questions. Under brief §6.9 and methodology gate 5 they should become spec §9 Q-xx entries answered by Jared before epic 3 code depends on them, not stay only as spine OQs with defaults. |
| B-11 | m | §6.5 "only persisted data are Session, history, prefs" | Landed (AD-7 three keys). Two items are unmentioned: `navigator.storage.persist()` state (fine), and **multiple tabs**. Two desktop tabs are two state holders writing the same keys, so the last write wins and the score history can be double-recorded or lost. This contradicts §6.6 "no second state holder" and R-84 "one game in progress". The spine needs a decision (for example: ignore, a `storage`-event reload, or a Web Locks single-writer). **D** |

## 2. Game flow spec

| # | Sev | Rule | Gap |
|---|---|---|---|
| S-1 | M | R-84 "no partial state is observable" | AD-4 writes Session and history as **two** `localStorage.setItem` calls, and "a write failure throws". If the second write fails (quota) after the first succeeded, a reload observes exactly the partial state R-84 forbids. The spine needs a write order plus a recovery rule, or a single atomic write for finish and un-finish transitions (for example staging both, or accepting and documenting the window). **D** |
| S-2 | M | R-76 / R-74 clock at New game and Replay | AD-4 and AD-9 do not reset the clock's unflushed milliseconds when `createSession` replaces the Session. The first dispatch of the new game would then accrue time spent in the previous game and the confirm dialog. The same applies at launch after a rejected-session New game. |
| S-3 | m | R-85 "engine exposes one `letterCount(card)`" | AD-2's public-surface list omits `letterCount`. The spine routes letter counts through `GameView`, which may be intended, but it should say so, or export it, since R-85 names it. |
| S-4 | m | §2 rejection flows vs R-73 writes | AD-4 says the store holds "the current `Session`". The spine does not define the store state while the Session is rejected (no Session, no `GameView`). It also does not say explicitly that the hidden/pagehide writes and `accrue` are suppressed in that state. AD-7's "key not written until New game" implies both but gives the store no shape for it. |
| S-5 | m | §2 history absent vs unreadable | The spine does not say that a missing `wordcell:history` key means an empty readable history of the current version, not `unreadable`. |
| S-6 | m | R-38 transient invalid-word line | `rejectedWord` is returned by `apply`, but the spine does not say where it lives, or that it is cleared on the next edit, Undo, Redo or successful Validate and is never persisted (EXPERIENCE State Patterns: "not restored"). |
| S-7 | m | R-37 / data provenance | `data/README.md` still says "filter to lengths 3–10" and has no SHA-256. AD-8 lists the script's 3–10 bug but not the README text. |
| S-8 | ok | R-02, R-73, R-74 (seed), §7.10 | Landed correctly (AD-5 golden test on two seeds; AD-7 write points; AD-5 `crypto.getRandomValues`; AD-10). |

## 3. DESIGN.md / EXPERIENCE.md handoffs

| # | Sev | Handoff | Gap |
|---|---|---|---|
| U-1 | M | Band order switch vs A-D4 anchoring | AD-11 says no code may assume band adjacency, then states the anchor rule as "height above the WordCell row beyond the leftover band". That hard-codes today's order: the WordCell row below the columns, with the leftover above the columns. Under the DESIGN fallback order (WordCells and tray above the columns), the anchored band and the growth direction change. The anchor, the growth source (leftover first) and the sticky bars must be expressed in terms of `BAND_ORDER` (for example a named anchor band), or the switch is not really one line. `BAND_ORDER` also omits the 4 px gap and the cell-number label row, which the height rule counts. |
| U-2 | M | A-D11 / A-D4 "w is not recomputed" | `geometry()` takes `trayRows` and `bannerShown`, and AD-11 feeds banner show/hide and tray growth into the same "pending recompute". DESIGN is explicit that tray growth and the dictionary banner **never** recompute w (only `resize`/`orientationchange` do, and not for an innerHeight change under 80 px). As written, a height-derived w could shrink when the banner appears. The spine must separate a w recompute from a band/offset re-layout. |
| U-3 | M | Overlap targeting on live rects: which rect | AD-12 reads "each registered element's live `getBoundingClientRect()`" but does not say which elements register. EXPERIENCE and DESIGN require a column's hit rect to be the **whole slot**: every strip, the empty space below the bottom card, the placeholder, and the foot pad, at least 44 px wide. The dragged rect is the **grabbed top card after its transform**. If `use:dropTarget` sits on card elements, targeting is wrong. The same full-slot-pitch rule applies to WordCells, tray tiles and strip tiles. |
| U-4 | M | Scrolling and touch-action regions; scaffold `overflow: hidden` | DESIGN Scrolling requires `touch-action: pan-y` (or `pan-x pan-y` when the board is wider than the viewport) on the non-card regions, and platform §3 and EXPERIENCE require `overscroll-behavior: none` on the body. Neither is in the spine. The scaffold's `app.css` sets `html, body { overflow: hidden }` ("the board never scrolls"), which makes A-D3 scrolling and A-D4's `scrollTop` anchoring impossible. That divergence is not called out. |
| U-5 | M | Font precache and failure | AD-15 routes a font failure to the fatal surface through `document.fonts.load`, but AD-16's boot order does not place that check. It also does not say that `load()` resolving with an empty list counts as failure, or reconcile the check with `font-display: block`. DESIGN says a failed font is "surfaced like any other failed precache asset", yet the spine defines **no** handling for a failed precache or service-worker install (quota, a 404 during install). Offline would then fail silently, contrary to rule 6. Whether a precache failure is fatal or a banner is **D**. |
| U-6 | M | Manifest and icons; scaffold divergence | The spine never states the A-D5 manifest (name, short_name, description "A solo word card game in the spirit of FreeCell.", `theme_color`/`background_color` `#15171B`, `display: standalone`, `orientation: portrait`, icons 192/512 `any` and 512 `maskable`); epic 7 cites DESIGN only by reference. The scaffold's `vite.config.ts` diverges: `display_override: ['fullscreen', …]`, `#1c2331`, a different description, and `registerType: 'autoUpdate'`. AD-16 covers only the last. `public/icons/` is **empty**, so the manifest references missing files, and no icon-generation step (source SVG to PNGs) is named. `index.html` also still has title "scaffold", no `viewport-fit=cover` and no `theme-color` meta. The preamble promises that divergences are stated. |
| U-7 | m | A-E4 update policy consequences | Landed (`prompt`, no skipWaiting). Unstated: a waiting worker activates only when **all** clients close, so a browser-tab reload never updates, and an installed app backgrounded rather than killed keeps the old version. That matches "next launch" but should be written down so a ticket does not "fix" it. |
| U-8 | m | History handling: drag and nav interplay | EXPERIENCE requires a `popstate` during a drag, and any Undo, Redo, menu or key command during a drag, to first cancel the drag as for `pointercancel`. AD-12 and AD-13 give the controller no `cancel()` entry point and no nav-to-gesture coupling. |
| U-9 | m | Dictionary-failed banner and Reload | Landed (AD-8 states, `retry()`, AD-11 deferral). A test seam is missing: in dev the `?url` path is `/generated/dictionary/en.txt` (or `/@fs/…`), while in the build it is `/assets/en-<hash>.txt`. Playwright route interception for R-38 "failed" needs a pattern stable across both, or a hook. |
| U-10 | m | Session-rejected / history-unreadable ordering | AD-7 maps reasons to variants (good). The launch sequencing EXPERIENCE requires is not placed in AD-16's boot order: rejected message first, History notice only after New game, notice once per launch, and on a relaunch into Game over the end-sheet entry pushed **before** the History notice. |
| U-11 | ok | A-D11 gate, A-D4 Playwright test, live-rect reads per `pointermove`, `replaceState` at launch, the queued push/pop, dictionary-failed + Reload, A-E4 no-prompt, app version in footer | Landed. |

## 4. Platform decision §3 and §5

| # | Sev | Gap |
|---|---|---|
| P-1 | m | `overscroll-behavior: none` on body (platform §3 drag row) is not in the spine (see U-4). |
| P-2 | m | "Persistence … IndexedDB later for saved games/stats": the spine puts history in `localStorage` (a reasonable choice needed for AD-4's synchronous writes) but does not record that it rejects the platform note, or why. One sentence would do. |
| P-3 | m | New toolchain: `scripts/build-font.py` via uv/fontTools adds Python to the build. uv is already required by BMAD, so this is acceptable, but the spine does not note it as an addition to the platform §3 stack. It is only an assumption (A-A5). |
| P-4 | ok | §5 defaults (Svelte, Cloudflare, re-download ENABLE with provenance, Play Store deferred, cite rather than re-research) all landed. |

## 5. CLAUDE.md rules 1-7

| # | Sev | Rule | Gap |
|---|---|---|---|
| C-1 | M | 1 / AD-1 check 2 | "Only `src/shell/nav.ts` references `history`" collides with the **score history** vocabulary used everywhere else: `engine/history.ts`, `HISTORY_VERSION`, `reconcileHistory`, `wordcell:history` in `storage.ts`, and the history state in the store. As written, the architecture test fails on legitimate code, or gets loosened ad hoc. It should match the browser-API forms (`history.pushState|replaceState|back|go`, `window.history`, `popstate`). The engine token list likewise needs word-boundary matching (a substring `Date` or `window` would hit identifiers and comments). |
| C-2 | M | 5 / OQ-1 dev loop | Moving the dictionary to a `?url` import of a git-ignored `generated/` file means `npm run dev`, `npm test` and the Playwright dev-server projects fail on a fresh clone until `build:dictionary` runs. Today only `npm run build` generates it. The spine should add `predev`/`pretest` generation (or a Vite plugin) and fix CI step order (`unit` runs before `build`). The OQ-1 deviation itself is correctly raised under rule 7. |
| C-3 | m | 6 vs OQ-2 default | OQ-2's proposed default for unreadable prefs ("use defaults, no message, overwrite on the next change") is a silent fallback and a silent overwrite. That runs against rule 6 and the §2 pattern that stored data is "never overwritten silently". It is defensible for prefs, but the spine should present it to Jared as a rule-6 exception, not a neutral default. **D** |
| C-4 | m | 3 / testing expectations | CLAUDE.md "UI tests cover flows (pick up stack tail → tray → place → undo) in the android project first" is not carried (see B-1). |
| C-5 | ok | 2, 4, 7 | Landed (AD-4 one writer; AD-12 Pointer Events and overlap; deviations raised as OQs). |

## 6. Development methodology

| # | Sev | Gap |
|---|---|---|
| M-1 | m | DoD "every rule id the ticket claims has a passing test naming that id": epic 7 bundles R-73 restore tests and device checks late (see B-2), which lets epics 3-6 close tickets whose R-73 and R-84 persistence sentences are untested. The epic table should move the restore-boundary tests into epic 3, keeping only the device checks (brief §6.2, §6.3) in epic 7. |
| M-2 | m | The spine does not note that its ADs and conventions (the import table, `architecture.test.ts`, test-name prefix, `text.ts`) are the rules `bmad-project-context` must record in the AGENTS.md block (CLAUDE.md "Read first", planning step after architecture). |
| M-3 | ok | Owner gates respected: status `draft`, OQs and assumptions surfaced for Jared, the stack not reopened. |

---

## Top gaps (ranked)

1. **B-1 / C-4**: the brief §6.4 test split (shell and `(UI)` sentences go to Playwright on android; hover and keyboard also on desktop; the plan maps sentences to tests) is absent.
2. **B-2 / M-1**: the §6.2 hardest restore boundaries are not enumerated as fixtures, and the restore tests are deferred to epic 7, against the per-ticket DoD.
3. **U-1 / U-2**: the A-D4 anchor rule hard-codes today's band order, and the banner and tray growth feed a recompute that can change w, which DESIGN forbids.
4. **S-1**: the R-84 "no partial state" guarantee breaks when the second of two `localStorage` writes fails.
5. **C-1**: AD-1's `history` token rule contradicts the score-history naming, so the architecture test is unimplementable as written.
6. **U-4 / U-6**: scaffold divergences are not called out: `overflow: hidden` blocks scrolling and `scrollTop` anchoring, the manifest differs from A-D5, and the icons are missing.

Also important: B-3 (no hide/clock seam for R-73/R-76 Playwright tests), B-4/B-5/C-2 (test-speed
budget, dictionary in Vitest, fresh-clone dev loop), S-2 (clock not reset on New game), U-3
(which element is the hit rect), U-5 (font check placement and silent precache failure).
