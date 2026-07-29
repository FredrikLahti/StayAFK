import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ActiveNudge } from '../navigation/AppDataContext';
import { colors, fontFamily, radius, spacing, typography } from '../theme';

interface Props {
  nudge: ActiveNudge | null;
  onAcknowledge: () => void;
}

// Lightweight in-app card, not a push notification (see
// gamingcontrol/cravingSpike.ts and fallbackNudge.ts for the two trigger
// paths that surface this) - dark steel surface with a thin accent line,
// same restraint as the rest of the app; the chrome/metal gradient stays
// reserved for primary actions and progress elements.
export default function MotivationalNudgeCard({ nudge, onAcknowledge }: Props) {
  if (!nudge) return null;

  return (
    <View style={styles.card} testID="motivational-nudge-card">
      <Text style={styles.message}>{nudge.message}</Text>
      <Pressable style={styles.dismiss} onPress={onAcknowledge} testID="motivational-nudge-dismiss">
        <Text style={styles.dismissText}>Noted</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 3,
    borderTopColor: colors.metalFlat,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  message: { ...typography.body, color: colors.textPrimary, fontSize: 14, lineHeight: 20, marginBottom: spacing.md },
  dismiss: { alignSelf: 'flex-end' },
  dismissText: { fontFamily: fontFamily.headerMedium, color: colors.metalFlat, fontSize: 13 },
});
