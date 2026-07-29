// Layer 3: place the day's slots. Sleep is a fixed nightly slot (see
// layer2.ts for why it doesn't compete for discretionary free time); Move
// and Build (the other time-boxed domains) are packed window by window from
// what Layer 2 allocated them. Whatever free time is left once those run
// out becomes a single 'flexible' slot for the day (domain 'Live') rather
// than a per-window filler - per the "Day structure: time-boxed vs.
// checklist domains" split, that's where checklist items conceptually live.
// Fuel/Connect/Maintain get one checklist slot each, if due (see
// checklist.ts) - no duration or window, just a day-level item.
import { Domain, DomainFloor, PhaseName, ScheduleSlot } from '../domain/types';
import { FreeTimeWindow } from './layer1';
import { DomainAllocation } from './layer2';

const DEFAULT_SLEEP_MINUTES = 480; // 8h, used if no Sleep floor is configured

function makeTimeboxedSlot(
  date: string,
  window: NonNullable<ScheduleSlot['timeWindow']>,
  domain: Domain,
  durationMinutes: number,
  phase: PhaseName,
  index: number
): ScheduleSlot {
  return {
    id: `${date}_${window}_${domain}_${index}`,
    date,
    kind: 'timeboxed',
    timeWindow: window,
    domain,
    durationMinutes,
    assignedActivityId: null,
    equivalentActivityId: null,
    status: 'pending',
    phaseAtCreation: phase,
  };
}

function makeFlexibleSlot(date: string, durationMinutes: number, phase: PhaseName, index: number): ScheduleSlot {
  return {
    id: `${date}_flexible_Live_${index}`,
    date,
    kind: 'flexible',
    timeWindow: null,
    domain: 'Live',
    durationMinutes,
    assignedActivityId: null,
    equivalentActivityId: null,
    status: 'pending',
    phaseAtCreation: phase,
  };
}

function makeChecklistSlot(date: string, domain: Domain, phase: PhaseName, index: number): ScheduleSlot {
  return {
    id: `${date}_checklist_${domain}_${index}`,
    date,
    kind: 'checklist',
    timeWindow: null,
    domain,
    durationMinutes: null,
    assignedActivityId: null,
    equivalentActivityId: null,
    status: 'pending',
    phaseAtCreation: phase,
  };
}

export function buildScheduleSlots(
  date: string,
  windows: FreeTimeWindow[],
  domainAllocations: DomainAllocation[],
  phase: PhaseName,
  sleepFloor?: DomainFloor,
  dueChecklistDomains: Domain[] = []
): ScheduleSlot[] {
  let counter = 0;
  const slots: ScheduleSlot[] = [];

  const sleepMinutes = sleepFloor ? Math.round(sleepFloor.weeklyMinimumMinutes / 7) : DEFAULT_SLEEP_MINUTES;
  slots.push(makeTimeboxedSlot(date, 'night', 'Sleep', sleepMinutes, phase, counter++));

  // Mutable queue of domains still owed minutes, consumed window by window.
  const queue = domainAllocations.filter((a) => a.minutes > 0).map((a) => ({ ...a }));
  let leftoverMinutes = 0;

  for (const w of windows) {
    let remaining = w.minutes;

    while (remaining > 0 && queue.length > 0) {
      const next = queue[0];
      const take = Math.min(remaining, next.minutes);
      if (take > 0) {
        slots.push(makeTimeboxedSlot(date, w.window, next.domain, take, phase, counter++));
        next.minutes -= take;
        remaining -= take;
      }
      if (next.minutes <= 0) {
        queue.shift();
      }
    }

    // Nothing left in the domain queue to spend on this window's remaining
    // minutes - rolled into the day's single flexible-time total rather
    // than becoming its own per-window slot.
    leftoverMinutes += remaining;
  }

  if (leftoverMinutes > 0) {
    slots.push(makeFlexibleSlot(date, leftoverMinutes, phase, counter++));
  }

  for (const domain of dueChecklistDomains) {
    slots.push(makeChecklistSlot(date, domain, phase, counter++));
  }

  return slots;
}
