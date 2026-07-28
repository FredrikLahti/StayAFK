import { Domain } from '../domain/types';

// Distinct accent per domain for the dashboard timeline/progress indicators -
// deliberately kept apart from the SlotStatus and relapse palettes (which
// mean something specific already) so a color always reads as "which
// domain" first, with status conveyed separately (dot/border, not fill).
export const DOMAIN_COLOR: Record<Domain, string> = {
  Sleep: '#6E7BA8',
  Move: '#4FBF8B',
  Fuel: '#D9A441',
  Connect: '#5FA8D9',
  Build: '#B98CE0',
  Live: '#E0956B',
  Maintain: '#8A8F98',
};
