import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Colors from '@/constants/colors';
import { Settings as SettingsIcon } from 'lucide-react-native';

export default function Settings() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      {/* Add your settings options here */}
      <Pressable style={styles.menuItem}>
        <SettingsIcon size={20} color={Colors.text.primary} />
        <Text style={styles.menuItemText}>Account Settings</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemText: {
    fontSize: 16,
    color: Colors.text.primary,
    marginLeft: 16,
  },
});
