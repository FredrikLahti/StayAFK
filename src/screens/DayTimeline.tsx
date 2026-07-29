import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScheduleSlot } from '../domain/types';
import { buildDayRows } from './dayWindows';
import { WINDOW_LABEL } from './timelineTime';
import { colors, fontFamily, radius, spacing, typography, DOMAIN_COLOR, SLOT_STATUS_COLOR } from '../theme';

interface Props {
  slots: ScheduleSlot[];
  onSelectSlot: (slotId: string) => void;
}

// Day Detail's view of a day's slots, per the "Day structure: time-boxed
// vs. checklist domains" split:
// - Sleep keeps its own protected-time card.
// - Move/Build render as real timeline sections (only for windows that
//   actually have free time - see dayWindows.ts - with a quiet note for any
//   gap that falls between two occupied windows).
// - Whatever free time is left over renders as one open flexible-time card.
// - Fuel/Connect/Maintain render as a plain checklist - no duration shown,
//   still using the same Done/Equivalent/Missed/Not possible check-in flow.
// Every card shares the same dark steel surface; the domain accent is a
// thin left border, not a filled saturated block, and the metal gradient
// stays reserved for primary actions/progress elsewhere.
export default function DayTimeline({ slots, onSelectSlot }: Props) {
  const sleepSlot = slots.find((s) => s.domain === 'Sleep');
  const flexibleSlot = slots.find((s) => s.kind === 'flexible');
  const checklistSlots = slots.filter((s) => s.kind === 'checklist');
  const rows = buildDayRows(slots);

  const isEmpty = !sleepSlot && !flexibleSlot && rows.length === 0 && checklistSlots.length === 0;

  return (
    <View style={styles.container}>
      {sleepSlot && (
        <Pressable style={styles.sleepCard} onPress={() => onSelectSlot(sleepSlot.id)} testID={`slot-${sleepSlot.id}`}>
          <Text style={styles.sleepLabel}>Sleep · protected time</Text>
          <Text style={styles.sleepSublabel}>{sleepSlot.durationMinutes} min</Text>
        </Pressable>
      )}

      {isEmpty && <Text style={styles.emptyText}>No free time scheduled today.</Text>}

      {rows.map((row) => {
        if (row.kind === 'gap') {
          return (
            <View key={row.window} style={styles.gapRow}>
              <Text style={styles.gapText}>{WINDOW_LABEL[row.window]}: no free time</Text>
            </View>
          );
        }

        return (
          <View key={row.window} style={styles.section}>
            <Text style={styles.sectionLabel}>{WINDOW_LABEL[row.window]}</Text>
            {row.slots.map((slot) => {
              const isPending = slot.status === 'pending';
              const domainColor = DOMAIN_COLOR[slot.domain];
              return (
                <Pressable
                  key={slot.id}
                  style={({ pressed }) => [styles.chip, { borderLeftColor: domainColor }, pressed && styles.chipPressed]}
                  onPress={() => onSelectSlot(slot.id)}
                  testID={`slot-${slot.id}`}
                >
                  <View style={styles.chipHeader}>
                    <Text style={[styles.chipDomain, { color: domainColor }]}>{slot.domain}</Text>
                    <Text style={styles.chipDuration}>{slot.durationMinutes} min</Text>
                  </View>
                  {!isPending && (
                    <View style={styles.chipStatusRow}>
                      <View style={[styles.statusDot, { backgroundColor: SLOT_STATUS_COLOR[slot.status] }]} />
                      <Text style={[styles.chipStatusText, { color: SLOT_STATUS_COLOR[slot.status] }]}>
                        {slot.status.replace('_', ' ')}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        );
      })}

      {flexibleSlot && (
        <Pressable
          style={styles.flexibleCard}
          onPress={() => onSelectSlot(flexibleSlot.id)}
          testID={`slot-${flexibleSlot.id}`}
        >
          <Text style={styles.flexibleLabel}>Flexible time</Text>
          <Text style={styles.flexibleSublabel}>{flexibleSlot.durationMinutes} min open</Text>
        </Pressable>
      )}

      {checklistSlots.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Checklist</Text>
          {checklistSlots.map((slot) => {
            const isPending = slot.status === 'pending';
            const domainColor = DOMAIN_COLOR[slot.domain];
            return (
              <Pressable
                key={slot.id}
                style={({ pressed }) => [
                  styles.checklistRow,
                  { borderLeftColor: domainColor },
                  pressed && styles.chipPressed,
                ]}
                onPress={() => onSelectSlot(slot.id)}
                testID={`slot-${slot.id}`}
              >
                <Text style={[styles.chipDomain, { color: domainColor }]}>{slot.domain}</Text>
                {isPending ? (
                  <Text style={styles.checklistPendingText}>Not yet</Text>
                ) : (
                  <View style={styles.chipStatusRow}>
                    <View style={[styles.statusDot, { backgroundColor: SLOT_STATUS_COLOR[slot.status] }]} />
                    <Text style={[styles.chipStatusText, { color: SLOT_STATUS_COLOR[slot.status] }]}>
                      {slot.status.replace('_', ' ')}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.xl },
  emptyText: { ...typography.bodyMuted },
  sleepCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  sleepLabel: { fontFamily: fontFamily.headerMedium, color: colors.metalFlat, fontSize: 13 },
  sleepSublabel: { ...typography.monoMuted, marginTop: 2 },
  flexibleCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  flexibleLabel: { fontFamily: fontFamily.headerMedium, color: colors.textPrimary, fontSize: 13 },
  flexibleSublabel: { ...typography.monoMuted, marginTop: 2 },
  gapRow: { paddingVertical: spacing.sm, alignItems: 'center' },
  gapText: { ...typography.bodyMuted, fontSize: 12, fontStyle: 'italic', opacity: 0.7 },
  section: { marginBottom: spacing.lg },
  sectionLabel: {
    color: colors.metalFlat,
    fontFamily: fontFamily.headerMedium,
    fontSize: 13,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  chipPressed: { opacity: 0.75 },
  chipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chipDomain: { fontFamily: fontFamily.headerMedium, fontSize: 14 },
  chipDuration: { ...typography.monoMuted },
  chipStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: spacing.xs },
  chipStatusText: { fontFamily: fontFamily.headerMedium, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  checklistRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checklistPendingText: { ...typography.bodyMuted, fontSize: 12, opacity: 0.7 },
});
