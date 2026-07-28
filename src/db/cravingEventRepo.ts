import { getDb } from './client';
import { CravingEvent, CravingTriggerTag } from '../domain/types';
import { generateId } from '../domain/id';

interface CravingEventRow {
  id: string;
  timestamp: string;
  trigger_tag: string | null;
}

function rowToEvent(row: CravingEventRow): CravingEvent {
  return {
    id: row.id,
    timestamp: row.timestamp,
    triggerTag: (row.trigger_tag as CravingTriggerTag | null) ?? undefined,
  };
}

export async function getCravingEvents(): Promise<CravingEvent[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<CravingEventRow>('SELECT * FROM craving_event ORDER BY timestamp DESC');
  return rows.map(rowToEvent);
}

// Stage 3's craving button is a single tap with no follow-up question, so
// triggerTag is always omitted for now - present for when that's added.
export async function logCravingEvent(triggerTag?: CravingTriggerTag): Promise<CravingEvent> {
  const db = await getDb();
  const event: CravingEvent = { id: generateId('craving'), timestamp: new Date().toISOString(), triggerTag };
  await db.runAsync('INSERT INTO craving_event (id, timestamp, trigger_tag) VALUES (?, ?, ?)', [
    event.id,
    event.timestamp,
    event.triggerTag ?? null,
  ]);
  return event;
}
