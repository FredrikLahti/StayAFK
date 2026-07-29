// How much of a domain's weekly floor requirement has actually been met so
// far this week - distinct from the Foundation stage (which tracks
// consecutive days of engagement, not progress against a specific floor).
//
// Time-boxed domains (Sleep/Move/Build) are measured in minutes, same as
// before. Checklist domains (Fuel/Connect/Maintain) no longer carry a
// duration at all (see domain/types.ts's SlotKind), so their progress is a
// session count instead - how many times this week's checklist item has
// been marked done/equivalent against the floor's minSessionsPerWeek.
import { CHECKLIST_DOMAINS, Domain, DomainFloor, ScheduleSlot } from '../domain/types';

export interface WeeklyFloorProgress {
  measure: 'minutes' | 'sessions';
  completed: number;
  target: number;
  fraction: number; // 0-1, clamped
}

function clampedFraction(completed: number, target: number): number {
  if (target > 0) return Math.min(1, completed / target);
  return completed > 0 ? 1 : 0;
}

export function computeWeeklyFloorProgress(
  domain: Domain,
  weekSlots: ScheduleSlot[],
  floor: DomainFloor
): WeeklyFloorProgress {
  const domainSlots = weekSlots.filter((s) => s.domain === domain);
  const resolvedPositively = domainSlots.filter((s) => s.status === 'done' || s.status === 'equivalent');

  if (CHECKLIST_DOMAINS.includes(domain)) {
    const completed = resolvedPositively.length;
    const target = floor.minSessionsPerWeek;
    return { measure: 'sessions', completed, target, fraction: clampedFraction(completed, target) };
  }

  const completed = resolvedPositively.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);
  const target = floor.weeklyMinimumMinutes;
  return { measure: 'minutes', completed, target, fraction: clampedFraction(completed, target) };
}
