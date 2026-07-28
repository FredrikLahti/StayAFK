import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import EntryScreen from './src/screens/EntryScreen';
import TodayScreen from './src/screens/TodayScreen';
import GamingControlScreen from './src/screens/GamingControlScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import PaywallScreen from './src/screens/PaywallScreen';
import CravingButton from './src/screens/CravingButton';
import OnboardingScreen from './src/onboarding/OnboardingScreen';
import {
  AssignmentLibraryEntry,
  CravingEvent,
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
} from './src/domain/types';
import {
  checkInScheduleSlot,
  ensureGamingControlStatus,
  ensureNotificationSettings,
  ensurePurchaseStatus,
  getAssignmentLibrary,
  getCravingEvents,
  getFoundationStatuses,
  getPhase,
  getRelapseEvents,
  getScheduleSlotsForDate,
  getUserProfile,
  initDatabase,
  logCravingEvent,
  logRelapseEvent,
  markPurchased,
  saveUserProfile,
  startResetPhase,
  updateFoundationActivityStates,
  updateGamingControlState,
  updateNotificationIntensity,
} from './src/db';
import { todayISODate } from './src/domain/date';
import { generateAndPersistDay } from './src/dayGenerator';
import { applyRelapseToFoundationStatuses, getRelapseOutcome } from './src/gamingcontrol/relapse';
import { colors, FONTS_TO_LOAD } from './src/theme';
import { isTrialExpired } from './src/purchase/trial';
import {
  PLACEHOLDER_PRICE_DISPLAY,
  fetchUnlockProductDisplayPrice,
  initPurchaseConnection,
  requestUnlockPurchase,
  restoreUnlockPurchase,
  subscribeToPurchaseUpdates,
} from './src/purchase/iap';
import { requestNotificationPermissions, syncDailyNotifications } from './src/notifications/schedule';

interface CoreData {
  phase: Phase;
  gamingControl: GamingControlStatus;
  notificationSettings: NotificationSettings;
  purchaseStatus: PurchaseStatus;
}

interface TodayData extends CoreData {
  date: string;
  slots: ScheduleSlot[];
  library: AssignmentLibraryEntry[];
}

type ReturnableState = ({ screen: 'today' } & TodayData) | ({ screen: 'paywall' } & CoreData);

type AppState =
  | { screen: 'loading' }
  | { screen: 'entry' }
  | { screen: 'onboarding' }
  | ({ screen: 'today' } & TodayData)
  | ({ screen: 'gamingControl'; cravingEvents: CravingEvent[]; relapseEvents: RelapseEvent[] } & TodayData)
  | { screen: 'settings'; returnTo: ReturnableState }
  | ({ screen: 'paywall' } & CoreData);

