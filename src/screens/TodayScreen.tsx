import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AssignmentLibraryEntry, DayPart, PhaseName, ScheduleSlot, SlotStatus } from '../domain/types';
import SlotCard from './SlotCard';

interface Props {
  date: string;
  phase: PhaseName;
  slots: ScheduleSlot[];
  library: AssignmentLibraryEntry[];
  onRestartOnboarding: () => void;
  onCheckIn: (slotId: string, update: { status: SlotStatus; equivalentActivityId: string | null }) => void;
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

export default function TodayScreen({ date, phase, slots, library, onRestartOnboarding, onCheckIn }: Props) {
  const groups = groupByWindow(slots);

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
              {windowSlots.map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  library={library}
                  onCheckIn={(update) => onCheckIn(slot.id, update)}
                />
              ))}
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
  restartLink: { marginTop: 24, alignItems: 'center' },
  restartLinkText: { color: '#565b66', fontSize: 13, textDecorationLine: 'underline' },
});
