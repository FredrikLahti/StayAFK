import { getDb } from './client';
import { Domain, DomainFloor } from '../domain/types';
import { DEFAULT_DOMAIN_FLOORS } from '../domain/defaults';

interface DomainFloorRow {
  domain: string;
  weekly_minimum_minutes: number;
  min_sessions_per_week: number;
  notes: string;
}

function rowToFloor(row: DomainFloorRow): DomainFloor {
  return {
    domain: row.domain as Domain,
    weeklyMinimumMinutes: row.weekly_minimum_minutes,
    minSessionsPerWeek: row.min_sessions_per_week,
    notes: row.notes,
  };
}

export async function getDomainFloors(): Promise<DomainFloor[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<DomainFloorRow>('SELECT * FROM domain_floor');
  return rows.map(rowToFloor);
}

export async function seedDefaultDomainFloorsIfEmpty(): Promise<void> {
  const db = await getDb();
  const existing = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM domain_floor');
  if (existing && existing.count > 0) return;

  for (const floor of DEFAULT_DOMAIN_FLOORS) {
    await db.runAsync(
      `INSERT INTO domain_floor (domain, weekly_minimum_minutes, min_sessions_per_week, notes)
       VALUES (?, ?, ?, ?)`,
      [floor.domain, floor.weeklyMinimumMinutes, floor.minSessionsPerWeek, floor.notes]
    );
  }
}