export default function App() {
  const [state, setState] = useState<AppState>({ screen: 'loading' });
  const [priceDisplay, setPriceDisplay] = useState(PLACEHOLDER_PRICE_DISPLAY);
  const [fontsLoaded] = useFonts(FONTS_TO_LOAD);

  useEffect(() => {
    bootstrap();

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
        const profile = await getUserProfile();
        if (profile) await showTodayFor(profile);
      },
      (error) => {
        console.warn('Purchase error', error);
      }
    );
    return () => subscription.remove();
  }, []);

  async function bootstrap() {
    await initDatabase();
    const profile = await getUserProfile();

    if (!profile) {
      setState({ screen: 'entry' });
      return;
    }

    await showTodayFor(profile);
  }

  async function showTodayFor(profile: UserProfile) {
    const date = todayISODate();
    const phase = (await getPhase()) ?? (await startResetPhase(new Date().toISOString()));
    const gamingControl = await ensureGamingControlStatus();
    const notificationSettings = await ensureNotificationSettings();
    const purchaseStatus = await ensurePurchaseStatus();

    if (!purchaseStatus.isUnlocked && isTrialExpired(phase.phaseStartDate)) {
      setState({ screen: 'paywall', phase, gamingControl, notificationSettings, purchaseStatus });
      return;
    }

    let slots = await getScheduleSlotsForDate(date);
    if (slots.length === 0) {
      slots = await generateAndPersistDay(date, profile, phase.currentPhase);
    }

    const library = await getAssignmentLibrary();
    await syncDailyNotifications({ intensity: notificationSettings.intensity, slots });
    setState({ screen: 'today', date, phase, slots, library, gamingControl, notificationSettings, purchaseStatus });
  }

  async function handleOnboardingComplete(answers: Omit<UserProfile, 'id' | 'createdAt'>) {
    const profile = await saveUserProfile(answers);
    await startResetPhase(new Date().toISOString());
    await requestNotificationPermissions();
    await showTodayFor(profile);
  }

  function handleRestartOnboarding() {
    setState({ screen: 'onboarding' });
  }

  async function handleCheckIn(
    slotId: string,
    update: { status: SlotStatus; equivalentActivityId: string | null }
  ) {
    await checkInScheduleSlot(slotId, update);
    if (state.screen === 'today' || state.screen === 'gamingControl') {
      const updatedSlots = state.slots.map((s) => (s.id === slotId ? { ...s, ...update } : s));
      await syncDailyNotifications({ intensity: state.notificationSettings.intensity, slots: updatedSlots });
    }
    setState((prev) =>
      prev.screen === 'today' || prev.screen === 'gamingControl'
        ? { ...prev, slots: prev.slots.map((s) => (s.id === slotId ? { ...s, ...update } : s)) }
        : prev
    );
  }

  async function handleLogCraving() {
    const event = await logCravingEvent();
    setState((prev) =>
      prev.screen === 'gamingControl' ? { ...prev, cravingEvents: [event, ...prev.cravingEvents] } : prev
    );
  }

  async function handleOpenGamingControl() {
    const [cravingEvents, relapseEvents] = await Promise.all([getCravingEvents(), getRelapseEvents()]);
    setState((prev) =>
      prev.screen === 'today' ? { ...prev, screen: 'gamingControl', cravingEvents, relapseEvents } : prev
    );
  }

  function handleBackToToday() {
    setState((prev) => {
      if (prev.screen !== 'gamingControl') return prev;
      const { cravingEvents, relapseEvents, ...todayData } = prev;
      return { ...todayData, screen: 'today' };
    });
  }

  async function handleRelapse(severity: RelapseSeverity) {
    const date = todayISODate();
    const outcome = getRelapseOutcome(severity);
    const event = await logRelapseEvent(date, severity, outcome.resultingState);
    await updateGamingControlState(outcome.resultingState);

    const foundationStatuses = await getFoundationStatuses();
    const updatedStatuses = applyRelapseToFoundationStatuses(severity, foundationStatuses);
    await updateFoundationActivityStates(updatedStatuses);

    setState((prev) => {
      if (prev.screen !== 'gamingControl') return prev;
      return {
        ...prev,
        gamingControl: { ...prev.gamingControl, state: outcome.resultingState },
        relapseEvents: [event, ...prev.relapseEvents],
      };
    });
  }

  function handleOpenSettings() {
    setState((prev) =>
      prev.screen === 'today' || prev.screen === 'paywall' ? { screen: 'settings', returnTo: prev } : prev
    );
  }

  function handleBackFromSettings() {
    setState((prev) => (prev.screen === 'settings' ? prev.returnTo : prev));
  }

  async function handleChangeNotificationIntensity(intensity: NotificationIntensity) {
    await updateNotificationIntensity(intensity);
    if (state.screen === 'settings' && state.returnTo.screen === 'today') {
      await syncDailyNotifications({ intensity, slots: state.returnTo.slots });
    }
    setState((prev) =>
      prev.screen === 'settings' ? { ...prev, returnTo: { ...prev.returnTo, notificationSettings: { intensity } } } : prev
    );
  }

  async function handleUnlock() {
    await requestUnlockPurchase();
    // Completion arrives asynchronously via the purchaseUpdatedListener set
    // up in the top-level useEffect, which persists PurchaseStatus and
    // moves the app off the Paywall - there is nothing further to do here.
  }

  async function handleRestore(): Promise<boolean> {
    return restoreUnlockPurchase();
  }

  if (state.screen === 'loading' || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.metalFlat} />
        <StatusBar style="light" />
      </View>
    );
  }

  if (state.screen === 'entry') {
    return (
      <>
        <EntryScreen onStart={() => setState({ screen: 'onboarding' })} />
        <StatusBar style="light" />
      </>
    );
  }

  if (state.screen === 'onboarding') {
    return (
      <>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
        <StatusBar style="light" />
      </>
    );
  }

  if (state.screen === 'paywall') {
    return (
      <>
        <PaywallScreen
          priceDisplay={priceDisplay}
          onUnlock={handleUnlock}
          onRestore={handleRestore}
          onOpenSettings={handleOpenSettings}
        />
        <StatusBar style="light" />
      </>
    );
  }

  if (state.screen === 'settings') {
    return (
      <>
        <SettingsScreen
          notificationIntensity={state.returnTo.notificationSettings.intensity}
          purchaseStatus={state.returnTo.purchaseStatus}
          phaseStartDate={state.returnTo.phase.phaseStartDate}
          onBack={handleBackFromSettings}
          onChangeIntensity={handleChangeNotificationIntensity}
        />
        <StatusBar style="light" />
      </>
    );
  }

  if (state.screen === 'gamingControl') {
    return (
      <View style={styles.flexFill}>
        <GamingControlScreen
          status={state.gamingControl}
          cravingEvents={state.cravingEvents}
          relapseEvents={state.relapseEvents}
          onBack={handleBackToToday}
          onRelapse={handleRelapse}
        />
        <CravingButton onPress={handleLogCraving} />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <View style={styles.flexFill}>
      <TodayScreen
        date={state.date}
        phase={state.phase.currentPhase}
        slots={state.slots}
        library={state.library}
        onRestartOnboarding={handleRestartOnboarding}
        onCheckIn={handleCheckIn}
        onOpenGamingControl={handleOpenGamingControl}
        onOpenSettings={handleOpenSettings}
      />
      <CravingButton onPress={handleLogCraving} />
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  flexFill: { flex: 1 },
});
