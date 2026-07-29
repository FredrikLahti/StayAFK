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
  it('always includes a fixed, time-boxed Sleep slot regardless of free-time windows', () => {
    const slots = buildScheduleSlots('2026-07-28', [], [], 'reset', sleepFloor);
    expect(slots).toHaveLength(1);
    expect(slots[0]).toMatchObject({ kind: 'timeboxed', domain: 'Sleep', timeWindow: 'night', durationMinutes: 480 });
  });

  it('never leaves a window unassigned: leftover minutes roll into one flexible slot for the day', () => {
    const windows: FreeTimeWindow[] = [{ window: 'evening', minutes: 120 }];
    const allocations: DomainAllocation[] = [{ domain: 'Move', minutes: 45 }];

    const slots = buildScheduleSlots('2026-07-28', windows, allocations, 'reset', sleepFloor);
    const moveSlot = slots.find((s) => s.domain === 'Move')!;
    const flexibleSlots = slots.filter((s) => s.kind === 'flexible');

    expect(moveSlot).toMatchObject({ kind: 'timeboxed', timeWindow: 'evening', durationMinutes: 45 });
    expect(flexibleSlots).toHaveLength(1);
    expect(flexibleSlots[0]).toMatchObject({ domain: 'Live', timeWindow: null, durationMinutes: 75 });
  });

  it('merges leftover minutes from multiple windows into a single flexible slot, not one per window', () => {
    const windows: FreeTimeWindow[] = [
      { window: 'morning', minutes: 30 },
      { window: 'evening', minutes: 40 },
    ];
    // Nothing allocated at all - every minute of every window is leftover.
    const slots = buildScheduleSlots('2026-07-28', windows, [], 'reset', sleepFloor);
    const flexibleSlots = slots.filter((s) => s.kind === 'flexible');

    expect(flexibleSlots).toHaveLength(1);
    expect(flexibleSlots[0].durationMinutes).toBe(70);
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
    expect(buildSlots.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0)).toBe(50);
    // Morning window (30 min) should be fully consumed by Build first, then evening.
    expect(slots.filter((s) => s.timeWindow === 'morning' && s.domain === 'Build')).toHaveLength(1);
  });

  it('adds one checklist slot per due checklist domain, with no duration or window', () => {
    const slots = buildScheduleSlots('2026-07-28', [], [], 'reset', sleepFloor, ['Fuel', 'Connect']);
    const checklistSlots = slots.filter((s) => s.kind === 'checklist');

    expect(checklistSlots.map((s) => s.domain).sort()).toEqual(['Connect', 'Fuel']);
    expect(checklistSlots.every((s) => s.timeWindow === null && s.durationMinutes === null)).toBe(true);
  });

  it('adds no checklist slots when none are due', () => {
    const slots = buildScheduleSlots('2026-07-28', [], [], 'reset', sleepFloor, []);
    expect(slots.some((s) => s.kind === 'checklist')).toBe(false);
  });

  it('produces every slot with pending status and the given phase', () => {
    const windows: FreeTimeWindow[] = [{ window: 'morning', minutes: 60 }];
    const allocations: DomainAllocation[] = [{ domain: 'Move', minutes: 60 }];

    const slots = buildScheduleSlots('2026-07-28', windows, allocations, 'saturation', sleepFloor, ['Maintain']);
    expect(slots.every((s) => s.status === 'pending')).toBe(true);
    expect(slots.every((s) => s.phaseAtCreation === 'saturation')).toBe(true);
  });

  it('falls back to a default sleep duration when no Sleep floor is provided', () => {
    const slots = buildScheduleSlots('2026-07-28', [], [], 'reset');
    expect(slots[0].durationMinutes).toBe(480);
  });
});
