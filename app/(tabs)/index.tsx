import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ScrollView,
  LayoutChangeEvent,
  Platform,
  ActivityIndicator,
  Text,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import HomeTabBar from '@/components/HomeTabBar';
import YieldCard from '@/components/YieldCard';
import PostCard from '@/components/PostCard';
import { AgroYield, Post } from '@/types';
import { useFavoritesStore } from '@/store/favoritesStore';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import Basket from '@/components/basket';
import { useAuthStore } from '@/store/authStore';
import { fetchFeedPostsApi } from '@/components/api/posts';
import { fetchYieldsApi } from '@/components/api/yields';
import { Sprout, Plus, Sparkles, Handshake, MapPin } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isScreenFocused = useIsFocused();
  const [activeTab, setActiveTab] = useState('AgroFeed');
  const [feedMode, setFeedMode] = useState<'all' | 'partner' | 'nearby'>('all');
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [feedHeight, setFeedHeight] = useState(0);
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [yieldsList, setYieldsList] = useState<AgroYield[]>([]);
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

  const loadFeedAndYields = async () => {
    try {
      setLoadingFeed(true);
      const [posts, yields] = await Promise.all([
        fetchFeedPostsApi(),
        fetchYieldsApi(),
      ]);
      if (posts) setFeedPosts(posts);
      if (yields) setYieldsList(yields);
    } catch (err) {
      console.warn('Could not fetch feed data from backend:', err);
    } finally {
      setLoadingFeed(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFeedAndYields();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFeedAndYields();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadFeedAndYields();
  };

  const { yields: favoriteYields, posts: favoritePosts } = useFavoritesStore();
  const tabs = ['AgroFeed', 'AgroYields', 'Favorites'];

  const renderYieldItem = ({ item }: { item: AgroYield }) => (
    <YieldCard
      item={item}
      popoverVisible={openPopoverId === item.id}
      onOpenPopover={() => setOpenPopoverId(item.id)}
      onClosePopover={() => setOpenPopoverId(null)}
    />
  );

  const renderPostItem = ({ item }: { item: Post }) => (
    <PostCard post={item} />
  );

  const filteredYields =
    activeTab === 'Favorites'
      ? yieldsList.filter((item) => favoriteYields.includes(item.id))
      : yieldsList;

  const filteredPosts =
    activeTab === 'Favorites'
      ? feedPosts.filter((post) => favoritePosts.includes(post.id))
      : feedMode === 'partner'
      ? feedPosts.filter((p) => Boolean((p as any).rankingMetadata?.isPartnerBoosted || (p as any).isPartner || (p as any).farmerCreditTier === 'GOLD'))
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
        onTabChange={setActiveTab}
      />

      {activeTab === 'AgroYields' && (
        <FlatList
          data={filteredYields}
          renderItem={renderYieldItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeTab === 'AgroFeed' && (
        <View style={{ flex: 1 }} onLayout={onFeedLayout}>
          {loadingFeed && feedPosts.length === 0 ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={Colors.cultivated} />
              <Text style={styles.loadingText}>Loading Live Harvest Stories...</Text>
            </View>
          ) : feedPosts.length === 0 ? (
            <View style={styles.emptyContainer}>
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
            </View>
          ) : (
            feedHeight > 0 && (
              <View style={{ flex: 1 }}>
                {/* Engine 2 Algorithmic Ranking Filter Switcher */}
                <View style={styles.floatingModeContainer}>
                  <TouchableOpacity
                    style={[styles.modePill, feedMode === 'all' && styles.modePillActive]}
                    onPress={() => setFeedMode('all')}
                    activeOpacity={0.8}
                  >
                    <Sparkles size={11} color={feedMode === 'all' ? Colors.gold : Colors.white} />
                    <Text style={[styles.modePillText, feedMode === 'all' && styles.modePillTextActive]}>
                      Recommended (Engine 2)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modePill, feedMode === 'partner' && styles.modePillActive]}
                    onPress={() => setFeedMode('partner')}
                    activeOpacity={0.8}
                  >
                    <Handshake size={11} color={feedMode === 'partner' ? Colors.gold : Colors.white} />
                    <Text style={[styles.modePillText, feedMode === 'partner' && styles.modePillTextActive]}>
                      AgroPartners (+2.5x)
                    </Text>
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={filteredPosts}
                  renderItem={({ item, index }) => {
                  const isItemActive = isScreenFocused && activeTab === 'AgroFeed' && index === activePostIndex;
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
    )}

      {activeTab === 'Favorites' && (
        <ScrollView contentContainerStyle={styles.listContent}>
          {filteredPosts.length > 0 && (
            <FlatList
              data={filteredPosts}
              renderItem={renderPostItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
          {filteredYields.length > 0 && (
            <FlatList
              data={filteredYields}
              renderItem={renderYieldItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.columnWrapper}
              scrollEnabled={false}
            />
          )}
        </ScrollView>
      )}

      {(activeTab === 'AgroYields' || activeTab === 'Favorites') && <Basket />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  listContent: {
    padding: 12,
    paddingBottom: 80,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
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
  floatingModeContainer: {
    position: 'absolute',
    top: 10,
    left: 12,
    zIndex: 10,
    flexDirection: 'row',
    gap: 8,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modePillActive: {
    backgroundColor: Colors.canopy,
    borderColor: Colors.gold,
  },
  modePillText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10.5,
    color: Colors.white,
  },
  modePillTextActive: {
    fontFamily: Fonts.bodyBold,
    color: Colors.gold,
  },
});