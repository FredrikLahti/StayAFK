// Pure positioning/coloring logic for the Gaming Control gauge dial - kept
// separate from the SVG rendering so the mapping from state to dial
// position/color is unit-testable without mounting a component.
import { GamingControlState } from '../domain/types';
import { RELAPSE_CAUSED_STATES } from './labels';

// Left-to-right dial order, matching the canonical state list order from
// ARCHITECTURE.md/domain/types.ts - "worst" (most concerning) on the left,
// "best" (most stable) on the right.
export const GAUGE_STATE_ORDER: GamingControlState[] = [
  'reset_active',
  'in_control',
  'under_pressure',
  'lapse_interrupted',
  'pattern_returning',
  'recovery_active',
  'self_sustaining',
];

// 0 (leftmost/worst) to 1 (rightmost/best).
export function gaugeFraction(state: GamingControlState): number {
  const index = GAUGE_STATE_ORDER.indexOf(state);
  return index / (GAUGE_STATE_ORDER.length - 1);
}

export type GaugeZone = 'neutral' | 'relapse' | 'achievement';

// Which color zone a state's needle/arc should render in - reuses the
// already-established RELAPSE_CAUSED_STATES set so this stays consistent
// with the rest of Gaming Control rather than inventing new semantics.
export function gaugeZone(state: GamingControlState): GaugeZone {
  if (state === 'self_sustaining') return 'achievement';
  if (RELAPSE_CAUSED_STATES.includes(state)) return 'relapse';
  return 'neutral';
}
