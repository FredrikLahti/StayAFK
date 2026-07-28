// Simple unique id for event-log rows (craving/relapse events) where the
// id just needs to be unique, not deterministic - unlike ScheduleSlot ids,
// which are derived deterministically in the engine for testability.
export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
