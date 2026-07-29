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

// Day Detail's view of a day's slots: only the windows that actually have
// scheduled/free time get a section (no empty timeline space for hours at
// work or otherwise unavailable - see dayWindows.ts), with a quiet note for
// any gap that falls between two occupied windows. Every domain chip shares
// the same dark steel card surface; the domain accent is a thin left
// border, not a filled saturated block, and the metal gradient stays
// reserved for primary actions/progress elsewhere.
export default function DayTimeline({ slots, onSelectSlot }: Props) {
  const sleepSlot = slots.find((s) => s.domain === 'Sleep');
  const rows = buildDayRows(slots);

  return (
    <View style={styles.container}>
      {sleepSlot && (
        <Pressable
          style={styles.sleepCard}
          onPress={() => onSelectSlot(sleepSlot.id)}
          testID={`slot-${sleepSlot.id}`}
        >
          <Text style={styles.sleepLabel}>Sleep · protected time</Text>
          <Text style={styles.sleepSublabel}>{sleepSlot.durationMinutes} min</Text>
        </Pressable>
      )}

      {rows.length === 0 && !sleepSlot && (
        <Text style={styles.emptyText}>No free time scheduled today.</Text>
      )}

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
});
