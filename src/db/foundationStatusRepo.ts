import { getDb } from './client';
import { ALL_DOMAINS, Domain, FoundationStatus } from '../domain/types';

interface FoundationStatusRow {
  domain: string;
  established_capacity_minutes: number;
  current_activity_state: string;
  consecutive_days: number;
}

function rowToStatus(row: FoundationStatusRow): FoundationStatus {
  return {
    domain: row.domain as Domain,
    establishedCapacityMinutes: row.established_capacity_minutes,
    currentActivityState: row.current_activity_state as FoundationStatus['currentActivityState'],
    consecutiveDays: row.consecutive_days,
  };
}

export async function getFoundationStatuses(): Promise<FoundationStatus[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<FoundationStatusRow>('SELECT * FROM foundation_status');
  return rows.map(rowToStatus);
}

// Every domain starts "restarted" the moment Reset begins - Stage 1 does
// not yet update this as days are checked in (that's Stage 2's job).
export async function seedInitialFoundationStatusesIfEmpty(): Promise<void> {
  const db = await getDb();
  const existing = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM foundation_status');
  if (existing && existing.count > 0) return;

  for (const domain of ALL_DOMAINS) {
    await db.runAsync(
      `INSERT INTO foundation_status (domain, established_capacity_minutes, current_activity_state, consecutive_days)
       VALUES (?, 0, 'restarted', 0)`,
      [domain]
    );
  }
}

// Persists currentActivityState only - established_capacity_minutes and
// consecutive_days are deliberately left alone here; see
// applyRelapseToFoundationStatuses in gamingcontrol/relapse.ts for the rules
// on what a relapse is allowed to change.
export async function updateFoundationActivityStates(statuses: FoundationStatus[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const status of statuses) {
      await db.runAsync('UPDATE foundation_status SET current_activity_state = ? WHERE domain = ?', [
        status.currentActivityState,
        status.domain,
      ]);
    }
  });
}
