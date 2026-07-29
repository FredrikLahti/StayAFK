// Pure summary of a single day's ScheduleSlots for the Home screen's weekly
// calendar strip - each day gets one compact indicator rather than showing
// the full timeline (that lives on the Day Detail screen now).
import { ScheduleSlot } from '../domain/types';

export type DayCompletionStatus = 'none' | 'incomplete' | 'partial' | 'complete';

export interface DayCompletion {
  status: DayCompletionStatus;
  fraction: number; // 0-1, done+equivalent out of all slots that day
}

export function computeDayCompletion(slots: ScheduleSlot[]): DayCompletion {
  if (slots.length === 0) {
    return { status: 'none', fraction: 0 };
  }
  const resolvedPositively = slots.filter((s) => s.status === 'done' || s.status === 'equivalent').length;
  const fraction = resolvedPositively / slots.length;

  if (fraction === 0) return { status: 'incomplete', fraction };
  if (fraction === 1) return { status: 'complete', fraction };
  return { status: 'partial', fraction };
}
