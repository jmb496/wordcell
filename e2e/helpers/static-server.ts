import {
  cpSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve, sep } from 'node:path';

// Epic 7 F8: a static server for a temp copy of a build, so a spec can swap or remove files (B's
// `sw.js`, a missing `sw.js`) between requests. Hook-free. Every request is read from disk and
// logged; paths resolve by pathname (the query is ignored), `/` maps to `index.html`, and a missing
// path or a directory gets `index.html` only on a navigation request (`Sec-Fetch-Mode: navigate`),
// otherwise 404 (`/sw.js` included).

export type Logged = { path: string; mode: string | null; status: number };

export type Served = { url: string; requests(): Logged[]; stop(): Promise<void> };

export type Copy = {
  dir: string;
  /** Replaces `file` (relative to `dir`) atomically: a temp file in its dir, then `rename`. */
  swap(file: string, content: string): void;
  /** Deletes `file`; throws if it is missing. */
  remove(file: string): void;
  serve(): Promise<Served>;
  /** Idempotent: closes the server (if serving) and removes `dir`. */
  stop(): Promise<void>;
};

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

let swaps = 0;

export function copy(srcDir: string): Copy {
  const dir = mkdtempSync(join(tmpdir(), 'wordcell-site-'));
  cpSync(srcDir, dir, { recursive: true });
  let served: Served | null = null;
  let closing: Promise<void> | null = null;

  const serve = async (): Promise<Served> => {
    if (served !== null) throw new Error(`${dir} is already served at ${served.url}`);
    const log: Logged[] = [];
    const server = createServer((request, response) => {
      const pathname = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;
      const header = request.headers['sec-fetch-mode'];
      const mode = typeof header === 'string' ? header : null;
      const send = (status: number, file: string | null) => {
        log.push({ path: pathname, mode, status });
        if (file === null) {
          response.writeHead(status, { 'Cache-Control': 'no-store' }).end();
          return;
        }
        const body = readFileSync(file);
        response
          .writeHead(status, {
            'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
            'Content-Length': body.length,
            'Cache-Control': 'no-store',
          })
          .end(body);
      };
      const target = resolve(dir, `.${decodeURIComponent(pathname)}`);
      if (target !== dir && !target.startsWith(dir + sep)) {
        send(404, null);
        return;
      }
      const file = pathname === '/' ? join(dir, 'index.html') : target;
      if (statSync(file, { throwIfNoEntry: false })?.isFile()) {
        send(200, file);
      } else if (mode === 'navigate') {
        send(200, join(dir, 'index.html'));
      } else {
        send(404, null);
      }
    });
    await new Promise<void>((done, fail) => {
      server.once('error', fail);
      server.listen(0, '127.0.0.1', () => done());
    });
    const { port } = server.address() as AddressInfo;
    served = {
      url: `http://127.0.0.1:${port}`,
      requests: () => [...log],
      stop: () => {
        closing ??= (async () => {
          server.closeAllConnections();
          await new Promise<void>((done, fail) =>
            server.close((error) => (error === undefined ? done() : fail(error))),
          );
          rmSync(dir, { recursive: true, force: true });
        })();
        return closing;
      },
    };
    return served;
  };

  return {
    dir,
    swap(file, content) {
      const target = join(dir, file);
      const temp = join(dirname(target), `.swap-${process.pid}-${swaps++}`);
      writeFileSync(temp, content);
      renameSync(temp, target);
    },
    remove(file) {
      rmSync(join(dir, file));
    },
    serve,
    stop() {
      if (served !== null) return served.stop();
      rmSync(dir, { recursive: true, force: true });
      return Promise.resolve();
    },
  };
}
