import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { api, app, registerUser } from './helpers.js';

describe('grocery lists', () => {
  it('manages lists and items with pending counts', async () => {
    const u = await registerUser();
    const list = await request(app).post(api('/grocery-lists')).set(u.auth).send({ name: 'Weekly bazar' });
    expect(list.status).toBe(201);
    expect(list.body.data).toMatchObject({ name: 'Weekly bazar', isOwner: true, totalItems: 0, members: [] });
    const id = list.body.data.id;

    const rice = await request(app).post(api(`/grocery-lists/${id}/items`)).set(u.auth).send({ name: 'Rice', quantity: 5, unit: 'kg' });
    expect(rice.body.data).toMatchObject({ name: 'Rice', quantity: 5, unit: 'kg', purchased: false });
    await request(app).post(api(`/grocery-lists/${id}/items`)).set(u.auth).send({ name: 'Eggs', quantity: 12 });

    const ticked = await request(app)
      .patch(api(`/grocery-lists/${id}/items/${rice.body.data.id}`))
      .set(u.auth)
      .send({ purchased: true });
    expect(ticked.body.data.purchased).toBe(true);
    expect(ticked.body.data.purchasedAt).toEqual(expect.any(String));

    const lists = await request(app).get(api('/grocery-lists')).set(u.auth);
    expect(lists.body.data[0]).toMatchObject({ totalItems: 2, pendingItems: 1 });

    const detail = await request(app).get(api(`/grocery-lists/${id}`)).set(u.auth);
    // Unpurchased items sort first.
    expect(detail.body.data.items.map((i: { name: string }) => i.name)).toEqual(['Eggs', 'Rice']);

    const cleared = await request(app).post(api(`/grocery-lists/${id}/clear-purchased`)).set(u.auth);
    expect(cleared.body.data.removed).toBe(1);

    expect((await request(app).post(api(`/grocery-lists/${id}/items`)).set(u.auth).send({ name: '', quantity: 1 })).status).toBe(400);
    expect((await request(app).post(api(`/grocery-lists/${id}/items`)).set(u.auth).send({ name: 'x', quantity: 0 })).status).toBe(400);
  });

  it('shares a list with a registered user with the right permissions', async () => {
    const owner = await registerUser({ name: 'Owner' });
    const mate = await registerUser({ name: 'Mate' });
    const stranger = await registerUser({ name: 'Stranger' });
    const list = await request(app).post(api('/grocery-lists')).set(owner.auth).send({ name: 'Flat' });
    const id = list.body.data.id;

    // Strangers cannot see or touch it.
    expect((await request(app).get(api(`/grocery-lists/${id}`)).set(mate.auth)).status).toBe(404);

    const shared = await request(app).post(api(`/grocery-lists/${id}/members`)).set(owner.auth).send({ email: mate.email });
    expect(shared.status).toBe(200);
    expect(shared.body.data.members).toEqual([expect.objectContaining({ id: mate.id, name: 'Mate' })]);

    // Members can read, add and tick items, and see the list in their index.
    const item = await request(app).post(api(`/grocery-lists/${id}/items`)).set(mate.auth).send({ name: 'Milk' });
    expect(item.status).toBe(201);
    const mateLists = await request(app).get(api('/grocery-lists')).set(mate.auth);
    expect(mateLists.body.data[0]).toMatchObject({ name: 'Flat', isOwner: false, pendingItems: 1 });

    // Members cannot delete the list or share it onward.
    expect((await request(app).delete(api(`/grocery-lists/${id}`)).set(mate.auth)).status).toBe(403);
    expect(
      (await request(app).post(api(`/grocery-lists/${id}/members`)).set(mate.auth).send({ email: stranger.email })).status,
    ).toBe(403);
    expect((await request(app).get(api(`/grocery-lists/${id}`)).set(stranger.auth)).status).toBe(404);

    // Validation of sharing targets.
    expect(
      (await request(app).post(api(`/grocery-lists/${id}/members`)).set(owner.auth).send({ email: 'ghost@example.com' })).status,
    ).toBe(404);
    expect((await request(app).post(api(`/grocery-lists/${id}/members`)).set(owner.auth).send({ email: owner.email })).status).toBe(400);
    expect((await request(app).post(api(`/grocery-lists/${id}/members`)).set(owner.auth).send({ email: mate.email })).status).toBe(409);

    // A member can leave; afterwards access is gone.
    expect((await request(app).delete(api(`/grocery-lists/${id}/members/${mate.id}`)).set(mate.auth)).status).toBe(204);
    expect((await request(app).get(api(`/grocery-lists/${id}`)).set(mate.auth)).status).toBe(404);

    // Owner deletes the list and its items.
    expect((await request(app).delete(api(`/grocery-lists/${id}`)).set(owner.auth)).status).toBe(204);
    expect((await request(app).get(api(`/grocery-lists/${id}`)).set(owner.auth)).status).toBe(404);
  });

  it('cannot reach an item through a list the caller does not belong to', async () => {
    const alice = await registerUser();
    const bob = await registerUser();
    const aliceList = await request(app).post(api('/grocery-lists')).set(alice.auth).send({ name: 'A' });
    const bobList = await request(app).post(api('/grocery-lists')).set(bob.auth).send({ name: 'B' });
    const item = await request(app).post(api(`/grocery-lists/${aliceList.body.data.id}/items`)).set(alice.auth).send({ name: 'Secret' });
    // Bob uses his own list id with Alice's item id.
    const res = await request(app)
      .patch(api(`/grocery-lists/${bobList.body.data.id}/items/${item.body.data.id}`))
      .set(bob.auth)
      .send({ purchased: true });
    expect(res.status).toBe(404);
  });
});

