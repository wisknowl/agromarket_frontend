import React from 'react';
import { Stack } from 'expo-router';
import RegisterStoreScreen from '@/modules/buyam-sellam/screens/RegisterStoreScreen';

export default function NewStoreRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <RegisterStoreScreen />
    </>
  );
}

