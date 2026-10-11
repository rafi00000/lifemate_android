import { Types } from 'mongoose';
import { badRequest } from './errors.js';

/**
 * Opaque keyset cursors: base64url of "<sortValue>|<objectId>". Keyset paging
 * stays correct while records are added or removed, unlike skip/limit.
 */
export function encodeCursor(sortValue: string, id: string): string {
  return Buffer.from(`${sortValue}|${id}`, 'utf8').toString('base64url');
}

export function decodeCursor(cursor: string): { sortValue: string; id: Types.ObjectId } {
  const raw = Buffer.from(cursor, 'base64url').toString('utf8');
  const sep = raw.lastIndexOf('|');
  const sortValue = raw.slice(0, sep);
  const id = raw.slice(sep + 1);
  if (sep <= 0 || !Types.ObjectId.isValid(id)) throw badRequest('Invalid cursor');
  return { sortValue, id: new Types.ObjectId(id) };
}
