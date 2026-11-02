import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Fonts } from '@/constants/typography';

interface AgromPostButtonProps {
  onPress: () => void;
  label?: string;
  compact?: boolean;
  style?: any;
}

export default function AgromPostButton({
  onPress,
  label = 'Post Story',
  compact = false,
  style,
}: AgromPostButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.container, compact && styles.containerCompact, style]}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      {/* Left Color Wing: Fresh Green */}
      <View style={[styles.leftWing, compact && styles.leftWingCompact]} />

      {/* Right Color Wing: Harvest Gold */}
      <View style={[styles.rightWing, compact && styles.rightWingCompact]} />

      {/* Center Foreground Overlay Card */}
      <View style={[styles.centerCard, compact && styles.centerCardCompact]}>
        <Text style={[styles.plusSign, compact && styles.plusSignCompact]}>+</Text>
        {label ? <Text style={[styles.label, compact && styles.labelCompact]}>{label}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  containerCompact: {
    paddingHorizontal: 5,
  },
  leftWing: {
    position: 'absolute',
    left: 1,
    top: 2,
    bottom: 2,
    width: 22,
    backgroundColor: '#4E8B3F',
    borderRadius: 10,
  },
  leftWingCompact: {
    left: 1,
    top: 2,
    bottom: 2,
    width: 16,
    borderRadius: 8,
  },
  rightWing: {
    position: 'absolute',
    right: 1,
    top: 2,
    bottom: 2,
    width: 22,
    backgroundColor: '#E2A63C',
    borderRadius: 10,
  },
  rightWingCompact: {
    right: 1,
    top: 2,
    bottom: 2,
    width: 16,
    borderRadius: 8,
  },
  centerCard: {
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F2DCAA',
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: '#241A12',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  centerCardCompact: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
    borderRadius: 9,
  },
  plusSign: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    fontWeight: '900',
    color: '#173A20',
    lineHeight: 16,
  },
  plusSignCompact: {
    fontSize: 13,
    lineHeight: 14,
  },
  label: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: '#173A20',
  },
  labelCompact: {
    fontSize: 11,
  },
});

