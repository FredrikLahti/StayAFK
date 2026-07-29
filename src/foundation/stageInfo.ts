// Turns FoundationStatus.consecutiveDays into copy for the Home screen's
// Foundation indicator: which stage the person is in right now and how far
// to the next one - the previous version of this ring showed an abstract
// percentage with the onboarding Phase name (Reset/Saturation/...) next to
// it, which doesn't actually say what the ring means. The stage ladder
// here is ActivityState (Restarted -> Repeating -> Established ->
// Self-sustaining), per ARCHITECTURE.md's "Foundation progression formula".
import { ActivityState, FoundationStatus } from '../domain/types';

export const STAGE_LABEL: Record<ActivityState, string> = {
  restarted: 'Restarted',
  repeating: 'Repeating',
  established: 'Established',
  self_sustaining: 'Self-sustaining',
};

interface StageThreshold {
  stage: ActivityState;
  minDays: number;
}

// Day thresholds from ARCHITECTURE.md: Restarted 0-4, Repeating ~4-21,
// Established ~21-66, Self-sustaining 66+.
const STAGE_THRESHOLDS: StageThreshold[] = [
  { stage: 'restarted', minDays: 0 },
  { stage: 'repeating', minDays: 4 },
  { stage: 'established', minDays: 21 },
  { stage: 'self_sustaining', minDays: 66 },
];

export interface FoundationStageInfo {
  stage: ActivityState;
  stageLabel: string;
  nextStage: ActivityState | null;
  nextStageLabel: string | null;
  daysToNextStage: number | null;
  // 0-1 progress through the current stage's band, toward the next one -
  // what the ring itself should fill to (1 when already at the top stage).
  progressWithinStage: number;
}

export function averageConsecutiveDays(statuses: FoundationStatus[]): number {
  if (statuses.length === 0) return 0;
  return statuses.reduce((sum, s) => sum + s.consecutiveDays, 0) / statuses.length;
}

export function computeFoundationStageInfo(avgConsecutiveDays: number): FoundationStageInfo {
  const days = Math.max(0, avgConsecutiveDays);

  let currentIndex = 0;
  for (let i = 0; i < STAGE_THRESHOLDS.length; i++) {
    if (days >= STAGE_THRESHOLDS[i].minDays) currentIndex = i;
  }

  const current = STAGE_THRESHOLDS[currentIndex];
  const next = STAGE_THRESHOLDS[currentIndex + 1] ?? null;

  if (!next) {
    return {
      stage: current.stage,
      stageLabel: STAGE_LABEL[current.stage],
      nextStage: null,
      nextStageLabel: null,
      daysToNextStage: null,
      progressWithinStage: 1,
    };
  }

  const bandSize = next.minDays - current.minDays;
  const progressWithinStage = bandSize > 0 ? Math.min(1, (days - current.minDays) / bandSize) : 1;

  return {
    stage: current.stage,
    stageLabel: STAGE_LABEL[current.stage],
    nextStage: next.stage,
    nextStageLabel: STAGE_LABEL[next.stage],
    daysToNextStage: Math.max(0, Math.ceil(next.minDays - days)),
    progressWithinStage,
  };
}
