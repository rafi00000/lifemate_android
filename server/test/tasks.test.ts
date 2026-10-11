import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { api, app, registerUser } from './helpers.js';

describe('tasks', () => {
  it('creates, reads, updates and deletes a task', async () => {
    const u = await registerUser();
    const created = await request(app)
      .post(api('/tasks'))
      .set(u.auth)
      .send({ title: '  Submit report  ', priority: 'high', dueDate: '2026-10-11', dueTime: '17:00', reminderMinutesBefore: 30 });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({
      title: 'Submit report',
      priority: 'high',
      dueDate: '2026-10-11',
      dueTime: '17:00',
      recurrence: 'none',
      reminderMinutesBefore: 30,
      completed: false,
    });
    const id = created.body.data.id;

    const updated = await request(app).patch(api(`/tasks/${id}`)).set(u.auth).send({ title: 'Submit final report' });
    expect(updated.body.data.title).toBe('Submit final report');

    const fetched = await request(app).get(api(`/tasks/${id}`)).set(u.auth);
    expect(fetched.body.data.title).toBe('Submit final report');

    expect((await request(app).delete(api(`/tasks/${id}`)).set(u.auth)).status).toBe(204);
    expect((await request(app).get(api(`/tasks/${id}`)).set(u.auth)).status).toBe(404);
  });

  it('enforces schedule rules on create and on merged updates', async () => {
    const u = await registerUser();
    const timeWithoutDate = await request(app).post(api('/tasks')).set(u.auth).send({ title: 'x', dueTime: '10:00' });
    expect(timeWithoutDate.status).toBe(400);

    const repeatWithoutDate = await request(app).post(api('/tasks')).set(u.auth).send({ title: 'x', recurrence: 'daily' });
    expect(repeatWithoutDate.status).toBe(400);

    const invalidDate = await request(app).post(api('/tasks')).set(u.auth).send({ title: 'x', dueDate: '2026-02-30' });
    expect(invalidDate.status).toBe(400);

    const t = await request(app).post(api('/tasks')).set(u.auth).send({ title: 'x', dueDate: '2026-10-11', dueTime: '09:00' });
    // Clearing the date while a time is still set must fail.
    const clear = await request(app).patch(api(`/tasks/${t.body.data.id}`)).set(u.auth).send({ dueDate: null });
    expect(clear.status).toBe(400);
  });

  it('completes and reopens a one-off task', async () => {
    const u = await registerUser();
    const t = await request(app).post(api('/tasks')).set(u.auth).send({ title: 'One-off', dueDate: '2026-10-11' });
    const done = await request(app).post(api(`/tasks/${t.body.data.id}/complete`)).set(u.auth).send({ today: '2026-10-11' });
    expect(done.body.data).toMatchObject({ completed: true, completedOn: '2026-10-11' });

    const open = await request(app).get(api('/tasks?status=open')).set(u.auth);
    expect(open.body.data).toHaveLength(0);
    const completed = await request(app).get(api('/tasks?status=completed')).set(u.auth);
    expect(completed.body.data).toHaveLength(1);

    const reopened = await request(app).post(api(`/tasks/${t.body.data.id}/reopen`)).set(u.auth);
    expect(reopened.body.data).toMatchObject({ completed: false, completedOn: null });
  });

  it('rolls recurring tasks forward instead of completing them, and undo restores', async () => {
    const u = await registerUser();
    const t = await request(app)
      .post(api('/tasks'))
      .set(u.auth)
      .send({ title: 'Pay rent', dueDate: '2026-01-31', recurrence: 'monthly' });
    const id = t.body.data.id;

    const done = await request(app).post(api(`/tasks/${id}/complete`)).set(u.auth).send({ today: '2026-01-31' });
    expect(done.body.data).toMatchObject({ completed: false, dueDate: '2026-02-28', previousDueDate: '2026-01-31' });

    const again = await request(app).post(api(`/tasks/${id}/complete`)).set(u.auth).send({ today: '2026-02-28' });
    // Anchor day 31 restores the end of month in March.
    expect(again.body.data.dueDate).toBe('2026-03-31');

    const undo = await request(app).post(api(`/tasks/${id}/reopen`)).set(u.auth);
    expect(undo.body.data.dueDate).toBe('2026-02-28');
  });

  it('pages through completed tasks with a cursor', async () => {
    const u = await registerUser();
    for (let i = 0; i < 5; i++) {
      const t = await request(app).post(api('/tasks')).set(u.auth).send({ title: `Task ${i}` });
      await request(app).post(api(`/tasks/${t.body.data.id}/complete`)).set(u.auth).send({ today: '2026-10-11' });
    }
    const page1 = await request(app).get(api('/tasks?status=completed&limit=2')).set(u.auth);
    expect(page1.body.data).toHaveLength(2);
    expect(page1.body.nextCursor).toEqual(expect.any(String));

    const seen = new Set(page1.body.data.map((t: { id: string }) => t.id));
    let cursor = page1.body.nextCursor;
    while (cursor) {
      const page = await request(app).get(api(`/tasks?status=completed&limit=2&cursor=${cursor}`)).set(u.auth);
      page.body.data.forEach((t: { id: string }) => seen.add(t.id));
      cursor = page.body.nextCursor;
    }
    expect(seen.size).toBe(5);

    const bad = await request(app).get(api('/tasks?status=completed&cursor=garbage')).set(u.auth);
    expect(bad.status).toBe(400);
  });

  it("isolates tasks between users", async () => {
    const alice = await registerUser();
    const bob = await registerUser();
    const t = await request(app).post(api('/tasks')).set(alice.auth).send({ title: "Alice's secret" });
    const id = t.body.data.id;

    expect((await request(app).get(api(`/tasks/${id}`)).set(bob.auth)).status).toBe(404);
    expect((await request(app).patch(api(`/tasks/${id}`)).set(bob.auth).send({ title: 'hacked' })).status).toBe(404);
    expect((await request(app).post(api(`/tasks/${id}/complete`)).set(bob.auth).send({ today: '2026-10-11' })).status).toBe(404);
    expect((await request(app).delete(api(`/tasks/${id}`)).set(bob.auth)).status).toBe(404);
    expect((await request(app).get(api('/tasks')).set(bob.auth)).body.data).toHaveLength(0);

    const still = await request(app).get(api(`/tasks/${id}`)).set(alice.auth);
    expect(still.body.data.title).toBe("Alice's secret");
  });

  it('ignores attempts to set server-owned fields', async () => {
    const u = await registerUser();
    const other = await registerUser();
    const t = await request(app)
      .post(api('/tasks'))
      .set(u.auth)
      .send({ title: 'x', user: other.id, completed: true, _id: '507f1f77bcf86cd799439011' });
    expect(t.status).toBe(201);
    expect(t.body.data.completed).toBe(false);
    expect((await request(app).get(api('/tasks')).set(other.auth)).body.data).toHaveLength(0);
  });

  it('rejects malformed ids', async () => {
    const u = await registerUser();
    expect((await request(app).get(api('/tasks/not-an-id')).set(u.auth)).status).toBe(400);
  });
});
