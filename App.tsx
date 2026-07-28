import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import EntryScreen from './src/screens/EntryScreen';
import TodayScreen from './src/screens/TodayScreen';
import GamingControlScreen from './src/screens/GamingControlScreen';
import CravingButton from './src/screens/CravingButton';
import OnboardingScreen from './src/onboarding/OnboardingScreen';
import {
  AssignmentLibraryEntry,
  CravingEvent,
  GamingControlStatus,
  PhaseName,
  RelapseEvent,
  RelapseSeverity,
  ScheduleSlot,
  SlotStatus,
  UserProfile,
} from './src/domain/types';
import {
  checkInScheduleSlot,
  ensureGamingControlStatus,
  getAssignmentLibrary,
  getCravingEvents,
  getPhase,
  getRelapseEvents,
  getScheduleSlotsForDate,
  getUserProfile,
  initDatabase,
  logCravingEvent,
  logRelapseEvent,
  saveUserProfile,
  startResetPhase,
  updateGamingControlState,
} from './src/db';
import { todayISODate } from './src/domain/date';
import { generateAndPersistDay } from './src/dayGenerator';
import { getRelapseOutcome } from './src/gamingcontrol/relapse';

interface TodayData {
  date: string;
  phase: PhaseName;
  slots: ScheduleSlot[];
  library: AssignmentLibraryEntry[];
  gamingControl: GamingControlStatus;
}

type AppState =
  | { screen: 'loading' }
  | { screen: 'entry' }
  | { screen: 'onboarding' }
  | ({ screen: 'today' } & TodayData)
  | ({ screen: 'gamingControl'; cravingEvents: CravingEvent[]; relapseEvents: RelapseEvent[] } & TodayData);

export default function App() {
  const [state, setState] = useState<AppState>({ screen: 'loading' });

  useEffect(() => {
    bootstrap();
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
    const phaseRecord = (await getPhase()) ?? (await startResetPhase(date));
    const gamingControl = await ensureGamingControlStatus();

    let slots = await getScheduleSlotsForDate(date);
    if (slots.length === 0) {
      slots = await generateAndPersistDay(date, profile, phaseRecord.currentPhase);
    }

    const library = await getAssignmentLibrary();
    setState({ screen: 'today', date, phase: phaseRecord.currentPhase, slots, library, gamingControl });
  }

  async function handleOnboardingComplete(answers: Omit<UserProfile, 'id' | 'createdAt'>) {
    const profile = await saveUserProfile(answers);
    const date = todayISODate();
    await startResetPhase(date);
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
    setState((prev) => {
      if (prev.screen !== 'gamingControl') return prev;
      return {
        ...prev,
        gamingControl: { ...prev.gamingControl, state: outcome.resultingState },
        relapseEvents: [event, ...prev.relapseEvents],
      };
    });
  }

  if (state.screen === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#5b8cff" />
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
        phase={state.phase}
        slots={state.slots}
        library={state.library}
        onRestartOnboarding={handleRestartOnboarding}
        onCheckIn={handleCheckIn}
        onOpenGamingControl={handleOpenGamingControl}
      />
      <CravingButton onPress={handleLogCraving} />
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f1115' },
  flexFill: { flex: 1 },
});
