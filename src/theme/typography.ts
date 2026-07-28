import { SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import { colors } from './colors';

// Font families - loaded via useFonts in App.tsx before anything renders.
// Body text deliberately uses the platform default sans (undefined
// fontFamily) rather than another custom font, per the design brief: it
// should stay quiet and not compete with the header/mono treatments.
export const fontFamily = {
  headerBold: 'SpaceGrotesk_700Bold',
  headerMedium: 'SpaceGrotesk_500Medium',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
};

// Fonts that must be loaded via useFonts before first render.
export const FONTS_TO_LOAD = {
  SpaceGrotesk_700Bold,
  SpaceGrotesk_500Medium,
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
};

// Reusable text style tokens - screens spread these into their
// StyleSheet.create() definitions rather than hardcoding fontFamily/color.
export const typography = {
  screenTitle: { fontFamily: fontFamily.headerBold, color: colors.textPrimary, fontSize: 24 },
  sectionTitle: { fontFamily: fontFamily.headerMedium, color: colors.textPrimary, fontSize: 15 },
  questionPrompt: { fontFamily: fontFamily.headerBold, color: colors.textPrimary, fontSize: 22 },

  body: { color: colors.textPrimary, fontSize: 15 },
  bodyMuted: { color: colors.textSecondary, fontSize: 13 },

  // For timestamps, minute counts, dates - any numeric/time data.
  mono: { fontFamily: fontFamily.mono, color: colors.textPrimary, fontSize: 13 },
  monoMuted: { fontFamily: fontFamily.mono, color: colors.textSecondary, fontSize: 13 },
  monoLarge: { fontFamily: fontFamily.monoMedium, color: colors.textPrimary, fontSize: 20 },
};
