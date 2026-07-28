import { isTrialExpired, trialHoursRemaining, FREE_TRIAL_HOURS } from '../trial';

// Anchored mid-afternoon (not midnight) deliberately - this is the case the
// fix targets: everyone gets a real 72 hours from the exact moment Reset
// started, not from midnight of that day.
describe('isTrialExpired', () => {
  const start = '2026-07-01T15:00:00.000Z';

  it('is not expired immediately after the phase starts', () => {
    expect(isTrialExpired(start, new Date('2026-07-01T15:00:01.000Z'))).toBe(false);
  });

  it('is not expired at 71 hours, 59 minutes from the exact start moment', () => {
    expect(isTrialExpired(start, new Date('2026-07-04T14:59:00.000Z'))).toBe(false);
  });

  it('is expired at exactly 72 hours from the exact start moment', () => {
    expect(isTrialExpired(start, new Date('2026-07-04T15:00:00.000Z'))).toBe(true);
  });

  it('is expired well past 72 hours', () => {
    expect(isTrialExpired(start, new Date('2026-07-10T00:00:00.000Z'))).toBe(true);
  });

  it('does not expire early just because midnight of the start day has passed', () => {
    // Old (buggy) behavior anchored to midnight of the start date would have
    // this already expired (more than 72h since 2026-07-01T00:00). The fix
    // anchors to the real start moment (15:00), so this is still within trial.
    expect(isTrialExpired(start, new Date('2026-07-04T10:00:00.000Z'))).toBe(false);
  });
});

describe('trialHoursRemaining', () => {
  const start = '2026-07-01T15:00:00.000Z';

  it('reports the full window right at the start', () => {
    expect(trialHoursRemaining(start, new Date('2026-07-01T15:00:00.000Z'))).toBe(FREE_TRIAL_HOURS);
  });

  it('counts down partway through', () => {
    expect(trialHoursRemaining(start, new Date('2026-07-02T15:00:00.000Z'))).toBe(48);
  });

  it('floors at 0 once expired, never negative', () => {
    expect(trialHoursRemaining(start, new Date('2026-07-10T00:00:00.000Z'))).toBe(0);
  });
});
