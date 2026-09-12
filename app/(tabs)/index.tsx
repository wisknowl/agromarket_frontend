import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  LayoutChangeEvent,
  Platform,
  ActivityIndicator,
  Text,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import HomeTabBar from '@/components/HomeTabBar';
import PostCard from '@/components/PostCard';
import { Post } from '@/types';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { fetchFeedPostsApi } from '@/components/api/posts';
import { Sprout, Plus, Star, Compass } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isScreenFocused = useIsFocused();
  const [activeTab, setActiveTab] = useState<'AgroFeed' | 'Patronized ⭐'>('AgroFeed');
  const [feedHeight, setFeedHeight] = useState(0);
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activePostIndex, setActivePostIndex] = useState<number>(0);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
    waitForInteraction: false,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
    if (viewableItems && viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActivePostIndex(viewableItems[0].index);
    }
  }).current;

  const userHasFarm = Boolean(user?.farms && user.farms.length > 0);

  const loadFeedPosts = async () => {
    try {
      setLoadingFeed(true);
      const posts = await fetchFeedPostsApi();
      if (posts) setFeedPosts(posts);
    } catch (err) {
      console.warn('Could not fetch feed data from backend:', err);
    } finally {
      setLoadingFeed(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFeedPosts();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFeedPosts();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadFeedPosts();
  };

  const tabs = ['AgroFeed', 'Patronized ⭐'];

  // Filter posts: if on "Patronized ⭐", show posts from farms the user patronizes or VIP tier farms
  const filteredPosts = activeTab === 'Patronized ⭐'
    ? feedPosts.filter((p) => {
        const isPatronized = Boolean(
          (p as any).isPatron ||
          (p as any).rankingMetadata?.isPatronStory ||
          (p as any).farmerCreditTier === 'GOLD' ||
          (p as any).isPartner
        );
        return isPatronized;
      })
    : feedPosts;

  const onFeedLayout = (e: LayoutChangeEvent) => {
    const { height } = e.nativeEvent.layout;
    if (height > 0 && height !== feedHeight) {
      setFeedHeight(height);
    }
  };

  return (
    <View style={styles.container}>
      <HomeTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(t) => setActiveTab(t as any)}
        rightAction={
          userHasFarm ? (
            <TouchableOpacity
              style={styles.headerStoryBtn}
              onPress={() => router.push('/feed/create')}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Create Harvest Story"
            >
              <Plus size={13} color={Colors.white} strokeWidth={3} />
              <Text style={styles.headerStoryBtnText}>Story</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <View style={{ flex: 1 }} onLayout={onFeedLayout}>
        {loadingFeed && feedPosts.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.cultivated} />
            <Text style={styles.loadingText}>Loading Live Harvest Stories...</Text>
          </View>
        ) : filteredPosts.length === 0 ? (
          <View style={styles.emptyContainer}>
            {activeTab === 'Patronized ⭐' ? (
              <>
                <Star size={52} color={Colors.gold} fill={Colors.gold} />
                <Text style={styles.emptyTitle}>No Patronized Stories Yet</Text>
                <Text style={styles.emptySub}>
                  Support your favourite farms with a $2/mo AgroPatron pass to unlock exclusive crop stories, direct harvest discounts, and private producer updates here!
                </Text>
                <TouchableOpacity
                  style={[styles.createStoryButton, { backgroundColor: Colors.canopy, borderWidth: 1, borderColor: Colors.gold }]}
                  onPress={() => router.push('/(tabs)/agro-yields')}
                  activeOpacity={0.85}
                >
                  <Compass size={18} color={Colors.gold} style={{ marginRight: 6 }} />
                  <Text style={[styles.createStoryButtonText, { color: Colors.gold }]}>Explore AgroMarket</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Sprout size={56} color={Colors.cultivated} />
                <Text style={styles.emptyTitle}>No Harvest Stories Yet</Text>
                <Text style={styles.emptySub}>
                  Be the first farmer to share a live crop update, produce video, or wholesale deal!
                </Text>
                {userHasFarm && (
                  <TouchableOpacity
                    style={styles.createStoryButton}
                    onPress={() => router.push('/feed/create')}
                    activeOpacity={0.8}
                  >
                    <Plus size={18} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.createStoryButtonText}>Create Harvest Story</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        ) : (
          feedHeight > 0 && (
            <View style={{ flex: 1 }}>
              <FlatList
                data={filteredPosts}
                renderItem={({ item, index }) => {
                  const isItemActive = isScreenFocused && index === activePostIndex;
                  return (
                    <View style={{ height: feedHeight }}>
                      <PostCard post={item} fullScreen isActive={isItemActive} />
                    </View>
                  );
                }}
                keyExtractor={(item) => item.id}
                pagingEnabled={true}
                snapToInterval={feedHeight}
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
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.cultivated} />
                }
                contentContainerStyle={{ padding: 0 }}
              />
            </View>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.espresso,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.espresso,
  },
  loadingText: {
    color: Colors.parchment,
    fontSize: 14,
    fontFamily: Fonts.bodyMedium,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    backgroundColor: Colors.espresso,
  },
  emptyTitle: {
    color: Colors.white,
    fontSize: 20,
    fontFamily: Fonts.displayBold,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySub: {
    color: Colors.parchment,
    fontSize: 14,
    fontFamily: Fonts.body,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  createStoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cultivated,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
  },
  createStoryButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: Fonts.bodySemiBold,
  },
  headerStoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.cultivated,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: Colors.cultivated,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  headerStoryBtnText: {
    color: Colors.white,
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
  },
});