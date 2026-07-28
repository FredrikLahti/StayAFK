import { buildScheduleSlots } from '../layer3';
import { FreeTimeWindow } from '../layer1';
import { DomainAllocation } from '../layer2';
import { DomainFloor } from '../../domain/types';

const sleepFloor: DomainFloor = {
  domain: 'Sleep',
  weeklyMinimumMinutes: 8 * 60 * 7,
  minSessionsPerWeek: 7,
  notes: '',
};

describe('buildScheduleSlots (Layer 3)', () => {
  it('always includes a fixed Sleep slot regardless of free-time windows', () => {
    const slots = buildScheduleSlots('2026-07-28', [], [], 'reset', sleepFloor);
    expect(slots).toHaveLength(1);
    expect(slots[0]).toMatchObject({ domain: 'Sleep', timeWindow: 'night', durationMinutes: 480 });
  });

  it('never leaves a window unassigned: leftover minutes become Live', () => {
    const windows: FreeTimeWindow[] = [{ window: 'evening', minutes: 120 }];
    const allocations: DomainAllocation[] = [{ domain: 'Move', minutes: 45 }];

    const slots = buildScheduleSlots('2026-07-28', windows, allocations, 'reset', sleepFloor);
    const eveningSlots = slots.filter((s) => s.timeWindow === 'evening');
    const totalEveningMinutes = eveningSlots.reduce((sum, s) => sum + s.durationMinutes, 0);

    expect(totalEveningMinutes).toBe(120);
    expect(eveningSlots.some((s) => s.domain === 'Move' && s.durationMinutes === 45)).toBe(true);
    expect(eveningSlots.some((s) => s.domain === 'Live' && s.durationMinutes === 75)).toBe(true);
  });

  it('splits a domain allocation across multiple windows if it does not fit in one', () => {
    const windows: FreeTimeWindow[] = [
      { window: 'morning', minutes: 30 },
      { window: 'evening', minutes: 30 },
    ];
    const allocations: DomainAllocation[] = [{ domain: 'Build', minutes: 50 }];

    const slots = buildScheduleSlots('2026-07-28', windows, allocations, 'reset', sleepFloor);
    const buildSlots = slots.filter((s) => s.domain === 'Build');

    expect(buildSlots).toHaveLength(2);
    expect(buildSlots.reduce((sum, s) => sum + s.durationMinutes, 0)).toBe(50);
    // Morning window (30 min) should be fully consumed by Build first, then evening.
    expect(slots.filter((s) => s.timeWindow === 'morning' && s.domain === 'Build')).toHaveLength(1);
  });

  it('produces every slot with pending status and the given phase', () => {
    const windows: FreeTimeWindow[] = [{ window: 'morning', minutes: 60 }];
    const allocations: DomainAllocation[] = [{ domain: 'Fuel', minutes: 60 }];

    const slots = buildScheduleSlots('2026-07-28', windows, allocations, 'saturation', sleepFloor);
    expect(slots.every((s) => s.status === 'pending')).toBe(true);
    expect(slots.every((s) => s.phaseAtCreation === 'saturation')).toBe(true);
  });

  it('falls back to a default sleep duration when no Sleep floor is provided', () => {
    const slots = buildScheduleSlots('2026-07-28', [], [], 'reset');
    expect(slots[0].durationMinutes).toBe(480);
  });
});
