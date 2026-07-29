import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FoundationStatus } from '../domain/types';
import { DASHBOARD_DOMAINS } from '../foundation/progress';
import { averageConsecutiveDays, computeFoundationStageInfo } from '../foundation/stageInfo';
import { colors, fontFamily, spacing, typography, ProgressRing } from '../theme';

interface Props {
  foundationStatuses: FoundationStatus[];
}

const RING_SIZE = 104;
const RING_STROKE = 9;

// Shows what stage the Foundation is actually in (Restarted -> Repeating ->
// Established -> Self-sustaining) and concretely how far to the next one -
// the previous version of this ring showed an abstract percentage next to
// the onboarding Phase name (Reset/Saturation/...), which doesn't say what
// the ring means at a glance.
export default function FoundationHeader({ foundationStatuses }: Props) {
  const dashboardStatuses = foundationStatuses.filter((s) => DASHBOARD_DOMAINS.includes(s.domain));
  const avgDays = averageConsecutiveDays(dashboardStatuses);
  const stageInfo = computeFoundationStageInfo(avgDays);

  return (
    <View style={styles.container}>
      <ProgressRing size={RING_SIZE} strokeWidth={RING_STROKE} progress={stageInfo.progressWithinStage} chrome>
        <View style={styles.ringCenter}>
          <Text style={styles.ringStage}>{stageInfo.stageLabel}</Text>
        </View>
      </ProgressRing>
      <View style={styles.caption}>
        <Text style={styles.captionTitle}>Foundation</Text>
        {stageInfo.nextStageLabel ? (
          <Text style={styles.captionBody}>
            <Text style={styles.captionEmphasis}>{stageInfo.daysToNextStage}</Text>
            {stageInfo.daysToNextStage === 1 ? ' day' : ' days'} to {stageInfo.nextStageLabel}
          </Text>
        ) : (
          <Text style={styles.captionBody}>Holding steady - the habit is self-sustaining.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  ringCenter: { alignItems: 'center' },
  ringStage: { fontFamily: fontFamily.headerBold, color: colors.textPrimary, fontSize: 14, textAlign: 'center', paddingHorizontal: spacing.xs },
  caption: { flex: 1, marginLeft: spacing.lg },
  captionTitle: { ...typography.sectionTitle, marginBottom: spacing.xs },
  captionBody: { ...typography.bodyMuted, lineHeight: 18 },
  captionEmphasis: { fontFamily: fontFamily.monoMedium, color: colors.metalFlat },
});
