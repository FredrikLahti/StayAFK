import { generateDailySchedule } from './engine';
import { DailyFreeTimeCheck, PhaseName, ScheduleSlot, UserProfile } from './domain/types';
import {
  getAssignmentLibrary,
  getDailyFreeTimeCheck,
  getDomainFloors,
  replaceScheduleSlotsForDate,
  saveDailyFreeTimeCheck,
} from './db';

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

  const slots = generateDailySchedule({ date, profile, check: check as DailyFreeTimeCheck, floors, library, phase });
  await replaceScheduleSlotsForDate(date, slots);
  return slots;
}
