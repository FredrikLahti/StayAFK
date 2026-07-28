// Layer 3: confirm there are never empty/unplanned slots. Sleep is placed
// as a fixed nightly slot (see layer2.ts for why it doesn't compete for
// discretionary free time), then each free-time window is packed with the
// domains Layer 2 allocated minutes to; anything a window has left over
// once those allocations run out becomes a "Live" slot rather than a gap
// (per ARCHITECTURE.md's Layer 3 description).
import { DomainFloor, PhaseName, ScheduleSlot } from '../domain/types';
import { FreeTimeWindow } from './layer1';
import { DomainAllocation } from './layer2';

const DEFAULT_SLEEP_MINUTES = 480; // 8h, used if no Sleep floor is configured

function makeSlot(
  date: string,
  window: ScheduleSlot['timeWindow'],
  domain: ScheduleSlot['domain'],
  durationMinutes: number,
  phase: PhaseName,
  index: number
): ScheduleSlot {
  return {
    id: `${date}_${window}_${domain}_${index}`,
    date,
    timeWindow: window,
    domain,
    durationMinutes,
    assignedActivityId: null,
    status: 'pending',
    phaseAtCreation: phase,
  };
}

export function buildScheduleSlots(
  date: string,
  windows: FreeTimeWindow[],
  domainAllocations: DomainAllocation[],
  phase: PhaseName,
  sleepFloor?: DomainFloor
): ScheduleSlot[] {
  let counter = 0;
  const slots: ScheduleSlot[] = [];

  const sleepMinutes = sleepFloor ? Math.round(sleepFloor.weeklyMinimumMinutes / 7) : DEFAULT_SLEEP_MINUTES;
  slots.push(makeSlot(date, 'night', 'Sleep', sleepMinutes, phase, counter++));

  // Mutable queue of domains still owed minutes, consumed window by window.
  const queue = domainAllocations.filter((a) => a.minutes > 0).map((a) => ({ ...a }));

  for (const w of windows) {
    let remaining = w.minutes;

    while (remaining > 0 && queue.length > 0) {
      const next = queue[0];
      const take = Math.min(remaining, next.minutes);
      if (take > 0) {
        slots.push(makeSlot(date, w.window, next.domain, take, phase, counter++));
        next.minutes -= take;
        remaining -= take;
      }
      if (next.minutes <= 0) {
        queue.shift();
      }
    }

    if (remaining > 0) {
      // Nothing left in the domain queue to spend on this window: rather
      // than leave it unplanned, it becomes Live time.
      slots.push(makeSlot(date, w.window, 'Live', remaining, phase, counter++));
    }
  }

  return slots;
}
