import { summarizeCravingEvents } from '../cravingStats';
import { CravingEvent } from '../../domain/types';

function makeEvent(id: string, timestamp: string): CravingEvent {
  return { id, timestamp };
}

describe('summarizeCravingEvents', () => {
  const now = new Date('2026-07-28T12:00:00.000Z');

  it('counts zero events on an empty log', () => {
    const summary = summarizeCravingEvents([], now);
    expect(summary).toEqual({ total: 0, recentCount: 0, recentDays: 7 });
  });

  it('counts total and recent (within 7 days) separately', () => {
    const events = [
      makeEvent('1', '2026-07-28T10:00:00.000Z'), // today, within window
      makeEvent('2', '2026-07-22T12:00:00.000Z'), // exactly 6 days ago, within window
      makeEvent('3', '2026-07-10T12:00:00.000Z'), // 18 days ago, outside window
    ];
    const summary = summarizeCravingEvents(events, now);
    expect(summary.total).toBe(3);
    expect(summary.recentCount).toBe(2);
  });

  it('respects a custom recentDays window', () => {
    const events = [makeEvent('1', '2026-07-26T12:00:00.000Z')]; // 2 days ago
    expect(summarizeCravingEvents(events, now, 1).recentCount).toBe(0);
    expect(summarizeCravingEvents(events, now, 3).recentCount).toBe(1);
  });
});
