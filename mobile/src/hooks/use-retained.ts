import { useState } from 'react';

/**
 * Returns `value`, or the last non-null value once it becomes null. Sheets
 * driven by "the selected item" use this so their content stays on screen
 * while the close animation plays, instead of collapsing mid-slide.
 */
export function useRetained<T>(value: T | null): T | null {
  const [kept, setKept] = useState(value);
  if (value !== null && value !== kept) setKept(value);
  return value ?? kept;
}
