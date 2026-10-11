import { formatMoney, formatMoneyCompact, groupLakh, parseMoneyInput, percentOf, toMoneyInput } from '@/utils/money';

describe('money formatting (BDT, minor units)', () => {
  it('groups digits the South Asian way', () => {
    expect(groupLakh('0')).toBe('0');
    expect(groupLakh('999')).toBe('999');
    expect(groupLakh('1000')).toBe('1,000');
    expect(groupLakh('100000')).toBe('1,00,000');
    expect(groupLakh('12345678')).toBe('1,23,45,678');
  });

  it('formats poisha only when present', () => {
    expect(formatMoney(0)).toBe('৳0');
    expect(formatMoney(12_000_00)).toBe('৳12,000');
    expect(formatMoney(125_050)).toBe('৳1,250.50');
    expect(formatMoney(5)).toBe('৳0.05');
    expect(formatMoney(12_000_00, { forceDecimals: true })).toBe('৳12,000.00');
  });

  it('formats negatives and signs with a true minus', () => {
    expect(formatMoney(-150_000)).toBe('−৳1,500');
    expect(formatMoney(2500, { signed: true })).toBe('+৳25');
    expect(formatMoney(2500, { symbol: false })).toBe('25');
  });

  it('never prints NaN', () => {
    expect(formatMoney(Number.NaN)).toBe('৳0');
  });

  it('compacts large values', () => {
    expect(formatMoneyCompact(95_000)).toBe('৳950');
    expect(formatMoneyCompact(1_250_000)).toBe('৳12.5k');
    expect(formatMoneyCompact(25_000_000)).toBe('৳2.5L');
    expect(formatMoneyCompact(100_000_00)).toBe('৳1L');
  });
});

describe('money input parsing', () => {
  it('parses what people type', () => {
    expect(parseMoneyInput('250')).toBe(25_000);
    expect(parseMoneyInput('1,250.5')).toBe(125_050);
    expect(parseMoneyInput('৳ 99.99')).toBe(9_999);
    expect(parseMoneyInput('Tk 40')).toBe(4_000);
    expect(parseMoneyInput('0.1')).toBe(10);
  });

  it('rejects anything ambiguous instead of guessing', () => {
    for (const bad of ['', '0', '0.00', '-5', '1.234', 'abc', '1e5', '12..5', '.']) {
      expect(parseMoneyInput(bad)).toBeNull();
    }
  });

  it('avoids floating point drift', () => {
    // 0.1 + 0.2 style errors must not leak into stored amounts.
    expect(parseMoneyInput('19.99')).toBe(1999);
    expect(parseMoneyInput('0.29')).toBe(29);
  });

  it('round-trips through the edit form', () => {
    for (const minor of [100, 125_050, 125_000, 9_999, 5]) {
      expect(parseMoneyInput(toMoneyInput(minor))).toBe(minor);
    }
    expect(toMoneyInput(125_050)).toBe('1250.5');
  });

  it('computes safe percentages', () => {
    expect(percentOf(50, 200)).toBe(25);
    expect(percentOf(10, 0)).toBe(0);
  });
});
