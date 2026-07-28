// Presentation-only helpers for the Today screen's horizontal timeline and
// "Next Up" card. ScheduleSlot only tracks a DayPart (morning/afternoon/
// evening/night), not a real start/end clock time, so the hour bounds below
// are a display approximation used purely for layout and the "time
// remaining" text - nothing here is persisted or feeds back into the engine.
import { DayPart, ScheduleSlot } from '../domain/types';

export const WINDOW_ORDER: DayPart[] = ['morning', 'afternoon', 'evening', 'night'];

export const WINDOW_BOUNDS: Record<DayPart, { startHour: number; endHour: number }> = {
  morning: { startHour: 6, endHour: 12 },
  afternoon: { startHour: 12, endHour: 17 },
  evening: { startHour: 17, endHour: 21 },
  night: { startHour: 21, endHour: 24 },
};

export const DAY_SPAN_START_HOUR = WINDOW_BOUNDS.morning.startHour;
export const DAY_SPAN_END_HOUR = WINDOW_BOUNDS.night.endHour;
export const DAY_SPAN_HOURS = DAY_SPAN_END_HOUR - DAY_SPAN_START_HOUR;

// The single next pending, actionable slot in window order. Sleep is
// excluded - it's protected/passive time, not a to-do to surface as "next
// up" the way a workout or meal slot is.
export function getNextUpSlot(slots: ScheduleSlot[]): ScheduleSlot | null {
  const pending = slots.filter((s) => s.status === 'pending' && s.domain !== 'Sleep');
  for (const window of WINDOW_ORDER) {
    const match = pending.find((s) => s.timeWindow === window);
    if (match) return match;
  }
  return null;
}

export interface TimeRemaining {
  label: string;
  phase: 'upcoming' | 'active' | 'past';
}

function formatDuration(totalMinutes: number): string {
  const minutes = Math.max(0, totalMinutes);
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours <= 0) return `${remainder}m`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

export function describeTimeRemaining(window: DayPart, now: Date): TimeRemaining {
  const bounds = WINDOW_BOUNDS[window];
  const nowHours = now.getHours() + now.getMinutes() / 60;

  if (nowHours < bounds.startHour) {
    const minutesUntilStart = Math.round((bounds.startHour - nowHours) * 60);
    return { label: `Starts in ${formatDuration(minutesUntilStart)}`, phase: 'upcoming' };
  }
  if (nowHours < bounds.endHour) {
    const minutesUntilEnd = Math.round((bounds.endHour - nowHours) * 60);
    return { label: `${formatDuration(minutesUntilEnd)} left in window`, phase: 'active' };
  }
  return { label: 'Window has passed', phase: 'past' };
}
