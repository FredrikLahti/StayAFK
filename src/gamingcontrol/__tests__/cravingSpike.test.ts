import { detectCravingSpike, shouldShowSpikeNudge, RECENT_WINDOW_DAYS, BASELINE_WINDOW_DAYS } from '../cravingSpike';
import { CravingEvent } from '../../domain/types';

const NOW = new Date('2026-07-28T12:00:00.000Z');

function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

function makeEvent(id: string, timestamp: string): CravingEvent {
  return { id, timestamp };
}

describe('detectCravingSpike', () => {
  it('is not a spike with no events at all', () => {
    expect(detectCravingSpike([], NOW).isSpike).toBe(false);
  });

  it('is not a spike from a couple of stray recent events with no baseline history', () => {
    // Only 2 events, both recent - below MIN_RECENT_COUNT regardless of ratio.
    const events = [makeEvent('a', daysAgo(1)), makeEvent('b', daysAgo(2))];
    expect(detectCravingSpike(events, NOW).isSpike).toBe(false);
  });

  it('is a spike when a quiet baseline is followed by a clear recent cluster', () => {
    // Quiet baseline: 1 event in the 14-day baseline window.
    const baselineEvents = [makeEvent('base1', daysAgo(RECENT_WINDOW_DAYS + 10))];
    // Busy recent window: 4 events within the last 3 days.
    const recentEvents = [
      makeEvent('r1', daysAgo(1)),
      makeEvent('r2', daysAgo(1.5)),
      makeEvent('r3', daysAgo(2)),
      makeEvent('r4', daysAgo(2.5)),
    ];
    const result = detectCravingSpike([...baselineEvents, ...recentEvents], NOW);

    expect(result.isSpike).toBe(true);
    expect(result.recentCount).toBe(4);
  });

  it('is not a spike when the recent rate roughly matches an already-high baseline', () => {
    // Busy the whole time: baseline and recent both proportionally high.
    const baselineEvents = Array.from({ length: 14 }, (_, i) => makeEvent(`base${i}`, daysAgo(RECENT_WINDOW_DAYS + i)));
    const recentEvents = [makeEvent('r1', daysAgo(1)), makeEvent('r2', daysAgo(2)), makeEvent('r3', daysAgo(2.9))];
    const result = detectCravingSpike([...baselineEvents, ...recentEvents], NOW);

    expect(result.isSpike).toBe(false);
  });

  it('ignores events older than the baseline window entirely', () => {
    const ancientEvents = Array.from({ length: 20 }, (_, i) =>
      makeEvent(`old${i}`, daysAgo(RECENT_WINDOW_DAYS + BASELINE_WINDOW_DAYS + 5 + i))
    );
    const recentEvents = [makeEvent('r1', daysAgo(1)), makeEvent('r2', daysAgo(1.5)), makeEvent('r3', daysAgo(2))];
    const result = detectCravingSpike([...ancientEvents, ...recentEvents], NOW);

    // Baseline should read as quiet (ancient events excluded), so this
    // still reads as a spike rather than being swamped by old noise.
    expect(result.isSpike).toBe(true);
  });
});

describe('shouldShowSpikeNudge', () => {
  it('does not show when there is no spike', () => {
    expect(shouldShowSpikeNudge(false, null, NOW)).toBe(false);
  });

  it('shows the first time a spike is detected with nothing shown before', () => {
    expect(shouldShowSpikeNudge(true, null, NOW)).toBe(true);
  });

  it('does not re-show within the same recent-window after already being shown', () => {
    const shownAt = new Date(NOW.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(); // 1 day ago
    expect(shouldShowSpikeNudge(true, shownAt, NOW)).toBe(false);
  });

  it('shows again once enough time has passed since it was last shown', () => {
    const shownAt = new Date(NOW.getTime() - (RECENT_WINDOW_DAYS + 1) * 24 * 60 * 60 * 1000).toISOString();
    expect(shouldShowSpikeNudge(true, shownAt, NOW)).toBe(true);
  });
});
