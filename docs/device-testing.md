# WordCell – Device testing on a phone

How the owner checks a build on a real Android phone (a ticket's device read, gate 4 "Owner checks
at gate 4"), without USB, chrome://inspect or a deploy. It is also the setup for the epic 7 device
and desktop reads (`_bmad-output/specs/spec-epic-7-pwa-release/device-checks.md`, CAP-7). First
used for ticket 10.6 (2026-10-24).

## Why Tailscale

The production build (`dist/`) needs a secure context for its service worker and install prompt.
A LAN `http://` address is not one, and deploying is only from `main`. `tailscale serve` shares the
local `vite preview` over HTTPS at the machine's tailnet name
(`https://<machine>.<tailnet>.ts.net`), reachable only by the owner's own devices.

## One-time setup

- Tailscale on the PC (Windows; the script calls `tailscale.exe` from WSL) and on the phone, both
  logged in to the same tailnet.
- Serve enabled on the tailnet: the first `tailscale serve` prints an approval link
  (`https://login.tailscale.com/f/serve?...`); open it and approve. The script stops with that link
  if Serve is not enabled.

## The script

On the PC, from the repo root:

```bash
node scripts/device-preview.mjs [session-fixture] [--history <history-fixture>] [--no-build]
```

Fixture names are files under `fixtures/` without `.json` (e.g. `session-gave-up`,
`--history history-invalid-null`). The script reads the fixtures first (a missing or non-JSON one
stops it before anything else runs), runs `npm run build` (`--no-build` reuses the current
`dist/`), writes `dist/seed.html` when either fixture is given, serves `dist/` with `vite preview`
on port 4173, shares it with `tailscale serve` and prints what to open on the phone. Ctrl+C turns
the share off and stops the preview. Port 4173 must be free (`npm run test:all` uses it).

- With a fixture it prints `<url>/seed.html` and "Seed, re-seed or fresh install: clear this
  origin's site data on the phone first."
- Without one it prints `<url>/`, "Fresh install: clear site data first." and "Update read (G3):
  keep site data."

`npm run build` inherits the shell's environment, so `WORDCELL_APP_VERSION=A` on the command line
sets the menu footer to `A` (`scripts/app-version.mjs`); unset, the footer is
`<version> (<7-char sha>)`.

Once a service worker controls the tailnet origin it answers `/seed.html` with the app, so the seed
page never runs: clear the origin's site data before every seed, re-seed or fresh-install read. The
seed page's own unregister is only a guard for an uncontrolled first visit.

## Clearing site data

Every seed, re-seed or fresh-install read starts from cleared site data; the update read (G3) keeps it
from A to B, and Desktop rows clear per new build (below).

1. Close every WordCell window: swipe the installed app from recents and close every Chrome tab on
   the tailnet origin. A window left running would, on resume, write its game over a seeded
   `wordcell:session` (AD-9 hide flush). After closing the tabs, wait until Chrome's Undo snackbar
   is gone (unverified).
2. On the phone: Chrome ⋮ → Settings → Site settings → All sites → the tailnet origin → Delete data
   or Clear & reset (unverified). Skip this step if the origin is not listed: it has no data yet.
   This path needs no open tab on the origin.

## Install and offline readiness (G1, G2)

Clear site data as above, run `node scripts/device-preview.mjs` (no fixture; it prints the "Fresh
install" line) and open the printed `<url>/` on the phone.

- Install from a Chrome tab on the origin through Chrome's own install UI (G1).
- Offline readiness (G2): after the first online launch, keep the app open about a minute on Wi-Fi,
  close every WordCell window and relaunch once online (the worker now controls it), or check that
  chrome://serviceworker-internals shows the worker ACTIVATED (unverified). Then relaunch in
  airplane mode and read G2.

## Seeded reads (G4–G6)

1. Clear site data as above (every WordCell window closed first).
2. Run the script with the row's fixture:

   | Row | Command |
   | --- | --- |
   | G4 | `node scripts/device-preview.mjs session-place-free-letter-redo-tail`, then `node scripts/device-preview.mjs session-gave-up` (each its own run and seed: Ctrl+C the first, then repeat from step 1; the other G4 boundaries by play) |
   | G5 | `node scripts/device-preview.mjs session-won-words` |
   | G6 | `node scripts/device-preview.mjs --history history-invalid-null` (history-only seed) |

3. On the phone, with Tailscale connected, open the printed `/seed.html` URL. It stores the
   fixture and opens the app in that tab.
4. If the app is not installed, install it from that tab (Chrome's own install UI, G1).
5. Close the Chrome tab promptly without playing: the seed page's redirect booted the game there,
   and closing it runs the AD-9 hide flush.
6. Launch the installed app cold: from the app icon, with no WordCell window in recents (swipe away
   any app window the install opened (unverified)), then read the row.

A re-seed (the same or another fixture): Ctrl+C the running script first (one run at a time, port
4173), then repeat from step 1.

## Desktop rows (G20–G22)

Read from a no-fixture run: open the tailnet URL (or `localhost:4173`) in desktop Chrome, clear its
site data before reading a new build (the tailnet URL and `localhost:4173` are separate origins:
clear each one opened), and confirm the menu footer before recording the row.

## Update read (G3)

The one read that keeps site data. Steps follow `device-checks.md` G3's order. Wherever a window
shows the Q-38 message ("WordCell is open in another window."), tap its Reload, then read the menu
footer (a reload never activates the waiting worker, AD-16, A-A15). No prompt appears at any point.
`A` and `B` carry no commit: record `git rev-parse --short=7 HEAD` next to each footer in the epic
Notes.

1. Build A: `WORDCELL_APP_VERSION=A node scripts/device-preview.mjs` (it prints the "Fresh install"
   line).
2. With every WordCell window closed, clear site data as above.
3. If the app is installed, launch it online; otherwise open `<url>/` in Chrome, install (G1),
   close the tab and launch the app.
4. A's readiness step (G2's, above), while A's server still runs.
5. Ctrl+C (stops A's server), then build and serve B, keeping site data:
   `WORDCELL_APP_VERSION=B node scripts/device-preview.mjs` (it prints "Update read (G3): keep site
   data."). Both runs build; never `--no-build` here.
6. Close every WordCell window (swipe the app from recents, close every Chrome tab on the origin),
   then launch cold: footer A (B is fetched; a resume fetches nothing, A-A15). Footer B here is a
   spoiled read (see below).
7. Readiness: keep the app open about a minute on Wi-Fi, or see B waiting in
   chrome://serviceworker-internals (unverified).
8. With the app left in recents, open the same URL in a Chrome tab: footer A.
9. Resume the app from recents: still A. If the resume visibly reboots, record the renderer as
   discarded: footer B there is consistent only if the Chrome tab also shows a fresh boot or is
   gone; otherwise it is an activation-timing failure (owner question, G3's Disposition)
   (unverified).
10. Close every WordCell window, the app in recents and every Chrome tab on the origin, relaunch:
    footer B.

Afterwards, the next run must build (no `--no-build`) and without `WORDCELL_APP_VERSION`, so the
footer carries the SHA again; a `--no-build` run would keep serving B with footer `B`.

A spoiled read (the first cold launch in step 6 already shows B) is not a fix ticket: redo it once
from step 1: first stop B's run (Ctrl+C, which frees port 4173), then A's command, then cleared
site data as in step 2. A second consecutive spoiled read, after A's
readiness step, is not redone: it routes as G3 says (a fix ticket against this update-read
procedure, or the owner question about AD-16/A-A15 if B was seen activating while a WordCell window
was open); G3 is then resolved when that ticket's re-read passes or Jared's answer is recorded in
the epic Notes.

### Production variant (CAP-10)

On production (`release-checklist.md` Production sequence, entry 12) no `device-preview` run is
involved. A is the installed production build: release-checklist step 2 installs it and runs G2's
readiness step on it, before release-checklist step 3's push. B is the 1.0.0 deploy;
release-checklist step 4 reads Update-read steps 6–10 above on the installed app, with
`1.0.0 (<sha>)` as footer B. A spoiled production read is not a fix ticket: it is redone
at the next deploy or rests on the tailnet G3 read; a second consecutive one, after the old build's
readiness step, routes and resolves as G3 says.

## Before the production install

Uninstall the tailnet-origin app before entry 12's production install (`release-checklist.md`
step 2); otherwise two apps named WordCell are installed.

## Notes

- Android's Remove animations setting turns the celebration and other motion off (reduced motion).
- `dist/seed.html` exists only in that local `dist/`; the next build or a no-fixture run removes
  it, and it never ships (`public/` is untouched).
- Ticket handoffs for a device read name the fixture and the checklist; this page is the setup.
