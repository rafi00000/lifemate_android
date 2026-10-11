import { Router } from 'express';
import { idParams, validate } from '../../lib/validation.js';
import * as controller from './bill.controller.js';
import { createBillSchema, listBillsQuery, payBillSchema, updateBillSchema } from './bill.schema.js';

export const billRouter = Router();

billRouter.get('/', validate('query', listBillsQuery), controller.list);
billRouter.post('/', validate('body', createBillSchema), controller.create);
billRouter.get('/:id', validate('params', idParams), controller.get);
billRouter.patch('/:id', validate('params', idParams), validate('body', updateBillSchema), controller.update);
billRouter.delete('/:id', validate('params', idParams), controller.remove);
billRouter.post('/:id/pay', validate('params', idParams), validate('body', payBillSchema), controller.pay);
billRouter.post('/:id/undo-payment', validate('params', idParams), controller.undoPayment);
