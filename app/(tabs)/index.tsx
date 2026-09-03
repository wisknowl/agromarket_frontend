import React, { useState } from 'react';
import { View, StyleSheet, FlatList, ScrollView, LayoutChangeEvent } from 'react-native';
import { useRouter } from 'expo-router';
import HomeTabBar from '@/components/HomeTabBar';
import YieldCard from '@/components/YieldCard';
import PostCard from '@/components/PostCard';
import { agroYields, posts } from '@/mocks/data';
import { AgroYield, Post } from '@/types';
import { useFavoritesStore } from '@/store/favoritesStore';
import Colors from '@/constants/colors';
import { useFocusEffect } from '@react-navigation/native';
import Basket from '@/components/basket';

export default function HomeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('AgroFeed');
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [feedHeight, setFeedHeight] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      setActiveTab('AgroFeed');
    }, [])
  );
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
      ? posts.filter((post) => favoritePosts.includes(post.id))
      : posts;

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
          {feedHeight > 0 && (
            <FlatList
              data={filteredPosts}
              renderItem={({ item }) => (
                <View style={{ height: feedHeight }}>
                  <PostCard post={item} fullScreen />
                </View>
              )}
              keyExtractor={(item) => item.id}
              pagingEnabled
              snapToInterval={feedHeight}
              decelerationRate="fast"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 0 }}
            />
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
});