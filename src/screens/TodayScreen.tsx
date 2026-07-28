import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AssignmentLibraryEntry, DayPart, PhaseName, ScheduleSlot, SlotStatus } from '../domain/types';
import SlotCard from './SlotCard';
import { colors, fontFamily, radius, spacing, typography, MetalGradient } from '../theme';

interface Props {
  date: string;
  phase: PhaseName;
  slots: ScheduleSlot[];
  library: AssignmentLibraryEntry[];
  onRestartOnboarding: () => void;
  onCheckIn: (slotId: string, update: { status: SlotStatus; equivalentActivityId: string | null }) => void;
  onOpenGamingControl: () => void;
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

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export default function TodayScreen({
  date,
  phase,
  slots,
  library,
  onRestartOnboarding,
  onCheckIn,
  onOpenGamingControl,
}: Props) {
  const groups = groupByWindow(slots);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.date}>{date}</Text>
            <MetalGradient style={styles.phaseBadge}>
              <Text style={styles.phaseBadgeText}>{capitalize(phase)}</Text>
            </MetalGradient>
          </View>
          <Pressable onPress={onOpenGamingControl}>
            <Text style={styles.gamingControlLink}>Gaming Control</Text>
          </Pressable>
        </View>

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
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xxl, paddingTop: spacing.xxl * 2, paddingBottom: spacing.xxl * 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xxl },
  date: { ...typography.monoMuted },
  phaseBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  phaseBadgeText: { fontFamily: fontFamily.headerBold, color: colors.background, fontSize: 15 },
  gamingControlLink: { color: colors.metalFlat, fontFamily: fontFamily.headerMedium, fontSize: 13, marginTop: spacing.xs },
  windowBlock: { marginBottom: spacing.xl },
  windowLabel: {
    color: colors.metalFlat,
    fontFamily: fontFamily.headerMedium,
    fontSize: 13,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  restartLink: { marginTop: spacing.xxl, alignItems: 'center' },
  restartLinkText: { color: colors.textSecondary, fontSize: 13, textDecorationLine: 'underline', opacity: 0.75 },
});
