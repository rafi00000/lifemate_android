const UNIT = '(kg|g|l|pcs|dozen|packet)?';
const LEADING = new RegExp(`^(\\d+(?:\\.\\d+)?)\\s*${UNIT}\\s+(.+)$`, 'i');
const TRAILING = new RegExp(`^(.+?)\\s+[x×]?(\\d+(?:\\.\\d+)?)\\s*${UNIT}$`, 'i');

const normaliseUnit = (u?: string) => (!u ? '' : u.toLowerCase() === 'l' ? 'L' : u.toLowerCase());

/**
 * Lets people type items the way they'd say them:
 * "2 kg rice", "rice 2kg", "eggs x12", "milk" -> name, quantity, unit.
 */
export function parseQuickItem(raw: string): { name: string; quantity: number; unit: string } {
  const text = raw.trim().replace(/\s+/g, ' ');
  const lead = text.match(LEADING);
  if (lead) return { quantity: Number(lead[1]), unit: normaliseUnit(lead[2]), name: lead[3]! };
  const trail = text.match(TRAILING);
  if (trail) return { name: trail[1]!, quantity: Number(trail[2]), unit: normaliseUnit(trail[3]) };
  return { name: text, quantity: 1, unit: '' };
}
