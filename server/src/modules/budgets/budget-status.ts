/**
 * Pure budget maths, shared by the summary, dashboard and expense-alert code.
 * All amounts are integer minor units.
 */

export const WARNING_RATIO = 0.8;

export type BudgetState = 'ok' | 'warning' | 'over';

export interface BudgetStatus {
  limit: number;
  spent: number;
  remaining: number; // negative when over budget
  ratio: number; // spent / limit, unrounded
  state: BudgetState;
}

export function budgetState(spent: number, limit: number): BudgetState {
  if (spent > limit) return 'over';
  if (spent >= limit * WARNING_RATIO) return 'warning';
  return 'ok';
}

export function computeBudgetStatus(spent: number, limit: number): BudgetStatus {
  return {
    limit,
    spent,
    remaining: limit - spent,
    ratio: limit > 0 ? spent / limit : 0,
    state: budgetState(spent, limit),
  };
}

export interface BudgetAlert {
  scope: 'overall' | string; // 'overall' or a category
  state: Exclude<BudgetState, 'ok'>;
  status: BudgetStatus;
}

/**
 * Returns an alert only when an expense moves a budget into a worse state
 * (ok -> warning, or anything -> over), so users are told once at each
 * threshold instead of after every purchase.
 */
export function crossedThreshold(before: number, after: number, limit: number): Exclude<BudgetState, 'ok'> | null {
  const rank = { ok: 0, warning: 1, over: 2 } as const;
  const prev = budgetState(before, limit);
  const next = budgetState(after, limit);
  if (rank[next] > rank[prev] && next !== 'ok') return next;
  return null;
}
