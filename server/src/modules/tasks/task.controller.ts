import type { RequestHandler } from 'express';
import * as service from './task.service.js';

export const list: RequestHandler = async (_req, res) => {
  const { items, nextCursor } = await service.listTasks(res.locals.userId, res.locals.query);
  res.json({ data: items, nextCursor });
};

export const get: RequestHandler = async (_req, res) => {
  res.json({ data: await service.getTask(res.locals.userId, res.locals.params.id) });
};

export const create: RequestHandler = async (_req, res) => {
  res.status(201).json({ data: await service.createTask(res.locals.userId, res.locals.body) });
};

export const update: RequestHandler = async (_req, res) => {
  res.json({ data: await service.updateTask(res.locals.userId, res.locals.params.id, res.locals.body) });
};

export const remove: RequestHandler = async (_req, res) => {
  await service.deleteTask(res.locals.userId, res.locals.params.id);
  res.status(204).end();
};

export const complete: RequestHandler = async (_req, res) => {
  res.json({ data: await service.completeTask(res.locals.userId, res.locals.params.id, res.locals.body.today) });
};

export const reopen: RequestHandler = async (_req, res) => {
  res.json({ data: await service.reopenTask(res.locals.userId, res.locals.params.id) });
};
