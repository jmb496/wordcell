# Data

- `enable1.txt` – ENABLE word list (Enhanced North American Benchmark Lexicon), public domain,
  172,823 words, downloaded 2026-09-26 from
  https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt.
  No proper nouns, abbreviations or hyphenated words. The BGA project's `english.txt` (172,724
  words) lacked 99 of the words in `enable1.txt` (172,823): the 96 two-letter words of
  `enable1.txt` plus knickknack, razzmatazz and razzmatazzes. `scripts/build-dictionary.mjs`
  verifies the checksum below and filters to lengths 3–23 (172,713 words) into
  `generated/dictionary/en.txt`, the file the app loads.
  SHA-256: 3f16130220645692ed49c7134e24a18504c2ca55b3c012f7290e3e77c63b1a89

## Font sources

`scripts/build-font.py` verifies both files below and builds `src/ui/assets/wordcell-serif.woff2`
(WordCell Serif, AD-18 Font); `src/ui/assets/OFL.txt` is the verified licence copy.

- `Fraunces[SOFT,WONK,opsz,wght].ttf` – Fraunces upright variable font, SIL OFL 1.1, google/fonts
  commit 4024282d9b0cffcdb8e3024560862746178d741f, downloaded 2026-09-28 from
  https://raw.githubusercontent.com/google/fonts/4024282d9b0cffcdb8e3024560862746178d741f/ofl/fraunces/Fraunces%5BSOFT%2CWONK%2Copsz%2Cwght%5D.ttf
  SHA-256: 177ff6c0f14e5550a3c624247cd1189611d4eb65d000b14944c63d967958abbb
- `OFL.txt` – Fraunces licence text, SIL OFL 1.1, same commit, downloaded 2026-09-28 from
  https://raw.githubusercontent.com/google/fonts/4024282d9b0cffcdb8e3024560862746178d741f/ofl/fraunces/OFL.txt
  SHA-256: bdf4c22802eaf804f998195871c6b8938aac2ac14b2d78a8bd66a6f1eced833b

### Build hashes

Recorded 2026-09-28 (ticket 1.10) and checked by `scripts/asset-hashes.test.mjs`: the input
`scripts/build-font.py` (its `TTF_SHA256` pins the git-ignored TTF) and the output
`src/ui/assets/*.woff2`. After an input edit, rebuild with `uv run scripts/build-font.py`, then
re-record both; regeneration itself stays a manual check.

- `scripts/build-font.py` SHA-256: a13825913c574424bed0ffd95ee5721e9d38cded2bf42228b94ec2b2beb3a2b2
- `src/ui/assets/wordcell-serif.woff2` SHA-256: c2c275327ea1c366e370a5a772781c8b5d6c05f60b548d41bc816a706eaa0dd1

## Icon sources

`node scripts/build-icons.mjs` (host-only, AD-16, A-A7) renders the committed sources
`scripts/icons/icon.svg` and `scripts/icons/icon-maskable.svg` to `public/icons/*.png` and copies
`scripts/icons/favicon.svg` to `public/favicon.svg`, with the card font
`src/ui/assets/wordcell-serif.woff2` (its hash is recorded under Font sources). The committed PNGs
were rendered with Chromium 153.0.8010.12 from @playwright/test 1.63.0. Recorded 2026-09-28
(ticket 1.10) and checked by `scripts/asset-hashes.test.mjs`: inputs `scripts/icons/*.svg` and
`scripts/build-icons.mjs`, outputs `public/icons/*.png` and `public/favicon.svg`. After an input
edit, rerun the script, commit the outputs and re-record; regeneration stays a manual check (A9).

- `scripts/build-icons.mjs` SHA-256: 0b6b7f4f9f76de28c617333764dfc16ccc600bd0073708899d7c44c6d8304ab8
- `scripts/icons/favicon.svg` SHA-256: 6f713b2350fae5757b422c2266f17f5351276d17487795b1d0ec50f4e838b324
- `scripts/icons/icon-maskable.svg` SHA-256: 6c801fe7c7ac6ad9b586fca07b80009d04fa3ec20099dce4d572533a6c637211
- `scripts/icons/icon.svg` SHA-256: 5811a73bc462f1ce41f69a369c78fdf1fab5c2bd1cda9f1d136cc0c3fa89d6eb
- `public/favicon.svg` SHA-256: 6f713b2350fae5757b422c2266f17f5351276d17487795b1d0ec50f4e838b324
- `public/icons/icon-192.png` SHA-256: 9a213352eb68a633b677cc04715f7a75a5e34cde13ad07fe4ff96fa99e41c40c
- `public/icons/icon-512-maskable.png` SHA-256: 5386ecb8716ee96b9eea48483f2bbbcf15b22d12827a875a756077b0994e6839
- `public/icons/icon-512.png` SHA-256: 10fc61f8a7d2c4eb01d2b58b5fcec33e8c9f0112ac08d3baf7dcad3e0a55979a
