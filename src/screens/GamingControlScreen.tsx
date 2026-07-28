import React, { useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CravingEvent, GamingControlStatus, RelapseEvent, RelapseSeverity } from '../domain/types';
import { GAMING_CONTROL_STATE_LABEL } from '../gamingcontrol/labels';
import { getRelapseOutcome, WHAT_HAPPENED_OPTIONS } from '../gamingcontrol/relapse';
import { summarizeCravingEvents } from '../gamingcontrol/cravingStats';
import { formatEventTimestamp } from '../domain/date';

interface Props {
  status: GamingControlStatus;
  cravingEvents: CravingEvent[];
  relapseEvents: RelapseEvent[];
  onBack: () => void;
  onRelapse: (severity: RelapseSeverity) => void;
}

type ModalState = { kind: 'none' } | { kind: 'whatHappened' } | { kind: 'outcome'; message: string };

const RELAPSE_OPTION_LABEL = Object.fromEntries(
  WHAT_HAPPENED_OPTIONS.map((o) => [o.severity, o.label])
) as Record<RelapseSeverity, string>;

export default function GamingControlScreen({ status, cravingEvents, relapseEvents, onBack, onRelapse }: Props) {
  const [modal, setModal] = useState<ModalState>({ kind: 'none' });
  const cravingSummary = summarizeCravingEvents(cravingEvents);

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
        <Text style={styles.stateValue}>{GAMING_CONTROL_STATE_LABEL[status.state]}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Cravings</Text>
          <Text style={styles.sectionSummary}>
            {cravingSummary.recentCount} in the last {cravingSummary.recentDays} days · {cravingSummary.total} total
          </Text>
          {cravingEvents.length === 0 ? (
            <Text style={styles.emptyText}>None logged yet.</Text>
          ) : (
            cravingEvents
              .slice(0, 20)
              .map((event) => (
                <Text key={event.id} style={styles.listItem}>
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
                {event.date} · {RELAPSE_OPTION_LABEL[event.severity]} → {GAMING_CONTROL_STATE_LABEL[event.resultingAction]}
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
  container: { flex: 1, backgroundColor: '#0f1115' },
  content: { padding: 24, paddingTop: 48, paddingBottom: 96 },
  backLink: { color: '#5b8cff', fontSize: 14, marginBottom: 20 },
  title: { color: '#ffffff', fontSize: 24, fontWeight: '700' },
  stateValue: { color: '#5b8cff', fontSize: 18, fontWeight: '700', marginTop: 4, marginBottom: 28 },
  section: { marginBottom: 28 },
  sectionLabel: { color: '#ffffff', fontSize: 15, fontWeight: '700', marginBottom: 6 },
  sectionSummary: { color: '#8a8f98', fontSize: 13, marginBottom: 10 },
  emptyText: { color: '#565b66', fontSize: 13 },
  listItem: { color: '#c7cad1', fontSize: 13, marginBottom: 4 },
  relapseButton: {
    marginTop: 12,
    backgroundColor: '#3a2323',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#5a3030',
  },
  relapseButtonText: { color: '#e07a7a', fontSize: 15, fontWeight: '700' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    backgroundColor: '#1b1e25',
    borderRadius: 14,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#2a2e37',
  },
  dialogTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  dialogOption: {
    backgroundColor: '#2a2e37',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  dialogOptionText: { color: '#e6e8eb', fontSize: 15, fontWeight: '600' },
  dialogCancel: { alignItems: 'center', paddingVertical: 8 },
  dialogCancelText: { color: '#565b66', fontSize: 14 },
});
