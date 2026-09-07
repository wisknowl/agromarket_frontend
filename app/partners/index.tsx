import React, { useState, useRef } from 'react';
import {
  View,
  Text,
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
import { partnerPosts, agroPartners } from '@/mocks/data';
import PostCard from '@/components/PostCard';
import Colors, { Radii } from '@/constants/colors';
import { Fonts } from '@/constants/typography';

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

      {/* Floating Header Overlay */}
      <View style={[styles.floatingHeader, { top: Math.max(insets.top, 16) + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.partnerHeaderTitleBox}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>AgroPartners Stream</Text>
            <View style={styles.mutualPill}>
              <Text style={styles.mutualPillText}>🤝 Mutual Only</Text>
            </View>
          </View>
          <Text style={styles.headerSub}>
            Direct harvest stories from {agroPartners.length} connected partners
          </Text>
        </View>

        <TouchableOpacity
          style={styles.inboxShortcut}
          onPress={() => router.push('/(tabs)/inbox')}
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
    left: 12,
    right: 12,
    zIndex: 99,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(23, 58, 32, 0.82)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerHeaderTitleBox: {
    flex: 1,
    marginHorizontal: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontFamily: Fonts.displayItalic,
    fontSize: 16,
    color: Colors.white,
  },
  mutualPill: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radii.pill,
  },
  mutualPillText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    color: Colors.espresso,
  },
  headerSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.parchment,
    opacity: 0.85,
  },
  inboxShortcut: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
