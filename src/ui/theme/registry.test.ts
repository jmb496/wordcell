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
    const { applyTheme, defaultTheme, entries, register, paperTheme } = await fresh();
    register(defaultTheme);
    register(paperTheme);
    expect(entries().map((entry) => entry.id)).toEqual(['default', 'paper']);
    applyTheme('paper');
    expect(root.dataset.theme).toBe('paper');
    expect(meta.content).toBe(paperTheme.meta);
    applyTheme('default');
    expect(root.dataset.theme).toBe('default');
    expect(meta.content).toBe(defaultTheme.meta);
  });

  it('AD-10 scifiTheme has id scifi, the Deep Space label and meta #0A0F1C, and applies', async () => {
    const { meta, root } = stubDocument();
    const { applyTheme, defaultTheme, register, scifiTheme } = await fresh();
    const { text } = await import('../text');
    register(defaultTheme);
    register(scifiTheme);
    expect(scifiTheme).toEqual({ id: 'scifi', label: text.themeDeepSpace, meta: '#0A0F1C' });
    applyTheme('scifi');
    expect(root.dataset.theme).toBe('scifi');
    expect(meta.content).toBe('#0A0F1C');
  });

  it('AD-10 gardenTheme registers as garden with meta #101A14', async () => {
    const { meta, root } = stubDocument();
    const { applyTheme, defaultTheme, entries, gardenTheme, register } = await fresh();
    const { text } = await import('../text');
    register(defaultTheme);
    register(gardenTheme);
    expect(entries().map((entry) => entry.id)).toEqual(['default', 'garden']);
    expect(gardenTheme).toEqual({
      id: 'garden',
      label: text.themeGreenhouseDusk,
      meta: '#101A14',
    });
    applyTheme('garden');
    expect(root.dataset.theme).toBe('garden');
    expect(meta.content).toBe('#101A14');
  });

  it('AD-10 an unregistered id throws and changes nothing', async () => {
    const { meta, root } = stubDocument();
    const { applyTheme, defaultTheme, register } = await fresh();
    register(defaultTheme);
    expect(() => applyTheme('plum')).toThrow("AD-10 theme 'plum' is not registered");
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
