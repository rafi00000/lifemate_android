import type { RequestHandler } from 'express';
import * as service from './bill.service.js';

export const list: RequestHandler = async (_req, res) => {
  res.json({ data: await service.listBills(res.locals.userId, res.locals.query.status) });
};

export const get: RequestHandler = async (_req, res) => {
  res.json({ data: await service.getBill(res.locals.userId, res.locals.params.id) });
};

export const create: RequestHandler = async (_req, res) => {
  res.status(201).json({ data: await service.createBill(res.locals.userId, res.locals.body) });
};

export const update: RequestHandler = async (_req, res) => {
  res.json({ data: await service.updateBill(res.locals.userId, res.locals.params.id, res.locals.body) });
};

export const remove: RequestHandler = async (_req, res) => {
  await service.deleteBill(res.locals.userId, res.locals.params.id);
  res.status(204).end();
};

export const pay: RequestHandler = async (_req, res) => {
  res.json({ data: await service.payBill(res.locals.userId, res.locals.params.id, res.locals.body) });
};

export const undoPayment: RequestHandler = async (_req, res) => {
  res.json({ data: await service.undoPayment(res.locals.userId, res.locals.params.id) });
};
