// Dev-only escape hatch for headless E2E runs that need to reach an
// unlocked-purchase state (e.g. the day-25-30 fallback nudge window, which
// falls well past the 3-day free trial) without a real IAP transaction -
// expo-iap has no web implementation (see purchase/iap.ts), so purchases
// can't be completed in a browser test at all. __DEV__ is false in
// production builds, so this never ships.
import { markPurchased } from '../db';

declare global {
  // eslint-disable-next-line no-var
  var __stayafkE2EUnlock: (() => Promise<void>) | undefined;
}

export function installE2ETestHooks(): void {
  if (!__DEV__) return;
  globalThis.__stayafkE2EUnlock = async () => {
    await markPurchased('web', new Date().toISOString());
  };
}
