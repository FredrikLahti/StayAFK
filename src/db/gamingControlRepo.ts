import { getDb } from './client';
import { GamingControlState, GamingControlStatus } from '../domain/types';

const CURRENT_ID = 'current';

interface GamingControlStatusRow {
  id: string;
  state: string;
  signal_log: string;
}

function rowToStatus(row: GamingControlStatusRow): GamingControlStatus {
  return {
    state: row.state as GamingControlState,
    signalLog: JSON.parse(row.signal_log),
  };
}

export async function getGamingControlStatus(): Promise<GamingControlStatus | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<GamingControlStatusRow>(
    'SELECT * FROM gaming_control_status WHERE id = ?',
    [CURRENT_ID]
  );
  return row ? rowToStatus(row) : null;
}

// GamingControlStatus starts as 'in_control' the moment Reset begins, same
// timing as Phase - see startResetPhase in phaseRepo.ts.
export async function ensureGamingControlStatus(): Promise<GamingControlStatus> {
  const existing = await getGamingControlStatus();
  if (existing) return existing;

  const db = await getDb();
  await db.runAsync(
    `INSERT INTO gaming_control_status (id, state, signal_log) VALUES (?, 'in_control', '[]')`,
    [CURRENT_ID]
  );
  return { state: 'in_control', signalLog: [] };
}

export async function updateGamingControlState(state: GamingControlState): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE gaming_control_status SET state = ? WHERE id = ?', [state, CURRENT_ID]);
}
