import { describe, expect, it } from 'vitest';
import { trayLayout, trayOrder } from './tray';

describe('tray layout', () => {
  it('AD-11 tray sizing at 412 px (w 46, inner 384): 7 card, 8 and 14 compact 2, 15 compact 3', () => {
    const at = (n: number) => trayLayout(n, 46, 384);
    expect(at(0)).toEqual({ mode: 'card', rows: 0, perRow: 7, tileWidth: 46, area: 92 });
    expect(at(7)).toEqual({ mode: 'card', rows: 1, perRow: 7, tileWidth: 46, area: 92 });
    expect(at(8)).toEqual({ mode: 'compact', rows: 2, perRow: 7, tileWidth: 46, area: 92 });
    expect(at(14)).toEqual({ mode: 'compact', rows: 2, perRow: 7, tileWidth: 46, area: 92 });
    expect(at(15)).toEqual({ mode: 'compact', rows: 3, perRow: 7, tileWidth: 46, area: 92 });
    expect(at(22)).toEqual({ mode: 'compact', rows: 4, perRow: 7, tileWidth: 46, area: 92 });
  });

  it('AD-11 tray sizing at 360 px (w 40, inner 336): tile width 44, same rows', () => {
    const at = (n: number) => trayLayout(n, 40, 336);
    expect(at(0)).toEqual({ mode: 'card', rows: 0, perRow: 7, tileWidth: 44, area: 92 });
    expect(at(7)).toEqual({ mode: 'card', rows: 1, perRow: 7, tileWidth: 44, area: 92 });
    expect(at(8)).toEqual({ mode: 'compact', rows: 2, perRow: 7, tileWidth: 44, area: 92 });
    expect(at(14)).toEqual({ mode: 'compact', rows: 2, perRow: 7, tileWidth: 44, area: 92 });
    expect(at(15)).toEqual({ mode: 'compact', rows: 3, perRow: 7, tileWidth: 44, area: 92 });
    expect(at(22)).toEqual({ mode: 'compact', rows: 4, perRow: 7, tileWidth: 44, area: 92 });
  });

  it('AD-11 tray sizing at w 70 (inner 576): tile width 70, 7 per row, area H = 93', () => {
    expect(trayLayout(7, 70, 576)).toEqual({
      mode: 'card',
      rows: 1,
      perRow: 7,
      tileWidth: 70,
      area: 93,
    });
  });
});

describe('tray order', () => {
  const draft = { arrangement: [32, 28], destination: [27, 1] };

  it('AD-14 left: the D block (mirrors, top → bottom) first, then the arrangement', () => {
    expect(trayOrder({ ...draft, side: 'left' })).toEqual([
      { id: 27, mirror: true },
      { id: 1, mirror: true },
      { id: 32, mirror: false },
      { id: 28, mirror: false },
    ]);
  });

  it('AD-14 right: the arrangement, then the D block reversed (mirrors)', () => {
    expect(trayOrder({ ...draft, side: 'right' })).toEqual([
      { id: 32, mirror: false },
      { id: 28, mirror: false },
      { id: 1, mirror: true },
      { id: 27, mirror: true },
    ]);
  });

  it('AD-14 k = 0: the arrangement only', () => {
    expect(trayOrder({ arrangement: [24, 6, 49], destination: [], side: 'left' })).toEqual([
      { id: 24, mirror: false },
      { id: 6, mirror: false },
      { id: 49, mirror: false },
    ]);
  });
});
