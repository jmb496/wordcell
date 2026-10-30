import { afterEach, describe, expect, it, vi } from 'vitest';

// AD-16 worker registration (epic 7 SPEC CAP-1, F2) and the Q-40 failure split (CAP-1, F5) over a
// faked `Workbox`: the registration and its workers are `EventTarget`s with mutable slots and
// `state`; the registration fires `updatefound`. Fresh `sw-state` and `sw` per case (the state is
// module state); `navigator`, `reportError` and the hook gate are stubbed per case.

class FakeWorker extends EventTarget {
  scriptURL = 'http://localhost/sw.js';
  state = 'installing';
  statechangeListeners = 0;
  override addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean,
  ): void {
    if (type === 'statechange') this.statechangeListeners++;
    super.addEventListener(type, listener, options);
  }
  move(state: string): void {
    this.state = state;
    this.dispatchEvent(new Event('statechange'));
  }
}

class FakeRegistration extends EventTarget {
  installing: FakeWorker | null = null;
  waiting: FakeWorker | null = null;
  active: FakeWorker | null = null;
}

const fake = vi.hoisted(() => ({
  constructed: [] as unknown[][],
  construct: (): void => {},
  messageSkipWaiting: [] as unknown[][],
  messageSW: [] as unknown[][],
  register: (): Promise<unknown> => Promise.reject(new Error('fake register not set')),
}));

vi.mock('workbox-window', () => ({
  Workbox: class {
    constructor(...args: unknown[]) {
      fake.construct();
      fake.constructed.push(args);
    }
    register(): Promise<unknown> {
      return fake.register();
    }
    messageSkipWaiting(...args: unknown[]): void {
      fake.messageSkipWaiting.push(args);
    }
    messageSW(...args: unknown[]): Promise<unknown> {
      fake.messageSW.push(args);
      return Promise.resolve(undefined);
    }
  },
}));

/** The slot → `ServiceWorkerState` a worker in that slot has. */
const STATE = { installing: 'installing', waiting: 'installed', active: 'activated' } as const;
type Slot = keyof typeof STATE;

interface LoadOptions {
  /** What `register()` returns (default: rejects). */
  readonly registration?: Promise<unknown>;
  /** `register()` rejects with this, created only when called (no unhandled rejection). */
  readonly rejection?: unknown;
  /** The hook gate `VITE_TEST_HOOKS === '1'` (default on). */
  readonly gate?: boolean;
  /** `navigator.serviceWorker` present (default) or absent (F5). */
  readonly container?: boolean;
  /** Runs inside the faked `Workbox` constructor. */
  readonly construct?: () => void;
}

async function load(options: LoadOptions = {}) {
  vi.resetModules();
  fake.constructed = [];
  fake.construct = options.construct ?? (() => {});
  fake.messageSkipWaiting = [];
  fake.messageSW = [];
  const { registration, rejection } = options;
  fake.register =
    registration !== undefined
      ? () => registration
      : () => Promise.reject(rejection ?? new Error('fake register not set'));
  // Node 24 has a global `navigator`: stub it whole, so `serviceWorker` is absent exactly for F5.
  vi.stubGlobal('navigator', options.container === false ? {} : { serviceWorker: {} });
  const reportError = vi.fn();
  vi.stubGlobal('reportError', reportError);
  vi.stubEnv('VITE_TEST_HOOKS', options.gate === false ? '' : '1');
  const { swState } = await import('./sw-state');
  const { registerWorker } = await import('./sw');
  return { swState, registerWorker, reportError };
}

function worker(state: string): FakeWorker {
  const next = new FakeWorker();
  next.state = state;
  return next;
}

/** A worker in the state its slot implies. */
function slotted(slot: Slot): FakeWorker {
  return worker(STATE[slot]);
}

function registrationWith(
  slots: Partial<Pick<FakeRegistration, 'installing' | 'waiting' | 'active'>>,
) {
  return Object.assign(new FakeRegistration(), slots);
}

/** Gate off: no report; gate on: exactly one `Error` whose message starts `Q-40`. */
function expectReport(reportError: ReturnType<typeof vi.fn>, gate: boolean): Error | undefined {
  if (!gate) {
    expect(reportError).not.toHaveBeenCalled();
    return undefined;
  }
  expect(reportError).toHaveBeenCalledTimes(1);
  const [error] = reportError.mock.calls[0] ?? [];
  expect(error).toBeInstanceOf(Error);
  expect((error as Error).message).toMatch(/^Q-40 /);
  return error as Error;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  expect(fake.messageSkipWaiting).toEqual([]);
  expect(fake.messageSW).toEqual([]);
});

