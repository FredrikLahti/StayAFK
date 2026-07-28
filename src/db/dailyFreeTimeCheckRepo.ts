import { getDb } from './client';
import { DailyFreeTimeCheck } from '../domain/types';

interface DailyFreeTimeCheckRow {
  date: string;
  response_type: string;
  adjusted_hours: string | null;
  adjusted_windows: string | null;
  source: string;
}

function rowToCheck(row: DailyFreeTimeCheckRow): DailyFreeTimeCheck {
  return {
    date: row.date,
    responseType: row.response_type as DailyFreeTimeCheck['responseType'],
    adjustedHours: (row.adjusted_hours as DailyFreeTimeCheck['adjustedHours']) ?? undefined,
    adjustedWindows: row.adjusted_windows ? JSON.parse(row.adjusted_windows) : undefined,
    source: row.source as DailyFreeTimeCheck['source'],
  };
}

export async function getDailyFreeTimeCheck(date: string): Promise<DailyFreeTimeCheck | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<DailyFreeTimeCheckRow>(
    'SELECT * FROM daily_free_time_check WHERE date = ?',
    [date]
  );
  return row ? rowToCheck(row) : null;
}

export async function saveDailyFreeTimeCheck(check: DailyFreeTimeCheck): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO daily_free_time_check (date, response_type, adjusted_hours, adjusted_windows, source)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       response_type = excluded.response_type,
       adjusted_hours = excluded.adjusted_hours,
       adjusted_windows = excluded.adjusted_windows,
       source = excluded.source`,
    [
      check.date,
      check.responseType,
      check.adjustedHours ?? null,
      check.adjustedWindows ? JSON.stringify(check.adjustedWindows) : null,
      check.source,
    ]
  );
}
