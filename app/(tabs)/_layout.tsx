import React from 'react';
import { Tabs } from 'expo-router';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import CustomTabBar from '../../components/navigation/CustomTabBar';
import CreatePostModal from '../../modules/feed/components/CreatePostModal';
import { useUIStore } from '@/store/uiStore';

export default function TabLayout() {
  const isCreatePostModalOpen = useUIStore((s) => s.isCreatePostModalOpen);
  const closeCreatePostModal = useUIStore((s) => s.closeCreatePostModal);

  const handleCreatePost = (data: any) => {
    console.log('New post submitted from tab bar action:', data);
    closeCreatePostModal();
  };

  return (
    <>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.white,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: Colors.parchmentDim,
          },
          headerTitleStyle: {
            fontFamily: Fonts.displayItalic,
            fontSize: 19,
            color: Colors.canopy,
          },
          headerTintColor: Colors.espresso,
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: 'AgroFeed',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="agro-yields"
        options={{
          title: 'Harvests',
          headerTitle: 'Direct Harvests',
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Basket',
          headerTitle: 'Your Basket',
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'AgroInbox',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
        }}
      />
      </Tabs>
      <CreatePostModal
        visible={isCreatePostModalOpen}
        onClose={closeCreatePostModal}
        onSubmit={handleCreatePost}
      />
    </>
  );
}