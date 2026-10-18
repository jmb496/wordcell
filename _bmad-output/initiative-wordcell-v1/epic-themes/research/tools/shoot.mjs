// Renders each mockup to mockups/<id>.png at 360x740 (needs a Playwright install; path from argv[2]).
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(join(process.argv[2], 'package.json'));
const { chromium } = require('playwright');
const here = dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2 });
for (const id of ['default', 'scifi', 'garden', 'steampunk', 'paper', 'dusk']) {
  await p.goto(pathToFileURL(join(here, '..', 'mockups', `${id}.html`)).href);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: join(here, '..', 'mockups', `${id}.png`) });
}
await b.close();
