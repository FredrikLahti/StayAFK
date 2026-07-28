import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SilenceLevel } from '../gamingcontrol/silence';
import { colors, fontFamily, radius, spacing } from '../theme';

interface Props {
  level: SilenceLevel;
  onSomethingsUp: () => void;
  onOptOutOfNotifications: () => void;
}

// The exact copy from ARCHITECTURE.md's Stage 3 section, used verbatim.
const LIFE_CHECK_MESSAGE =
  "You've gone quiet for a while. Could mean life's good and you don't need this anymore — genuinely " +
  'great if so. Could mean the opposite. Only you know which.';

// A single Modal whose content switches on level, rather than separate
// Modals toggling visible - keeps only one mounted at a time (see
// SlotCard.tsx for why that matters).
export default function SilenceModal({ level, onSomethingsUp, onOptOutOfNotifications }: Props) {
  const [dismissed, setDismissed] = useState(false);

  // Re-show if the level escalates (e.g. checkInPrompt -> lifeCheckMessage)
  // even if the earlier, lower-level prompt was already dismissed.
  useEffect(() => {
    setDismissed(false);
  }, [level]);

  if (level === 'none' || dismissed) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => setDismissed(true)}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {level === 'checkInPrompt' && (
            <>
              <Text style={styles.title}>How's it going?</Text>
              <Text style={styles.body}>
                Haven't seen a check-in in a couple of days. No pressure - just checking in.
              </Text>
              <Pressable style={styles.option} onPress={onSomethingsUp}>
                <Text style={styles.optionText}>Something's up</Text>
              </Pressable>
              <Pressable style={styles.dismiss} onPress={() => setDismissed(true)}>
                <Text style={styles.dismissText}>All good, just busy</Text>
              </Pressable>
            </>
          )}

          {level === 'lifeCheckMessage' && (
            <>
              <Text style={styles.title}>{LIFE_CHECK_MESSAGE}</Text>
              <Pressable style={styles.option} onPress={() => setDismissed(true)}>
                <Text style={styles.optionText}>Still using it</Text>
              </Pressable>
              <Pressable style={styles.option} onPress={onOptOutOfNotifications}>
                <Text style={styles.optionText}>I'm good, don't need this</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontFamily: fontFamily.headerBold, color: colors.textPrimary, fontSize: 18, marginBottom: spacing.md, lineHeight: 24 },
  body: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: spacing.lg },
  option: {
    backgroundColor: colors.background,
    borderRadius: radius.md - 2,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm + spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionText: { fontFamily: fontFamily.headerMedium, color: colors.textPrimary, fontSize: 15 },
  dismiss: { alignItems: 'center', paddingVertical: spacing.sm },
  dismissText: { color: colors.textSecondary, fontSize: 14, opacity: 0.75 },
});
