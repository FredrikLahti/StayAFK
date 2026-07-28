import { CravingEvent } from '../domain/types';

// Simplest reasonable summary for Stage 3: total count and a rolling
// window count (default 7 days) - real signal derivation (clustering,
// frequency trends feeding GamingControlStatus) is a later stage.
export interface CravingSummary {
  total: number;
  recentCount: number;
  recentDays: number;
}

export function summarizeCravingEvents(
  events: CravingEvent[],
  now: Date = new Date(),
  recentDays = 7
): CravingSummary {
  const cutoff = now.getTime() - recentDays * 24 * 60 * 60 * 1000;
  const recentCount = events.filter((e) => new Date(e.timestamp).getTime() >= cutoff).length;
  return { total: events.length, recentCount, recentDays };
}
