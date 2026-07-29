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
// DomainDetailScreen uses for weekly floor progress. `date` itself is
// excluded since it hasn't happened yet at generation time.
async function computeDueChecklistDomains(date: string, floors: DomainFloor[]): Promise<Domain[]> {
  const priorDates = getTrailingWeek(date).filter((d) => d !== date);
  const priorSlots = (await Promise.all(priorDates.map((d) => getScheduleSlotsForDate(d)))).flat();

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
  const dueChecklistDomains = await computeDueChecklistDomains(date, floors);

  const slots = generateDailySchedule({
    date,
    profile,
    check: check as DailyFreeTimeCheck,
    floors,
    library,
    phase,
    dueChecklistDomains,
  });
  await replaceScheduleSlotsForDate(date, slots);
  return slots;
}
