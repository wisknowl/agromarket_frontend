import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  PressableProps,
} from 'react-native';
import Colors, { Radii } from '@/constants/colors';
import { Fonts } from '@/constants/typography';

export type ButtonVariant = 'primary' | 'cultivated' | 'secondary' | 'alert' | 'text' | 'canopy';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface BrandButtonProps extends PressableProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  onPress?: () => void;
}

/**
 * Standard brand button complying with brand guide v2:
 * - Fully rounded pill radius (borderRadius: 9999)
 * - 44px minimum touch target
 * - High contrast accessible typography (Inter SemiBold)
 */
export default function BrandButton({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  onPress,
  ...props
}: BrandButtonProps) {
  const isInteractive = !disabled && !loading;

  return (
    <Pressable
      onPress={isInteractive ? onPress : undefined}
      disabled={!isInteractive}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        pressed && isInteractive && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Colors.espresso : variant === 'cultivated' ? Colors.white : Colors.cultivated}
        />
      ) : (
        <>
          {icon && icon}
          <Text
            style={[
              styles.baseText,
              styles[`text_${variant}`],
              styles[`textSize_${size}`],
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.pill,
    gap: 8,
  },
  size_sm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  size_md: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 46,
  },
  size_lg: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    minHeight: 52,
  },

  // Variants from Brand Guide
  primary: {
    backgroundColor: Colors.gold,
  },
  cultivated: {
    backgroundColor: Colors.cultivated,
  },
  canopy: {
    backgroundColor: Colors.canopy,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.cultivated,
  },
  alert: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.clay,
  },
  text: {
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
  },

  // Text Colors
  baseText: {
    fontFamily: Fonts.bodySemiBold,
  },
  textSize_sm: {
    fontSize: 13,
  },
  textSize_md: {
    fontSize: 15,
  },
  textSize_lg: {
    fontSize: 16,
  },

  text_primary: {
    color: Colors.espresso,
  },
  text_cultivated: {
    color: Colors.white,
  },
  text_canopy: {
    color: Colors.parchment,
  },
  text_secondary: {
    color: Colors.cultivated,
  },
  text_alert: {
    color: Colors.clay,
  },
  text_text: {
    color: Colors.espresso,
    textDecorationLine: 'underline',
  },

  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.35,
  },
});
