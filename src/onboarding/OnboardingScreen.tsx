import React, { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ONBOARDING_QUESTIONS, buildProfileFromAnswers } from './questions';
import { UserProfile } from '../domain/types';

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
              style={({ pressed }) => [
                styles.continueButton,
                pendingMulti.length === 0 && styles.continueButtonDisabled,
                pressed && pendingMulti.length > 0 && styles.optionPressed,
              ]}
              onPress={handleMultiContinue}
              disabled={pendingMulti.length === 0}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1115' },
  content: { padding: 24, paddingTop: 48 },
  progress: { color: '#8a8f98', fontSize: 14, marginBottom: 8 },
  prompt: { color: '#ffffff', fontSize: 22, fontWeight: '600', marginBottom: 24 },
  option: {
    backgroundColor: '#1b1e25',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2e37',
  },
  optionSelected: { borderColor: '#5b8cff', backgroundColor: '#1a2440' },
  optionPressed: { opacity: 0.7 },
  optionText: { color: '#e6e8eb', fontSize: 16 },
  optionTextSelected: { color: '#a9c1ff' },
  continueButton: {
    marginTop: 12,
    backgroundColor: '#5b8cff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: { backgroundColor: '#2a2e37' },
  continueButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});
