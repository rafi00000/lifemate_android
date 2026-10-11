import type { IconName } from '@/components/ui/icon';
import { categoryColors } from '@/theme/colors';
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '@/types/api';

interface CategoryMeta {
  label: string;
  icon: IconName;
  color: string;
}

export const CATEGORY_META: Record<ExpenseCategory, CategoryMeta> = {
  food: { label: 'Food', icon: 'coffee', color: categoryColors.food },
  transport: { label: 'Transport', icon: 'navigation', color: categoryColors.transport },
  shopping: { label: 'Shopping', icon: 'shopping-bag', color: categoryColors.shopping },
  bills: { label: 'Bills', icon: 'zap', color: categoryColors.bills },
  health: { label: 'Health', icon: 'heart', color: categoryColors.health },
  education: { label: 'Education', icon: 'book-open', color: categoryColors.education },
  entertainment: { label: 'Entertainment', icon: 'film', color: categoryColors.entertainment },
  housing: { label: 'Housing', icon: 'home', color: categoryColors.housing },
  other: { label: 'Other', icon: 'grid', color: categoryColors.other },
};

export const categoryOptions = EXPENSE_CATEGORIES.map((c) => ({
  value: c,
  label: CATEGORY_META[c].label,
  icon: CATEGORY_META[c].icon,
  accent: CATEGORY_META[c].color,
}));
