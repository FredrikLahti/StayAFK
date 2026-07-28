import React, { useEffect, useMemo, useState } from 'react';
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
  const [pendingPaired, setPendingPaired] = useState<Record<string, string>>({});

  const question = ONBOARDING_QUESTIONS[step];

  const progress = useMemo(
    () => `${step + 1} / ${ONBOARDING_QUESTIONS.length}`,
    [step]
  );

  // Restores whatever was previously picked for this step whenever it comes
  // back into view (e.g. after tapping back), instead of showing blank
  // options for a question that was already answered.
  useEffect(() => {
    if (question.kind === 'multi') {
      const prior = answers[question.field];
      setPendingMulti(Array.isArray(prior) ? prior : []);
    } else if (question.kind === 'paired') {
      const [a, b] = question.pairs;
      setPendingPaired({
        [a.field]: (answers[a.field] as string) ?? '',
        [b.field]: (answers[b.field] as string) ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function goToStep(nextStep: number, nextAnswers: Record<string, string | string[]>) {
    if (nextStep >= ONBOARDING_QUESTIONS.length) {
      onComplete(buildProfileFromAnswers(nextAnswers));
    } else {
      setStep(nextStep);
    }
  }

  function commitFields(fields: Record<string, string | string[]>) {
    const nextAnswers = { ...answers, ...fields };
    setAnswers(nextAnswers);
    goToStep(step + 1, nextAnswers);
  }

  function handleBack() {
    if (step === 0) return;
    setStep(step - 1);
  }

  function handleSingleSelect(value: string) {
    if (question.kind !== 'single') return;
    commitFields({ [question.field]: value });
  }

  function toggleMultiSelect(value: string) {
    setPendingMulti((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function handleMultiContinue() {
    if (question.kind !== 'multi') return;
    commitFields({ [question.field]: pendingMulti });
  }

  function handlePairedSelect(field: string, value: string) {
    setPendingPaired((prev) => ({ ...prev, [field]: value }));
  }

  function handlePairedContinue() {
    if (question.kind !== 'paired') return;
    const [a, b] = question.pairs;
    commitFields({ [a.field]: pendingPaired[a.field], [b.field]: pendingPaired[b.field] });
  }

  const canContinueMulti = pendingMulti.length > 0;
  const canContinuePaired =
    question.kind === 'paired' &&
    Boolean(pendingPaired[question.pairs[0].field]) &&
    Boolean(pendingPaired[question.pairs[1].field]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={handleBack}
            disabled={step === 0}
            hitSlop={12}
            style={styles.backButton}
            testID="onboarding-back"
          >
            <Text style={[styles.backButtonText, step === 0 && styles.backButtonHidden]}>‹ Back</Text>
          </Pressable>
          <Text style={styles.progress}>{progress}</Text>
        </View>

        <Text style={styles.prompt}>{question.prompt}</Text>

        {question.kind === 'single' &&
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

        {question.kind === 'multi' && (
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
              style={({ pressed }) => [pressed && canContinueMulti && styles.optionPressed]}
              onPress={handleMultiContinue}
              disabled={!canContinueMulti}
            >
              {canContinueMulti ? (
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

        {question.kind === 'paired' && (
          <>
            {question.pairs.map((pair) => (
              <View key={pair.field} style={styles.pairGroup}>
                <Text style={styles.pairLabel}>{pair.label}</Text>
                <View style={styles.pairOptionsRow}>
                  {pair.options.map((opt) => {
                    const selected = pendingPaired[pair.field] === opt.value;
                    return (
                      <Pressable
                        key={opt.value}
                        style={({ pressed }) => [
                          styles.pairOption,
                          selected && styles.optionSelected,
                          pressed && styles.optionPressed,
                        ]}
                        onPress={() => handlePairedSelect(pair.field, opt.value)}
                        testID={`option-${pair.field}-${opt.value}`}
                      >
                        <Text style={[styles.pairOptionText, selected && styles.optionTextSelected]}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
            <Pressable
              style={({ pressed }) => [pressed && canContinuePaired && styles.optionPressed]}
              onPress={handlePairedContinue}
              disabled={!canContinuePaired}
            >
              {canContinuePaired ? (
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  backButton: { paddingVertical: spacing.xs, paddingRight: spacing.sm },
  backButtonText: { ...typography.monoMuted, fontSize: 14 },
  backButtonHidden: { opacity: 0 },
  progress: { ...typography.monoMuted },
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
  pairGroup: { marginBottom: spacing.xl },
  pairLabel: {
    fontFamily: fontFamily.headerMedium,
    color: colors.metalFlat,
    fontSize: 14,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  pairOptionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pairOption: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: '47%',
    alignItems: 'center',
  },
  pairOptionText: { ...typography.body, fontSize: 14 },
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
