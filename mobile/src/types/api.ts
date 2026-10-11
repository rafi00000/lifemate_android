/** Shapes returned by the LifeMate API (see docs/API_CONTRACT.md). */

export type Id = string;
/** Calendar date "YYYY-MM-DD" in the user's local time. */
export type DateString = string;
/** Integer minor units (poisha). */
export type Money = number;

export interface User {
  id: Id;
  name: string;
  email: string;
  currency: 'BDT';
  createdAt: string;
}

export interface AuthPayload {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export type Priority = 'low' | 'medium' | 'high';
export type TaskRecurrence = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Task {
  id: Id;
  title: string;
  notes: string;
  priority: Priority;
  dueDate: DateString | null;
  dueTime: string | null;
  recurrence: TaskRecurrence;
  anchorDay: number | null;
  reminderMinutesBefore: number | null;
  completed: boolean;
  completedAt: string | null;
  completedOn: DateString | null;
  previousDueDate: DateString | null;
  createdAt: string;
  updatedAt: string;
}

export type TaskInput = Pick<Task, 'title' | 'notes' | 'priority' | 'dueDate' | 'dueTime' | 'recurrence' | 'reminderMinutesBefore'>;

export const EXPENSE_CATEGORIES = [
  'food',
  'transport',
  'shopping',
  'bills',
  'health',
  'education',
  'entertainment',
  'housing',
  'other',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface Expense {
  id: Id;
  amount: Money;
  category: ExpenseCategory;
  note: string;
  date: DateString;
  bill: Id | null;
  createdAt: string;
}

export type ExpenseInput = Pick<Expense, 'amount' | 'category' | 'note' | 'date'>;

export type BudgetState = 'ok' | 'warning' | 'over';

export interface BudgetStatus {
  limit: Money;
  spent: Money;
  remaining: Money;
  ratio: number;
  state: BudgetState;
}

export interface BudgetAlert {
  scope: 'overall' | ExpenseCategory;
  state: Exclude<BudgetState, 'ok'>;
  status: BudgetStatus;
}

export interface BudgetPlan {
  month: string;
  overall: Money | null;
  categories: { category: ExpenseCategory; limit: Money }[];
  inherited: boolean;
  sourceMonth: string | null;
}

export interface MonthSummary {
  month: string;
  total: Money;
  count: number;
  byCategory: { category: ExpenseCategory; total: Money; count: number }[];
  daily: { date: DateString; total: Money }[];
  budget: {
    plan: BudgetPlan;
    overall: BudgetStatus | null;
    categories: (BudgetStatus & { category: ExpenseCategory })[];
  };
}

export type BillRecurrence = 'none' | 'weekly' | 'monthly' | 'yearly';

export interface Bill {
  id: Id;
  name: string;
  amount: Money;
  category: ExpenseCategory;
  dueDate: DateString;
  recurrence: BillRecurrence;
  anchorDay: number;
  reminderDaysBefore: number;
  notes: string;
  isPaid: boolean;
  lastPayment: { dueDate: DateString; paidOn: DateString; expense: Id | null } | null;
  createdAt: string;
  updatedAt: string;
}

export type BillInput = Pick<Bill, 'name' | 'amount' | 'category' | 'dueDate' | 'recurrence' | 'reminderDaysBefore' | 'notes'>;

export interface Person {
  id: Id;
  name: string;
  email: string;
}

export interface GroceryListSummary {
  id: Id;
  name: string;
  isOwner: boolean;
  owner: Person;
  members: Person[];
  totalItems: number;
  pendingItems: number;
  updatedAt: string;
}

export interface GroceryItem {
  id: Id;
  list: Id;
  name: string;
  quantity: number;
  unit: string;
  purchased: boolean;
  purchasedAt: string | null;
  createdAt: string;
}

export interface GroceryListDetail extends GroceryListSummary {
  items: GroceryItem[];
}

export interface ChecklistItem {
  id?: Id;
  text: string;
  done: boolean;
}

export interface Note {
  id: Id;
  title: string;
  body: string;
  checklist: ChecklistItem[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NoteInput = Pick<Note, 'title' | 'body' | 'checklist' | 'pinned'>;

export interface Dashboard {
  today: DateString;
  tasks: { overdueCount: number; dueTodayCount: number; completedTodayCount: number; items: Task[] };
  spending: {
    month: string;
    total: Money;
    topCategories: { category: ExpenseCategory; total: Money; count: number }[];
    overallBudget: BudgetStatus | null;
    categoryWarnings: (BudgetStatus & { category: ExpenseCategory })[];
  };
  bills: { overdueCount: number; upcoming: Bill[]; totalDueSoon: Money };
  groceries: {
    pendingCount: number;
    lists: { id: Id; name: string; pendingItems: number }[];
    preview: Pick<GroceryItem, 'id' | 'name' | 'quantity' | 'unit' | 'list'>[];
  };
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: { path: string; message: string }[] };
}

export interface Paged<T> {
  data: T[];
  nextCursor: string | null;
}