describe('notes', () => {
  it('creates notes with checklists and keeps item ids across edits', async () => {
    const u = await registerUser();
    const created = await request(app)
      .post(api('/notes'))
      .set(u.auth)
      .send({ title: 'Exam prep', checklist: [{ text: 'DBMS' }, { text: 'OS', done: true }] });
    expect(created.status).toBe(201);
    const [first, second] = created.body.data.checklist;
    expect(first).toMatchObject({ text: 'DBMS', done: false, id: expect.any(String) });
    expect(second.done).toBe(true);

    const edited = await request(app)
      .patch(api(`/notes/${created.body.data.id}`))
      .set(u.auth)
      .send({ checklist: [{ id: first.id, text: 'DBMS', done: true }], pinned: true });
    expect(edited.body.data.checklist).toEqual([{ id: first.id, text: 'DBMS', done: true }]);
    expect(edited.body.data.pinned).toBe(true);

    expect((await request(app).post(api('/notes')).set(u.auth).send({})).status).toBe(400);

    const other = await registerUser();
    expect((await request(app).get(api(`/notes/${created.body.data.id}`)).set(other.auth)).status).toBe(404);
    expect((await request(app).delete(api(`/notes/${created.body.data.id}`)).set(u.auth)).status).toBe(204);
  });
});

describe('dashboard', () => {
  it('summarises the day across modules', async () => {
    const u = await registerUser();
    const today = '2026-10-11';
    const post = (path: string, body: object) => request(app).post(api(path)).set(u.auth).send(body);

    await post('/tasks', { title: 'Overdue', dueDate: '2026-10-09' });
    await post('/tasks', { title: 'Today late', dueDate: today, dueTime: '18:00' });
    await post('/tasks', { title: 'Today early', dueDate: today, dueTime: '08:00' });
    await post('/tasks', { title: 'Tomorrow', dueDate: '2026-10-12' });
    const done = await post('/tasks', { title: 'Done', dueDate: today });
    await post(`/tasks/${done.body.data.id}/complete`, { today });

    await request(app).put(api('/budgets/2026-10')).set(u.auth).send({
      overall: 1_000_000,
      categories: [{ category: 'food', limit: 100_000 }],
    });
    await post('/expenses', { amount: 95_000, category: 'food', date: '2026-10-03' });
    await post('/expenses', { amount: 50_000, category: 'transport', date: today });

    await post('/bills', { name: 'Soon', amount: 1000, dueDate: '2026-10-14' });
    await post('/bills', { name: 'Overdue', amount: 2000, dueDate: '2026-10-01' });
    await post('/bills', { name: 'Far', amount: 3000, dueDate: '2026-12-01' });

    const list = await post('/grocery-lists', { name: 'Bazar' });
    await post(`/grocery-lists/${list.body.data.id}/items`, { name: 'Rice' });
    await post(`/grocery-lists/${list.body.data.id}/items`, { name: 'Eggs' });

    const res = await request(app).get(api(`/dashboard?today=${today}`)).set(u.auth);
    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d.tasks).toMatchObject({ overdueCount: 1, dueTodayCount: 2, completedTodayCount: 1 });
    expect(d.tasks.items.map((t: { title: string }) => t.title)).toEqual(['Overdue', 'Today early', 'Today late']);
    expect(d.spending).toMatchObject({ month: '2026-10', total: 145_000 });
    expect(d.spending.overallBudget).toMatchObject({ remaining: 855_000, state: 'ok' });
    expect(d.spending.categoryWarnings).toEqual([expect.objectContaining({ category: 'food', state: 'warning' })]);
    expect(d.bills.overdueCount).toBe(1);
    expect(d.bills.upcoming.map((b: { name: string }) => b.name)).toEqual(['Overdue', 'Soon']);
    expect(d.groceries.pendingCount).toBe(2);
    expect(d.groceries.lists).toEqual([expect.objectContaining({ name: 'Bazar', pendingItems: 2 })]);
  });

  it('requires a valid local date', async () => {
    const u = await registerUser();
    expect((await request(app).get(api('/dashboard')).set(u.auth)).status).toBe(400);
    expect((await request(app).get(api('/dashboard?today=2026-02-30')).set(u.auth)).status).toBe(400);
  });
});
