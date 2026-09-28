// @ts-check
// Filters the checksum-pinned ENABLE list to the 3–23-letter words WordCell can use and writes
// generated/dictionary/en.txt, which src/shell/dictionary.svelte.ts imports with `?url` (AD-8).
// No flag: staleness-gated (the pre* hooks). `--force`: always regenerate. `--source <path>`:
// input path, resolved against cwd. Order: parse args → verify checksum → stale check → write.
import { createHash } from 'node:crypto';
import {
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** SHA-256 of the committed data/enable1.txt (data/README.md). */
export const EXPECTED_SHA256 = '3f16130220645692ed49c7134e24a18504c2ca55b3c012f7290e3e77c63b1a89';

const WORD = /^[a-z]{3,23}$/;

/**
 * Keeps each `\n`-separated line that is exactly 3–23 lowercase a–z letters, in order.
 * @param {string} text
 * @returns {string} the kept words joined with `\n` plus a trailing `\n`, or `""` if none
 */
export function filterWords(text) {
  const words = text.split('\n').filter((line) => WORD.test(line));
  return words.length === 0 ? '' : `${words.join('\n')}\n`;
}

/**
 * Accepts only the exact tokens `--force` and `--source <value>`, each at most once.
 * @param {readonly string[]} argv arguments after the script path
 * @returns {{ force: boolean, source: string | null }}
 */
export function parseArgs(argv) {
  let force = false;
  /** @type {string | null} */
  let source = null;
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--force') {
      if (force) throw new Error('build-dictionary: --force given twice');
      force = true;
    } else if (token === '--source') {
      if (source !== null) throw new Error('build-dictionary: --source given twice');
      const value = argv[i + 1];
      if (value === undefined || value === '' || value.startsWith('--')) {
        throw new Error('build-dictionary: --source needs a path value');
      }
      source = value;
      i++;
    } else {
      throw new Error(`build-dictionary: unknown argument ${JSON.stringify(token)}`);
    }
  }
  return { force, source };
}

/**
 * @param {Uint8Array} buffer
 * @returns {string} lowercase hex SHA-256
 */
export function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Throws unless the buffer's SHA-256 equals `expectedHash` exactly.
 * @param {Uint8Array} buffer
 * @param {string} expectedHash lowercase hex
 */
export function verifySource(buffer, expectedHash) {
  const actual = sha256(buffer);
  if (actual !== expectedHash) {
    throw new Error(`build-dictionary: source SHA-256 ${actual} != expected ${expectedHash}`);
  }
}

/**
 * @param {number | null} outMtime output mtime in ms, `null` when the output is missing
 * @param {readonly number[]} inputMtimes input mtimes in ms
 * @returns {boolean} true when the output is missing or older than the newest input (a tie is fresh)
 */
export function isStale(outMtime, inputMtimes) {
  if (inputMtimes.length === 0) throw new Error('build-dictionary: isStale needs inputs');
  if (outMtime === null) return true;
  return outMtime < Math.max(...inputMtimes);
}

function main() {
  const { force, source } = parseArgs(process.argv.slice(2));
  const scriptPath = fileURLToPath(import.meta.url);
  const sourcePath =
    source === null
      ? fileURLToPath(new URL('../data/enable1.txt', import.meta.url))
      : resolve(source);
  const buffer = readFileSync(sourcePath);
  verifySource(buffer, EXPECTED_SHA256);

  const dir = fileURLToPath(new URL('../generated/dictionary/', import.meta.url));
  const out = `${dir}en.txt`;
  if (!force) {
    const outMtime = statSync(out, { throwIfNoEntry: false })?.mtimeMs ?? null;
    const inputMtimes = [statSync(sourcePath).mtimeMs, statSync(scriptPath).mtimeMs];
    if (!isStale(outMtime, inputMtimes)) {
      console.log('dictionary: generated/dictionary/en.txt is up to date');
      return;
    }
  }

  const text = filterWords(buffer.toString('utf8'));
  mkdirSync(dir, { recursive: true });
  const tmp = `${out}.${process.pid}.tmp`;
  writeFileSync(tmp, text);
  renameSync(tmp, out);
  const count = text === '' ? 0 : text.split('\n').length - 1;
  console.log(`dictionary: ${count} words (3–23 letters) → generated/dictionary/en.txt`);
}

if (
  process.argv[1] !== undefined &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
