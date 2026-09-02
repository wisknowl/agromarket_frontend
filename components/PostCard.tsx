import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Heart, MessageCircle, Share2 } from 'lucide-react-native';
import { Post } from '@/types';
import { useFavoritesStore } from '@/store/favoritesStore';
import Colors from '@/constants/colors';
import { useRouter } from 'expo-router';

interface PostCardProps {
  post: Post;
  fullScreen?: boolean;
}

export default function PostCard({ post, fullScreen = false }: PostCardProps) {
  const { addPost, removePost, isPostFavorite } = useFavoritesStore();
  const isFavorite = isPostFavorite(post.id);
  const router = useRouter();

  const toggleLike = () => {
    if (isFavorite) {
      removePost(post.id);
    } else {
      addPost(post.id);
    }
  };

  const handleComment = () => {
    // Handle comment action
  };

  const handleShare = () => {
    // Handle share action
  };

  const goToFarmerProfile = () => {
    router.push(`/farmer/${post.farmerId}`);
  };

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <Image source={{ uri: post.media }} style={[styles.media, fullScreen && styles.fullScreenMedia]} />

      {/* Floating actions and avatar */}
      <View style={styles.floatingActionsContainer}>
        <Pressable onPress={goToFarmerProfile}>
          <Image source={{ uri: post.farmerAvatar }} style={styles.avatar} />
        </Pressable>
        <Pressable style={styles.actionButton} onPress={toggleLike}>
          <Heart 
            size={28} 
            color={isFavorite ? Colors.error : Colors.text.secondary} 
            fill={isFavorite ? Colors.error : 'none'} 
          />
          <Text style={styles.actionText}>{post.likes}</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={handleComment}>
          <MessageCircle size={28} color={Colors.text.secondary} />
          <Text style={styles.actionText}>{post.comments}</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={handleShare}>
          <Share2 size={28} color={Colors.text.secondary} />
        </Pressable>
      </View>

      {/* Floating description */}
      <View style={styles.floatingDescription}>
        <Text style={styles.farmerName}>{post.farmerName}</Text>
        <Text style={styles.caption}>{post.content}</Text>
        <Text style={styles.timestamp}>
          {new Date(post.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  fullScreen: {
    borderRadius: 0,
    marginBottom: 0,
  },
  media: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  fullScreenMedia: {
    height: '100%',
  },
   floatingActionsContainer: {
    position: 'absolute',
    right: 16,
    bottom: 32, // changed from top: '30%' to bottom: 32
    alignItems: 'center',
    zIndex: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#fff',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 24,
  },
  actionText: {
    marginTop: 4,
    fontSize: 14,
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontWeight: 'bold',
  },
  floatingDescription: {
    position: 'absolute',
    left: 16,
    bottom: 32,
    zIndex: 2,
    maxWidth: '70%',
  },
  farmerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 4,
  },
  caption: {
    fontSize: 15,
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#eee',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});