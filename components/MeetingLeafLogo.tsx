import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/typography';

export type LogoVariant = 'fullColor' | 'monochromeLight' | 'monochromeDark' | 'onGold';

interface MeetingLeafLogoProps {
  size?: number;
  showWordmark?: boolean;
  wordmarkColor?: string;
  variant?: LogoVariant;
  showTagline?: boolean;
}

/**
 * The Meeting Leaf: Official agromarket brand mark
 * - Left half: Cultivated Green (#4E8B3F) representing the grower
 * - Right half: Harvest Gold (#E2A63C) representing the market / value
 * - Stem: Tilled Soil (#7A4A2D) anchoring to the ground
 * - Seam: Hairline meeting point (#F6EEDD)
 */
export default function MeetingLeafLogo({
  size = 40,
  showWordmark = false,
  wordmarkColor,
  variant = 'fullColor',
  showTagline = false,
}: MeetingLeafLogoProps) {
  // Height proportion based on 200x220 viewbox
  const width = size;
  const height = (size * 220) / 200;

  // Variant color mapping from brand guide v2
  let leftColor = Colors.cultivated;
  let rightColor = Colors.gold;
  let stemColor = Colors.soil;
  let seamColor = Colors.parchment;
  let seamOpacity = 0.5;

  if (variant === 'monochromeLight') {
    leftColor = Colors.espresso;
    rightColor = Colors.espresso;
    stemColor = Colors.espresso;
    seamColor = '#FFFFFF';
  } else if (variant === 'monochromeDark') {
    leftColor = Colors.parchment;
    rightColor = Colors.parchment;
    stemColor = Colors.parchment;
    seamColor = Colors.canopy;
  } else if (variant === 'onGold') {
    leftColor = Colors.canopy;
    rightColor = Colors.espresso;
    stemColor = Colors.espresso;
    seamColor = Colors.gold;
  }

  const defaultWordmarkColor =
    wordmarkColor ||
    (variant === 'monochromeDark' ? Colors.parchment : Colors.espresso);

  return (
    <View style={styles.container}>
      <View style={{ width, height }}>
        <Svg width={width} height={height} viewBox="0 0 200 220">
          {/* Stem (Tilled Soil) */}
          {size >= 24 && (
            <Path
              d="M100,178 C103,190 109,200 116,210"
              stroke={stemColor}
              strokeWidth={size < 32 ? 9 : 7}
              strokeLinecap="round"
              fill="none"
            />
          )}

          {/* Grower's Half (Left: Cultivated Green) */}
          <Path
            d="M100,6 C78,12 53,30 40,58 C29,82 30,118 39,146 C49,168 72,182 100,180 Z"
            fill={leftColor}
          />

          {/* Market's Half (Right: Harvest Gold) */}
          <Path
            d="M100,6 C122,12 147,30 160,58 C171,82 170,118 161,146 C151,168 128,182 100,180 Z"
            fill={rightColor}
          />

          {/* Central Seam (visible >= 32px) */}
          {size >= 32 && (
            <Path
              d="M100,10 C97,50 97,140 100,178"
              stroke={seamColor}
              strokeWidth={1.5}
              strokeOpacity={seamOpacity}
              fill="none"
            />
          )}
        </Svg>
      </View>

      {showWordmark && (
        <View style={styles.wordmarkContainer}>
          <Text
            style={[
              styles.wordmark,
              { color: defaultWordmarkColor, fontSize: Math.max(size * 0.75, 20) },
            ]}
          >
            AgroMarket
          </Text>
          {/* {showTagline && (
            <Text
              style={[
                styles.tagline,
                { color: variant === 'monochromeDark' ? Colors.gold : Colors.soil },
              ]}
            >
              Du champ à la main
            </Text>
          )} */}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  wordmarkContainer: {
    justifyContent: 'center',
  },
  wordmark: {
    fontFamily: Fonts.display,
    letterSpacing: -0.5,
    includeFontPadding: false,
  },
  tagline: {
    fontFamily: Fonts.displayItalic,
    fontSize: 12,
    marginTop: -2,
  },
});
