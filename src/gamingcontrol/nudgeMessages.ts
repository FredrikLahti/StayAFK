// Copy for the one-time motivational nudge (see cravingSpike.ts and
// fallbackNudge.ts for the two trigger paths that both surface one of
// these). Deliberately distinct in shape from the relapse outcomes
// (relapse.ts) and the silence life-check message (SilenceModal.tsx) -
// same direct, dry register, but this isn't a relapse and isn't a
// "are you still there" check, so it shouldn't read like either.
export const MOTIVATIONAL_NUDGE_MESSAGES: string[] = [
  "Cravings have picked up the last few days. That's usually when old habits start looking appealing again — not a coincidence, just a phase.",
  'More urges than usual lately. This is roughly when motivation tends to dip — noting it, not fixing it for you.',
  "A busier stretch for cravings than your normal pace. Nothing's wrong — this is just the part of the process that's supposed to be harder.",
];

// Deterministic pick rather than Math.random() so the same instance of a
// shown nudge is reproducible/testable - varies across different
// occurrences via the seed (e.g. day-of-year) rather than on every render.
export function pickNudgeMessage(seed: number): string {
  const index = ((seed % MOTIVATIONAL_NUDGE_MESSAGES.length) + MOTIVATIONAL_NUDGE_MESSAGES.length) % MOTIVATIONAL_NUDGE_MESSAGES.length;
  return MOTIVATIONAL_NUDGE_MESSAGES[index];
}
