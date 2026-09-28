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
