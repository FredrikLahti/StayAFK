import { getDb } from './client';
import { Phase } from '../domain/types';

const CURRENT_ID = 'current';

interface PhaseRow {
  id: string;
  current_phase: string;
  phase_start_date: string;
}

function rowToPhase(row: PhaseRow): Phase {
  return {
    currentPhase: row.current_phase as Phase['currentPhase'],
    phaseStartDate: row.phase_start_date,
  };
}

export async function getPhase(): Promise<Phase | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<PhaseRow>('SELECT * FROM phase WHERE id = ?', [CURRENT_ID]);
  return row ? rowToPhase(row) : null;
}

// Reset phase always starts at the exact moment "Reset me" is triggered -
// phaseStartDate is a full ISO timestamp (not just a date) so the 72-hour
// free trial gets a real, precise 72 hours regardless of what time of day
// someone starts. Stage 1 does not yet implement automatic phase
// transitions past 'reset'.
export async function startResetPhase(startTimestamp: string): Promise<Phase> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO phase (id, current_phase, phase_start_date) VALUES (?, 'reset', ?)
     ON CONFLICT(id) DO UPDATE SET current_phase = 'reset', phase_start_date = excluded.phase_start_date`,
    [CURRENT_ID, startTimestamp]
  );
  return { currentPhase: 'reset', phaseStartDate: startTimestamp };
}
