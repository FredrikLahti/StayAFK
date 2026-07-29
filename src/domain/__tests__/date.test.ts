import { addDaysISO, dayOfMonth, formatDateHeading, getTrailingWeek, weekdayLabel } from '../date';

describe('addDaysISO', () => {
  it('adds days within the same month', () => {
    expect(addDaysISO('2026-07-20', 3)).toBe('2026-07-23');
  });

  it('subtracts days with a negative delta', () => {
    expect(addDaysISO('2026-07-20', -3)).toBe('2026-07-17');
  });

  it('rolls over a month boundary', () => {
    expect(addDaysISO('2026-07-31', 1)).toBe('2026-08-01');
  });

  it('rolls over a year boundary', () => {
    expect(addDaysISO('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('getTrailingWeek', () => {
  it('returns 7 dates ending at the given date, oldest first', () => {
    expect(getTrailingWeek('2026-07-28')).toEqual([
      '2026-07-22',
      '2026-07-23',
      '2026-07-24',
      '2026-07-25',
      '2026-07-26',
      '2026-07-27',
      '2026-07-28',
    ]);
  });
});

describe('weekdayLabel', () => {
  it('labels a known date correctly', () => {
    // 2026-07-28 is a Tuesday.
    expect(weekdayLabel('2026-07-28')).toBe('Tue');
  });
});

describe('dayOfMonth', () => {
  it('extracts the day number', () => {
    expect(dayOfMonth('2026-07-28')).toBe(28);
  });
});

describe('formatDateHeading', () => {
  it('formats a full heading', () => {
    expect(formatDateHeading('2026-07-28')).toBe('Tue, Jul 28');
  });
});
