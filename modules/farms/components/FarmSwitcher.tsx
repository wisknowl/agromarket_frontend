import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Plus, Check, Sprout, Egg, Beef, Fish, Landmark } from 'lucide-react-native';
import Colors, { Radii } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { Farm } from '@/types';
import { useUIStore } from '@/store/uiStore';
import { useRouter } from 'expo-router';

interface FarmSwitcherProps {
  farms: Farm[];
  onAddFarm?: () => void;
  selectedFarmId?: string | null;
  onSelectFarm?: (farmId: string) => void;
}

export default function FarmSwitcher({
  farms,
  onAddFarm,
  selectedFarmId,
  onSelectFarm,
}: FarmSwitcherProps) {
  const router = useRouter();
  const activeFarmId = useUIStore((s) => s.activeFarmId);
  const setActiveFarmId = useUIStore((s) => s.setActiveFarmId);

  const currentSelectedId = selectedFarmId || activeFarmId || (farms.length > 0 ? farms[0].id : null);

  const getCategoryIcon = (category?: string) => {
    switch (category?.toUpperCase()) {
      case 'POULTRY':
        return <Egg size={14} color={Colors.espresso} />;
      case 'LIVESTOCK':
        return <Beef size={14} color={Colors.espresso} />;
      case 'AQUACULTURE':
        return <Fish size={14} color={Colors.espresso} />;
      default:
        return <Sprout size={14} color={Colors.cultivated} />;
    }
  };

  const handleAddNew = () => {
    if (onAddFarm) {
      onAddFarm();
    } else {
      router.push('/farmer/new');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionLabel}>Active Farm Workspace</Text>
        <TouchableOpacity onPress={handleAddNew} style={styles.addFarmLink}>
          <Plus size={13} color={Colors.cultivated} strokeWidth={2.5} />
          <Text style={styles.addFarmLinkText}>Add Farm</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollRow}
      >
        {farms.map((farm) => {
          const isSelected = farm.id === currentSelectedId;
          return (
            <TouchableOpacity
              key={farm.id}
              style={[
                styles.farmPill,
                isSelected && styles.farmPillActive,
              ]}
              onPress={() => {
                setActiveFarmId(farm.id);
                onSelectFarm?.(farm.id);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.pillIcon}>{getCategoryIcon(farm.category)}</View>
              <Text
                style={[
                  styles.pillText,
                  isSelected && styles.pillTextActive,
                ]}
                numberOfLines={1}
              >
                {farm.name}
              </Text>
              {isSelected && (
                <View style={styles.checkCircle}>
                  <Check size={10} color={Colors.white} strokeWidth={3} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionLabel: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addFarmLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  addFarmLinkText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.cultivated,
  },
  scrollRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  farmPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.parchment,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    gap: 6,
  },
  farmPillActive: {
    backgroundColor: Colors.canopy,
    borderColor: Colors.canopy,
  },
  pillIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12.5,
    color: Colors.espresso,
    maxWidth: 160,
  },
  pillTextActive: {
    fontFamily: Fonts.bodySemiBold,
    color: Colors.white,
  },
  checkCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.cultivated,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
});
