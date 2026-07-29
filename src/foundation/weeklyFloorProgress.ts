// How much of a domain's weekly floor requirement has actually been met so
// far this week - distinct from the Foundation stage (which tracks
// consecutive days of engagement, not minutes against a specific floor).
import { Domain, DomainFloor, ScheduleSlot } from '../domain/types';

export interface WeeklyFloorProgress {
  completedMinutes: number;
  targetMinutes: number;
  fraction: number; // 0-1, clamped
}

export function computeWeeklyFloorProgress(
  domain: Domain,
  weekSlots: ScheduleSlot[],
  floor: DomainFloor
): WeeklyFloorProgress {
  const completedMinutes = weekSlots
    .filter((s) => s.domain === domain && (s.status === 'done' || s.status === 'equivalent'))
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  const targetMinutes = floor.weeklyMinimumMinutes;
  const fraction = targetMinutes > 0 ? Math.min(1, completedMinutes / targetMinutes) : completedMinutes > 0 ? 1 : 0;

  return { completedMinutes, targetMinutes, fraction };
}
