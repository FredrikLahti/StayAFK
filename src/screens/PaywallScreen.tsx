import React, { useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, radius, spacing, typography, MetalGradient } from '../theme';

interface Props {
  priceDisplay: string;
  onUnlock: () => Promise<void>;
  onRestore: () => Promise<boolean>;
  onOpenSettings: () => void;
}

type Status = { kind: 'idle' } | { kind: 'working' } | { kind: 'error'; message: string };

export default function PaywallScreen({ priceDisplay, onUnlock, onRestore, onOpenSettings }: Props) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  async function handleUnlock() {
    setStatus({ kind: 'working' });
    setRestoreMessage(null);
    try {
      await onUnlock();
      // On success the app switches away from this screen entirely (the
      // purchase-updated listener persists PurchaseStatus and re-renders),
      // so there's nothing further to show here.
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Something went wrong - try again in a moment.',
      });
    }
  }

  async function handleRestore() {
    setStatus({ kind: 'working' });
    setRestoreMessage(null);
    try {
      const restored = await onRestore();
      setRestoreMessage(restored ? null : "Didn't find a previous purchase on this account.");
      setStatus({ kind: 'idle' });
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Could not check for a previous purchase.',
      });
    }
  }

  const working = status.kind === 'working';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Your first 3 days are done</Text>
        <Text style={styles.title}>You showed up. That's the whole test.</Text>

        <Text style={styles.body}>
          The free Reset was the real thing - not a trial version, not a demo. What you built over the last
          72 hours is yours either way.
        </Text>
        <Text style={styles.body}>
          Continuing costs {priceDisplay}, once. You're not paying to unlock features - everything already
          worked. You're paying yourself to keep going, because a few dollars on the line is often the
          difference between "I'll start again someday" and actually finishing what you started.
        </Text>
        <Text style={styles.body}>If that's not where you're at right now, that's fine. It'll be here.</Text>

        <Pressable style={({ pressed }) => [pressed && styles.pressed]} onPress={handleUnlock} disabled={working}>
          <MetalGradient style={styles.unlockButton} glow>
            {working ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.unlockButtonText}>Continue for {priceDisplay}</Text>
            )}
          </MetalGradient>
        </Pressable>

        <Pressable style={styles.restoreLink} onPress={handleRestore} disabled={working}>
          <Text style={styles.restoreLinkText}>Already purchased? Restore</Text>
        </Pressable>

        {restoreMessage && <Text style={styles.restoreMessage}>{restoreMessage}</Text>}
        {status.kind === 'error' && <Text style={styles.errorText}>{status.message}</Text>}

        <Pressable style={styles.settingsLink} onPress={onOpenSettings}>
          <Text style={styles.settingsLinkText}>Settings & support resources</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xxl, paddingTop: spacing.xxl * 2, paddingBottom: spacing.xxl * 2 },
  eyebrow: { ...typography.monoMuted, marginBottom: spacing.sm },
  title: { ...typography.screenTitle, fontSize: 26, lineHeight: 32, marginBottom: spacing.xl },
  body: { ...typography.body, color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginBottom: spacing.lg },
  unlockButton: { borderRadius: radius.md, paddingVertical: 18, alignItems: 'center', marginTop: spacing.md },
  pressed: { opacity: 0.85 },
  unlockButtonText: { fontFamily: fontFamily.headerBold, color: colors.background, fontSize: 17 },
  restoreLink: { alignItems: 'center', marginTop: spacing.lg },
  restoreLinkText: { color: colors.metalFlat, fontFamily: fontFamily.headerMedium, fontSize: 14 },
  restoreMessage: { ...typography.bodyMuted, textAlign: 'center', marginTop: spacing.sm },
  errorText: { color: colors.status.missed, fontSize: 13, textAlign: 'center', marginTop: spacing.sm },
  settingsLink: { alignItems: 'center', marginTop: spacing.xxl },
  settingsLinkText: { color: colors.textSecondary, fontSize: 13, textDecorationLine: 'underline', opacity: 0.75 },
});
