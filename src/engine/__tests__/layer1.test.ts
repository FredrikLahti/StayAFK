import { computeFreeTimeWindows, FREE_TIME_BAND_MINUTES } from '../layer1';
import { DailyFreeTimeCheck, UserProfile } from '../../domain/types';

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'u1',
    baselineFreeTimeWeekday: '2to4',
    baselineFreeTimeWeekend: '4to6',
    typicalFreeWindows: ['evening', 'night'],
    workScheduleType: 'fixed',
    caregivingFlag: 'none',
    physicalLimitations: false,
    gymAccess: 'yes_will_use',
    highRiskWindows: ['late_night'],
    livingSituation: 'alone',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeCheck(overrides: Partial<DailyFreeTimeCheck> = {}): DailyFreeTimeCheck {
  return {
    date: '2026-07-28',
    responseType: 'same_as_usual',
    source: 'auto_baseline',
    ...overrides,
  };
}

describe('computeFreeTimeWindows (Layer 1)', () => {
  it('uses the weekday baseline band and typical windows on a same_as_usual weekday', () => {
    const profile = makeProfile();
    const check = makeCheck();
    // 2026-07-28 is a Tuesday.
    const windows = computeFreeTimeWindows(profile, check, new Date('2026-07-28T00:00:00'));

    const total = windows.reduce((sum, w) => sum + w.minutes, 0);
    expect(total).toBe(FREE_TIME_BAND_MINUTES['2to4']);
    expect(windows.map((w) => w.window)).toEqual(['evening', 'night']);
  });

  it('uses the weekend baseline band on a weekend day', () => {
    const profile = makeProfile();
    const check = makeCheck();
    // 2026-08-01 is a Saturday.
    const windows = computeFreeTimeWindows(profile, check, new Date('2026-08-01T00:00:00'));

    const total = windows.reduce((sum, w) => sum + w.minutes, 0);
    expect(total).toBe(FREE_TIME_BAND_MINUTES['4to6']);
  });

  it('splits minutes evenly across windows with the remainder on earlier windows', () => {
    const profile = makeProfile({ typicalFreeWindows: ['morning', 'afternoon', 'evening'] });
    const check = makeCheck();
    const windows = computeFreeTimeWindows(profile, check, new Date('2026-07-28T00:00:00'));

    // 2to4 band => 180 minutes / 3 windows = 60 each, no remainder.
    expect(windows).toEqual([
      { window: 'morning', minutes: 60 },
      { window: 'afternoon', minutes: 60 },
      { window: 'evening', minutes: 60 },
    ]);
  });

  it('ignores baseline hours/windows when the check reports "less" with an adjustment', () => {
    const profile = makeProfile();
    const check = makeCheck({
      responseType: 'less',
      adjustedHours: 'lt2',
      adjustedWindows: ['morning'],
      source: 'manual',
    });
    const windows = computeFreeTimeWindows(profile, check, new Date('2026-07-28T00:00:00'));

    expect(windows).toEqual([{ window: 'morning', minutes: FREE_TIME_BAND_MINUTES.lt2 }]);
  });

  it('falls back to the baseline windows if an adjustment only changes hours', () => {
    const profile = makeProfile({ typicalFreeWindows: ['evening'] });
    const check = makeCheck({ responseType: 'more', adjustedHours: '6plus' });
    const windows = computeFreeTimeWindows(profile, check, new Date('2026-07-28T00:00:00'));

    expect(windows).toEqual([{ window: 'evening', minutes: FREE_TIME_BAND_MINUTES['6plus'] }]);
  });

  it('returns no windows if the profile has no typical free windows', () => {
    const profile = makeProfile({ typicalFreeWindows: [] });
    const check = makeCheck();
    const windows = computeFreeTimeWindows(profile, check, new Date('2026-07-28T00:00:00'));

    expect(windows).toEqual([]);
  });
});
