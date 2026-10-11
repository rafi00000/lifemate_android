import {
  addDays,
  addMonths,
  diffDays,
  dueLabel,
  formatShortDate,
  formatTime,
  greetingFor,
  monthGrid,
  nextOccurrence,
  relativeDayLabel,
  shiftMonth,
  toLocalDate,
} from '@/utils/date';

describe('calendar arithmetic', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
  });

  it('keeps the anchor day across short months', () => {
    expect(addMonths('2026-01-31', 1, 31)).toBe('2026-02-28');
    expect(nextOccurrence('2026-02-28', 'monthly', 31)).toBe('2026-03-31');
    expect(nextOccurrence('2026-10-11', 'weekly')).toBe('2026-10-18');
    expect(nextOccurrence('2026-10-11', 'none')).toBe('2026-10-11');
  });

  it('measures whole days', () => {
    expect(diffDays('2026-10-11', '2026-10-18')).toBe(7);
    expect(diffDays('2026-10-11', '2026-10-09')).toBe(-2);
  });

  it('builds local dates at wall-clock time', () => {
    const d = toLocalDate('2026-10-11', '17:30');
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()]).toEqual([2026, 9, 11, 17, 30]);
  });

  it('lays out a 6-week month grid starting on Saturday', () => {
    const grid = monthGrid('2026-10', 6);
    expect(grid).toHaveLength(42);
    expect(grid[0]).toBe('2026-09-26'); // Saturday before Thu 1 Oct
    expect(grid).toContain('2026-10-31');
  });
});

describe('labels', () => {
  const today = '2026-10-11'; // Sunday
  it('describes days relative to today', () => {
    expect(relativeDayLabel('2026-10-11', today)).toBe('Today');
    expect(relativeDayLabel('2026-10-12', today)).toBe('Tomorrow');
    expect(relativeDayLabel('2026-10-10', today)).toBe('Yesterday');
    expect(relativeDayLabel('2026-10-14', today)).toBe('Wednesday');
    expect(relativeDayLabel('2026-10-25', today)).toBe('25 Oct');
    expect(relativeDayLabel('2027-01-05', today)).toBe('5 Jan 2027');
  });

  it('describes bill due dates', () => {
    expect(dueLabel('2026-10-11', today)).toBe('Due today');
    expect(dueLabel('2026-10-14', today)).toBe('Due in 3 days');
    expect(dueLabel('2026-10-10', today)).toBe('1 day overdue');
    expect(dueLabel('2026-10-01', today)).toBe('10 days overdue');
    expect(dueLabel('2026-12-01', today)).toBe('Due 1 Dec');
  });

  it('formats dates and times', () => {
    expect(formatShortDate('2026-10-11')).toBe('Sun, 11 Oct');
    expect(formatTime('00:05')).toBe('12:05 AM');
    expect(formatTime('12:00')).toBe('12:00 PM');
    expect(formatTime('17:30')).toBe('5:30 PM');
  });

  it('greets by time of day', () => {
    expect(greetingFor(new Date(2026, 9, 11, 8))).toBe('Good morning');
    expect(greetingFor(new Date(2026, 9, 11, 14))).toBe('Good afternoon');
    expect(greetingFor(new Date(2026, 9, 11, 20))).toBe('Good evening');
  });
});
