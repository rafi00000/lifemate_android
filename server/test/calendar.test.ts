import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  advancePast,
  diffDays,
  isValidDate,
  monthRange,
  nextOccurrence,
} from '../src/lib/calendar.js';

describe('calendar dates', () => {
  it('validates real calendar dates only', () => {
    expect(isValidDate('2026-02-28')).toBe(true);
    expect(isValidDate('2028-02-29')).toBe(true); // leap year
    expect(isValidDate('2026-02-29')).toBe(false);
    expect(isValidDate('2026-04-31')).toBe(false);
    expect(isValidDate('2026-13-01')).toBe(false);
    expect(isValidDate('26-01-01')).toBe(false);
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('clamps month arithmetic to the last day and restores the anchor day', () => {
    expect(addMonths('2026-01-31', 1, 31)).toBe('2026-02-28');
    expect(addMonths('2026-02-28', 1, 31)).toBe('2026-03-31');
    expect(addMonths('2028-01-30', 1, 30)).toBe('2028-02-29');
    expect(addMonths('2026-11-15', 2)).toBe('2027-01-15');
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-15');
  });

  it('computes next occurrences per rule', () => {
    expect(nextOccurrence('2026-10-11', 'daily')).toBe('2026-10-12');
    expect(nextOccurrence('2026-10-11', 'weekly')).toBe('2026-10-18');
    expect(nextOccurrence('2026-10-31', 'monthly', 31)).toBe('2026-11-30');
    expect(nextOccurrence('2028-02-29', 'yearly', 29)).toBe('2029-02-28');
    expect(nextOccurrence('2026-10-11', 'none')).toBe('2026-10-11');
  });

  it('rolls an overdue series forward past today, keeping its weekday', () => {
    // Weekly on Mondays, three weeks overdue, completed on a Thursday.
    expect(advancePast('2026-09-21', 'weekly', '2026-10-15')).toBe('2026-10-19');
    // Completed on time moves exactly one step.
    expect(advancePast('2026-10-11', 'daily', '2026-10-11')).toBe('2026-10-12');
    // Completed early still moves one step.
    expect(advancePast('2026-10-20', 'monthly', '2026-10-11', 20)).toBe('2026-11-20');
  });

  it('computes month ranges and day differences', () => {
    expect(monthRange('2026-12')).toEqual({ start: '2026-12-01', end: '2027-01-01' });
    expect(diffDays('2026-10-11', '2026-10-14')).toBe(3);
    expect(diffDays('2026-10-11', '2026-10-01')).toBe(-10);
  });
});
