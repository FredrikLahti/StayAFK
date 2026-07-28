// Layer 1: turn UserProfile + DailyFreeTimeCheck into today's actual free
// time windows (per ARCHITECTURE.md's Layer 1 description).
import { DAY_PARTS, DailyFreeTimeCheck, DayPart, FreeTimeBand, UserProfile } from '../domain/types';

// Onboarding only collects coarse buckets, not exact hours, so we need a
// representative minute figure per bucket to drive the engine. Midpoints are
// used except for the open-ended top bucket, which uses its floor.
export const FREE_TIME_BAND_MINUTES: Record<FreeTimeBand, number> = {
  lt2: 90,
  '2to4': 180,
  '4to6': 300,
  '6plus': 420,
};

export interface FreeTimeWindow {
  window: DayPart;
  minutes: number;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function computeFreeTimeWindows(
  profile: UserProfile,
  check: DailyFreeTimeCheck,
  date: Date
): FreeTimeWindow[] {
  const baselineBand = isWeekend(date) ? profile.baselineFreeTimeWeekend : profile.baselineFreeTimeWeekday;

  let band: FreeTimeBand = baselineBand;
  let windows: DayPart[] = profile.typicalFreeWindows;

  if (check.responseType !== 'same_as_usual') {
    if (check.adjustedHours) {
      band = check.adjustedHours;
    }
    if (check.adjustedWindows && check.adjustedWindows.length > 0) {
      windows = check.adjustedWindows;
    }
  }

  const orderedWindows = DAY_PARTS.filter((part) => windows.includes(part));
  if (orderedWindows.length === 0) {
    return [];
  }

  const totalMinutes = FREE_TIME_BAND_MINUTES[band];
  const base = Math.floor(totalMinutes / orderedWindows.length);
  const remainder = totalMinutes - base * orderedWindows.length;

  // Spread the remainder over the first N windows so the total always adds
  // back up to totalMinutes exactly (deterministic, easy to test).
  return orderedWindows.map((part, index) => ({
    window: part,
    minutes: base + (index < remainder ? 1 : 0),
  }));
}
