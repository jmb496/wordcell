import { describe, expect, it } from 'vitest';
import { ANCHOR_BAND, BAND_ORDER, parseBandsParam, SLACK_BAND } from './bands';

const parse = (query: string) => parseBandsParam(new URLSearchParams(query));

describe('bands', () => {
  it('AD-11 BAND_ORDER is the seven units of the eleven bands; anchor wordcells, slack leftover', () => {
    expect(BAND_ORDER).toEqual([
      ['topBar'],
      ['banner'],
      ['leftover'],
      ['columns', 'footRow'],
      ['trayGap', 'tray'],
      ['labels', 'wordcells'],
      ['actionGap', 'actionBar'],
    ]);
    expect(ANCHOR_BAND).toBe('wordcells');
    expect(SLACK_BAND).toBe('leftover');
  });

  it('AD-11 ?bands= absent or empty gives the default order', () => {
    expect(parse('')).toEqual(BAND_ORDER);
    expect(parse('?bands=')).toEqual(BAND_ORDER);
    expect(parse('?bands=&bands=topBar,banner,leftover,wordcells,tray,columns,actionBar')).toEqual(
      BAND_ORDER,
    );
  });

  it('AD-11 ?bands= a valid reorder returns it; repeated reads the first value', () => {
    const fallback = [
      ['topBar'],
      ['banner'],
      ['leftover'],
      ['labels', 'wordcells'],
      ['trayGap', 'tray'],
      ['columns', 'footRow'],
      ['actionGap', 'actionBar'],
    ];
    expect(parse('?bands=topBar,banner,leftover,wordcells,tray,columns,actionBar')).toEqual(
      fallback,
    );
    expect(
      parse(
        '?bands=topBar,banner,leftover,wordcells,tray,columns,actionBar' +
          '&bands=topBar,banner,leftover,columns,tray,wordcells,actionBar',
      ),
    ).toEqual(fallback);
  });

  for (const [why, list] of [
    ['an unknown id', 'topBar,banner,leftover,columns,tray,wordcells,menu'],
    ['a non-unit band id', 'topBar,banner,leftover,columns,tray,wordcells,footRow'],
    ['a gap band id', 'topBar,banner,leftover,columns,trayGap,wordcells,actionBar'],
    ['a labels band id', 'topBar,banner,leftover,columns,tray,labels,actionBar'],
    ['a wrong-case token', 'TopBar,banner,leftover,columns,tray,wordcells,actionBar'],
    ['a token with a space', 'topBar, banner,leftover,columns,tray,wordcells,actionBar'],
    ['a duplicate', 'topBar,banner,leftover,columns,tray,wordcells,wordcells'],
    ['a missing id', 'topBar,banner,leftover,columns,tray,wordcells'],
    ['a trailing comma', 'topBar,banner,leftover,columns,tray,wordcells,actionBar,'],
  ]) {
    it(`AD-11 ?bands= throws for ${why}`, () => {
      expect(() => parse(`?bands=${list}`)).toThrow(Error);
      expect(() => parse(`?bands=${list}`)).toThrow(list);
    });
  }
});
