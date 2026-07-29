import { computeWeeklyFloorProgress } from '../weeklyFloorProgress';
import { DomainFloor, ScheduleSlot } from '../../domain/types';

function makeSlot(overrides: Partial<ScheduleSlot> = {}): ScheduleSlot {
  return {
    id: 's1',
    date: '2026-07-28',
    timeWindow: 'morning',
    domain: 'Move',
    durationMinutes: 45,
    assignedActivityId: null,
    equivalentActivityId: null,
    status: 'done',
    phaseAtCreation: 'reset',
    ...overrides,
  };
}

function makeFloor(overrides: Partial<DomainFloor> = {}): DomainFloor {
  return {
    domain: 'Move',
    weeklyMinimumMinutes: 270,
    minSessionsPerWeek: 6,
    notes: '',
    ...overrides,
  };
}

describe('computeWeeklyFloorProgress', () => {
  it('sums only done/equivalent minutes for the given domain', () => {
    const slots = [
      makeSlot({ id: 'a', status: 'done', durationMinutes: 45 }),
      makeSlot({ id: 'b', status: 'equivalent', durationMinutes: 30 }),
      makeSlot({ id: 'c', status: 'missed', durationMinutes: 100 }),
      makeSlot({ id: 'd', status: 'pending', durationMinutes: 100 }),
      makeSlot({ id: 'e', domain: 'Fuel', status: 'done', durationMinutes: 999 }),
    ];
    const result = computeWeeklyFloorProgress('Move', slots, makeFloor());
    expect(result.completedMinutes).toBe(75);
    expect(result.targetMinutes).toBe(270);
    expect(result.fraction).toBeCloseTo(75 / 270);
  });

  it('clamps fraction at 1 when the floor is exceeded', () => {
    const slots = [makeSlot({ durationMinutes: 999, status: 'done' })];
    const result = computeWeeklyFloorProgress('Move', slots, makeFloor({ weeklyMinimumMinutes: 100 }));
    expect(result.fraction).toBe(1);
  });

  it('does not divide by zero for a domain with no weekly floor', () => {
    const result = computeWeeklyFloorProgress('Maintain', [], makeFloor({ domain: 'Maintain', weeklyMinimumMinutes: 0 }));
    expect(result.fraction).toBe(0);
    expect(result.targetMinutes).toBe(0);
  });
});
