import React from 'react';
import { Stack } from 'expo-router';
import CreatePostCameraScreen from '@/modules/feed/screens/CreatePostCameraScreen';

export default function FeedCreateRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <CreatePostCameraScreen />
    </>
  );
}
