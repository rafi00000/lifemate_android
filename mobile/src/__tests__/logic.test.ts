import { sectionBills } from '@/features/bills/sections';
import { parseQuickItem } from '@/features/groceries/parse-item';
import { groupByDay } from '@/features/money/group-by-day';
import { compareTasks, groupTasks, taskCounts } from '@/features/tasks/grouping';
import type { Bill, Expense, Task } from '@/types/api';
import { passwordStrength, validateEmail, validateNewPassword } from '@/utils/validation';

const task = (over: Partial<Task>): Task => ({
  id: Math.random().toString(36).slice(2),
  title: 'Task',
  notes: '',
  priority: 'medium',
  dueDate: null,
  dueTime: null,
  recurrence: 'none',
  anchorDay: null,
  reminderMinutesBefore: null,
  completed: false,
  completedAt: null,
  completedOn: null,
  previousDueDate: null,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
  ...over,
});

describe('task grouping', () => {
  const today = '2026-10-11';
  const tasks = [
    task({ title: 'overdue', dueDate: '2026-10-09' }),
    task({ title: 'today late', dueDate: today, dueTime: '18:00' }),
    task({ title: 'today early', dueDate: today, dueTime: '08:00' }),
    task({ title: 'today untimed high', dueDate: today, priority: 'high' }),
    task({ title: 'today untimed low', dueDate: today, priority: 'low' }),
    task({ title: 'tomorrow', dueDate: '2026-10-12' }),
    task({ title: 'this week', dueDate: '2026-10-15' }),
    task({ title: 'later', dueDate: '2026-11-20' }),
    task({ title: 'someday' }),
  ];

  it('sorts by date, then time, then priority', () => {
    const sorted = [...tasks].sort(compareTasks).map((t) => t.title);
    expect(sorted.slice(0, 5)).toEqual(['overdue', 'today early', 'today late', 'today untimed high', 'today untimed low']);
    expect(sorted.at(-1)).toBe('someday');
  });

  it('shows only overdue and today in the Today view', () => {
    const sections = groupTasks(tasks, today, 'today');
    expect(sections.map((s) => s.key)).toEqual(['overdue', 'today']);
    expect(sections[0]!.tone).toBe('danger');
    expect(sections[1]!.tasks).toHaveLength(4);
  });

  it('groups the All view into time horizons', () => {
    const sections = groupTasks(tasks, today, 'all');
    expect(sections.map((s) => [s.key, s.tasks.map((t) => t.title)])).toEqual([
      ['overdue', ['overdue']],
      ['today', ['today early', 'today late', 'today untimed high', 'today untimed low']],
      ['tomorrow', ['tomorrow']],
      ['week', ['this week']],
      ['later', ['later']],
      ['someday', ['someday']],
    ]);
  });

  it('lists upcoming days by label', () => {
    const sections = groupTasks(tasks, today, 'upcoming');
    expect(sections.map((s) => s.title)).toEqual(['Tomorrow', 'Thursday', 'Later']);
  });

  it('counts badges', () => {
    expect(taskCounts(tasks, today)).toEqual({ overdue: 1, today: 4, upcoming: 3, all: 9 });
  });
});

describe('quick grocery input', () => {
  it.each([
    ['2 kg rice', { name: 'rice', quantity: 2, unit: 'kg' }],
    ['rice 2kg', { name: 'rice', quantity: 2, unit: 'kg' }],
    ['eggs x12', { name: 'eggs', quantity: 12, unit: '' }],
    ['1.5 L milk', { name: 'milk', quantity: 1.5, unit: 'L' }],
    ['Masoor dal', { name: 'Masoor dal', quantity: 1, unit: '' }],
    ['  7up   ', { name: '7up', quantity: 1, unit: '' }],
  ])('parses %s', (input, expected) => {
    expect(parseQuickItem(input)).toEqual(expected);
  });
});

describe('bill sections', () => {
  const bill = (name: string, dueDate: string): Bill => ({
    id: name,
    name,
    amount: 100,
    category: 'bills',
    dueDate,
    recurrence: 'monthly',
    anchorDay: 1,
    reminderDaysBefore: 1,
    notes: '',
    isPaid: false,
    lastPayment: null,
    createdAt: '',
    updatedAt: '',
  });

  it('buckets by urgency and drops empty buckets', () => {
    const sections = sectionBills(
      [bill('late', '2026-10-01'), bill('today', '2026-10-11'), bill('week', '2026-10-18'), bill('month', '2026-10-30'), bill('far', '2027-01-01')],
      '2026-10-11',
    );
    expect(sections.map((s) => [s.key, s.bills.map((b) => b.name)])).toEqual([
      ['overdue', ['late']],
      ['week', ['today', 'week']],
      ['month', ['month']],
      ['later', ['far']],
    ]);
    expect(sectionBills([], '2026-10-11')).toEqual([]);
  });
});

describe('expense day groups', () => {
  it('sums each day in order', () => {
    const e = (id: string, date: string, amount: number) => ({ id, date, amount }) as Expense;
    const groups = groupByDay([e('a', '2026-10-11', 100), e('b', '2026-10-11', 50), e('c', '2026-10-09', 25)]);
    expect(groups.map((g) => [g.date, g.total, g.items.length])).toEqual([
      ['2026-10-11', 150, 2],
      ['2026-10-09', 25, 1],
    ]);
  });
});

describe('form validation', () => {
  it('validates emails', () => {
    expect(validateEmail('')).toBeDefined();
    expect(validateEmail('nope')).toBeDefined();
    expect(validateEmail(' rafi@example.com ')).toBeUndefined();
  });

  it('mirrors the server password policy', () => {
    expect(validateNewPassword('short1')).toBe('Use at least 8 characters');
    expect(validateNewPassword('allletters')).toBeDefined();
    expect(validateNewPassword('Password123')).toBeUndefined();
    expect(validateNewPassword('a1'.repeat(40))).toBe('Password is too long');
  });

  it('rates password strength', () => {
    expect(passwordStrength('')).toBe(0);
    expect(passwordStrength('weak')).toBe(1);
    expect(passwordStrength('Password123')).toBe(2);
    expect(passwordStrength('Correct-Horse-42')).toBe(3);
  });
});
