// Silence-based relapse signal, per ARCHITECTURE.md's Stage 3 build order
// item and the deferred piece unblocked by Stage 4's notification
// infrastructure. This only ever *offers a path in* - it never auto-logs a
// relapse from silence alone.
//
// "2+ full days" of zero check-ins of any kind (slot check-ins, craving
// logs, relapse logs) surfaces a gentle check-in prompt. If silence
// continues to 7-10 total days, the "please uninstall me if life is
// perfect" message appears (7 is used as the concrete trigger point within
// that range).
export const CHECK_IN_PROMPT_THRESHOLD_DAYS = 2;
export const LIFE_CHECK_THRESHOLD_DAYS = 7;

export type SilenceLevel = 'none' | 'checkInPrompt' | 'lifeCheckMessage';

export function daysBetween(earlierDate: string, laterDate: string): number {
  const earlier = new Date(`${earlierDate}T00:00:00`).getTime();
  const later = new Date(`${laterDate}T00:00:00`).getTime();
  return Math.floor((later - earlier) / (24 * 60 * 60 * 1000));
}

export function getSilenceLevel(daysSinceLastActivity: number): SilenceLevel {
  if (daysSinceLastActivity >= LIFE_CHECK_THRESHOLD_DAYS) return 'lifeCheckMessage';
  if (daysSinceLastActivity >= CHECK_IN_PROMPT_THRESHOLD_DAYS) return 'checkInPrompt';
  return 'none';
}

export interface LastActivityInputs {
  // The most recent date with an acted-upon (non-pending) ScheduleSlot, if any.
  mostRecentActiveScheduleDate: string | null;
  cravingEventDates: string[]; // yyyy-mm-dd, derived from CravingEvent timestamps
  relapseEventDates: string[]; // yyyy-mm-dd, from RelapseEvent.date
  // Phase.phaseStartDate (yyyy-mm-dd portion) - used when nothing has been
  // logged yet, so a brand-new Reset's first hours don't already read as
  // "silence".
  fallbackDate: string;
}

export function getLastActivityDate(inputs: LastActivityInputs): string {
  const candidates = [
    ...(inputs.mostRecentActiveScheduleDate ? [inputs.mostRecentActiveScheduleDate] : []),
    ...inputs.cravingEventDates,
    ...inputs.relapseEventDates,
  ];
  if (candidates.length === 0) return inputs.fallbackDate;
  return candidates.reduce((max, date) => (date > max ? date : max));
}
