// Pure mapping from a relapse severity (the "What happened?" tap options)
// to its resulting GamingControlState and the exact copy to show. This is
// the only thing a relapse in this scoped Stage 3 pass is allowed to
// affect - it never touches FoundationStatus/established_capacity.
import { GamingControlState, RelapseSeverity } from '../domain/types';

export interface RelapseOutcome {
  resultingState: GamingControlState;
  message: string;
}

const RELAPSE_OUTCOMES: Record<RelapseSeverity, RelapseOutcome> = {
  short_lapse: {
    resultingState: 'lapse_interrupted',
    message: "Noted. One slip doesn't undo the work. Gaming Control: Lapse interrupted. Back to it.",
  },
  several_days: {
    resultingState: 'recovery_active',
    message:
      "Alright. Your training, sleep, and everything else you rebuilt didn't disappear because of this. " +
      "We're not starting over — we're restoring the parts that slipped. Recovery starts now.",
  },
  full_return: {
    resultingState: 'recovery_active',
    message:
      "This is the big one. Here's the thing though — your capacity is still real, even if it's dormant " +
      "right now. We're not rebuilding from nothing. Reset restarting, pulling in what already worked for you before.",
  },
};

export function getRelapseOutcome(severity: RelapseSeverity): RelapseOutcome {
  return RELAPSE_OUTCOMES[severity];
}

// The exact three tap options for the "What happened?" screen. Per the
// Stage 3 scope, "I played for most of a day" and "I've been gaming for
// several days" are combined into one option.
export const WHAT_HAPPENED_OPTIONS: { label: string; severity: RelapseSeverity }[] = [
  { label: 'I played once and stopped', severity: 'short_lapse' },
  { label: 'I played for a while', severity: 'several_days' },
  { label: 'Gaming has taken over again', severity: 'full_return' },
];
