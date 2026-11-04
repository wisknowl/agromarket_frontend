import React from 'react';
import { Stack } from 'expo-router';
import WholesalerHubScreen from '@/modules/buyam-sellam/screens/WholesalerHubScreen';

export default function AgroStoreRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <WholesalerHubScreen />
    </>
  );
}

