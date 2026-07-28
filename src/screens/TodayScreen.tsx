import React, { useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AssignmentLibraryEntry, FoundationStatus, PhaseName, ScheduleSlot, SlotStatus } from '../domain/types';
import FoundationHeader from './FoundationHeader';
import NextUpCard from './NextUpCard';
import DayTimeline from './DayTimeline';
import SlotCard from './SlotCard';
import SilenceModal from './SilenceModal';
import { getNextUpSlot } from './timelineTime';
import { SilenceLevel } from '../gamingcontrol/silence';
import { colors, fontFamily, radius, spacing, typography } from '../theme';

interface Props {
  date: string;
  phase: PhaseName;
  slots: ScheduleSlot[];
  library: AssignmentLibraryEntry[];
  foundationStatuses: FoundationStatus[];
  silenceLevel: SilenceLevel;
  onRestartOnboarding: () => void;
  onCheckIn: (slotId: string, update: { status: SlotStatus; equivalentActivityId: string | null }) => void;
  onOpenGamingControl: () => void;
  onOpenSettings: () => void;
  onSomethingsUp: () => void;
  onOptOutOfNotifications: () => void;
}

export default function TodayScreen({
  date,
  phase,
  slots,
  library,
  foundationStatuses,
  silenceLevel,
  onRestartOnboarding,
  onCheckIn,
  onOpenGamingControl,
  onOpenSettings,
  onSomethingsUp,
  onOptOutOfNotifications,
}: Props) {
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const nextUp = getNextUpSlot(slots);
  // Looked up fresh from `slots` every render (rather than holding a
  // snapshot) so the sheet reflects the just-logged status immediately,
  // same as the old inline cards used to.
  const selectedSlot = slots.find((s) => s.id === selectedSlotId) ?? null;

  function closeSheet() {
    setSelectedSlotId(null);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.date}>{date}</Text>
          <View style={styles.headerLinks}>
            <Pressable onPress={onOpenGamingControl}>
              <Text style={styles.gamingControlLink}>Gaming Control</Text>
            </Pressable>
            <Pressable onPress={onOpenSettings}>
              <Text style={styles.settingsLink}>Settings</Text>
            </Pressable>
          </View>
        </View>

        <FoundationHeader phase={phase} foundationStatuses={foundationStatuses} />

        {nextUp && <NextUpCard slot={nextUp} library={library} onPress={() => setSelectedSlotId(nextUp.id)} />}

        <DayTimeline slots={slots} onSelectSlot={setSelectedSlotId} />

        <Pressable style={styles.restartLink} onPress={onRestartOnboarding}>
          <Text style={styles.restartLinkText}>Restart onboarding</Text>
        </Pressable>
      </ScrollView>

      <SilenceModal
        level={silenceLevel}
        onSomethingsUp={onSomethingsUp}
        onOptOutOfNotifications={onOptOutOfNotifications}
      />

      <Modal visible={selectedSlot !== null} transparent animationType="slide" onRequestClose={closeSheet}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={closeSheet} />
          <View style={styles.sheet}>
            <Pressable style={styles.sheetCloseRow} onPress={closeSheet} testID="checkin-sheet-close">
              <Text style={styles.sheetCloseText}>Close</Text>
            </Pressable>
            {selectedSlot && (
              <SlotCard
                slot={selectedSlot}
                library={library}
                onCheckIn={(update) => onCheckIn(selectedSlot.id, update)}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xxl, paddingTop: spacing.xxl * 2, paddingBottom: spacing.xxl * 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl },
  date: { ...typography.monoMuted },
  headerLinks: { alignItems: 'flex-end', gap: spacing.sm },
  gamingControlLink: { color: colors.metalFlat, fontFamily: fontFamily.headerMedium, fontSize: 13 },
  settingsLink: { color: colors.textSecondary, fontFamily: fontFamily.headerMedium, fontSize: 13 },
  restartLink: { marginTop: spacing.sm, alignItems: 'center' },
  restartLinkText: { color: colors.textSecondary, fontSize: 13, textDecorationLine: 'underline', opacity: 0.75 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  sheetCloseRow: { alignItems: 'flex-end', marginBottom: spacing.sm },
  sheetCloseText: { color: colors.textSecondary, fontSize: 13, textDecorationLine: 'underline', opacity: 0.75 },
});
