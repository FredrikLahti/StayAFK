import { domainProgress, overallProgress, FOUNDATION_HORIZON_DAYS } from '../progress';
import { FoundationStatus } from '../../domain/types';

function makeStatus(overrides: Partial<FoundationStatus> = {}): FoundationStatus {
  return {
    domain: 'Move',
    establishedCapacityMinutes: 0,
    currentActivityState: 'restarted',
    consecutiveDays: 0,
    ...overrides,
  };
}

describe('domainProgress', () => {
  it('is 0 at day 0', () => {
    expect(domainProgress(makeStatus({ consecutiveDays: 0 }))).toBe(0);
  });

  it('is 1 at the full horizon', () => {
    expect(domainProgress(makeStatus({ consecutiveDays: FOUNDATION_HORIZON_DAYS }))).toBe(1);
  });

  it('is a linear fraction partway through the horizon', () => {
    expect(domainProgress(makeStatus({ consecutiveDays: FOUNDATION_HORIZON_DAYS / 2 }))).toBeCloseTo(0.5);
  });

  it('clamps at 1 past the horizon rather than exceeding it', () => {
    expect(domainProgress(makeStatus({ consecutiveDays: FOUNDATION_HORIZON_DAYS * 3 }))).toBe(1);
  });
});

describe('overallProgress', () => {
  it('averages progress across all given domains', () => {
    const statuses = [
      makeStatus({ domain: 'Sleep', consecutiveDays: FOUNDATION_HORIZON_DAYS }), // 1.0
      makeStatus({ domain: 'Move', consecutiveDays: 0 }), // 0.0
    ];
    expect(overallProgress(statuses)).toBeCloseTo(0.5);
  });

  it('is 0 for an empty list rather than dividing by zero', () => {
    expect(overallProgress([])).toBe(0);
  });
});
