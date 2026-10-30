import { afterEach, describe, expect, it, vi } from 'vitest';

// AD-16 worker registration (epic 7 SPEC CAP-1, F2) over a faked `Workbox`: the registration and
// its workers are `EventTarget`s with mutable slots and `state`; the registration fires
// `updatefound`. Fresh `sw-state` and `sw` per case (the state is module state).

class FakeWorker extends EventTarget {
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
  messageSkipWaiting: [] as unknown[][],
  messageSW: [] as unknown[][],
  register: (): Promise<unknown> => Promise.reject(new Error('fake register not set')),
}));

vi.mock('workbox-window', () => ({
  Workbox: class {
    constructor(...args: unknown[]) {
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

async function load(registration: Promise<FakeRegistration>) {
  vi.resetModules();
  fake.constructed = [];
  fake.messageSkipWaiting = [];
  fake.messageSW = [];
  fake.register = () => registration;
  const { swState } = await import('./sw-state');
  const { registerWorker } = await import('./sw');
  return { swState, registerWorker };
}

function worker(state: string): FakeWorker {
  const next = new FakeWorker();
  next.state = state;
  return next;
}

function registrationWith(
  slots: Partial<Pick<FakeRegistration, 'installing' | 'waiting' | 'active'>>,
) {
  return Object.assign(new FakeRegistration(), slots);
}

afterEach(() => {
  expect(fake.messageSkipWaiting).toEqual([]);
  expect(fake.messageSW).toEqual([]);
});

describe('AD-16 worker registration and state', () => {
  it('AD-16 the state is unregistered until register() resolves; Workbox gets /sw.js at scope /', async () => {
    let resolve: (value: FakeRegistration) => void = () => {};
    const pending = new Promise<FakeRegistration>((r) => {
      resolve = r;
    });
    const { swState, registerWorker } = await load(pending);
    expect(swState()).toBe('unregistered');
    const attempt = registerWorker();
    expect(fake.constructed).toEqual([['/sw.js', { scope: '/' }]]);
    await Promise.resolve();
    expect(swState()).toBe('unregistered');
    resolve(registrationWith({ active: worker('activated') }));
    await attempt;
    expect(swState()).toBe('active');
  });

  it('AD-16 an empty registration is unregistered', async () => {
    const { swState, registerWorker } = await load(Promise.resolve(registrationWith({})));
    await registerWorker();
    expect(swState()).toBe('unregistered');
  });

  it.each([
    ['installing', 'installing'],
    ['waiting', 'installed'],
    ['active', 'activated'],
  ] as const)(
    'AD-16 a pre-existing %s worker (state %s) alone gives the slot name',
    async (slot, state) => {
      const { swState, registerWorker } = await load(
        Promise.resolve(registrationWith({ [slot]: worker(state) })),
      );
      await registerWorker();
      expect(swState()).toBe(slot);
    },
  );

  it.each([
    ['waiting+installing', ['waiting', 'installing'], 'waiting'],
    ['waiting+active', ['waiting', 'active'], 'waiting'],
    ['all three', ['installing', 'waiting', 'active'], 'waiting'],
    ['installing+active', ['installing', 'active'], 'installing'],
  ] as const)('AD-16 %s gives %s by precedence', async (_, slots, expected) => {
    const filled = Object.fromEntries(slots.map((slot) => [slot, worker(slot)]));
    const { swState, registerWorker } = await load(Promise.resolve(registrationWith(filled)));
    await registerWorker();
    expect(swState()).toBe(expected);
  });

  it("AD-16 an update found later through the module's own updatefound gives installing", async () => {
    const registration = registrationWith({ active: worker('activated') });
    const { swState, registerWorker } = await load(Promise.resolve(registration));
    await registerWorker();
    expect(swState()).toBe('active');
    const update = worker('installing');
    registration.installing = update;
    registration.dispatchEvent(new Event('updatefound'));
    expect(swState()).toBe('installing');
    expect(update.statechangeListeners).toBe(1);
  });

  it('AD-16 a statechange moving a worker installing → waiting → active recomputes each time', async () => {
    const moving = worker('installing');
    const registration = registrationWith({ installing: moving });
    const { swState, registerWorker } = await load(Promise.resolve(registration));
    await registerWorker();
    expect(swState()).toBe('installing');
    registration.installing = null;
    registration.waiting = moving;
    moving.move('installed');
    expect(swState()).toBe('waiting');
    registration.waiting = null;
    registration.active = moving;
    moving.move('activating');
    expect(swState()).toBe('active');
    expect(moving.statechangeListeners).toBe(1);
  });

  it('AD-16 a worker present at register() that also fires updatefound gets one statechange listener', async () => {
    const present = worker('installing');
    const registration = registrationWith({ installing: present });
    const { swState, registerWorker } = await load(Promise.resolve(registration));
    await registerWorker();
    registration.dispatchEvent(new Event('updatefound'));
    expect(present.statechangeListeners).toBe(1);
    expect(swState()).toBe('installing');
  });
});
