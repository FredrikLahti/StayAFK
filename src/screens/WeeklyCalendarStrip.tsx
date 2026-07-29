import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { dayOfMonth, weekdayLabel } from '../domain/date';
import { DayCompletion } from '../foundation/dayCompletion';
import { colors, fontFamily, spacing, typography, ProgressRing } from '../theme';

interface Props {
  dates: string[]; // 7 dates, oldest first
  today: string;
  completionByDate: Record<string, DayCompletion | undefined>;
  onSelectDate: (date: string) => void;
}

const RING_SIZE = 28;
const RING_STROKE = 3;

const STATUS_COLOR: Record<DayCompletion['status'], string> = {
  none: colors.border,
  incomplete: colors.status.missed,
  partial: colors.status.equivalent,
  complete: colors.status.done,
};

export default function WeeklyCalendarStrip({ dates, today, completionByDate, onSelectDate }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>This week</Text>
      <View style={styles.row}>
        {dates.map((date) => {
          const isToday = date === today;
          const completion = completionByDate[date];
          const status = completion?.status ?? 'none';
          const fraction = completion?.fraction ?? 0;
          return (
            <Pressable
              key={date}
              style={({ pressed }) => [styles.dayCell, pressed && styles.dayCellPressed]}
              onPress={() => onSelectDate(date)}
              testID={`calendar-day-${date}`}
            >
              <Text style={[styles.weekdayLabel, isToday && styles.todayText]}>{weekdayLabel(date)}</Text>
              <ProgressRing size={RING_SIZE} strokeWidth={RING_STROKE} progress={status === 'none' ? 0 : fraction} color={STATUS_COLOR[status]}>
                <Text style={[styles.dayNumber, isToday && styles.todayText]}>{dayOfMonth(date)}</Text>
              </ProgressRing>
              {isToday && <View style={styles.todayDot} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.xl },
  sectionLabel: { ...typography.sectionTitle, marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCell: { alignItems: 'center', width: `${100 / 7}%` },
  dayCellPressed: { opacity: 0.75 },
  weekdayLabel: { ...typography.monoMuted, fontSize: 10, marginBottom: spacing.xs },
  dayNumber: { fontFamily: fontFamily.mono, color: colors.textSecondary, fontSize: 11 },
  todayText: { color: colors.metalFlat, fontFamily: fontFamily.headerBold },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.metalFlat, marginTop: spacing.xs },
});
