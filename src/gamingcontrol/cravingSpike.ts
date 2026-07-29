// Detects an actual uptick in craving frequency - not just a fixed
// calendar date, and not just "more than zero" noise - by comparing a
// short recent window against the person's own trailing baseline rate.
// A spike requires both a meaningfully higher recent rate AND a real
// preceding stretch to compare against (a quieter-then-busier pattern),
// rather than firing on a couple of stray taps.
import { CravingEvent } from '../domain/types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// "Last 3-4 days" per the task brief.
export const RECENT_WINDOW_DAYS = 3;
// The trailing stretch used to establish "their own baseline" - long
// enough to smooth out day-to-day noise.
export const BASELINE_WINDOW_DAYS = 14;
// Below this many events in the recent window, don't call it a spike no
// matter the ratio - 1 or 2 taps swinging a tiny baseline isn't a pattern.
const MIN_RECENT_COUNT = 3;
// How much higher than baseline the recent rate needs to be.
const SPIKE_MULTIPLIER = 2;

export interface CravingSpikeResult {
  isSpike: boolean;
  recentCount: number;
  recentRate: number; // events/day over the recent window
  baselineRate: number; // events/day over the baseline window
}

export function detectCravingSpike(events: CravingEvent[], now: Date = new Date()): CravingSpikeResult {
  const nowMs = now.getTime();
  const recentCutoff = nowMs - RECENT_WINDOW_DAYS * MS_PER_DAY;
  const baselineCutoff = recentCutoff - BASELINE_WINDOW_DAYS * MS_PER_DAY;

  const recentCount = events.filter((e) => {
    const t = new Date(e.timestamp).getTime();
    return t > recentCutoff && t <= nowMs;
  }).length;

  const baselineCount = events.filter((e) => {
    const t = new Date(e.timestamp).getTime();
    return t > baselineCutoff && t <= recentCutoff;
  }).length;

  const recentRate = recentCount / RECENT_WINDOW_DAYS;
  const baselineRate = baselineCount / BASELINE_WINDOW_DAYS;

  // recentRate >= baselineRate * SPIKE_MULTIPLIER also correctly handles a
  // zero baseline (a genuinely quiet preceding stretch) - anything above 0
  // satisfies "meaningfully higher", so MIN_RECENT_COUNT is what keeps that
  // case from firing on trivial noise.
  const isSpike = recentCount >= MIN_RECENT_COUNT && recentRate >= baselineRate * SPIKE_MULTIPLIER;

  return { isSpike, recentCount, recentRate, baselineRate };
}

// Whether the one-time spike nudge should show right now. Once shown, it
// won't show again until at least a fresh recent-window's worth of time
// has passed - long enough for the same uptick to either resolve (quiet
// again) or roll into a genuinely new detection window, either way not
// repeating every single day the underlying spike condition persists.
export function shouldShowSpikeNudge(isSpike: boolean, lastShownAt: string | null, now: Date = new Date()): boolean {
  if (!isSpike) return false;
  if (!lastShownAt) return true;
  const daysSinceShown = (now.getTime() - new Date(lastShownAt).getTime()) / MS_PER_DAY;
  return daysSinceShown >= RECENT_WINDOW_DAYS;
}
