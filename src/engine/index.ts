import {
  AssignmentLibraryEntry,
  DailyFreeTimeCheck,
  Domain,
  DomainFloor,
  PhaseName,
  ScheduleSlot,
  UserProfile,
} from '../domain/types';
import { computeFreeTimeWindows, FreeTimeWindow, FREE_TIME_BAND_MINUTES } from './layer1';
import { allocateDomainMinutes, DomainAllocation, ALLOCATABLE_DOMAINS } from './layer2';
import { buildScheduleSlots } from './layer3';
import { assignPlaceholderActivities } from './layer4';
import { isChecklistDomainDue } from './checklist';

export interface GenerateDailyScheduleParams {
  date: string; // ISO yyyy-mm-dd
  profile: UserProfile;
  check: DailyFreeTimeCheck;
  floors: DomainFloor[];
  library: AssignmentLibraryEntry[];
  phase: PhaseName;
  // Which of the checklist domains (Fuel/Connect/Maintain) are still due
  // this week - computed by the caller (dayGenerator.ts), which has the DB
  // access needed to count this week's completions; the engine itself
  // stays pure/stateless. Defaults to none due, so callers that don't pass
  // it just get a day with no checklist items rather than a crash.
  dueChecklistDomains?: Domain[];
}

// Runs all four engine layers in sequence for a single day.
export function generateDailySchedule(params: GenerateDailyScheduleParams): ScheduleSlot[] {
  const { date, profile, check, floors, library, phase, dueChecklistDomains = [] } = params;

  const windows = computeFreeTimeWindows(profile, check, new Date(`${date}T00:00:00`));
  const totalFreeMinutes = windows.reduce((sum, w) => sum + w.minutes, 0);
  const allocations = allocateDomainMinutes(totalFreeMinutes, floors, phase);
  const sleepFloor = floors.find((f) => f.domain === 'Sleep');
  const rawSlots = buildScheduleSlots(date, windows, allocations, phase, sleepFloor, dueChecklistDomains);

  return assignPlaceholderActivities(rawSlots, library, profile);
}

export {
  computeFreeTimeWindows,
  FREE_TIME_BAND_MINUTES,
  allocateDomainMinutes,
  ALLOCATABLE_DOMAINS,
  buildScheduleSlots,
  assignPlaceholderActivities,
  isChecklistDomainDue,
};
export type { FreeTimeWindow, DomainAllocation };
