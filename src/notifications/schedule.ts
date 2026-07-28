import * as Notifications from 'expo-notifications';
import { NotificationIntensity, ScheduleSlot } from '../domain/types';
import { computeNotificationPlan, NotificationTrigger } from './plan';

// expo-notifications' local scheduling has no web implementation
// (NotificationScheduler is a no-op stub there) and throws a catchable
// UnavailabilityError - every call here is wrapped so the rest of the app
// keeps working in environments/platforms where it's unavailable.

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch (error) {
    console.warn('Notification permissions unavailable', error);
    return false;
  }
}

function toNativeTrigger(trigger: NotificationTrigger): Notifications.SchedulableNotificationTriggerInput {
  if (trigger.kind === 'date') {
    return { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger.date };
  }
  return { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: trigger.hour, minute: trigger.minute };
}

// Recomputes and reschedules every locally-scheduled notification from
// scratch based on the current pending state - simplest way to stay
// accurate without a background worker, since this app only ever cares
// about "today".
export async function syncDailyNotifications(params: {
  intensity: NotificationIntensity;
  slots: ScheduleSlot[];
  now?: Date;
}): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const plan = computeNotificationPlan({
      intensity: params.intensity,
      slots: params.slots,
      now: params.now ?? new Date(),
    });

    for (const item of plan) {
      await Notifications.scheduleNotificationAsync({
        content: { title: item.title, body: item.body },
        trigger: toNativeTrigger(item.trigger),
      });
    }
  } catch (error) {
    console.warn('Local notification scheduling unavailable', error);
  }
}
