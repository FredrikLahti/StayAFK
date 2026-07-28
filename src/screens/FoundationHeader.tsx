import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FoundationStatus, PhaseName } from '../domain/types';
import { DASHBOARD_DOMAINS, domainProgress, overallProgress } from '../foundation/progress';
import { colors, fontFamily, spacing, typography, DOMAIN_COLOR, ProgressRing } from '../theme';

interface Props {
  phase: PhaseName;
  foundationStatuses: FoundationStatus[];
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

const RING_SIZE = 96;
const RING_STROKE = 9;
const DOMAIN_RING_SIZE = 40;
const DOMAIN_RING_STROKE = 4;

export default function FoundationHeader({ phase, foundationStatuses }: Props) {
  const overall = overallProgress(foundationStatuses);
  const statusByDomain = new Map(foundationStatuses.map((s) => [s.domain, s]));

  return (
    <View style={styles.container}>
      <View style={styles.ringRow}>
        <ProgressRing size={RING_SIZE} strokeWidth={RING_STROKE} progress={overall} chrome>
          <View style={styles.ringCenter}>
            <Text style={styles.ringPhase}>{capitalize(phase)}</Text>
            <Text style={styles.ringPercent}>{Math.round(overall * 100)}%</Text>
          </View>
        </ProgressRing>
        <View style={styles.ringCaption}>
          <Text style={styles.captionTitle}>Foundation</Text>
          <Text style={styles.captionBody}>
            Overall progress across every domain, on the same Restarted → Self-sustaining timeline.
          </Text>
        </View>
      </View>

      <View style={styles.domainRow}>
        {DASHBOARD_DOMAINS.map((domain) => {
          const status = statusByDomain.get(domain);
          const progress = status ? domainProgress(status) : 0;
          return (
            <View key={domain} style={styles.domainItem} testID={`domain-progress-${domain}`}>
              <ProgressRing
                size={DOMAIN_RING_SIZE}
                strokeWidth={DOMAIN_RING_STROKE}
                progress={progress}
                color={DOMAIN_COLOR[domain]}
              />
              <Text style={styles.domainLabel}>{domain}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.xl },
  ringRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  ringCenter: { alignItems: 'center' },
  ringPhase: { fontFamily: fontFamily.headerMedium, color: colors.textPrimary, fontSize: 12 },
  ringPercent: { fontFamily: fontFamily.monoMedium, color: colors.metalFlat, fontSize: 15, marginTop: 1 },
  ringCaption: { flex: 1, marginLeft: spacing.lg },
  captionTitle: { ...typography.sectionTitle, marginBottom: spacing.xs },
  captionBody: { ...typography.bodyMuted, lineHeight: 17 },
  domainRow: { flexDirection: 'row', justifyContent: 'space-between' },
  domainItem: { alignItems: 'center', width: `${100 / 6}%` },
  domainLabel: { ...typography.bodyMuted, fontSize: 10, marginTop: spacing.xs, textAlign: 'center' },
});
