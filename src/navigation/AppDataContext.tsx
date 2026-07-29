import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  AssignmentLibraryEntry,
  CravingEvent,
  DomainFloor,
  FoundationStatus,
  GamingControlStatus,
  NotificationIntensity,
  NotificationSettings,
  Phase,
  PurchaseStatus,
  RelapseEvent,
  RelapseSeverity,
  ScheduleSlot,
  SlotStatus,
  UserProfile,
} from '../domain/types';
import {
  checkInScheduleSlot,
  ensureGamingControlStatus,
  ensureNotificationSettings,
  ensurePurchaseStatus,
  getAssignmentLibrary,
  getCravingEvents,
  getDomainFloors,
  getFoundationStatuses,
  getMostRecentActiveScheduleDate,
  getPhase,
  getRelapseEvents,
  getScheduleSlotsForDate,
  getUserProfile,
  initDatabase,
  logCravingEvent,
  logRelapseEvent,
  markPurchased,
  pauseNotifications,
  saveUserProfile,
  startResetPhase,
  updateFoundationActivityStates,
  updateGamingControlState,
  updateNotificationIntensity,
} from '../db';
import { todayISODate } from '../domain/date';
import { generateAndPersistDay } from '../dayGenerator';
import { applyRelapseToFoundationStatuses, getRelapseOutcome } from '../gamingcontrol/relapse';
import { daysBetween, getLastActivityDate, getSilenceLevel, SilenceLevel } from '../gamingcontrol/silence';
import { isTrialExpired } from '../purchase/trial';
import {
  PLACEHOLDER_PRICE_DISPLAY,
  fetchUnlockProductDisplayPrice,
  initPurchaseConnection,
  requestUnlockPurchase,
  restoreUnlockPurchase,
  subscribeToPurchaseUpdates,
} from '../purchase/iap';
import { requestNotificationPermissions, syncDailyNotifications } from '../notifications/schedule';

// Everything loaded once a UserProfile exists - todaySlots is deliberately
// not part of this (it's derived from slotsCache[todayDate] so there is
// only ever one place slot data for a date lives).
interface ReadyState {
  phase: Phase;
  gamingControl: GamingControlStatus;
  notificationSettings: NotificationSettings;
  purchaseStatus: PurchaseStatus;
  foundationStatuses: FoundationStatus[];
  domainFloors: DomainFloor[];
  cravingEvents: CravingEvent[];
  relapseEvents: RelapseEvent[];
  library: AssignmentLibraryEntry[];
  silenceLevel: SilenceLevel;
  todayDate: string;
}

type BootState = { kind: 'loading' } | { kind: 'needsOnboarding' } | ({ kind: 'ready' } & ReadyState);

export interface ReadyAppData extends ReadyState {
  todaySlots: ScheduleSlot[];
  priceDisplay: string;
  isPaywalled: boolean;
}

interface AppDataValue {
  status: 'loading' | 'needsOnboarding' | 'ready';
  data: ReadyAppData | null;
  completeOnboarding: (answers: Omit<UserProfile, 'id' | 'createdAt'>) => Promise<void>;
  getSlotsForDate: (date: string) => Promise<ScheduleSlot[]>;
  checkIn: (
    slotId: string,
    date: string,
    update: { status: SlotStatus; equivalentActivityId: string | null }
  ) => Promise<void>;
  logCraving: () => Promise<void>;
  relapse: (severity: RelapseSeverity) => Promise<void>;
  changeNotificationIntensity: (intensity: NotificationIntensity) => Promise<void>;
  optOutOfNotifications: () => Promise<void>;
  unlock: () => Promise<void>;
  restore: () => Promise<boolean>;
}

const AppDataContext = createContext<AppDataValue | null>(null);

