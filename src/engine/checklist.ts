// Whether a checklist domain (Fuel/Connect/Maintain) is due today, per its
// existing floor/frequency rule (see ARCHITECTURE.md's "Day structure:
// time-boxed vs. checklist domains"). Checklist domains no longer get a
// duration or time-slot - this only decides whether the item should even
// appear on a given day, based on how many times it's already been
// completed so far this week.
import { DomainFloor } from '../domain/types';

export function isChecklistDomainDue(floor: DomainFloor, completedThisWeek: number): boolean {
  // No weekly frequency requirement at all (e.g. Maintain's default floor)
  // means there's no gate to satisfy - it's a standing daily item rather
  // than something that can be "already met" for the week.
  if (floor.minSessionsPerWeek <= 0) return true;
  return completedThisWeek < floor.minSessionsPerWeek;
}
