import React from 'react';
import { View, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/typography';

interface PriceTagProps {
  amount: number | string;
  unit?: string;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * Price & Monetary Metric Component
 * Strict Rule from Brand Guide v2: Figures (FCFA prices, quantities) MUST use JetBrains Mono.
 */
export default function PriceTag({
  amount,
  unit,
  currency = 'FCFA',
  size = 'md',
  color,
  style,
  textStyle,
}: PriceTagProps) {
  const formattedAmount =
    typeof amount === 'number'
      ? amount.toLocaleString('en-US')
      : amount;

  const fontSizes = {
    sm: 13,
    md: 16,
    lg: 22,
  };

  const textColor = color || Colors.soil;

  return (
    <View style={[styles.container, style]}>
      <Text
        style={[
          styles.amount,
          { fontSize: fontSizes[size], color: textColor },
          textStyle,
        ]}
      >
        {formattedAmount} {currency}
      </Text>
      {unit && (
        <Text style={[styles.unit, { fontSize: fontSizes[size] * 0.75 }]}>
          / {unit}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  amount: {
    fontFamily: Fonts.monoBold,
    letterSpacing: -0.2,
  },
  unit: {
    fontFamily: Fonts.body,
    color: Colors.text.secondary,
  },
});
