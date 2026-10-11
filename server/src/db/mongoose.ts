import mongoose, { type Schema } from 'mongoose';

/**
 * Shared Mongoose setup. Every model file imports `Schema`/`model` from here,
 * which guarantees this runs before any model is compiled.
 *
 * Serialisation: `id` instead of `_id`, no `__v`, and fields that must never
 * leave the server are stripped centrally so no route can forget to.
 */
const NEVER_SERIALISE = ['_id', 'user', 'passwordHash', 'tokenVersion'] as const;

function toJSONPlugin(schema: Schema) {
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc: unknown, ret: Record<string, unknown>) => {
      for (const key of NEVER_SERIALISE) delete ret[key];
      return ret;
    },
  });
}

mongoose.plugin(toJSONPlugin);
// Drop filter keys that are not in the schema. Operator injection
// (`{ "email": { "$ne": null } }`) is prevented earlier: every request value
// passes a zod schema that only admits primitives before reaching a query.
mongoose.set('strictQuery', true);

export { Schema, Types, model } from 'mongoose';
export type { InferSchemaType, HydratedDocument } from 'mongoose';
export default mongoose;
