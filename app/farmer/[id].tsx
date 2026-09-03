import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Pressable, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Heart, MessageCircle, Share2 } from 'lucide-react-native';
import { farmers, agroYields, posts } from '@/mocks/data';
import { AgroYield } from '@/types';
import YieldCard from '@/components/YieldCard';
import PostCard from '@/components/PostCard';
import HomeTabBar from '@/components/HomeTabBar';
import Colors from '@/constants/colors';
import Basket from '@/components/basket';

export default function FarmerProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Products');
  const [isFollowing, setIsFollowing] = useState(false);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  
  const farmer = farmers.find(f => f.id === id);
  const farmerYields = agroYields.filter(item => item.farmerId === id);
  const farmerPosts = posts.filter(post => post.farmerId === id);
  
  const tabs = ['Products', 'Posts', 'About'];

  if (!farmer) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Farmer not found</Text>
      </View>
    );
  }

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  const handleContact = () => {
    router.push(`/chat/${farmer.id}`);
  };

  const handleShare = () => {
    // Handle share action
  };

  const renderYieldItem = ({ item }: { item: AgroYield }) => (
    <YieldCard
      item={item}
      popoverVisible={openPopoverId === item.id}
      onOpenPopover={() => setOpenPopoverId(item.id)}
      onClosePopover={() => setOpenPopoverId(null)}
    />
  );

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Image source={{ uri: farmer.profilePhoto }} style={styles.coverImage} />
          <View style={styles.profileContainer}>
            <Image source={{ uri: farmer.profilePhoto }} style={styles.profileImage} />
            <View style={styles.profileInfo}>
              <Text style={styles.farmName}>{farmer.farmName}</Text>
              <Text style={styles.location}>{farmer.location}</Text>
              <View style={styles.statsContainer}>
                <Text style={styles.rating}>★ {farmer.rating.toFixed(1)}</Text>
                <Text style={styles.followers}>{farmer.followers} followers</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.actions}>
            <Pressable 
              style={[styles.followButton, isFollowing && styles.followingButton]} 
              onPress={handleFollow}
            >
              <Text 
                style={[styles.followButtonText, isFollowing && styles.followingButtonText]}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </Pressable>
            
            <Pressable style={styles.iconButton} onPress={handleContact}>
              <MessageCircle size={24} color={Colors.primary} />
            </Pressable>
            
            <Pressable style={styles.iconButton} onPress={handleShare}>
              <Share2 size={24} color={Colors.text.secondary} />
            </Pressable>
          </View>
        </View>
        
        <HomeTabBar 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
        
        {activeTab === 'Products' && (
          <View style={styles.tabContent}>
            {farmerYields.length === 0 ? (
              <Text style={styles.emptyText}>No products available</Text>
            ) : (
              <FlatList
                data={farmerYields}
                renderItem={renderYieldItem}
                keyExtractor={item => item.id}
                numColumns={2}
                columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 8 }}
                contentContainerStyle={{ paddingBottom: 16 }}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        )}
        
        {activeTab === 'Posts' && (
          <View style={styles.tabContent}>
            {farmerPosts.length === 0 ? (
              <Text style={styles.emptyText}>No posts available</Text>
            ) : (
              farmerPosts.map(post => (
                <PostCard key={post.id} post={post} />
              ))
            )}
          </View>
        )}
        
        {activeTab === 'About' && (
          <View style={styles.tabContent}>
            <Text style={styles.aboutTitle}>About {farmer.farmName}</Text>
            <Text style={styles.description}>{farmer.description}</Text>
            
            <Text style={styles.aboutTitle}>Location</Text>
            <Text style={styles.description}>{farmer.location}</Text>
          </View>
        )}
      </ScrollView>
      
      <Basket />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 16,
  },
  coverImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  profileContainer: {
    flexDirection: 'row',
    padding: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Colors.background,
    marginTop: -40,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  farmName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary,
    marginRight: 16,
  },
  followers: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  followButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 24,
    marginRight: 16,
  },
  followButtonText: {
    color: Colors.text.light,
    fontWeight: '600',
    fontSize: 14,
  },
  followingButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  followingButtonText: {
    color: Colors.primary,
  },
  iconButton: {
    padding: 8,
    marginRight: 16,
  },
  tabContent: {
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 24,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
    marginTop: 16,
  },
  description: {
    fontSize: 16,
    color: Colors.text.primary,
    lineHeight: 24,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
});