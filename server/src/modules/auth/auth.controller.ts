import type { RequestHandler } from 'express';
import * as authService from './auth.service.js';
import { revokeRefreshToken } from './token.service.js';
import type { AuthResult } from './auth.service.js';

const toResponse = ({ user, accessToken, refreshToken }: AuthResult) => ({
  data: { user, accessToken, refreshToken },
});

export const register: RequestHandler = async (_req, res) => {
  res.status(201).json(toResponse(await authService.register(res.locals.body)));
};

export const login: RequestHandler = async (_req, res) => {
  res.json(toResponse(await authService.login(res.locals.body)));
};

export const refresh: RequestHandler = async (_req, res) => {
  res.json(toResponse(await authService.refresh(res.locals.body.refreshToken)));
};

export const logout: RequestHandler = async (_req, res) => {
  await revokeRefreshToken(res.locals.body.refreshToken);
  res.status(204).end();
};
