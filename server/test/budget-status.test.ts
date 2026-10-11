import { describe, expect, it } from 'vitest';
import { budgetState, computeBudgetStatus, crossedThreshold } from '../src/modules/budgets/budget-status.js';

describe('budget status', () => {
  it('classifies spending against a limit', () => {
    expect(budgetState(0, 10_000)).toBe('ok');
    expect(budgetState(7_999, 10_000)).toBe('ok');
    expect(budgetState(8_000, 10_000)).toBe('warning');
    expect(budgetState(10_000, 10_000)).toBe('warning'); // exactly at limit is not over
    expect(budgetState(10_001, 10_000)).toBe('over');
  });

  it('reports remaining as negative when over budget', () => {
    expect(computeBudgetStatus(12_500, 10_000)).toEqual({
      limit: 10_000,
      spent: 12_500,
      remaining: -2_500,
      ratio: 1.25,
      state: 'over',
    });
  });

  it('alerts only when a threshold is crossed', () => {
    expect(crossedThreshold(7_000, 7_500, 10_000)).toBeNull();
    expect(crossedThreshold(7_000, 8_200, 10_000)).toBe('warning');
    expect(crossedThreshold(8_200, 9_000, 10_000)).toBeNull(); // already warned
    expect(crossedThreshold(9_000, 10_500, 10_000)).toBe('over');
    expect(crossedThreshold(5_000, 11_000, 10_000)).toBe('over'); // jumps straight past
    expect(crossedThreshold(11_000, 12_000, 10_000)).toBeNull();
  });
});
