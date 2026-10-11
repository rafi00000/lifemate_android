import { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import { notFound } from '../../lib/errors.js';
import { idParams, validate, zObjectId } from '../../lib/validation.js';
import { NoteModel } from './note.model.js';

// Quick Notes is the proposal's "Could" module: plain CRUD, so the handlers
// live here instead of a separate controller/service pair.

const checklistItem = z.object({
  id: zObjectId.optional(), // existing items keep their id across edits
  text: z.string().trim().min(1).max(200),
  done: z.boolean().default(false),
});

const noteFields = {
  title: z.string().trim().max(120, 'Title is too long'),
  body: z.string().max(10_000, 'Note is too long'),
  checklist: z.array(checklistItem).max(100, 'A checklist can have up to 100 items'),
  pinned: z.boolean(),
};

const createNoteSchema = z
  .object({
    title: noteFields.title.default(''),
    body: noteFields.body.default(''),
    checklist: noteFields.checklist.default([]),
    pinned: noteFields.pinned.default(false),
  })
  .refine((n) => n.title || n.body.trim() || n.checklist.length, 'A note cannot be empty');

const updateNoteSchema = z
  .object(noteFields)
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

type ChecklistInput = z.infer<typeof checklistItem>[];
const toChecklist = (items: ChecklistInput) =>
  items.map(({ id, text, done }) => (id ? { _id: id, text, done } : { text, done }));

const list: RequestHandler = async (_req, res) => {
  const notes = await NoteModel.find({ user: res.locals.userId }).sort({ pinned: -1, updatedAt: -1 }).limit(500);
  res.json({ data: notes });
};

const get: RequestHandler = async (_req, res) => {
  const note = await NoteModel.findOne({ _id: res.locals.params.id, user: res.locals.userId });
  if (!note) throw notFound('Note');
  res.json({ data: note });
};

const create: RequestHandler = async (_req, res) => {
  const body = res.locals.body as z.infer<typeof createNoteSchema>;
  const note = await NoteModel.create({ ...body, checklist: toChecklist(body.checklist), user: res.locals.userId });
  res.status(201).json({ data: note });
};

const update: RequestHandler = async (_req, res) => {
  const body = res.locals.body as z.infer<typeof updateNoteSchema>;
  const set: Record<string, unknown> = { ...body };
  if (body.checklist) set.checklist = toChecklist(body.checklist);
  const note = await NoteModel.findOneAndUpdate({ _id: res.locals.params.id, user: res.locals.userId }, { $set: set }, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!note) throw notFound('Note');
  res.json({ data: note });
};

const remove: RequestHandler = async (_req, res) => {
  const result = await NoteModel.deleteOne({ _id: res.locals.params.id, user: res.locals.userId });
  if (result.deletedCount === 0) throw notFound('Note');
  res.status(204).end();
};

export const noteRouter = Router();
noteRouter.get('/', list);
noteRouter.post('/', validate('body', createNoteSchema), create);
noteRouter.get('/:id', validate('params', idParams), get);
noteRouter.patch('/:id', validate('params', idParams), validate('body', updateNoteSchema), update);
noteRouter.delete('/:id', validate('params', idParams), remove);