describe('AD-16 worker registration and state', () => {
  it('AD-16 the state is unregistered until register() resolves; Workbox gets /sw.js at scope /', async () => {
    let resolve: (value: FakeRegistration) => void = () => {};
    const pending = new Promise<FakeRegistration>((r) => {
      resolve = r;
    });
    const { swState, registerWorker, reportError } = await load({ registration: pending });
    expect(swState()).toBe('unregistered');
    const attempt = registerWorker();
    expect(fake.constructed).toEqual([['/sw.js', { scope: '/' }]]);
    await Promise.resolve();
    expect(swState()).toBe('unregistered');
    resolve(registrationWith({ active: slotted('active') }));
    await attempt;
    expect(swState()).toBe('active');
    expect(reportError).not.toHaveBeenCalled();
  });

  it('AD-16 an empty registration is unregistered', async () => {
    const { swState, registerWorker, reportError } = await load({
      registration: Promise.resolve(registrationWith({})),
    });
    await registerWorker();
    expect(swState()).toBe('unregistered');
    expect(reportError).not.toHaveBeenCalled();
  });

  it.each(Object.entries(STATE) as [Slot, string][])(
    'AD-16 a pre-existing %s worker (state %s) alone gives the slot name',
    async (slot) => {
      const { swState, registerWorker, reportError } = await load({
        registration: Promise.resolve(registrationWith({ [slot]: slotted(slot) })),
      });
      await registerWorker();
      expect(swState()).toBe(slot);
      expect(reportError).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['waiting+installing', ['waiting', 'installing'], 'waiting'],
    ['waiting+active', ['waiting', 'active'], 'waiting'],
    ['all three', ['installing', 'waiting', 'active'], 'waiting'],
    ['installing+active', ['installing', 'active'], 'installing'],
  ] as const)('AD-16 %s gives %s by precedence', async (_, slots, expected) => {
    const filled = Object.fromEntries(slots.map((slot: Slot) => [slot, slotted(slot)]));
    const { swState, registerWorker, reportError } = await load({
      registration: Promise.resolve(registrationWith(filled)),
    });
    await registerWorker();
    expect(swState()).toBe(expected);
    expect(reportError).not.toHaveBeenCalled();
  });

  it("AD-16 an update found later through the module's own updatefound gives installing, then waiting on its statechange", async () => {
    const registration = registrationWith({ active: slotted('active') });
    const { swState, registerWorker, reportError } = await load({
      registration: Promise.resolve(registration),
    });
    await registerWorker();
    expect(swState()).toBe('active');
    const update = slotted('installing');
    registration.installing = update;
    registration.dispatchEvent(new Event('updatefound'));
    expect(swState()).toBe('installing');
    expect(update.statechangeListeners).toBe(1);
    registration.installing = null;
    registration.waiting = update;
    update.move(STATE.waiting);
    expect(swState()).toBe('waiting');
    expect(reportError).not.toHaveBeenCalled();
  });

  it('AD-16 a statechange moving a worker installing → waiting → active recomputes each time', async () => {
    const moving = slotted('installing');
    const registration = registrationWith({ installing: moving });
    const { swState, registerWorker, reportError } = await load({
      registration: Promise.resolve(registration),
    });
    await registerWorker();
    expect(swState()).toBe('installing');
    registration.installing = null;
    registration.waiting = moving;
    moving.move(STATE.waiting);
    expect(swState()).toBe('waiting');
    registration.waiting = null;
    registration.active = moving;
    moving.move('activating');
    expect(swState()).toBe('active');
    expect(moving.statechangeListeners).toBe(1);
    expect(reportError).not.toHaveBeenCalled();
  });

  it('AD-16 a worker present at register() that also fires updatefound gets one statechange listener', async () => {
    const present = slotted('installing');
    const registration = registrationWith({ installing: present });
    const { swState, registerWorker, reportError } = await load({
      registration: Promise.resolve(registration),
    });
    await registerWorker();
    registration.dispatchEvent(new Event('updatefound'));
    expect(present.statechangeListeners).toBe(1);
    expect(swState()).toBe('installing');
    expect(reportError).not.toHaveBeenCalled();
  });
});

const GATES = [
  ['gate off', false],
  ['gate on', true],
] as const;

