import { stripMenuItemSuffix, stripMenuLabel } from './menu-label';

describe('menu labels', () => {
  it('preserves labels while removing menu markers and parenthetical notes', () => {
    expect(stripMenuItemSuffix('Adóügy   MENU ITEM')).toBe('Adóügy');
    expect(stripMenuItemSuffix('menu item')).toBe('menu item');
    expect(stripMenuLabel('Bevallások (2026)')).toBe('Bevallások');
    expect(stripMenuLabel('Bevallások menu item')).toBe('Bevallások');
    expect(stripMenuLabel('A (első) B (második) C')).toBe('ABC');
    expect(stripMenuLabel('A (nyitva')).toBe('A (nyitva');
    expect(stripMenuLabel('A (külső (belső) vége)')).toBe('Avége)');
  });

  it('handles long unmatched parentheses and whitespace without backtracking', () => {
    expect(stripMenuLabel('('.repeat(100_000))).toHaveLength(100_000);
    expect(stripMenuItemSuffix(' '.repeat(100_000) + 'x')).toHaveLength(100_001);
  });
});
