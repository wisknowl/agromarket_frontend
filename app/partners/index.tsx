import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MessageCircle } from 'lucide-react-native';
import { partnerPosts } from '@/mocks/data';
import PostCard from '@/components/PostCard';
import Colors from '@/constants/colors';

const { height: screenHeight } = Dimensions.get('window');

export default function AgroPartnersFeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activePostIndex, setActivePostIndex] = useState(0);
  const [containerHeight, setContainerHeight] = useState(screenHeight);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
    waitForInteraction: false,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems && viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActivePostIndex(viewableItems[0].index);
      }
    }
  ).current;

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        const { height } = e.nativeEvent.layout;
        if (height > 0) setContainerHeight(height);
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

      {/* Floating Header Overlay - Clean transparent overlay without green banner or text */}
      <View style={[styles.floatingHeader, { top: Math.max(insets.top, 16) + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.75}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color={Colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.inboxShortcut}
          onPress={() => router.push('/(tabs)/inbox')}
          activeOpacity={0.75}
          accessibilityLabel="Open inbox"
        >
          <MessageCircle size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Vertical Full-Screen Swiper */}
      <FlatList
        data={partnerPosts}
        renderItem={({ item, index }) => (
          <View style={{ height: containerHeight, width: '100%' }}>
            <PostCard
              post={item}
              fullScreen={true}
              isActive={index === activePostIndex}
            />
          </View>
        )}
        keyExtractor={(item) => item.id}
        pagingEnabled={true}
        snapToInterval={containerHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum={true}
        showsVerticalScrollIndicator={false}
        bounces={false}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        windowSize={3}
        maxToRenderPerBatch={2}
        initialNumToRender={2}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  floatingHeader: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 99,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inboxShortcut: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
