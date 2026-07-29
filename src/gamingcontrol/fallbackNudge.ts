// Backstop for the motivational nudge: craving-based spike detection
// (cravingSpike.ts) only works for people who actually use the craving
// button. This fires once, purely on elapsed days since the Reset started,
// for anyone who reaches that window without ever having triggered the
// spike-based nudge - so the "motivation dips around here" message still
// reaches people with little or no craving-log data.
export const FALLBACK_NUDGE_MIN_DAY = 25;
export const FALLBACK_NUDGE_MAX_DAY = 30;

export function shouldShowFallbackNudge(
  daysSinceReset: number,
  everShowedSpikeNudge: boolean,
  fallbackAlreadyShown: boolean
): boolean {
  if (everShowedSpikeNudge || fallbackAlreadyShown) return false;
  return daysSinceReset >= FALLBACK_NUDGE_MIN_DAY && daysSinceReset <= FALLBACK_NUDGE_MAX_DAY;
}
