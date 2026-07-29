import { computeWeeklyFloorProgress } from '../weeklyFloorProgress';
import { DomainFloor, ScheduleSlot } from '../../domain/types';

function makeSlot(overrides: Partial<ScheduleSlot> = {}): ScheduleSlot {
  return {
    id: 's1',
    date: '2026-07-28',
    kind: 'timeboxed',
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

describe('computeWeeklyFloorProgress - timeboxed domains (minutes)', () => {
  it('sums only done/equivalent minutes for the given domain', () => {
    const slots = [
      makeSlot({ id: 'a', status: 'done', durationMinutes: 45 }),
      makeSlot({ id: 'b', status: 'equivalent', durationMinutes: 30 }),
      makeSlot({ id: 'c', status: 'missed', durationMinutes: 100 }),
      makeSlot({ id: 'd', status: 'pending', durationMinutes: 100 }),
      makeSlot({ id: 'e', domain: 'Build', status: 'done', durationMinutes: 999 }),
    ];
    const result = computeWeeklyFloorProgress('Move', slots, makeFloor());
    expect(result.measure).toBe('minutes');
    expect(result.completed).toBe(75);
    expect(result.target).toBe(270);
    expect(result.fraction).toBeCloseTo(75 / 270);
  });

  it('clamps fraction at 1 when the floor is exceeded', () => {
    const slots = [makeSlot({ durationMinutes: 999, status: 'done' })];
    const result = computeWeeklyFloorProgress('Move', slots, makeFloor({ weeklyMinimumMinutes: 100 }));
    expect(result.fraction).toBe(1);
  });
});

describe('computeWeeklyFloorProgress - checklist domains (sessions)', () => {
  function makeChecklistSlot(overrides: Partial<ScheduleSlot> = {}): ScheduleSlot {
    return makeSlot({
      kind: 'checklist',
      timeWindow: null,
      domain: 'Fuel',
      durationMinutes: null,
      ...overrides,
    });
  }

  it('counts done/equivalent sessions instead of minutes', () => {
    const slots = [
      makeChecklistSlot({ id: 'a', date: '2026-07-22', status: 'done' }),
      makeChecklistSlot({ id: 'b', date: '2026-07-24', status: 'equivalent' }),
      makeChecklistSlot({ id: 'c', date: '2026-07-26', status: 'missed' }),
      makeChecklistSlot({ id: 'd', date: '2026-07-27', status: 'pending' }),
    ];
    const floor = makeFloor({ domain: 'Fuel', weeklyMinimumMinutes: 105, minSessionsPerWeek: 3 });
    const result = computeWeeklyFloorProgress('Fuel', slots, floor);

    expect(result.measure).toBe('sessions');
    expect(result.completed).toBe(2);
    expect(result.target).toBe(3);
    expect(result.fraction).toBeCloseTo(2 / 3);
  });

  it('does not divide by zero for a checklist domain with no weekly minimum (e.g. Maintain)', () => {
    const floor = makeFloor({ domain: 'Maintain', weeklyMinimumMinutes: 0, minSessionsPerWeek: 0 });
    const result = computeWeeklyFloorProgress('Maintain', [], floor);
    expect(result.fraction).toBe(0);
    expect(result.target).toBe(0);
  });
});
