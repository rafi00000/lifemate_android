import { Router } from 'express';
import { idParams, validate } from '../../lib/validation.js';
import * as controller from './expense.controller.js';
import { createExpenseSchema, listExpensesQuery, summaryQuery, updateExpenseSchema } from './expense.schema.js';

export const expenseRouter = Router();

expenseRouter.get('/', validate('query', listExpensesQuery), controller.list);
expenseRouter.get('/summary', validate('query', summaryQuery), controller.summary);
expenseRouter.post('/', validate('body', createExpenseSchema), controller.create);
expenseRouter.patch('/:id', validate('params', idParams), validate('body', updateExpenseSchema), controller.update);
expenseRouter.delete('/:id', validate('params', idParams), controller.remove);
