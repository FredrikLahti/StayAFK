import React, { ReactNode, useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from './colors';

interface Props {
  size: number;
  strokeWidth: number;
  progress: number; // 0-1
  color?: string;
  // Renders the progress arc with the same brushed-steel sweep as
  // MetalGradient instead of a flat color - reserved for the single
  // prominent overall-Foundation ring, matching how MetalGradient itself is
  // reserved for primary/prominent elements rather than every fill.
  chrome?: boolean;
  trackColor?: string;
  children?: ReactNode;
}

// Shared circular progress indicator - used both for the single large
// overall-Foundation ring and the six small per-domain rings, so the two
// only ever differ in size/color, never in how progress is drawn.
export default function ProgressRing({ size, strokeWidth, progress, color, chrome, trackColor, children }: Props) {
  const gradientId = useId();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const dashOffset = circumference * (1 - clamped);
  const stroke = chrome ? `url(#${gradientId})` : (color ?? colors.metalFlat);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        {chrome && (
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              {colors.metal.stops.map((stop, index) => (
                <Stop
                  key={stop + index}
                  offset={index / (colors.metal.stops.length - 1)}
                  stopColor={stop}
                />
              ))}
            </LinearGradient>
          </Defs>
        )}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor ?? colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          fill="none"
        />
      </Svg>
      {children}
    </View>
  );
}
