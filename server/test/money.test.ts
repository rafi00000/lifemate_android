import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { api, app, registerUser } from './helpers.js';

const expense = (amount: number, category: string, date: string, note = '') => ({ amount, category, date, note });

describe('expenses', () => {
  it('records expenses and validates amounts', async () => {
    const u = await registerUser();
    const ok = await request(app).post(api('/expenses')).set(u.auth).send(expense(125_050, 'food', '2026-10-11', 'Bazar'));
    expect(ok.status).toBe(201);
    expect(ok.body.data).toMatchObject({ amount: 125_050, category: 'food', date: '2026-10-11', note: 'Bazar' });
    expect(ok.body.alerts).toEqual([]);

    for (const bad of [0, -100, 12.5, '100']) {
      const res = await request(app).post(api('/expenses')).set(u.auth).send(expense(bad as number, 'food', '2026-10-11'));
      expect(res.status).toBe(400);
    }
    const badCategory = await request(app).post(api('/expenses')).set(u.auth).send(expense(100, 'casino', '2026-10-11'));
    expect(badCategory.status).toBe(400);
  });

  it('lists a month only, newest first, with paging', async () => {
    const u = await registerUser();
    for (const date of ['2026-09-30', '2026-10-01', '2026-10-05', '2026-10-05', '2026-10-31', '2026-11-01']) {
      await request(app).post(api('/expenses')).set(u.auth).send(expense(1000, 'food', date));
    }
    const all = await request(app).get(api('/expenses?month=2026-10&limit=50')).set(u.auth);
    expect(all.body.data.map((e: { date: string }) => e.date)).toEqual(['2026-10-31', '2026-10-05', '2026-10-05', '2026-10-01']);

    const ids = new Set<string>();
    let cursor: string | null = null;
    do {
      const res: request.Response = await request(app)
        .get(api(`/expenses?month=2026-10&limit=1${cursor ? `&cursor=${cursor}` : ''}`))
        .set(u.auth);
      res.body.data.forEach((e: { id: string; date: string }) => {
        expect(e.date.startsWith('2026-10')).toBe(true);
        ids.add(e.id);
      });
      cursor = res.body.nextCursor;
    } while (cursor);
    expect(ids.size).toBe(4);
  });

  it('summarises a month by category and day with budget status', async () => {
    const u = await registerUser();
    await request(app).put(api('/budgets/2026-10')).set(u.auth).send({
      overall: 1_000_000,
      categories: [{ category: 'food', limit: 300_000 }],
    });
    await request(app).post(api('/expenses')).set(u.auth).send(expense(200_000, 'food', '2026-10-02'));
    await request(app).post(api('/expenses')).set(u.auth).send(expense(50_000, 'food', '2026-10-02'));
    await request(app).post(api('/expenses')).set(u.auth).send(expense(30_000, 'transport', '2026-10-03'));
    await request(app).post(api('/expenses')).set(u.auth).send(expense(99_999, 'food', '2026-11-01'));

    const res = await request(app).get(api('/expenses/summary?month=2026-10')).set(u.auth);
    const s = res.body.data;
    expect(s.total).toBe(280_000);
    expect(s.count).toBe(3);
    expect(s.byCategory).toEqual([
      { category: 'food', total: 250_000, count: 2 },
      { category: 'transport', total: 30_000, count: 1 },
    ]);
    expect(s.daily).toEqual([
      { date: '2026-10-02', total: 250_000 },
      { date: '2026-10-03', total: 30_000 },
    ]);
    expect(s.budget.overall).toMatchObject({ limit: 1_000_000, spent: 280_000, remaining: 720_000, state: 'ok' });
    expect(s.budget.categories[0]).toMatchObject({ category: 'food', spent: 250_000, state: 'warning' });
  });

  it('returns budget alerts only when a threshold is crossed', async () => {
    const u = await registerUser();
    await request(app).put(api('/budgets/2026-10')).set(u.auth).send({ overall: 100_000, categories: [] });

    const a = await request(app).post(api('/expenses')).set(u.auth).send(expense(70_000, 'food', '2026-10-01'));
    expect(a.body.alerts).toEqual([]);
    const b = await request(app).post(api('/expenses')).set(u.auth).send(expense(15_000, 'food', '2026-10-02'));
    expect(b.body.alerts).toEqual([expect.objectContaining({ scope: 'overall', state: 'warning' })]);
    const c = await request(app).post(api('/expenses')).set(u.auth).send(expense(5_000, 'food', '2026-10-03'));
    expect(c.body.alerts).toEqual([]);
    const d = await request(app).post(api('/expenses')).set(u.auth).send(expense(20_000, 'food', '2026-10-04'));
    expect(d.body.alerts).toEqual([expect.objectContaining({ scope: 'overall', state: 'over' })]);
    expect(d.body.alerts[0].status.remaining).toBe(-10_000);
  });

  it('updates and deletes only the owner’s expenses', async () => {
    const alice = await registerUser();
    const bob = await registerUser();
    const e = await request(app).post(api('/expenses')).set(alice.auth).send(expense(5000, 'food', '2026-10-01'));
    const id = e.body.data.id;
    expect((await request(app).patch(api(`/expenses/${id}`)).set(bob.auth).send({ amount: 1 })).status).toBe(404);
    expect((await request(app).delete(api(`/expenses/${id}`)).set(bob.auth)).status).toBe(404);
    expect((await request(app).get(api('/expenses/summary?month=2026-10')).set(bob.auth)).body.data.total).toBe(0);

    const upd = await request(app).patch(api(`/expenses/${id}`)).set(alice.auth).send({ amount: 7500 });
    expect(upd.body.data.amount).toBe(7500);
    expect((await request(app).delete(api(`/expenses/${id}`)).set(alice.auth)).status).toBe(204);
  });
});

