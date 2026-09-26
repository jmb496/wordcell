# Data

- `enable1.txt` – ENABLE word list (Enhanced North American Benchmark Lexicon), public domain,
  172,823 words, downloaded 2026-09-26 from
  https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt.
  No proper nouns, abbreviations or hyphenated words. The BGA project's `english.txt` was this
  list minus the 99 two-letter words. The build step should filter to lengths 3–10 (125,447 words)
  and emit the file the app loads.
