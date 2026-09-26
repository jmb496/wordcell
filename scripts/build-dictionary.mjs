// Filters the ENABLE list to the word lengths WordCell can use (3–10 letters) and writes the
// file the app fetches. Run by `npm run build`; idempotent.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const MIN = 3;
const MAX = 10;
const source = readFileSync(new URL('../data/enable1.txt', import.meta.url), 'utf8');
const words = source
  .split(/\r?\n/)
  .map((w) => w.trim().toLowerCase())
  .filter((w) => w.length >= MIN && w.length <= MAX && /^[a-z]+$/.test(w));

mkdirSync(new URL('../public/dictionary', import.meta.url), { recursive: true });
writeFileSync(new URL('../public/dictionary/en.txt', import.meta.url), `${words.join('\n')}\n`);
console.log(`dictionary: ${words.length} words (${MIN}–${MAX} letters) → public/dictionary/en.txt`);
