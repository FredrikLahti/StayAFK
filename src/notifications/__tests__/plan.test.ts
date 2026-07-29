import { computeNotificationPlan } from '../plan';
import { ScheduleSlot } from '../../domain/types';

function makeSlot(overrides: Partial<ScheduleSlot> = {}): ScheduleSlot {
  return {
    id: 's1',
    date: '2026-07-28',
    kind: 'timeboxed',
    timeWindow: 'evening',
    domain: 'Move',
    durationMinutes: 30,
    assignedActivityId: null,
    equivalentActivityId: null,
    status: 'pending',
    phaseAtCreation: 'reset',
    ...overrides,
  };
}

describe('computeNotificationPlan', () => {
  it('always includes the next-morning nudge, even with nothing pending', () => {
    const now = new Date('2026-07-28T10:00:00');
    const slots = [makeSlot({ status: 'done' })];
    const plan = computeNotificationPlan({ intensity: 'minimal', slots, now });

    expect(plan).toHaveLength(1);
    expect(plan[0].id).toBe('next-morning');
    expect(plan[0].trigger).toEqual({ kind: 'daily', hour: 8, minute: 0 });
  });

  it('minimal tier adds an end-of-day reminder when slots are still pending', () => {
    const now = new Date('2026-07-28T10:00:00');
    const slots = [makeSlot({ status: 'pending' })];
    const plan = computeNotificationPlan({ intensity: 'minimal', slots, now });

    const endOfDay = plan.find((p) => p.id === 'end-of-day');
    expect(endOfDay).toBeDefined();
    expect(endOfDay!.trigger).toEqual({ kind: 'date', date: new Date('2026-07-28T21:30:00') });
    // No window-transition reminders in minimal tier.
    expect(plan.some((p) => p.id.startsWith('window-'))).toBe(false);
  });

  it('does not schedule the end-of-day reminder once that time has already passed today', () => {
    const now = new Date('2026-07-28T22:00:00'); // after 21:30
    const slots = [makeSlot({ status: 'pending' })];
    const plan = computeNotificationPlan({ intensity: 'minimal', slots, now });

    expect(plan.some((p) => p.id === 'end-of-day')).toBe(false);
  });

  it('detailed tier adds a window-transition reminder only for windows with pending slots', () => {
    const now = new Date('2026-07-28T10:00:00');
    const slots = [
      makeSlot({ id: 's-morning', timeWindow: 'morning', status: 'done' }),
      makeSlot({ id: 's-evening', timeWindow: 'evening', status: 'pending' }),
    ];
    const plan = computeNotificationPlan({ intensity: 'detailed', slots, now });

    expect(plan.some((p) => p.id === 'window-morning')).toBe(false); // morning fully done
    expect(plan.some((p) => p.id === 'window-evening')).toBe(true);
  });

  it('never schedules a window-transition reminder for a window that already ended today', () => {
    const now = new Date('2026-07-28T13:00:00'); // after morning ends (12:00)
    const slots = [makeSlot({ timeWindow: 'morning', status: 'pending' })];
    const plan = computeNotificationPlan({ intensity: 'detailed', slots, now });

    expect(plan.some((p) => p.id === 'window-morning')).toBe(false);
  });

  it('never generates a separate night-window transition (it collapses into end-of-day)', () => {
    const now = new Date('2026-07-28T10:00:00');
    const slots = [makeSlot({ timeWindow: 'night', status: 'pending' })];
    const plan = computeNotificationPlan({ intensity: 'detailed', slots, now });

    expect(plan.some((p) => p.id === 'window-night')).toBe(false);
    expect(plan.some((p) => p.id === 'end-of-day')).toBe(true);
  });

  it('is deterministic for the same inputs', () => {
    const now = new Date('2026-07-28T10:00:00');
    const slots = [makeSlot({ status: 'pending' })];
    const a = computeNotificationPlan({ intensity: 'detailed', slots, now });
    const b = computeNotificationPlan({ intensity: 'detailed', slots, now });
    expect(a).toEqual(b);
  });

  it('schedules nothing at all once notifications are paused, regardless of pending state', () => {
    const now = new Date('2026-07-28T10:00:00');
    const slots = [makeSlot({ status: 'pending' })];
    const plan = computeNotificationPlan({ intensity: 'detailed', slots, now, notificationsPaused: true });
    expect(plan).toEqual([]);
  });
});
