import React, { ReactNode, useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from './colors';

interface Props {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  // Soft studio-light glow behind the element - opt-in, for primary CTA
  // buttons only (not the Phase badge, which isn't a tappable action).
  glow?: boolean;
}

const SHEEN_WIDTH = 70;
const SHEEN_SWEEP = 320; // px the sheen travels; comfortably covers every button width in the app

// The one bold visual element in the app - a brushed-steel gradient
// reserved for the Phase badge, primary action buttons, and progress/fill
// elements. Kept to a single shared component so the gradient stops, the
// optional glow, and the one-shot shine sweep are applied consistently
// everywhere it appears.
export default function MetalGradient({ style, children, glow = false }: Props) {
  const shineProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Plays once on mount only - this ref/effect pair is per component
    // instance, so it does not replay on re-renders.
    const animation = Animated.timing(shineProgress, {
      toValue: 1,
      duration: 750,
      delay: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [shineProgress]);

  const translateX = shineProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-SHEEN_SWEEP / 2, SHEEN_SWEEP],
  });

  return (
    <View style={styles.outer}>
      {glow && <View pointerEvents="none" style={styles.glow} />}
      <View style={[styles.wrapper, style]}>
        <LinearGradient
          colors={colors.metal.stops}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          pointerEvents="none"
          style={[styles.sheen, { transform: [{ translateX }, { rotate: '25deg' }] }]}
        />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { position: 'relative' },
  wrapper: { overflow: 'hidden' },
  glow: {
    position: 'absolute',
    top: -14,
    left: -14,
    right: -14,
    bottom: -14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  sheen: {
    position: 'absolute',
    top: -40,
    bottom: -40,
    width: SHEEN_WIDTH,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});
