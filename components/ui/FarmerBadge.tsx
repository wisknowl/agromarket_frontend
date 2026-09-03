import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Colors, { Radii } from '@/constants/colors';
import { Fonts } from '@/constants/typography';

export type TierType = 'GOLD' | 'SILVER' | 'BRONZE' | 'PLATINUM' | 'VERIFIED' | 'OVERDUE' | 'ALERT';

interface FarmerBadgeProps {
  tier?: TierType | string;
  label?: string;
  style?: ViewStyle;
  size?: 'sm' | 'md';
}

/**
 * Farmer credit & verification badge:
 * Complies with Brand Guide Section: Badges & Credit Tiers
 * Includes colored dot + clear text label for accessibility/colorblind support
 */
export default function FarmerBadge({
  tier = 'GOLD',
  label,
  style,
  size = 'md',
}: FarmerBadgeProps) {
  const normalizedTier = (tier || 'GOLD').toUpperCase() as TierType;

  let bg = 'rgba(226, 166, 60, 0.16)';
  let textColor = '#8A5F1C';
  let dotColor = Colors.gold;
  let defaultLabel = 'Gold Farmer';

  switch (normalizedTier) {
    case 'PLATINUM':
      bg = 'rgba(215, 216, 208, 0.35)';
      textColor = '#4A4D47';
      dotColor = Colors.platinum;
      defaultLabel = 'Platinum Farmer';
      break;
    case 'SILVER':
      bg = 'rgba(156, 146, 132, 0.18)';
      textColor = '#5C5245';
      dotColor = Colors.silver;
      defaultLabel = 'Silver Farmer';
      break;
    case 'BRONZE':
      bg = 'rgba(122, 74, 45, 0.14)';
      textColor = Colors.soil;
      dotColor = Colors.soil;
      defaultLabel = 'Bronze Farmer';
      break;
    case 'VERIFIED':
      bg = 'rgba(78, 139, 63, 0.13)';
      textColor = Colors.cultivated;
      dotColor = Colors.cultivated;
      defaultLabel = 'Co-op Verified';
      break;
    case 'OVERDUE':
    case 'ALERT':
      bg = 'rgba(181, 74, 52, 0.14)';
      textColor = Colors.clayDim;
      dotColor = Colors.clay;
      defaultLabel = 'Repayment Overdue';
      break;
    case 'GOLD':
    default:
      bg = 'rgba(226, 166, 60, 0.16)';
      textColor = '#8A5F1C';
      dotColor = Colors.gold;
      defaultLabel = 'Gold Farmer';
      break;
  }

  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: bg },
        isSmall && styles.containerSmall,
        style,
      ]}
    >
      <View
        style={[
          styles.dot,
          { backgroundColor: dotColor },
          normalizedTier === 'PLATINUM' && styles.dotPlatinum,
          isSmall && styles.dotSmall,
        ]}
      />
      <Text
        style={[
          styles.text,
          { color: textColor },
          isSmall && styles.textSmall,
        ]}
      >
        {label || defaultLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    gap: 7,
    alignSelf: 'flex-start',
  },
  containerSmall: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotPlatinum: {
    borderWidth: 1,
    borderColor: '#B9BCB2',
  },
  text: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    letterSpacing: 0.1,
  },
  textSmall: {
    fontSize: 11,
  },
});
