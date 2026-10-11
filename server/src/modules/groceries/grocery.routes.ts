import { Router } from 'express';
import { validate } from '../../lib/validation.js';
import * as c from './grocery.controller.js';
import {
  createItemSchema,
  createListSchema,
  itemParams,
  listParams,
  memberParams,
  renameListSchema,
  shareSchema,
  updateItemSchema,
} from './grocery.schema.js';

export const groceryRouter = Router();

groceryRouter.get('/', c.listLists);
groceryRouter.post('/', validate('body', createListSchema), c.createList);
groceryRouter.get('/:id', validate('params', listParams), c.getList);
groceryRouter.patch('/:id', validate('params', listParams), validate('body', renameListSchema), c.renameList);
groceryRouter.delete('/:id', validate('params', listParams), c.deleteList);

groceryRouter.post('/:id/items', validate('params', listParams), validate('body', createItemSchema), c.addItem);
groceryRouter.post('/:id/clear-purchased', validate('params', listParams), c.clearPurchased);
groceryRouter.patch('/:id/items/:itemId', validate('params', itemParams), validate('body', updateItemSchema), c.updateItem);
groceryRouter.delete('/:id/items/:itemId', validate('params', itemParams), c.deleteItem);

groceryRouter.post('/:id/members', validate('params', listParams), validate('body', shareSchema), c.share);
groceryRouter.delete('/:id/members/:userId', validate('params', memberParams), c.removeMember);
