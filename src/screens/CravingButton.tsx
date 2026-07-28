import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fontFamily, radius, spacing, MetalGradient } from '../theme';

interface Props {
  onPress: () => void;
}

// Persistent, easy-access craving button per ARCHITECTURE.md's Gaming
// Control screen description. A single tap logs the event immediately (no
// follow-up question yet) - briefly showing "Logged" is just passive
// acknowledgment, not a follow-up question.
//
// Styled with the metal gradient (a primary, always-available action),
// not the reserved relapse red - a craving is a precursor signal, not a
// relapse, and that color stays exclusive to relapse-related UI.
export default function CravingButton({ onPress }: Props) {
  const [justLogged, setJustLogged] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handlePress() {
    onPress();
    setJustLogged(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setJustLogged(false), 1400);
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.wrapper, pressed && styles.buttonPressed]}
      onPress={handlePress}
      testID="craving-button"
    >
      <MetalGradient style={styles.button} glow>
        <Text style={styles.text}>{justLogged ? 'Logged' : 'Craving'}</Text>
      </MetalGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xxl + spacing.xs,
    borderRadius: radius.pill,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  button: {
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
  },
  buttonPressed: { opacity: 0.8 },
  text: { fontFamily: fontFamily.headerBold, color: colors.background, fontSize: 15 },
});
