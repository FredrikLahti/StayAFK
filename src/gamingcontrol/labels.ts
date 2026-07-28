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
