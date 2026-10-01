import { mount } from 'svelte';
import './shell/test-hook';
// AD-8: side-effect import so Vite emits the hashed en-*.txt (an unused named import is tree-shaken).
import './shell/dictionary.svelte';
import { game } from './shell/game.svelte';
import App from './ui/App.svelte';
import Halted from './ui/Halted.svelte';
// Imported before boot so the `@font-face` the font check loads is registered.
import './ui/app.css';

const root = document.getElementById('app');
if (!root) throw new Error('missing #app root element');
const target: HTMLElement = root;

// Set by whichever mount runs first (App or the standalone Blocking message), after it returns.
let surface = false;

// AD-15: the one error surface. Registered once `target` and `surface` exist (the handler uses
// them) and before boot's first await; no preventDefault, so the browser still reports the error
// too. A missing #app throws before them, uncaught.
window.addEventListener('error', (event) => {
  fatal(event.error ?? event.message, event.message);
});
window.addEventListener('unhandledrejection', (event) => {
  fatal(event.reason);
});

// Total and never blank: a blank or unstringifiable reason falls back to `message` (the
// ErrorEvent's), then to its `[object …]` tag.
function textOf(reason: unknown, message = ''): string {
  let text: string;
  try {
    text = reason instanceof Error ? reason.message || reason.name : String(reason);
  } catch {
    text = '';
  }
  if (/\S/.test(text)) return text;
  return /\S/.test(message) ? message : Object.prototype.toString.call(reason);
}

function fatal(reason: unknown, message?: string): void {
  console.error(reason);
  game.halt('fatal', textOf(reason, message));
  showStandalone();
}

// AD-15/Q-38: the halted surface before any mount; once App is mounted it switches reactively.
function showStandalone(): void {
  if (surface) return;
  target.replaceChildren();
  mount(Halted, { target });
  surface = true;
}

// AD-15: the card face must load; an empty list, a rejection or 30 s without settling is fatal.
// The timer reports straight to the `error` handler (`reportError`, as an uncaught throw would,
// but also under Playwright's fake clock, which catches throwing timers), so it must be cleared
// once the load settles; a load settling after it fired reports nothing more.
async function fontCheck(): Promise<void> {
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    reportError(new Error('AD-15 font check timed out after 30000 ms'));
  }, 30_000);
  let faces: FontFace[];
  try {
    faces = await document.fonts.load('600 1em "WordCell Serif"', 'W');
  } catch (error) {
    if (timedOut) return;
    throw error;
  } finally {
    clearTimeout(timer);
  }
  if (timedOut) return;
  if (faces.length === 0) throw new Error('AD-15 font check: WordCell Serif did not load');
}

// AD-16: font check, load, mount. Not awaited: a failure is an unhandledrejection that writes nothing.
async function boot(): Promise<void> {
  await fontCheck();
  game.load();
  if (game.state.kind === 'halted') {
    showStandalone();
    return;
  }
  mount(App, { target });
  surface = true;
}

void boot();
