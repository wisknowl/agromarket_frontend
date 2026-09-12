import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MessageCircle, Sprout } from 'lucide-react-native';
import { fetchFeedPostsApi } from '@/components/api/posts';
import { Post } from '@/types';
import PostCard from '@/components/PostCard';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/typography';

const { height: screenHeight } = Dimensions.get('window');

export default function AgroPartnersFeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activePostIndex, setActivePostIndex] = useState(0);
  const [containerHeight, setContainerHeight] = useState(screenHeight);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      const data = await fetchFeedPostsApi();
      setPosts(data || []);
    } catch (e) {
      console.warn('Failed to fetch partner feed:', e);
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

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

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.cultivated} />
          <Text style={styles.loadingText}>Loading AgroPartners stories...</Text>
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Sprout size={48} color={Colors.cultivated} />
          <Text style={styles.emptyTitle}>No Stories Yet</Text>
          <Text style={styles.emptySubtitle}>
            When your connected AgroPartners post updates, crop harvesting reels, or farm stories, they will appear here.
          </Text>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={onRefresh}
            activeOpacity={0.8}
          >
            <Text style={styles.refreshBtnText}>Check Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Vertical Full-Screen Swiper */
        <FlatList
          data={posts}
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
          bounces={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.white}
              colors={[Colors.cultivated]}
            />
          }
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          windowSize={3}
          maxToRenderPerBatch={2}
          initialNumToRender={2}
          removeClippedSubviews={Platform.OS === 'android'}
        />
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: Fonts.displayItalic,
    fontSize: 20,
    color: Colors.white,
    marginTop: 8,
  },
  emptySubtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
    lineHeight: 20,
  },
  refreshBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: Colors.cultivated,
  },
  refreshBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.white,
  },
});
