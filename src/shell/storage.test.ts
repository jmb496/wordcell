import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  HISTORY_KEY,
  isLocalArea,
  PREFS_KEY,
  read,
  remove,
  requestPersistence,
  SESSION_KEY,
  write,
} from './storage';

function fakeStorage(entries: Record<string, string> = {}) {
  const map = new Map(Object.entries(entries));
  return {
    map,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('storage.ts', () => {
  it('AD-7 keys are the three wordcell: keys', () => {
    expect([SESSION_KEY, HISTORY_KEY, PREFS_KEY]).toEqual([
      'wordcell:session',
      'wordcell:history',
      'wordcell:prefs',
    ]);
  });

  it('AD-7 read returns null for an absent key and the stored text otherwise', () => {
    vi.stubGlobal('localStorage', fakeStorage({ 'wordcell:prefs': 'p' }));
    expect(read(SESSION_KEY)).toBeNull();
    expect(read(PREFS_KEY)).toBe('p');
  });

  it('AD-7 write stores the text verbatim', () => {
    const storage = fakeStorage();
    vi.stubGlobal('localStorage', storage);
    write(SESSION_KEY, '{"x": 1}');
    expect(storage.map.get('wordcell:session')).toBe('{"x": 1}');
  });

  it('AD-7 a throwing write throws through', () => {
    const error = new Error('QuotaExceededError');
    vi.stubGlobal('localStorage', {
      ...fakeStorage(),
      setItem: () => {
        throw error;
      },
    });
    expect(() => write(SESSION_KEY, 's')).toThrow(error);
  });

  it('AD-7 remove deletes the key', () => {
    const storage = fakeStorage({ 'wordcell:history': 'h', 'wordcell:session': 's' });
    vi.stubGlobal('localStorage', storage);
    remove(HISTORY_KEY);
    expect([...storage.map.keys()]).toEqual(['wordcell:session']);
  });

  it('AD-7 localStorage is looked up at call time', () => {
    vi.stubGlobal('localStorage', fakeStorage({ 'wordcell:session': 'first' }));
    expect(read(SESSION_KEY)).toBe('first');
    const second = fakeStorage({ 'wordcell:session': 'second' });
    vi.stubGlobal('localStorage', second);
    expect(read(SESSION_KEY)).toBe('second');
    write(SESSION_KEY, 'third');
    expect(second.map.get('wordcell:session')).toBe('third');
  });

  it('AD-7 isLocalArea is true only for the localStorage object', () => {
    const local = fakeStorage();
    vi.stubGlobal('localStorage', local);
    expect(isLocalArea(local as unknown as Storage)).toBe(true);
    expect(isLocalArea(fakeStorage() as unknown as Storage)).toBe(false);
    expect(isLocalArea(null)).toBe(false);
  });
});

// AD-7, epic 7 SPEC CAP-3. Node's global `navigator` has no `storage`, so every case stubs it.
describe('AD-7 requestPersistence', () => {
  function stubStorage(persisted: () => Promise<boolean>, persist: () => Promise<boolean>) {
    const fakes = { persisted: vi.fn(persisted), persist: vi.fn(persist) };
    vi.stubGlobal('navigator', { storage: fakes });
    return fakes;
  }

  it('AD-7 an absent navigator.storage resolves undefined without throwing', async () => {
    vi.stubGlobal('navigator', {});
    await expect(requestPersistence()).resolves.toBeUndefined();
  });

  it('AD-7 persisted() true: no persist() call', async () => {
    const fakes = stubStorage(
      () => Promise.resolve(true),
      () => Promise.resolve(true),
    );
    await expect(requestPersistence()).resolves.toBeUndefined();
    expect(fakes.persisted).toHaveBeenCalledTimes(1);
    expect(fakes.persist).not.toHaveBeenCalled();
  });

  it('AD-7 persisted() false: exactly one persist() call, its false result ignored', async () => {
    const fakes = stubStorage(
      () => Promise.resolve(false),
      () => Promise.resolve(false),
    );
    await expect(requestPersistence()).resolves.toBeUndefined();
    expect(fakes.persisted).toHaveBeenCalledTimes(1);
    expect(fakes.persist).toHaveBeenCalledTimes(1);
  });

  it('AD-7 a rejecting persisted() rejects with its error and calls no persist()', async () => {
    const error = new Error('persisted');
    const fakes = stubStorage(
      () => Promise.reject(error),
      () => Promise.resolve(true),
    );
    await expect(requestPersistence()).rejects.toBe(error);
    expect(fakes.persist).not.toHaveBeenCalled();
  });

  it('AD-7 a rejecting persist() rejects with its error', async () => {
    const error = new Error('persist');
    const fakes = stubStorage(
      () => Promise.resolve(false),
      () => Promise.reject(error),
    );
    await expect(requestPersistence()).rejects.toBe(error);
    expect(fakes.persisted).toHaveBeenCalledTimes(1);
    expect(fakes.persist).toHaveBeenCalledTimes(1);
  });
});