describe('AD-16 Q-40 failure split', () => {
  it.each(GATES)(
    'AD-16 first-install redundant: an installing worker present at register() turns redundant → failed (%s)',
    async (_, gate) => {
      const installing = slotted('installing');
      const registration = registrationWith({ installing });
      const { swState, registerWorker, reportError } = await load({
        registration: Promise.resolve(registration),
        gate,
      });
      await registerWorker();
      expect(swState()).toBe('installing');
      registration.installing = null;
      installing.move('redundant');
      expect(swState()).toBe('failed');
      expectReport(reportError, gate);
    },
  );

  it.each(GATES)(
    'AD-16 update failure: an older active and a failing installing worker, both at register() → failed (%s)',
    async (_, gate) => {
      const installing = slotted('installing');
      const registration = registrationWith({ active: slotted('active'), installing });
      const { swState, registerWorker, reportError } = await load({
        registration: Promise.resolve(registration),
        gate,
      });
      await registerWorker();
      expect(swState()).toBe('installing');
      // Still in its slot when its statechange fires: a redundant worker never counts as newer.
      installing.move('redundant');
      expect(swState()).toBe('failed');
      expectReport(reportError, gate);
    },
  );

  it.each(GATES)(
    'AD-16 update failure: an older active and a failing installing worker, both at register(), installing slot cleared before its statechange → failed (%s)',
    async (_, gate) => {
      const installing = slotted('installing');
      const registration = registrationWith({ active: slotted('active'), installing });
      const { swState, registerWorker, reportError } = await load({
        registration: Promise.resolve(registration),
        gate,
      });
      await registerWorker();
      expect(swState()).toBe('installing');
      registration.installing = null;
      installing.move('redundant');
      expect(swState()).toBe('failed');
      expectReport(reportError, gate);
    },
  );

  it.each(GATES)(
    'AD-16 slot ranking active < waiting: an activated active and a waiting worker, both at register(), the waiting one redundant while still slotted → failed (%s)',
    async (_, gate) => {
      const waiting = slotted('waiting');
      const registration = registrationWith({ active: slotted('active'), waiting });
      const { swState, registerWorker, reportError } = await load({
        registration: Promise.resolve(registration),
        gate,
      });
      await registerWorker();
      expect(swState()).toBe('waiting');
      waiting.move('redundant');
      expect(swState()).toBe('failed');
      expectReport(reportError, gate);
    },
  );

  it.each(GATES)(
    "AD-16 a second update found later through the module's own updatefound, redundant with no newer worker → failed (%s)",
    async (_, gate) => {
      const first = slotted('active');
      const registration = registrationWith({ active: first });
      const { swState, registerWorker, reportError } = await load({
        registration: Promise.resolve(registration),
        gate,
      });
      await registerWorker();
      // U1: found, installed, activated (the first worker turns redundant after it activated).
      const u1 = slotted('installing');
      registration.installing = u1;
      registration.dispatchEvent(new Event('updatefound'));
      registration.installing = null;
      registration.waiting = u1;
      u1.move(STATE.waiting);
      expect(swState()).toBe('waiting');
      registration.waiting = null;
      registration.active = u1;
      u1.move(STATE.active);
      first.move('redundant');
      expect(swState()).toBe('active');
      expect(reportError).not.toHaveBeenCalled();
      // U2: found, then redundant with nothing newer.
      const u2 = slotted('installing');
      registration.installing = u2;
      registration.dispatchEvent(new Event('updatefound'));
      expect(swState()).toBe('installing');
      registration.installing = null;
      u2.move('redundant');
      expect(swState()).toBe('failed');
      expectReport(reportError, gate);
    },
  );

  it.each(GATES)(
    'AD-16 a rejected register() → failed and the attempt resolves (%s)',
    async (_, gate) => {
      const rejection = new Error('blocked');
      const { swState, registerWorker, reportError } = await load({
        rejection,
        gate,
      });
      await expect(registerWorker()).resolves.toBeUndefined();
      expect(swState()).toBe('failed');
      const error = expectReport(reportError, gate);
      if (gate) expect(error?.cause).toBe(rejection);
    },
  );

  it.each(GATES)(
    'AD-16 a register() resolving undefined → failed and the attempt resolves (%s)',
    async (_, gate) => {
      const { swState, registerWorker, reportError } = await load({
        registration: Promise.resolve(undefined),
        gate,
      });
      await expect(registerWorker()).resolves.toBeUndefined();
      expect(swState()).toBe('failed');
      expectReport(reportError, gate);
    },
  );

  it.each(GATES)(
    'AD-16 an absent navigator.serviceWorker → failed and Workbox never constructed (%s)',
    async (_, gate) => {
      const { swState, registerWorker, reportError } = await load({ container: false, gate });
      expect(navigator.serviceWorker).toBeUndefined();
      await expect(registerWorker()).resolves.toBeUndefined();
      expect(fake.constructed).toEqual([]);
      expect(swState()).toBe('failed');
      expectReport(reportError, gate);
    },
  );

  it.each(GATES)(
    'AD-16 a lone installing worker already redundant at the first slot read → failed (%s)',
    async (_, gate) => {
      const { swState, registerWorker, reportError } = await load({
        registration: Promise.resolve(registrationWith({ installing: worker('redundant') })),
        gate,
      });
      await registerWorker();
      expect(swState()).toBe('failed');
      expectReport(reportError, gate);
    },
  );

  it('AD-16 sticky: a second failure leaves failed with no second reportError call', async () => {
    const installing = slotted('installing');
    const registration = registrationWith({ installing });
    const { swState, registerWorker, reportError } = await load({
      registration: Promise.resolve(registration),
    });
    await registerWorker();
    registration.installing = null;
    installing.move('redundant');
    expect(swState()).toBe('failed');
    const update = slotted('installing');
    registration.installing = update;
    registration.dispatchEvent(new Event('updatefound'));
    expect(swState()).toBe('failed');
    registration.installing = null;
    registration.waiting = update;
    update.move(STATE.waiting);
    expect(swState()).toBe('failed');
    registration.waiting = null;
    update.move('redundant');
    expect(swState()).toBe('failed');
    expectReport(reportError, true);
  });

  it('AD-16 replacement: a waiting worker superseded by an installing one, both at register(), still slotted when it turns redundant → not failed', async () => {
    const waiting = slotted('waiting');
    const registration = registrationWith({ waiting, installing: slotted('installing') });
    const { swState, registerWorker, reportError } = await load({
      registration: Promise.resolve(registration),
    });
    await registerWorker();
    waiting.move('redundant');
    expect(swState()).toBe('waiting');
    expect(reportError).not.toHaveBeenCalled();
  });

  it('AD-16 a replaced worker is judged once: after its replacement activates and later turns redundant with every slot empty → not failed', async () => {
    const waiting = slotted('waiting');
    const installing = slotted('installing');
    const registration = registrationWith({ waiting, installing });
    const { swState, registerWorker, reportError } = await load({
      registration: Promise.resolve(registration),
    });
    await registerWorker();
    registration.waiting = null;
    waiting.move('redundant');
    expect(swState()).toBe('installing');
    registration.installing = null;
    registration.active = installing;
    installing.move(STATE.active);
    expect(swState()).toBe('active');
    registration.active = null;
    installing.move('redundant');
    expect(swState()).toBe('unregistered');
    expect(reportError).not.toHaveBeenCalled();
  });

  it('AD-16 the report gate is read when the failure fires, not at import', async () => {
    const installing = slotted('installing');
    const registration = registrationWith({ installing });
    const { swState, registerWorker, reportError } = await load({
      registration: Promise.resolve(registration),
      gate: false,
    });
    await registerWorker();
    vi.stubEnv('VITE_TEST_HOOKS', '1');
    registration.installing = null;
    installing.move('redundant');
    expect(swState()).toBe('failed');
    expectReport(reportError, true);
  });

  it('AD-16 activated-then-superseded: an activated worker at register() turns redundant with no newer worker → not failed', async () => {
    const active = slotted('active');
    const registration = registrationWith({ active });
    const { swState, registerWorker, reportError } = await load({
      registration: Promise.resolve(registration),
    });
    await registerWorker();
    registration.active = null;
    active.move('redundant');
    expect(swState()).toBe('unregistered');
    expect(reportError).not.toHaveBeenCalled();
  });

  it('AD-16 a throwing Workbox constructor rejects the attempt and leaves the state unfailed', async () => {
    const thrown = new Error('constructor');
    const { swState, registerWorker, reportError } = await load({
      construct: () => {
        throw thrown;
      },
    });
    await expect(registerWorker()).rejects.toBe(thrown);
    expect(swState()).toBe('unregistered');
    expect(reportError).not.toHaveBeenCalled();
  });
});
