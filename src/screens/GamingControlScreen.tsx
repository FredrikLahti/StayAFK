import React, { useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CravingEvent, GamingControlStatus, GamingControlState, RelapseEvent, RelapseSeverity } from '../domain/types';
import { GAMING_CONTROL_STATE_LABEL } from '../gamingcontrol/labels';
import { getRelapseOutcome, WHAT_HAPPENED_OPTIONS } from '../gamingcontrol/relapse';
import { summarizeCravingEvents } from '../gamingcontrol/cravingStats';
import { formatEventTimestamp } from '../domain/date';
import { colors, fontFamily, radius, spacing, typography } from '../theme';

interface Props {
  status: GamingControlStatus;
  cravingEvents: CravingEvent[];
  relapseEvents: RelapseEvent[];
  onBack: () => void;
  onRelapse: (severity: RelapseSeverity) => void;
  // Opens straight into "What happened?" - used when arriving here via the
  // silence check-in prompt's "Something's up" path.
  autoOpenWhatHappened?: boolean;
}

type ModalState = { kind: 'none' } | { kind: 'whatHappened' } | { kind: 'outcome'; message: string };

const RELAPSE_OPTION_LABEL = Object.fromEntries(
  WHAT_HAPPENED_OPTIONS.map((o) => [o.severity, o.label])
) as Record<RelapseSeverity, string>;

// Every state a relapse can resolve into is by definition "serious" - this
// is the only place the reserved relapse color is allowed to show up
// outside the relapse trigger/flow itself.
const RELAPSE_CAUSED_STATES: GamingControlState[] = [
  'under_pressure',
  'lapse_interrupted',
  'pattern_returning',
  'recovery_active',
];

export default function GamingControlScreen({
  status,
  cravingEvents,
  relapseEvents,
  onBack,
  onRelapse,
  autoOpenWhatHappened,
}: Props) {
  const [modal, setModal] = useState<ModalState>(autoOpenWhatHappened ? { kind: 'whatHappened' } : { kind: 'none' });
  const cravingSummary = summarizeCravingEvents(cravingEvents);
  const stateIsSerious = RELAPSE_CAUSED_STATES.includes(status.state);

  function handleOptionTap(severity: RelapseSeverity) {
    const outcome = getRelapseOutcome(severity);
    onRelapse(severity);
    setModal({ kind: 'outcome', message: outcome.message });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={onBack}>
          <Text style={styles.backLink}>‹ Back to Today</Text>
        </Pressable>

        <Text style={styles.title}>Gaming Control</Text>
        <Text style={[styles.stateValue, stateIsSerious && styles.stateValueSerious]}>
          {GAMING_CONTROL_STATE_LABEL[status.state]}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Cravings</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <Text style={styles.statNumber}>{cravingSummary.recentCount}</Text>
              <Text style={styles.statLabel}>last {cravingSummary.recentDays} days</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statNumber}>{cravingSummary.total}</Text>
              <Text style={styles.statLabel}>total</Text>
            </View>
          </View>
          {cravingEvents.length === 0 ? (
            <Text style={styles.emptyText}>None logged yet.</Text>
          ) : (
            cravingEvents
              .slice(0, 20)
              .map((event) => (
                <Text key={event.id} style={styles.listItemMono}>
                  {formatEventTimestamp(event.timestamp)}
                </Text>
              ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Relapse history</Text>
          {relapseEvents.length === 0 ? (
            <Text style={styles.emptyText}>None logged yet.</Text>
          ) : (
            relapseEvents.map((event) => (
              <Text key={event.id} style={styles.listItem}>
                <Text style={styles.listItemMonoInline}>{event.date}</Text>
                {'  ·  '}
                {RELAPSE_OPTION_LABEL[event.severity]}
                {'  →  '}
                <Text style={styles.relapseInline}>{GAMING_CONTROL_STATE_LABEL[event.resultingAction]}</Text>
              </Text>
            ))
          )}
        </View>

        <Pressable style={styles.relapseButton} onPress={() => setModal({ kind: 'whatHappened' })}>
          <Text style={styles.relapseButtonText}>I started gaming again</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={modal.kind !== 'none'} transparent animationType="fade" onRequestClose={() => setModal({ kind: 'none' })}>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            {modal.kind === 'whatHappened' && (
              <>
                <Text style={styles.dialogTitle}>What happened?</Text>
                {WHAT_HAPPENED_OPTIONS.map((option) => (
                  <Pressable
                    key={option.severity}
                    style={styles.dialogOption}
                    onPress={() => handleOptionTap(option.severity)}
                  >
                    <Text style={styles.dialogOptionText}>{option.label}</Text>
                  </Pressable>
                ))}
                <Pressable style={styles.dialogCancel} onPress={() => setModal({ kind: 'none' })}>
                  <Text style={styles.dialogCancelText}>Cancel</Text>
                </Pressable>
              </>
            )}

            {modal.kind === 'outcome' && (
              <>
                <Text style={styles.dialogTitle}>{modal.message}</Text>
                <Pressable style={styles.dialogOption} onPress={() => setModal({ kind: 'none' })}>
                  <Text style={styles.dialogOptionText}>OK</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xxl, paddingTop: spacing.xxl * 2, paddingBottom: spacing.xxl * 4 },
  backLink: { color: colors.metalFlat, fontFamily: fontFamily.headerMedium, fontSize: 14, marginBottom: spacing.xl },
  title: { ...typography.screenTitle },
  stateValue: { fontFamily: fontFamily.headerBold, color: colors.metalFlat, fontSize: 18, marginTop: spacing.xs, marginBottom: spacing.xxl + spacing.xs },
  stateValueSerious: { color: colors.relapse },
  section: { marginBottom: spacing.xxl + spacing.xs },
  sectionLabel: { ...typography.sectionTitle, marginBottom: spacing.sm - 2 },
  statsRow: { flexDirection: 'row', gap: spacing.xxl, marginBottom: spacing.md },
  statBlock: {},
  statNumber: { ...typography.monoLarge },
  statLabel: { ...typography.bodyMuted, marginTop: 2 },
  emptyText: { color: colors.textSecondary, fontSize: 13, opacity: 0.75 },
  listItem: { ...typography.body, color: colors.textSecondary, fontSize: 13, marginBottom: spacing.xs },
  listItemMono: { ...typography.monoMuted, marginBottom: spacing.xs },
  listItemMonoInline: { fontFamily: fontFamily.mono, color: colors.textSecondary },
  relapseInline: { color: colors.relapse, fontFamily: fontFamily.headerMedium },
  relapseButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.relapse,
  },
  relapseButtonText: { color: colors.relapse, fontFamily: fontFamily.headerMedium, fontSize: 15 },
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
    borderColor: colors.relapse,
  },
  dialogTitle: { fontFamily: fontFamily.headerBold, color: colors.textPrimary, fontSize: 18, marginBottom: spacing.lg },
  dialogOption: {
    backgroundColor: colors.background,
    borderRadius: radius.md - 2,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm + spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dialogOptionText: { fontFamily: fontFamily.headerMedium, color: colors.textPrimary, fontSize: 15 },
  dialogCancel: { alignItems: 'center', paddingVertical: spacing.sm },
  dialogCancelText: { color: colors.textSecondary, fontSize: 14, opacity: 0.75 },
});
