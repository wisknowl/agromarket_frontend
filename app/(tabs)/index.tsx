import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import TabHeader from '@/components/TabHeader';
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

  const filteredYields = activeTab === 'Favorites' 
    ? agroYields.filter(item => favoriteYields.includes(item.id))
    : agroYields;

  const filteredPosts = activeTab === 'Favorites'
    ? posts.filter(post => favoritePosts.includes(post.id))
    : posts;

  // Calculate available height for the card
  const windowHeight = Dimensions.get('window').height;
  const headerHeight = 56; // Approximate TabHeader height (adjust as needed)
  const tabBarHeight = 64; // Approximate bottom tab bar height (adjust as needed)
  const cardHeight = windowHeight - headerHeight - tabBarHeight;

  return (
    <View style={styles.container}>
      <TabHeader 
        tabs={tabs} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      {activeTab === 'AgroYields' && (
        <FlatList
          data={filteredYields}
          renderItem={renderYieldItem}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeTab === 'AgroFeed' && (
        <FlatList
          data={filteredPosts}
          renderItem={({ item }) => (
            <View style={{ height: cardHeight }}>
              <PostCard post={item} fullScreen />
            </View>
          )}
          keyExtractor={item => item.id}
          pagingEnabled
          snapToInterval={cardHeight}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 0 }}
        />
      )}

      {activeTab === 'Favorites' && (
        <ScrollView contentContainerStyle={styles.listContent}>
          {filteredPosts.length > 0 && (
            <FlatList
              data={filteredPosts}
              renderItem={renderPostItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          )}
          {filteredYields.length > 0 && (
            <FlatList
              data={filteredYields}
              renderItem={renderYieldItem}
              keyExtractor={item => item.id}
              numColumns={2}
              columnWrapperStyle={styles.columnWrapper}
              scrollEnabled={false}
            />
          )}
        </ScrollView>
      )}
      {/* Only show Basket on AgroYields and Favorites tabs */}
      {(activeTab === 'AgroYields' || activeTab === 'Favorites') && <Basket />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: 0,
  },
  columnWrapper: {
    justifyContent: 'space-around',
  },
});