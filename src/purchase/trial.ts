// The free tier is the full first 72 hours (3 days) of a generated Reset -
// fully functional, not a demo. Anchored to Phase.phaseStartDate (the day
// "Reset me" was triggered), per ARCHITECTURE.md's paywall placement.
export const FREE_TRIAL_HOURS = 72;

function hoursElapsedSincePhaseStart(phaseStartDate: string, now: Date): number {
  const start = new Date(`${phaseStartDate}T00:00:00`);
  return (now.getTime() - start.getTime()) / (60 * 60 * 1000);
}

export function isTrialExpired(phaseStartDate: string, now: Date = new Date()): boolean {
  return hoursElapsedSincePhaseStart(phaseStartDate, now) >= FREE_TRIAL_HOURS;
}

// Whole hours remaining, floored at 0 - used for trial-countdown copy.
export function trialHoursRemaining(phaseStartDate: string, now: Date = new Date()): number {
  const remaining = FREE_TRIAL_HOURS - hoursElapsedSincePhaseStart(phaseStartDate, now);
  return Math.max(0, Math.ceil(remaining));
}
