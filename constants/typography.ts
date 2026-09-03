// agromarket Typography Design System (from brand guide v2)
// 1. Fraunces: Editorial Serif for headings & brand wordmarks
// 2. Inter: Clean sans-serif for UI, buttons, inputs & body
// 3. JetBrains Mono: Figures ONLY (prices in FCFA, scores, deductions, metrics)

import { StyleSheet } from 'react-native';
import Colors from './colors';

export const Fonts = {
  // Fraunces (Display)
  display: 'Fraunces_600SemiBold',
  displayItalic: 'Fraunces_600SemiBold_Italic',
  displayRegular: 'Fraunces_400Regular',
  displayItalicRegular: 'Fraunces_400Regular_Italic',
  displayBold: 'Fraunces_700Bold',

  // Inter (UI & Body)
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',

  // JetBrains Mono (Figures ONLY)
  mono: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_600SemiBold',
};

export const Typography = StyleSheet.create({
  // Display Titles
  wordmark: {
    fontFamily: Fonts.display,
    fontSize: 28,
    color: Colors.canopy,
    letterSpacing: -0.5,
  },
  wordmarkItalic: {
    fontFamily: Fonts.displayItalic,
    fontSize: 24,
    color: Colors.canopy,
  },
  h1: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 24,
    lineHeight: 30,
    color: Colors.espresso,
  },
  h2: {
    fontFamily: Fonts.displayItalic,
    fontSize: 20,
    lineHeight: 26,
    color: Colors.espresso,
  },
  h3: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 16,
    lineHeight: 22,
    color: Colors.espresso,
  },

  // Body Text
  body: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.espresso,
  },
  bodySmall: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text.secondary,
  },
  caption: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.text.muted,
  },

  // Button Labels (Always Inter SemiBold/Bold, fully rounded pill)
  button: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    letterSpacing: 0.1,
  },
  buttonSmall: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
  },

  // Monetary Figures & Data (Strictly JetBrains Mono)
  price: {
    fontFamily: Fonts.monoBold,
    fontSize: 16,
    color: Colors.soil,
  },
  priceLarge: {
    fontFamily: Fonts.monoBold,
    fontSize: 22,
    color: Colors.canopy,
  },
  metric: {
    fontFamily: Fonts.monoBold,
    fontSize: 14,
    color: Colors.gold,
  },
  metricLabel: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.text.secondary,
  },
});

export default Typography;
