import { mount } from 'svelte';
import './shell/test-hook';
import { dictionary } from './shell/dictionary.svelte';
import { game } from './shell/game.svelte';
import { nav } from './shell/nav';
import { prefs } from './shell/prefs.svelte';
import App from './ui/App.svelte';
import { setController } from './ui/act';
import { onDispatched, openAtBoot } from './ui/end-sheet';
import { createFlip, setFlip } from './ui/flip';
import { createController } from './ui/gestures/controller';
import { createGate } from './ui/gestures/gate';
import Halted from './ui/Halted.svelte';
import { openHistoryNotice } from './ui/history-notice.svelte';
import { installKeys } from './ui/keys';
import { browserLayoutDeps, createLayout } from './ui/layout/layout.svelte';
import { trayTileCount } from './ui/layout/tray';
import {
  duration,
  finishGuard,
  hideClear,
  initMotion,
  releaseHold,
  stagger,
  startTracker,
} from './ui/motion';
import { overlays } from './ui/overlays.svelte';
import { applyTheme, defaultTheme, register, testGarden, testPaper } from './ui/theme/registry';
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

// AD-15: halt first, so nothing runs against a live store after the report.
function fatal(reason: unknown, message?: string): void {
  game.halt('fatal', textOf(reason, message));
  // AD-16: the inline head script may have set a theme; the fatal surface wears the default look.
  delete document.documentElement.dataset.theme;
  console.error(reason);
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

// AD-16 first paint: resolves in the second nested animation frame, after the mounted board has
// been painted once.
function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

// A halt can arrive during any await (a function, so TypeScript keeps no stale narrowing).
function halted(): boolean {
  return game.state.kind === 'halted';
}

// AD-16: prefs load and theme apply, nav launch, font check, game load, lifecycle, boot surfaces, mount, then (only
// on the path that mounts App) the dictionary fetch once painted and visible, unless halted
// meanwhile. Not awaited: a failure is an unhandledrejection that writes nothing (AD-8 outcomes
// never reject).
async function boot(): Promise<void> {
  // AD-10, AD-16, Q-45: prefs load and the theme applies first, synchronously, before the first await, so
  // no frame paints the default under a stored theme (a throw, e.g. an unregistered id, reaches AD-15).
  prefs.onThemeChange(applyTheme);
  prefs.load();
  applyTheme(prefs.value.theme);
  // AD-13: rewind and stamp the base entry, then register the overlays before any push.
  await nav.launch();
  nav.register({
    closedByBack: (depth) => overlays.closedByBack(depth),
    depth: () => overlays.depth,
  });
  await fontCheck();
  // AD-10: the motion mirror before the Session load, also when halted meanwhile.
  initMotion();
  game.load();
  if (game.state.kind === 'halted') {
    showStandalone();
    return;
  }
  // AD-11: the one gate; then the live layout (a `?bands=` non-permutation throws here to AD-15
  // in dev), before the controller, which reads its hoverFine (entry 12); then the one FLIP
  // module (AD-14, epic 5 SPEC F6), gate-counted, installed for the act()-wrapped callers and
  // handed to the controller as finishGlides/glidesRunning; then the pointer controller (AD-12,
  // F8; also on the rejected root, where it stays detached), its cancel registered in the hide
  // flush before the gate's scroll reset (AD-9, callbacks run in registration order) and as nav's
  // before-back hook (AD-13 R1/F7), and set once for act() (F9).
  const gate = createGate({
    raf: (callback) => requestAnimationFrame(() => callback()),
    setTimer: (callback, ms) => setTimeout(callback, ms),
    clearTimer: (handle) => clearTimeout(handle),
  });
  const layout = createLayout(
    gate,
    browserLayoutDeps(() => (game.view === undefined ? 0 : trayTileCount(game.view))),
  );
  const flip = createFlip({
    gate,
    layout,
    root: () => target.querySelector('main'),
    reduced: () => prefs.motion.reduced,
    phase: () => game.view?.phase,
    duration,
    stagger,
    dispatched: (result, whenSettled) => {
      onDispatched(result, whenSettled);
      // Ticket 6.12: an Undo dispatch drops the guard's hold beside onUnfinished's cancel.
      if (result.unfinished === true) releaseHold();
    },
  });
  setFlip(flip);
  // AD-14 (F8): the always-on open-gesture tracker, once, before the controller is created.
  startTracker(
    document,
    window,
    () => performance.now(),
    {
      setTimer: (callback, ms) => setTimeout(callback, ms),
      clearTimer: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
    },
    () => game.view?.canUndo === true,
  );
  const controller = createController(gate, {
    elementFromPoint: (x, y) => document.elementFromPoint(x, y),
    setTimer: (callback, ms) => setTimeout(callback, ms),
    clearTimer: (handle) => clearTimeout(handle),
    hoverFine: () => layout.hoverFine,
    watchHoverFine: (callback) => layout.watchHoverFine(callback),
    w: () => layout.w,
    trayInnerWidth: () => layout.trayInnerWidth,
    finishGlides: () => flip.finishAll(),
    glidesRunning: () => flip.running(),
    capture: () => flip.capture(),
    play: (command, result) => flip.play(command, result),
  });
  game.registerBeforeHide(() => controller.cancel());
  game.registerBeforeHide(() => gate.scrollReset());
  game.registerBeforeHide(() => finishGuard());
  game.registerBeforeHide(() => hideClear());
  nav.registerBeforeBack(() => {
    controller.cancel({ byBack: true });
    finishGuard();
  });
  setController(controller);
  // AD-16 order: lifecycle listeners (and the visible-time clock) right after the load, before mount.
  game.registerLifecycle();
  // AD-16 boot surfaces: the end sheet's entry first (R-73), then the History notice (active store, unreadable history; once per launch).
  openAtBoot();
  openHistoryNotice();
  mount(App, { target, props: { layout, controller } });
  // Epic 6 CAP-10: the one key handler, after the mount (it reads the store and the overlays).
  installKeys(window);
  surface = true;
  await nextPaint();
  if (halted()) return;
  await game.whenVisible();
  if (halted()) return;
  await dictionary.load();
}

// AD-17: the test-only `paper` and `garden` entries, in builds carrying the test hook, before boot.
// `garden` (epic themes TH-9) also loads its stylesheet, awaited so source order puts it after app.css.
register(defaultTheme);
async function start(): Promise<void> {
  if (import.meta.env.DEV || import.meta.env.VITE_TEST_HOOKS === '1') {
    register(testPaper);
    register(testGarden);
    await import('./ui/theme/garden.css');
  }
  void boot();
}
void start();
