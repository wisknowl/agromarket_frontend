import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FarmCard from '../modules/farms/components/FarmCard';
import { useAuthStore } from '@/store/authStore';
import { farms as mockFarms } from '@/mocks/data';

export default function FarmsList() {
  const { user } = useAuthStore();
  const userFarms =
    user?.farms && user.farms.length > 0
      ? user.farms
      : mockFarms.filter((f) => f.userId === (user?.id || 'u1'));

  return (
    <View style={styles.container}>
      {userFarms.map((farm) => (
        <FarmCard key={farm.id} farm={farm} showManageButton />
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
