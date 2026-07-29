import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useReadyAppData } from '../navigation/AppDataContext';
import FoundationHeader from './FoundationHeader';
import WeeklyCalendarStrip from './WeeklyCalendarStrip';
import NextUpCard from './NextUpCard';
import DomainShortcuts from './DomainShortcuts';
import SlotCard from './SlotCard';
import SilenceModal from './SilenceModal';
import { getNextUpSlot } from './timelineTime';
import { getTrailingWeek } from '../domain/date';
import { computeDayCompletion, DayCompletion } from '../foundation/dayCompletion';
import { colors, fontFamily, radius, spacing, typography } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const {
    todayDate,
    todaySlots,
    library,
    foundationStatuses,
    silenceLevel,
    getSlotsForDate,
    checkIn,
    optOutOfNotifications,
  } = useReadyAppData();

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [pastCompletionByDate, setPastCompletionByDate] = useState<Record<string, DayCompletion | undefined>>({});

  const weekDates = useMemo(() => getTrailingWeek(todayDate), [todayDate]);
  const nextUp = getNextUpSlot(todaySlots);
  const selectedSlot = todaySlots.find((s) => s.id === selectedSlotId) ?? null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const otherDates = weekDates.filter((d) => d !== todayDate);
      const entries = await Promise.all(
        otherDates.map(async (date) => [date, computeDayCompletion(await getSlotsForDate(date))] as const)
      );
      if (cancelled) return;
      setPastCompletionByDate((prev) => {
        const next = { ...prev };
        for (const [date, completion] of entries) next[date] = completion;
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [weekDates, todayDate, getSlotsForDate]);

  const completionByDate = useMemo(
    () => ({ ...pastCompletionByDate, [todayDate]: computeDayCompletion(todaySlots) }),
    [pastCompletionByDate, todayDate, todaySlots]
  );

  function closeSheet() {
    setSelectedSlotId(null);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Home</Text>
          <View style={styles.headerLinks}>
            <Pressable onPress={() => navigation.navigate('GamingControl')}>
              <Text style={styles.gamingControlLink}>Gaming Control</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Settings')}>
              <Text style={styles.settingsLink}>Settings</Text>
            </Pressable>
          </View>
        </View>

        <FoundationHeader foundationStatuses={foundationStatuses} />

        <WeeklyCalendarStrip
          dates={weekDates}
          today={todayDate}
          completionByDate={completionByDate}
          onSelectDate={(date) => navigation.navigate('DayDetail', { date })}
        />

        {nextUp && <NextUpCard slot={nextUp} library={library} onPress={() => setSelectedSlotId(nextUp.id)} />}

        <DomainShortcuts
          foundationStatuses={foundationStatuses}
          onSelectDomain={(domain) => navigation.navigate('DomainDetail', { domain })}
        />

        <Pressable style={styles.restartLink} onPress={() => navigation.navigate('Onboarding')}>
          <Text style={styles.restartLinkText}>Restart onboarding</Text>
        </Pressable>
      </ScrollView>

      <SilenceModal
        level={silenceLevel}
        onSomethingsUp={() => navigation.navigate('GamingControl', { autoOpenWhatHappened: true })}
        onOptOutOfNotifications={optOutOfNotifications}
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
                onCheckIn={(update) => checkIn(selectedSlot.id, todayDate, update)}
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
  title: { ...typography.screenTitle },
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
