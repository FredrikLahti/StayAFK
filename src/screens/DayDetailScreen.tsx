import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useReadyAppData } from '../navigation/AppDataContext';
import { ScheduleSlot } from '../domain/types';
import { formatDateHeading } from '../domain/date';
import DayTimeline from './DayTimeline';
import SlotCard from './SlotCard';
import { colors, fontFamily, radius, spacing, typography } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'DayDetail'>;
type Route = RouteProp<RootStackParamList, 'DayDetail'>;

export default function DayDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { date } = route.params;
  const { todayDate, todaySlots, library, getSlotsForDate, checkIn } = useReadyAppData();

  const isToday = date === todayDate;
  const [otherDaySlots, setOtherDaySlots] = useState<ScheduleSlot[] | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  useEffect(() => {
    if (isToday) return;
    let cancelled = false;
    setOtherDaySlots(null);
    getSlotsForDate(date).then((slots) => {
      if (!cancelled) setOtherDaySlots(slots);
    });
    return () => {
      cancelled = true;
    };
  }, [date, isToday, getSlotsForDate]);

  const slots = isToday ? todaySlots : otherDaySlots;
  const selectedSlot = slots?.find((s) => s.id === selectedSlotId) ?? null;

  function closeSheet() {
    setSelectedSlotId(null);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>‹ Back</Text>
        </Pressable>

        <Text style={styles.title}>{formatDateHeading(date)}</Text>

        {slots === null ? (
          <ActivityIndicator color={colors.metalFlat} style={styles.loading} />
        ) : (
          <DayTimeline slots={slots} onSelectSlot={setSelectedSlotId} />
        )}
      </ScrollView>

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
                onCheckIn={(update) => checkIn(selectedSlot.id, date, update)}
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
  backLink: { color: colors.metalFlat, fontFamily: fontFamily.headerMedium, fontSize: 14, marginBottom: spacing.xl },
  title: { ...typography.screenTitle, marginBottom: spacing.xl },
  loading: { marginTop: spacing.xxl },
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
