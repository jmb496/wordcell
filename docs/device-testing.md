# WordCell – Device testing on a phone

How the owner checks a build on a real Android phone (a ticket's device read, gate 4 "Owner checks
at gate 4"), without USB, chrome://inspect or a deploy. First used for ticket 10.6 (2026-10-24).

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

## Each read

1. On the PC, from the repo root:

   ```bash
   node scripts/device-preview.mjs session-won-words
   ```

   It runs `npm run build`, writes `dist/seed.html` for the named `fixtures/<name>.json` Session
   (omit the name for no seed page; `--no-build` reuses the current `dist/`), serves `dist/` with
   `vite preview` on port 4173, shares it with `tailscale serve`, and prints the phone URL. Ctrl+C
   turns the share off and stops the preview. Port 4173 must be free (`npm run test:all` uses it).
2. On the phone, with Tailscale connected: if this origin was opened before, first clear its site
   data (address-bar icon → Site settings → Delete data). The old service worker otherwise serves
   the previous build and answers `/seed.html` with the app.
3. Open the printed URL. `/seed.html` unregisters any service worker, stores the fixture as
   `wordcell:session` and opens the app in that game. Repeat step 3 to reset the game.

Android's Remove animations setting turns the celebration and other motion off (reduced motion).

## Notes

- `dist/seed.html` exists only in that local `dist/`; the next build removes it, and it never
  ships (`public/` is untouched).
- Ticket handoffs for a device read name the fixture and the checklist; this page is the setup.
