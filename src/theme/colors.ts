// Central palette - the only place these hex values should appear. Screens
// reference these tokens rather than hardcoding colors.
export const colors = {
  background: '#0A0B0D',
  surface: '#16181C',
  border: '#2A2D33',

  textPrimary: '#ECEDEF',
  textSecondary: '#8A8F98',

  // The flat (non-gradient) metal tone - used for small accents like nav
  // links and the "Equivalent" status, distinct from the bold gradient
  // itself, which is reserved for the Phase badge, primary buttons, and
  // progress/fill elements.
  metalFlat: '#C9CFD6',
  metal: {
    start: '#7A8088',
    mid: '#E4E7EA',
    end: '#5C6169',
  },

  status: {
    done: '#4ADE80',
    equivalent: '#C9CFD6',
    missed: '#E8A23D',
    notPossible: '#6B7178',
  },

  // Reserved exclusively for relapse-related UI (the "I started gaming
  // again" flow, resulting serious GamingControlStatus states) so it stays
  // meaningful wherever it shows up - never used for anything else,
  // including the craving button, which is a precursor signal, not a
  // relapse.
  relapse: '#E2543D',
} as const;
