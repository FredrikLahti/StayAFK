// Pure layout logic for the Day Detail screen: which windows actually have
// scheduled/free time, and where to note a gap (e.g. "at work until 6pm")
// rather than rendering empty timeline space for hours nobody is free.
import { DayPart, ScheduleSlot } from '../domain/types';
import { WINDOW_ORDER } from './timelineTime';

export type DayRow =
  | { kind: 'section'; window: DayPart; slots: ScheduleSlot[] }
  | { kind: 'gap'; window: DayPart };

// Only windows strictly between the first and last occupied window are
// worth calling out as a gap - a window before the first or after the last
// bit of free time isn't a "gap in the middle of the day", it's just
// outside the free-time range entirely, so those are omitted rather than
// noted.
export function buildDayRows(slots: ScheduleSlot[]): DayRow[] {
  const domainSlots = slots.filter((s) => s.domain !== 'Sleep');
  const slotsByWindow = new Map<DayPart, ScheduleSlot[]>();
  for (const slot of domainSlots) {
    const list = slotsByWindow.get(slot.timeWindow) ?? [];
    list.push(slot);
    slotsByWindow.set(slot.timeWindow, list);
  }

  const occupiedIndices = WINDOW_ORDER.map((window, index) => (slotsByWindow.has(window) ? index : -1)).filter(
    (index) => index >= 0
  );
  if (occupiedIndices.length === 0) return [];

  const first = occupiedIndices[0];
  const last = occupiedIndices[occupiedIndices.length - 1];

  const rows: DayRow[] = [];
  for (let i = first; i <= last; i++) {
    const window = WINDOW_ORDER[i];
    const windowSlots = slotsByWindow.get(window);
    rows.push(windowSlots ? { kind: 'section', window, slots: windowSlots } : { kind: 'gap', window });
  }
  return rows;
}
