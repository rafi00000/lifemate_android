import request from 'supertest';
import { createApp } from '../src/app.js';

export const app = createApp();
export const api = (path: string) => `/api/v1${path}`;

let counter = 0;

export interface TestUser {
  id: string;
  email: string;
  password: string;
  accessToken: string;
  refreshToken: string;
  auth: { Authorization: string };
}

export async function registerUser(overrides: Partial<{ name: string; email: string; password: string }> = {}) {
  counter += 1;
  const body = {
    name: overrides.name ?? `User ${counter}`,
    email: overrides.email ?? `user${counter}-${Date.now()}@example.com`,
    password: overrides.password ?? 'Password123',
  };
  const res = await request(app).post(api('/auth/register')).send(body);
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  const { user, accessToken, refreshToken } = res.body.data;
  return {
    id: user.id,
    email: body.email,
    password: body.password,
    accessToken,
    refreshToken,
    auth: { Authorization: `Bearer ${accessToken}` },
  } satisfies TestUser;
}
