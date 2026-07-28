import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { GamingControlState } from '../domain/types';
import { GAMING_CONTROL_STATE_LABEL } from './labels';
import { gaugeFraction, gaugeZone } from './gauge';
import { colors, fontFamily, spacing } from '../theme';

interface Props {
  state: GamingControlState;
}

const WIDTH = 220;
const HEIGHT = 132;
const RADIUS = 84;
const STROKE = 14;
const CX = WIDTH / 2;
const CY = HEIGHT - 18;

const ZONE_COLOR: Record<ReturnType<typeof gaugeZone>, string> = {
  neutral: colors.metalFlat,
  relapse: colors.relapse,
  // Distinct "achievement" gold rather than reusing the Fuel domain accent -
  // this only ever appears in the gauge, for the rare self_sustaining state.
  achievement: '#D9C46A',
};

// Semicircular dial (9 o'clock -> 12 o'clock -> 3 o'clock) built the same
// way as ProgressRing (Circle + strokeDasharray + rotation) but constrained
// to a 180deg sweep instead of a full circle, plus a needle pointing at the
// current state's position along that sweep.
export default function GaugeDial({ state }: Props) {
  const circumference = 2 * Math.PI * RADIUS;
  const half = circumference / 2;
  const fraction = gaugeFraction(state);
  const zone = gaugeZone(state);

  // theta: 180deg at the left end (worst) sweeping down to 0deg at the
  // right end (best); y is inverted (cy - r*sin) so the arc bulges upward.
  const theta = (1 - fraction) * 180;
  const thetaRad = (theta * Math.PI) / 180;
  const needleLength = RADIUS - STROKE / 2 - 4;
  const needleX = CX + needleLength * Math.cos(thetaRad);
  const needleY = CY - needleLength * Math.sin(thetaRad);

  return (
    <View style={styles.container}>
      <Svg width={WIDTH} height={HEIGHT}>
        <Circle
          cx={CX}
          cy={CY}
          r={RADIUS}
          stroke={colors.border}
          strokeWidth={STROKE}
          strokeDasharray={`${half} ${circumference}`}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-180, ${CX}, ${CY})`}
        />
        <Circle
          cx={CX}
          cy={CY}
          r={RADIUS}
          stroke={ZONE_COLOR[zone]}
          strokeWidth={STROKE}
          strokeDasharray={`${half * fraction} ${circumference}`}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-180, ${CX}, ${CY})`}
        />
        <Line x1={CX} y1={CY} x2={needleX} y2={needleY} stroke={colors.textPrimary} strokeWidth={2.5} />
        <Circle cx={CX} cy={CY} r={5} fill={colors.textPrimary} />
      </Svg>
      <Text style={[styles.stateLabel, { color: ZONE_COLOR[zone] }]}>{GAMING_CONTROL_STATE_LABEL[state]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  stateLabel: { fontFamily: fontFamily.headerBold, fontSize: 17, marginTop: -spacing.sm },
});
