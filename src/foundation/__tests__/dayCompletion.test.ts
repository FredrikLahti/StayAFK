import { computeDayCompletion } from '../dayCompletion';
import { ScheduleSlot } from '../../domain/types';

function makeSlot(overrides: Partial<ScheduleSlot> = {}): ScheduleSlot {
  return {
    id: 's1',
    date: '2026-07-28',
    kind: 'timeboxed',
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

describe('computeDayCompletion', () => {
  it('is "none" for a day with no slots at all', () => {
    expect(computeDayCompletion([])).toEqual({ status: 'none', fraction: 0 });
  });

  it('is "incomplete" when nothing has been resolved positively', () => {
    const slots = [makeSlot({ status: 'pending' }), makeSlot({ id: 's2', status: 'missed' })];
    expect(computeDayCompletion(slots)).toEqual({ status: 'incomplete', fraction: 0 });
  });

  it('is "complete" when every slot is done or equivalent', () => {
    const slots = [makeSlot({ status: 'done' }), makeSlot({ id: 's2', status: 'equivalent' })];
    expect(computeDayCompletion(slots)).toEqual({ status: 'complete', fraction: 1 });
  });

  it('is "partial" with a fractional value in between', () => {
    const slots = [
      makeSlot({ id: 's1', status: 'done' }),
      makeSlot({ id: 's2', status: 'missed' }),
      makeSlot({ id: 's3', status: 'pending' }),
      makeSlot({ id: 's4', status: 'equivalent' }),
    ];
    expect(computeDayCompletion(slots)).toEqual({ status: 'partial', fraction: 0.5 });
  });
});
