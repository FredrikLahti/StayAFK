import React, { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ONBOARDING_QUESTIONS, buildProfileFromAnswers } from './questions';
import { UserProfile } from '../domain/types';
import { colors, fontFamily, radius, spacing, typography, MetalGradient } from '../theme';

interface Props {
  onComplete: (profile: Omit<UserProfile, 'id' | 'createdAt'>) => void;
}

export default function OnboardingScreen({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [pendingMulti, setPendingMulti] = useState<string[]>([]);

  const question = ONBOARDING_QUESTIONS[step];
  const isLast = step === ONBOARDING_QUESTIONS.length - 1;

  const progress = useMemo(
    () => `${step + 1} / ${ONBOARDING_QUESTIONS.length}`,
    [step]
  );

  function commitAnswer(field: string, value: string | string[]) {
    const nextAnswers = { ...answers, [field]: value };
    setAnswers(nextAnswers);
    setPendingMulti([]);

    if (isLast) {
      onComplete(buildProfileFromAnswers(nextAnswers));
    } else {
      setStep(step + 1);
    }
  }

  function handleSingleSelect(value: string) {
    commitAnswer(question.field, value);
  }

  function toggleMultiSelect(value: string) {
    setPendingMulti((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function handleMultiContinue() {
    commitAnswer(question.field, pendingMulti);
  }

  const canContinue = pendingMulti.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.progress}>{progress}</Text>
        <Text style={styles.prompt}>{question.prompt}</Text>

        {question.type === 'single' &&
          question.options.map((opt) => (
            <Pressable
              key={opt.value}
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              onPress={() => handleSingleSelect(opt.value)}
              testID={`option-${opt.value}`}
            >
              <Text style={styles.optionText}>{opt.label}</Text>
            </Pressable>
          ))}

        {question.type === 'multi' && (
          <>
            {question.options.map((opt) => {
              const selected = pendingMulti.includes(opt.value);
              return (
                <Pressable
                  key={opt.value}
                  style={({ pressed }) => [
                    styles.option,
                    selected && styles.optionSelected,
                    pressed && styles.optionPressed,
                  ]}
                  onPress={() => toggleMultiSelect(opt.value)}
                  testID={`option-${opt.value}`}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {selected ? '✓ ' : ''}
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              style={({ pressed }) => [pressed && canContinue && styles.optionPressed]}
              onPress={handleMultiContinue}
              disabled={!canContinue}
            >
              {canContinue ? (
                <MetalGradient style={styles.continueButton} glow>
                  <Text style={styles.continueButtonText}>Continue</Text>
                </MetalGradient>
              ) : (
                <View style={[styles.continueButton, styles.continueButtonDisabled]}>
                  <Text style={styles.continueButtonTextDisabled}>Continue</Text>
                </View>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xxl, paddingTop: spacing.xxl * 2 },
  progress: { ...typography.monoMuted, marginBottom: spacing.sm },
  prompt: { ...typography.questionPrompt, marginBottom: spacing.xxl },
  option: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionSelected: { borderColor: colors.metalFlat, borderWidth: 1.5 },
  optionPressed: { opacity: 0.7 },
  optionText: { ...typography.body, fontSize: 16 },
  optionTextSelected: { color: colors.textPrimary },
  continueButton: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  continueButtonText: { fontFamily: fontFamily.headerMedium, color: colors.background, fontSize: 16 },
  continueButtonTextDisabled: { fontFamily: fontFamily.headerMedium, color: colors.textSecondary, fontSize: 16 },
});