describe('budgets', () => {
  it('carries a plan forward to later months until changed', async () => {
    const u = await registerUser();
    const none = await request(app).get(api('/budgets/2026-10')).set(u.auth);
    expect(none.body.data).toMatchObject({ overall: null, categories: [], inherited: false, sourceMonth: null });

    await request(app).put(api('/budgets/2026-08')).set(u.auth).send({ overall: 2_000_000, categories: [] });
    const later = await request(app).get(api('/budgets/2026-10')).set(u.auth);
    expect(later.body.data).toMatchObject({ overall: 2_000_000, inherited: true, sourceMonth: '2026-08' });

    // An earlier month is unaffected.
    const earlier = await request(app).get(api('/budgets/2026-07')).set(u.auth);
    expect(earlier.body.data.overall).toBeNull();

    await request(app).put(api('/budgets/2026-10')).set(u.auth).send({ overall: 2_500_000, categories: [] });
    expect((await request(app).get(api('/budgets/2026-09')).set(u.auth)).body.data.overall).toBe(2_000_000);
    expect((await request(app).get(api('/budgets/2026-10')).set(u.auth)).body.data).toMatchObject({
      overall: 2_500_000,
      inherited: false,
    });
  });

  it('rejects duplicate categories and invalid months', async () => {
    const u = await registerUser();
    const dup = await request(app)
      .put(api('/budgets/2026-10'))
      .set(u.auth)
      .send({ overall: null, categories: [{ category: 'food', limit: 100 }, { category: 'food', limit: 200 }] });
    expect(dup.status).toBe(400);
    expect((await request(app).get(api('/budgets/2026-13')).set(u.auth)).status).toBe(400);
  });
});

describe('bills', () => {
  it('pays a recurring bill, logs an expense, and undo reverses both', async () => {
    const u = await registerUser();
    const b = await request(app)
      .post(api('/bills'))
      .set(u.auth)
      .send({ name: 'Internet', amount: 120_000, dueDate: '2026-01-31', recurrence: 'monthly' });
    expect(b.status).toBe(201);
    expect(b.body.data).toMatchObject({ anchorDay: 31, category: 'bills', reminderDaysBefore: 1, isPaid: false });
    const id = b.body.data.id;

    const paid = await request(app)
      .post(api(`/bills/${id}/pay`))
      .set(u.auth)
      .send({ dueDate: '2026-01-31', paidOn: '2026-01-30', logExpense: true });
    expect(paid.status).toBe(200);
    expect(paid.body.data).toMatchObject({ dueDate: '2026-02-28', isPaid: false });
    expect(paid.body.data.lastPayment).toMatchObject({ dueDate: '2026-01-31', paidOn: '2026-01-30' });

    const jan = await request(app).get(api('/expenses/summary?month=2026-01')).set(u.auth);
    expect(jan.body.data.total).toBe(120_000);

    // A second tap for the same occurrence is refused, not double-charged.
    const again = await request(app)
      .post(api(`/bills/${id}/pay`))
      .set(u.auth)
      .send({ dueDate: '2026-01-31', paidOn: '2026-01-30', logExpense: true });
    expect(again.status).toBe(409);

    const undo = await request(app).post(api(`/bills/${id}/undo-payment`)).set(u.auth);
    expect(undo.body.data).toMatchObject({ dueDate: '2026-01-31', lastPayment: null });
    expect((await request(app).get(api('/expenses/summary?month=2026-01')).set(u.auth)).body.data.total).toBe(0);
  });

  it('marks one-off bills as paid and filters by status', async () => {
    const u = await registerUser();
    const b = await request(app)
      .post(api('/bills'))
      .set(u.auth)
      .send({ name: 'Semester fee', amount: 1_850_000, dueDate: '2026-11-05', recurrence: 'none' });
    await request(app)
      .post(api(`/bills/${b.body.data.id}/pay`))
      .set(u.auth)
      .send({ dueDate: '2026-11-05', paidOn: '2026-11-01', logExpense: false });

    expect((await request(app).get(api('/bills')).set(u.auth)).body.data).toHaveLength(0);
    const paid = await request(app).get(api('/bills?status=paid')).set(u.auth);
    expect(paid.body.data[0]).toMatchObject({ name: 'Semester fee', isPaid: true });
    expect((await request(app).get(api('/expenses/summary?month=2026-11')).set(u.auth)).body.data.total).toBe(0);
  });

  it('re-anchors when the due date is edited and isolates users', async () => {
    const alice = await registerUser();
    const bob = await registerUser();
    const b = await request(app).post(api('/bills')).set(alice.auth).send({ name: 'Rent', amount: 100, dueDate: '2026-10-05' });
    const id = b.body.data.id;
    const edited = await request(app).patch(api(`/bills/${id}`)).set(alice.auth).send({ dueDate: '2026-10-30' });
    expect(edited.body.data.anchorDay).toBe(30);

    expect((await request(app).get(api(`/bills/${id}`)).set(bob.auth)).status).toBe(404);
    expect(
      (await request(app).post(api(`/bills/${id}/pay`)).set(bob.auth).send({ dueDate: '2026-10-30', paidOn: '2026-10-30' })).status,
    ).toBe(404);
  });
});
