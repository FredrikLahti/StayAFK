import { Domain } from '../domain/types';

// Muted, low-saturation accent per domain - deliberately desaturated so it
// only ever reads as a thin accent line or small dot/label tint, never as a
// filled saturated block (that read as generic RGB gaming UI and clashed
// with the dark chrome theme, which reserves the metal gradient for primary
// actions/progress and otherwise stays neutral). Kept apart from the
// SlotStatus and relapse palettes, which mean something specific already.
export const DOMAIN_COLOR: Record<Domain, string> = {
  Sleep: '#7A88B8',
  Move: '#6FAE8C',
  Fuel: '#B99A5B',
  Connect: '#6C93B0',
  Build: '#9B85AE',
  Live: '#B08268',
  Maintain: '#8A8F98',
};
