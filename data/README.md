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
