import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Colors from '@/constants/colors';

interface TabHeaderProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function TabHeader({ tabs, activeTab, onTabChange }: TabHeaderProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <Pressable
          key={tab}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => onTabChange(tab)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
            {tab}
          </Text>
          {activeTab === tab && <View style={styles.indicator} />}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    // backgroundColor: Colors.background,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    // padding:16,
    // paddingBottom: 0,
    // borderBottomWidth: 1,
    // borderBottomColor: Colors.border,
  },
  tab: {
    paddingVertical: 16,
    marginRight: 24,
    position: 'relative',
  },
  activeTab: {},
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  activeTabText: {
    fontWeight: '600',
    color: Colors.primary,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
});