import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fontFamily, radius, spacing, MetalGradient } from '../theme';

interface Props {
  onPress: () => void;
  // Count within the same rolling window cravingStats.ts already uses for
  // "recent" (7 days) - passed in rather than computed here so this stays a
  // presentation component.
  weeklyCountAfterLogging: number;
}

function SparkIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M13 2 3 14h7l-1 8 11-13h-8l1-7z" fill={color} />
    </Svg>
  );
}

// Persistent, easy-access craving button per ARCHITECTURE.md's Gaming
// Control screen description. A single tap logs the event immediately (no
// follow-up question yet); a brief pulse + "Logged - X this week" message
// makes the tap's effect obvious without a follow-up question.
//
// Styled with the metal gradient (a primary, always-available action),
// not the reserved relapse red - a craving is a precursor signal, not a
// relapse, and that color stays exclusive to relapse-related UI.
export default function CravingButton({ onPress, weeklyCountAfterLogging }: Props) {
  const [justLogged, setJustLogged] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handlePress() {
    onPress();
    setJustLogged(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setJustLogged(false), 2200);

    scale.setValue(1);
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.18, useNativeDriver: true, speed: 40, bounciness: 12 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
    ]).start();
  }

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale }] }]}>
      <Pressable
        style={({ pressed }) => [pressed && styles.buttonPressed]}
        onPress={handlePress}
        testID="craving-button"
      >
        <MetalGradient style={styles.button} glow>
          {/* MetalGradient's fill/sheen layers are position:absolute, which
              CSS paints after normal in-flow content on web regardless of
              DOM order - wrapping the icon in a View (RN defaults to
              position:relative) puts it in that same later paint layer as
              the Text below, instead of getting buried under the gradient. */}
          <View>
            <SparkIcon size={16} color={colors.background} />
          </View>
          <Text style={styles.text}>
            {justLogged ? `Logged — ${weeklyCountAfterLogging} this week` : 'Craving'}
          </Text>
        </MetalGradient>
      </Pressable>
    </Animated.View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
  },
  buttonPressed: { opacity: 0.8 },
  text: { fontFamily: fontFamily.headerBold, color: colors.background, fontSize: 15 },
});
