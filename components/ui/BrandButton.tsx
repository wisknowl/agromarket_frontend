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

export type ButtonVariant = 'primary' | 'cultivated' | 'gold' | 'secondary' | 'alert' | 'text' | 'canopy';
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
          color={
            variant === 'gold'
              ? Colors.espresso
              : variant === 'secondary' || variant === 'text'
                ? Colors.cultivated
                : Colors.white
          }
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

  // Updated Botanical-Fintech Variants (Cultivated Green Primary)
  primary: {
    backgroundColor: Colors.cultivated,
  },
  cultivated: {
    backgroundColor: Colors.cultivated,
  },
  gold: {
    backgroundColor: Colors.gold,
  },
  canopy: {
    backgroundColor: Colors.canopy,
  },
  secondary: {
    backgroundColor: '#EEF8F1',
    borderWidth: 1,
    borderColor: '#CCEBD5',
  },
  alert: {
    backgroundColor: '#FDF3F1',
    borderWidth: 1,
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
    color: Colors.white,
  },
  text_cultivated: {
    color: Colors.white,
  },
  text_gold: {
    color: Colors.espresso,
  },
  text_canopy: {
    color: Colors.white,
  },
  text_secondary: {
    color: Colors.cultivated,
  },
  text_alert: {
    color: Colors.clay,
  },
  text_text: {
    color: Colors.cultivated,
    textDecorationLine: 'underline',
  },

  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.45,
  },
});
