import { diffReminders, MAX_SCHEDULED, planReminders } from '@/services/notifications/plan';
import type { Bill, Task } from '@/types/api';

const NOW = new Date(2026, 9, 11, 10, 0); // Sun 11 Oct 2026, 10:00 local

const task = (over: Partial<Task>): Task => ({
  id: 't1',
  title: 'Submit report',
  notes: '',
  priority: 'medium',
  dueDate: '2026-10-11',
  dueTime: '17:00',
  recurrence: 'none',
  anchorDay: null,
  reminderMinutesBefore: 30,
  completed: false,
  completedAt: null,
  completedOn: null,
  previousDueDate: null,
  createdAt: '',
  updatedAt: '',
  ...over,
});

const bill = (over: Partial<Bill>): Bill => ({
  id: 'b1',
  name: 'Internet',
  amount: 120_000,
  category: 'bills',
  dueDate: '2026-10-14',
  recurrence: 'monthly',
  anchorDay: 14,
  reminderDaysBefore: 2,
  notes: '',
  isPaid: false,
  lastPayment: null,
  createdAt: '',
  updatedAt: '',
  ...over,
});

const at = (r: { at: Date }) => [r.at.getMonth() + 1, r.at.getDate(), r.at.getHours(), r.at.getMinutes()];

describe('reminder planning', () => {
  it('schedules a timed task before its due time', () => {
    const [r] = planReminders([task({})], [], NOW);
    expect(at(r!)).toEqual([10, 11, 16, 30]);
    expect(r!.body).toBe('Due in 30 min');
    expect(r!.channel).toBe('tasks');
  });

  it('skips completed tasks, tasks without reminders, and past moments', () => {
    expect(planReminders([task({ completed: true })], [], NOW)).toEqual([]);
    expect(planReminders([task({ reminderMinutesBefore: null })], [], NOW)).toEqual([]);
    expect(planReminders([task({ dueTime: '09:00' })], [], NOW)).toEqual([]); // already passed today
  });

  it('reminds untimed tasks on the morning of the day', () => {
    const [r] = planReminders([task({ dueDate: '2026-10-12', dueTime: null, reminderMinutesBefore: 0 })], [], NOW);
    expect(at(r!)).toEqual([10, 12, 9, 0]);
  });

  it('expands recurring tasks into several upcoming occurrences', () => {
    const plan = planReminders([task({ recurrence: 'daily', dueTime: '20:00', reminderMinutesBefore: 0 })], [], NOW);
    expect(plan.length).toBe(7);
    expect(at(plan[1]!)).toEqual([10, 12, 20, 0]);
  });

  it('reminds about bills ahead of time and on the due date, at 9 AM', () => {
    const plan = planReminders([], [bill({})], NOW);
    expect(plan.map(at)).toEqual([
      [10, 12, 9, 0],
      [10, 14, 9, 0],
    ]);
    expect(plan[0]!.body).toBe('৳1,200 is due in 2 days');
    expect(plan[1]!.body).toBe('৳1,200 is due today');
    expect(planReminders([], [bill({ isPaid: true })], NOW)).toEqual([]);
  });

  it('caps the number of scheduled alarms, soonest first', () => {
    const many = Array.from({ length: 40 }, (_, i) =>
      task({ id: `t${i}`, recurrence: 'daily', dueTime: '21:00', reminderMinutesBefore: 0 }),
    );
    const plan = planReminders(many, [], NOW);
    expect(plan).toHaveLength(MAX_SCHEDULED);
    const times = plan.map((p) => p.at.getTime());
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });

  it('changes the id when the time or title changes, so stale alarms are replaced', () => {
    const [a] = planReminders([task({})], [], NOW);
    const [b] = planReminders([task({ dueTime: '18:00' })], [], NOW);
    const [c] = planReminders([task({ title: 'Renamed' })], [], NOW);
    const [same] = planReminders([task({})], [], NOW);
    expect(a!.id).not.toBe(b!.id);
    expect(a!.id).not.toBe(c!.id);
    expect(a!.id).toBe(same!.id);
  });

  it('diffs scheduled against planned', () => {
    const plan = planReminders([task({})], [bill({})], NOW);
    const keep = plan[0]!.id;
    const { cancel, schedule } = diffReminders([keep, 'task:gone:2026-10-01:0:x'], plan);
    expect(cancel).toEqual(['task:gone:2026-10-01:0:x']);
    expect(schedule.map((s) => s.id)).toEqual(plan.slice(1).map((p) => p.id));
  });
});
