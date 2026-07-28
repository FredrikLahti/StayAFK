// Pure mapping from a relapse severity (the "What happened?" tap options)
// to its resulting GamingControlState, the exact copy to show, and the
// effect on each domain's FoundationStatus.currentActivityState.
// established_capacity is the one hard rule: it is never touched or
// discounted by any relapse, regardless of severity.
import { ActivityState, FoundationStatus, GamingControlState, RelapseSeverity } from '../domain/types';

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

const ACTIVITY_STAGE_ORDER: ActivityState[] = ['restarted', 'repeating', 'established', 'self_sustaining'];

// Drops a single domain's activity state back exactly one stage, floored at
// 'restarted' (never goes below it).
function dropOneStage(state: ActivityState): ActivityState {
  const index = ACTIVITY_STAGE_ORDER.indexOf(state);
  return ACTIVITY_STAGE_ORDER[Math.max(0, index - 1)];
}

// Applies a relapse's effect on FoundationStatus.currentActivityState across
// every domain - established_capacity (and everything else on the record)
// is passed through untouched in all three cases:
//   short_lapse   -> no change to any domain
//   several_days  -> every domain drops back exactly one stage (floored)
//   full_return   -> every domain resets to 'restarted'
export function applyRelapseToFoundationStatuses(
  severity: RelapseSeverity,
  statuses: FoundationStatus[]
): FoundationStatus[] {
  if (severity === 'short_lapse') {
    return statuses;
  }
  if (severity === 'full_return') {
    return statuses.map((status) => ({ ...status, currentActivityState: 'restarted' }));
  }
  return statuses.map((status) => ({ ...status, currentActivityState: dropOneStage(status.currentActivityState) }));
}