async function computeSilenceLevel(phase: Phase, notificationSettings: NotificationSettings): Promise<SilenceLevel> {
  if (notificationSettings.notificationsPaused) return 'none';

  const [mostRecentActiveScheduleDate, cravingEvents, relapseEvents] = await Promise.all([
    getMostRecentActiveScheduleDate(),
    getCravingEvents(),
    getRelapseEvents(),
  ]);

  const lastActivityDate = getLastActivityDate({
    mostRecentActiveScheduleDate,
    cravingEventDates: cravingEvents.map((e) => e.timestamp.slice(0, 10)),
    relapseEventDates: relapseEvents.map((e) => e.date),
    fallbackDate: phase.phaseStartDate.slice(0, 10),
  });

  return getSilenceLevel(daysBetween(lastActivityDate, todayISODate()));
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [boot, setBoot] = useState<BootState>({ kind: 'loading' });
  const [priceDisplay, setPriceDisplay] = useState(PLACEHOLDER_PRICE_DISPLAY);
  const [slotsCache, setSlotsCache] = useState<Record<string, ScheduleSlot[]>>({});

  const loadReadyDataFor = useCallback(async (profile: UserProfile) => {
    const date = todayISODate();
    const phase = (await getPhase()) ?? (await startResetPhase(new Date().toISOString()));
    const gamingControl = await ensureGamingControlStatus();
    const notificationSettings = await ensureNotificationSettings();
    const purchaseStatus = await ensurePurchaseStatus();

    let todaySlots = await getScheduleSlotsForDate(date);
    if (todaySlots.length === 0) {
      todaySlots = await generateAndPersistDay(date, profile, phase.currentPhase);
    }

    const [library, foundationStatuses, domainFloors, cravingEvents, relapseEvents] = await Promise.all([
      getAssignmentLibrary(),
      getFoundationStatuses(),
      getDomainFloors(),
      getCravingEvents(),
      getRelapseEvents(),
    ]);
    const silenceLevel = await computeSilenceLevel(phase, notificationSettings);
    await syncDailyNotifications({
      intensity: notificationSettings.intensity,
      slots: todaySlots,
      notificationsPaused: notificationSettings.notificationsPaused,
    });

    setSlotsCache((prev) => ({ ...prev, [date]: todaySlots }));
    setBoot({
      kind: 'ready',
      phase,
      gamingControl,
      notificationSettings,
      purchaseStatus,
      foundationStatuses,
      domainFloors,
      cravingEvents,
      relapseEvents,
      library,
      silenceLevel,
      todayDate: date,
    });
  }, []);

  useEffect(() => {
    (async () => {
      await initDatabase();
      const profile = await getUserProfile();
      if (!profile) {
        setBoot({ kind: 'needsOnboarding' });
        return;
      }
      await loadReadyDataFor(profile);
    })();

    // Purchase completion is event-based and can arrive at any time (the
    // platform purchase UI is native/out-of-process), so this listens for
    // the whole app's lifetime rather than only while the Paywall is shown.
    initPurchaseConnection().then((supported) => {
      if (!supported) return;
      fetchUnlockProductDisplayPrice().then((price) => {
        if (price) setPriceDisplay(price);
      });
    });
    const subscription = subscribeToPurchaseUpdates(
      async (purchase) => {
        const platform = purchase.platform === 'ios' || purchase.platform === 'android' ? purchase.platform : 'web';
        await markPurchased(platform, new Date().toISOString());
        setBoot((prev) =>
          prev.kind === 'ready' ? { ...prev, purchaseStatus: { ...prev.purchaseStatus, isUnlocked: true } } : prev
        );
      },
      (error) => {
        console.warn('Purchase error', error);
      }
    );
    return () => subscription.remove();
  }, [loadReadyDataFor]);

  const getSlotsForDate = useCallback(
    async (date: string): Promise<ScheduleSlot[]> => {
      const cached = slotsCache[date];
      if (cached) return cached;
      const slots = await getScheduleSlotsForDate(date);
      setSlotsCache((prev) => ({ ...prev, [date]: slots }));
      return slots;
    },
    [slotsCache]
  );

  const checkIn = useCallback(
    async (slotId: string, date: string, update: { status: SlotStatus; equivalentActivityId: string | null }) => {
      await checkInScheduleSlot(slotId, update);
      const current = slotsCache[date] ?? (await getScheduleSlotsForDate(date));
      const updatedSlots = current.map((s) => (s.id === slotId ? { ...s, ...update } : s));
      setSlotsCache((prev) => ({ ...prev, [date]: updatedSlots }));
      setBoot((prev) => (prev.kind === 'ready' ? { ...prev, silenceLevel: 'none' } : prev));

      // Notifications are only ever scheduled against today's slots.
      if (boot.kind === 'ready' && date === boot.todayDate) {
        await syncDailyNotifications({
          intensity: boot.notificationSettings.intensity,
          slots: updatedSlots,
          notificationsPaused: boot.notificationSettings.notificationsPaused,
        });
      }
    },
    [slotsCache, boot]
  );

  const logCraving = useCallback(async () => {
    const event = await logCravingEvent();
    setBoot((prev) =>
      prev.kind === 'ready' ? { ...prev, cravingEvents: [event, ...prev.cravingEvents], silenceLevel: 'none' } : prev
    );
  }, []);

  const relapse = useCallback(async (severity: RelapseSeverity) => {
    const date = todayISODate();
    const outcome = getRelapseOutcome(severity);
    const event = await logRelapseEvent(date, severity, outcome.resultingState);
    await updateGamingControlState(outcome.resultingState);

    const currentStatuses = await getFoundationStatuses();
    const updatedStatuses = applyRelapseToFoundationStatuses(severity, currentStatuses);
    await updateFoundationActivityStates(updatedStatuses);

    setBoot((prev) =>
      prev.kind === 'ready'
        ? {
            ...prev,
            gamingControl: { ...prev.gamingControl, state: outcome.resultingState },
            relapseEvents: [event, ...prev.relapseEvents],
            foundationStatuses: updatedStatuses,
            silenceLevel: 'none',
          }
        : prev
    );
  }, []);

  const changeNotificationIntensity = useCallback(
    async (intensity: NotificationIntensity) => {
      await updateNotificationIntensity(intensity);
      if (boot.kind === 'ready') {
        await syncDailyNotifications({
          intensity,
          slots: slotsCache[boot.todayDate] ?? [],
          notificationsPaused: boot.notificationSettings.notificationsPaused,
        });
      }
      setBoot((prev) =>
        prev.kind === 'ready' ? { ...prev, notificationSettings: { ...prev.notificationSettings, intensity } } : prev
      );
    },
    [slotsCache, boot]
  );

  const optOutOfNotifications = useCallback(async () => {
    await pauseNotifications();
    if (boot.kind === 'ready') {
      await syncDailyNotifications({ intensity: boot.notificationSettings.intensity, slots: [], notificationsPaused: true });
    }
    setBoot((prev) =>
      prev.kind === 'ready'
        ? { ...prev, notificationSettings: { ...prev.notificationSettings, notificationsPaused: true }, silenceLevel: 'none' }
        : prev
    );
  }, [boot]);

  const unlock = useCallback(async () => {
    await requestUnlockPurchase();
    // Completion arrives asynchronously via the purchaseUpdatedListener set
    // up above, which persists PurchaseStatus and flips isUnlocked - there
    // is nothing further to do here.
  }, []);

  const restore = useCallback((): Promise<boolean> => restoreUnlockPurchase(), []);

  const completeOnboarding = useCallback(
    async (answers: Omit<UserProfile, 'id' | 'createdAt'>) => {
      const profile = await saveUserProfile(answers);
      await startResetPhase(new Date().toISOString());
      await requestNotificationPermissions();
      await loadReadyDataFor(profile);
    },
    [loadReadyDataFor]
  );

  const data: ReadyAppData | null = useMemo(() => {
    if (boot.kind !== 'ready') return null;
    return {
      ...boot,
      todaySlots: slotsCache[boot.todayDate] ?? [],
      priceDisplay,
      isPaywalled: !boot.purchaseStatus.isUnlocked && isTrialExpired(boot.phase.phaseStartDate),
    };
  }, [boot, slotsCache, priceDisplay]);

  const value = useMemo<AppDataValue>(
    () => ({
      status: boot.kind,
      data,
      completeOnboarding,
      getSlotsForDate,
      checkIn,
      logCraving,
      relapse,
      changeNotificationIntensity,
      optOutOfNotifications,
      unlock,
      restore,
    }),
    [
      boot.kind,
      data,
      completeOnboarding,
      getSlotsForDate,
      checkIn,
      logCraving,
      relapse,
      changeNotificationIntensity,
      optOutOfNotifications,
      unlock,
      restore,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return ctx;
}

// Convenience hook for screens that only ever render once status==='ready'
// (i.e. everything behind the root navigator's ready gate) - avoids every
// screen re-checking `data !== null`.
export function useReadyAppData(): ReadyAppData & Omit<AppDataValue, 'status' | 'data'> {
  const ctx = useAppData();
  if (!ctx.data) {
    throw new Error('useReadyAppData called before app data finished loading');
  }
  const { status: _status, data, ...actions } = ctx;
  return { ...data, ...actions };
}
