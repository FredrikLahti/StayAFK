// Dev-only escape hatch for headless E2E runs that need to reach app states
// the engine's normal (deterministic, floor-driven) daily allocation won't
// organically produce for a given test profile - real purchases can't be
// completed on web at all (expo-iap has no web implementation, see
// purchase/iap.ts), and the Move domain's honesty-check tier-gap flow only
// triggers for a high-tier original assignment, which the default test
// profile's free-time allocation never lands on (Move's daily minutes never
// come out close enough to a high-tier entry's duration). __DEV__ is false
// in production builds, so none of this ever ships.
import { markPurchased, getScheduleSlotsForDate, replaceScheduleSlotsForDate } from '../db';
import { todayISODate } from '../domain/date';

declare global {
  // eslint-disable-next-line no-var
  var __stayafkE2EUnlock: (() => Promise<void>) | undefined;
  // eslint-disable-next-line no-var
  var __stayafkE2EForceAssignment: ((domain: string, activityId: string) => Promise<void>) | undefined;
}

export function installE2ETestHooks(): void {
  if (!__DEV__) return;

  globalThis.__stayafkE2EUnlock = async () => {
    await markPurchased('web', new Date().toISOString());
  };

  globalThis.__stayafkE2EForceAssignment = async (domain, activityId) => {
    const date = todayISODate();
    const slots = await getScheduleSlotsForDate(date);
    const updated = slots.map((s) => (s.domain === domain && s.kind === 'timeboxed' ? { ...s, assignedActivityId: activityId } : s));
    await replaceScheduleSlotsForDate(date, updated);
  };
}
