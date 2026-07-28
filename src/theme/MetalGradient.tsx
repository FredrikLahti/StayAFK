import React, { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from './colors';

interface Props {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

// The one bold visual element in the app - a brushed-steel gradient
// reserved for the Phase badge, primary action buttons, and progress/fill
// elements. Kept to a single shared component so it's applied consistently
// (same stops, same direction) everywhere it appears.
export default function MetalGradient({ style, children }: Props) {
  return (
    <LinearGradient
      colors={[colors.metal.start, colors.metal.mid, colors.metal.end]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}
