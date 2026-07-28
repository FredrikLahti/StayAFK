// Turns FoundationStatus.consecutiveDays into a 0-1 progress fraction for
// the dashboard's rings, using the same 66-day horizon as the "Foundation
// progression formula" in ARCHITECTURE.md (Restarted -> Repeating ->
// Established -> Self-sustaining, self-sustaining landing at day 66+).
import { Domain, FoundationStatus } from '../domain/types';

export const FOUNDATION_HORIZON_DAYS = 66;

// The six domains surfaced on the dashboard - Maintain (chores/admin) is
// tracked in FoundationStatus like the others but isn't shown here.
export const DASHBOARD_DOMAINS: Domain[] = ['Sleep', 'Move', 'Fuel', 'Connect', 'Build', 'Live'];

export function domainProgress(status: FoundationStatus): number {
  return Math.max(0, Math.min(1, status.consecutiveDays / FOUNDATION_HORIZON_DAYS));
}

export function overallProgress(statuses: FoundationStatus[]): number {
  if (statuses.length === 0) return 0;
  const total = statuses.reduce((sum, s) => sum + domainProgress(s), 0);
  return total / statuses.length;
}
