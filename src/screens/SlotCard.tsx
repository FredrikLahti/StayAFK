import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AssignmentLibraryEntry, ScheduleSlot, SlotStatus } from '../domain/types';
import { shouldTriggerHonestyCheck } from '../checkin/honestyCheck';
import { HONESTY_ACCEPTED_MESSAGE, HONESTY_REJECTED_MESSAGE } from '../checkin/messages';

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
        <Text style={styles.slotDuration}>{slot.durationMinutes} min</Text>
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
          <Text style={styles.statusText}>{STATUS_LABEL[slot.status]}</Text>
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
    backgroundColor: '#1b1e25',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2e37',
  },
  slotHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  slotDomain: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  slotDuration: { color: '#8a8f98', fontSize: 14 },
  slotActivity: { color: '#c7cad1', fontSize: 14, marginBottom: 10 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionButton: {
    backgroundColor: '#2a2e37',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionText: { color: '#e6e8eb', fontSize: 13, fontWeight: '600' },
  statusRow: { marginTop: 2 },
  statusText: { color: '#5b8cff', fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  equivalentText: { color: '#8a8f98', fontSize: 13, marginTop: 4 },
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
