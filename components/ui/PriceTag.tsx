import React from 'react';
import { View, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { useLocale } from '@/context/LocaleContext';

interface PriceTagProps {
  amount: number | string;
  unit?: string;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  showDual?: boolean;
}

/**
 * Price & Monetary Metric Component
 * Integrated with African Trade Blocs & Role Intelligence:
 * Automatically formats into active Trade Bloc currency (XAF, XOF, NGN, KES, ZAR, ETB, USD)
 * and displays dual-currency conversion for cross-border buyers when enabled.
 */
export default function PriceTag({
  amount,
  unit,
  currency,
  size = 'md',
  color,
  style,
  textStyle,
  showDual,
}: PriceTagProps) {
  const { formatPrice, showDualCurrency } = useLocale();

  const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  const isCustomCurrency = currency && currency !== 'FCFA';

  const fontSizes = {
    sm: 13,
    md: 16,
    lg: 22,
  };

  const textColor = color || Colors.soil;

  // If a custom non-FCFA currency was manually passed, honor it
  if (isCustomCurrency) {
    const formatted = numAmount.toLocaleString('en-US');
    return (
      <View style={[styles.container, style]}>
        <Text
          style={[
            styles.amount,
            { fontSize: fontSizes[size], color: textColor },
            textStyle,
          ]}
        >
          {formatted} {currency}
        </Text>
        {unit && (
          <Text style={[styles.unit, { fontSize: fontSizes[size] * 0.75 }]}>
            / {unit}
          </Text>
        )}
      </View>
    );
  }

  // Automatic conversion via Trade Bloc Context Engine
  const priceResult = formatPrice(numAmount, { showDual });

  return (
    <View style={[styles.container, style]}>
      <Text
        style={[
          styles.amount,
          { fontSize: fontSizes[size], color: textColor },
          textStyle,
        ]}
      >
        {priceResult.primary}
      </Text>

      {priceResult.dual && (
        <Text
          style={[
            styles.dualText,
            { fontSize: fontSizes[size] * 0.7 },
          ]}
        >
          {priceResult.dual}
        </Text>
      )}

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
    flexWrap: 'wrap',
  },
  amount: {
    fontFamily: Fonts.monoBold,
    letterSpacing: -0.2,
  },
  dualText: {
    fontFamily: Fonts.mono,
    color: Colors.text.muted,
  },
  unit: {
    fontFamily: Fonts.body,
    color: Colors.text.secondary,
  },
});
