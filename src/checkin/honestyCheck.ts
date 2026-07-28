// The "Is it, though?" honesty check from ARCHITECTURE.md's check-in flow:
// it only triggers when a logged Equivalent substitution is more than one
// intensity tier below what was originally assigned. Same-or-adjacent-tier
// substitutions log silently.
import { IntensityTier } from '../domain/types';

const TIER_RANK: Record<IntensityTier, number> = { low: 0, moderate: 1, high: 2 };

export function shouldTriggerHonestyCheck(originalTier: IntensityTier, substituteTier: IntensityTier): boolean {
  return TIER_RANK[originalTier] - TIER_RANK[substituteTier] > 1;
}
