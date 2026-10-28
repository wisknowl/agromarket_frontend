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
  Modal,
  Pressable,
} from 'react-native';
import { useRouter, useFocusEffect, useIsFocused } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeTabBar from '@/components/HomeTabBar';
import PostCard from '@/components/PostCard';
import { Post } from '@/types';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { useAuthStore } from '@/store/authStore';
import { fetchFeedPostsApi } from '@/components/api/posts';
import { Sprout, Plus, Star, Compass, Warehouse } from 'lucide-react-native';
import Basket from '@/components/basket';
import AgromPreloader from '@/components/AgromPreloader';
import { waitRemainingMs } from '@/utils/minDuration';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const isScreenFocused = useIsFocused();
  const [activeTab, setActiveTab] = useState<'AgroFeed' | 'Patronized ⭐'>('AgroFeed');
  const [feedHeight, setFeedHeight] = useState(0);
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activePostIndex, setActivePostIndex] = useState<number>(0);
  const [showFarmRequiredModal, setShowFarmRequiredModal] = useState(false);

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
    const startTime = Date.now();
    try {
      setLoadingFeed(true);
      const posts = await fetchFeedPostsApi();
      if (posts) setFeedPosts(posts);
    } catch (err) {
      console.warn('Could not fetch feed data from backend:', err);
    } finally {
      await waitRemainingMs(startTime, 0);
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
          <TouchableOpacity
            style={styles.headerStoryBtn}
            onPress={() => {
              if (userHasFarm) {
                router.push('/feed/create');
              } else {
                setShowFarmRequiredModal(true);
              }
            }}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Create Harvest Story"
          >
            <Plus size={13} color={Colors.white} strokeWidth={3} />
            <Text style={styles.headerStoryBtnText}>Story</Text>
          </TouchableOpacity>
        }
      />

      <View style={{ flex: 1 }} onLayout={onFeedLayout}>
        {loadingFeed && feedPosts.length === 0 ? (
          <View style={styles.centerContainer}>
            <AgromPreloader
              size="lg"
              theme="dark"
            />
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
      {/* Ephemeral AgroFeed Flying Basket */}
      <Basket isAgroFeed={true} isInTabs={true} />

      {/* Register Farm Required Bottom Sheet Modal */}
      <Modal
        visible={showFarmRequiredModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFarmRequiredModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowFarmRequiredModal(false)}
        >
          <Pressable
            style={[styles.bottomSheetCard, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.sheetIconCircle}>
              <Warehouse size={32} color={Colors.cultivated} strokeWidth={2.2} />
            </View>

            <Text style={styles.sheetTitle}>Register Your Farm Page to Post Stories</Text>
            <Text style={styles.sheetSubtitle}>
              Harvest stories connect buyers directly to your farm produce with 1-tap checkout. Set up your farm profile in 60 seconds to start publishing videos and receiving direct orders.
            </Text>

            <View style={styles.sheetActionButtons}>
              <TouchableOpacity
                style={styles.sheetPrimaryBtn}
                onPress={() => {
                  setShowFarmRequiredModal(false);
                  router.push('/farmer/new');
                }}
                activeOpacity={0.85}
              >
                <Plus size={16} color={Colors.white} strokeWidth={2.5} />
                <Text style={styles.sheetPrimaryBtnText}>+ Register My Farm</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetSecondaryBtn}
                onPress={() => setShowFarmRequiredModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.sheetSecondaryBtnText}>Not Now</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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

  // Bottom Sheet Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  bottomSheetCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 12,
    alignItems: 'center',
    ...Shadows.card,
  },
  sheetHandle: {
    width: 40,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
    marginBottom: 18,
  },
  sheetIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF8F1',
    borderWidth: 1.5,
    borderColor: '#CCEBD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
    color: Colors.espresso,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  sheetSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 13.5,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 22,
    paddingHorizontal: 14,
  },
  sheetActionButtons: {
    width: '100%',
    gap: 10,
  },
  sheetPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.cultivated,
    paddingVertical: 13,
    borderRadius: Radii.pill,
    width: '100%',
  },
  sheetPrimaryBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14.5,
    color: Colors.white,
  },
  sheetSecondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radii.pill,
    width: '100%',
  },
  sheetSecondaryBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13.5,
    color: Colors.text.secondary,
  },
});