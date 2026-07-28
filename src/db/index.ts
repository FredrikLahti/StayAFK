import { getDb } from './client';
import { SCHEMA_SQL } from './schema';
import { seedDefaultDomainFloorsIfEmpty } from './domainFloorRepo';
import { seedInitialFoundationStatusesIfEmpty } from './foundationStatusRepo';
import { seedPlaceholderAssignmentLibraryIfEmpty } from './assignmentLibraryRepo';

let initPromise: Promise<void> | null = null;

// Creates tables (idempotent) and seeds the default domain floors + the
// placeholder assignment library the first time the app runs.
export function initDatabase(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const db = await getDb();
      await db.execAsync(SCHEMA_SQL);
      await seedDefaultDomainFloorsIfEmpty();
      await seedInitialFoundationStatusesIfEmpty();
      await seedPlaceholderAssignmentLibraryIfEmpty();
    })();
  }
  return initPromise;
}

export { getDb } from './client';
export * from './userProfileRepo';
export * from './dailyFreeTimeCheckRepo';
export * from './phaseRepo';
export * from './domainFloorRepo';
export * from './foundationStatusRepo';
export * from './scheduleSlotRepo';
export * from './assignmentLibraryRepo';
export * from './gamingControlRepo';
export * from './cravingEventRepo';
export * from './relapseEventRepo';
export * from './notificationSettingsRepo';
export * from './purchaseStatusRepo';
