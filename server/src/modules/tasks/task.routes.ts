import { Router } from 'express';
import { idParams, validate } from '../../lib/validation.js';
import * as controller from './task.controller.js';
import { completeTaskSchema, createTaskSchema, listTasksQuery, updateTaskSchema } from './task.schema.js';

export const taskRouter = Router();

taskRouter.get('/', validate('query', listTasksQuery), controller.list);
taskRouter.post('/', validate('body', createTaskSchema), controller.create);
taskRouter.get('/:id', validate('params', idParams), controller.get);
taskRouter.patch('/:id', validate('params', idParams), validate('body', updateTaskSchema), controller.update);
taskRouter.delete('/:id', validate('params', idParams), controller.remove);
taskRouter.post('/:id/complete', validate('params', idParams), validate('body', completeTaskSchema), controller.complete);
taskRouter.post('/:id/reopen', validate('params', idParams), controller.reopen);
