import { getDb } from './client';
import { GamingControlState, RelapseEvent, RelapseSeverity } from '../domain/types';
import { generateId } from '../domain/id';

interface RelapseEventRow {
  id: string;
  date: string;
  severity: string;
  resulting_action: string;
}

function rowToEvent(row: RelapseEventRow): RelapseEvent {
  return {
    id: row.id,
    date: row.date,
    severity: row.severity as RelapseSeverity,
    resultingAction: row.resulting_action as GamingControlState,
  };
}

export async function getRelapseEvents(): Promise<RelapseEvent[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<RelapseEventRow>('SELECT * FROM relapse_event ORDER BY date DESC, rowid DESC');
  return rows.map(rowToEvent);
}

export async function logRelapseEvent(
  date: string,
  severity: RelapseSeverity,
  resultingAction: GamingControlState
): Promise<RelapseEvent> {
  const db = await getDb();
  const event: RelapseEvent = { id: generateId('relapse'), date, severity, resultingAction };
  await db.runAsync('INSERT INTO relapse_event (id, date, severity, resulting_action) VALUES (?, ?, ?, ?)', [
    event.id,
    event.date,
    event.severity,
    event.resultingAction,
  ]);
  return event;
}
