import React, { useState, useEffect, useCallback } from 'react';
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
import { agroYields } from '@/mocks/data';
import { AgroYield, Post } from '@/types';
import { useFavoritesStore } from '@/store/favoritesStore';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { useFocusEffect } from '@react-navigation/native';
import Basket from '@/components/basket';
import { useAuthStore } from '@/store/authStore';
import { fetchFeedPostsApi } from '@/components/api/posts';
import { Sprout, Plus } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('AgroFeed');
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [feedHeight, setFeedHeight] = useState(0);
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const userHasFarm = Boolean(user?.farms && user.farms.length > 0);

  const loadPosts = async () => {
    try {
      setLoadingFeed(true);
      const posts = await fetchFeedPostsApi();
      if (posts) {
        setFeedPosts(posts);
      }
    } catch (err) {
      console.warn('Could not fetch feed posts from backend:', err);
    } finally {
      setLoadingFeed(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadPosts();
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
      ? agroYields.filter((item) => favoriteYields.includes(item.id))
      : agroYields;

  const filteredPosts =
    activeTab === 'Favorites'
      ? feedPosts.filter((post) => favoritePosts.includes(post.id))
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
              <FlatList
                data={filteredPosts}
                renderItem={({ item }) => (
                  <View style={{ height: feedHeight }}>
                    <PostCard post={item} fullScreen />
                  </View>
                )}
                keyExtractor={(item) => item.id}
                pagingEnabled={Platform.OS === 'android'}
                snapToInterval={feedHeight}
                snapToAlignment="start"
                decelerationRate="fast"
                disableIntervalMomentum={true}
                showsVerticalScrollIndicator={false}
                bounces={false}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.cultivated} />
                }
                contentContainerStyle={{ padding: 0 }}
              />
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
});