import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Heart, MessageCircle, Share2, MapPin } from 'lucide-react-native';
import { Post } from '@/types';
import { useFavoritesStore } from '@/store/favoritesStore';
import Colors, { Radii } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
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
    // Navigate or trigger comment
    router.push(`/chat/${post.farmerId}`);
  };

  const handleShare = () => {
    // Share action
  };

  const goToFarmerProfile = () => {
    router.push(`/farmer/${post.farmerId}`);
  };

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <Image
        source={{ uri: post.media }}
        style={[styles.media, fullScreen && styles.fullScreenMedia]}
      />

      {/* Dark gradient base overlay for high outdoor contrast */}
      <View style={styles.vignetteOverlay} />

      {/* Floating actions and avatar */}
      <View style={styles.floatingActionsContainer}>
        <Pressable onPress={goToFarmerProfile} style={styles.avatarWrapper}>
          <Image source={{ uri: post.farmerAvatar }} style={styles.avatar} />
          <View style={styles.avatarBadgeDot} />
        </Pressable>

        <Pressable style={styles.actionButton} onPress={toggleLike}>
          <Heart
            size={26}
            color={isFavorite ? Colors.clay : Colors.white}
            fill={isFavorite ? Colors.clay : 'none'}
            strokeWidth={2.2}
          />
          <Text style={styles.actionText}>{post.likes}</Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={handleComment}>
          <MessageCircle size={26} color={Colors.white} strokeWidth={2.2} />
          <Text style={styles.actionText}>{post.comments}</Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={handleShare}>
          <Share2 size={26} color={Colors.white} strokeWidth={2.2} />
        </Pressable>
      </View>

      {/* Floating description & Farmer metadata */}
      <View style={styles.floatingDescription}>
        <Pressable onPress={goToFarmerProfile} style={styles.farmerNameRow}>
          <Text style={styles.farmerName}>{post.farmerName}</Text>
        </Pressable>

        <Text style={styles.caption} numberOfLines={3}>
          {post.content}
        </Text>

        <Text style={styles.timestamp}>
          📅 {new Date(post.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canopyDeep,
    borderRadius: Radii.card,
    overflow: 'hidden',
    marginBottom: 16,
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
  vignetteOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 240,
    backgroundColor: 'rgba(14, 37, 21, 0.65)',
  },
  floatingActionsContainer: {
    position: 'absolute',
    right: 16,
    bottom: 32,
    alignItems: 'center',
    zIndex: 2,
    gap: 18,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 6,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  avatarBadgeDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.cultivated,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  actionButton: {
    alignItems: 'center',
    gap: 3,
  },
  actionText: {
    fontFamily: Fonts.monoBold,
    fontSize: 12,
    color: Colors.white,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  floatingDescription: {
    position: 'absolute',
    left: 16,
    bottom: 32,
    zIndex: 2,
    maxWidth: '74%',
  },
  farmerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  farmerName: {
    fontFamily: Fonts.display,
    fontSize: 17,
    color: Colors.white,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  caption: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.parchment,
    lineHeight: 20,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  timestamp: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: 'rgba(246, 238, 221, 0.75)',
  },
});