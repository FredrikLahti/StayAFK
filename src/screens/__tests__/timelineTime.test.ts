import { getNextUpSlot, describeTimeRemaining } from '../timelineTime';
import { ScheduleSlot } from '../../domain/types';

function makeSlot(overrides: Partial<ScheduleSlot> = {}): ScheduleSlot {
  return {
    id: 's1',
    date: '2026-07-28',
    timeWindow: 'morning',
    domain: 'Move',
    durationMinutes: 30,
    assignedActivityId: null,
    equivalentActivityId: null,
    status: 'pending',
    phaseAtCreation: 'reset',
    ...overrides,
  };
}

describe('getNextUpSlot', () => {
  it('picks the earliest-window pending slot', () => {
    const slots = [
      makeSlot({ id: 'evening', timeWindow: 'evening' }),
      makeSlot({ id: 'morning', timeWindow: 'morning' }),
      makeSlot({ id: 'afternoon', timeWindow: 'afternoon' }),
    ];
    expect(getNextUpSlot(slots)?.id).toBe('morning');
  });

  it('skips slots that are already checked in', () => {
    const slots = [
      makeSlot({ id: 'morning-done', timeWindow: 'morning', status: 'done' }),
      makeSlot({ id: 'afternoon-pending', timeWindow: 'afternoon' }),
    ];
    expect(getNextUpSlot(slots)?.id).toBe('afternoon-pending');
  });

  it('excludes Sleep even when it is the only pending slot in an earlier window', () => {
    const slots = [
      makeSlot({ id: 'sleep', timeWindow: 'night', domain: 'Sleep' }),
      makeSlot({ id: 'evening-move', timeWindow: 'evening', domain: 'Move' }),
    ];
    expect(getNextUpSlot(slots)?.id).toBe('evening-move');
  });

  it('returns null when nothing is pending', () => {
    const slots = [makeSlot({ status: 'done' })];
    expect(getNextUpSlot(slots)).toBeNull();
  });
});

describe('describeTimeRemaining', () => {
  it('reports time until a window starts', () => {
    const now = new Date('2026-07-28T10:00:00');
    const result = describeTimeRemaining('afternoon', now); // starts at 12:00
    expect(result.phase).toBe('upcoming');
    expect(result.label).toBe('Starts in 2h');
  });

  it('reports time left inside an active window', () => {
    const now = new Date('2026-07-28T13:30:00');
    const result = describeTimeRemaining('afternoon', now); // ends at 17:00
    expect(result.phase).toBe('active');
    expect(result.label).toBe('3h 30m left in window');
  });

  it('reports a window has passed', () => {
    const now = new Date('2026-07-28T22:00:00');
    const result = describeTimeRemaining('afternoon', now); // ends at 17:00
    expect(result.phase).toBe('past');
    expect(result.label).toBe('Window has passed');
  });
});
