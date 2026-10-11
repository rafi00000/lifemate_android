import { z } from 'zod';
import { zObjectId } from '../../lib/validation.js';
import { zEmail } from '../auth/auth.schema.js';

const listName = z.string().trim().min(1, 'List name is required').max(60, 'List name is too long');

export const createListSchema = z.object({ name: listName });
export const renameListSchema = z.object({ name: listName });

const itemFields = {
  name: z.string().trim().min(1, 'Item name is required').max(100, 'Item name is too long'),
  quantity: z.number().min(0.01, 'Quantity must be more than zero').max(9999, 'Quantity is too large'),
  unit: z.string().trim().max(12, 'Unit is too long'),
  purchased: z.boolean(),
};

export const createItemSchema = z.object({
  name: itemFields.name,
  quantity: itemFields.quantity.default(1),
  unit: itemFields.unit.default(''),
});

export const updateItemSchema = z
  .object(itemFields)
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const listParams = z.object({ id: zObjectId });
export const itemParams = z.object({ id: zObjectId, itemId: zObjectId });
export const memberParams = z.object({ id: zObjectId, userId: zObjectId });
export const shareSchema = z.object({ email: zEmail });

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
