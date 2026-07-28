import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AssignmentLibraryEntry, DayPart, PhaseName, ScheduleSlot } from '../domain/types';

interface Props {
  date: string;
  phase: PhaseName;
  slots: ScheduleSlot[];
  library: AssignmentLibraryEntry[];
  onRestartOnboarding: () => void;
}

const WINDOW_ORDER: DayPart[] = ['morning', 'afternoon', 'evening', 'night'];
const WINDOW_LABEL: Record<DayPart, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
};

function groupByWindow(slots: ScheduleSlot[]): Record<DayPart, ScheduleSlot[]> {
  const groups: Record<DayPart, ScheduleSlot[]> = { morning: [], afternoon: [], evening: [], night: [] };
  for (const slot of slots) {
    groups[slot.timeWindow].push(slot);
  }
  return groups;
}

export default function TodayScreen({ date, phase, slots, library, onRestartOnboarding }: Props) {
  const groups = groupByWindow(slots);
  const libraryById = new Map(library.map((entry) => [entry.id, entry]));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.date}>{date}</Text>
        <Text style={styles.phase}>Phase: {phase}</Text>

        {WINDOW_ORDER.map((window) => {
          const windowSlots = groups[window];
          if (windowSlots.length === 0) return null;
          return (
            <View key={window} style={styles.windowBlock}>
              <Text style={styles.windowLabel}>{WINDOW_LABEL[window]}</Text>
              {windowSlots.map((slot) => {
                const activity = slot.assignedActivityId ? libraryById.get(slot.assignedActivityId) : undefined;
                return (
                  <View key={slot.id} style={styles.slotCard}>
                    <View style={styles.slotHeader}>
                      <Text style={styles.slotDomain}>{slot.domain}</Text>
                      <Text style={styles.slotDuration}>{slot.durationMinutes} min</Text>
                    </View>
                    <Text style={styles.slotActivity}>
                      {activity ? activity.description : 'No assignment available yet'}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        })}

        <Pressable style={styles.restartLink} onPress={onRestartOnboarding}>
          <Text style={styles.restartLinkText}>Restart onboarding</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1115' },
  content: { padding: 24, paddingTop: 48, paddingBottom: 48 },
  date: { color: '#8a8f98', fontSize: 14 },
  phase: { color: '#ffffff', fontSize: 24, fontWeight: '700', marginTop: 4, marginBottom: 24 },
  windowBlock: { marginBottom: 20 },
  windowLabel: { color: '#5b8cff', fontSize: 13, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  slotCard: {
    backgroundColor: '#1b1e25',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2e37',
  },
  slotHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  slotDomain: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  slotDuration: { color: '#8a8f98', fontSize: 14 },
  slotActivity: { color: '#c7cad1', fontSize: 14 },
  restartLink: { marginTop: 24, alignItems: 'center' },
  restartLinkText: { color: '#565b66', fontSize: 13, textDecorationLine: 'underline' },
});
