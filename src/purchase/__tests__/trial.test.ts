import { isTrialExpired, trialHoursRemaining, FREE_TRIAL_HOURS } from '../trial';

describe('isTrialExpired', () => {
  const start = '2026-07-01';

  it('is not expired immediately after the phase starts', () => {
    expect(isTrialExpired(start, new Date('2026-07-01T00:00:01'))).toBe(false);
  });

  it('is not expired at 71 hours, 59 minutes', () => {
    expect(isTrialExpired(start, new Date('2026-07-03T23:59:00'))).toBe(false);
  });

  it('is expired at exactly 72 hours', () => {
    expect(isTrialExpired(start, new Date('2026-07-04T00:00:00'))).toBe(true);
  });

  it('is expired well past 72 hours', () => {
    expect(isTrialExpired(start, new Date('2026-07-10T00:00:00'))).toBe(true);
  });
});

describe('trialHoursRemaining', () => {
  const start = '2026-07-01';

  it('reports the full window right at the start', () => {
    expect(trialHoursRemaining(start, new Date('2026-07-01T00:00:00'))).toBe(FREE_TRIAL_HOURS);
  });

  it('counts down partway through', () => {
    expect(trialHoursRemaining(start, new Date('2026-07-02T00:00:00'))).toBe(48);
  });

  it('floors at 0 once expired, never negative', () => {
    expect(trialHoursRemaining(start, new Date('2026-07-10T00:00:00'))).toBe(0);
  });
});
