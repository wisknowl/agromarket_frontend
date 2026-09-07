import React from 'react';
import { View, StyleSheet } from 'react-native';
import FarmCard from '../modules/farms/components/FarmCard';
import { useAuthStore } from '@/store/authStore';
import { Farm } from '@/types';

interface FarmsListProps {
  farms?: Farm[];
  isOwner?: boolean;
}

export default function FarmsList({ farms, isOwner = true }: FarmsListProps) {
  const { user } = useAuthStore();
  const displayFarms = farms && farms.length > 0 ? farms : user?.farms || [];

  return (
    <View style={styles.container}>
      {displayFarms.map((farm) => (
        <FarmCard key={farm.id} farm={farm} showManageButton={isOwner} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});
