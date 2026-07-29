import { buildDayRows } from '../dayWindows';
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

describe('buildDayRows', () => {
  it('returns nothing when there are no time-boxed non-Sleep slots', () => {
    expect(buildDayRows([makeSlot({ domain: 'Sleep', timeWindow: 'night' })])).toEqual([]);
  });

  it('excludes windows before the first or after the last occupied window entirely', () => {
    const slots = [makeSlot({ id: 'a', timeWindow: 'evening' })];
    const rows = buildDayRows(slots);
    expect(rows).toEqual([{ kind: 'section', window: 'evening', slots: [slots[0]] }]);
  });

  it('inserts a gap row for an unoccupied window between two occupied ones', () => {
    const morning = makeSlot({ id: 'a', timeWindow: 'morning' });
    const evening = makeSlot({ id: 'b', timeWindow: 'evening' });
    const rows = buildDayRows([morning, evening]);

    expect(rows).toEqual([
      { kind: 'section', window: 'morning', slots: [morning] },
      { kind: 'gap', window: 'afternoon' },
      { kind: 'section', window: 'evening', slots: [evening] },
    ]);
  });

  it('groups multiple slots sharing the same window into one section', () => {
    const a = makeSlot({ id: 'a', timeWindow: 'morning', domain: 'Move' });
    const b = makeSlot({ id: 'b', timeWindow: 'morning', domain: 'Build' });
    const rows = buildDayRows([a, b]);

    expect(rows).toEqual([{ kind: 'section', window: 'morning', slots: [a, b] }]);
  });

  it('ignores Sleep entirely when computing sections/gaps', () => {
    const sleep = makeSlot({ id: 'sleep', domain: 'Sleep', timeWindow: 'night' });
    const evening = makeSlot({ id: 'e', timeWindow: 'evening' });
    const rows = buildDayRows([sleep, evening]);

    // "night" would otherwise be the last occupied window because of Sleep -
    // it must not appear as a section or extend the gap range.
    expect(rows).toEqual([{ kind: 'section', window: 'evening', slots: [evening] }]);
  });

  it('ignores checklist and flexible slots - they render as their own sections, not window rows', () => {
    const checklist = makeSlot({
      id: 'c',
      kind: 'checklist',
      timeWindow: null,
      domain: 'Fuel',
      durationMinutes: null,
    });
    const flexible = makeSlot({ id: 'f', kind: 'flexible', timeWindow: null, domain: 'Live', durationMinutes: 90 });
    const evening = makeSlot({ id: 'e', timeWindow: 'evening' });
    const rows = buildDayRows([checklist, flexible, evening]);

    expect(rows).toEqual([{ kind: 'section', window: 'evening', slots: [evening] }]);
  });
});
