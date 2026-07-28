import { GamingControlState } from '../domain/types';

export const GAMING_CONTROL_STATE_LABEL: Record<GamingControlState, string> = {
  reset_active: 'Reset active',
  in_control: 'In control',
  under_pressure: 'Under pressure',
  lapse_interrupted: 'Lapse interrupted',
  pattern_returning: 'Pattern returning',
  recovery_active: 'Recovery active',
  self_sustaining: 'Self-sustaining',
};

// Every state a relapse can resolve into is by definition "serious" - this
// is the only set of states allowed to show the reserved relapse color,
// wherever they show up (the gauge dial included).
export const RELAPSE_CAUSED_STATES: GamingControlState[] = [
  'under_pressure',
  'lapse_interrupted',
  'pattern_returning',
  'recovery_active',
];
