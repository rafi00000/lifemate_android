import { Schema, model, Types, type InferSchemaType } from '../../db/mongoose.js';

const checklistItemSchema = new Schema({
  text: { type: String, required: true, trim: true, maxlength: 200 },
  done: { type: Boolean, default: false },
});

const noteSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true },
    title: { type: String, trim: true, maxlength: 120, default: '' },
    body: { type: String, maxlength: 10_000, default: '' },
    checklist: { type: [checklistItemSchema], default: [] },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true },
);

noteSchema.index({ user: 1, pinned: -1, updatedAt: -1 });

export type Note = InferSchemaType<typeof noteSchema>;
export const NoteModel = model('Note', noteSchema);
