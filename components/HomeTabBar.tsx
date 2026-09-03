import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors, { Radii } from '@/constants/colors';
import { Fonts } from '@/constants/typography';

interface TabHeaderProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function HomeTabBar({ tabs, activeTab, onTabChange }: TabHeaderProps) {
  const insets = useSafeAreaInsets();
  const paddingTop = Platform.OS === 'ios' ? insets.top : Math.max(insets.top, 16);

  return (
    <View style={[styles.container, { paddingTop: paddingTop + 4 }]}>
      <View style={styles.tabsRow}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <Pressable
              key={tab}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => onTabChange(tab)}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab}
              </Text>
              {isActive && <View style={styles.indicator} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.parchmentDim,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  tab: {
    paddingVertical: 12,
    position: 'relative',
  },
  activeTab: {},
  tabText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 16,
    color: Colors.text.secondary,
    letterSpacing: 0.1,
  },
  activeTabText: {
    fontFamily: Fonts.bodyBold,
    color: Colors.canopy,
  },
  indicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.cultivated,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
});