import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

// Reads the build under test from disk: `PW_PREVIEW` names it (`dist` for the dist-smoke project,
// `dist-test` for the pwa project, playwright.pwa.config.ts).

const BUILD_SCRIPTS = { dist: 'npm run build', 'dist-test': 'npm run build:test' } as const;

// `repo` exists for the AD-17 self-test of the missing-build error (e2e/helpers.spec.ts).
export function buildRoot(repo = path.resolve(import.meta.dirname, '../..')): string {
  const preview = process.env.PW_PREVIEW;
  if (preview !== 'dist' && preview !== 'dist-test') {
    throw new Error(
      `PW_PREVIEW must be exactly 'dist' or 'dist-test' (got ${JSON.stringify(preview)})`,
    );
  }
  const root = path.join(repo, preview);
  if (!existsSync(path.join(root, 'index.html'))) {
    throw new Error(`${root}/index.html is missing: run ${BUILD_SCRIPTS[preview]}`);
  }
  return root;
}

// Epic 7 CAP-6: the `sw.ts` chunk's file, from the build's `.vite/manifest.json` (read from disk:
// vite preview may not serve .vite/). Throws unless `src/shell/sw.ts` is a dynamic entry with a
// file (rule 6). `root` exists for the AD-17 self-test on synthetic manifests (e2e/helpers.spec.ts).
export function swChunkFile(root = buildRoot()): string {
  const manifest = JSON.parse(
    readFileSync(path.join(root, '.vite/manifest.json'), 'utf8'),
  ) as Record<string, { isDynamicEntry?: unknown; file?: unknown } | undefined>;
  const entry = manifest['src/shell/sw.ts'];
  if (entry === undefined) {
    throw new Error(`${root}/.vite/manifest.json has no src/shell/sw.ts key`);
  }
  if (entry.isDynamicEntry !== true) {
    throw new Error(`${root}/.vite/manifest.json src/shell/sw.ts is not a dynamic entry`);
  }
  if (typeof entry.file !== 'string') {
    throw new Error(`${root}/.vite/manifest.json src/shell/sw.ts has no file`);
  }
  return entry.file;
}

export function readSite(sitePath: string): string {
  return readFileSync(path.join(buildRoot(), sitePath), 'utf8');
}

export type Attributes = Map<string, string>;

// Attributes of every <name> tag: names lowercased, values quoted or unquoted, bare booleans ''.
export function tags(html: string, name: string): Attributes[] {
  return [...html.matchAll(new RegExp(`<${name}(?=[\\s/>])([^>]*)>`, 'gi'))].map((tag) => {
    const attributes: Attributes = new Map();
    for (const m of (tag[1] ?? '').matchAll(
      /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g,
    )) {
      attributes.set((m[1] ?? '').toLowerCase(), m[2] ?? m[3] ?? m[4] ?? '');
    }
    return attributes;
  });
}

export function linkTags(html: string): Attributes[] {
  return tags(html, 'link');
}

export function relOf(link: Attributes): string[] {
  return (link.get('rel') ?? '').toLowerCase().split(/\s+/).filter(Boolean);
}

// Every file under `dir`, as sorted POSIX paths relative to it (the precache URL form).
export function walk(dir: string): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) =>
      path.relative(dir, path.join(entry.parentPath, entry.name)).split(path.sep).join('/'),
    )
    .sort();
}
