import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AssignmentLibraryEntry, ScheduleSlot } from '../domain/types';
import { describeTimeRemaining } from './timelineTime';
import { colors, fontFamily, radius, spacing, typography, DOMAIN_COLOR, MetalGradient } from '../theme';

interface Props {
  slot: ScheduleSlot;
  library: AssignmentLibraryEntry[];
  onPress: () => void;
}

// Refreshes the "time remaining" text on a slow interval rather than once at
// mount - cheap, and keeps the card honest if it's left open for a while.
const REFRESH_INTERVAL_MS = 60_000;

export default function NextUpCard({ slot, library, onPress }: Props) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const assigned = slot.assignedActivityId
    ? library.find((entry) => entry.id === slot.assignedActivityId)
    : undefined;
  // getNextUpSlot only ever returns a time-boxed slot, which always has a
  // window - the null case in ScheduleSlot's type is for checklist/flexible
  // slots, which never reach this component.
  const remaining = slot.timeWindow ? describeTimeRemaining(slot.timeWindow, now) : null;
  const domainColor = DOMAIN_COLOR[slot.domain];

  return (
    <Pressable
      style={({ pressed }) => [pressed && styles.pressed]}
      onPress={onPress}
      testID="next-up-card"
    >
      <MetalGradient style={styles.card} glow>
        <View style={styles.innerCard}>
          <View style={styles.headerRow}>
            <Text style={styles.eyebrow}>Next up</Text>
            <View style={[styles.domainDot, { backgroundColor: domainColor }]} />
            <Text style={[styles.domainLabel, { color: domainColor }]}>{slot.domain}</Text>
          </View>
          <Text style={styles.description}>
            {assigned ? assigned.description : 'No assignment available yet'}
          </Text>
          <View style={styles.footerRow}>
            <Text style={styles.duration}>{slot.durationMinutes} min</Text>
            {remaining && <Text style={styles.remaining}>{remaining.label}</Text>}
          </View>
        </View>
      </MetalGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.9 },
  card: { borderRadius: radius.lg, padding: 2, marginBottom: spacing.xl },
  innerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg - 2,
    padding: spacing.lg,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  eyebrow: {
    ...typography.monoMuted,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginRight: spacing.sm,
  },
  domainDot: { width: 7, height: 7, borderRadius: 4, marginRight: spacing.xs },
  domainLabel: { fontFamily: fontFamily.headerMedium, fontSize: 13 },
  description: { fontFamily: fontFamily.headerBold, color: colors.textPrimary, fontSize: 18, marginBottom: spacing.md },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  duration: { ...typography.monoMuted },
  remaining: { ...typography.mono, color: colors.metalFlat },
});
