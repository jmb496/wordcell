import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

// Reads the dist-test/ build from disk for the pwa project (epic Decision: dist-test/ stands in
// for dist/ because VITE_TEST_HOOKS changes only JS).

const root = path.resolve(import.meta.dirname, '../../dist-test');

export function distTest(): string {
  if (!existsSync(path.join(root, 'index.html'))) {
    throw new Error(`${root}/index.html is missing: run npm run build:test (npm run test:e2e:pwa)`);
  }
  return root;
}

export function readSite(sitePath: string): string {
  return readFileSync(path.join(distTest(), sitePath), 'utf8');
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
