import { Schema, model, Types, type InferSchemaType, type HydratedDocument } from '../../db/mongoose.js';

const groceryListSchema = new Schema(
  {
    owner: { type: Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    // Registered users the owner shared the list with (full item access).
    members: { type: [{ type: Types.ObjectId, ref: 'User' }], default: [] },
  },
  { timestamps: true },
);

groceryListSchema.index({ owner: 1, updatedAt: -1 });
groceryListSchema.index({ members: 1 });

/**
 * Items live in their own collection so two people ticking items in a shared
 * list update different documents and never overwrite each other.
 */
const groceryItemSchema = new Schema(
  {
    list: { type: Types.ObjectId, ref: 'GroceryList', required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    quantity: { type: Number, min: 0.01, max: 9999, default: 1 },
    unit: { type: String, trim: true, maxlength: 12, default: '' },
    purchased: { type: Boolean, default: false },
    purchasedAt: { type: Date, default: null },
    addedBy: { type: Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

groceryItemSchema.index({ list: 1, purchased: 1, createdAt: 1 });

export type GroceryList = InferSchemaType<typeof groceryListSchema>;
export type GroceryListDoc = HydratedDocument<GroceryList>;
export const GroceryListModel = model('GroceryList', groceryListSchema);
export const GroceryItemModel = model('GroceryItem', groceryItemSchema);
