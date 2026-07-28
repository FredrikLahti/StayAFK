import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, radius, spacing, typography, MetalGradient } from '../theme';

interface Props {
  onStart: () => void;
}

export default function EntryScreen({ onStart }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>I'm done.</Text>
        <Text style={styles.title}>Reset me.</Text>
        <Text style={styles.subtitle}>
          A few quick questions, then your first day gets built for you.
        </Text>
        <Pressable
          style={({ pressed }) => [pressed && styles.buttonPressed]}
          onPress={onStart}
        >
          <MetalGradient style={styles.button} glow>
            <Text style={styles.buttonText}>Start my Reset</Text>
          </MetalGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', padding: spacing.xxl + spacing.xs },
  title: { ...typography.screenTitle, fontSize: 34, lineHeight: 40 },
  subtitle: { ...typography.body, color: colors.textSecondary, fontSize: 16, marginTop: spacing.lg, marginBottom: spacing.xxl + spacing.lg },
  button: { borderRadius: radius.md, paddingVertical: 18, alignItems: 'center' },
  buttonPressed: { opacity: 0.8 },
  buttonText: { fontFamily: fontFamily.headerMedium, color: colors.background, fontSize: 17 },
});
