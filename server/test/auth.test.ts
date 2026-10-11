import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { api, app, registerUser } from './helpers.js';

describe('auth', () => {
  it('registers a user and never returns the password hash', async () => {
    const res = await request(app)
      .post(api('/auth/register'))
      .send({ name: 'Rafi', email: 'Rafi@Example.com ', password: 'Password123' });
    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({ name: 'Rafi', email: 'rafi@example.com', currency: 'BDT' });
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.user._id).toBeUndefined();
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.refreshToken).toEqual(expect.any(String));
  });

  it('rejects duplicate emails case-insensitively', async () => {
    await registerUser({ email: 'dup@example.com' });
    const res = await request(app)
      .post(api('/auth/register'))
      .send({ name: 'Other', email: 'DUP@example.com', password: 'Password123' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('validates registration input', async () => {
    const weak = await request(app).post(api('/auth/register')).send({ name: 'A', email: 'a@b.co', password: 'short' });
    expect(weak.status).toBe(400);
    expect(weak.body.error.code).toBe('VALIDATION_ERROR');

    const noDigit = await request(app)
      .post(api('/auth/register'))
      .send({ name: 'A', email: 'a@b.co', password: 'onlyletters' });
    expect(noDigit.status).toBe(400);

    const badEmail = await request(app)
      .post(api('/auth/register'))
      .send({ name: 'A', email: 'not-an-email', password: 'Password123' });
    expect(badEmail.status).toBe(400);
  });

  it('logs in with correct credentials and gives one generic error otherwise', async () => {
    const user = await registerUser({ email: 'login@example.com' });
    const ok = await request(app).post(api('/auth/login')).send({ email: 'login@example.com', password: user.password });
    expect(ok.status).toBe(200);

    const wrongPassword = await request(app)
      .post(api('/auth/login'))
      .send({ email: 'login@example.com', password: 'Wrong12345' });
    const unknownEmail = await request(app)
      .post(api('/auth/login'))
      .send({ email: 'nobody@example.com', password: 'Wrong12345' });
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error).toEqual(unknownEmail.body.error);
  });

  it('rejects NoSQL operator payloads in login', async () => {
    await registerUser({ email: 'victim@example.com' });
    const res = await request(app)
      .post(api('/auth/login'))
      .send({ email: { $ne: null }, password: { $ne: null } });
    expect(res.status).toBe(400);
  });

  it('requires a valid bearer token on protected routes', async () => {
    const missing = await request(app).get(api('/users/me'));
    expect(missing.status).toBe(401);

    const garbage = await request(app).get(api('/users/me')).set('Authorization', 'Bearer not-a-jwt');
    expect(garbage.status).toBe(401);

    const forged = jwt.sign({ sub: '507f1f77bcf86cd799439011', ver: 0 }, 'some-other-secret-that-is-long-enough!!');
    const forgedRes = await request(app).get(api('/users/me')).set('Authorization', `Bearer ${forged}`);
    expect(forgedRes.status).toBe(401);
  });

  it('reports expired access tokens with a distinct code', async () => {
    const user = await registerUser();
    const expired = jwt.sign({ sub: user.id, ver: 0 }, process.env.JWT_ACCESS_SECRET!, {
      algorithm: 'HS256',
      expiresIn: -10,
      issuer: 'lifemate-api',
      audience: 'lifemate-app',
    });
    const res = await request(app).get(api('/users/me')).set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  it('rotates refresh tokens and revokes the family when an old one is replayed', async () => {
    const user = await registerUser();
    const first = await request(app).post(api('/auth/refresh')).send({ refreshToken: user.refreshToken });
    expect(first.status).toBe(200);
    const rotated = first.body.data.refreshToken;
    expect(rotated).not.toBe(user.refreshToken);

    // Replaying the original token is treated as theft...
    const replay = await request(app).post(api('/auth/refresh')).send({ refreshToken: user.refreshToken });
    expect(replay.status).toBe(401);
    // ...which also kills the legitimately rotated token.
    const afterReplay = await request(app).post(api('/auth/refresh')).send({ refreshToken: rotated });
    expect(afterReplay.status).toBe(401);
  });

  it('logout revokes the refresh token', async () => {
    const user = await registerUser();
    const out = await request(app).post(api('/auth/logout')).send({ refreshToken: user.refreshToken });
    expect(out.status).toBe(204);
    const res = await request(app).post(api('/auth/refresh')).send({ refreshToken: user.refreshToken });
    expect(res.status).toBe(401);
  });

  it('changing the password signs out other sessions but keeps the current one', async () => {
    const user = await registerUser();
    const other = await request(app).post(api('/auth/login')).send({ email: user.email, password: user.password });
    const otherRefresh = other.body.data.refreshToken;

    const changed = await request(app)
      .post(api('/users/me/password'))
      .set(user.auth)
      .send({ currentPassword: user.password, newPassword: 'NewPassword456', refreshToken: user.refreshToken });
    expect(changed.status).toBe(200);

    // Old access token (old token version) no longer works.
    expect((await request(app).get(api('/users/me')).set(user.auth)).status).toBe(401);
    // The new access token does.
    const fresh = { Authorization: `Bearer ${changed.body.data.accessToken}` };
    expect((await request(app).get(api('/users/me')).set(fresh)).status).toBe(200);
    // The other device's refresh token is revoked; this device's still works.
    expect((await request(app).post(api('/auth/refresh')).send({ refreshToken: otherRefresh })).status).toBe(401);
    expect((await request(app).post(api('/auth/refresh')).send({ refreshToken: user.refreshToken })).status).toBe(200);
    // And the new password is required to log in.
    const login = await request(app).post(api('/auth/login')).send({ email: user.email, password: 'NewPassword456' });
    expect(login.status).toBe(200);
  });

  it('rejects a wrong current password', async () => {
    const user = await registerUser();
    const res = await request(app)
      .post(api('/users/me/password'))
      .set(user.auth)
      .send({ currentPassword: 'Wrong12345', newPassword: 'NewPassword456' });
    expect(res.status).toBe(401);
  });

  it('deletes the account and everything it owns', async () => {
    const user = await registerUser();
    await request(app).post(api('/tasks')).set(user.auth).send({ title: 'Something' });
    const res = await request(app).delete(api('/users/me')).set(user.auth).send({ password: user.password });
    expect(res.status).toBe(204);
    const login = await request(app).post(api('/auth/login')).send({ email: user.email, password: user.password });
    expect(login.status).toBe(401);
  });

  it('returns JSON errors for malformed bodies and unknown routes', async () => {
    const bad = await request(app).post(api('/auth/login')).set('Content-Type', 'application/json').send('{"email":');
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('VALIDATION_ERROR');

    const missing = await request(app).get('/nope');
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('NOT_FOUND');
  });
});
