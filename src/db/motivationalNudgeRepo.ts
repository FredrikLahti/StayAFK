import { getDb } from './client';
import { MotivationalNudgeStatus } from '../domain/types';

const CURRENT_ID = 'current';

interface MotivationalNudgeStatusRow {
  id: string;
  last_spike_nudge_shown_at: string | null;
  fallback_nudge_shown: number;
}

function rowToStatus(row: MotivationalNudgeStatusRow): MotivationalNudgeStatus {
  return {
    lastSpikeNudgeShownAt: row.last_spike_nudge_shown_at,
    fallbackNudgeShown: row.fallback_nudge_shown === 1,
  };
}

export async function getMotivationalNudgeStatus(): Promise<MotivationalNudgeStatus | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<MotivationalNudgeStatusRow>(
    'SELECT * FROM motivational_nudge_status WHERE id = ?',
    [CURRENT_ID]
  );
  return row ? rowToStatus(row) : null;
}

export async function ensureMotivationalNudgeStatus(): Promise<MotivationalNudgeStatus> {
  const existing = await getMotivationalNudgeStatus();
  if (existing) return existing;

  const db = await getDb();
  await db.runAsync(
    `INSERT INTO motivational_nudge_status (id, last_spike_nudge_shown_at, fallback_nudge_shown) VALUES (?, NULL, 0)`,
    [CURRENT_ID]
  );
  return { lastSpikeNudgeShownAt: null, fallbackNudgeShown: false };
}

export async function markSpikeNudgeShown(shownAt: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE motivational_nudge_status SET last_spike_nudge_shown_at = ? WHERE id = ?', [
    shownAt,
    CURRENT_ID,
  ]);
}

export async function markFallbackNudgeShown(): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE motivational_nudge_status SET fallback_nudge_shown = 1 WHERE id = ?', [CURRENT_ID]);
}
