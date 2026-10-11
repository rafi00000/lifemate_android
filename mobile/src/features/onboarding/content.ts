import type { IconName } from '@/components/ui/icon';

export type CoreFeatureId = 'today' | 'tasks' | 'money' | 'bills' | 'lists';

export interface CoreFeature {
  id: CoreFeatureId;
  /** Tab route that holds the feature. */
  href: '/' | '/tasks' | '/money' | '/bills' | '/lists';
  tab: string;
  icon: IconName;
  title: string;
  tagline: string;
  /** One sentence for the spotlight tooltip on the tab bar. */
  spotlight: string;
  tips: string[];
}

/**
 * Single source of truth for "what LifeMate does and where to find it".
 * Used by the welcome tour, the tab-bar spotlight and the Help & guide screen,
 * so the three never disagree.
 */
export const CORE_FEATURES: CoreFeature[] = [
  {
    id: 'today',
    href: '/',
    tab: 'Today',
    icon: 'sun',
    title: 'Your day at a glance',
    tagline: 'Everything that needs you today, on one calm screen.',
    spotlight: 'Start here every day: tasks, spending, bills and shopping in one view.',
    tips: [
      'The ring shows how much of today is done',
      'Quick buttons add a task, expense, bill or grocery item',
      'Pull down to refresh from the cloud',
    ],
  },
  {
    id: 'tasks',
    href: '/tasks',
    tab: 'Tasks',
    icon: 'check-circle',
    title: 'Tasks & reminders',
    tagline: 'Plan your day and get a gentle nudge before things are due.',
    spotlight: 'Add tasks with +, set a time for a reminder, tap the circle when done.',
    tips: [
      'Tap + to add a task in seconds',
      'Add a time and a reminder, or repeat it daily, weekly or monthly',
      'Tap the circle to complete it, with Undo if you slip',
    ],
  },
  {
    id: 'money',
    href: '/money',
    tab: 'Money',
    icon: 'pie-chart',
    title: 'Spending & budgets',
    tagline: 'See where your taka goes and how much is left this month.',
    spotlight: 'Log expenses, set a monthly budget and see charts by category.',
    tips: [
      'Log an expense in three taps: amount, category, save',
      'Set a monthly budget, plus limits for categories you watch',
      'You get a heads-up at 80% and when you go over',
    ],
  },
  {
    id: 'bills',
    href: '/bills',
    tab: 'Bills',
    icon: 'calendar',
    title: 'Bills & subscriptions',
    tagline: 'Rent, internet, electricity: never miss a due date again.',
    spotlight: 'Keep recurring bills here. Tap Pay when done and it moves to next month.',
    tips: [
      'Add a bill once and it repeats monthly, weekly or yearly',
      'Tap Pay to mark it paid and log it as an expense',
      'Reminders arrive at 9:00 AM before the due date',
    ],
  },
  {
    id: 'lists',
    href: '/lists',
    tab: 'Lists',
    icon: 'shopping-cart',
    title: 'Groceries & notes',
    tagline: 'Shopping lists you can share, and quick notes with checklists.',
    spotlight: 'Grocery lists you can share with family, plus quick notes.',
    tips: [
      'Type “2 kg rice” and the quantity is filled in for you',
      'Tick items as you shop; they move to the cart',
      'Share a list with family or flatmates by email',
    ],
  },
];

export const featureById = (id: CoreFeatureId) => CORE_FEATURES.find((f) => f.id === id)!;
