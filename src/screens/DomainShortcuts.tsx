import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Domain, FoundationStatus } from '../domain/types';
import { DASHBOARD_DOMAINS, domainProgress } from '../foundation/progress';
import { colors, fontFamily, radius, spacing, typography, DOMAIN_COLOR, ProgressRing } from '../theme';

interface Props {
  foundationStatuses: FoundationStatus[];
  onSelectDomain: (domain: Domain) => void;
}

const RING_SIZE = 40;
const RING_STROKE = 3;

// Six small tappable entries, one per domain - each a quick-glance progress
// ring plus navigation into that domain's detail page. Dark steel card
// surface for every entry regardless of domain, differentiated by name and
// a thin ring accent rather than a saturated fill - the chrome/metal
// gradient stays reserved for the Foundation ring and other primary
// elements, not every small card on the screen.
export default function DomainShortcuts({ foundationStatuses, onSelectDomain }: Props) {
  const statusByDomain = new Map(foundationStatuses.map((s) => [s.domain, s]));

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Domains</Text>
      <View style={styles.row}>
        {DASHBOARD_DOMAINS.map((domain) => {
          const status = statusByDomain.get(domain);
          const progress = status ? domainProgress(status) : 0;
          return (
            <Pressable
              key={domain}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => onSelectDomain(domain)}
              testID={`domain-shortcut-${domain}`}
            >
              <ProgressRing size={RING_SIZE} strokeWidth={RING_STROKE} progress={progress} color={DOMAIN_COLOR[domain]} />
              <Text style={styles.label}>{domain}</Text>
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
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: {
    width: `${100 / 3}%`,
    minWidth: 96,
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cardPressed: { opacity: 0.75 },
  label: { fontFamily: fontFamily.headerMedium, color: colors.textPrimary, fontSize: 13, marginTop: spacing.xs },
});
