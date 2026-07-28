// Pure decision logic for which local notifications should be scheduled -
// separated from the actual expo-notifications calls (in schedule.ts) so it
// can be unit tested without a native module.
//
// Hard rule: notifications only ever fire at slot-end/day-end transition
// points, never mid-slot/mid-activity. Since ScheduleSlot only carries a
// day-part window (morning/afternoon/evening/night) and a duration, not a
// literal clock start/end time, "slot-level detail" is implemented here as
// window-transition reminders (one per day-part boundary) rather than a
// separate notification per individual ScheduleSlot row.
import { DayPart, NotificationIntensity, ScheduleSlot } from '../domain/types';

export interface ClockTime {
  hour: number;
  minute: number;
}

// Scheduling-only clock times for each window's end - the engine itself
// stays day-part granular; this mapping exists solely so a local
// notification has a concrete Date to trigger at.
export const WINDOW_END_TIME: Record<DayPart, ClockTime> = {
  morning: { hour: 12, minute: 0 },
  afternoon: { hour: 17, minute: 0 },
  evening: { hour: 21, minute: 0 },
  // Night's own "transition" is the same moment as end-of-day, so it does
  // not get a separate window-transition notification (see below).
  night: { hour: 21, minute: 30 },
};

export const END_OF_DAY_TIME: ClockTime = { hour: 21, minute: 30 };
export const NEXT_MORNING_TIME: ClockTime = { hour: 8, minute: 0 };

const DETAILED_TRANSITION_WINDOWS: DayPart[] = ['morning', 'afternoon', 'evening'];

export type NotificationTrigger =
  | { kind: 'date'; date: Date }
  | { kind: 'daily'; hour: number; minute: number };

export interface PlannedNotification {
  id: string;
  title: string;
  body: string;
  trigger: NotificationTrigger;
}

export function atClockTime(base: Date, time: ClockTime): Date {
  const d = new Date(base);
  d.setHours(time.hour, time.minute, 0, 0);
  return d;
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export interface NotificationPlanParams {
  intensity: NotificationIntensity;
  slots: ScheduleSlot[];
  now: Date;
  // Set once someone responds "I'm good, don't need this" to the
  // silence-based life-check message - no further notifications of any
  // kind get scheduled.
  notificationsPaused?: boolean;
}

export function computeNotificationPlan({
  intensity,
  slots,
  now,
  notificationsPaused,
}: NotificationPlanParams): PlannedNotification[] {
  if (notificationsPaused) return [];

  const plan: PlannedNotification[] = [];

  // Always scheduled, regardless of intensity or today's pending state -
  // a general "your day is ready" nudge for the next morning.
  plan.push({
    id: 'next-morning',
    title: 'StayAFK',
    body: "Your day's plan is ready when you are.",
    trigger: { kind: 'daily', hour: NEXT_MORNING_TIME.hour, minute: NEXT_MORNING_TIME.minute },
  });

  const hasPendingToday = slots.some((s) => s.status === 'pending');
  if (!hasPendingToday) {
    return plan;
  }

  const endOfDay = atClockTime(now, END_OF_DAY_TIME);
  if (endOfDay.getTime() > now.getTime()) {
    plan.push({
      id: 'end-of-day',
      title: 'StayAFK',
      body: 'A few things from today are still open - quick check-in?',
      trigger: { kind: 'date', date: endOfDay },
    });
  }

  if (intensity === 'detailed') {
    for (const window of DETAILED_TRANSITION_WINDOWS) {
      const windowHasPending = slots.some((s) => s.status === 'pending' && s.timeWindow === window);
      if (!windowHasPending) continue;

      const triggerTime = atClockTime(now, WINDOW_END_TIME[window]);
      if (triggerTime.getTime() <= now.getTime()) continue; // that window has already passed today

      plan.push({
        id: `window-${window}`,
        title: 'StayAFK',
        body: `${capitalize(window)} is wrapping up - anything to check in on?`,
        trigger: { kind: 'date', date: triggerTime },
      });
    }
  }

  return plan;
}
