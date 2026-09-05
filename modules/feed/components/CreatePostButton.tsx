import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { Plus, Sparkles } from 'lucide-react-native';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';

interface CreatePostButtonProps {
  onPress: () => void;
  label?: string;
}

export default function CreatePostButton({
  onPress,
  label = 'Share Harvest',
}: CreatePostButtonProps) {
  return (
    <View style={styles.floatingWrapper} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel="Create harvest update or story"
      >
        <View style={styles.iconCircle}>
          <Plus size={16} color={Colors.white} strokeWidth={2.8} />
        </View>
        <Text style={styles.label}>{label}</Text>
        <Sparkles size={13} color={Colors.gold} strokeWidth={2} style={styles.sparkle} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    bottom: 10, // Immediately above the bottom tab bar line
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.canopy,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
    borderWidth: 1.2,
    borderColor: 'rgba(226, 166, 60, 0.45)', // Harvest gold accent border
    gap: 7,
    ...Shadows.card,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.cultivated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.white,
    letterSpacing: 0.2,
  },
  sparkle: {
    marginLeft: -2,
  },
});
