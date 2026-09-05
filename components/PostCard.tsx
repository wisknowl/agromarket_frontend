import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Heart, MessageCircle, Share2, MapPin } from 'lucide-react-native';
import { Post, AgroYield } from '@/types';
import { useFavoritesStore } from '@/store/favoritesStore';
import Colors, { Radii } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { useRouter } from 'expo-router';
import { fetchYieldByIdApi } from '@/components/api/yields';
import ShoppableYieldCard from '../modules/feed/components/ShoppableYieldCard';

interface PostCardProps {
  post: Post;
  fullScreen?: boolean;
}

export default function PostCard({ post, fullScreen = false }: PostCardProps) {
  const { addPost, removePost, isPostFavorite } = useFavoritesStore();
  const isFavorite = isPostFavorite(post.id);
  const router = useRouter();
  const [linkedYield, setLinkedYield] = useState<AgroYield | null>(null);

  useEffect(() => {
    if (post.linkedYieldId) {
      fetchYieldByIdApi(post.linkedYieldId)
        .then((data) => {
          if (data) setLinkedYield(data);
        })
        .catch(() => {});
    }
  }, [post.linkedYieldId]);

  const toggleLike = () => {
    if (isFavorite) {
      removePost(post.id);
    } else {
      addPost(post.id);
    }
  };

  const handleComment = () => {
    if (post.userId) {
      router.push(`/chat/${post.userId}`);
    } else if (post.farmerId) {
      router.push(`/chat/${post.farmerId}`);
    }
  };

  const handleShare = () => {
    // Share action
  };

  const goToFarmerOrFarm = () => {
    if (post.farmId) {
      router.push(`/farmer/${post.farmId}`);
    } else if (post.farmerId) {
      router.push(`/farmer/${post.farmerId}`);
    }
  };

  const mediaSource =
    post.mediaUrl ||
    post.media ||
    'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800';

  const avatarSource =
    post.farmerAvatar ||
    post.farm?.coverPhoto ||
    post.user?.avatarUrl ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500';

  const displayName =
    post.farmerName ||
    post.farm?.name ||
    post.user?.name ||
    'Agro Producer';

  const likesDisplay = post.likesCount ?? post.likes ?? 0;
  const commentsDisplay =
    typeof post.comments === 'number'
      ? post.comments
      : Array.isArray(post.comments)
      ? post.comments.length
      : post.commentsCount ?? 0;

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <Image
        source={{ uri: mediaSource }}
        style={[styles.media, fullScreen && styles.fullScreenMedia]}
      />

      {/* Dark gradient base overlay for high outdoor contrast */}
      <View style={styles.vignetteOverlay} />

      {/* Floating actions and avatar */}
      <View style={styles.floatingActionsContainer}>
        <Pressable onPress={goToFarmerOrFarm} style={styles.avatarWrapper}>
          <Image source={{ uri: avatarSource }} style={styles.avatar} />
          <View style={styles.avatarBadgeDot} />
        </Pressable>

        <Pressable style={styles.actionButton} onPress={toggleLike}>
          <Heart
            size={26}
            color={isFavorite ? Colors.clay : Colors.white}
            fill={isFavorite ? Colors.clay : 'none'}
            strokeWidth={2.2}
          />
          <Text style={styles.actionText}>{likesDisplay}</Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={handleComment}>
          <MessageCircle size={26} color={Colors.white} strokeWidth={2.2} />
          <Text style={styles.actionText}>{commentsDisplay}</Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={handleShare}>
          <Share2 size={26} color={Colors.white} strokeWidth={2.2} />
        </Pressable>
      </View>

      {/* Floating description, Farmer metadata & Shoppable Harvest Tag */}
      <View style={styles.floatingDescription}>
        {linkedYield && (
          <View style={{ marginBottom: 10 }}>
            <ShoppableYieldCard
              yieldItem={linkedYield}
              onPressItem={() => router.push(`/yield/${linkedYield.id}`)}
            />
          </View>
        )}

        <Pressable onPress={goToFarmerOrFarm} style={styles.farmerNameRow}>
          <Text style={styles.farmerName}>{displayName}</Text>
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