import { afterEach, describe, expect, it, vi } from 'vitest';

// AD-10 theme registry over a stubbed document (no DOM library): the root's dataset and one meta.

function stubDocument(withMeta = true) {
  const meta = { content: '#15171B' };
  const root = { dataset: {} as Record<string, string> };
  vi.stubGlobal('document', {
    documentElement: root,
    head: { querySelector: () => (withMeta ? meta : null) },
  });
  return { meta, root };
}

async function fresh() {
  vi.resetModules();
  return await import('./registry');
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('theme registry', () => {
  it('AD-10 applyTheme(default) sets data-theme and the meta in place', async () => {
    const { meta, root } = stubDocument();
    const { applyTheme, defaultTheme, register } = await fresh();
    register(defaultTheme);
    meta.content = '#000000';
    applyTheme('default');
    expect(root.dataset.theme).toBe('default');
    expect(meta.content).toBe('#15171B');
  });

  it('AD-10 applyTheme switches between registered entries and entries() lists them in order', async () => {
    const { meta, root } = stubDocument();
    const { applyTheme, defaultTheme, entries, register, testPaper } = await fresh();
    register(defaultTheme);
    register(testPaper);
    expect(entries().map((entry) => entry.id)).toEqual(['default', 'paper']);
    applyTheme('paper');
    expect(root.dataset.theme).toBe('paper');
    expect(meta.content).toBe(testPaper.meta);
    applyTheme('default');
    expect(root.dataset.theme).toBe('default');
    expect(meta.content).toBe(defaultTheme.meta);
  });

  it('AD-10 testGarden registers as garden with the default table colour as its meta (TH-9)', async () => {
    const { meta, root } = stubDocument();
    const { applyTheme, defaultTheme, entries, register, testGarden } = await fresh();
    register(defaultTheme);
    register(testGarden);
    expect(entries().map((entry) => entry.id)).toEqual(['default', 'garden']);
    expect(testGarden.meta).toBe(defaultTheme.meta);
    applyTheme('garden');
    expect(root.dataset.theme).toBe('garden');
    expect(meta.content).toBe(testGarden.meta);
  });

  it('AD-10 an unregistered id throws and changes nothing', async () => {
    const { meta, root } = stubDocument();
    const { applyTheme, defaultTheme, register } = await fresh();
    register(defaultTheme);
    expect(() => applyTheme('scifi')).toThrow("AD-10 theme 'scifi' is not registered");
    expect(root.dataset.theme).toBeUndefined();
    expect(meta.content).toBe('#15171B');
  });

  it('AD-10 a missing theme-color meta throws; a duplicate registration throws', async () => {
    stubDocument(false);
    const { applyTheme, defaultTheme, register } = await fresh();
    register(defaultTheme);
    expect(() => applyTheme('default')).toThrow('AD-16 theme-color meta is missing');
    expect(() => register(defaultTheme)).toThrow('registered twice');
  });
});
