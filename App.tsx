import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import EntryScreen from './src/screens/EntryScreen';
import TodayScreen from './src/screens/TodayScreen';
import OnboardingScreen from './src/onboarding/OnboardingScreen';
import { AssignmentLibraryEntry, PhaseName, ScheduleSlot, SlotStatus, UserProfile } from './src/domain/types';
import {
  checkInScheduleSlot,
  getAssignmentLibrary,
  getPhase,
  getScheduleSlotsForDate,
  getUserProfile,
  initDatabase,
  saveUserProfile,
  startResetPhase,
} from './src/db';
import { todayISODate } from './src/domain/date';
import { generateAndPersistDay } from './src/dayGenerator';

type AppState =
  | { screen: 'loading' }
  | { screen: 'entry' }
  | { screen: 'onboarding' }
  | { screen: 'today'; date: string; phase: PhaseName; slots: ScheduleSlot[]; library: AssignmentLibraryEntry[] };

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

    let slots = await getScheduleSlotsForDate(date);
    if (slots.length === 0) {
      slots = await generateAndPersistDay(date, profile, phaseRecord.currentPhase);
    }

    const library = await getAssignmentLibrary();
    setState({ screen: 'today', date, phase: phaseRecord.currentPhase, slots, library });
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
      prev.screen === 'today'
        ? { ...prev, slots: prev.slots.map((s) => (s.id === slotId ? { ...s, ...update } : s)) }
        : prev
    );
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

  return (
    <>
      <TodayScreen
        date={state.date}
        phase={state.phase}
        slots={state.slots}
        library={state.library}
        onRestartOnboarding={handleRestartOnboarding}
        onCheckIn={handleCheckIn}
      />
      <StatusBar style="light" />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f1115' },
});
