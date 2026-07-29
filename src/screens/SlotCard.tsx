import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AssignmentLibraryEntry, ScheduleSlot, SlotStatus } from '../domain/types';
import { shouldTriggerHonestyCheck } from '../checkin/honestyCheck';
import { HONESTY_ACCEPTED_MESSAGE, HONESTY_REJECTED_MESSAGE } from '../checkin/messages';
import { colors, fontFamily, radius, spacing, typography, SLOT_STATUS_COLOR } from '../theme';

interface Props {
  slot: ScheduleSlot;
  library: AssignmentLibraryEntry[];
  onCheckIn: (update: { status: SlotStatus; equivalentActivityId: string | null }) => void;
}

type ModalState =
  | { kind: 'none' }
  | { kind: 'pickEquivalent' }
  | { kind: 'honestyCheck'; picked: AssignmentLibraryEntry }
  | { kind: 'message'; text: string };

const STATUS_LABEL: Record<SlotStatus, string> = {
  pending: 'Pending',
  done: 'Done',
  equivalent: 'Equivalent',
  missed: 'Missed',
  not_possible: 'Not possible',
};

export default function SlotCard({ slot, library, onCheckIn }: Props) {
  const [modal, setModal] = useState<ModalState>({ kind: 'none' });

  const libraryById = new Map(library.map((entry) => [entry.id, entry]));
  const assigned = slot.assignedActivityId ? libraryById.get(slot.assignedActivityId) : undefined;
  const equivalent = slot.equivalentActivityId ? libraryById.get(slot.equivalentActivityId) : undefined;

  const domainAlternatives = library.filter(
    (entry) => entry.domain === slot.domain && entry.id !== slot.assignedActivityId
  );

  function closeModal() {
    setModal({ kind: 'none' });
  }

  function handleEquivalentTap() {
    if (domainAlternatives.length === 0) {
      // Nothing else modeled for this domain yet to compare tiers against -
      // log it silently rather than blocking the check-in on missing content.
      onCheckIn({ status: 'equivalent', equivalentActivityId: null });
      return;
    }
    setModal({ kind: 'pickEquivalent' });
  }

  function handlePickAlternative(picked: AssignmentLibraryEntry) {
    if (assigned && shouldTriggerHonestyCheck(assigned.intensityTier, picked.intensityTier)) {
      setModal({ kind: 'honestyCheck', picked });
      return;
    }
    onCheckIn({ status: 'equivalent', equivalentActivityId: picked.id });
    closeModal();
  }

  function handleHonestlyYes(picked: AssignmentLibraryEntry) {
    onCheckIn({ status: 'equivalent', equivalentActivityId: picked.id });
    setModal({ kind: 'message', text: HONESTY_ACCEPTED_MESSAGE });
  }

  function handleNotReally() {
    onCheckIn({ status: 'missed', equivalentActivityId: null });
    setModal({ kind: 'message', text: HONESTY_REJECTED_MESSAGE });
  }

  return (
    <View style={styles.slotCard} testID={`slot-${slot.id}`}>
      <View style={styles.slotHeader}>
        <Text style={styles.slotDomain}>{slot.domain}</Text>
        {slot.durationMinutes !== null && <Text style={styles.slotDuration}>{slot.durationMinutes} min</Text>}
      </View>
      <Text style={styles.slotActivity}>{assigned ? assigned.description : 'No assignment available yet'}</Text>

      {slot.status === 'pending' ? (
        <View style={styles.actionsRow}>
          <Pressable style={styles.actionButton} onPress={() => onCheckIn({ status: 'done', equivalentActivityId: null })}>
            <Text style={styles.actionText}>Done</Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={handleEquivalentTap}>
            <Text style={styles.actionText}>Equivalent</Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={() => onCheckIn({ status: 'missed', equivalentActivityId: null })}>
            <Text style={styles.actionText}>Missed</Text>
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={() => onCheckIn({ status: 'not_possible', equivalentActivityId: null })}
          >
            <Text style={styles.actionText}>Not possible</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.statusRow}>
          <Text style={[styles.statusText, { color: SLOT_STATUS_COLOR[slot.status] }]}>
            {STATUS_LABEL[slot.status]}
          </Text>
          {equivalent && <Text style={styles.equivalentText}>Logged instead: {equivalent.description}</Text>}
        </View>
      )}

      {/* A single Modal instance whose content switches on state, rather than
          several Modals toggling `visible` - keeping only one mounted avoids
          them stacking on top of each other as the flow progresses. */}
      <Modal visible={modal.kind !== 'none'} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            {modal.kind === 'pickEquivalent' && (
              <>
                <Text style={styles.dialogTitle}>What did you do instead?</Text>
                {domainAlternatives.map((entry) => (
                  <Pressable key={entry.id} style={styles.dialogOption} onPress={() => handlePickAlternative(entry)}>
                    <Text style={styles.dialogOptionText}>{entry.description}</Text>
                  </Pressable>
                ))}
                <Pressable style={styles.dialogCancel} onPress={closeModal}>
                  <Text style={styles.dialogCancelText}>Cancel</Text>
                </Pressable>
              </>
            )}

            {modal.kind === 'honestyCheck' && (
              <>
                <Text style={styles.dialogTitle}>Is it, though?</Text>
                <Pressable style={styles.dialogOption} onPress={() => handleHonestlyYes(modal.picked)}>
                  <Text style={styles.dialogOptionText}>Honestly, yes</Text>
                </Pressable>
                <Pressable style={styles.dialogOption} onPress={handleNotReally}>
                  <Text style={styles.dialogOptionText}>No, not really</Text>
                </Pressable>
              </>
            )}

            {modal.kind === 'message' && (
              <>
                <Text style={styles.dialogTitle}>{modal.text}</Text>
                <Pressable style={styles.dialogOption} onPress={closeModal}>
                  <Text style={styles.dialogOptionText}>OK</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  slotCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md + spacing.xs,
    marginBottom: spacing.sm + spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs + 2 },
  slotDomain: { fontFamily: fontFamily.headerMedium, color: colors.textPrimary, fontSize: 16 },
  slotDuration: { ...typography.monoMuted },
  slotActivity: { ...typography.body, color: colors.textSecondary, fontSize: 14, marginBottom: spacing.sm + spacing.xs },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actionButton: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: { fontFamily: fontFamily.headerMedium, color: colors.textPrimary, fontSize: 13 },
  statusRow: { marginTop: 2 },
  statusText: { fontFamily: fontFamily.headerMedium, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
  equivalentText: { ...typography.bodyMuted, marginTop: spacing.xs },
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
