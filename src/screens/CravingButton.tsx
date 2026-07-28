import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

interface Props {
  onPress: () => void;
}

// Persistent, easy-access craving button per ARCHITECTURE.md's Gaming
// Control screen description. A single tap logs the event immediately (no
// follow-up question yet) - briefly showing "Logged" is just passive
// acknowledgment, not a follow-up question.
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
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      onPress={handlePress}
      testID="craving-button"
    >
      <Text style={styles.text}>{justLogged ? 'Logged' : 'Craving'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    backgroundColor: '#c04b4b',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  buttonPressed: { opacity: 0.8 },
  text: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
