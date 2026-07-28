import { daysBetween, getLastActivityDate, getSilenceLevel } from '../silence';

describe('daysBetween', () => {
  it('returns 0 for the same date', () => {
    expect(daysBetween('2026-07-01', '2026-07-01')).toBe(0);
  });

  it('counts whole days elapsed', () => {
    expect(daysBetween('2026-07-01', '2026-07-03')).toBe(2);
  });
});

describe('getSilenceLevel', () => {
  it('is none below the check-in prompt threshold', () => {
    expect(getSilenceLevel(0)).toBe('none');
    expect(getSilenceLevel(1)).toBe('none');
  });

  it('is checkInPrompt at exactly 2 days and below the life-check threshold', () => {
    expect(getSilenceLevel(2)).toBe('checkInPrompt');
    expect(getSilenceLevel(6)).toBe('checkInPrompt');
  });

  it('is lifeCheckMessage at exactly 7 days and beyond', () => {
    expect(getSilenceLevel(7)).toBe('lifeCheckMessage');
    expect(getSilenceLevel(30)).toBe('lifeCheckMessage');
  });
});

describe('getLastActivityDate', () => {
  it('falls back to the given fallback date when nothing has been logged', () => {
    const result = getLastActivityDate({
      mostRecentActiveScheduleDate: null,
      cravingEventDates: [],
      relapseEventDates: [],
      fallbackDate: '2026-07-01',
    });
    expect(result).toBe('2026-07-01');
  });

  it('picks the most recent date across schedule/craving/relapse activity', () => {
    const result = getLastActivityDate({
      mostRecentActiveScheduleDate: '2026-07-02',
      cravingEventDates: ['2026-07-05', '2026-07-01'],
      relapseEventDates: ['2026-07-03'],
      fallbackDate: '2026-06-01',
    });
    expect(result).toBe('2026-07-05');
  });

  it('ignores the fallback once any real activity exists', () => {
    const result = getLastActivityDate({
      mostRecentActiveScheduleDate: null,
      cravingEventDates: ['2026-07-01'],
      relapseEventDates: [],
      fallbackDate: '2026-07-10', // later than the real activity, must not win
    });
    expect(result).toBe('2026-07-01');
  });
});
