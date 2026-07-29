import { generateDailySchedule, isChecklistDomainDue } from './engine';
import { CHECKLIST_DOMAINS, DailyFreeTimeCheck, Domain, DomainFloor, PhaseName, ScheduleSlot, UserProfile } from './domain/types';
import { getTrailingWeek } from './domain/date';
import {
  getAssignmentLibrary,
  getDailyFreeTimeCheck,
  getDomainFloors,
  getScheduleSlotsForDate,
  replaceScheduleSlotsForDate,
  saveDailyFreeTimeCheck,
} from './db';

// Which checklist domains (Fuel/Connect/Maintain) are still due for `date`,
// based on how many times each has already been completed (done/equivalent)
// on the prior days of the trailing week - the same "this week" window
// DomainDetailScreen uses for weekly floor progress.
function computeDueChecklistDomains(priorSlots: ScheduleSlot[], floors: DomainFloor[]): Domain[] {
  const due: Domain[] = [];
  for (const domain of CHECKLIST_DOMAINS) {
    const floor = floors.find((f) => f.domain === domain);
    if (!floor) {
      due.push(domain);
      continue;
    }
    const completedThisWeek = priorSlots.filter(
      (s) => s.domain === domain && (s.status === 'done' || s.status === 'equivalent')
    ).length;
    if (isChecklistDomainDue(floor, completedThisWeek)) {
      due.push(domain);
    }
  }
  return due;
}

// AssignmentLibraryEntry ids already assigned on prior days this week, so
// Layer 4 can alternate between duration-tied candidates (e.g.
// move_lower_a/move_lower_b) instead of always picking the same one.
function computeRecentlyAssignedIds(priorSlots: ScheduleSlot[]): string[] {
  return priorSlots
    .map((s) => s.assignedActivityId)
    .filter((id): id is string => id !== null);
}

// Generates (or regenerates) a day's ScheduleSlots for the given profile and
// persists them. If no DailyFreeTimeCheck exists yet for the date, a
// "same_as_usual" check is auto-created - Stage 1 doesn't have a daily
// check-in UI yet, so every generated day defaults to the profile's baseline.
export async function generateAndPersistDay(
  date: string,
  profile: UserProfile,
  phase: PhaseName
): Promise<ScheduleSlot[]> {
  let check = await getDailyFreeTimeCheck(date);
  if (!check) {
    check = { date, responseType: 'same_as_usual' as const, source: 'auto_baseline' as const };
    await saveDailyFreeTimeCheck(check);
  }

  const [floors, library] = await Promise.all([getDomainFloors(), getAssignmentLibrary()]);
  const priorDates = getTrailingWeek(date).filter((d) => d !== date);
  const priorSlots = (await Promise.all(priorDates.map((d) => getScheduleSlotsForDate(d)))).flat();
  const dueChecklistDomains = computeDueChecklistDomains(priorSlots, floors);
  const recentlyAssignedIds = computeRecentlyAssignedIds(priorSlots);

  const slots = generateDailySchedule({
    date,
    profile,
    check: check as DailyFreeTimeCheck,
    floors,
    library,
    phase,
    dueChecklistDomains,
    recentlyAssignedIds,
  });
  await replaceScheduleSlotsForDate(date, slots);
  return slots;
}
