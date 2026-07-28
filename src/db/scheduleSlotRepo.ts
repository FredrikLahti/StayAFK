import { getDb } from './client';
import { Domain, DayPart, PhaseName, ScheduleSlot, SlotStatus } from '../domain/types';

interface ScheduleSlotRow {
  id: string;
  date: string;
  time_window: string;
  domain: string;
  duration_minutes: number;
  assigned_activity_id: string | null;
  equivalent_activity_id: string | null;
  status: string;
  phase_at_creation: string;
}

function rowToSlot(row: ScheduleSlotRow): ScheduleSlot {
  return {
    id: row.id,
    date: row.date,
    timeWindow: row.time_window as DayPart,
    domain: row.domain as Domain,
    durationMinutes: row.duration_minutes,
    assignedActivityId: row.assigned_activity_id,
    equivalentActivityId: row.equivalent_activity_id,
    status: row.status as SlotStatus,
    phaseAtCreation: row.phase_at_creation as PhaseName,
  };
}

export async function getScheduleSlotsForDate(date: string): Promise<ScheduleSlot[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ScheduleSlotRow>(
    'SELECT * FROM schedule_slot WHERE date = ? ORDER BY rowid',
    [date]
  );
  return rows.map(rowToSlot);
}

export async function replaceScheduleSlotsForDate(date: string, slots: ScheduleSlot[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM schedule_slot WHERE date = ?', [date]);
    for (const slot of slots) {
      await db.runAsync(
        `INSERT INTO schedule_slot (id, date, time_window, domain, duration_minutes, assigned_activity_id, equivalent_activity_id, status, phase_at_creation)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          slot.id,
          slot.date,
          slot.timeWindow,
          slot.domain,
          slot.durationMinutes,
          slot.assignedActivityId,
          slot.equivalentActivityId,
          slot.status,
          slot.phaseAtCreation,
        ]
      );
    }
  });
}

export interface ScheduleSlotCheckIn {
  status: SlotStatus;
  equivalentActivityId: string | null;
}

export async function checkInScheduleSlot(id: string, checkIn: ScheduleSlotCheckIn): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE schedule_slot SET status = ?, equivalent_activity_id = ? WHERE id = ?', [
    checkIn.status,
    checkIn.equivalentActivityId,
    id,
  ]);
}
