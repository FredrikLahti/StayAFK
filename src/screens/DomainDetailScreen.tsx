import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useReadyAppData } from '../navigation/AppDataContext';
import { CHECKLIST_DOMAINS, ScheduleSlot } from '../domain/types';
import { getTrailingWeek } from '../domain/date';
import { DOMAIN_LEARN_MORE } from '../domain/learnMore';
import { domainProgress } from '../foundation/progress';
import { computeWeeklyFloorProgress } from '../foundation/weeklyFloorProgress';
import { STAGE_LABEL } from '../foundation/stageInfo';
import { colors, fontFamily, radius, spacing, typography, DOMAIN_COLOR, ProgressRing } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'DomainDetail'>;
type Route = RouteProp<RootStackParamList, 'DomainDetail'>;

function formatHours(minutes: number): string {
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
}

export default function DomainDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { domain } = route.params;
  const { todayDate, todaySlots, foundationStatuses, domainFloors, getSlotsForDate } = useReadyAppData();

  const [weekSlots, setWeekSlots] = useState<ScheduleSlot[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const dates = getTrailingWeek(todayDate);
      const results = await Promise.all(
        dates.map((date) => (date === todayDate ? Promise.resolve(todaySlots) : getSlotsForDate(date)))
      );
      if (!cancelled) setWeekSlots(results.flat());
    })();
    return () => {
      cancelled = true;
    };
  }, [todayDate, todaySlots, getSlotsForDate]);

  const status = foundationStatuses.find((s) => s.domain === domain);
  const floor = domainFloors.find((f) => f.domain === domain);
  const accent = DOMAIN_COLOR[domain];
  const isChecklistDomain = CHECKLIST_DOMAINS.includes(domain);
  const stageProgress = status ? domainProgress(status) : 0;
  const weeklyProgress = weekSlots && floor ? computeWeeklyFloorProgress(domain, weekSlots, floor) : null;
  const learnMore = DOMAIN_LEARN_MORE[domain];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>‹ Back</Text>
        </Pressable>

        <View style={styles.titleRow}>
          <View style={[styles.accentDot, { backgroundColor: accent }]} />
          <Text style={styles.title}>{domain}</Text>
        </View>

        <View style={styles.stageRow}>
          <ProgressRing size={72} strokeWidth={7} progress={stageProgress} color={accent}>
            <Text style={styles.stageDays}>{status?.consecutiveDays ?? 0}d</Text>
          </ProgressRing>
          <View style={styles.stageCaption}>
            <Text style={styles.sectionLabel}>Foundation stage</Text>
            <Text style={styles.stageLabel}>{status ? STAGE_LABEL[status.currentActivityState] : '—'}</Text>
            <Text style={styles.bodyMuted}>{status?.consecutiveDays ?? 0} consecutive days engaged</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Weekly floor</Text>
          {floor ? (
            <>
              <Text style={styles.floorTarget}>
                {isChecklistDomain
                  ? `${floor.minSessionsPerWeek} time${floor.minSessionsPerWeek === 1 ? '' : 's'}/week`
                  : `${formatHours(floor.weeklyMinimumMinutes)}/week · ${floor.minSessionsPerWeek} sessions/week`}
              </Text>
              <Text style={styles.bodyMuted}>{floor.notes}</Text>

              <View style={styles.weeklyProgressRow}>
                {weeklyProgress ? (
                  <>
                    <View style={styles.weeklyBarTrack}>
                      <View style={[styles.weeklyBarFill, { width: `${weeklyProgress.fraction * 100}%`, backgroundColor: accent }]} />
                    </View>
                    <Text style={styles.weeklyProgressText}>
                      {weeklyProgress.measure === 'minutes'
                        ? `${formatHours(weeklyProgress.completed)} of ${formatHours(weeklyProgress.target)} this week`
                        : `${weeklyProgress.completed} of ${weeklyProgress.target} this week`}
                    </Text>
                  </>
                ) : (
                  <ActivityIndicator color={colors.metalFlat} />
                )}
              </View>
            </>
          ) : (
            <Text style={styles.bodyMuted}>No floor configured for this domain yet.</Text>
          )}
        </View>

        {learnMore && (
          <View style={styles.learnMoreCard}>
            <Text style={styles.learnMoreTitle}>{learnMore.title}</Text>
            <Text style={styles.learnMoreBody}>{learnMore.body}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xxl, paddingTop: spacing.xxl * 2, paddingBottom: spacing.xxl * 2 },
  backLink: { color: colors.metalFlat, fontFamily: fontFamily.headerMedium, fontSize: 14, marginBottom: spacing.xl },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  accentDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.sm },
  title: { ...typography.screenTitle },
  stageRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xxl },
  stageDays: { fontFamily: fontFamily.monoMedium, color: colors.textPrimary, fontSize: 14 },
  stageCaption: { flex: 1, marginLeft: spacing.lg },
  sectionLabel: { ...typography.sectionTitle, marginBottom: spacing.xs },
  stageLabel: { fontFamily: fontFamily.headerBold, color: colors.textPrimary, fontSize: 18, marginBottom: 2 },
  bodyMuted: { ...typography.bodyMuted, lineHeight: 18 },
  section: { marginBottom: spacing.xxl },
  floorTarget: { fontFamily: fontFamily.headerMedium, color: colors.textPrimary, fontSize: 15, marginBottom: spacing.xs },
  weeklyProgressRow: { marginTop: spacing.md },
  weeklyBarTrack: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden', marginBottom: spacing.xs },
  weeklyBarFill: { height: '100%', borderRadius: 4 },
  weeklyProgressText: { ...typography.monoMuted },
  learnMoreCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  learnMoreTitle: { fontFamily: fontFamily.headerMedium, color: colors.textPrimary, fontSize: 15, marginBottom: spacing.xs },
  learnMoreBody: { ...typography.body, color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
});
