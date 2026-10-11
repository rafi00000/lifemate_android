import { CATEGORY_META } from '@/constants/categories';
import type { BudgetAlert, BudgetStatus, ExpenseCategory } from '@/types/api';
import { formatMoney, percentOf } from '@/utils/money';

const scopeLabel = (scope: BudgetAlert['scope']) =>
  scope === 'overall' ? 'monthly budget' : `${CATEGORY_META[scope].label.toLowerCase()} budget`;

/** Whole taka, rounded down: a daily allowance never needs poisha. */
const wholeTaka = (minor: number) => formatMoney(Math.floor(minor / 100) * 100);

/**
 * Budget messages are factual and calm: they say what happened and what is
 * left, without alarm language.
 */
export function alertMessage(alert: BudgetAlert): string {
  const { status } = alert;
  if (alert.state === 'over') {
    return `You’re ${formatMoney(-status.remaining)} over your ${scopeLabel(alert.scope)}.`;
  }
  return `${percentOf(status.spent, status.limit)}% of your ${scopeLabel(alert.scope)} used · ${formatMoney(status.remaining)} left.`;
}

export function budgetHeadline(status: BudgetStatus, daysLeft: number): string {
  if (status.state === 'over') return `Over budget by ${formatMoney(-status.remaining)}`;
  const perDay = daysLeft > 0 ? Math.floor(status.remaining / daysLeft) : status.remaining;
  return `${wholeTaka(status.remaining)} left · ${wholeTaka(perDay)}/day`;
}

export function categoryWarning(category: ExpenseCategory, status: BudgetStatus): string {
  const label = CATEGORY_META[category].label;
  return status.state === 'over'
    ? `${label} is ${formatMoney(-status.remaining)} over budget`
    : `${label} budget ${percentOf(status.spent, status.limit)}% used`;
}
