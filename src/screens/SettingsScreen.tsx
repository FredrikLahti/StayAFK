import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NotificationIntensity, PurchaseStatus } from '../domain/types';
import { trialHoursRemaining } from '../purchase/trial';
import { colors, fontFamily, radius, spacing, typography } from '../theme';

interface Props {
  notificationIntensity: NotificationIntensity;
  purchaseStatus: PurchaseStatus;
  phaseStartDate: string;
  onBack: () => void;
  onChangeIntensity: (intensity: NotificationIntensity) => void;
}

const INTENSITY_OPTIONS: { value: NotificationIntensity; label: string; description: string }[] = [
  {
    value: 'minimal',
    label: 'Minimal',
    description: 'Just an end-of-day check-in nudge (only if something is still open) and a next-morning reminder.',
  },
  {
    value: 'detailed',
    label: 'Detailed',
    description: 'Minimal, plus a nudge whenever a part of the day (morning/afternoon/evening) wraps up with something open.',
  },
];

export default function SettingsScreen({
  notificationIntensity,
  purchaseStatus,
  phaseStartDate,
  onBack,
  onChangeIntensity,
}: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={onBack}>
          <Text style={styles.backLink}>‹ Back</Text>
        </Pressable>

        <Text style={styles.title}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notifications</Text>
          {INTENSITY_OPTIONS.map((option) => {
            const selected = option.value === notificationIntensity;
            return (
              <Pressable
                key={option.value}
                style={[styles.option, selected && styles.optionSelected]}
                onPress={() => onChangeIntensity(option.value)}
              >
                <Text style={styles.optionLabel}>
                  {selected ? '✓ ' : ''}
                  {option.label}
                </Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </Pressable>
            );
          })}
          <Text style={styles.footnote}>
            Reminders only ever fire between activities - never in the middle of one.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Access</Text>
          {purchaseStatus.isUnlocked ? (
            <Text style={styles.statusText}>
              Unlocked{purchaseStatus.purchaseDate ? ` · ${purchaseStatus.purchaseDate.slice(0, 10)}` : ''}
            </Text>
          ) : (
            <Text style={styles.statusText}>
              Free trial · <Text style={styles.mono}>{trialHoursRemaining(phaseStartDate)}</Text>h left
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Support</Text>
          <Text style={styles.supportText}>
            Sometimes gaming needs more support than an app can give. If it feels like more than you can
            handle alone, consider talking to a doctor, counselor, or a local support service - searching
            "gaming support" plus your location is a reasonable place to start.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xxl, paddingTop: spacing.xxl * 2, paddingBottom: spacing.xxl * 2 },
  backLink: { color: colors.metalFlat, fontFamily: fontFamily.headerMedium, fontSize: 14, marginBottom: spacing.xl },
  title: { ...typography.screenTitle, marginBottom: spacing.xxl },
  section: { marginBottom: spacing.xxl + spacing.xs },
  sectionLabel: { ...typography.sectionTitle, marginBottom: spacing.sm },
  option: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm + spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionSelected: { borderColor: colors.metalFlat, borderWidth: 1.5 },
  optionLabel: { fontFamily: fontFamily.headerMedium, color: colors.textPrimary, fontSize: 15, marginBottom: spacing.xs },
  optionDescription: { ...typography.body, color: colors.textSecondary, fontSize: 13 },
  footnote: { ...typography.bodyMuted, marginTop: spacing.xs, fontStyle: 'italic' },
  statusText: { ...typography.body, fontSize: 15 },
  mono: { fontFamily: fontFamily.mono },
  supportText: { ...typography.body, color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
});
